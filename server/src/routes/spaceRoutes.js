import { Router } from 'express';
import * as controller from '../controllers/spaceController.js';
import { requireAuth } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { createSpaceSchema, deleteSpaceSchema, listSpacesSchema, spaceIdSchema, updateSpaceSchema } from '../validation/spaces.js';
import * as musicController from '../controllers/musicController.js';
import { emptyBodySchema, spaceTrackSchema } from '../validation/music.js';
import { musicRequestLimiter } from './musicRoutes.js';

export const spaceRoutes = Router();
spaceRoutes.use(requireAuth);
spaceRoutes.get('/', validate(listSpacesSchema, 'query'), controller.list);
spaceRoutes.post('/', validate(createSpaceSchema), controller.create);
spaceRoutes.get('/:id', validate(spaceIdSchema, 'params'), controller.detail);
spaceRoutes.get('/:id/tracks', validate(spaceIdSchema, 'params'), musicController.saved);
spaceRoutes.put('/:id/tracks/:provider/:trackId', musicRequestLimiter, validate(spaceTrackSchema, 'params'), validate(emptyBodySchema), musicController.save);
spaceRoutes.delete('/:id/tracks/:provider/:trackId', validate(spaceTrackSchema, 'params'), validate(emptyBodySchema), musicController.remove);
spaceRoutes.patch('/:id', validate(spaceIdSchema, 'params'), validate(updateSpaceSchema), controller.update);
spaceRoutes.delete('/:id', validate(spaceIdSchema, 'params'), validate(deleteSpaceSchema), controller.remove);
