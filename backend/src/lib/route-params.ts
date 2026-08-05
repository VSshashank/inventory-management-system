import { AppError } from '../errors/app-error.js';

export function parseId(value: string | string[] | undefined, label = 'id'): number {
  const id = Number(Array.isArray(value) ? value[0] : value);

  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(`Invalid ${label}.`, 400);
  }

  return id;
}
