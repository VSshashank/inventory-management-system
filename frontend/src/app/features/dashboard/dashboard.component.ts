import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { InventoryTransaction, SummaryReport } from '../../core/models';
import { stockStatus } from '../../shared/stock-status';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, MatButtonModule, MatIconModule, BaseChartDirective],
  // Chart.js v4 registers no controllers, elements or scales by default; without
  // this the bar chart throws `"category" is not a registered scale` and renders
  // an empty panel. Declaring it here keeps Chart.js in this lazy route's chunk.
  providers: [provideCharts(withDefaultRegisterables())],
  template: `
    <section class="page dashboard-page">
      <header class="page-header dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Track stock position, replenishment pressure, and movement in one place.</p>
        </div>
        <div class="toolbar-row">
          <a mat-stroked-button routerLink="/reports">
            <mat-icon>query_stats</mat-icon>
            <span>Reports</span>
          </a>
          <a mat-flat-button color="primary" routerLink="/transactions/new">
            <mat-icon>add</mat-icon>
            <span>Record movement</span>
          </a>
        </div>
      </header>

      @if (summary()) {
        @let data = summary()!;
        <!-- Only worth a banner when something actually needs doing; an
             everything-is-fine bar is just noise on every visit. -->
        @if (data.lowStockCount > 0) {
          <section class="control-line requires-attention">
            <div class="control-line-main">
              <mat-icon>warning</mat-icon>
              <strong>Replenishment needed</strong>
              <span>
                {{ data.lowStockCount }} item{{ data.lowStockCount === 1 ? '' : 's' }} fell to or below
                the reorder threshold.
              </span>
            </div>
            <a routerLink="/inventory">Review inventory</a>
          </section>
        }

        <section class="metric-rack" aria-label="Inventory summary">
          <article>
            <span class="metric-label">Items tracked</span>
            <strong class="stat-value">{{ data.totalItems }}</strong>
            <small>Active catalog records</small>
          </article>
          <article [class.is-alert]="data.lowStockCount > 0">
            <span class="metric-label">Low stock</span>
            <strong class="stat-value">{{ data.lowStockCount }}</strong>
            <small>{{ data.lowStockCount > 0 ? 'Requires review' : 'No active alerts' }}</small>
          </article>
          <article>
            <span class="metric-label">Inventory value</span>
            <strong class="stat-value">{{ data.totalInventoryValue | currency }}</strong>
            <small>Current on-hand value</small>
          </article>
          <article>
            <span class="metric-label">Today&apos;s movements</span>
            <strong class="stat-value">{{ data.todayTransactionCount }}</strong>
            <small>Recorded by your team</small>
          </article>
        </section>

        <section class="dashboard-grid">
          <section class="table-panel chart-panel">
            <div class="panel-heading">
              <div>
                <h2>Units on hand</h2>
                <p>Current stock across tracked items</p>
              </div>
            </div>
            <div class="chart-area">
              <canvas baseChart [data]="chartData()" [options]="chartOptions" [type]="'bar'"></canvas>
            </div>
          </section>

          <section class="table-panel activity-panel">
            <div class="panel-heading">
              <div>
                <h2>Latest movement</h2>
              </div>
              <a routerLink="/transactions" class="view-all">All records</a>
            </div>
            <div class="activity-list">
              @if (data.recentTransactions.length) {
                @for (transaction of data.recentTransactions; track transaction.id) {
                  <div class="activity-row">
                    <span class="movement-token" [class.sale]="transaction.type === 'SALE'" [class.stock-in]="transaction.type === 'STOCK_IN'" [class.adjustment]="transaction.type === 'ADJUSTMENT'">
                      <mat-icon>{{ movementIcon(transaction) }}</mat-icon>
                    </span>
                    <div class="activity-copy">
                      <strong>{{ transaction.item?.name }}</strong>
                      <span>{{ movementLabel(transaction) }} &middot; {{ transaction.quantity }} units</span>
                    </div>
                    <time>{{ transaction.transactionDate | date: 'MMM d, h:mm a' }}</time>
                  </div>
                }
              } @else {
                <div class="empty-state">New inventory records will appear here.</div>
              }
            </div>
          </section>
        </section>
      }
    </section>
  `,
  styles: [
    `
      .dashboard-page {
        gap: 24px;
      }

      .control-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 13px 16px;
        border: 1px solid var(--warn-line);
        border-radius: var(--radius-lg);
        background: var(--warn-soft);
      }

      .control-line-main {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 10px;
      }

      .control-line-main mat-icon {
        width: 19px;
        height: 19px;
        flex: 0 0 auto;
        color: var(--warn);
        font-size: 19px;
      }

      .control-line strong {
        color: #7a2e0e;
        font-size: 0.875rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .control-line-main > span:last-child {
        overflow: hidden;
        color: var(--warn);
        font-size: 0.875rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .control-line > a {
        flex: 0 0 auto;
        color: #7a2e0e;
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
      }

      .control-line > a:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      .view-all {
        flex: 0 0 auto;
        color: var(--brand-strong);
        font-size: 0.8125rem;
        font-weight: 500;
        text-decoration: none;
      }

      .view-all:hover {
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      .metric-rack {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 16px;
      }

      .metric-rack article {
        display: grid;
        min-width: 0;
        align-content: start;
        padding: 18px 20px;
        border: 1px solid var(--line);
        border-radius: var(--radius-lg);
        background: var(--surface);
        box-shadow: var(--shadow-xs);
      }

      .metric-rack article.is-alert {
        border-color: var(--warn-line);
        background: var(--warn-soft);
      }

      .metric-label {
        color: var(--muted);
        font-size: 0.8125rem;
        font-weight: 500;
      }

      .metric-rack strong {
        display: block;
        overflow: hidden;
        margin-top: 8px;
        color: var(--ink-strong);
        font-size: 1.75rem;
        font-weight: 600;
        letter-spacing: -0.02em;
        line-height: 1.15;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .metric-rack small {
        margin-top: 6px;
        color: var(--subtle);
        font-size: 0.8125rem;
        line-height: 1.4;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.25fr) minmax(340px, 0.75fr);
        gap: 16px;
      }

      .chart-panel,
      .activity-panel {
        min-height: 380px;
      }

      .chart-area {
        height: 298px;
        padding: 18px 20px 20px;
      }

      .activity-list {
        padding: 0 20px;
      }

      .activity-row {
        display: grid;
        min-height: 65px;
        align-items: center;
        grid-template-columns: 28px minmax(0, 1fr) auto;
        gap: 10px;
        border-bottom: 1px solid var(--line);
      }

      .activity-row:last-child {
        border-bottom: 0;
      }

      .movement-token {
        display: grid;
        width: 24px;
        height: 24px;
        place-items: center;
        background: var(--surface-strong);
        color: var(--muted);
      }

      .movement-token mat-icon {
        width: 15px;
        height: 15px;
        font-size: 15px;
      }

      .movement-token.stock-in {
        background: var(--brand-soft);
        color: var(--brand-strong);
      }

      .movement-token.sale {
        background: var(--info-soft);
        color: #4356af;
      }

      .movement-token.adjustment {
        background: var(--warn-soft);
        color: #7d5600;
      }

      .activity-copy {
        min-width: 0;
      }

      .activity-copy strong,
      .activity-copy span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .activity-copy strong {
        color: var(--ink-strong);
        font-size: 0.78rem;
        font-weight: 600;
        line-height: 1.35;
      }

      .activity-copy span,
      time {
        margin-top: 2px;
        color: var(--muted);
        font-size: 0.62rem;
        line-height: 1.35;
      }

      time {
        margin: 0;
        white-space: nowrap;
      }

      @media (max-width: 1120px) {
        .metric-rack {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .dashboard-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 720px) {
        .control-line,
        .control-line-main {
          align-items: flex-start;
        }

        .control-line {
          display: grid;
        }

        .control-line-main {
          display: grid;
        }

        .control-line-main > span:last-child {
          overflow: visible;
          white-space: normal;
        }

        /* Two up rather than one: these values are short, and a single
           column pushes the chart below a full screen of scrolling. */
        .metric-rack {
          gap: 12px;
        }

        .metric-rack article {
          padding: 14px 16px;
        }

        .metric-rack strong {
          font-size: 1.375rem;
        }

        .chart-area,
        .activity-list {
          padding-right: 16px;
          padding-left: 16px;
        }

        .activity-row {
          grid-template-columns: 28px minmax(0, 1fr);
          padding: 8px 0;
        }

        time {
          grid-column: 2;
          margin-top: -12px;
        }
      }
    `,
  ],
})
export class DashboardComponent {
  readonly summary = signal<SummaryReport | null>(null);
  readonly today = new Date();
  readonly chartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f1729',
        titleColor: '#ffffff',
        bodyColor: '#d5dae5',
        displayColors: false,
        cornerRadius: 8,
        padding: 10,
        titleFont: { family: 'Inter', size: 12, weight: 600 },
        bodyFont: { family: 'Inter', size: 12 },
        callbacks: {
          label: (context) => `${context.parsed.y} units`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: '#667085', font: { family: 'Inter', size: 11 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#eceef2' },
        ticks: { color: '#667085', font: { family: 'Inter', size: 11 }, padding: 6 },
      },
    },
  };
  readonly chartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const items = this.summary()?.stockByItem ?? [];
    return {
      labels: items.map((item) => item.name),
      datasets: [
        {
          label: 'Current stock',
          data: items.map((item) => item.currentStock),
          borderRadius: 6,
          borderSkipped: false,
          maxBarThickness: 56,
          backgroundColor: items.map((item) => {
            const status = stockStatus(item);
            if (status.className === 'out') return '#e5484d';
            if (status.className === 'low') return '#f5a524';
            return '#2563eb';
          }),
        },
      ],
    };
  });

  private readonly api = inject(InventoryApiService);

  constructor() {
    this.api.summary().subscribe((response) => this.summary.set(response.data));
  }

  movementIcon(transaction: InventoryTransaction): string {
    if (transaction.type === 'SALE') return 'north_east';
    if (transaction.type === 'STOCK_IN') return 'south_west';
    return 'tune';
  }

  movementLabel(transaction: InventoryTransaction): string {
    if (transaction.type === 'SALE') return 'Sale recorded';
    if (transaction.type === 'STOCK_IN') return 'Stock received';
    return 'Stock adjusted';
  }
}
