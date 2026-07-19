import { z } from 'zod';
import { transactionTypeValues } from '../types/domain.js';

const decimalLike = z.union([z.number(), z.string().trim().min(1)]);

export const createTransactionSchema = z
  .object({
    itemId: z.coerce.number().int().positive(),
    type: z.enum(transactionTypeValues),
    quantity: decimalLike,
    unitCost: decimalLike.optional().nullable(),
    unitPrice: decimalLike.optional().nullable(),
    notes: z.string().trim().max(1000).optional().nullable(),
    transactionDate: z.coerce.date().optional(),
  })
  .strict();
