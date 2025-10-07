/**
 * Middleware di autorizzazione
 * Data: 28/09/2025
 */

import { Request, Response, NextFunction } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verifica che l'utente sia autenticato
      if (!req.user) {
        return res.status(401).json(
          ResponseFormatter.error('Non autenticato')
        );
      }

      // Se non sono specificati ruoli, qualsiasi utente autenticato può accedere
      if (allowedRoles.length === 0) {
        return next();
      }

      // Verifica che l'utente abbia uno dei ruoli permessi
      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json(
          ResponseFormatter.error('Non autorizzato per questa operazione')
        );
      }

      next();
    } catch (error) {
      return res.status(500).json(
        ResponseFormatter.error('Errore durante l\'autorizzazione')
      );
    }
  };
};

// Alias per ruoli comuni
export const isAdmin = authorize('ADMIN', 'SUPER_ADMIN');
export const isSuperAdmin = authorize('SUPER_ADMIN');
export const isProfessional = authorize('PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN');
export const isClient = authorize('CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN');