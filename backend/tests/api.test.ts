import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const unique = Date.now();
const testIds = {
  categoryId: 0,
  unitId: 0,
  itemId: 0,
  stockInId: 0,
  saleId: 0,
  staffId: 0,
};

let accessToken = '';
let csrfToken = '';
let agent: ReturnType<typeof request.agent>;

async function adminLogin() {
  agent = request.agent(app);
  const response = await agent.post('/api/auth/login').send({
    email: 'admin@example.com',
    password: 'AdminDemo!2026',
  });

  assert.equal(response.status, 200);
  accessToken = response.body.accessToken;
  csrfToken = response.body.csrfToken;
}

function authRequest(method: 'get' | 'post' | 'put' | 'patch' | 'delete', path: string, includeCsrf = true) {
  let req = agent[method](path).set('Authorization', `Bearer ${accessToken}`);

  if (includeCsrf) {
    req = req.set('X-CSRF-Token', csrfToken);
  }

  return req;
}

describe('inventory api', () => {
  before(async () => {
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        passwordHash: await bcrypt.hash('AdminDemo!2026', 12),
        role: 'ADMIN',
        isActive: true,
      },
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        passwordHash: await bcrypt.hash('AdminDemo!2026', 12),
        role: 'ADMIN',
      },
    });
    await adminLogin();
  });

  after(async () => {
    await prisma.transaction.deleteMany({ where: { id: { in: [testIds.stockInId, testIds.saleId].filter(Boolean) } } });
    if (testIds.itemId) {
      await prisma.item.deleteMany({ where: { id: testIds.itemId } });
    }
    if (testIds.categoryId) {
      await prisma.category.deleteMany({ where: { id: testIds.categoryId } });
    }
    if (testIds.unitId) {
      await prisma.unitOfMeasure.deleteMany({ where: { id: testIds.unitId } });
    }
    if (testIds.staffId) {
      await prisma.user.deleteMany({ where: { id: testIds.staffId } });
    }
    await prisma.$disconnect();
  });

  it('rejects state-changing requests without a CSRF header', async () => {
    const response = await authRequest('post', '/api/categories', false).send({ name: `No CSRF ${unique}` });
    assert.equal(response.status, 403);
  });

  it('creates an item, prevents overselling, records and undoes a sale', async () => {
    const category = await authRequest('post', '/api/categories').send({ name: `Test Category ${unique}` });
    assert.equal(category.status, 201);
    testIds.categoryId = category.body.data.id;

    const unit = await authRequest('post', '/api/units').send({ name: `Test Unit ${unique}`, abbreviation: `tu${unique}` });
    assert.equal(unit.status, 201);
    testIds.unitId = unit.body.data.id;

    const item = await authRequest('post', '/api/items').send({
      sku: `TEST-${unique}`,
      name: `Test Item ${unique}`,
      categoryId: testIds.categoryId,
      unitId: testIds.unitId,
      currentStock: 0,
      lowStockThreshold: 2,
    });
    assert.equal(item.status, 201);
    testIds.itemId = item.body.data.id;

    const oversell = await authRequest('post', '/api/transactions').send({
      itemId: testIds.itemId,
      type: 'SALE',
      quantity: 1,
      unitPrice: 10,
    });
    assert.equal(oversell.status, 400);

    const stockIn = await authRequest('post', '/api/transactions').send({
      itemId: testIds.itemId,
      type: 'STOCK_IN',
      quantity: 5,
      unitCost: 4,
    });
    assert.equal(stockIn.status, 201);
    assert.equal(stockIn.body.data.resultingStock, 5);
    testIds.stockInId = stockIn.body.data.id;

    const sale = await authRequest('post', '/api/transactions').send({
      itemId: testIds.itemId,
      type: 'SALE',
      quantity: 2,
      unitPrice: 9,
    });
    assert.equal(sale.status, 201);
    assert.equal(sale.body.data.resultingStock, 3);
    testIds.saleId = sale.body.data.id;

    const undo = await authRequest('post', `/api/transactions/${testIds.saleId}/undo`).send({});
    assert.equal(undo.status, 200);

    const updatedItem = await authRequest('get', `/api/items/${testIds.itemId}`);
    assert.equal(updatedItem.status, 200);
    assert.equal(updatedItem.body.data.currentStock, 5);
  });

  it('rejects refresh after a user is deactivated', async () => {
    const passwordHash = await bcrypt.hash('StaffDemo!2026', 12);
    const staff = await prisma.user.create({
      data: {
        name: `Temp Staff ${unique}`,
        email: `temp-staff-${unique}@example.com`,
        passwordHash,
        role: 'STAFF',
      },
    });
    testIds.staffId = staff.id;

    const staffAgent = request.agent(app);
    const login = await staffAgent.post('/api/auth/login').send({
      email: staff.email,
      password: 'StaffDemo!2026',
    });
    assert.equal(login.status, 200);

    const deactivate = await authRequest('patch', `/api/users/${staff.id}`).send({ isActive: false });
    assert.equal(deactivate.status, 200);

    const refresh = await staffAgent.post('/api/auth/refresh').set('X-CSRF-Token', login.body.csrfToken).send({});
    assert.equal(refresh.status, 401);
  });
});
