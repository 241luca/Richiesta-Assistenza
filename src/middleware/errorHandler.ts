import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ResponseFormatter } from '../utils/responseFormatter';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Set default values
  err.statusCode = err.statusCode || 500;
  err.isOperational = err.isOperational || false;

  // Log error con requestId
  logger.error({
    requestId: req.requestId || 'unknown',
    error: err.message,
    stack: err.stack,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    User: (req as any).user?.id
  });

  // Prepare error details for development mode
  const errorDetails = process.env.NODE_ENV === 'development' ? {
    stack: err.stack,
    path: req.path,
    method: req.method
  } : undefined;

  // ✅ CORRETTO: Usa ResponseFormatter per la risposta di errore
  const errorResponse = ResponseFormatter.error(
    err.message,
    err.code || err.name || 'ERROR',
    errorDetails
  );

  // Send error response with ResponseFormatter
  res.status(err.statusCode).json(errorResponse);
}

// Custom error classes
export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;
  code = 'VALIDATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AuthenticationError extends Error implements AppError {
  statusCode = 401;
  isOperational = true;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends Error implements AppError {
  statusCode = 403;
  isOperational = true;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;
  code = 'NOT_FOUND';

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends Error implements AppError {
  statusCode = 409;
  isOperational = true;
  code = 'CONFLICT_ERROR';

  constructor(message: string = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class TooManyRequestsError extends Error implements AppError {
  statusCode = 429;
  isOperational = true;
  code = 'TOO_MANY_REQUESTS';

  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'TooManyRequestsError';
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

export class InternalServerError extends Error implements AppError {
  statusCode = 500;
  isOperational = false;
  code = 'INTERNAL_SERVER_ERROR';

  constructor(message: string = 'Internal server error') {
    super(message);
    this.name = 'InternalServerError';
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
