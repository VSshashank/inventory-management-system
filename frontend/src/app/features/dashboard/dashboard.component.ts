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
          <p class="page-kicker">OVERVIEW / {{ today | date: 'yyyy-MM-dd' }}</p>
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
        <section class="control-line" [class.requires-attention]="data.lowStockCount > 0">
          <div class="control-line-main">
            <span class="control-indicator">LIVE</span>
            <strong>{{ data.lowStockCount > 0 ? 'Replenishment review required' : 'Inventory position is within target' }}</strong>
            <span>{{ data.lowStockCount > 0 ? data.lowStockCount + ' item' + (data.lowStockCount === 1 ? '' : 's') + ' reached a low-stock threshold.' : 'No stock alerts need action right now.' }}</span>
          </div>
          <a routerLink="/inventory">{{ data.lowStockCount > 0 ? 'Review inventory' : 'View catalog' }}</a>
        </section>

        <section class="metric-rack" aria-label="Inventory summary">
          <article>
            <span class="metric-order">01</span>
            <span class="metric-label">Items tracked</span>
            <strong>{{ data.totalItems }}</strong>
            <small>Active catalog records</small>
          </article>
          <article [class.is-alert]="data.lowStockCount > 0">
            <span class="metric-order">02</span>
            <span class="metric-label">Low stock</span>
            <strong>{{ data.lowStockCount }}</strong>
            <small>{{ data.lowStockCount > 0 ? 'Requires review' : 'No active alerts' }}</small>
          </article>
          <article>
            <span class="metric-order">03</span>
            <span class="metric-label">Inventory value</span>
            <strong>{{ data.totalInventoryValue | currency }}</strong>
            <small>Current on-hand value</small>
          </article>
          <article>
            <span class="metric-order">04</span>
            <span class="metric-label">Today&apos;s movements</span>
            <strong>{{ data.todayTransactionCount }}</strong>
            <small>Recorded by your team</small>
          </article>
        </section>

        <section class="dashboard-grid">
          <section class="table-panel chart-panel">
            <div class="panel-heading">
              <div>
                <p class="section-kicker">STOCK POSITION</p>
                <h2>Units on hand</h2>
              </div>
              <span class="panel-reference">CHART / 01</span>
            </div>
            <div class="chart-area">
              <canvas baseChart [data]="chartData()" [options]="chartOptions" [type]="'bar'"></canvas>
            </div>
          </section>

          <section class="table-panel activity-panel">
            <div class="panel-heading">
              <div>
                <p class="section-kicker">ACTIVITY LOG</p>
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
                      <span>{{ movementLabel(transaction) }} / {{ transaction.quantity }} units</span>
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
        min-height: 58px;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 11px 14px;
        border: 1px solid var(--line-strong);
        border-left: 4px solid var(--brand);
        background: var(--surface);
      }

      .control-line.requires-attention {
        border-left-color: var(--amber);
      }

      .control-line-main {
        display: flex;
        min-width: 0;
        align-items: center;
        gap: 10px;
      }

      .control-indicator,
      .panel-reference {
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.63rem;
        font-weight: 500;
      }

      .control-indicator {
        padding: 4px 5px;
        border: 1px solid var(--line-strong);
        color: var(--brand-strong);
      }

      .requires-attention .control-indicator {
        color: #7d5600;
      }

      .control-line strong {
        color: var(--ink-strong);
        font-size: 0.81rem;
        font-weight: 700;
        white-space: nowrap;
      }

      .control-line-main > span:last-child {
        overflow: hidden;
        color: var(--muted);
        font-size: 0.77rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .control-line > a,
      .view-all {
        flex: 0 0 auto;
        color: var(--ink-strong);
        font-family: var(--font-mono);
        font-size: 0.67rem;
        font-weight: 500;
        text-decoration: underline;
        text-underline-offset: 3px;
      }

      .metric-rack {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        border: 1px solid var(--line-strong);
        background: var(--surface);
      }

      .metric-rack article {
        display: grid;
        min-width: 0;
        min-height: 132px;
        align-content: start;
        padding: 16px 17px;
        border-left: 1px solid var(--line);
      }

      .metric-rack article:first-child {
        border-left: 0;
      }

      .metric-rack article.is-alert {
        background: var(--amber-soft);
      }

      .metric-order {
        color: var(--muted);
        font-family: var(--font-mono);
        font-size: 0.64rem;
      }

      .metric-label {
        margin-top: 14px;
        color: var(--muted);
        font-size: 0.73rem;
        font-weight: 600;
      }

      .metric-rack strong {
        display: block;
        overflow: hidden;
        margin-top: 4px;
        color: var(--ink-strong);
        font-size: clamp(1.3rem, 1.9vw, 1.7rem);
        font-weight: 700;
        line-height: 1.15;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .metric-rack small {
        margin-top: 6px;
        color: var(--muted);
        font-size: 0.69rem;
        line-height: 1.35;
      }

      .dashboard-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.8fr);
        gap: 18px;
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
        background: var(--amber-soft);
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
        font-weight: 700;
        line-height: 1.35;
      }

      .activity-copy span,
      time {
        margin-top: 2px;
        color: var(--muted);
        font-family: var(--font-mono);
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

        .metric-rack article:nth-child(3) {
          border-left: 0;
          border-top: 1px solid var(--line);
        }

        .metric-rack article:nth-child(4) {
          border-top: 1px solid var(--line);
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

        .metric-rack {
          grid-template-columns: 1fr;
        }

        .metric-rack article,
        .metric-rack article:nth-child(3),
        .metric-rack article:nth-child(4) {
          min-height: 108px;
          border-top: 1px solid var(--line);
          border-left: 0;
        }

        .metric-rack article:first-child {
          border-top: 0;
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
        backgroundColor: '#202520',
        titleColor: '#ffffff',
        bodyColor: '#e7ece7',
        displayColors: false,
        padding: 10,
        callbacks: {
          label: (context) => `${context.parsed.y} units`,
        },
      },
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: '#667269', font: { family: 'IBM Plex Sans', size: 11 } },
      },
      y: {
        beginAtZero: true,
        border: { display: false },
        grid: { color: '#e1e7e0' },
        ticks: { color: '#667269', font: { family: 'IBM Plex Sans', size: 11 } },
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
          borderRadius: 1,
          borderSkipped: false,
          backgroundColor: items.map((item) => {
            const status = stockStatus(item);
            if (status.className === 'out') return '#c94f3e';
            if (status.className === 'low') return '#c88a16';
            return '#226f67';
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
