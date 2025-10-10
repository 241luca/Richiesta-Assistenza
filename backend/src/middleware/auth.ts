import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ResponseFormatter } from '../utils/responseFormatter';

export interface AuthRequest extends Request {
  user?: any;
  requestId?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // LOG per debug del 403
  logger.info('[AUTH] authenticate middleware called:', {
    path: req.path,
    method: req.method,
    hasAuthHeader: !!req.headers.authorization
  });
  
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      // ✅ Uso ResponseFormatter per l'errore
      return res.status(401).json(
        ResponseFormatter.error('Authentication required - No token provided', 'NO_TOKEN')
      );
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET!
    ) as any;

    // Get user from database - using only essential fields that exist
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId
      }
    });

    if (!user) {
      // ✅ Uso ResponseFormatter per l'errore
      return res.status(401).json(
        ResponseFormatter.error('User not found or inactive', 'USER_NOT_FOUND')
      );
    }

    // Check if user is locked out
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      // ✅ Uso ResponseFormatter per l'errore
      return res.status(423).json(
        ResponseFormatter.error('Too many failed login attempts. Please try again later.', 'ACCOUNT_LOCKED')
      );
    }

    // Attach user and organization to request
    req.user = user;

    next();
  } catch (error: any) {
    logger.error('Authentication error:', {
      requestId: req.requestId || 'unknown',
      error: error.message,
      stack: error.stack
    });

    if (error.name === 'TokenExpiredError') {
      // ✅ Uso ResponseFormatter per l'errore
      return res.status(401).json(
        ResponseFormatter.error('Token expired. Please login again', 'TOKEN_EXPIRED')
      );
    }

    if (error.name === 'JsonWebTokenError') {
      // ✅ Uso ResponseFormatter per l'errore
      return res.status(401).json(
        ResponseFormatter.error('Invalid token', 'INVALID_TOKEN')
      );
    }

    // ✅ Uso ResponseFormatter per l'errore generico
    return res.status(500).json(
      ResponseFormatter.error('An error occurred during authentication', 'AUTH_ERROR')
    );
  }
}

// Alias for authenticate
export const requireAuth = authenticate;

// Middleware per richiedere ruoli specifici
export function requireRole(roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'UNAUTHORIZED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        error: 'FORBIDDEN'
      });
    }

    next();
  };
}

// Optional authentication - doesn't fail if no token
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      // No token, but that's okay for optional auth
      return next();
    }

    // Try to verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET!
    ) as any;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId
      }
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // For optional auth, we don't fail on errors
    logger.debug('Optional auth error (non-fatal):', {
      requestId: req.requestId || 'unknown',
      error
    });
    next();
  }
}