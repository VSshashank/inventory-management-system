import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { prisma } from '../src/lib/prisma.js';
import { createStockTransaction, undoStockTransaction } from '../src/services/transaction-service.js';
import { AppError } from '../src/errors/app-error.js';

/**
 * Unit-level coverage for the rules ported from the original Python script:
 * overselling prevention, negative-stock adjustments, and undo-as-void.
 */
const unique = Date.now();
const created = { categoryId: 0, unitId: 0, itemId: 0, userId: 0 };

async function currentStock(): Promise<number> {
  const item = await prisma.item.findUniqueOrThrow({ where: { id: created.itemId } });
  return Number(item.currentStock);
}

describe('transaction service', () => {
  before(async () => {
    const category = await prisma.category.create({ data: { name: `TxSvc Category ${unique}` } });
    const unit = await prisma.unitOfMeasure.create({
      data: { name: `TxSvc Unit ${unique}`, abbreviation: `ts${unique}`.slice(0, 8) },
    });
    const user = await prisma.user.create({
      data: {
        name: `TxSvc User ${unique}`,
        email: `txsvc-${unique}@example.com`,
        passwordHash: 'not-used-in-service-tests',
        role: 'STAFF',
      },
    });
    const item = await prisma.item.create({
      data: {
        sku: `TXSVC-${unique}`,
        name: `TxSvc Item ${unique}`,
        categoryId: category.id,
        unitId: unit.id,
        currentStock: 0,
        lowStockThreshold: 5,
      },
    });

    created.categoryId = category.id;
    created.unitId = unit.id;
    created.userId = user.id;
    created.itemId = item.id;
  });

  after(async () => {
    await prisma.transaction.deleteMany({ where: { itemId: created.itemId } });
    await prisma.item.deleteMany({ where: { id: created.itemId } });
    await prisma.category.deleteMany({ where: { id: created.categoryId } });
    await prisma.unitOfMeasure.deleteMany({ where: { id: created.unitId } });
    await prisma.user.deleteMany({ where: { id: created.userId } });
    await prisma.$disconnect();
  });

  it('rejects a sale larger than current stock', async () => {
    await createStockTransaction(
      { itemId: created.itemId, type: 'STOCK_IN', quantity: 10, unitCost: 3 },
      created.userId,
    );

    await assert.rejects(
      () =>
        createStockTransaction(
          { itemId: created.itemId, type: 'SALE', quantity: 11, unitPrice: 5 },
          created.userId,
        ),
      (error: unknown) => error instanceof AppError && error.statusCode === 400,
    );

    // The rejected sale must not have moved stock.
    assert.equal(await currentStock(), 10);
  });

  it('requires a unit cost on stock-in and a unit price on sale', async () => {
    await assert.rejects(
      () => createStockTransaction({ itemId: created.itemId, type: 'STOCK_IN', quantity: 1 }, created.userId),
      (error: unknown) => error instanceof AppError && error.statusCode === 400,
    );

    await assert.rejects(
      () => createStockTransaction({ itemId: created.itemId, type: 'SALE', quantity: 1 }, created.userId),
      (error: unknown) => error instanceof AppError && error.statusCode === 400,
    );
  });

  it('rejects a zero-quantity transaction', async () => {
    await assert.rejects(
      () =>
        createStockTransaction(
          { itemId: created.itemId, type: 'ADJUSTMENT', quantity: 0 },
          created.userId,
        ),
      (error: unknown) => error instanceof AppError && error.statusCode === 400,
    );
  });

  it('stores a sale as a negative quantity and backfills cost from the latest stock-in', async () => {
    const result = await createStockTransaction(
      { itemId: created.itemId, type: 'SALE', quantity: 4, unitPrice: 9 },
      created.userId,
    );

    assert.equal(Number(result.data.quantity), -4);
    assert.equal(Number(result.data.resultingStock), 6);
    // Cost of goods sold is inherited from the most recent stock-in so the
    // sales report has a real margin rather than treating every sale as pure profit.
    assert.equal(Number(result.data.unitCost), 3);
    assert.equal(await currentStock(), 6);
  });

  it('allows a negative adjustment but returns a warning', async () => {
    const result = await createStockTransaction(
      { itemId: created.itemId, type: 'ADJUSTMENT', quantity: -20, notes: 'physical count' },
      created.userId,
    );

    assert.equal(Number(result.data.resultingStock), -14);
    assert.match(result.warning ?? '', /negative/i);
    assert.equal(await currentStock(), -14);

    // Put stock back to a sane figure for the remaining tests.
    await createStockTransaction(
      { itemId: created.itemId, type: 'ADJUSTMENT', quantity: 20 },
      created.userId,
    );
    assert.equal(await currentStock(), 6);
  });

  it('undo voids the row, reverses stock, and preserves the historical resultingStock', async () => {
    const sale = await createStockTransaction(
      { itemId: created.itemId, type: 'SALE', quantity: 2, unitPrice: 11 },
      created.userId,
    );
    const originalResultingStock = Number(sale.data.resultingStock);
    assert.equal(originalResultingStock, 4);

    const undone = await undoStockTransaction(sale.data.id);

    assert.equal(undone.data.isVoided, true);
    assert.equal(await currentStock(), 6);
    // The void must not rewrite history: this row still records the stock level
    // as it stood immediately after the original sale.
    assert.equal(Number(undone.data.resultingStock), originalResultingStock);
  });

  it('refuses to undo the same transaction twice', async () => {
    const sale = await createStockTransaction(
      { itemId: created.itemId, type: 'SALE', quantity: 1, unitPrice: 11 },
      created.userId,
    );

    await undoStockTransaction(sale.data.id);

    await assert.rejects(
      () => undoStockTransaction(sale.data.id),
      (error: unknown) => error instanceof AppError && error.statusCode === 409,
    );

    // Stock reverted exactly once despite the second attempt.
    assert.equal(await currentStock(), 6);
  });

  it('keeps item stock and the transaction ledger in agreement', async () => {
    const rows = await prisma.transaction.findMany({
      where: { itemId: created.itemId, isVoided: false },
      select: { quantity: true },
    });
    const ledgerTotal = rows.reduce((sum, row) => sum + Number(row.quantity), 0);

    assert.equal(ledgerTotal, await currentStock());
  });
});
