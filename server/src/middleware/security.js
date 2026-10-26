import { randomBytes, timingSafeEqual } from 'node:crypto';
import { User } from '../models/User.js';
import { AppError } from './errors.js';

export function csrfToken(req) {
  req.session.csrfToken ??= randomBytes(32).toString('hex');
  return req.session.csrfToken;
}

export function protectMutations(origin) {
  return (req, _res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.get('origin') !== origin) return next(new AppError(403, 'ORIGIN_REJECTED', 'This request came from an untrusted origin.'));
    if (!req.is('application/json')) return next(new AppError(415, 'JSON_REQUIRED', 'Use application/json for this request.'));
    const provided = req.get('x-csrf-token');
    const expected = req.session.csrfToken;
    if (!provided || !expected || !/^[a-f\d]{64}$/.test(provided) || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) {
      return next(new AppError(403, 'CSRF_INVALID', 'Your security token expired. Refresh and try again.'));
    }
    next();
  };
}

export async function requireAuth(req, _res, next) {
  if (!req.session.userId) throw new AppError(401, 'AUTH_REQUIRED', 'Sign in to continue.');
  const user = await User.findById(req.session.userId).select('email displayName').lean();
  if (!user) throw new AppError(401, 'AUTH_REQUIRED', 'Sign in to continue.');
  req.user = user;
  next();
}
