import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  provider: { type: String, required: true, maxlength: 40 },
  providerTrackId: { type: String, required: true, maxlength: 100 },
  title: { type: String, required: true, maxlength: 200 },
  artistName: { type: String, required: true, maxlength: 160 },
  albumName: { type: String, default: '', maxlength: 200 },
  artworkUrl: { type: String, default: null },
  durationSeconds: { type: Number, default: null },
  genres: [String], tags: [String],
  musicFeatures: { energy: { type: Number, min: 0, max: 1, default: null }, vocal: { type: String, enum: ['vocal', 'instrumental', null], default: null } },
  licenseUrl: { type: String, default: null },
  sourceUrl: { type: String, required: true },
  isPlayable: { type: Boolean, default: false },
  verifiedAt: { type: Date, required: true }
}, { versionKey: false, autoCreate: false, autoIndex: false });

// Stream URLs and audio bytes are deliberately absent from the schema.
export const Track = mongoose.model('Track', trackSchema);

export function serializeTrack(track) {
  return {
    id: track._id.toString(), provider: track.provider, providerTrackId: track.providerTrackId,
    title: track.title, artistName: track.artistName, albumName: track.albumName,
    artworkUrl: track.artworkUrl, streamUrl: null, durationSeconds: track.durationSeconds,
    genres: track.genres, tags: track.tags, licenseUrl: track.licenseUrl,
    sourceUrl: track.sourceUrl, isPlayable: track.isPlayable,
    musicFeatures: track.musicFeatures || { energy: null, vocal: null }
  };
}

export async function cacheTrackMetadata(tracks) {
  if (!tracks.length) return;
  await Track.bulkWrite(tracks.map(track => {
    const { id, streamUrl: _streamUrl, ...metadata } = track;
    return { updateOne: { filter: { _id: id }, update: { $set: { ...metadata, verifiedAt: new Date() } }, upsert: true } };
  }));
}
