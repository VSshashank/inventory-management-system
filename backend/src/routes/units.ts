import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { parseId } from '../lib/route-params.js';
import { unitSchema } from '../validators/catalog.js';

const router = Router();

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const units = await prisma.unitOfMeasure.findMany({ orderBy: { name: 'asc' } });
    res.json({ data: units });
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'unit id');
    const unit = await prisma.unitOfMeasure.findUnique({ where: { id } });

    if (!unit) {
      throw new AppError('Unit not found.', 404);
    }

    res.json({ data: unit });
  }),
);

router.post(
  '/',
  requireRole('ADMIN'),
  validateBody(unitSchema),
  asyncHandler(async (req, res) => {
    const unit = await prisma.unitOfMeasure.create({
      data: req.body as { name: string; abbreviation: string },
    });

    res.status(201).json({ data: unit });
  }),
);

router.put(
  '/:id',
  requireRole('ADMIN'),
  validateBody(unitSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'unit id');
    const unit = await prisma.unitOfMeasure.update({
      where: { id },
      data: req.body as { name: string; abbreviation: string },
    });

    res.json({ data: unit });
  }),
);

router.delete(
  '/:id',
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'unit id');
    const itemCount = await prisma.item.count({ where: { unitId: id } });

    if (itemCount > 0) {
      throw new AppError('Unit is still used by one or more items.', 409);
    }

    await prisma.unitOfMeasure.delete({ where: { id } });
    res.status(204).send();
  }),
);

export default router;
