import { Prisma } from '@prisma/client';
import ExcelJS from 'exceljs';
import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { prisma } from '../lib/prisma.js';
import { serializeItem, serializeTransaction } from '../lib/serializers.js';

const router = Router();

router.use(requireAuth);

interface DateRange {
  start?: Date;
  end?: Date;
}

interface SalesRow {
  itemId: number;
  sku: string;
  name: string;
  quantitySold: Prisma.Decimal;
  revenue: Prisma.Decimal;
  cost: Prisma.Decimal;
}

function decimalZero(): Prisma.Decimal {
  return new Prisma.Decimal(0);
}

function parseDateRange(query: Record<string, unknown>): DateRange {
  const range: DateRange = {};

  if (typeof query.start === 'string' && query.start.trim()) {
    const start = new Date(query.start);
    if (Number.isNaN(start.getTime())) {
      throw new AppError('Invalid start date.', 400);
    }
    range.start = start;
  }

  if (typeof query.end === 'string' && query.end.trim()) {
    const end = new Date(query.end);
    if (Number.isNaN(end.getTime())) {
      throw new AppError('Invalid end date.', 400);
    }
    range.end = end;
  }

  return range;
}

function dateWhere(range: DateRange): Prisma.DateTimeFilter | undefined {
  if (!range.start && !range.end) {
    return undefined;
  }

  return {
    gte: range.start,
    lte: range.end,
  };
}

function stockStatus(item: { currentStock: Prisma.Decimal; lowStockThreshold: Prisma.Decimal }) {
  if (item.currentStock.lessThanOrEqualTo(0)) {
    return { label: 'Out', fill: 'FFF4CCCC' };
  }

  if (item.currentStock.lessThanOrEqualTo(item.lowStockThreshold)) {
    return { label: 'Low', fill: 'FFFFF2CC' };
  }

  return { label: 'OK', fill: 'FFD9EAD3' };
}

async function latestUnitCosts() {
  const stockIns = await prisma.transaction.findMany({
    where: {
      type: 'STOCK_IN',
      isVoided: false,
      unitCost: { not: null },
    },
    orderBy: { transactionDate: 'desc' },
    select: {
      itemId: true,
      unitCost: true,
    },
  });
  const costs = new Map<number, Prisma.Decimal>();

  for (const transaction of stockIns) {
    if (transaction.unitCost && !costs.has(transaction.itemId)) {
      costs.set(transaction.itemId, transaction.unitCost);
    }
  }

  return costs;
}

async function buildSalesReport(range: DateRange) {
  const transactions = await prisma.transaction.findMany({
    where: {
      type: 'SALE',
      isVoided: false,
      transactionDate: dateWhere(range),
    },
    include: {
      item: { select: { id: true, sku: true, name: true } },
    },
    orderBy: { transactionDate: 'desc' },
  });
  const byItem = new Map<number, SalesRow>();
  let totalRevenue = decimalZero();
  let totalCost = decimalZero();

  for (const transaction of transactions) {
    const quantity = transaction.quantity.abs();
    const revenue = quantity.times(transaction.unitPrice ?? 0);
    const cost = quantity.times(transaction.unitCost ?? 0);
    const existing = byItem.get(transaction.itemId);

    if (existing) {
      existing.quantitySold = existing.quantitySold.plus(quantity);
      existing.revenue = existing.revenue.plus(revenue);
      existing.cost = existing.cost.plus(cost);
    } else {
      byItem.set(transaction.itemId, {
        itemId: transaction.item.id,
        sku: transaction.item.sku,
        name: transaction.item.name,
        quantitySold: quantity,
        revenue,
        cost,
      });
    }

    totalRevenue = totalRevenue.plus(revenue);
    totalCost = totalCost.plus(cost);
  }

  const profit = totalRevenue.minus(totalCost);
  const profitMargin = totalRevenue.greaterThan(0) ? profit.dividedBy(totalRevenue).times(100) : decimalZero();

  return {
    totals: {
      revenue: totalRevenue.toNumber(),
      cost: totalCost.toNumber(),
      profit: profit.toNumber(),
      profitMargin: profitMargin.toNumber(),
    },
    breakdown: Array.from(byItem.values()).map((row) => ({
      itemId: row.itemId,
      sku: row.sku,
      name: row.name,
      quantitySold: row.quantitySold.toNumber(),
      revenue: row.revenue.toNumber(),
      cost: row.cost.toNumber(),
      profit: row.revenue.minus(row.cost).toNumber(),
    })),
  };
}

router.get(
  '/summary',
  asyncHandler(async (_req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [items, recentTransactions, todayTransactionCount, costs] = await Promise.all([
      prisma.item.findMany({
        where: { isActive: true },
        include: { category: true, unit: true },
        orderBy: { name: 'asc' },
      }),
      prisma.transaction.findMany({
        take: 5,
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { transactionDate: 'desc' },
      }),
      prisma.transaction.count({
        where: { transactionDate: { gte: today } },
      }),
      latestUnitCosts(),
    ]);

    const lowStockCount = items.filter((item) => item.currentStock.lessThanOrEqualTo(item.lowStockThreshold)).length;
    const totalInventoryValue = items.reduce((sum, item) => {
      const unitCost = costs.get(item.id) ?? decimalZero();
      return sum.plus(item.currentStock.times(unitCost));
    }, decimalZero());

    res.json({
      data: {
        totalItems: items.length,
        lowStockCount,
        totalInventoryValue: totalInventoryValue.toNumber(),
        todayTransactionCount,
        stockByItem: items.map((item) => ({
          ...serializeItem(item),
          status: stockStatus(item).label,
        })),
        recentTransactions: recentTransactions.map(serializeTransaction),
      },
    });
  }),
);

router.get(
  '/sales',
  asyncHandler(async (req, res) => {
    const report = await buildSalesReport(parseDateRange(req.query));
    res.json({ data: report });
  }),
);

router.get(
  '/velocity',
  asyncHandler(async (_req, res) => {
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const [items, sales] = await Promise.all([
      prisma.item.findMany({
        where: { isActive: true },
        include: { category: true, unit: true },
      }),
      prisma.transaction.findMany({
        where: {
          type: 'SALE',
          isVoided: false,
          transactionDate: { gte: start },
        },
        select: {
          itemId: true,
          quantity: true,
        },
      }),
    ]);
    const soldByItem = new Map<number, Prisma.Decimal>();

    for (const sale of sales) {
      const current = soldByItem.get(sale.itemId) ?? decimalZero();
      soldByItem.set(sale.itemId, current.plus(sale.quantity.abs()));
    }

    const velocity = items
      .map((item) => {
        const sold = soldByItem.get(item.id) ?? decimalZero();
        const averageDailySalesRate = sold.dividedBy(30);
        const daysUntilStockOut = averageDailySalesRate.greaterThan(0)
          ? item.currentStock.dividedBy(averageDailySalesRate).toNumber()
          : null;

        return {
          item: serializeItem(item),
          quantitySoldLast30Days: sold.toNumber(),
          averageDailySalesRate: averageDailySalesRate.toNumber(),
          daysUntilStockOut,
        };
      })
      .sort((a, b) => {
        if (a.daysUntilStockOut === null) {
          return 1;
        }
        if (b.daysUntilStockOut === null) {
          return -1;
        }
        return a.daysUntilStockOut - b.daysUntilStockOut;
      });

    res.json({ data: velocity });
  }),
);

router.get(
  '/export/excel',
  asyncHandler(async (req, res) => {
    const range = parseDateRange(req.query);
    const [items, transactions, salesReport, costs] = await Promise.all([
      prisma.item.findMany({
        where: { isActive: true },
        include: { category: true, unit: true },
        orderBy: { name: 'asc' },
      }),
      prisma.transaction.findMany({
        where: { transactionDate: dateWhere(range) },
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { transactionDate: 'desc' },
      }),
      buildSalesReport(range),
      latestUnitCosts(),
    ]);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Inventory Management System';
    workbook.created = new Date();

    const stockSheet = workbook.addWorksheet('Current Stock');
    stockSheet.columns = [
      { header: 'SKU', key: 'sku', width: 18 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Unit', key: 'unit', width: 12 },
      { header: 'Current Stock', key: 'currentStock', width: 16 },
      { header: 'Low Threshold', key: 'lowStockThreshold', width: 16 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Latest Unit Cost', key: 'unitCost', width: 18 },
      { header: 'Inventory Value', key: 'inventoryValue', width: 18 },
    ];

    for (const item of items) {
      const unitCost = costs.get(item.id) ?? decimalZero();
      const status = stockStatus(item);
      const row = stockSheet.addRow({
        sku: item.sku,
        name: item.name,
        category: item.category.name,
        unit: item.unit.abbreviation,
        currentStock: item.currentStock.toNumber(),
        lowStockThreshold: item.lowStockThreshold.toNumber(),
        status: status.label,
        unitCost: unitCost.toNumber(),
        inventoryValue: item.currentStock.times(unitCost).toNumber(),
      });
      row.getCell('status').fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: status.fill },
      };
    }

    const historySheet = workbook.addWorksheet('Transaction History');
    historySheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Date', key: 'date', width: 22 },
      { header: 'Item', key: 'item', width: 28 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Quantity', key: 'quantity', width: 14 },
      { header: 'Unit Cost', key: 'unitCost', width: 14 },
      { header: 'Unit Price', key: 'unitPrice', width: 14 },
      { header: 'Resulting Stock', key: 'resultingStock', width: 18 },
      { header: 'User', key: 'user', width: 20 },
      { header: 'Voided', key: 'isVoided', width: 10 },
      { header: 'Notes', key: 'notes', width: 36 },
    ];

    for (const transaction of transactions) {
      historySheet.addRow({
        id: transaction.id,
        date: transaction.transactionDate.toISOString(),
        item: `${transaction.item.sku} - ${transaction.item.name}`,
        type: transaction.type,
        quantity: transaction.quantity.toNumber(),
        unitCost: transaction.unitCost?.toNumber() ?? null,
        unitPrice: transaction.unitPrice?.toNumber() ?? null,
        resultingStock: transaction.resultingStock.toNumber(),
        user: transaction.user.name,
        isVoided: transaction.isVoided ? 'Yes' : 'No',
        notes: transaction.notes,
      });
    }

    const salesSheet = workbook.addWorksheet('Sales & Profit');
    salesSheet.columns = [
      { header: 'SKU', key: 'sku', width: 18 },
      { header: 'Name', key: 'name', width: 28 },
      { header: 'Quantity Sold', key: 'quantitySold', width: 16 },
      { header: 'Revenue', key: 'revenue', width: 14 },
      { header: 'Cost', key: 'cost', width: 14 },
      { header: 'Profit', key: 'profit', width: 14 },
    ];

    for (const row of salesReport.breakdown) {
      salesSheet.addRow(row);
    }

    for (const worksheet of workbook.worksheets) {
      worksheet.getRow(1).font = { bold: true };
      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory-report.xlsx"');
    res.end(Buffer.from(buffer));
  }),
);

export default router;
