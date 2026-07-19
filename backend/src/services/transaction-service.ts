import { Prisma } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import { logger } from '../lib/logger.js';
import { prisma } from '../lib/prisma.js';
import { serializeTransaction } from '../lib/serializers.js';
import type { TransactionType } from '../types/domain.js';

export interface CreateTransactionInput {
  itemId: number;
  type: TransactionType;
  quantity: number | string;
  unitCost?: number | string | null;
  unitPrice?: number | string | null;
  notes?: string | null;
  transactionDate?: Date;
}

function toDecimal(value: number | string, label: string): Prisma.Decimal {
  try {
    return new Prisma.Decimal(value);
  } catch {
    throw new AppError(`${label} must be a valid number.`, 400);
  }
}

function optionalDecimal(value: number | string | null | undefined, label: string): Prisma.Decimal | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return toDecimal(value, label);
}

async function findLatestUnitCost(
  tx: Prisma.TransactionClient,
  itemId: number,
  transactionDate: Date,
): Promise<Prisma.Decimal | null> {
  const transaction = await tx.transaction.findFirst({
    where: {
      itemId,
      type: 'STOCK_IN',
      isVoided: false,
      unitCost: { not: null },
      transactionDate: { lte: transactionDate },
    },
    orderBy: { transactionDate: 'desc' },
    select: { unitCost: true },
  });

  return transaction?.unitCost ?? null;
}

export async function createStockTransaction(input: CreateTransactionInput, userId: number) {
  const warningMessages: string[] = [];

  const transaction = await prisma.$transaction(
    async (tx) => {
      const item = await tx.item.findUnique({ where: { id: input.itemId } });

      if (!item || !item.isActive) {
        throw new AppError('Item not found.', 404);
      }

      const transactionDate = input.transactionDate ?? new Date();
      const requestedQuantity = toDecimal(input.quantity, 'Quantity');
      const unitCost = optionalDecimal(input.unitCost, 'Unit cost');
      const unitPrice = optionalDecimal(input.unitPrice, 'Unit price');
      let storedQuantity: Prisma.Decimal;
      let resultingStock: Prisma.Decimal;
      let costToStore = unitCost;
      let priceToStore = unitPrice;

      if (requestedQuantity.equals(0)) {
        throw new AppError('Quantity cannot be zero.', 400);
      }

      if (input.type === 'STOCK_IN') {
        if (requestedQuantity.lessThan(0)) {
          throw new AppError('Stock-in quantity must be positive.', 400);
        }

        if (!unitCost) {
          throw new AppError('Unit cost is required for stock-in transactions.', 400);
        }

        storedQuantity = requestedQuantity;
        resultingStock = item.currentStock.plus(requestedQuantity);
        priceToStore = null;
      } else if (input.type === 'SALE') {
        if (requestedQuantity.lessThan(0)) {
          throw new AppError('Sale quantity must be positive.', 400);
        }

        if (!unitPrice) {
          throw new AppError('Unit price is required for sale transactions.', 400);
        }

        if (requestedQuantity.greaterThan(item.currentStock)) {
          throw new AppError('Sale quantity exceeds current stock.', 400);
        }

        storedQuantity = requestedQuantity.negated();
        resultingStock = item.currentStock.minus(requestedQuantity);
        costToStore = unitCost ?? (await findLatestUnitCost(tx, item.id, transactionDate));
      } else {
        storedQuantity = requestedQuantity;
        resultingStock = item.currentStock.plus(requestedQuantity);
        costToStore = unitCost;
        priceToStore = unitPrice;

        if (resultingStock.lessThan(0)) {
          warningMessages.push('Adjustment recorded, but resulting stock is negative.');
        }
      }

      await tx.item.update({
        where: { id: item.id },
        data: { currentStock: resultingStock },
      });

      return tx.transaction.create({
        data: {
          itemId: item.id,
          userId,
          type: input.type,
          quantity: storedQuantity,
          unitCost: costToStore,
          unitPrice: priceToStore,
          resultingStock,
          notes: input.notes ?? null,
          transactionDate,
        },
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  logger.info(
    {
      transactionId: transaction.id,
      userId,
      itemId: transaction.itemId,
      type: transaction.type,
      quantity: transaction.quantity.toString(),
    },
    'transaction recorded',
  );

  return {
    data: serializeTransaction(transaction),
    warning: warningMessages[0],
  };
}

export async function undoStockTransaction(transactionId: number) {
  const warningMessages: string[] = [];

  const transaction = await prisma.$transaction(
    async (tx) => {
      const existing = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: { item: true },
      });

      if (!existing) {
        throw new AppError('Transaction not found.', 404);
      }

      if (existing.isVoided) {
        throw new AppError('Transaction is already voided.', 409);
      }

      const resultingStock = existing.item.currentStock.minus(existing.quantity);

      if (resultingStock.lessThan(0)) {
        warningMessages.push('Transaction undone, but resulting stock is negative.');
      }

      await tx.item.update({
        where: { id: existing.itemId },
        data: { currentStock: resultingStock },
      });

      return tx.transaction.update({
        where: { id: transactionId },
        data: {
          isVoided: true,
          resultingStock,
        },
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  logger.info(
    {
      transactionId: transaction.id,
      itemId: transaction.itemId,
      type: transaction.type,
    },
    'transaction undone',
  );

  return {
    data: serializeTransaction(transaction),
    warning: warningMessages[0],
  };
}
