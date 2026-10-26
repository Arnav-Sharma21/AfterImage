import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address.').max(254));
const password = z.string().min(15, 'Use at least 15 characters.').max(128, 'Use no more than 128 characters.');

export const registerSchema = z.object({
  email,
  password,
  displayName: z.string().trim().min(1, 'Enter your name.').max(60, 'Use no more than 60 characters.')
}).strict();

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password.').max(128)
}).strict();
