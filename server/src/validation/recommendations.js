import { z } from 'zod';
export const generationSchema = z.object({ revision: z.number().int().min(0) }).strict();
export const feedbackSchema = z.object({ reaction: z.enum(['like', 'dislike', 'neutral']) }).strict();
