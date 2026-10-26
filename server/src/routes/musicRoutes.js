import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as controller from '../controllers/musicController.js';
import { requireAuth } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { musicSearchSchema, musicTrackSchema } from '../validation/music.js';

export const musicRequestLimiter = rateLimit({ windowMs: 60000, limit: 30, keyGenerator: req => req.session.userId, standardHeaders: 'draft-8', legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: { code: 'MUSIC_RATE_LIMITED', message: 'Too many music requests. Wait a minute and try again.', requestId: req.id } }) });

export function musicRoutes() {
  const router = Router();
  router.use(requireAuth);
  router.use(musicRequestLimiter);
  router.get('/search', validate(musicSearchSchema, 'query'), controller.search);
  router.get('/tracks/:provider/:trackId/playback', validate(musicTrackSchema, 'params'), controller.playback);
  return router;
}
