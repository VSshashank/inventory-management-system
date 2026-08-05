import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { InventoryTransaction } from '../../core/models';

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [DatePipe, RouterLink, MatButtonModule, MatIconModule, MatSnackBarModule, MatTableModule],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="page-kicker">MOVEMENT HISTORY</p>
          <h1>Transactions</h1>
          <p class="muted">Stock movement audit trail</p>
        </div>
        <a mat-flat-button color="primary" routerLink="/transactions/new">
          <mat-icon>add</mat-icon>
          <span>Record</span>
        </a>
      </header>

      <section class="table-panel">
        @if (!transactions().length) {
          <div class="empty-state">No transactions yet.</div>
        } @else {
          <div class="table-wrap">
            <table mat-table [dataSource]="transactions()">
              <ng-container matColumnDef="date"><th mat-header-cell *matHeaderCellDef>Date</th><td mat-cell *matCellDef="let row">{{ row.transactionDate | date:'medium' }}</td></ng-container>
              <ng-container matColumnDef="item"><th mat-header-cell *matHeaderCellDef>Item</th><td mat-cell *matCellDef="let row">{{ row.item?.sku }} · {{ row.item?.name }}</td></ng-container>
              <ng-container matColumnDef="type"><th mat-header-cell *matHeaderCellDef>Type</th><td mat-cell *matCellDef="let row"><span class="transaction-type" [class.sale]="row.type === 'SALE'" [class.stock-in]="row.type === 'STOCK_IN'" [class.adjustment]="row.type === 'ADJUSTMENT'">{{ row.type === 'STOCK_IN' ? 'Stock in' : row.type === 'SALE' ? 'Sale' : 'Adjustment' }}</span></td></ng-container>
              <ng-container matColumnDef="quantity"><th mat-header-cell *matHeaderCellDef>Quantity</th><td mat-cell *matCellDef="let row">{{ row.quantity }}</td></ng-container>
              <ng-container matColumnDef="resulting"><th mat-header-cell *matHeaderCellDef>Resulting</th><td mat-cell *matCellDef="let row">{{ row.resultingStock }}</td></ng-container>
              <ng-container matColumnDef="user"><th mat-header-cell *matHeaderCellDef>User</th><td mat-cell *matCellDef="let row">{{ row.user?.name }}</td></ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let row" class="actions">
                  <button mat-icon-button type="button" [disabled]="row.isVoided" aria-label="Undo transaction" (click)="undo(row)">
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
    </section>
  `,
  styles: [`
    .actions { text-align: right; width: 56px; }
    .voided { opacity: .48; text-decoration: line-through; }
    .transaction-type {
      display: inline-flex;
      align-items: center;
      min-width: 82px;
      justify-content: center;
      padding: 5px 8px;
      border-radius: 999px;
      background: var(--surface-strong);
      color: var(--muted);
      font-size: .72rem;
      font-weight: 800;
      line-height: 1;
    }
    .transaction-type.stock-in { background: var(--brand-soft); color: var(--brand-strong); }
    .transaction-type.sale { background: #e5f0f8; color: #35677e; }
    .transaction-type.adjustment { background: var(--amber-soft); color: #8a5c00; }
  `],
})
export class TransactionsListComponent {
  readonly columns = ['date', 'item', 'type', 'quantity', 'resulting', 'user', 'actions'];
  readonly transactions = signal<InventoryTransaction[]>([]);
  private readonly api = inject(InventoryApiService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    this.load();
  }

  load(): void {
    this.api.transactions({ pageSize: 100 }).subscribe((response) => this.transactions.set(response.data));
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
}
