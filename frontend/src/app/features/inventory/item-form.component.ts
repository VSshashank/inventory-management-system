import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { Category, UnitOfMeasure } from '../../core/models';

@Component({
  selector: 'app-item-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ itemId ? 'Edit Item' : 'Add Item' }}</h1>
          <p class="muted">SKU, category, unit, and low-stock threshold</p>
        </div>
        <a mat-stroked-button routerLink="/inventory">
          <mat-icon>arrow_back</mat-icon>
          <span>Inventory</span>
        </a>
      </header>

      <form class="form-panel item-form" [formGroup]="form" (ngSubmit)="save()">
        @if (loading()) {
          <div class="empty-state"><mat-spinner diameter="32" /></div>
        } @else {
          <mat-form-field appearance="outline">
            <mat-label>SKU</mat-label>
            <input matInput formControlName="sku" />
            @if (form.controls.sku.invalid && form.controls.sku.touched) {
              <mat-error>SKU is required.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
            @if (form.controls.name.invalid && form.controls.name.touched) {
              <mat-error>Name is required.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="wide">
            <mat-label>Description</mat-label>
            <textarea matInput rows="3" formControlName="description"></textarea>
          </mat-form-field>

          <div class="field-with-action">
            <mat-form-field appearance="outline">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId">
                @for (category of categories(); track category.id) {
                  <mat-option [value]="category.id">{{ category.name }}</mat-option>
                }
              </mat-select>
              @if (form.controls.categoryId.invalid && form.controls.categoryId.touched) {
                <mat-error>Category is required.</mat-error>
              }
            </mat-form-field>
            <button mat-icon-button type="button" aria-label="Add category" (click)="addCategory()">
              <mat-icon>add</mat-icon>
            </button>
          </div>

          <div class="field-with-action">
            <mat-form-field appearance="outline">
              <mat-label>Unit</mat-label>
              <mat-select formControlName="unitId">
                @for (unit of units(); track unit.id) {
                  <mat-option [value]="unit.id">{{ unit.name }} ({{ unit.abbreviation }})</mat-option>
                }
              </mat-select>
              @if (form.controls.unitId.invalid && form.controls.unitId.touched) {
                <mat-error>Unit is required.</mat-error>
              }
            </mat-form-field>
            <button mat-icon-button type="button" aria-label="Add unit" (click)="addUnit()">
              <mat-icon>add</mat-icon>
            </button>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Low-stock threshold</mat-label>
            <input matInput type="number" min="0" step="0.001" formControlName="lowStockThreshold" />
          </mat-form-field>

          <div class="actions">
            <a mat-stroked-button routerLink="/inventory">Cancel</a>
            <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
              @if (saving()) {
                <mat-spinner diameter="18" />
              } @else {
                <mat-icon>save</mat-icon>
              }
              <span>Save</span>
            </button>
          </div>
        }
      </form>
    </section>
  `,
  styles: [
    `
      .item-form {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px;
        max-width: 920px;
      }

      .wide {
        grid-column: 1 / -1;
      }

      .field-with-action {
        display: grid;
        grid-template-columns: 1fr 44px;
        gap: 8px;
        align-items: start;
      }

      .field-with-action button {
        margin-top: 6px;
      }

      .actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }

      button mat-spinner,
      button mat-icon {
        margin-right: 8px;
      }

      @media (max-width: 760px) {
        .item-form {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ItemFormComponent {
  private readonly api = inject(InventoryApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly itemId = Number(this.route.snapshot.paramMap.get('id')) || null;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly categories = signal<Category[]>([]);
  readonly units = signal<UnitOfMeasure[]>([]);
  readonly form = new FormGroup({
    sku: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    categoryId: new FormControl<number | null>(null, Validators.required),
    unitId: new FormControl<number | null>(null, Validators.required),
    lowStockThreshold: new FormControl(10, { nonNullable: true, validators: [Validators.min(0)] }),
  });

  constructor() {
    this.loadLookups();

    if (this.itemId) {
      this.loading.set(true);
      this.api
        .item(this.itemId)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (response) => {
            this.form.patchValue({
              sku: response.data.sku,
              name: response.data.name,
              description: response.data.description ?? '',
              categoryId: response.data.categoryId,
              unitId: response.data.unitId,
              lowStockThreshold: response.data.lowStockThreshold,
            });
          },
          error: () => this.snackBar.open('Item could not be loaded.', 'Dismiss', { duration: 3500 }),
        });
    }
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload = {
      sku: value.sku,
      name: value.name,
      description: value.description || null,
      categoryId: Number(value.categoryId),
      unitId: Number(value.unitId),
      lowStockThreshold: value.lowStockThreshold,
    };

    this.saving.set(true);
    const request = this.itemId ? this.api.updateItem(this.itemId, payload) : this.api.createItem(payload);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (response) => {
        this.snackBar.open(`${response.data.name} saved.`, 'Dismiss', { duration: 2500 });
        void this.router.navigate(['/inventory', response.data.id]);
      },
      error: () => this.snackBar.open('Item could not be saved.', 'Dismiss', { duration: 3500 }),
    });
  }

  addCategory(): void {
    const name = window.prompt('Category name');
    if (!name?.trim()) return;

    this.api.createCategory(name.trim()).subscribe({
      next: (response) => {
        this.categories.update((categories) => [...categories, response.data].sort((a, b) => a.name.localeCompare(b.name)));
        this.form.controls.categoryId.setValue(response.data.id);
      },
      error: () => this.snackBar.open('Category could not be created.', 'Dismiss', { duration: 3500 }),
    });
  }

  addUnit(): void {
    const name = window.prompt('Unit name');
    if (!name?.trim()) return;
    const abbreviation = window.prompt('Unit abbreviation', name.trim());
    if (!abbreviation?.trim()) return;

    this.api.createUnit({ name: name.trim(), abbreviation: abbreviation.trim() }).subscribe({
      next: (response) => {
        this.units.update((units) => [...units, response.data].sort((a, b) => a.name.localeCompare(b.name)));
        this.form.controls.unitId.setValue(response.data.id);
      },
      error: () => this.snackBar.open('Unit could not be created.', 'Dismiss', { duration: 3500 }),
    });
  }

  private loadLookups(): void {
    this.api.categories().subscribe((response) => this.categories.set(response.data));
    this.api.units().subscribe((response) => this.units.set(response.data));
  }
}
