import type { Role } from './domain.js';

declare global {
  namespace Express {
    interface UserContext {
      id: number;
      name: string;
      email: string;
      role: Role;
      tokenVersion: number;
    }

    interface Request {
      user?: UserContext;
    }
  }
}

export {};
