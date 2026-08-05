import crypto from 'node:crypto';
import type { Response } from 'express';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from '../errors/app-error.js';
import type { Role } from '../types/domain.js';

type TokenKind = 'access' | 'refresh' | 'mfa' | 'mfa-setup';

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: Role;
  tokenVersion: number;
  type: TokenKind;
}

export interface MfaSetupPayload extends JwtPayload {
  sub: string;
  secret: string;
  type: 'mfa-setup';
}

interface UserTokenInput {
  id: number;
  email: string;
  role: Role;
  tokenVersion: number;
}

function signToken(payload: object, secret: string, expiresIn: string): string {
  const options: SignOptions = {
    expiresIn: expiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, secret, options);
}

/**
 * An expired, tampered, or otherwise unverifiable token is a normal client
 * condition, not a server fault. `jwt.verify` signals it by throwing, so without
 * this translation every stale refresh cookie surfaces as a 500 — which both
 * misleads the client (the interceptor cannot tell "log in again" from "server
 * broke") and buries genuine faults in error monitoring.
 */
function verifyToken<T extends JwtPayload>(token: string, secret: string): T {
  try {
    return jwt.verify(token, secret) as T;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AppError('Token has expired.', 401);
    }

    throw new AppError('Invalid token.', 401);
  }
}

export function createAccessToken(user: UserTokenInput): string {
  return signToken(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      type: 'access',
    },
    config.jwtAccessSecret,
    config.jwtAccessExpiresIn,
  );
}

export function createRefreshToken(user: UserTokenInput): string {
  return signToken(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      type: 'refresh',
    },
    config.jwtRefreshSecret,
    config.jwtRefreshExpiresIn,
  );
}

export function createMfaPendingToken(user: UserTokenInput): string {
  return signToken(
    {
      sub: String(user.id),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
      type: 'mfa',
    },
    config.jwtMfaSecret,
    config.jwtMfaExpiresIn,
  );
}

export function createMfaSetupToken(userId: number, secret: string): string {
  return signToken(
    {
      sub: String(userId),
      secret,
      type: 'mfa-setup',
    },
    config.jwtMfaSecret,
    config.jwtMfaExpiresIn,
  );
}

export function verifyAccessToken(token: string): AuthTokenPayload {
  return verifyToken<AuthTokenPayload>(token, config.jwtAccessSecret);
}

export function verifyRefreshToken(token: string): AuthTokenPayload {
  return verifyToken<AuthTokenPayload>(token, config.jwtRefreshSecret);
}

export function verifyMfaPendingToken(token: string): AuthTokenPayload {
  return verifyToken<AuthTokenPayload>(token, config.jwtMfaSecret);
}

export function verifyMfaSetupToken(token: string): MfaSetupPayload {
  return verifyToken<MfaSetupPayload>(token, config.jwtMfaSecret);
}

export function createCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(config.refreshCookieName, token, {
    httpOnly: true,
    secure: config.cookieSecure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth/refresh',
  });
}

export function setCsrfCookie(res: Response, token: string): void {
  res.cookie(config.csrfCookieName, token, {
    httpOnly: false,
    secure: config.cookieSecure,
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(config.refreshCookieName, { path: '/api/auth/refresh' });
  res.clearCookie(config.csrfCookieName, { path: '/' });
}
