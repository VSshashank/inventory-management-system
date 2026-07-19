import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { parseId } from '../lib/route-params.js';
import { categorySchema } from '../validators/catalog.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: categories });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'category id');
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new AppError('Category not found.', 404);
    }

    res.json({ data: category });
  }),
);

router.post(
  '/',
  requireRole('ADMIN'),
  validateBody(categorySchema),
  asyncHandler(async (req, res) => {
    const category = await prisma.category.create({
      data: { name: (req.body as { name: string }).name },
    });

    res.status(201).json({ data: category });
  }),
);

router.put(
  '/:id',
  requireRole('ADMIN'),
  validateBody(categorySchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'category id');
    const category = await prisma.category.update({
      where: { id },
      data: { name: (req.body as { name: string }).name },
    });

    res.json({ data: category });
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'category id');
    const itemCount = await prisma.item.count({ where: { categoryId: id } });

    if (itemCount > 0) {
      throw new AppError('Category is still used by one or more items.', 409);
    }

    await prisma.category.delete({ where: { id } });
    res.status(204).send();
  }),
);

export default router;
