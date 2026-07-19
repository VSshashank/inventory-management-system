import { z } from 'zod';
import { roleValues } from '../types/domain.js';

export const createUserSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
  role: z.enum(roleValues).default('STAFF'),
});

export const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    email: z.string().email().transform((value) => value.toLowerCase()).optional(),
    password: z.string().min(1).optional(),
    role: z.enum(roleValues).optional(),
    isActive: z.boolean().optional(),
  })
  .strict();
