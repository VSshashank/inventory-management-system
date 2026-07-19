import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { SummaryReport } from '../../core/models';
import { stockStatus } from '../../shared/stock-status';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, MatIconModule, BaseChartDirective],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>Dashboard</h1>
          <p class="muted">Current stock, low-stock pressure, and recent movement</p>
        </div>
      </header>

      @if (summary()) {
        @let data = summary()!;
        <section class="metric-grid">
          <article><span>Total Items</span><strong>{{ data.totalItems }}</strong></article>
          <article><span>Low Stock</span><strong>{{ data.lowStockCount }}</strong></article>
          <article><span>Inventory Value</span><strong>{{ data.totalInventoryValue | currency }}</strong></article>
          <article><span>Today</span><strong>{{ data.todayTransactionCount }}</strong></article>
        </section>

        <section class="summary-panel chart-panel">
          <h2>Current Stock by Item</h2>
          <canvas baseChart [data]="chartData()" [options]="chartOptions" [type]="'bar'"></canvas>
        </section>

        <section class="table-panel">
          <div class="section-title"><h2>Recent Activity</h2></div>
          <div class="table-wrap recent">
            @for (transaction of data.recentTransactions; track transaction.id) {
              <div class="activity-row">
                <mat-icon>{{ transaction.type === 'SALE' ? 'point_of_sale' : transaction.type === 'STOCK_IN' ? 'move_to_inbox' : 'tune' }}</mat-icon>
                <div>
                  <strong>{{ transaction.item?.name }}</strong>
                  <span class="muted">{{ transaction.type }} · {{ transaction.quantity }} · {{ transaction.transactionDate | date:'medium' }}</span>
                </div>
              </div>
            }
          </div>
        </section>
      }
    </section>
  `,
  styles: [`
    .metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
    .metric-grid article { border: 1px solid #d9e2ec; border-radius: 8px; background: #fff; padding: 18px; }
    .metric-grid span { display:block; color:#64748b; font-size:.84rem; margin-bottom:8px; }
    .metric-grid strong { color:#14213d; font-size:1.6rem; }
    .chart-panel { display:grid; gap:14px; }
    .chart-panel h2, .section-title h2 { margin:0; color:#14213d; font-size:1.1rem; letter-spacing:0; }
    .chart-panel canvas { max-height:360px; }
    .section-title { padding:16px 20px 0; }
    .recent { padding: 10px 20px 20px; display:grid; gap:10px; }
    .activity-row { display:flex; gap:12px; align-items:center; border-bottom:1px solid #e2e8f0; padding:10px 0; }
    .activity-row mat-icon { color:#1769aa; }
    .activity-row span { display:block; margin-top:2px; }
    @media (max-width: 900px) { .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 560px) { .metric-grid { grid-template-columns: 1fr; } }
  `],
})
export class DashboardComponent {
  readonly summary = signal<SummaryReport | null>(null);
  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} units · ${context.dataset.label ?? ''}`,
        },
      },
    },
  };
  readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const items = this.summary()?.stockByItem ?? [];
    return {
      labels: items.map((item) => item.name),
      datasets: [{
        label: 'Current stock',
        data: items.map((item) => item.currentStock),
        backgroundColor: items.map((item) => {
          const status = stockStatus(item);
          if (status.className === 'out') return '#d92d20';
          if (status.className === 'low') return '#f79009';
          return '#2e7d32';
        }),
      }],
    };
  });

  private readonly api = inject(InventoryApiService);

  constructor() {
    this.api.summary().subscribe((response) => this.summary.set(response.data));
  }
}
