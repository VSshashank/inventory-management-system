import { DatePipe } from '@angular/common';
import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { InventoryApiService } from '../../core/inventory-api.service';
import type { Item, TransactionType } from '../../core/models';
import { TransactionDraftService } from './transaction-draft.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatAutocompleteModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSnackBarModule,
    MatStepperModule,
  ],
  template: `
    <section class="page">
      <header class="page-header">
        <div>
          <p class="page-kicker">STOCK MOVEMENT</p>
          <h1>New Transaction</h1>
          <p class="muted">Record stock-in, sale, adjustment, or backdated history</p>
        </div>
        <a mat-stroked-button routerLink="/transactions">
          <mat-icon>receipt_long</mat-icon>
          <span>Transactions</span>
        </a>
      </header>

      <mat-stepper class="form-panel stepper" linear #stepper>
        <mat-step [stepControl]="typeForm">
          <form [formGroup]="typeForm">
            <ng-template matStepLabel>Type</ng-template>
            <mat-radio-group formControlName="type" class="type-grid">
              <mat-radio-button class="type-option stock-in" value="STOCK_IN">Stock In</mat-radio-button>
              <mat-radio-button class="type-option sale" value="SALE">Sale</mat-radio-button>
              <mat-radio-button class="type-option adjustment" value="ADJUSTMENT">Adjustment</mat-radio-button>
            </mat-radio-group>
            <div class="step-actions">
              <button mat-flat-button color="primary" matStepperNext type="button">Next</button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="itemForm">
          <form [formGroup]="itemForm">
            <ng-template matStepLabel>Item</ng-template>
            <mat-form-field appearance="outline">
              <mat-label>Item</mat-label>
              <input matInput formControlName="itemSearch" [matAutocomplete]="itemAuto" />
              <mat-autocomplete #itemAuto="matAutocomplete" [displayWith]="displayItem" (optionSelected)="selectItem($event.option.value)">
                @for (item of filteredItems(); track item.id) {
                  <mat-option [value]="item">{{ item.sku }} · {{ item.name }} · {{ item.currentStock }} {{ item.unit?.abbreviation }}</mat-option>
                }
              </mat-autocomplete>
            </mat-form-field>
            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious type="button">Back</button>
              <button mat-flat-button color="primary" matStepperNext type="button">Next</button>
            </div>
          </form>
        </mat-step>

        <mat-step [stepControl]="detailsForm">
          <form [formGroup]="detailsForm">
            <ng-template matStepLabel>Details</ng-template>
            <div class="details-grid">
              <mat-form-field appearance="outline">
                <mat-label>Quantity</mat-label>
                <input matInput type="number" min="0" step="0.001" formControlName="quantity" />
              </mat-form-field>

              @if (typeForm.controls.type.value === 'STOCK_IN') {
                <mat-form-field appearance="outline">
                  <mat-label>Unit Cost</mat-label>
                  <input matInput type="number" min="0" step="0.01" formControlName="unitCost" />
                </mat-form-field>
              }

              @if (typeForm.controls.type.value === 'SALE') {
                <mat-form-field appearance="outline">
                  <mat-label>Unit Price</mat-label>
                  <input matInput type="number" min="0" step="0.01" formControlName="unitPrice" />
                </mat-form-field>
              }

              <mat-form-field appearance="outline">
                <mat-label>Date</mat-label>
                <input matInput type="date" formControlName="transactionDate" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="wide">
                <mat-label>Notes</mat-label>
                <textarea matInput rows="3" formControlName="notes"></textarea>
              </mat-form-field>
            </div>
            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious type="button">Back</button>
              <button mat-flat-button color="primary" matStepperNext type="button">Review</button>
            </div>
          </form>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>Confirm</ng-template>
          <section class="summary">
            <div><span>Type</span><strong>{{ typeForm.controls.type.value }}</strong></div>
            <div><span>Item</span><strong>{{ selectedItem()?.name }}</strong></div>
            <div><span>Quantity</span><strong>{{ detailsForm.controls.quantity.value }}</strong></div>
            <div><span>Date</span><strong>{{ detailsForm.controls.transactionDate.value | date }}</strong></div>
          </section>
          <div class="step-actions">
            <button mat-stroked-button matStepperPrevious type="button">Back</button>
            <button mat-flat-button color="primary" type="button" [disabled]="saving()" (click)="submit(false)">
              @if (saving()) { <mat-spinner diameter="18" /> } @else { <mat-icon>save</mat-icon> }
              <span>Submit</span>
            </button>
            <button mat-stroked-button type="button" [disabled]="saving()" (click)="submit(true)">
              <mat-icon>add</mat-icon>
              <span>Add Another</span>
            </button>
          </div>
        </mat-step>
      </mat-stepper>
    </section>
  `,
  styles: [`
    .stepper {
      max-width: 980px;
      padding: 8px 0 22px;
    }
    .type-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0;
      margin: 20px 0 26px;
      border: 1px solid var(--line-strong);
    }
    .type-option {
      display: flex;
      min-height: 72px;
      align-items: center;
      padding: 0 14px;
      border: 0;
      border-left: 1px solid var(--line);
      border-radius: 0;
      background: var(--surface);
      color: var(--ink-strong);
      font-size: 0.88rem;
      font-weight: 700;
    }
    .type-option:first-child { border-left: 0; }
    .type-option:hover {
      background: var(--surface-soft);
    }
    .type-option:has(input:checked) { background: var(--surface-strong); }
    .type-option.stock-in { border-top: 3px solid var(--brand); }
    .type-option.sale { border-top: 3px solid #5a8eaa; }
    .type-option.adjustment { border-top: 3px solid var(--amber); }
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    .wide { grid-column: 1 / -1; }
    mat-form-field { width: 100%; }
    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 22px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
      flex-wrap: wrap;
    }
    .step-actions mat-spinner, .step-actions mat-icon { margin-right: 8px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0;
      margin: 22px 0;
      border: 1px solid var(--line-strong);
    }
    .summary div {
      padding: 14px;
      border-left: 1px solid var(--line);
      border-top: 1px solid var(--line);
      border-radius: 0;
      background: var(--surface-soft);
    }
    .summary div:nth-child(odd) { border-left: 0; }
    .summary div:nth-child(-n + 2) { border-top: 0; }
    .summary span {
      display: block;
      margin-bottom: 5px;
      color: var(--muted);
      font-size: .73rem;
      font-weight: 700;
    }
    .summary strong { color: var(--ink-strong); font-size: .88rem; }
    @media (max-width: 720px) {
      .type-grid, .details-grid, .summary { grid-template-columns: 1fr; }
      .type-option,
      .type-option:first-child { border-top: 1px solid var(--line); border-left: 0; }
      .type-option:first-child { border-top: 0; }
      .summary div,
      .summary div:nth-child(odd),
      .summary div:nth-child(-n + 2) { border-top: 1px solid var(--line); border-left: 0; }
      .summary div:first-child { border-top: 0; }
    }
  `],
})
export class TransactionFormComponent {
  readonly items = signal<Item[]>([]);
  readonly selectedItem = signal<Item | null>(null);
  readonly saving = signal(false);
  readonly filteredItems = computed(() => {
    const query = this.itemForm.controls.itemSearch.value.toLowerCase();
    return this.items().filter((item) => `${item.sku} ${item.name}`.toLowerCase().includes(query)).slice(0, 20);
  });

  readonly typeForm = new FormGroup({
    type: new FormControl<TransactionType>('STOCK_IN', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly itemForm = new FormGroup({
    itemSearch: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly detailsForm = new FormGroup({
    quantity: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(0.001)] }),
    unitCost: new FormControl<number | null>(null),
    unitPrice: new FormControl<number | null>(null),
    transactionDate: new FormControl(new Date().toISOString().slice(0, 10), { nonNullable: true, validators: [Validators.required] }),
    notes: new FormControl('', { nonNullable: true }),
  });

  private readonly api = inject(InventoryApiService);
  private readonly draft = inject(TransactionDraftService);
  private readonly snackBar = inject(MatSnackBar);

  constructor() {
    const draft = this.draft.draft();
    this.typeForm.patchValue({ type: draft.type ?? 'STOCK_IN' });
    this.detailsForm.patchValue({
      quantity: draft.quantity ?? 1,
      unitCost: draft.unitCost,
      unitPrice: draft.unitPrice,
      transactionDate: draft.transactionDate,
      notes: draft.notes,
    });

    this.api.items({ pageSize: 100 }).subscribe((response) => {
      this.items.set(response.data);
      const item = response.data.find((candidate) => candidate.id === draft.itemId) ?? null;
      if (item) this.selectItem(item);
    });
  }

  readonly displayItem = (item: Item | string | null): string => typeof item === 'string' ? item : item ? `${item.sku} · ${item.name}` : '';

  selectItem(item: Item): void {
    this.selectedItem.set(item);
    this.itemForm.controls.itemSearch.setValue(this.displayItem(item));
  }

  submit(addAnother: boolean): void {
    if (this.typeForm.invalid || this.itemForm.invalid || this.detailsForm.invalid || !this.selectedItem()) {
      this.typeForm.markAllAsTouched();
      this.itemForm.markAllAsTouched();
      this.detailsForm.markAllAsTouched();
      return;
    }

    const type = this.typeForm.controls.type.value;
    const details = this.detailsForm.getRawValue();
    const item = this.selectedItem()!;
    const payload: Record<string, unknown> = {
      itemId: item.id,
      type,
      quantity: details.quantity,
      transactionDate: details.transactionDate,
      notes: details.notes || null,
    };

    if (type === 'STOCK_IN') payload['unitCost'] = details.unitCost ?? 0;
    if (type === 'SALE') payload['unitPrice'] = details.unitPrice ?? 0;

    this.saving.set(true);
    this.api.createTransaction(payload).subscribe({
      next: (response) => {
        this.snackBar.open(`Transaction #${response.data.id} recorded.`, 'Dismiss', { duration: 3000 });
        this.draft.reset(addAnother ? { type, itemId: item.id } : {});
        if (addAnother) {
          this.detailsForm.reset({ quantity: 1, unitCost: null, unitPrice: null, transactionDate: new Date().toISOString().slice(0, 10), notes: '' });
        }
      },
      error: (error) => {
        const message = error?.error?.error ?? 'Transaction could not be recorded.';
        this.snackBar.open(message, 'Dismiss', { duration: 4500 });
      },
      complete: () => this.saving.set(false),
    });
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      this.submit(true);
    }
  }
}
