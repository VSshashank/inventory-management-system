import type { RequestHandler } from 'express';
import { config } from '../config/index.js';

export const httpsRedirect: RequestHandler = (req, res, next) => {
  if (config.isDev || req.secure || req.get('x-forwarded-proto') === 'https') {
    next();
    return;
  }

  res.redirect(308, `https://${req.get('host')}${req.originalUrl}`);
};
