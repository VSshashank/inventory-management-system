import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (idempotent re-seeding)
  await prisma.transaction.deleteMany();
  await prisma.item.deleteMany();
  await prisma.unitOfMeasure.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.orgSettings.deleteMany();

  // Create default OrgSettings
  await prisma.orgSettings.create({
    data: {
      businessName: 'My Generalized Business',
      currencySymbol: '$',
      defaultLowStockThreshold: 10,
      dateFormat: 'yyyy-MM-dd',
    },
  });

  // Create an ADMIN user
  const adminHash = await bcrypt.hash('AdminDemo!2026', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });

  // Create a STAFF user
  const staffHash = await bcrypt.hash('StaffDemo!2026', 12);
  const staff = await prisma.user.create({
    data: {
      name: 'Staff User',
      email: 'staff@example.com',
      passwordHash: staffHash,
      role: 'STAFF',
    },
  });

  // Create Categories
  const catElectronics = await prisma.category.create({ data: { name: 'Electronics' } });
  const catPackaging = await prisma.category.create({ data: { name: 'Packaging' } });
  const catOffice = await prisma.category.create({ data: { name: 'Office Supplies' } });

  // Create Units of Measure
  const unitKg = await prisma.unitOfMeasure.create({ data: { name: 'Kilogram', abbreviation: 'kg' } });
  const unitPcs = await prisma.unitOfMeasure.create({ data: { name: 'Piece', abbreviation: 'pcs' } });
  const unitLitre = await prisma.unitOfMeasure.create({ data: { name: 'Litre', abbreviation: 'L' } });
  const unitBox = await prisma.unitOfMeasure.create({ data: { name: 'Box', abbreviation: 'box' } });

  // Create Sample Items
  const mouse = await prisma.item.create({
    data: {
      sku: 'ELEC-001',
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with USB receiver',
      categoryId: catElectronics.id,
      unitId: unitPcs.id,
      currentStock: 50,
      lowStockThreshold: 10,
    },
  });

  const bubbleWrap = await prisma.item.create({
    data: {
      sku: 'PKG-001',
      name: 'Bubble Wrap Roll (50m)',
      description: 'Standard bubble wrap for packaging protection',
      categoryId: catPackaging.id,
      unitId: unitPcs.id,
      currentStock: 15,
      lowStockThreshold: 5,
    },
  });

  const paper = await prisma.item.create({
    data: {
      sku: 'OFF-001',
      name: 'Printer Paper (A4)',
      description: '500-sheet ream, 80gsm white',
      categoryId: catOffice.id,
      unitId: unitBox.id,
      currentStock: 20,
      lowStockThreshold: 5,
    },
  });

  const ink = await prisma.item.create({
    data: {
      sku: 'OFF-002',
      name: 'Printer Ink (Black)',
      description: 'Compatible black ink cartridge',
      categoryId: catOffice.id,
      unitId: unitPcs.id,
      currentStock: 8,
      lowStockThreshold: 3,
    },
  });

  const keyboard = await prisma.item.create({
    data: {
      sku: 'ELEC-002',
      name: 'Mechanical Keyboard',
      description: 'Cherry MX Blue switches, full-size',
      categoryId: catElectronics.id,
      unitId: unitPcs.id,
      currentStock: 25,
      lowStockThreshold: 5,
    },
  });

  // Create sample transactions.
  //
  // The ledger is the source of truth: `resultingStock` on each row and the
  // item's final `currentStock` are both derived from these entries rather than
  // hand-written, so seeded data can never contradict itself the way manually
  // typed figures do. Sales carry `unitCost` as well as `unitPrice` so the
  // sales/profit report shows a real cost of goods sold instead of a 100% margin.
  const ledger: Array<{
    itemId: number;
    userId: number;
    type: 'STOCK_IN' | 'SALE' | 'ADJUSTMENT';
    quantity: number;
    unitCost?: number;
    unitPrice?: number;
    notes: string;
    daysAgo: number;
  }> = [
    { itemId: mouse.id, userId: admin.id, type: 'STOCK_IN', quantity: 50, unitCost: 12.5, notes: 'Initial stock', daysAgo: 26 },
    { itemId: mouse.id, userId: staff.id, type: 'SALE', quantity: -5, unitCost: 12.5, unitPrice: 24.99, notes: 'Walk-in customer', daysAgo: 12 },
    { itemId: mouse.id, userId: staff.id, type: 'SALE', quantity: -8, unitCost: 12.5, unitPrice: 24.99, notes: 'Online order #1042', daysAgo: 5 },
    { itemId: bubbleWrap.id, userId: admin.id, type: 'STOCK_IN', quantity: 18, unitCost: 6.75, notes: 'Packaging restock', daysAgo: 24 },
    { itemId: bubbleWrap.id, userId: staff.id, type: 'SALE', quantity: -3, unitCost: 6.75, unitPrice: 14.5, notes: 'Retail sale', daysAgo: 9 },
    { itemId: paper.id, userId: admin.id, type: 'STOCK_IN', quantity: 20, unitCost: 8.0, notes: 'Monthly paper order', daysAgo: 21 },
    { itemId: ink.id, userId: admin.id, type: 'STOCK_IN', quantity: 12, unitCost: 18.4, notes: 'Cartridge restock', daysAgo: 18 },
    { itemId: ink.id, userId: staff.id, type: 'SALE', quantity: -4, unitCost: 18.4, unitPrice: 34.95, notes: 'Office resupply', daysAgo: 7 },
    // Physical count came up one short — the adjustment path the CLI supported.
    { itemId: ink.id, userId: admin.id, type: 'ADJUSTMENT', quantity: -1, notes: 'Physical count correction', daysAgo: 3 },
    { itemId: keyboard.id, userId: admin.id, type: 'STOCK_IN', quantity: 25, unitCost: 45.0, notes: 'New product line', daysAgo: 15 },
    { itemId: keyboard.id, userId: staff.id, type: 'SALE', quantity: -3, unitCost: 45.0, unitPrice: 89.99, notes: 'Corporate order', daysAgo: 4 },
  ];

  const runningStock = new Map<number, number>();

  for (const entry of ledger) {
    const resultingStock = (runningStock.get(entry.itemId) ?? 0) + entry.quantity;
    runningStock.set(entry.itemId, resultingStock);

    const transactionDate = new Date();
    transactionDate.setDate(transactionDate.getDate() - entry.daysAgo);

    await prisma.transaction.create({
      data: {
        itemId: entry.itemId,
        userId: entry.userId,
        type: entry.type,
        quantity: entry.quantity,
        unitCost: entry.unitCost ?? null,
        unitPrice: entry.unitPrice ?? null,
        resultingStock,
        notes: entry.notes,
        transactionDate,
      },
    });
  }

  // Reconcile each item's stock with the ledger it was built from.
  for (const [itemId, currentStock] of runningStock) {
    await prisma.item.update({ where: { id: itemId }, data: { currentStock } });
  }

  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
