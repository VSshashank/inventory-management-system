import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:4200',
  frontendOrigins: (process.env.FRONTEND_ORIGINS || process.env.FRONTEND_ORIGIN || 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-access-secret-change-me',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'dev-refresh-secret-change-me',
  jwtMfaSecret: process.env.JWT_MFA_SECRET || process.env.JWT_SECRET || 'dev-mfa-secret-change-me',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  jwtMfaExpiresIn: process.env.JWT_MFA_EXPIRES_IN || '5m',
  refreshCookieName: process.env.REFRESH_COOKIE_NAME || 'refreshToken',
  csrfCookieName: process.env.CSRF_COOKIE_NAME || 'csrfToken',
  csrfHeaderName: process.env.CSRF_HEADER_NAME || 'x-csrf-token',
} as const;
