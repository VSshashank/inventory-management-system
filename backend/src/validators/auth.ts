import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export const loginMfaSchema = z.object({
  pendingToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit code.'),
});

export const mfaVerifySchema = z.object({
  setupToken: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit code.'),
});
