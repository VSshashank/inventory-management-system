/**
 * Development environment.
 *
 * `ng serve` runs on :4200 while the API runs on :3000, so the base URL has to
 * be absolute. The backend CORS allow-list already includes both localhost and
 * 127.0.0.1 on :4200.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
};
