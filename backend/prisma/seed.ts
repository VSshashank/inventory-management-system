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

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        itemId: mouse.id,
        userId: admin.id,
        type: 'STOCK_IN',
        quantity: 50,
        unitCost: 12.50,
        resultingStock: 50,
        notes: 'Initial stock',
      },
      {
        itemId: mouse.id,
        userId: staff.id,
        type: 'SALE',
        quantity: -5,
        unitPrice: 24.99,
        resultingStock: 45,
        notes: 'Walk-in customer',
      },
      {
        itemId: paper.id,
        userId: admin.id,
        type: 'STOCK_IN',
        quantity: 20,
        unitCost: 8.00,
        resultingStock: 20,
        notes: 'Monthly paper order',
      },
      {
        itemId: keyboard.id,
        userId: admin.id,
        type: 'STOCK_IN',
        quantity: 25,
        unitCost: 45.00,
        resultingStock: 25,
        notes: 'New product line',
      },
      {
        itemId: keyboard.id,
        userId: staff.id,
        type: 'SALE',
        quantity: -3,
        unitPrice: 89.99,
        resultingStock: 22,
        notes: 'Corporate order',
      },
    ],
  });

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
