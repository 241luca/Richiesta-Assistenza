import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Role } from '@prisma/client';
import { ResponseFormatter } from '../utils/responseFormatter';

export function requireRole(roles: Role | Role[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      // ✅ CORRETTO: Usa ResponseFormatter per l'errore
      return res.status(401).json(
        ResponseFormatter.error(
          'Please login to access this resource',
          'AUTHENTICATION_REQUIRED'
        )
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      // ✅ CORRETTO: Usa ResponseFormatter per l'errore
      return res.status(403).json(
        ResponseFormatter.error(
          `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }

    next();
  };
}

// Check if user owns the resource or has admin privileges
export function requireOwnershipOrAdmin(
  getResourceOwnerId: (req: AuthRequest) => string | Promise<string>
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      // ✅ CORRETTO: Usa ResponseFormatter per l'errore
      return res.status(401).json(
        ResponseFormatter.error(
          'Authentication required',
          'AUTHENTICATION_REQUIRED'
        )
      );
    }

    // Admins can access everything
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== req.user.id) {
        // ✅ CORRETTO: Usa ResponseFormatter per l'errore
        return res.status(403).json(
          ResponseFormatter.error(
            'You do not have permission to access this resource',
            'ACCESS_DENIED'
          )
        );
      }

      next();
    } catch (error) {
      // ✅ CORRETTO: Usa ResponseFormatter per l'errore
      return res.status(500).json(
        ResponseFormatter.error(
          'Failed to verify resource ownership',
          'AUTHORIZATION_ERROR'
        )
      );
    }
  };
}

// Check if user is a professional
export function requireProfessional(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) {
  if (!req.user) {
    // ✅ CORRETTO: Usa ResponseFormatter per l'errore
    return res.status(401).json(
      ResponseFormatter.error(
        'Authentication required',
        'AUTHENTICATION_REQUIRED'
      )
    );
  }

  if (req.user.role !== 'PROFESSIONAL' && 
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'SUPER_ADMIN') {
    // ✅ CORRETTO: Usa ResponseFormatter per l'errore
    return res.status(403).json(
      ResponseFormatter.error(
        'This action is only available to professionals',
        'PROFESSIONAL_ACCESS_REQUIRED'
      )
    );
  }

  if (req.user.role === 'PROFESSIONAL' && !req.user.professional) {
    // ✅ CORRETTO: Usa ResponseFormatter per l'errore
    return res.status(403).json(
      ResponseFormatter.error(
        'Please complete your professional profile',
        'PROFESSIONAL_PROFILE_NOT_FOUND'
      )
    );
  }

  next();
}

// Check if user is a client
export function requireClient(
  req: AuthRequest, 
  res: Response, 
  next: NextFunction
) {
  if (!req.user) {
    // ✅ CORRETTO: Usa ResponseFormatter per l'errore
    return res.status(401).json(
      ResponseFormatter.error(
        'Authentication required',
        'AUTHENTICATION_REQUIRED'
      )
    );
  }

  if (req.user.role !== 'CLIENT' && 
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'SUPER_ADMIN') {
    // ✅ CORRETTO: Usa ResponseFormatter per l'errore
    return res.status(403).json(
      ResponseFormatter.error(
        'This action is only available to clients',
        'CLIENT_ACCESS_REQUIRED'
      )
    );
  }

  next();
}
