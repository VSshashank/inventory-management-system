import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { SalesReport, VelocityReportRow } from '../../core/models';

type Preset = '7' | '30' | 'month' | 'year' | 'all' | 'custom';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [
    CurrencyPipe,
    DecimalPipe,
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
          <h1>Reports</h1>
          <p class="muted">Sales, profit, stock velocity, and Excel export</p>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="downloadExcel()">
          <mat-icon>download</mat-icon>
          <span>Export Excel</span>
        </button>
      </header>

      <form class="summary-panel range-form" [formGroup]="rangeForm">
        <mat-form-field appearance="outline">
          <mat-label>Range</mat-label>
          <mat-select formControlName="preset" (selectionChange)="applyPreset()">
            <mat-option value="7">Last 7 days</mat-option>
            <mat-option value="30">Last 30 days</mat-option>
            <mat-option value="month">This month</mat-option>
            <mat-option value="year">This year</mat-option>
            <mat-option value="all">All time</mat-option>
            <mat-option value="custom">Custom</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Start</mat-label>
          <input matInput type="date" formControlName="start" />
        </mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>End</mat-label>
          <input matInput type="date" formControlName="end" />
        </mat-form-field>
        <button mat-stroked-button type="button" (click)="load()">Apply</button>
      </form>

      @if (sales()) {
        @let report = sales()!;
        <section class="metric-rack report-rack" aria-label="Report summary">
          <article><span>Revenue</span><strong class="stat-value">{{ report.totals.revenue | currency }}</strong><small>Sales in selected range</small></article>
          <article><span>Cost</span><strong class="stat-value">{{ report.totals.cost | currency }}</strong><small>Cost of goods sold</small></article>
          <article><span>Profit</span><strong class="stat-value">{{ report.totals.profit | currency }}</strong><small>Gross profit</small></article>
          <article><span>Margin</span><strong class="stat-value">{{ report.totals.profitMargin | number:'1.1-1' }}%</strong><small>Gross profit margin</small></article>
        </section>

        <section class="table-panel">
          <div class="section-title"><h2>Sales & Profit</h2></div>
          <div class="table-wrap">
            <table mat-table [dataSource]="report.breakdown">
              <ng-container matColumnDef="sku"><th mat-header-cell *matHeaderCellDef>SKU</th><td mat-cell *matCellDef="let row">{{ row.sku }}</td></ng-container>
              <ng-container matColumnDef="name"><th mat-header-cell *matHeaderCellDef>Item</th><td mat-cell *matCellDef="let row">{{ row.name }}</td></ng-container>
              <ng-container matColumnDef="quantitySold"><th mat-header-cell *matHeaderCellDef>Sold</th><td mat-cell *matCellDef="let row">{{ row.quantitySold }}</td></ng-container>
              <ng-container matColumnDef="revenue"><th mat-header-cell *matHeaderCellDef>Revenue</th><td mat-cell *matCellDef="let row">{{ row.revenue | currency }}</td></ng-container>
              <ng-container matColumnDef="profit"><th mat-header-cell *matHeaderCellDef>Profit</th><td mat-cell *matCellDef="let row">{{ row.profit | currency }}</td></ng-container>
              <tr mat-header-row *matHeaderRowDef="salesColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: salesColumns"></tr>
            </table>
          </div>
        </section>
      }

      <section class="table-panel">
        <div class="section-title"><h2>Stock Velocity</h2></div>
        <div class="table-wrap">
          <table mat-table [dataSource]="velocity()">
            <ng-container matColumnDef="item"><th mat-header-cell *matHeaderCellDef>Item</th><td mat-cell *matCellDef="let row">{{ row.item.name }}</td></ng-container>
            <ng-container matColumnDef="rate"><th mat-header-cell *matHeaderCellDef>Daily Sales</th><td mat-cell *matCellDef="let row">{{ row.averageDailySalesRate | number:'1.2-2' }}</td></ng-container>
            <ng-container matColumnDef="days"><th mat-header-cell *matHeaderCellDef>Days Left</th><td mat-cell *matCellDef="let row" [class.alert]="row.daysUntilStockOut !== null && row.daysUntilStockOut < 7">{{ row.daysUntilStockOut === null ? 'No recent sales' : (row.daysUntilStockOut | number:'1.0-0') }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="velocityColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: velocityColumns"></tr>
          </table>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .range-form {
      display:flex;
      align-items:center;
      gap:12px;
      flex-wrap:wrap;
    }
    .range-form mat-form-field {
      width: 180px;
      margin-bottom: -18px;
    }
    .metric-rack {
      display:grid;
      grid-template-columns:repeat(4, minmax(0, 1fr));
      gap:16px;
    }
    .metric-rack article {
      display:grid;
      min-width:0;
      align-content:start;
      padding:18px 20px;
      border:1px solid var(--line);
      border-radius:var(--radius-lg);
      background:var(--surface);
      box-shadow:var(--shadow-xs);
    }
    .metric-rack article > span {
      color:var(--muted);
      font-size:.8125rem;
      font-weight:500;
    }
    .metric-rack strong {
      display:block;
      overflow:hidden;
      margin-top:8px;
      color:var(--ink-strong);
      font-size:1.75rem;
      font-weight:600;
      letter-spacing:-.02em;
      line-height:1.15;
      text-overflow:ellipsis;
      white-space:nowrap;
    }
    .metric-rack small {
      margin-top:6px;
      color:var(--subtle);
      font-size:.8125rem;
      line-height:1.4;
    }
    .alert { color:var(--danger); font-weight:600; }
    @media (max-width: 900px) {
      .metric-rack { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .metric-rack { grid-template-columns: 1fr; }
      .range-form mat-form-field { width:100%; }
    }
  `],
})
export class ReportsComponent {
  readonly salesColumns = ['sku', 'name', 'quantitySold', 'revenue', 'profit'];
  readonly velocityColumns = ['item', 'rate', 'days'];
  readonly sales = signal<SalesReport | null>(null);
  readonly velocity = signal<VelocityReportRow[]>([]);
  readonly rangeForm = new FormGroup({
    preset: new FormControl<Preset>('30', { nonNullable: true }),
    start: new FormControl('', { nonNullable: true }),
    end: new FormControl('', { nonNullable: true }),
  });

  private readonly api = inject(InventoryApiService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    this.applyPreset();
  }

  applyPreset(): void {
    const preset = this.rangeForm.controls.preset.value;
    const now = new Date();
    const start = new Date(now);

    if (preset === '7' || preset === '30') {
      start.setDate(now.getDate() - Number(preset));
      this.rangeForm.patchValue({ start: this.toDateInput(start), end: this.toDateInput(now) });
    } else if (preset === 'month') {
      this.rangeForm.patchValue({ start: this.toDateInput(new Date(now.getFullYear(), now.getMonth(), 1)), end: this.toDateInput(now) });
    } else if (preset === 'year') {
      this.rangeForm.patchValue({ start: this.toDateInput(new Date(now.getFullYear(), 0, 1)), end: this.toDateInput(now) });
    } else if (preset === 'all') {
      this.rangeForm.patchValue({ start: '', end: '' });
    }

    if (preset !== 'custom') this.load();
  }

  load(): void {
    this.api.sales(this.query()).subscribe((response) => this.sales.set(response.data));
    this.api.velocity().subscribe((response) => this.velocity.set(response.data));
  }

  downloadExcel(): void {
    this.api.excel(this.query()).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'inventory-report.xlsx';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Excel export failed.', 'Dismiss', { duration: 3500 }),
    });
  }

  private query(): Record<string, string | null> {
    return {
      start: this.rangeForm.controls.start.value || null,
      end: this.rangeForm.controls.end.value || null,
    };
  }

  private toDateInput(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
