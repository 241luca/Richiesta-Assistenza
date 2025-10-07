import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

/**
 * Middleware per verificare il ruolo dell'utente
 */
export const checkRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return next(new AppError('User not authenticated', 401));
    }
    
    if (!allowedRoles.includes(user.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    
    next();
  };
};
