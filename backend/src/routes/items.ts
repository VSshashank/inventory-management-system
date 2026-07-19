import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { parseId } from '../lib/route-params.js';
import { serializeItem, serializeTransaction } from '../lib/serializers.js';
import { createItemSchema, updateItemSchema } from '../validators/catalog.js';

const router = Router();
const maxPageSize = 100;

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const requestedPageSize = Math.max(Number(req.query.pageSize ?? 25), 1);
    const pageSize = Math.min(requestedPageSize, maxPageSize);
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'ADMIN';
    const where: Prisma.ItemWhereInput = includeInactive ? {} : { isActive: true };

    if (search) {
      where.OR = [
        { sku: { contains: search } },
        { name: { contains: search } },
      ];
    }

    if (categoryId !== undefined) {
      if (!Number.isInteger(categoryId) || categoryId <= 0) {
        throw new AppError('Invalid category filter.', 400);
      }
      where.categoryId = categoryId;
    }

    const [items, total] = await prisma.$transaction([
      prisma.item.findMany({
        where,
        include: { category: true, unit: true },
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.item.count({ where }),
    ]);

    res.json({
      data: items.map(serializeItem),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }),
);

router.post(
  '/',
  validateBody(createItemSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      sku: string;
      name: string;
      description?: string | null;
      categoryId: number;
      unitId: number;
      currentStock?: number | string;
      lowStockThreshold?: number | string;
    };

    const item = await prisma.item.create({
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description ?? null,
        categoryId: body.categoryId,
        unitId: body.unitId,
        currentStock: body.currentStock ?? 0,
        lowStockThreshold: body.lowStockThreshold ?? 10,
      },
      include: { category: true, unit: true },
    });

    res.status(201).json({ data: serializeItem(item) });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'item id');
    const item = await prisma.item.findUnique({
      where: { id },
      include: { category: true, unit: true },
    });

    if (!item || (!item.isActive && req.user?.role !== 'ADMIN')) {
      throw new AppError('Item not found.', 404);
    }

    res.json({ data: serializeItem(item) });
  }),
);

router.put(
  '/:id',
  validateBody(updateItemSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'item id');
    const body = req.body as {
      sku?: string;
      name?: string;
      description?: string | null;
      categoryId?: number;
      unitId?: number;
      currentStock?: number | string;
      lowStockThreshold?: number | string;
    };

    if (Object.keys(body).length === 0) {
      throw new AppError('No item updates provided.', 400);
    }

    const item = await prisma.item.update({
      where: { id },
      data: {
        sku: body.sku,
        name: body.name,
        description: body.description,
        categoryId: body.categoryId,
        unitId: body.unitId,
        currentStock: body.currentStock,
        lowStockThreshold: body.lowStockThreshold,
      },
      include: { category: true, unit: true },
    });

    res.json({ data: serializeItem(item) });
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'item id');
    await prisma.item.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(204).send();
  }),
);

router.get(
  '/:id/history',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'item id');
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const requestedPageSize = Math.max(Number(req.query.pageSize ?? 25), 1);
    const pageSize = Math.min(requestedPageSize, maxPageSize);

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where: { itemId: id },
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where: { itemId: id } }),
    ]);

    res.json({
      data: transactions.map(serializeTransaction),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  }),
);

export default router;
