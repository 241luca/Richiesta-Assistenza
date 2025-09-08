import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { Role } from '@prisma/client';

export function requireRole(roles: Role | Role[]) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this resource' 
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
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
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Admins can access everything
    if (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    try {
      const ownerId = await getResourceOwnerId(req);
      
      if (ownerId !== req.user.id) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'You do not have permission to access this resource' 
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({ 
        error: 'Authorization error',
        message: 'Failed to verify resource ownership' 
      });
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
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  if (req.user.role !== 'PROFESSIONAL' && 
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      error: 'Professional access required',
      message: 'This action is only available to professionals' 
    });
  }

  if (req.user.role === 'PROFESSIONAL' && !req.user.professional) {
    return res.status(403).json({ 
      error: 'Professional profile not found',
      message: 'Please complete your professional profile' 
    });
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
    return res.status(401).json({ 
      error: 'Authentication required' 
    });
  }

  if (req.user.role !== 'CLIENT' && 
      req.user.role !== 'ADMIN' && 
      req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ 
      error: 'Client access required',
      message: 'This action is only available to clients' 
    });
  }

  next();
}
