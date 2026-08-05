import type { Category, Item, Transaction, UnitOfMeasure, User } from '@prisma/client';

function decimalToNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

export function serializeUser(user: Pick<User, 'id' | 'name' | 'email' | 'role' | 'isActive' | 'tokenVersion' | 'createdAt'>) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    tokenVersion: user.tokenVersion,
    createdAt: user.createdAt,
  };
}

export function serializeItem(
  item: Item & {
    category?: Category;
    unit?: UnitOfMeasure;
  },
) {
  return {
    ...item,
    currentStock: decimalToNumber(item.currentStock),
    lowStockThreshold: decimalToNumber(item.lowStockThreshold),
  };
}

export function serializeTransaction(
  transaction: Transaction & {
    item?: Pick<Item, 'id' | 'sku' | 'name'>;
    user?: Pick<User, 'id' | 'name' | 'email'>;
  },
) {
  return {
    ...transaction,
    quantity: decimalToNumber(transaction.quantity),
    unitCost: decimalToNumber(transaction.unitCost),
    unitPrice: decimalToNumber(transaction.unitPrice),
    resultingStock: decimalToNumber(transaction.resultingStock),
  };
}
