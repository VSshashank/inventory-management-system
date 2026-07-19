export const roleValues = ['ADMIN', 'STAFF'] as const;
export type Role = (typeof roleValues)[number];

export const transactionTypeValues = ['STOCK_IN', 'SALE', 'ADJUSTMENT'] as const;
export type TransactionType = (typeof transactionTypeValues)[number];

export function isRole(value: string): value is Role {
  return roleValues.includes(value as Role);
}

export function isTransactionType(value: string): value is TransactionType {
  return transactionTypeValues.includes(value as TransactionType);
}
