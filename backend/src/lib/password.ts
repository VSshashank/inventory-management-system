import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { AppError } from '../errors/app-error.js';

const minimumPasswordLength = 12;

export function validatePasswordPolicy(password: string): void {
  const failures = [
    password.length >= minimumPasswordLength,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  if (failures.some((passed) => !passed)) {
    throw new AppError(
      'Password must be at least 12 characters and include uppercase, lowercase, number, and symbol characters.',
      400,
    );
  }
}

export async function assertPasswordIsNotPwned(password: string): Promise<void> {
  const hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: {
      'Add-Padding': 'true',
      'User-Agent': 'inventory-management-system',
    },
  });

  if (!response.ok) {
    throw new AppError('Password breach check is temporarily unavailable.', 503);
  }

  const body = await response.text();
  const matched = body
    .split('\n')
    .some((line) => line.trim().split(':')[0] === suffix);

  if (matched) {
    throw new AppError('Choose a password that has not appeared in a known data breach.', 400);
  }
}

export async function hashPassword(password: string): Promise<string> {
  validatePasswordPolicy(password);
  await assertPasswordIsNotPwned(password);
  return bcrypt.hash(password, 12);
}
