import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { SKIP_AUTH_REFRESH } from './http-context';
import type { User } from './models';

interface AuthResponse {
  accessToken: string;
  csrfToken: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api';
  private accessToken: string | null = null;
  private refreshRequest$?: Observable<User>;

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  login(email: string, password: string): Observable<User> {
    return this.http
      .post<AuthResponse>(
        `${this.baseUrl}/auth/login`,
        { email, password },
        {
          context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
          withCredentials: true,
        },
      )
      .pipe(
        tap((response) => this.applySession(response)),
        map((response) => response.user),
      );
  }

  refresh(): Observable<User> {
    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.http
        .post<AuthResponse>(
          `${this.baseUrl}/auth/refresh`,
          {},
          {
            context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
            headers: this.csrfToken() ? { 'X-CSRF-Token': this.csrfToken() } : {},
            withCredentials: true,
          },
        )
        .pipe(
          tap((response) => this.applySession(response)),
          map((response) => response.user),
          finalize(() => {
            this.refreshRequest$ = undefined;
          }),
          shareReplay(1),
        );
    }

    return this.refreshRequest$;
  }

  ensureSession(): Observable<User> {
    const currentUser = this.user();

    if (this.accessToken && currentUser) {
      return of(currentUser);
    }

    return this.refresh();
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(
        `${this.baseUrl}/auth/logout`,
        {},
        {
          context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
          headers: this.csrfToken() ? { 'X-CSRF-Token': this.csrfToken() } : {},
          withCredentials: true,
        },
      )
      .pipe(
        finalize(() => {
          this.clearSession();
        }),
      );
  }

  clearSession(): void {
    this.accessToken = null;
    this.user.set(null);
  }

  bearerToken(): string | null {
    return this.accessToken;
  }

  csrfToken(): string {
    const cookie = document.cookie
      .split(';')
      .map((value) => value.trim())
      .find((value) => value.startsWith('csrfToken='));

    return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : '';
  }

  private applySession(response: AuthResponse): void {
    this.accessToken = response.accessToken;
    this.user.set(response.user);
  }
}
