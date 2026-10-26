import { Moodspace } from '../models/Moodspace.js';
import { Track, cacheTrackMetadata, serializeTrack } from '../models/Track.js';
import { User } from '../models/User.js';
import { UserFeedback } from '../models/UserFeedback.js';
import { AppError } from '../middleware/errors.js';
import { buildCandidateQueries, buildMoodProfile } from '../recommendation/profile.js';
import { buildAffinities, rankCandidates } from '../recommendation/rank.js';
import { ALGORITHM_VERSION } from '../recommendation/vocabulary.js';

export async function ownedRecommendationSpace(userId, id) {
  const space = await Moodspace.findOne({ _id: id, ownerId: userId }).lean();
  if (!space) throw new AppError(404, 'SPACE_NOT_FOUND', 'This space could not be found.');
  return space;
}

export async function readRecommendations(userId, id) {
  const space = await ownedRecommendationSpace(userId, id);
  if (!space.recommendation) return { profile: null, tracks: [], generatedAt: null, stale: false, warnings: [] };
  const snapshot = space.recommendation;
  const ids = snapshot.tracks.map(item => item.trackId);
  const [metadata, feedback, user] = await Promise.all([
    Track.find({ _id: { $in: ids } }).lean(),
    UserFeedback.find({ userId, trackId: { $in: ids } }).lean(),
    User.findById(userId).select('preferenceRevision').lean()
  ]);
  const byId = new Map(metadata.map(track => [track._id, track]));
  const reactions = new Map(feedback.map(entry => [entry.trackId, entry.reaction]));
  const saved = new Set((space.savedTracks || []).map(item => item.trackId));
  const tracks = snapshot.tracks.filter(item => byId.has(item.trackId) && reactions.get(item.trackId) !== 'dislike')
    .map(item => ({ ...serializeTrack(byId.get(item.trackId)), score: item.score, reasons: item.reasons, evidence: item.evidence, reaction: reactions.get(item.trackId) || 'neutral', isSaved: saved.has(item.trackId) }));
  return { profile: snapshot.profile, tracks, generatedAt: snapshot.generatedAt, generation: snapshot.generation, algorithmVersion: snapshot.algorithmVersion,
    stale: snapshot.contentRevision !== space.revision || snapshot.preferenceRevision !== (user?.preferenceRevision || 0), warnings: snapshot.warnings || [] };
}

export async function generateRecommendations(userId, id, revision, music) {
  const space = await ownedRecommendationSpace(userId, id);
  if (space.revision !== revision) throw new AppError(409, 'REVISION_CONFLICT', 'Your space changed. Reload or save its current version before finding music.');
  const [recentFeedback, user] = await Promise.all([
    UserFeedback.find({ userId, reaction: { $ne: 'neutral' } }).sort({ updatedAt: -1, _id: -1 }).limit(200).lean(),
    User.findById(userId).select('preferenceRevision').lean()
  ]);
  const metadataIds = [...new Set([...(space.savedTracks || []).map(item => item.trackId), ...recentFeedback.map(item => item.trackId)])];
  const savedIds = (space.savedTracks || []).map(item => item.trackId);
  const [metadata, savedDislikes] = await Promise.all([
    Track.find({ _id: { $in: metadataIds } }).lean(),
    UserFeedback.find({ userId, trackId: { $in: savedIds }, reaction: 'dislike' }).select('trackId').lean()
  ]);
  const saved = new Set(savedIds);
  const liked = new Set(recentFeedback.filter(item => item.reaction === 'like').map(item => item.trackId));
  const negative = new Set([...recentFeedback.filter(item => item.reaction === 'dislike'), ...savedDislikes].map(item => item.trackId));
  const profile = buildMoodProfile(space, metadata.filter(track => saved.has(track._id) && !negative.has(track._id)), metadata.filter(track => liked.has(track._id)));
  const generation = space.recommendation?.generation || 0;
  const queries = buildCandidateQueries(profile, generation);
  const signal = AbortSignal.timeout(10000);
  const candidates = [];
  const warnings = [];
  let succeeded = false;
  let lastError;
  for (const query of queries) {
    try {
      const tracks = await music.getCandidates({ ...query, signal });
      succeeded = true;
      candidates.push(...tracks);
    } catch (error) {
      if (['MUSIC_NOT_CONFIGURED', 'MUSIC_CREDENTIALS_INVALID', 'MUSIC_RATE_LIMITED'].includes(error.code)) throw error;
      lastError = error;
      warnings.push('One catalog query failed; any results use the successful query only.');
    }
    if (signal.aborted) break;
  }
  if (!succeeded && lastError) throw lastError;
  const candidateIds = [...new Set(candidates.map(track => track.id))];
  // Exact dislikes remain excluded even when older than the 200-row affinity window.
  const candidateFeedback = await UserFeedback.find({ userId, trackId: { $in: candidateIds } }).lean();
  const ranked = rankCandidates(candidates, profile, {
    dislikedIds: candidateFeedback.filter(item => item.reaction === 'dislike').map(item => item.trackId),
    likedIds: candidateFeedback.filter(item => item.reaction === 'like').map(item => item.trackId),
    savedIds, previousIds: space.recommendation?.tracks.map(item => item.trackId) || [],
    affinities: buildAffinities(recentFeedback, metadata)
  });
  if (!ranked.length) warnings.push('No eligible tracks with matching catalog evidence were found. Try changing the space’s mood tags or words.');
  await cacheTrackMetadata(ranked.map(item => item.track));
  const snapshot = {
    generation: generation + 1, contentRevision: revision, preferenceRevision: user?.preferenceRevision || 0,
    algorithmVersion: ALGORITHM_VERSION, generatedAt: new Date(), profile, warnings: [...new Set(warnings)],
    tracks: ranked.map(item => ({ trackId: item.track.id, score: item.score, reasons: item.reasons, evidence: item.evidence }))
  };
  const result = await Moodspace.updateOne({ _id: id, ownerId: userId, revision,
    ...(space.recommendation ? { 'recommendation.generation': generation } : { recommendation: null })
  }, { $set: { recommendation: snapshot } });
  if (!result.modifiedCount) throw new AppError(409, 'RECOMMENDATION_CONFLICT', 'This space or its selection changed while music was loading. Try again with the current version.');
  return readRecommendations(userId, id);
}
