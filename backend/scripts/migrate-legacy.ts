import path from 'node:path';
import process from 'node:process';
import bcrypt from 'bcryptjs';
import { Prisma, PrismaClient } from '@prisma/client';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

interface LegacyRow {
  id: number;
  date: string;
  time: string;
  user: string;
  dimension: string;
  action: string;
  amount_kg: number;
  current_stock_kg: number;
  cost_per_kg: number | null;
  sell_per_kg: number | null;
  notes: string | null;
}

interface PreparedRow {
  row: LegacyRow;
  type: 'STOCK_IN' | 'SALE' | 'ADJUSTMENT';
  quantity: Prisma.Decimal;
  transactionDate: Date;
  notes: string | null;
}

const prisma = new PrismaClient();
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const dbArg = args.find((arg) => !arg.startsWith('--'));
const legacyDbPath = path.resolve(process.cwd(), dbArg ?? '../inventory.db');

function mapAction(action: string): PreparedRow['type'] | null {
  const normalized = action.trim().toLowerCase();

  if (normalized === 'stock added' || normalized === 'stock_in' || normalized === 'stock in') {
    return 'STOCK_IN';
  }

  if (normalized === 'sale') {
    return 'SALE';
  }

  if (normalized === 'adjustment') {
    return 'ADJUSTMENT';
  }

  return null;
}

function parseLegacyDate(row: LegacyRow): Date | null {
  const parsed = new Date(`${row.date}T${row.time}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function prepareRows(rows: LegacyRow[]) {
  const prepared: PreparedRow[] = [];
  const skipped: Array<{ id: number; reason: string }> = [];

  for (const row of rows) {
    const type = mapAction(row.action);
    const transactionDate = parseLegacyDate(row);

    if (!type) {
      skipped.push({ id: row.id, reason: `unknown action "${row.action}"` });
      continue;
    }

    if (!transactionDate) {
      skipped.push({ id: row.id, reason: 'invalid date/time' });
      continue;
    }

    if (!row.dimension.trim()) {
      skipped.push({ id: row.id, reason: 'missing dimension' });
      continue;
    }

    prepared.push({
      row,
      type,
      quantity: new Prisma.Decimal(row.amount_kg),
      transactionDate,
      notes: [row.notes?.trim(), `Legacy import row #${row.id}`, `Original user: ${row.user}`]
        .filter(Boolean)
        .join(' | '),
    });
  }

  return { prepared, skipped };
}

async function readLegacyRows() {
  const db = await open({
    filename: legacyDbPath,
    driver: sqlite3.Database,
  });

  try {
    return await db.all<LegacyRow[]>('select * from transactions order by date asc, time asc, id asc');
  } finally {
    await db.close();
  }
}

async function main() {
  const rows = await readLegacyRows();
  const { prepared, skipped } = prepareRows(rows);
  const dimensions = new Set(prepared.map(({ row }) => row.dimension.trim()));
  const finalStockByDimension = new Map<string, Prisma.Decimal>();

  for (const { row } of prepared) {
    finalStockByDimension.set(row.dimension.trim(), new Prisma.Decimal(row.current_stock_kg));
  }

  if (!apply) {
    console.log(
      JSON.stringify(
        {
          mode: 'dry-run',
          legacyDbPath,
          rowsRead: rows.length,
          rowsReady: prepared.length,
          distinctItems: dimensions.size,
          skipped,
          nextStep: 'Run npm run migrate:legacy -- --apply to write to SQL Server.',
        },
        null,
        2,
      ),
    );
    return;
  }

  const historicalPasswordHash = await bcrypt.hash(`legacy-import-${Date.now()}`, 12);

  const summary = await prisma.$transaction(async (tx) => {
    const category = await tx.category.upsert({
      where: { name: 'Biodegradable Bags' },
      update: {},
      create: { name: 'Biodegradable Bags' },
    });
    const unit = await tx.unitOfMeasure.upsert({
      where: { name: 'Kilogram' },
      update: { abbreviation: 'kg' },
      create: { name: 'Kilogram', abbreviation: 'kg' },
    });
    const historicalUser = await tx.user.upsert({
      where: { email: 'historical-import@example.com' },
      update: {},
      create: {
        name: 'Historical Import',
        email: 'historical-import@example.com',
        passwordHash: historicalPasswordHash,
        role: 'STAFF',
      },
    });
    const users = await tx.user.findMany({
      select: { id: true, name: true },
    });
    const userByName = new Map(users.map((user) => [user.name.trim().toLowerCase(), user.id]));
    const itemByDimension = new Map<string, number>();
    let itemsCreated = 0;

    for (const dimension of dimensions) {
      const existing = await tx.item.findUnique({ where: { sku: dimension } });

      if (existing) {
        itemByDimension.set(dimension, existing.id);
        continue;
      }

      const created = await tx.item.create({
        data: {
          sku: dimension,
          name: dimension,
          categoryId: category.id,
          unitId: unit.id,
          currentStock: 0,
          lowStockThreshold: 10,
        },
      });
      itemByDimension.set(dimension, created.id);
      itemsCreated += 1;
    }

    for (const preparedRow of prepared) {
      const dimension = preparedRow.row.dimension.trim();
      const itemId = itemByDimension.get(dimension);

      if (!itemId) {
        throw new Error(`No item id mapped for ${dimension}`);
      }

      await tx.transaction.create({
        data: {
          itemId,
          userId: userByName.get(preparedRow.row.user.trim().toLowerCase()) ?? historicalUser.id,
          type: preparedRow.type,
          quantity: preparedRow.quantity,
          unitCost: preparedRow.row.cost_per_kg ? new Prisma.Decimal(preparedRow.row.cost_per_kg) : null,
          unitPrice: preparedRow.row.sell_per_kg ? new Prisma.Decimal(preparedRow.row.sell_per_kg) : null,
          resultingStock: new Prisma.Decimal(preparedRow.row.current_stock_kg),
          notes: preparedRow.notes,
          transactionDate: preparedRow.transactionDate,
        },
      });
    }

    for (const [dimension, currentStock] of finalStockByDimension) {
      const itemId = itemByDimension.get(dimension);
      if (itemId) {
        await tx.item.update({
          where: { id: itemId },
          data: { currentStock },
        });
      }
    }

    return {
      itemsCreated,
      transactionsMigrated: prepared.length,
      skipped,
    };
  });

  console.log(JSON.stringify({ mode: 'applied', legacyDbPath, ...summary }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
