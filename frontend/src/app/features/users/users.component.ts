import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { User } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Users</h1>
          <p class="muted">Admin-only staff management and account status</p>
        </div>
      </header>

      <form class="form-panel user-form" [formGroup]="form" (ngSubmit)="createUser()">
        <mat-form-field appearance="outline">
          <mat-label>Name</mat-label>
          <input matInput formControlName="name" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" formControlName="email" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Password</mat-label>
          <input matInput type="password" formControlName="password" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Role</mat-label>
          <mat-select formControlName="role">
            <mat-option value="STAFF">Staff</mat-option>
            <mat-option value="ADMIN">Admin</mat-option>
          </mat-select>
        </mat-form-field>
        <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">
          <mat-icon>person_add</mat-icon>
          <span>Create User</span>
        </button>
      </form>

      <section class="table-panel">
        <div class="table-wrap">
          <table mat-table [dataSource]="users()">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let user">{{ user.name }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let user">{{ user.email }}</td>
            </ng-container>
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef>Role</th>
              <td mat-cell *matCellDef="let user">
                <mat-form-field appearance="outline" class="role-field">
                  <mat-select [value]="user.role" (selectionChange)="updateUser(user, { role: $event.value })">
                    <mat-option value="STAFF">Staff</mat-option>
                    <mat-option value="ADMIN">Admin</mat-option>
                  </mat-select>
                </mat-form-field>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let user">
                <span class="status-pill" [class.inactive]="!user.isActive">{{ user.isActive ? 'Active' : 'Inactive' }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let user" class="actions">
                <button mat-icon-button type="button" aria-label="Reset password" (click)="resetPassword(user)">
                  <mat-icon>password</mat-icon>
                </button>
                <button mat-icon-button type="button" aria-label="Toggle user status" (click)="updateUser(user, { isActive: !user.isActive })">
                  <mat-icon>{{ user.isActive ? 'person_off' : 'person' }}</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </div>
      </section>
    </section>
  `,
  styles: [
    `
      .user-form {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 14px;
        align-items: start;
      }

      .user-form button {
        height: 48px;
      }

      button mat-icon {
        margin-right: 8px;
      }

      /* A default-density form field is taller than a table row, so the
         select was spilling over the row boundary. */
      .role-field {
        width: 132px;
        margin: 0;
      }

      .role-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
        display: none;
      }

      .role-field ::ng-deep .mat-mdc-text-field-wrapper {
        height: 38px;
      }

      .role-field ::ng-deep .mat-mdc-form-field-infix {
        min-height: 38px;
        padding: 7px 0;
      }

      .actions {
        width: 112px;
        text-align: right;
      }

      @media (max-width: 1080px) {
        .user-form {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 620px) {
        .user-form {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class UsersComponent {
  readonly columns = ['name', 'email', 'role', 'status', 'actions'];
  readonly users = signal<User[]>([]);
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12)] }),
    role: new FormControl<'ADMIN' | 'STAFF'>('STAFF', { nonNullable: true, validators: [Validators.required] }),
  });

  private readonly api = inject(InventoryApiService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    this.load();
  }

  load(): void {
    this.api.users().subscribe({
      next: (response) => this.users.set(response.data),
      error: () => this.snackBar.open('Users could not be loaded.', 'Dismiss', { duration: 3500 }),
    });
  }

  createUser(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.api.createUser(this.form.getRawValue()).subscribe({
      next: () => {
        this.snackBar.open('User created.', 'Dismiss', { duration: 2500 });
        this.form.reset({ name: '', email: '', password: '', role: 'STAFF' });
        this.load();
      },
      error: (error) => {
        const message = error?.error?.error ?? 'User could not be created.';
        this.snackBar.open(message, 'Dismiss', { duration: 4500 });
      },
    });
  }

  updateUser(user: User, patch: Partial<User>): void {
    this.api.updateUser(user.id, patch).subscribe({
      next: () => {
        this.snackBar.open('User updated.', 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: () => this.snackBar.open('User could not be updated.', 'Dismiss', { duration: 3500 }),
    });
  }

  resetPassword(user: User): void {
    const password = window.prompt(`New password for ${user.email}`);
    if (!password) return;

    this.api.updateUser(user.id, { password }).subscribe({
      next: () => {
        this.snackBar.open('Password reset. Existing sessions were revoked.', 'Dismiss', { duration: 3000 });
        this.load();
      },
      error: (error) => {
        const message = error?.error?.error ?? 'Password could not be reset.';
        this.snackBar.open(message, 'Dismiss', { duration: 4500 });
      },
    });
  }
}
