import { Router } from 'express';
import * as controller from '../controllers/spaceController.js';
import { requireAuth } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { createSpaceSchema, deleteSpaceSchema, listSpacesSchema, spaceIdSchema, updateSpaceSchema } from '../validation/spaces.js';
import * as musicController from '../controllers/musicController.js';
import { emptyBodySchema, spaceTrackSchema } from '../validation/music.js';
import { musicRequestLimiter } from './musicRoutes.js';
import * as recommendations from '../controllers/recommendationController.js';
import { feedbackSchema, generationSchema } from '../validation/recommendations.js';
import { rateLimit } from 'express-rate-limit';

const generationLimiter = rateLimit({ windowMs: 60000, limit: 5, keyGenerator: req => req.session.userId,
  standardHeaders: 'draft-8', legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: { code: 'RECOMMENDATION_RATE_LIMITED', message: 'Try again in a minute. You can find music five times per minute.', requestId: req.id } }) });

export const spaceRoutes = Router();
spaceRoutes.use(requireAuth);
spaceRoutes.get('/', validate(listSpacesSchema, 'query'), controller.list);
spaceRoutes.post('/', validate(createSpaceSchema), controller.create);
spaceRoutes.get('/:id', validate(spaceIdSchema, 'params'), controller.detail);
spaceRoutes.get('/:id/recommendations', validate(spaceIdSchema, 'params'), recommendations.read);
spaceRoutes.post('/:id/recommendations', generationLimiter, validate(spaceIdSchema, 'params'), validate(generationSchema), recommendations.generate);
spaceRoutes.put('/:id/recommendations/:provider/:trackId/feedback', validate(spaceTrackSchema, 'params'), validate(feedbackSchema), recommendations.react);
spaceRoutes.get('/:id/tracks', validate(spaceIdSchema, 'params'), musicController.saved);
spaceRoutes.put('/:id/tracks/:provider/:trackId', musicRequestLimiter, validate(spaceTrackSchema, 'params'), validate(emptyBodySchema), musicController.save);
spaceRoutes.delete('/:id/tracks/:provider/:trackId', validate(spaceTrackSchema, 'params'), validate(emptyBodySchema), musicController.remove);
spaceRoutes.patch('/:id', validate(spaceIdSchema, 'params'), validate(updateSpaceSchema), controller.update);
spaceRoutes.delete('/:id', validate(spaceIdSchema, 'params'), validate(deleteSpaceSchema), controller.remove);
