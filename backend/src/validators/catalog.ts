import { z } from 'zod';

const decimalLike = z.union([z.number(), z.string().trim().min(1)]);

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(200),
});

export const unitSchema = z.object({
  name: z.string().trim().min(1).max(200),
  abbreviation: z.string().trim().min(1).max(20),
});

export const createItemSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  categoryId: z.coerce.number().int().positive(),
  unitId: z.coerce.number().int().positive(),
  currentStock: decimalLike.optional(),
  lowStockThreshold: decimalLike.optional(),
});

export const updateItemSchema = createItemSchema.partial().strict();

export const updateSettingsSchema = z
  .object({
    businessName: z.string().trim().min(1).max(200).optional(),
    currencySymbol: z.string().trim().min(1).max(10).optional(),
    defaultLowStockThreshold: decimalLike.optional(),
    dateFormat: z.string().trim().min(1).max(50).optional(),
  })
  .strict();
