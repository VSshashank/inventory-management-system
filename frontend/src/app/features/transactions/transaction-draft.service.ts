import { Injectable, signal } from '@angular/core';
import type { TransactionType } from '../../core/models';

export interface TransactionDraft {
  type: TransactionType | null;
  itemId: number | null;
  quantity: number | null;
  unitCost: number | null;
  unitPrice: number | null;
  transactionDate: string;
  notes: string;
}

const today = () => new Date().toISOString().slice(0, 10);

@Injectable({ providedIn: 'root' })
export class TransactionDraftService {
  readonly draft = signal<TransactionDraft>(this.emptyDraft());

  update(patch: Partial<TransactionDraft>): void {
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  reset(keep?: Partial<TransactionDraft>): void {
    this.draft.set({ ...this.emptyDraft(), ...keep });
  }

  private emptyDraft(): TransactionDraft {
    return {
      type: null,
      itemId: null,
      quantity: null,
      unitCost: null,
      unitPrice: null,
      transactionDate: today(),
      notes: '',
    };
  }
}
