import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { config } from '../config/index.js';

function getPrismaMessage(error: Prisma.PrismaClientKnownRequestError): { message: string; statusCode: number } {
  if (error.code === 'P2002') {
    return { message: 'A record with that value already exists.', statusCode: 409 };
  }

  if (error.code === 'P2025') {
    return { message: 'Record not found.', statusCode: 404 };
  }

  return { message: 'Database request failed.', statusCode: 400 };
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: error.message });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Validation failed.',
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const { message, statusCode } = getPrismaMessage(error);
    res.status(statusCode).json({ error: message });
    return;
  }

  const message = config.isDev && error instanceof Error ? error.message : 'Internal server error.';
  res.status(500).json({ error: message });
};
