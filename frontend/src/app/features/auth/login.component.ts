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
      <header class="access-bar">
        <a class="product-mark" href="/login" aria-label="Inventory Control sign in">
          <span class="product-symbol">IC</span>
          <span class="product-copy">
            <strong>Inventory</strong>
            <small>Control system</small>
          </span>
        </a>
        <span class="access-status"><span aria-hidden="true"></span>System online</span>
      </header>

      <section class="access-content">
        <aside class="access-context">
          <div class="context-heading">
            <span class="context-index">01</span>
            <p>OPERATIONS CONSOLE</p>
          </div>
          <h1>Inventory control.</h1>
          <p class="context-intro">Catalog, movement, and reporting records for authorized staff.</p>

          <dl class="module-list">
            <div>
              <dt>01 / Catalog</dt>
              <dd>Items, units, and thresholds</dd>
            </div>
            <div>
              <dt>02 / Movement</dt>
              <dd>Stock in, sales, and adjustments</dd>
            </div>
            <div>
              <dt>03 / Reporting</dt>
              <dd>Performance and stock velocity</dd>
            </div>
          </dl>

          <div class="context-footer">
            <span>Access level</span>
            <strong>Authorized staff only</strong>
          </div>
        </aside>

        <section class="access-panel" aria-labelledby="sign-in-title">
          <div class="panel-header">
            <p>ACCESS / 01</p>
            <h2 id="sign-in-title">Sign in</h2>
            <span>Enter your staff account details to continue.</span>
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

          <p class="access-note">Restricted access. Activity is recorded against your account.</p>
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
        grid-template-rows: auto 1fr;
        background: var(--canvas);
      }

      .access-bar {
        display: flex;
        width: min(100% - 48px, 1240px);
        min-height: 78px;
        margin: 0 auto;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--line-strong);
      }

      .product-mark {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--ink-strong);
        text-decoration: none;
      }

      .product-symbol {
        display: grid;
        width: 34px;
        height: 34px;
        place-items: center;
        background: var(--ink-strong);
        color: var(--marker);
        font-family: var(--font-mono);
        font-size: 0.7rem;
        font-weight: 500;
      }

      .product-copy {
        display: grid;
        gap: 1px;
      }

      .product-copy strong {
        font-size: 0.91rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .product-copy small {
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.64rem;
        line-height: 1.2;
      }

      .access-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.66rem;
      }

      .access-status > span {
        width: 7px;
        height: 7px;
        background: var(--brand);
      }

      .access-content {
        display: grid;
        width: min(100% - 48px, 1040px);
        margin: auto;
        grid-template-columns: minmax(0, 1.04fr) minmax(340px, 0.76fr);
        gap: 24px;
        padding: 48px 0;
      }

      .access-context {
        display: flex;
        min-height: 510px;
        flex-direction: column;
        padding: 32px;
        border-top: 5px solid var(--marker);
        background: var(--rail);
        color: var(--rail-text);
      }

      .context-heading {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .context-index {
        display: grid;
        width: 27px;
        height: 27px;
        place-items: center;
        border: 1px solid #647269;
        color: var(--marker);
        font-family: var(--font-mono);
        font-size: 0.68rem;
      }

      .context-heading p {
        margin: 0;
        color: var(--rail-muted);
        font-family: var(--font-mono);
        font-size: 0.68rem;
      }

      .access-context h1 {
        margin: 54px 0 0;
        color: var(--rail-text);
        font-size: clamp(2rem, 3vw, 2.8rem);
        font-weight: 700;
        line-height: 1.04;
        letter-spacing: 0;
      }

      .context-intro {
        max-width: 400px;
        margin: 16px 0 0;
        color: #c7d0c7;
        font-size: 0.9rem;
        line-height: 1.65;
      }

      .module-list {
        display: grid;
        gap: 0;
        margin: 42px 0 0;
        border-top: 1px solid #4c574d;
      }

      .module-list div {
        display: grid;
        grid-template-columns: 145px 1fr;
        gap: 14px;
        padding: 12px 0;
        border-bottom: 1px solid #4c574d;
      }

      .module-list dt {
        color: var(--marker);
        font-family: var(--font-mono);
        font-size: 0.66rem;
      }

      .module-list dd {
        margin: 0;
        color: #d5ddd6;
        font-size: 0.77rem;
        line-height: 1.35;
      }

      .context-footer {
        display: grid;
        gap: 4px;
        margin-top: auto;
        padding-top: 24px;
      }

      .context-footer span {
        color: var(--rail-muted);
        font-family: var(--font-mono);
        font-size: 0.65rem;
      }

      .context-footer strong {
        color: var(--rail-text);
        font-size: 0.79rem;
        font-weight: 600;
      }

      .access-panel {
        align-self: center;
        padding: 34px;
        border: 1px solid var(--line-strong);
        border-top: 5px solid var(--brand);
        background: var(--surface);
      }

      .panel-header p {
        margin: 0 0 14px;
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.68rem;
      }

      .panel-header h2 {
        margin: 0;
        color: var(--ink-strong);
        font-size: 1.65rem;
        font-weight: 700;
        line-height: 1.1;
        letter-spacing: 0;
      }

      .panel-header > span {
        display: block;
        margin: 8px 0 28px;
        color: var(--muted);
        font-size: 0.85rem;
        line-height: 1.5;
      }

      form {
        display: grid;
        gap: 12px;
      }

      mat-form-field {
        width: 100%;
      }

      form button {
        width: 100%;
        min-height: 44px;
        margin-top: 6px;
      }

      .form-error {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 0;
        padding: 10px;
        border-left: 3px solid var(--rose);
        background: var(--rose-soft);
        color: #9f3d31;
        font-size: 0.8rem;
        line-height: 1.4;
      }

      .form-error mat-icon {
        width: 17px;
        height: 17px;
        flex: 0 0 auto;
        font-size: 17px;
      }

      .mfa-hint {
        display: flex;
        align-items: center;
        gap: 7px;
        margin: 0;
        color: var(--ink-soft, #4a5450);
        font-size: 0.82rem;
        line-height: 1.4;
      }

      .mfa-hint mat-icon {
        width: 18px;
        height: 18px;
        flex: 0 0 auto;
        font-size: 18px;
      }

      .mfa-cancel {
        width: 100%;
        margin-top: 2px;
      }

      .access-note {
        margin: 24px 0 0;
        padding-top: 14px;
        border-top: 1px solid var(--line);
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.65rem;
        line-height: 1.5;
      }

      @media (max-width: 800px) {
        .access-content {
          grid-template-columns: 1fr;
          padding: 28px 0 40px;
        }

        .access-context {
          min-height: auto;
          padding: 24px;
        }

        .access-context h1 {
          margin-top: 32px;
          font-size: 2rem;
        }

        .module-list {
          margin-top: 30px;
        }

        .context-footer {
          display: none;
        }

        .access-panel {
          width: min(100%, 480px);
          justify-self: center;
        }
      }

      @media (max-width: 520px) {
        .access-bar,
        .access-content {
          width: min(100% - 32px, 1040px);
        }

        .access-bar {
          min-height: 66px;
        }

        .access-status {
          display: none;
        }

        .access-context {
          padding: 20px;
        }

        .module-list div {
          grid-template-columns: 1fr;
          gap: 5px;
        }

        .access-panel {
          padding: 26px 20px;
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
