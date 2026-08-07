import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule],
  template: `
    <main class="access-page">
      <section class="access-content">
        <section class="access-panel" aria-labelledby="sign-in-title">
          <div class="panel-header">
            <span class="product-symbol" aria-hidden="true">
              <mat-icon>inventory_2</mat-icon>
            </span>
            <h1 id="sign-in-title">Sign in to Inventory</h1>
            <span>Use your staff account to continue.</span>
          </div>

          @if (!mfaRequired()) {
            <form [formGroup]="form" (ngSubmit)="submit()">
              <mat-form-field appearance="outline">
                <mat-label>Email address</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email" />
                @if (form.controls.email.invalid && form.controls.email.touched) {
                  <mat-error>Enter a valid email address.</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="current-password" />
                @if (form.controls.password.invalid && form.controls.password.touched) {
                  <mat-error>Password is required.</mat-error>
                }
              </mat-form-field>

              @if (errorMessage()) {
                <p class="form-error"><mat-icon>error_outline</mat-icon>{{ errorMessage() }}</p>
              }

              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">
                <span>{{ loading() ? 'Signing in...' : 'Sign in' }}</span>
              </button>
            </form>
          } @else {
            <form [formGroup]="mfaForm" (ngSubmit)="submitMfa()">
              <p class="mfa-hint">
                <mat-icon>lock_clock</mat-icon>
                Enter the 6-digit code from your authenticator app.
              </p>

              <mat-form-field appearance="outline">
                <mat-label>Authentication code</mat-label>
                <input
                  matInput
                  type="text"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  formControlName="code"
                />
                @if (mfaForm.controls.code.invalid && mfaForm.controls.code.touched) {
                  <mat-error>Enter the 6-digit code.</mat-error>
                }
              </mat-form-field>

              @if (errorMessage()) {
                <p class="form-error"><mat-icon>error_outline</mat-icon>{{ errorMessage() }}</p>
              }

              <button mat-flat-button color="primary" type="submit" [disabled]="mfaForm.invalid || loading()">
                <span>{{ loading() ? 'Verifying...' : 'Verify code' }}</span>
              </button>
              <button mat-button type="button" class="mfa-cancel" (click)="cancelMfa()">Use a different account</button>
            </form>
          }

          <p class="access-note">Activity is recorded against your account.</p>
        </section>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100dvh;
      }

      .access-page {
        display: grid;
        min-height: 100dvh;
        place-items: center;
        padding: 24px;
        background: var(--canvas);
      }

      .access-content {
        width: 100%;
        max-width: 400px;
      }

      .access-panel {
        padding: 32px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--surface);
        box-shadow: var(--shadow-md);
      }

      .panel-header {
        margin-bottom: 24px;
      }

      .product-symbol {
        display: grid;
        width: 40px;
        height: 40px;
        margin-bottom: 18px;
        place-items: center;
        border-radius: 10px;
        background: var(--brand);
        color: #ffffff;
      }

      .product-symbol mat-icon {
        width: 22px;
        height: 22px;
        color: #ffffff;
        font-size: 22px;
      }

      .panel-header h1 {
        margin: 0;
        color: var(--ink-strong);
        font-size: 1.375rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.25;
      }

      .panel-header > span {
        display: block;
        margin-top: 6px;
        color: var(--muted);
        font-size: 0.875rem;
      }

      form {
        display: grid;
        gap: 4px;
      }

      form button[mat-flat-button] {
        width: 100%;
        min-height: 42px;
        margin-top: 8px;
      }

      .form-error {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 0 0 8px;
        padding: 10px 12px;
        border: 1px solid var(--danger-line);
        border-radius: var(--radius);
        background: var(--danger-soft);
        color: var(--danger);
        font-size: 0.8125rem;
        line-height: 1.45;
      }

      .form-error mat-icon {
        width: 17px;
        height: 17px;
        flex: 0 0 auto;
        font-size: 17px;
      }

      .mfa-hint {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 0 0 16px;
        padding: 10px 12px;
        border: 1px solid var(--info-line);
        border-radius: var(--radius);
        background: var(--info-soft);
        color: var(--info);
        font-size: 0.8125rem;
        line-height: 1.45;
      }

      .mfa-hint mat-icon {
        width: 17px;
        height: 17px;
        flex: 0 0 auto;
        font-size: 17px;
      }

      .mfa-cancel {
        width: 100%;
        margin-top: 4px;
        color: var(--muted);
      }

      .access-note {
        margin: 20px 0 0;
        padding-top: 18px;
        border-top: 1px solid var(--line);
        color: var(--subtle);
        font-size: 0.8125rem;
        text-align: center;
      }

      @media (max-width: 480px) {
        .access-page {
          padding: 16px;
        }

        .access-panel {
          padding: 24px 20px;
        }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  /** Set once the backend answers a login with an `mfaRequired` challenge. */
  readonly mfaRequired = signal(false);
  private pendingToken = '';

  readonly form = new FormGroup({
    email: new FormControl('admin@example.com', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('AdminDemo!2026', { nonNullable: true, validators: [Validators.required] }),
  });

  readonly mfaForm = new FormGroup({
    code: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth
      .login(this.form.controls.email.value, this.form.controls.password.value)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          if (result.status === 'mfa-required') {
            this.pendingToken = result.pendingToken;
            this.mfaRequired.set(true);
            return;
          }

          this.completeLogin();
        },
        error: () => {
          this.errorMessage.set('Invalid email or password.');
        },
      });
  }

  submitMfa(): void {
    if (this.mfaForm.invalid || this.loading()) {
      this.mfaForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth
      .verifyMfa(this.pendingToken, this.mfaForm.controls.code.value)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          if (result.status === 'authenticated') {
            this.completeLogin();
          }
        },
        error: () => {
          // The pending token is short-lived; if it has expired the user has to
          // start over rather than retry a code against a dead challenge.
          this.errorMessage.set('That code was not accepted. Check your authenticator app and try again.');
          this.mfaForm.reset();
        },
      });
  }

  cancelMfa(): void {
    this.pendingToken = '';
    this.mfaRequired.set(false);
    this.mfaForm.reset();
    this.errorMessage.set('');
  }

  private completeLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
    void this.router.navigateByUrl(returnUrl);
  }
}
