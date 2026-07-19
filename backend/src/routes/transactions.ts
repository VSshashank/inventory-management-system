import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { parseId } from '../lib/route-params.js';
import { serializeTransaction } from '../lib/serializers.js';
import { createStockTransaction, undoStockTransaction } from '../services/transaction-service.js';
import { isTransactionType } from '../types/domain.js';
import { createTransactionSchema } from '../validators/transactions.js';

const router = Router();
const maxPageSize = 100;

router.use(requireAuth);

router.post(
  '/',
  validateBody(createTransactionSchema),
  asyncHandler(async (req, res) => {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const result = await createStockTransaction(req.body, req.user.id);
    res.status(201).json(result);
  }),
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const requestedPageSize = Math.max(Number(req.query.pageSize ?? 25), 1);
    const pageSize = Math.min(requestedPageSize, maxPageSize);
    const where: Prisma.TransactionWhereInput = {};

    if (req.query.itemId) {
      const itemId = Number(req.query.itemId);
      if (!Number.isInteger(itemId) || itemId <= 0) {
        throw new AppError('Invalid item filter.', 400);
      }
      where.itemId = itemId;
    }

    if (typeof req.query.type === 'string') {
      if (!isTransactionType(req.query.type)) {
        throw new AppError('Invalid transaction type.', 400);
      }
      where.type = req.query.type;
    }

    if (req.query.start || req.query.end) {
      where.transactionDate = {};
      if (typeof req.query.start === 'string') {
        where.transactionDate.gte = new Date(req.query.start);
      }
      if (typeof req.query.end === 'string') {
        where.transactionDate.lte = new Date(req.query.end);
      }
    }

    const [transactions, total] = await prisma.$transaction([
      prisma.transaction.findMany({
        where,
        include: {
          item: { select: { id: true, sku: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { transactionDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
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

router.post(
  '/:id/undo',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'transaction id');
    const result = await undoStockTransaction(id);
    res.json(result);
  }),
);

export default router;
