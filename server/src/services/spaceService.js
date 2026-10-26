import { Moodspace } from '../models/Moodspace.js';
import { AppError } from '../middleware/errors.js';

export function serializeSpace(space) {
  return {
    id: space._id.toString(), title: space.title, description: space.description,
    moods: space.moods, revision: space.revision,
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
  return serializeSpace(await Moodspace.create({ ...fields, ownerId }));
}

async function throwMissingOrConflict(ownerId, id) {
  const exists = await Moodspace.exists({ _id: id, ownerId });
  if (!exists) throw new AppError(404, 'SPACE_NOT_FOUND', 'This space could not be found.');
  throw new AppError(409, 'REVISION_CONFLICT', 'This space changed in another tab. Reload the saved version before trying again.');
}

export async function updateSpace(ownerId, id, { revision, ...fields }) {
  const space = await Moodspace.findOneAndUpdate(
    { _id: id, ownerId, revision },
    { $set: fields, $inc: { revision: 1 } },
    { returnDocument: 'after', runValidators: true }
  ).lean();
  if (!space) await throwMissingOrConflict(ownerId, id);
  return serializeSpace(space);
}

export async function deleteSpace(ownerId, id, revision) {
  const space = await Moodspace.findOneAndDelete({ _id: id, ownerId, revision });
  if (!space) await throwMissingOrConflict(ownerId, id);
}
