import { z } from 'zod';
import { MOODS } from '../../../shared/moods.js';
import { isPublicImageUrl } from '../../../shared/images.js';

const fragmentSchema = z.object({ id: z.uuid(), type: z.enum(['quote', 'note', 'image-caption']), text: z.string().trim().min(1, 'Write a fragment or remove it.').max(1000) }).strict();
const imageSchema = z.object({
  assetId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  id: z.uuid(),
  url: z.string().trim().max(2048).refine(isPublicImageUrl, 'Use a public HTTPS image URL without credentials or a custom port.'),
  alt: z.string().trim().min(1, 'Describe this image for accessibility.').max(200),
  caption: z.string().trim().max(500).default('')
}).strict();
const fields = {
  title: z.string().trim().min(1, 'Give this space a title.').max(80, 'Use no more than 80 characters.'),
  description: z.string().trim().max(1000, 'Use no more than 1,000 characters.'),
  moods: z.array(z.enum(MOODS)).min(1, 'Choose at least one mood.').max(5, 'Choose up to five moods.')
    .refine(value => new Set(value).size === value.length, 'Choose each mood only once.'),
  soundTuning: z.object(Object.fromEntries(['energy', 'melancholy', 'warmth', 'intensity', 'nostalgia'].map(key => [key, z.number().min(0).max(1).optional()]))).strict().optional(),
  images: z.array(imageSchema).max(12, 'Use up to twelve images.').refine(items => new Set(items.map(item => item.id)).size === items.length, 'Each image needs its own ID.').optional(),
  fragments: z.array(fragmentSchema).max(10, 'Use up to ten fragments.').refine(items => new Set(items.map(item => item.id)).size === items.length, 'Each fragment needs its own ID.').optional()
};

export const createSpaceSchema = z.object(fields).extend({ description: fields.description.default('') }).strict();
export const updateSpaceSchema = z.object(fields).partial().extend({
  revision: z.number().int().min(0)
}).strict().refine(value => Object.keys(value).some(key => key !== 'revision'), 'Include at least one field to update.');
export const deleteSpaceSchema = z.object({ revision: z.number().int().min(0) }).strict();
export const spaceIdSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid space ID.') });
export const listSpacesSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20)
}).strict();
