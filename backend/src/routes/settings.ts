import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { prisma } from '../lib/prisma.js';
import { updateSettingsSchema } from '../validators/catalog.js';

const router = Router();

function serializeSettings(settings: Awaited<ReturnType<typeof getSettingsRow>>) {
  return {
    ...settings,
    defaultLowStockThreshold: Number(settings.defaultLowStockThreshold),
  };
}

async function getSettingsRow() {
  const existing = await prisma.orgSettings.findFirst({ orderBy: { id: 'asc' } });

  if (existing) {
    return existing;
  }

  return prisma.orgSettings.create({ data: {} });
}

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getSettingsRow();
    res.json({ data: serializeSettings(settings) });
  }),
);

router.put(
  '/',
  requireRole('ADMIN'),
  validateBody(updateSettingsSchema),
  asyncHandler(async (req, res) => {
    const current = await getSettingsRow();
    const settings = await prisma.orgSettings.update({
      where: { id: current.id },
      data: req.body as {
        businessName?: string;
        currencySymbol?: string;
        defaultLowStockThreshold?: number | string;
        dateFormat?: string;
      },
    });

    res.json({ data: serializeSettings(settings) });
  }),
);

export default router;
