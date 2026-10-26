import { Moodspace } from '../models/Moodspace.js';
import { Track, serializeTrack } from '../models/Track.js';
import { AppError } from '../middleware/errors.js';

export const MAX_SAVED_TRACKS = 50;

async function ownedSpace(ownerId, id) {
  const space = await Moodspace.findOne({ _id: id, ownerId }).select('savedTracks recommendation.tracks').lean();
  if (!space) throw new AppError(404, 'SPACE_NOT_FOUND', 'This space could not be found.');
  return space;
}

export async function saveTrack(ownerId, spaceId, provider, providerTrackId, musicService) {
  const space = await ownedSpace(ownerId, spaceId);
  const trackId = `${provider}:${providerTrackId}`;
  if (space.savedTracks?.some(item => item.trackId === trackId)) return;
  if (space.savedTracks?.length >= MAX_SAVED_TRACKS) throw new AppError(409, 'SPACE_TRACK_LIMIT', `A space can hold up to ${MAX_SAVED_TRACKS} tracks. Remove one first.`);
  const cached = await Track.findById(trackId).lean();
  const freshCache = cached?.isPlayable && Date.now() - new Date(cached.verifiedAt).getTime() < 5 * 60 * 1000;
  // Fresh metadata from generation or a successful playback lookup is server
  // verified. Saving its reference need not repeat a fragile provider lookup.
  // Playback still resolves a fresh stream every time.
  const track = freshCache ? serializeTrack(cached) : await musicService.getTrack(provider, providerTrackId);
  if (!track.isPlayable) throw new AppError(410, 'STREAM_UNAVAILABLE', 'This track has no eligible stream and cannot be saved.');
  const { id, streamUrl: _streamUrl, ...metadata } = track;
  if (!freshCache) await Track.findOneAndUpdate({ _id: id }, { $set: { ...metadata, verifiedAt: new Date() } }, { upsert: true, runValidators: true });
  const result = await Moodspace.updateOne({
    _id: spaceId, ownerId, 'savedTracks.trackId': { $ne: trackId },
    $expr: { $lt: [{ $size: { $ifNull: ['$savedTracks', []] } }, MAX_SAVED_TRACKS] }
  }, { $push: { savedTracks: { trackId, savedAt: new Date() } }, $inc: { revision: 1 } });
  if (!result.modifiedCount) {
    const current = await ownedSpace(ownerId, spaceId);
    if (!current.savedTracks?.some(item => item.trackId === trackId)) throw new AppError(409, 'SPACE_TRACK_LIMIT', 'This space is full. Remove a track before saving another.');
  }
}

export async function removeTrack(ownerId, spaceId, provider, providerTrackId) {
  const trackId = `${provider}:${providerTrackId}`;
  const result = await Moodspace.updateOne({ _id: spaceId, ownerId, 'savedTracks.trackId': trackId }, {
    $pull: { savedTracks: { trackId } }, $inc: { revision: 1 }
  });
  if (!result.matchedCount) await ownedSpace(ownerId, spaceId);
}

export async function listSavedTracks(ownerId, spaceId) {
  const space = await ownedSpace(ownerId, spaceId);
  const tracks = await Track.find({ _id: { $in: (space.savedTracks || []).map(item => item.trackId) } }).lean();
  const byId = new Map(tracks.map(track => [track._id, track]));
  return (space.savedTracks || []).map(item => {
    const track = byId.get(item.trackId);
    return track ? { ...serializeTrack(track), savedAt: item.savedAt } : {
      id: item.trackId, provider: item.trackId.split(':')[0], providerTrackId: item.trackId.split(':')[1],
      title: 'Unavailable track', artistName: 'Unknown artist', streamUrl: null, isPlayable: false, savedAt: item.savedAt
    };
  });
}
