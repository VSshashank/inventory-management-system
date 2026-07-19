import type { RequestHandler } from 'express';
import { config } from '../config/index.js';
import { AppError } from '../errors/app-error.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const publicAuthMutations = new Set(['POST /api/auth/login', 'POST /api/auth/login/mfa']);

export const csrfProtection: RequestHandler = (req, _res, next) => {
  if (safeMethods.has(req.method)) {
    next();
    return;
  }

  if (publicAuthMutations.has(`${req.method} ${req.path}`)) {
    next();
    return;
  }

  const csrfCookie = req.cookies?.[config.csrfCookieName];
  const csrfHeader = req.get(config.csrfHeaderName);

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    next(new AppError('Invalid or missing CSRF token.', 403));
    return;
  }

  next();
};
