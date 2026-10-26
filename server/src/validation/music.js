import { z } from 'zod';

export const musicSearchSchema = z.object({
  q: z.string().trim().min(2, 'Enter at least two characters.').max(100, 'Use no more than 100 characters.'),
  page: z.coerce.number().int().min(1).max(100).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20)
}).strict();

const reference = { provider: z.enum(['jamendo']), trackId: z.string().regex(/^\d{1,20}$/, 'Invalid track ID.') };
export const musicTrackSchema = z.object(reference).strict();
export const spaceTrackSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid space ID.'), ...reference }).strict();
export const emptyBodySchema = z.object({}).strict();
