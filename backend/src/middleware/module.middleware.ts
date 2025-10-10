import { Request, Response, NextFunction } from 'express';
import { moduleService } from '../services/module.service';
import { ResponseFormatter } from '../utils/responseFormatter';
import { logger } from '../utils/logger';

// Extend Express Request type
interface AuthRequest extends Request {
  user?: {
    id: string;
    role?: string;
    [key: string]: any;
  };
}

// Cache semplice in memoria per migliorare le prestazioni
const moduleStatusCache = new Map<string, { isEnabled: boolean; cachedAt: number }>();
const CACHE_TTL = 60000; // 1 minuto

/**
 * Middleware: richiede modulo abilitato
 * 
 * Questo middleware controlla se un modulo è attivo prima di permettere l'accesso
 * alla funzionalità. È come un guardiano che verifica il tuo badge.
 * 
 * @param moduleCode - Codice del modulo da verificare (es. 'reviews', 'payments')
 * @returns Middleware function
 * 
 * @example
 * // Protegge la route dei preventivi
 * router.get('/quotes', requireModule('quotes'), (req, res) => {
 *   // Questa route funziona solo se il modulo quotes è attivo
 * });
 */
export const requireModule = (moduleCode: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      logger.info(`[ModuleMiddleware] Checking module: ${moduleCode}`, {
        path: req.path,
        method: req.method,
        user: req.user?.id || 'anonymous'
      });

      const isEnabled = await moduleService.isModuleEnabled(moduleCode);
      
      if (!isEnabled) {
        logger.warn(`[ModuleMiddleware] Access denied - module disabled: ${moduleCode}`, {
          path: req.path,
          user: req.user?.id || 'anonymous'
        });

        return res.status(403).json(
          ResponseFormatter.error(
            'Questa funzionalità non è attualmente disponibile',
            'MODULE_DISABLED',
            {
              module: moduleCode,
              reason: 'MODULE_DISABLED',
              contact: 'Contatta l\'amministratore per maggiori informazioni'
            }
          )
        );
      }
      
      logger.debug(`[ModuleMiddleware] Access granted for module: ${moduleCode}`);
      next();
    } catch (error: any) {
      logger.error(`[ModuleMiddleware] Error checking module ${moduleCode}:`, {
        error: error.message,
        stack: error.stack,
        path: req.path
      });
      
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore verifica disponibilità funzionalità',
          'MODULE_CHECK_ERROR'
        )
      );
    }
  };
};

/**
 * Middleware: richiede multiple moduli abilitati
 * 
 * Verifica che TUTTI i moduli specificati siano attivi.
 * Utile per funzionalità che dipendono da più moduli.
 * 
 * @param moduleCodes - Array di codici moduli da verificare
 * @returns Middleware function
 * 
 * @example
 * // Protegge una route che ha bisogno di pagamenti E notifiche
 * router.post('/complete-order', requireModules(['payments', 'notifications']), (req, res) => {
 *   // Funziona solo se entrambi i moduli sono attivi
 * });
 */
export const requireModules = (moduleCodes: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      logger.info(`[ModuleMiddleware] Checking multiple modules:`, {
        modules: moduleCodes,
        path: req.path,
        method: req.method
      });

      // Verifica tutti i moduli in parallelo (più veloce)
      const checks = await Promise.all(
        moduleCodes.map(code => moduleService.isModuleEnabled(code))
      );
      
      // Trova quali moduli sono disabilitati
      const disabled = moduleCodes.filter((_, i) => !checks[i]);
      
      if (disabled.length > 0) {
        logger.warn(`[ModuleMiddleware] Access denied - modules disabled:`, {
          disabledModules: disabled,
          path: req.path
        });

        return res.status(403).json(
          ResponseFormatter.error(
            'Alcune funzionalità richieste non sono disponibili',
            'MODULES_DISABLED',
            {
              disabledModules: disabled,
              reason: 'MODULES_DISABLED'
            }
          )
        );
      }
      
      logger.debug(`[ModuleMiddleware] Access granted for all modules:`, moduleCodes);
      next();
    } catch (error: any) {
      logger.error(`[ModuleMiddleware] Error checking multiple modules:`, {
        error: error.message,
        modules: moduleCodes,
        path: req.path
      });
      
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore verifica funzionalità',
          'MODULES_CHECK_ERROR'
        )
      );
    }
  };
};

/**
 * Middleware con cache per migliorare prestazioni
 * 
 * Stesso controllo di requireModule ma salva il risultato per 1 minuto
 * per evitare troppe query al database. Più veloce per siti con tanto traffico.
 * 
 * @param moduleCode - Codice del modulo da verificare
 * @returns Middleware function con cache
 * 
 * @example
 * // Per route chiamate molto spesso
 * router.get('/popular-feature', requireModuleCached('popular'), (req, res) => {
 *   // Usa la cache per essere più veloce
 * });
 */
export const requireModuleCached = (moduleCode: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const now = Date.now();
      const cached = moduleStatusCache.get(moduleCode);
      
      // Controlla se abbiamo il risultato in cache e non è scaduto
      if (cached && (now - cached.cachedAt) < CACHE_TTL) {
        logger.debug(`[ModuleMiddleware] Using cached result for module: ${moduleCode}`);
        
        if (!cached.isEnabled) {
          return res.status(403).json(
            ResponseFormatter.error(
              'Funzionalità non disponibile',
              'MODULE_DISABLED',
              {
                module: moduleCode,
                reason: 'MODULE_DISABLED',
                cached: true
              }
            )
          );
        }
        return next();
      }
      
      // Non c'è cache o è scaduta: controlla nel database
      logger.debug(`[ModuleMiddleware] Cache miss, checking database for module: ${moduleCode}`);
      const isEnabled = await moduleService.isModuleEnabled(moduleCode);
      
      // Salva il risultato in cache
      moduleStatusCache.set(moduleCode, { isEnabled, cachedAt: now });
      
      if (!isEnabled) {
        return res.status(403).json(
          ResponseFormatter.error(
            'Funzionalità non disponibile',
            'MODULE_DISABLED'
          )
        );
      }
      
      next();
    } catch (error: any) {
      logger.error(`[ModuleMiddleware] Error checking cached module ${moduleCode}:`, {
        error: error.message,
        path: req.path
      });
      
      return res.status(500).json(
        ResponseFormatter.error(
          'Errore verifica funzionalità',
          'MODULE_CHECK_ERROR'
        )
      );
    }
  };
};

/**
 * Invalida cache per un modulo specifico
 * 
 * Chiamare questa funzione quando un modulo viene abilitato/disabilitato
 * per assicurarsi che il middleware usi subito il nuovo stato.
 * 
 * @param moduleCode - Codice del modulo da rimuovere dalla cache
 * 
 * @example
 * // Dopo aver disabilitato un modulo
 * await moduleService.disableModule('reviews', userId);
 * invalidateModuleCache('reviews'); // Cache aggiornata subito
 */
export const invalidateModuleCache = (moduleCode: string) => {
  moduleStatusCache.delete(moduleCode);
  logger.info(`[ModuleMiddleware] Cache invalidated for module: ${moduleCode}`);
};

/**
 * Pulisce tutta la cache
 * 
 * Rimuove tutti i dati dalla cache. Utile per reset completo.
 */
export const clearModuleCache = () => {
  moduleStatusCache.clear();
  logger.info('[ModuleMiddleware] All module cache cleared');
};

/**
 * Middleware di warning (non blocca)
 * 
 * Controlla se un modulo è disabilitato ma NON blocca l'accesso.
 * Scrive solo un messaggio nel log per debug. Utile per testing.
 * 
 * @param moduleCode - Codice del modulo da verificare
 * @returns Middleware function che non blocca mai
 * 
 * @example
 * // Per monitorare l'uso di funzionalità in via di dismissione
 * router.get('/old-feature', warnIfModuleDisabled('old_feature'), (req, res) => {
 *   // Funziona sempre, ma logga se il modulo è disabilitato
 * });
 */
export const warnIfModuleDisabled = (moduleCode: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const isEnabled = await moduleService.isModuleEnabled(moduleCode);
      if (!isEnabled) {
        logger.warn(`⚠️  Module ${moduleCode} is disabled but route was accessed`, {
          path: req.path,
          method: req.method,
          user: req.user?.id || 'anonymous'
        });
      }
    } catch (error) {
      logger.error(`[ModuleMiddleware] Error in warning check for ${moduleCode}:`, error);
    }
    next(); // Continua sempre, è solo un warning
  };
};

/**
 * Statistiche della cache (per debug)
 * 
 * @returns Informazioni sulla cache corrente
 */
export const getCacheStats = () => {
  const now = Date.now();
  const stats = {
    totalEntries: moduleStatusCache.size,
    entries: Array.from(moduleStatusCache.entries()).map(([code, data]) => ({
      moduleCode: code,
      isEnabled: data.isEnabled,
      ageMs: now - data.cachedAt,
      expired: (now - data.cachedAt) > CACHE_TTL
    }))
  };
  
  return stats;
};
