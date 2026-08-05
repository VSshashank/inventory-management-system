import { HttpClient, HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { SKIP_AUTH_REFRESH } from './http-context';
import type { User } from './models';

interface AuthResponse {
  accessToken: string;
  csrfToken: string;
  user: User;
}

/** The backend answers a login for an MFA-enabled account with a challenge instead of tokens. */
interface MfaChallengeResponse {
  mfaRequired: true;
  pendingToken: string;
}

type LoginResponse = AuthResponse | MfaChallengeResponse;

/** Either the session is established, or the caller must collect a TOTP code. */
export type LoginResult = { status: 'authenticated'; user: User } | { status: 'mfa-required'; pendingToken: string };

function isMfaChallenge(response: LoginResponse): response is MfaChallengeResponse {
  return 'mfaRequired' in response && response.mfaRequired;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private accessToken: string | null = null;
  private refreshRequest$?: Observable<User>;

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isAdmin = computed(() => this.user()?.role === 'ADMIN');

  login(email: string, password: string): Observable<LoginResult> {
    return this.http
      .post<LoginResponse>(
        `${this.baseUrl}/auth/login`,
        { email, password },
        {
          context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
          withCredentials: true,
        },
      )
      .pipe(map((response) => this.toLoginResult(response)));
  }

  /** Completes a login that returned an `mfaRequired` challenge. */
  verifyMfa(pendingToken: string, code: string): Observable<LoginResult> {
    return this.http
      .post<LoginResponse>(
        `${this.baseUrl}/auth/login/mfa`,
        { pendingToken, code },
        {
          context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
          withCredentials: true,
        },
      )
      .pipe(map((response) => this.toLoginResult(response)));
  }

  private toLoginResult(response: LoginResponse): LoginResult {
    if (isMfaChallenge(response)) {
      return { status: 'mfa-required', pendingToken: response.pendingToken };
    }

    this.applySession(response);
    return { status: 'authenticated', user: response.user };
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
