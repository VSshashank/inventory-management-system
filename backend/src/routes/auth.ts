import bcrypt from 'bcryptjs';
import { Router, type Response } from 'express';
import { OTP } from 'otplib';
import qrcode from 'qrcode';
import { config } from '../config/index.js';
import { AppError } from '../errors/app-error.js';
import { logger } from '../lib/logger.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { serializeUser } from '../lib/serializers.js';
import {
  clearAuthCookies,
  createAccessToken,
  createCsrfToken,
  createMfaPendingToken,
  createMfaSetupToken,
  createRefreshToken,
  setCsrfCookie,
  setRefreshCookie,
  verifyMfaPendingToken,
  verifyMfaSetupToken,
  verifyRefreshToken,
} from '../lib/tokens.js';
import { isRole } from '../types/domain.js';
import { loginMfaSchema, loginSchema, mfaVerifySchema } from '../validators/auth.js';

const router = Router();
const totp = new OTP({ strategy: 'totp' });
const failedLogins = new Map<string, { count: number; lockedUntil: number; updatedAt: number }>();
// Failure counters are only meaningful while a lockout could still apply. Without
// this ceiling the map grows once per distinct attempted address and never shrinks,
// which is a slow memory leak an attacker can drive by guessing random emails.
const failedLoginRetentionMs = 60 * 60 * 1000;

function pruneFailedLogins(now: number): void {
  for (const [key, state] of failedLogins) {
    if (state.lockedUntil <= now && now - state.updatedAt > failedLoginRetentionMs) {
      failedLogins.delete(key);
    }
  }
}

function assertNotLocked(email: string): void {
  const state = failedLogins.get(email);

  if (state && state.lockedUntil > Date.now()) {
    throw new AppError('Too many failed attempts. Try again later.', 429);
  }
}

function recordLoginFailure(email: string): void {
  const now = Date.now();
  pruneFailedLogins(now);

  const current = failedLogins.get(email) ?? { count: 0, lockedUntil: 0, updatedAt: now };
  const count = current.count + 1;
  const lockedUntil = count >= 8 ? now + 5 * 60 * 1000 : count >= 5 ? now + 60 * 1000 : 0;

  failedLogins.set(email, { count, lockedUntil, updatedAt: now });
  logger.warn({ email, count, lockedUntil }, 'auth login failure');
}

function recordLoginSuccess(email: string): void {
  failedLogins.delete(email);
}

function toTokenUser(user: { id: number; email: string; role: string; tokenVersion: number }) {
  if (!isRole(user.role)) {
    throw new AppError('Invalid user role.', 500);
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  };
}

function issueSession(
  res: Response,
  user: { id: number; email: string; role: string; tokenVersion: number },
) {
  const tokenUser = toTokenUser(user);
  const accessToken = createAccessToken(tokenUser);
  const refreshToken = createRefreshToken(tokenUser);
  const csrfToken = createCsrfToken();

  setRefreshCookie(res, refreshToken);
  setCsrfCookie(res, csrfToken);

  return { accessToken, csrfToken };
}

router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as { email: string; password: string };
    assertNotLocked(email);
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      recordLoginFailure(email);
      throw new AppError('Invalid email or password.', 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      recordLoginFailure(email);
      throw new AppError('Invalid email or password.', 401);
    }

    recordLoginSuccess(email);

    if (user.mfaSecret) {
      logger.info({ userId: user.id }, 'mfa challenge issued');
      res.json({
        mfaRequired: true,
        pendingToken: createMfaPendingToken(toTokenUser(user)),
      });
      return;
    }

    const session = issueSession(res, user);
    res.json({
      ...session,
      user: serializeUser(user),
    });
  }),
);

router.post(
  '/login/mfa',
  validateBody(loginMfaSchema),
  asyncHandler(async (req, res) => {
    const { pendingToken, code } = req.body as { pendingToken: string; code: string };
    const payload = verifyMfaPendingToken(pendingToken);

    if (payload.type !== 'mfa' || !payload.sub) {
      throw new AppError('Invalid MFA challenge.', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });

    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion || !user.mfaSecret) {
      throw new AppError('Invalid MFA challenge.', 401);
    }

    const verified = await totp.verify({ token: code, secret: user.mfaSecret });

    if (!verified.valid) {
      throw new AppError('Invalid MFA code.', 401);
    }

    const session = issueSession(res, user);
    res.json({
      ...session,
      user: serializeUser(user),
    });
  }),
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[config.refreshCookieName];

    if (!refreshToken) {
      throw new AppError('Refresh token required.', 401);
    }

    const payload = verifyRefreshToken(refreshToken);

    if (payload.type !== 'refresh' || !payload.sub) {
      throw new AppError('Invalid refresh token.', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: Number(payload.sub) } });

    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) {
      throw new AppError('Refresh token rejected.', 401);
    }

    const session = issueSession(res, user);
    res.json({
      ...session,
      user: serializeUser(user),
    });
  }),
);

router.post('/logout', (_req, res) => {
  clearAuthCookies(res);
  res.status(204).send();
});

router.post(
  '/mfa/setup',
  requireAuth,
  asyncHandler(async (req, res) => {
    const secret = totp.generateSecret();
    const otpauthUrl = totp.generateURI({
      issuer: 'Inventory Management System',
      label: req.user?.email ?? 'user',
      secret,
    });
    const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);

    res.json({
      secret,
      otpauthUrl,
      qrCodeDataUrl,
      setupToken: createMfaSetupToken(req.user?.id ?? 0, secret),
    });
  }),
);

router.post(
  '/mfa/verify',
  requireAuth,
  validateBody(mfaVerifySchema),
  asyncHandler(async (req, res) => {
    const { setupToken, code } = req.body as { setupToken: string; code: string };
    const payload = verifyMfaSetupToken(setupToken);

    if (payload.type !== 'mfa-setup' || Number(payload.sub) !== req.user?.id) {
      throw new AppError('Invalid MFA setup.', 401);
    }

    const verified = await totp.verify({ token: code, secret: payload.secret });

    if (!verified.valid) {
      throw new AppError('Invalid MFA code.', 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { mfaSecret: payload.secret, tokenVersion: { increment: 1 } },
    });

    clearAuthCookies(res);
    res.json({
      user: serializeUser(updatedUser),
      message: 'MFA enabled. Please log in again.',
    });
  }),
);

export default router;
