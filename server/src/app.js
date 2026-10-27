import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { databaseReady } from './config/database.js';
import { SESSION_COOKIE } from './controllers/authController.js';
import { AppError, errorHandler, notFound } from './middleware/errors.js';
import { protectMutations } from './middleware/security.js';
import { authRoutes } from './routes/authRoutes.js';
import { spaceRoutes } from './routes/spaceRoutes.js';
import { musicRoutes } from './routes/musicRoutes.js';
import { createJamendoProvider, JAMENDO_IMAGE_ORIGINS, JAMENDO_MEDIA_ORIGINS } from './providers/jamendo.js';
import { createMusicService } from './services/musicService.js';

const buildDirectory = fileURLToPath(new URL('../../client/dist/', import.meta.url));

export function createApp(config, sessionStore, { musicProvider } = {}) {
  if (!sessionStore) throw new Error('A persistent session store is required.');
  const app = express();
  const isProduction = config.nodeEnv === 'production';
  app.locals.isProduction = isProduction;
  app.locals.music = createMusicService(musicProvider || createJamendoProvider({ clientId: config.jamendoClientId }));
  app.disable('x-powered-by');
  if (config.trustProxyHops) app.set('trust proxy', config.trustProxyHops);
  app.use((req, res, next) => {
    req.id = randomUUID();
    res.set('X-Request-Id', req.id);
    next();
  });
  app.use(helmet({
    contentSecurityPolicy: { directives: {
      'upgrade-insecure-requests': isProduction ? [] : null,
      'media-src': ["'self'", ...JAMENDO_MEDIA_ORIGINS],
      // User-provided HTTPS images load directly. No server-side URL fetching.
      'img-src': ["'self'", 'data:', 'https:', ...JAMENDO_IMAGE_ORIGINS],
      'object-src': ["'none'"]
    } },
    strictTransportSecurity: isProduction ? undefined : false
  }));
  app.get('/api/health', (_req, res) => res.json({ data: { status: 'ok' } }));
  app.get('/api/ready', async (_req, res) => {
    const ready = await databaseReady();
    res.status(ready ? 200 : 503).json({ data: { status: ready ? 'ready' : 'unavailable' } });
  });
  app.use('/api', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (mongoose.connection.readyState !== 1) return next(new AppError(503, 'DATABASE_UNAVAILABLE', 'The database is unavailable. Please try again shortly.'));
    next();
  });
  app.use('/api', express.json({ limit: '64kb' }));
  app.use('/api', session({
    name: SESSION_COOKIE, secret: config.sessionSecret, store: sessionStore,
    resave: false, saveUninitialized: false,
    cookie: { httpOnly: true, secure: isProduction, sameSite: 'lax', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 }
  }));
  app.use('/api', protectMutations(config.appOrigin));
  app.use('/api/auth', authRoutes(config.authLimit));
  app.use('/api/spaces', spaceRoutes);
  app.use('/api/music', musicRoutes());
  app.use('/api', notFound);

  if (existsSync(path.join(buildDirectory, 'index.html'))) {
    app.use(express.static(buildDirectory, { index: false }));
    app.get('/{*path}', (req, res, next) => {
      if (!req.accepts('html') || path.extname(req.path)) return next();
      res.set('Cache-Control', 'no-cache').sendFile(path.join(buildDirectory, 'index.html'));
    });
  }
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
