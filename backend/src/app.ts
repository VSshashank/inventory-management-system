import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { config } from './config/index.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler } from './middleware/error-handler.js';
import { httpsRedirect } from './middleware/https-redirect.js';
import { authRateLimiter } from './middleware/rate-limit.js';
import { logger } from './lib/logger.js';
import authRouter from './routes/auth.js';
import categoriesRouter from './routes/categories.js';
import healthRouter from './routes/health.js';
import itemsRouter from './routes/items.js';
import reportsRouter from './routes/reports.js';
import settingsRouter from './routes/settings.js';
import transactionsRouter from './routes/transactions.js';
import unitsRouter from './routes/units.js';
import usersRouter from './routes/users.js';

const app = express();
app.set('trust proxy', 1);
app.use(httpsRedirect);

// Security headers
app.use(helmet());
app.use(
  pinoHttp({
    logger,
    redact: ['req.headers.authorization', 'req.headers.cookie'],
  }),
);

// CORS — will be locked down to the frontend origin in Phase 9
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.frontendOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS origin not allowed.'));
    },
    credentials: true,
  }),
);

// Body parsing
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(csrfProtection);

// Routes
app.use('/api', healthRouter);
app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/units', unitsRouter);
app.use('/api/items', itemsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/settings', settingsRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

if (config.nodeEnv === 'production') {
  const publicDir = path.join(process.cwd(), 'public');
  app.use(express.static(publicDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

app.use(errorHandler);

export default app;
