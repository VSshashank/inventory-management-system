import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { finalize } from 'rxjs';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { InventoryTransaction, Item } from '../../core/models';
import { stockStatus } from '../../shared/stock-status';

@Component({
  selector: 'app-item-detail',
  standalone: true,
  imports: [
    DatePipe,
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <h1>{{ item()?.name || 'Item Detail' }}</h1>
          @if (item()) {
            <p class="muted">{{ item()?.sku }} · {{ item()?.category?.name }}</p>
          }
        </div>
        <div class="toolbar-row">
          <a mat-stroked-button routerLink="/inventory">
            <mat-icon>arrow_back</mat-icon>
            <span>Inventory</span>
          </a>
          @if (item()) {
            <a mat-flat-button color="primary" [routerLink]="['/inventory', item()?.id, 'edit']">
              <mat-icon>edit</mat-icon>
              <span>Edit</span>
            </a>
          }
        </div>
      </header>

      @if (loading()) {
        <section class="summary-panel empty-state"><mat-spinner diameter="32" /></section>
      } @else if (item()) {
        @let currentItem = item()!;
        @let status = stockStatus(currentItem);
        <section class="summary-panel item-summary">
          <div>
            <span class="label">Current Stock</span>
            <strong>{{ currentItem.currentStock }} {{ currentItem.unit?.abbreviation }}</strong>
          </div>
          <div>
            <span class="label">Low Threshold</span>
            <strong>{{ currentItem.lowStockThreshold }} {{ currentItem.unit?.abbreviation }}</strong>
          </div>
          <div>
            <span class="label">Status</span>
            <span
              class="status-badge"
              [class.ok]="status.className === 'ok'"
              [class.low]="status.className === 'low'"
              [class.out]="status.className === 'out'"
            >
              <mat-icon>{{ status.icon }}</mat-icon>
              <span>{{ status.label }}</span>
            </span>
          </div>
        </section>

        <section class="table-panel">
          <div class="section-title">
            <h2>Transaction History</h2>
          </div>
          @if (!history().length) {
            <div class="empty-state">No transactions yet.</div>
          } @else {
            <div class="table-wrap">
              <table mat-table [dataSource]="history()">
                <ng-container matColumnDef="date">
                  <th mat-header-cell *matHeaderCellDef>Date</th>
                  <td mat-cell *matCellDef="let transaction">{{ transaction.transactionDate | date: 'medium' }}</td>
                </ng-container>

                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef>Type</th>
                  <td mat-cell *matCellDef="let transaction">{{ transaction.type }}</td>
                </ng-container>

                <ng-container matColumnDef="quantity">
                  <th mat-header-cell *matHeaderCellDef>Quantity</th>
                  <td mat-cell *matCellDef="let transaction">{{ transaction.quantity }}</td>
                </ng-container>

                <ng-container matColumnDef="resultingStock">
                  <th mat-header-cell *matHeaderCellDef>Resulting</th>
                  <td mat-cell *matCellDef="let transaction">{{ transaction.resultingStock }}</td>
                </ng-container>

                <ng-container matColumnDef="value">
                  <th mat-header-cell *matHeaderCellDef>Value</th>
                  <td mat-cell *matCellDef="let transaction">{{ transactionValue(transaction) | number: '1.2-2' }}</td>
                </ng-container>

                <ng-container matColumnDef="user">
                  <th mat-header-cell *matHeaderCellDef>User</th>
                  <td mat-cell *matCellDef="let transaction">{{ transaction.user?.name }}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef></th>
                  <td mat-cell *matCellDef="let transaction" class="actions">
                    <button
                      mat-icon-button
                      type="button"
                      aria-label="Undo transaction"
                      [disabled]="transaction.isVoided"
                      (click)="undo(transaction)"
                    >
                      <mat-icon>undo</mat-icon>
                    </button>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="columns"></tr>
                <tr mat-row *matRowDef="let row; columns: columns" [class.voided]="row.isVoided"></tr>
              </table>
            </div>
          }
        </section>
      }
    </section>
  `,
  styles: [
    `
      .item-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
      }

      .label {
        display: block;
        margin-bottom: 6px;
        color: #64748b;
        font-size: 0.82rem;
      }

      strong {
        color: #14213d;
        font-size: 1.2rem;
      }

      .section-title {
        padding: 16px 20px 0;
      }

      .section-title h2 {
        margin: 0;
        color: #14213d;
        font-size: 1.1rem;
        letter-spacing: 0;
      }

      .actions {
        width: 56px;
        text-align: right;
      }

      .voided {
        opacity: 0.55;
        text-decoration: line-through;
      }

      @media (max-width: 720px) {
        .item-summary {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class ItemDetailComponent {
  readonly stockStatus = stockStatus;
  readonly columns = ['date', 'type', 'quantity', 'resultingStock', 'value', 'user', 'actions'];
  readonly item = signal<Item | null>(null);
  readonly history = signal<InventoryTransaction[]>([]);
  readonly loading = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(InventoryApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly itemId = Number(this.route.snapshot.paramMap.get('id'));

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api
      .item(this.itemId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => this.item.set(response.data),
        error: () => this.snackBar.open('Item could not be loaded.', 'Dismiss', { duration: 3500 }),
      });

    this.api.itemHistory(this.itemId, { pageSize: 100 }).subscribe((response) => this.history.set(response.data));
  }

  undo(transaction: InventoryTransaction): void {
    this.api.undoTransaction(transaction.id).subscribe({
      next: () => {
        this.snackBar.open(`Transaction #${transaction.id} undone.`, 'Dismiss', { duration: 2500 });
        this.load();
      },
      error: () => this.snackBar.open('Transaction could not be undone.', 'Dismiss', { duration: 3500 }),
    });
  }

  transactionValue(transaction: InventoryTransaction): number {
    const unitValue = transaction.type === 'SALE' ? transaction.unitPrice : transaction.unitCost;
    return Math.abs(transaction.quantity) * (unitValue ?? 0);
  }
}
