import { withImageClaims } from '../media/mediaService.js';
import { Moodspace } from '../models/Moodspace.js';
import { AppError } from '../middleware/errors.js';

export function serializeSpace(space) {
  return {
    id: space._id.toString(), title: space.title, description: space.description,
    moods: space.moods, soundTuning: space.soundTuning || {}, fragments: space.fragments || [], images: space.images || [], revision: space.revision,
    createdAt: space.createdAt, updatedAt: space.updatedAt
  };
}

export async function listSpaces(ownerId, { page, limit }) {
  const rows = await Moodspace.find({ ownerId }).sort({ updatedAt: -1, _id: -1 })
    .skip((page - 1) * limit).limit(limit + 1).lean();
  return { data: rows.slice(0, limit).map(serializeSpace), meta: { page, hasMore: rows.length > limit } };
}

export async function getSpace(ownerId, id) {
  const space = await Moodspace.findOne({ _id: id, ownerId }).lean();
  if (!space) throw new AppError(404, 'SPACE_NOT_FOUND', 'This space could not be found.');
  return serializeSpace(space);
}

export async function createSpace(ownerId, fields) {
  return withImageClaims(ownerId, fields.images, async images => serializeSpace(await Moodspace.create({ ...fields, ...(images ? { images } : {}), ownerId })));
}

async function throwMissingOrConflict(ownerId, id) {
  const exists = await Moodspace.exists({ _id: id, ownerId });
  if (!exists) throw new AppError(404, 'SPACE_NOT_FOUND', 'This space could not be found.');
  throw new AppError(409, 'REVISION_CONFLICT', 'This space changed in another tab. Reload the saved version before trying again.');
}

export async function updateSpace(ownerId, id, { revision, ...fields }, media) {
  const before = await getSpace(ownerId, id);
  const result = await withImageClaims(ownerId, fields.images, async images => {
    const space = await Moodspace.findOneAndUpdate(
      { _id: id, ownerId, revision },
      { $set: { ...fields, ...(images ? { images } : {}) }, $inc: { revision: 1 } },
      { returnDocument: 'after', runValidators: true }
    ).lean();
    if (!space) await throwMissingOrConflict(ownerId, id);
    return serializeSpace(space);
  });
  if (fields.images && media) setImmediate(() => { void media.cleanupRemoved(ownerId, before.images, result.images).catch(() => {}); });
  return result;
}

export async function deleteSpace(ownerId, id, revision, media) {
  const space = await Moodspace.findOneAndDelete({ _id: id, ownerId, revision });
  if (!space) await throwMissingOrConflict(ownerId, id);
  if (media) setImmediate(() => { void media.cleanupRemoved(ownerId, space.images || []).catch(() => {}); });
}
