import type { Item } from '../core/models';

export interface StockStatus {
  label: 'OK' | 'Low' | 'Out';
  icon: 'check_circle' | 'warning' | 'cancel';
  className: 'ok' | 'low' | 'out';
}

export function stockStatus(item: Pick<Item, 'currentStock' | 'lowStockThreshold'>): StockStatus {
  if (item.currentStock <= 0) {
    return { label: 'Out', icon: 'cancel', className: 'out' };
  }

  if (item.currentStock <= item.lowStockThreshold) {
    return { label: 'Low', icon: 'warning', className: 'low' };
  }

  return { label: 'OK', icon: 'check_circle', className: 'ok' };
}
