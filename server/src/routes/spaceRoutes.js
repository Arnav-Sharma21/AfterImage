import { Router } from 'express';
import * as controller from '../controllers/spaceController.js';
import { requireAuth } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { createSpaceSchema, deleteSpaceSchema, listSpacesSchema, spaceIdSchema, updateSpaceSchema } from '../validation/spaces.js';

export const spaceRoutes = Router();
spaceRoutes.use(requireAuth);
spaceRoutes.get('/', validate(listSpacesSchema, 'query'), controller.list);
spaceRoutes.post('/', validate(createSpaceSchema), controller.create);
spaceRoutes.get('/:id', validate(spaceIdSchema, 'params'), controller.detail);
spaceRoutes.patch('/:id', validate(spaceIdSchema, 'params'), validate(updateSpaceSchema), controller.update);
spaceRoutes.delete('/:id', validate(spaceIdSchema, 'params'), validate(deleteSpaceSchema), controller.remove);
