import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  APP_ORIGIN: z.url(),
  MONGODB_URI: z.string().regex(/^mongodb(?:\+srv)?:\/\//),
  SESSION_SECRET: z.string().min(32).refine(value => !value.startsWith('replace-'), 'Generate your own random session secret.'),
  JAMENDO_CLIENT_ID: z.string().trim().max(200).optional(),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(1).default(0)
});

export function readConfig(environment = process.env) {
  const result = schema.safeParse(environment);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map(issue => issue.path[0]))];
    throw new Error(`Invalid configuration: ${fields.join(', ')}. Check server/.env against server/.env.example.`);
  }
  const env = result.data;
  const origin = new URL(env.APP_ORIGIN);
  if (origin.origin !== env.APP_ORIGIN || (env.NODE_ENV === 'production' && origin.protocol !== 'https:')) {
    throw new Error('APP_ORIGIN must be an exact origin without a trailing slash; production requires HTTPS.');
  }
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    appOrigin: env.APP_ORIGIN,
    mongoUri: env.MONGODB_URI,
    sessionSecret: env.SESSION_SECRET,
    trustProxyHops: env.TRUST_PROXY_HOPS,
    jamendoClientId: env.JAMENDO_CLIENT_ID || undefined
  };
}
