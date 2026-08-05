import type { RequestHandler } from 'express';
import { config } from '../config/index.js';

/**
 * Backstop for TLS in production — App Service terminates TLS upstream, but that
 * should not be the only thing enforcing it.
 *
 * Scoped to production specifically rather than "not development": test and CI
 * runs speak plain HTTP to an in-process app, and redirecting those turns every
 * request into a 308 that never reaches a route.
 */
export const httpsRedirect: RequestHandler = (req, res, next) => {
  if (!config.isProduction || req.secure || req.get('x-forwarded-proto') === 'https') {
    next();
    return;
  }

  res.redirect(308, `https://${req.get('host')}${req.originalUrl}`);
};
