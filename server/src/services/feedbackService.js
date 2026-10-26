import { User } from '../models/User.js';
import { UserFeedback } from '../models/UserFeedback.js';
import { Track } from '../models/Track.js';
import { AppError } from '../middleware/errors.js';
import { ownedRecommendationSpace } from './recommendationService.js';

export async function setFeedback(userId, spaceId, provider, providerTrackId, reaction) {
  const space = await ownedRecommendationSpace(userId, spaceId);
  const trackId = `${provider}:${providerTrackId}`;
  const previous = await UserFeedback.findOne({ userId, trackId }).lean();
  const knownHere = space.recommendation?.tracks.some(item => item.trackId === trackId) || space.savedTracks?.some(item => item.trackId === trackId);
  if (!knownHere && !previous) throw new AppError(404, 'RECOMMENDATION_NOT_FOUND', 'This track is not part of your space’s music.');
  if (!await Track.exists({ _id: trackId })) throw new AppError(404, 'TRACK_UNAVAILABLE', 'This track is no longer available.');
  await UserFeedback.findOneAndUpdate({ userId, trackId }, { $set: { reaction } }, { upsert: true, runValidators: true });
  // This version invalidates snapshots; ranking is derived from distinct records,
  // never from incrementing like/dislike counters.
  await User.updateOne({ _id: userId }, { $inc: { preferenceRevision: 1 } });
  return { trackId, reaction, scope: 'Your feedback influences recommendations across your spaces.' };
}
