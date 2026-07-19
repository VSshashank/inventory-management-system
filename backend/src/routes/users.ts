import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { AppError } from '../errors/app-error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/async-handler.js';
import { validateBody } from '../middleware/validate.js';
import { hashPassword } from '../lib/password.js';
import { prisma } from '../lib/prisma.js';
import { parseId } from '../lib/route-params.js';
import { serializeUser } from '../lib/serializers.js';
import { createUserSchema, updateUserSchema } from '../validators/users.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: users.map(serializeUser) });
  }),
);

router.post(
  '/',
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body as {
      name: string;
      email: string;
      password: string;
      role: string;
    };
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    res.status(201).json({ data: serializeUser(user) });
  }),
);

router.patch(
  '/:id',
  validateBody(updateUserSchema),
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'user id');
    const body = req.body as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      isActive?: boolean;
    };
    const data: Prisma.UserUpdateInput = {};
    let shouldBumpTokenVersion = false;

    if (body.name !== undefined) {
      data.name = body.name;
    }

    if (body.email !== undefined) {
      data.email = body.email;
    }

    if (body.role !== undefined) {
      data.role = body.role;
    }

    if (body.isActive !== undefined) {
      data.isActive = body.isActive;
      if (!body.isActive) {
        shouldBumpTokenVersion = true;
      }
    }

    if (body.password !== undefined) {
      data.passwordHash = await hashPassword(body.password);
      shouldBumpTokenVersion = true;
    }

    if (Object.keys(data).length === 0) {
      throw new AppError('No user updates provided.', 400);
    }

    if (shouldBumpTokenVersion) {
      data.tokenVersion = { increment: 1 };
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    res.json({ data: serializeUser(user) });
  }),
);

export default router;
