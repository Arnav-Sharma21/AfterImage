import { randomBytes } from 'node:crypto';
import { promisify } from 'node:util';
import * as authService from '../services/authService.js';
import { csrfToken } from '../middleware/security.js';

export const SESSION_COOKIE = 'afterimage.sid';

async function establishSession(req, user) {
  await promisify(req.session.regenerate).call(req.session);
  req.session.userId = user.id;
  req.session.csrfToken = randomBytes(32).toString('hex');
  await promisify(req.session.save).call(req.session);
  return { user, csrfToken: req.session.csrfToken };
}

export function getCsrf(req, res) {
  res.json({ data: { csrfToken: csrfToken(req) } });
}

export async function register(req, res) {
  const user = await authService.register(req.validated.body);
  res.status(201).json({ data: await establishSession(req, user) });
}

export async function login(req, res) {
  const user = await authService.login(req.validated.body);
  res.json({ data: await establishSession(req, user) });
}

export function me(req, res) {
  res.json({ data: { user: authService.safeUser(req.user), csrfToken: csrfToken(req) } });
}

export async function logout(req, res) {
  await promisify(req.session.destroy).call(req.session);
  res.clearCookie(SESSION_COOKIE, { path: '/', httpOnly: true, sameSite: 'lax', secure: req.app.locals.isProduction });
  res.json({ data: { message: 'Signed out.' } });
}
