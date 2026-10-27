import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { MediaAsset } from '../models/MediaAsset.js';
import { Moodspace } from '../models/Moodspace.js';
import { AppError } from '../middleware/errors.js';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const activeUploads = new Set();
export async function normalizeImage(buffer) {
  try {
    const input = sharp(buffer, { limitInputPixels: 25000000, failOn: 'warning', animated: true });
    const metadata = await input.metadata();
    // libvips identifies AVIF as a HEIF container with AV1 compression.
    // Keep other HEIF codecs outside the advertised format allowlist.
    const supported = ['jpeg', 'png', 'webp', 'avif'].includes(metadata.format) || (metadata.format === 'heif' && metadata.compression === 'av1');
    if (!supported || (metadata.pages || 1) > 1) throw new Error('format');
    return await input.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    throw new AppError(422, 'INVALID_IMAGE', 'Use a valid, still JPEG, PNG, WebP or AVIF image, up to 25 megapixels. SVG, animation and corrupt files are not supported.');
  }
}
export function serializeMedia(asset) {
  return { assetId: asset._id.toString(), url: asset.url, width: asset.width, height: asset.height };
}
export function createMediaService(provider) {
  return {
    configured: provider.configured,
    async upload(ownerId, buffer) {
      const owner = ownerId.toString();
      if (activeUploads.has(owner) || activeUploads.size >= 2) throw new AppError(429, 'UPLOAD_BUSY', 'Another image is being processed. Try again shortly.');
      activeUploads.add(owner);
      let asset;
      try {
        if (await MediaAsset.countDocuments({ ownerId, status: { $ne: 'deleted' } }) >= 100) throw new AppError(422, 'MEDIA_LIMIT', 'Your account has reached its 100-image storage limit. Remove unused uploads first.');
        const normalized = await normalizeImage(buffer);
        asset = await MediaAsset.create({ ownerId, publicId: `afterimage/${owner}/${randomUUID()}`, status: 'uploading' });
        const result = await provider.upload(normalized, asset.publicId);
        if (!/^https:\/\/res\.cloudinary\.com\//.test(result.url)) throw new Error('Unexpected media URL');
        asset.set({ url: result.url, cloudinaryAssetId: result.assetId, width: result.width, height: result.height, bytes: result.bytes, status: 'ready' });
        await asset.save();
        return serializeMedia(asset);
      } catch (error) {
        if (asset) await MediaAsset.updateOne({ _id: asset._id }, { $set: { status: 'failed', cleanupFailed: true } }).catch(() => {});
        throw error;
      } finally { activeUploads.delete(owner); }
    },
    async remove(ownerId, id) {
      const asset = await MediaAsset.findOneAndUpdate({ _id: id, ownerId, pins: 0, $or: [{ status: { $in: ['ready', 'failed'] } }, { status: 'deleting', updatedAt: { $lt: new Date(Date.now() - 5 * 60000) } }] }, { $set: { status: 'deleting' } }, { returnDocument: 'after' }).lean();
      if (!asset) {
        const found = await MediaAsset.findOne({ _id: id, ownerId }).lean();
        if (!found) throw new AppError(404, 'MEDIA_NOT_FOUND', 'This image could not be found.');
        if (found.status === 'deleted') return;
        throw new AppError(409, 'MEDIA_IN_USE', 'This image is being saved or cleaned up. Please try again.');
      }
      // Claiming `deleting` blocks new pins before checking every saved reference.
      if (await Moodspace.exists({ $or: [{ 'images.assetId': id }, ...(asset.url ? [{ 'images.url': asset.url }] : [])] })) {
        await MediaAsset.updateOne({ _id: id }, { $set: { status: 'ready' } });
        throw new AppError(409, 'MEDIA_IN_USE', 'This image belongs to a saved world. Remove it there and save the world first.');
      }
      try {
        await provider.destroy(asset.publicId);
        await MediaAsset.updateOne({ _id: id }, { $set: { status: 'deleted', cleanupFailed: false } });
      } catch {
        await MediaAsset.updateOne({ _id: id }, { $set: { status: 'ready', cleanupFailed: true } });
        throw new AppError(502, 'MEDIA_DELETE_FAILED', 'The world is safe, but storage cleanup failed. You can retry from unused uploads.');
      }
    },
    async list(ownerId) {
      return MediaAsset.find({ ownerId, status: { $in: ['ready', 'failed', 'deleting'] } }).sort({ createdAt: -1 }).limit(100).lean();
    },
    async cleanupRemoved(ownerId, before, after = []) {
      const kept = new Set(after.map(image => image.assetId).filter(Boolean));
      for (const id of new Set(before.map(image => image.assetId).filter(id => id && !kept.has(id)))) {
        try { await this.remove(ownerId, id); } catch { /* Retained, visible for safe retry; never fail a committed world save. */ }
      }
    }
  };
}

export async function withImageClaims(ownerId, images, write) {
  const pinned = [];
  try {
    const assets = new Map();
    for (const id of new Set((images || []).map(image => image.assetId).filter(Boolean))) {
      const asset = await MediaAsset.findOneAndUpdate({ _id: id, ownerId, status: 'ready' }, { $inc: { pins: 1 } }, { returnDocument: 'after' }).lean();
      if (!asset) throw new AppError(422, 'INVALID_MEDIA_REFERENCE', 'An uploaded image is unavailable or belongs to another account. Choose it again.');
      pinned.push(id); assets.set(id, asset);
    }
    const canonical = images?.map(image => image.assetId ? { ...image, assetId: assets.get(image.assetId)._id.toString(), url: assets.get(image.assetId).url } : image);
    return await write(canonical);
  } finally {
    if (pinned.length) await MediaAsset.updateMany({ _id: { $in: pinned }, ownerId, pins: { $gt: 0 } }, { $inc: { pins: -1 } });
  }
}
