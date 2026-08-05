import rateLimit from 'express-rate-limit';

// The suite drives many logins in a row on purpose; a shared per-IP budget would
// make tests fail on the limiter rather than on the behaviour under test.
const skipInTests = () => process.env.NODE_ENV === 'test';

/**
 * Credential-guessing defence. Deliberately strict, and paired with the
 * per-account lockout in the login route so a distributed attempt against one
 * account is slowed even when each request comes from a different IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: 'Too many authentication attempts. Try again later.' },
});

/**
 * Token refresh is automatic and happens on a timer for every signed-in tab, so
 * it needs far more headroom than a login attempt. Sharing the strict login
 * budget would lock out everyone behind one office NAT or corporate proxy — a
 * self-inflicted outage rather than a defence.
 */
export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: skipInTests,
  message: { error: 'Too many refresh attempts. Try again later.' },
});
