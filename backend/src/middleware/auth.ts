import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma.js';
import { verifyAccessToken } from '../lib/tokens.js';
import { AppError } from '../errors/app-error.js';
import { isRole, type Role } from '../types/domain.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      throw new AppError('Authentication required.', 401);
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== 'access' || !payload.sub || !isRole(payload.role)) {
      throw new AppError('Invalid access token.', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: Number(payload.sub) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        tokenVersion: true,
      },
    });

    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion || !isRole(user.role)) {
      throw new AppError('Authentication required.', 401);
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError('Authentication required.', 401));
  }
};

export function requireRole(role: Role): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError('Authentication required.', 401));
      return;
    }

    if (req.user.role !== role) {
      next(new AppError('Forbidden.', 403));
      return;
    }

    next();
  };
}
