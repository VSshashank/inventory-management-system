import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { SKIP_AUTH_REFRESH } from './http-context';

const mutatingMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const headers: Record<string, string> = {};
  const token = auth.bearerToken();
  const csrfToken = auth.csrfToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (csrfToken && mutatingMethods.has(request.method)) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  const authenticatedRequest = request.clone({
    setHeaders: headers,
    withCredentials: true,
  });

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !request.context.get(SKIP_AUTH_REFRESH)
      ) {
        return auth.refresh().pipe(
          switchMap(() => {
            const refreshedToken = auth.bearerToken();
            const retriedRequest = authenticatedRequest.clone({
              setHeaders: refreshedToken ? { Authorization: `Bearer ${refreshedToken}` } : {},
            });

            return next(retriedRequest);
          }),
          catchError((refreshError) => {
            auth.clearSession();
            return throwError(() => refreshError);
          }),
        );
      }

      return throwError(() => error);
    }),
  );
};
