/**
 * Production environment.
 *
 * In production the Express server serves the built Angular bundle from the
 * same origin (see Dockerfile + app.ts static handler), so the API is reached
 * with a same-origin relative path. Hardcoding a host here would break the
 * deployed app for every visitor who is not on the build machine.
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
};
