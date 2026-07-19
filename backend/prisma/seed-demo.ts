import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const [adminHash, staffHash] = await Promise.all([
    bcrypt.hash('AdminDemo!2026', 12),
    bcrypt.hash('StaffDemo!2026', 12),
  ]);

  await prisma.orgSettings.upsert({
    where: { id: 1 },
    update: {
      businessName: 'Inventory Demo',
      currencySymbol: '$',
      defaultLowStockThreshold: 10,
      dateFormat: 'yyyy-MM-dd',
    },
    create: {
      businessName: 'Inventory Demo',
      currencySymbol: '$',
      defaultLowStockThreshold: 10,
      dateFormat: 'yyyy-MM-dd',
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { name: 'Admin User', passwordHash: adminHash, role: 'ADMIN', isActive: true },
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
  });
  const staff = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: { name: 'Staff User', passwordHash: staffHash, role: 'STAFF', isActive: true },
    create: {
      name: 'Staff User',
      email: 'staff@example.com',
      passwordHash: staffHash,
      role: 'STAFF',
    },
  });

  const [electronics, packaging, office] = await Promise.all([
    prisma.category.upsert({ where: { name: 'Electronics' }, update: {}, create: { name: 'Electronics' } }),
    prisma.category.upsert({ where: { name: 'Packaging' }, update: {}, create: { name: 'Packaging' } }),
    prisma.category.upsert({ where: { name: 'Office Supplies' }, update: {}, create: { name: 'Office Supplies' } }),
  ]);
  const [pieces, boxes, litres] = await Promise.all([
    prisma.unitOfMeasure.upsert({ where: { name: 'Piece' }, update: { abbreviation: 'pcs' }, create: { name: 'Piece', abbreviation: 'pcs' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Box' }, update: { abbreviation: 'box' }, create: { name: 'Box', abbreviation: 'box' } }),
    prisma.unitOfMeasure.upsert({ where: { name: 'Litre' }, update: { abbreviation: 'L' }, create: { name: 'Litre', abbreviation: 'L' } }),
  ]);

  const demoItems = await Promise.all([
    prisma.item.upsert({
      where: { sku: 'ELEC-001' },
      update: {},
      create: {
        sku: 'ELEC-001',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with USB receiver',
        categoryId: electronics.id,
        unitId: pieces.id,
        currentStock: 45,
        lowStockThreshold: 10,
      },
    }),
    prisma.item.upsert({
      where: { sku: 'PKG-001' },
      update: {},
      create: {
        sku: 'PKG-001',
        name: 'Bubble Wrap Roll',
        description: 'Standard packaging protection',
        categoryId: packaging.id,
        unitId: pieces.id,
        currentStock: 15,
        lowStockThreshold: 5,
      },
    }),
    prisma.item.upsert({
      where: { sku: 'OFF-001' },
      update: {},
      create: {
        sku: 'OFF-001',
        name: 'Printer Paper',
        description: 'A4 ream, 80gsm white',
        categoryId: office.id,
        unitId: boxes.id,
        currentStock: 20,
        lowStockThreshold: 5,
      },
    }),
    prisma.item.upsert({
      where: { sku: 'OFF-002' },
      update: {},
      create: {
        sku: 'OFF-002',
        name: 'Printer Ink',
        description: 'Black ink cartridge',
        categoryId: office.id,
        unitId: pieces.id,
        currentStock: 8,
        lowStockThreshold: 3,
      },
    }),
    prisma.item.upsert({
      where: { sku: 'JAN-001' },
      update: {},
      create: {
        sku: 'JAN-001',
        name: 'Cleaning Solution',
        description: 'Multipurpose cleaning liquid',
        categoryId: office.id,
        unitId: litres.id,
        currentStock: 12,
        lowStockThreshold: 4,
      },
    }),
  ]);

  const existingDemoTransactions = await prisma.transaction.count({
    where: { notes: { startsWith: 'Demo seed:' } },
  });

  if (existingDemoTransactions === 0) {
    await prisma.transaction.createMany({
      data: [
        {
          itemId: demoItems[0].id,
          userId: admin.id,
          type: 'STOCK_IN',
          quantity: 50,
          unitCost: 12.5,
          resultingStock: 50,
          notes: 'Demo seed: initial mouse stock',
        },
        {
          itemId: demoItems[0].id,
          userId: staff.id,
          type: 'SALE',
          quantity: -5,
          unitCost: 12.5,
          unitPrice: 24.99,
          resultingStock: 45,
          notes: 'Demo seed: mouse sale',
        },
        {
          itemId: demoItems[1].id,
          userId: admin.id,
          type: 'STOCK_IN',
          quantity: 15,
          unitCost: 8,
          resultingStock: 15,
          notes: 'Demo seed: packaging stock',
        },
        {
          itemId: demoItems[2].id,
          userId: admin.id,
          type: 'STOCK_IN',
          quantity: 20,
          unitCost: 7.5,
          resultingStock: 20,
          notes: 'Demo seed: paper stock',
        },
        {
          itemId: demoItems[3].id,
          userId: staff.id,
          type: 'ADJUSTMENT',
          quantity: 8,
          resultingStock: 8,
          notes: 'Demo seed: opening ink count',
        },
      ],
    });
  }

  console.log('Demo data is ready.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
