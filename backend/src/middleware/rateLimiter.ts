/**
 * Rate Limiter Middleware
 * Gestisce il rate limiting per le API
 */

import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { Request, Response } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';

interface RateLimiterOptions {
  points?: number;  // Numero di richieste consentite
  duration?: number; // Durata della finestra in secondi
  message?: string;  // Messaggio di errore personalizzato
  skipSuccessfulRequests?: boolean; // Salta richieste con successo
}

/**
 * Crea un rate limiter configurabile
 * @param options Opzioni di configurazione
 * @returns Express middleware
 */
export function rateLimiter(options: RateLimiterOptions = {}): RateLimitRequestHandler {
  const {
    points = 100,
    duration = 60 * 60, // Default: 1 ora
    message = 'Troppe richieste, riprova più tardi',
    skipSuccessfulRequests = false
  } = options;

  return rateLimit({
    windowMs: duration * 1000, // Converti secondi in millisecondi
    max: points,
    message: {
      error: message,
      retryAfter: duration
    },
    standardHeaders: true, // Ritorna `RateLimit-*` headers
    legacyHeaders: false, // Disabilita `X-RateLimit-*` headers
    skipSuccessfulRequests,
    // Handler personalizzato che usa ResponseFormatter
    handler: (req: Request, res: Response) => {
      // ✅ CORRETTO: Usa ResponseFormatter per l'errore di rate limit
      const retryAfter = res.getHeader('Retry-After');
      res.status(429).json(
        ResponseFormatter.error(
          message,
          'RATE_LIMIT_EXCEEDED',
          { retryAfter }
        )
      );
    }
  });
}

/**
 * Rate limiter preconfigurati per diversi use case
 */

// Per autenticazione (molto restrittivo)
export const authRateLimiter = rateLimiter({
  points: 5,
  duration: 15 * 60, // 15 minuti
  message: 'Troppi tentativi di autenticazione, riprova tra 15 minuti',
  skipSuccessfulRequests: true
});

// Per API generiche
export const apiRateLimiter = rateLimiter({
  points: 100,
  duration: 60 * 60, // 1 ora
  message: 'Limite di richieste raggiunto, riprova più tardi'
});

// Per upload file
export const uploadRateLimiter = rateLimiter({
  points: 10,
  duration: 60 * 60, // 1 ora
  message: 'Troppi upload, riprova più tardi'
});

// Per operazioni costose (es. geocoding, AI)
export const expensiveRateLimiter = rateLimiter({
  points: 20,
  duration: 60 * 60, // 1 ora
  message: 'Troppe operazioni costose, riprova più tardi'
});

// Per ricerche
export const searchRateLimiter = rateLimiter({
  points: 50,
  duration: 60 * 60, // 1 ora
  message: 'Troppe ricerche, riprova più tardi'
});

// Per notifiche
export const notificationRateLimiter = rateLimiter({
  points: 30,
  duration: 60 * 60, // 1 ora
  message: 'Troppe notifiche inviate, riprova più tardi'
});

export default rateLimiter;
