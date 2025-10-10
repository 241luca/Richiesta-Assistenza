/**
 * Type definitions per Express Request
 * Aggiunge la proprietà 'user' che viene popolata dal middleware authenticate
 */

import { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        fullName: string;
        role: Role;
        professionalId?: string;
      };
      requestId?: string;
    }
  }
}

export {};
