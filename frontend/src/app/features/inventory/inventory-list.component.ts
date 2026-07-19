import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import * as Papa from 'papaparse';
import { debounceTime, finalize, firstValueFrom, merge } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { Category, Item, UnitOfMeasure } from '../../core/models';
import { stockStatus } from '../../shared/stock-status';

interface CsvImportRow {
  name: string;
  sku: string;
  category: string;
  unit: string;
  openingStock: number;
  errors: string[];
}

@Component({
  selector: 'app-inventory-list',
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
    MatTableModule,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Inventory</h1>
          <p class="muted">{{ totalItems() }} active items</p>
        </div>
        <div class="toolbar-row">
          <button mat-stroked-button type="button" (click)="fileInput.click()">
            <mat-icon>upload_file</mat-icon>
            <span>Import CSV</span>
          </button>
          <input #fileInput hidden type="file" accept=".csv,text/csv" (change)="importCsv($event)" />
          <a mat-flat-button color="primary" routerLink="/inventory/new">
            <mat-icon>add</mat-icon>
            <span>Add Item</span>
          </a>
        </div>
      </header>

      <div class="toolbar-row filters">
        <mat-form-field appearance="outline">
          <mat-label>Search</mat-label>
          <input matInput [formControl]="searchControl" placeholder="SKU or name" />
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Category</mat-label>
          <mat-select [formControl]="categoryControl">
            <mat-option value="">All categories</mat-option>
            @for (category of categories(); track category.id) {
              <mat-option [value]="category.id">{{ category.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (importRows().length) {
        <section class="summary-panel import-preview">
          <div class="page-header">
            <div>
              <h2>CSV Preview</h2>
              <p class="muted">{{ validImportRows().length }} of {{ importRows().length }} rows ready</p>
            </div>
            <div class="toolbar-row">
              <button mat-stroked-button type="button" (click)="clearImport()">Cancel</button>
              <button mat-flat-button color="primary" type="button" [disabled]="hasImportErrors() || importing()" (click)="commitImport()">
                @if (importing()) {
                  <mat-spinner diameter="18" />
                } @else {
                  <mat-icon>done_all</mat-icon>
                }
                <span>Commit</span>
              </button>
            </div>
          </div>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th>Opening Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (row of importRows(); track row.sku + row.name) {
                  <tr>
                    <td>{{ row.sku }}</td>
                    <td>{{ row.name }}</td>
                    <td>{{ row.category }}</td>
                    <td>{{ row.unit }}</td>
                    <td>{{ row.openingStock }}</td>
                    <td [class.error-text]="row.errors.length">{{ row.errors.length ? row.errors.join(', ') : 'Ready' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </section>
      }

      <section class="table-panel">
        @if (loading()) {
          <div class="empty-state"><mat-spinner diameter="32" /></div>
        } @else if (!items().length) {
          <div class="empty-state">No items found.</div>
        } @else {
          <div class="table-wrap">
            <table mat-table [dataSource]="items()">
              <ng-container matColumnDef="sku">
                <th mat-header-cell *matHeaderCellDef>SKU</th>
                <td mat-cell *matCellDef="let item">{{ item.sku }}</td>
              </ng-container>

              <ng-container matColumnDef="name">
                <th mat-header-cell *matHeaderCellDef>Name</th>
                <td mat-cell *matCellDef="let item">
                  <a [routerLink]="['/inventory', item.id]">{{ item.name }}</a>
                  @if (item.description) {
                    <div class="muted compact">{{ item.description }}</div>
                  }
                </td>
              </ng-container>

              <ng-container matColumnDef="category">
                <th mat-header-cell *matHeaderCellDef>Category</th>
                <td mat-cell *matCellDef="let item">{{ item.category?.name }}</td>
              </ng-container>

              <ng-container matColumnDef="stock">
                <th mat-header-cell *matHeaderCellDef>Stock</th>
                <td mat-cell *matCellDef="let item">{{ item.currentStock }} {{ item.unit?.abbreviation }}</td>
              </ng-container>

              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let item">
                  @let status = stockStatus(item);
                  <span
                    class="status-badge"
                    [class.ok]="status.className === 'ok'"
                    [class.low]="status.className === 'low'"
                    [class.out]="status.className === 'out'"
                  >
                    <mat-icon>{{ status.icon }}</mat-icon>
                    <span>{{ status.label }}</span>
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let item" class="actions">
                  <a mat-icon-button [routerLink]="['/inventory', item.id, 'edit']" aria-label="Edit item">
                    <mat-icon>edit</mat-icon>
                  </a>
                  @if (auth.isAdmin()) {
                    <button mat-icon-button type="button" aria-label="Delete item" (click)="deleteItem(item)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  }
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
          </div>
        }
      </section>
    </section>
  `,
  styles: [
    `
      .filters mat-form-field {
        width: min(100%, 280px);
      }

      .compact {
        margin-top: 2px;
        font-size: 0.82rem;
      }

      .actions {
        width: 104px;
        white-space: nowrap;
        text-align: right;
      }

      .import-preview {
        display: grid;
        gap: 14px;
      }

      .import-preview h2 {
        margin: 0;
        color: #14213d;
        font-size: 1.1rem;
        letter-spacing: 0;
      }

      .import-preview table {
        width: 100%;
        border-collapse: collapse;
      }

      .import-preview th,
      .import-preview td {
        padding: 10px 12px;
        border-bottom: 1px solid #e2e8f0;
        text-align: left;
      }

      .error-text {
        color: #b42318;
        font-weight: 700;
      }

      a {
        color: #1769aa;
        font-weight: 700;
        text-decoration: none;
      }
    `,
  ],
})
export class InventoryListComponent {
  readonly auth = inject(AuthService);
  readonly stockStatus = stockStatus;
  readonly columns = ['sku', 'name', 'category', 'stock', 'status', 'actions'];
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly categoryControl = new FormControl<number | ''>('', { nonNullable: true });
  readonly items = signal<Item[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly units = signal<UnitOfMeasure[]>([]);
  readonly totalItems = signal(0);
  readonly loading = signal(false);
  readonly importRows = signal<CsvImportRow[]>([]);
  readonly importing = signal(false);

  private readonly api = inject(InventoryApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.loadCategories();
    this.loadUnits();
    this.loadItems();

    merge(this.searchControl.valueChanges, this.categoryControl.valueChanges)
      .pipe(debounceTime(250), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadItems());
  }

  validImportRows(): CsvImportRow[] {
    return this.importRows().filter((row) => row.errors.length === 0);
  }

  hasImportErrors(): boolean {
    return this.importRows().some((row) => row.errors.length > 0);
  }

  loadItems(): void {
    this.loading.set(true);
    this.api
      .items({
        search: this.searchControl.value,
        categoryId: this.categoryControl.value || null,
        pageSize: 100,
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.items.set(response.data);
          this.totalItems.set(response.pagination.total);
        },
        error: () => this.snackBar.open('Inventory could not be loaded.', 'Dismiss', { duration: 3500 }),
      });
  }

  loadCategories(): void {
    this.api.categories().subscribe((response) => this.categories.set(response.data));
  }

  loadUnits(): void {
    this.api.units().subscribe((response) => this.units.set(response.data));
  }

  deleteItem(item: Item): void {
    if (!window.confirm(`Delete ${item.name}?`)) {
      return;
    }

    this.api.deleteItem(item.id).subscribe({
      next: () => {
        this.snackBar.open(`${item.name} deleted.`, 'Dismiss', { duration: 2500 });
        this.loadItems();
      },
      error: () => this.snackBar.open('Item could not be deleted.', 'Dismiss', { duration: 3500 }),
    });
  }

  importCsv(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data.map((rawRow) => this.normalizeCsvRow(rawRow));
        this.importRows.set(rows);
        input.value = '';
      },
      error: () => {
        this.snackBar.open('CSV could not be read.', 'Dismiss', { duration: 3500 });
        input.value = '';
      },
    });
  }

  clearImport(): void {
    this.importRows.set([]);
  }

  async commitImport(): Promise<void> {
    const rows = this.validImportRows();
    const categoryMap = new Map(this.categories().map((category) => [category.name.toLowerCase(), category]));
    const unitMap = new Map<string, UnitOfMeasure>();

    for (const unit of this.units()) {
      unitMap.set(unit.name.toLowerCase(), unit);
      unitMap.set(unit.abbreviation.toLowerCase(), unit);
    }

    this.importing.set(true);

    try {
      for (const row of rows) {
        const category = await this.ensureCategory(row.category, categoryMap);
        const unit = await this.ensureUnit(row.unit, unitMap);
        await firstValueFrom(
          this.api.createItem({
            name: row.name,
            sku: row.sku,
            categoryId: category.id,
            unitId: unit.id,
            currentStock: row.openingStock,
            lowStockThreshold: 10,
          }),
        );
      }

      this.snackBar.open(`${rows.length} items imported.`, 'Dismiss', { duration: 3000 });
      this.clearImport();
      this.loadCategories();
      this.loadUnits();
      this.loadItems();
    } catch {
      this.snackBar.open('Import stopped because one row could not be saved.', 'Dismiss', { duration: 4000 });
    } finally {
      this.importing.set(false);
    }
  }

  private normalizeCsvRow(rawRow: Record<string, string>): CsvImportRow {
    const row = {
      name: (rawRow['name'] ?? '').trim(),
      sku: (rawRow['sku'] ?? '').trim(),
      category: (rawRow['category'] ?? '').trim(),
      unit: (rawRow['unit'] ?? '').trim(),
      openingStock: Number((rawRow['openingStock'] ?? '0').trim()),
      errors: [] as string[],
    };

    if (!row.name) row.errors.push('name missing');
    if (!row.sku) row.errors.push('sku missing');
    if (!row.category) row.errors.push('category missing');
    if (!row.unit) row.errors.push('unit missing');
    if (!Number.isFinite(row.openingStock)) row.errors.push('openingStock invalid');

    return row;
  }

  private async ensureCategory(name: string, categoryMap: Map<string, Category>): Promise<Category> {
    const key = name.toLowerCase();
    const existing = categoryMap.get(key);

    if (existing) {
      return existing;
    }

    const created = await firstValueFrom(this.api.createCategory(name));
    categoryMap.set(key, created.data);
    return created.data;
  }

  private async ensureUnit(value: string, unitMap: Map<string, UnitOfMeasure>): Promise<UnitOfMeasure> {
    const key = value.toLowerCase();
    const existing = unitMap.get(key);

    if (existing) {
      return existing;
    }

    const created = await firstValueFrom(this.api.createUnit({ name: value, abbreviation: value }));
    unitMap.set(created.data.name.toLowerCase(), created.data);
    unitMap.set(created.data.abbreviation.toLowerCase(), created.data);
    return created.data;
  }
}
