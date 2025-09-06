/**
 * Request ID Middleware
 * Aggiunge un ID univoco a ogni richiesta per tracking e debugging
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

// Estende l'interfaccia Request per includere requestId
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

/**
 * Middleware per aggiungere Request ID a ogni richiesta
 * 
 * Funzionalità:
 * 1. Genera un UUID univoco per ogni richiesta
 * 2. Lo aggiunge all'oggetto request per uso interno
 * 3. Lo include negli headers di risposta per il client
 * 4. Lo aggiunge ai log per correlazione
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  // Controlla se c'è già un request ID negli headers (utile per request correlate)
  const existingRequestId = req.headers['x-request-id'] as string;
  
  // Usa l'ID esistente o genera uno nuovo
  const requestId = existingRequestId || uuidv4();
  
  // Aggiungi all'oggetto request per uso interno
  req.requestId = requestId;
  
  // Aggiungi agli headers di risposta per il client
  res.setHeader('X-Request-ID', requestId);
  
  // Aggiungi al logger come metadata default per questa richiesta
  // NOTA: Questo è importante per correlazione nei log
  const originalJson = res.json;
  res.json = function(data) {
    // Se la risposta ha un timestamp, aggiungi anche il requestId
    if (data && typeof data === 'object' && 'timestamp' in data) {
      data.requestId = requestId;
    }
    return originalJson.call(this, data);
  };
  
  // Log della richiesta in arrivo con il requestId
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  
  // Continua con il prossimo middleware
  next();
}

/**
 * Helper per estrarre il request ID da una richiesta
 * Utile nei services e controllers
 */
export function getRequestId(req: Request): string {
  return req.requestId || 'unknown';
}

/**
 * Helper per loggare con request ID
 * Wrapper attorno al logger che include automaticamente il request ID
 */
export function logWithRequestId(req: Request, level: string, message: string, meta?: any) {
  const requestId = getRequestId(req);
  logger.log(level, message, { requestId, ...meta });
}

// Export delle funzioni di log specifiche con request ID
export const logInfo = (req: Request, message: string, meta?: any) => 
  logWithRequestId(req, 'info', message, meta);

export const logError = (req: Request, message: string, meta?: any) => 
  logWithRequestId(req, 'error', message, meta);

export const logWarn = (req: Request, message: string, meta?: any) => 
  logWithRequestId(req, 'warn', message, meta);

export const logDebug = (req: Request, message: string, meta?: any) => 
  logWithRequestId(req, 'debug', message, meta);
