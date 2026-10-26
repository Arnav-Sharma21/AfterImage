import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as controller from '../controllers/authController.js';
import { requireAuth } from '../middleware/security.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, registerSchema } from '../validation/auth.js';

export function authRoutes(limit = 10) {
  const router = Router();
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, limit, standardHeaders: 'draft-8', legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many attempts. Try again in 15 minutes.', requestId: req.id } })
  });
  router.get('/csrf', controller.getCsrf);
  router.post('/register', authLimiter, validate(registerSchema), controller.register);
  router.post('/login', authLimiter, validate(loginSchema), controller.login);
  router.get('/me', requireAuth, controller.me);
  router.post('/logout', requireAuth, controller.logout);
  return router;
}
