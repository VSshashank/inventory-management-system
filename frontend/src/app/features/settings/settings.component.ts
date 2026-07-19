import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { InventoryApiService } from '../../core/inventory-api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Settings</h1>
          <p class="muted">Business profile, currency, and stock defaults</p>
        </div>
      </header>

      <form class="form-panel settings-form" [formGroup]="form" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>Business name</mat-label>
          <input matInput formControlName="businessName" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Currency symbol</mat-label>
          <input matInput formControlName="currencySymbol" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Default low-stock threshold</mat-label>
          <input matInput type="number" min="0" step="0.001" formControlName="defaultLowStockThreshold" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Date format</mat-label>
          <input matInput formControlName="dateFormat" />
        </mat-form-field>

        <div class="actions">
          <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving()">
            @if (saving()) {
              <mat-icon>hourglass_empty</mat-icon>
            } @else {
              <mat-icon>save</mat-icon>
            }
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [
    `
      .settings-form {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        max-width: 860px;
      }

      .actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
      }

      button mat-icon {
        margin-right: 8px;
      }

      @media (max-width: 720px) {
        .settings-form {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SettingsComponent {
  readonly saving = signal(false);
  readonly form = new FormGroup({
    businessName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    currencySymbol: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    defaultLowStockThreshold: new FormControl(10, { nonNullable: true, validators: [Validators.required, Validators.min(0)] }),
    dateFormat: new FormControl('yyyy-MM-dd', { nonNullable: true, validators: [Validators.required] }),
  });

  private readonly api = inject(InventoryApiService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    this.api.settings().subscribe({
      next: (response) => this.form.patchValue(response.data),
      error: () => this.snackBar.open('Settings could not be loaded.', 'Dismiss', { duration: 3500 }),
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.api
      .updateSettings(this.form.getRawValue())
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.snackBar.open('Settings saved.', 'Dismiss', { duration: 2500 }),
        error: () => this.snackBar.open('Settings could not be saved.', 'Dismiss', { duration: 3500 }),
      });
  }
}
