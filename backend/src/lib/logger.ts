import pino from 'pino';
import { config } from '../config/index.js';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (config.isDev ? 'debug' : 'info'),
  transport: config.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
        },
      }
    : undefined,
});
