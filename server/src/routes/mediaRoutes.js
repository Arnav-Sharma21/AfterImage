import { Router } from 'express';
import multer from 'multer';
import { rateLimit } from 'express-rate-limit';
import { requireAuth } from '../middleware/security.js';
import { AppError } from '../middleware/errors.js';
import { MAX_IMAGE_BYTES, serializeMedia } from '../media/mediaService.js';

export const mediaRoutes = Router();
mediaRoutes.use(requireAuth);
mediaRoutes.get('/config', (req, res) => res.json({ data: { configured: req.app.locals.media.configured, maxBytes: MAX_IMAGE_BYTES, maxImages: 12, formats: ['jpeg', 'png', 'webp', 'avif'] } }));
mediaRoutes.get('/', async (req, res) => {
  const assets = await req.app.locals.media.list(req.user._id);
  const { Moodspace } = await import('../models/Moodspace.js');
  const [ids, urls] = await Promise.all([Moodspace.distinct('images.assetId', { ownerId: req.user._id }), Moodspace.distinct('images.url', { ownerId: req.user._id })]);
  const used = new Set(ids), usedUrls = new Set(urls);
  res.json({ data: assets.map(asset => ({ ...serializeMedia(asset), status: asset.status, cleanupFailed: asset.cleanupFailed, inUse: used.has(asset._id.toString()) || usedUrls.has(asset.url) })) });
});
const limiter = rateLimit({ windowMs: 10 * 60000, limit: 20, keyGenerator: req => req.session.userId, standardHeaders: 'draft-8', legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: { code: 'UPLOAD_RATE_LIMITED', message: 'You can upload twenty images in ten minutes. Please wait before trying again.' } }) });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_IMAGE_BYTES, files: 1, fields: 0, parts: 1 } }).single('image');
mediaRoutes.post('/', limiter, (req, _res, next) => {
  if (!req.app.locals.media.configured) throw new AppError(503, 'MEDIA_NOT_CONFIGURED', 'Uploads need CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET on the server. HTTPS image links still work.');
  next();
}, upload, async (req, res) => {
  if (!req.file) throw new AppError(422, 'IMAGE_REQUIRED', 'Choose an image file to upload.');
  res.status(201).json({ data: await req.app.locals.media.upload(req.user._id, req.file.buffer) });
});
mediaRoutes.delete('/:id', async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new AppError(422, 'INVALID_MEDIA_ID', 'Invalid image ID.');
  await req.app.locals.media.remove(req.user._id, req.params.id);
  res.json({ data: { message: 'Image removed from storage.' } });
});
