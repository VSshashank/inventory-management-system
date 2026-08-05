import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

const devFallbackSecrets = {
  access: 'dev-access-secret-change-me',
  refresh: 'dev-refresh-secret-change-me',
  mfa: 'dev-mfa-secret-change-me',
} as const;

/**
 * Reads a signing secret. In production a missing or placeholder value is a
 * hard boot failure rather than a silent fallback — a deployed app signing
 * tokens with a public default is trivially forgeable.
 */
function requireSecret(name: string, fallback: string): string {
  const value = process.env[name];

  if (value && value !== fallback) {
    return value;
  }

  if (isProduction) {
    throw new Error(
      `${name} must be set to a strong, unique value in production (current value is missing or the shipped default).`,
    );
  }

  return value || fallback;
}

const databaseUrl = process.env.DATABASE_URL || '';

if (isProduction && !databaseUrl) {
  throw new Error('DATABASE_URL must be set in production.');
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  isDev: nodeEnv === 'development',
  isProduction,
  databaseUrl,
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
  frontendOrigins: (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtAccessSecret: requireSecret('JWT_ACCESS_SECRET', devFallbackSecrets.access),
  jwtRefreshSecret: requireSecret('JWT_REFRESH_SECRET', devFallbackSecrets.refresh),
  jwtMfaSecret: requireSecret('JWT_MFA_SECRET', devFallbackSecrets.mfa),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  jwtMfaExpiresIn: process.env.JWT_MFA_EXPIRES_IN || '5m',
  // `Secure` cookies are only delivered over HTTPS. Production always sets it;
  // test and local runs speak plain HTTP, where a Secure cookie is silently
  // dropped by the client. COOKIE_SECURE forces it on for any HTTPS-fronted
  // environment that is not labelled "production".
  cookieSecure: process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : isProduction,
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'refreshToken',
  csrfCookieName: process.env.CSRF_COOKIE_NAME || 'csrfToken',
  csrfHeaderName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
} as const;
