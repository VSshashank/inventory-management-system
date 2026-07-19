import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <main class="login-screen">
      <section class="login-panel">
        <div class="brand-mark">IM</div>
        <h1>Inventory Management</h1>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" autocomplete="email" />
            <mat-icon matSuffix>mail</mat-icon>
            @if (form.controls.email.invalid && form.controls.email.touched) {
              <mat-error>Enter a valid email.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" formControlName="password" autocomplete="current-password" />
            <mat-icon matSuffix>lock</mat-icon>
            @if (form.controls.password.invalid && form.controls.password.touched) {
              <mat-error>Password is required.</mat-error>
            }
          </mat-form-field>

          @if (errorMessage()) {
            <p class="form-error">{{ errorMessage() }}</p>
          }

          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading()">
            @if (loading()) {
              <mat-spinner diameter="18" />
            } @else {
              <mat-icon>login</mat-icon>
            }
            <span>Sign in</span>
          </button>
        </form>
      </section>
    </main>
  `,
  styles: [
    `
      .login-screen {
        min-height: 100dvh;
        display: grid;
        place-items: center;
        padding: 24px;
        background: linear-gradient(135deg, #eef6ff 0%, #f8fafc 48%, #f2fbf5 100%);
        box-sizing: border-box;
      }

      .login-panel {
        width: min(100%, 420px);
        padding: 32px;
        border: 1px solid #d9e2ec;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12);
      }

      .brand-mark {
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        border-radius: 8px;
        background: #1769aa;
        color: #ffffff;
        font-weight: 700;
        letter-spacing: 0;
      }

      h1 {
        margin: 18px 0 24px;
        color: #14213d;
        font-size: 1.55rem;
        line-height: 1.2;
        letter-spacing: 0;
      }

      form,
      mat-form-field {
        width: 100%;
      }

      form {
        display: grid;
        gap: 14px;
      }

      button {
        height: 44px;
        border-radius: 6px;
      }

      button mat-spinner,
      button mat-icon {
        margin-right: 8px;
      }

      .form-error {
        margin: 0;
        color: #b42318;
        font-size: 0.9rem;
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
  readonly form = new FormGroup({
    email: new FormControl('admin@example.com', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('AdminDemo!2026', { nonNullable: true, validators: [Validators.required] }),
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
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/dashboard';
          void this.router.navigateByUrl(returnUrl);
        },
        error: () => {
          this.errorMessage.set('Invalid email or password.');
        },
      });
  }
}
