/**
 * Retry Logic e Circuit Breaker per Servizi Esterni
 * Gestisce fallimenti di OpenAI, Stripe, Google Maps, Email
 */

import { logger } from '../utils/logger';

/**
 * Interfaccia per configurazione retry
 */
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  timeout: number;
  shouldRetry?: (error: any) => boolean;
}

/**
 * Interfaccia per Circuit Breaker
 */
interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
}

/**
 * Stati del Circuit Breaker
 */
enum CircuitState {
  CLOSED = 'CLOSED',     // Normale operazione
  OPEN = 'OPEN',         // Circuito aperto, blocca richieste
  HALF_OPEN = 'HALF_OPEN' // Test se il servizio è tornato
}

/**
 * Circuit Breaker Implementation
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = 0;
  
  constructor(
    private name: string,
    private config: CircuitBreakerConfig
  ) {}
  
  /**
   * Esegue una funzione con circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Se il circuito è aperto, verifica se è tempo di provare
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for ${this.name}. Service unavailable.`);
      }
      // Prova half-open
      this.state = CircuitState.HALF_OPEN;
      logger.info(`Circuit breaker ${this.name} entering HALF_OPEN state`);
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  /**
   * Gestisce successo
   */
  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) {
        // Dopo 3 successi consecutivi, riapri il circuito
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        logger.info(`Circuit breaker ${this.name} is now CLOSED (recovered)`);
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count dopo successo
      this.failureCount = 0;
    }
  }
  
  /**
   * Gestisce fallimento
   */
  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      // Fallimento in half-open, torna a open
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeout;
      this.successCount = 0;
      logger.warn(`Circuit breaker ${this.name} returned to OPEN state`);
    } else if (this.failureCount >= this.config.failureThreshold) {
      // Troppi fallimenti, apri il circuito
      this.state = CircuitState.OPEN;
      this.nextAttempt = Date.now() + this.config.resetTimeout;
      logger.error(`Circuit breaker ${this.name} is now OPEN after ${this.failureCount} failures`);
    }
  }
  
  /**
   * Ottieni stato attuale
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttempt: this.nextAttempt
    };
  }
}

/**
 * Retry with Exponential Backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    timeout: 30000,
    shouldRetry: (error) => {
      // Non fare retry per errori client (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false;
      }
      // Fai retry per errori di rete e server (5xx)
      return true;
    },
    ...config
  };
  
  let lastError: any;
  let delay = finalConfig.initialDelay;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      // Timeout wrapper
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), finalConfig.timeout);
      });
      
      const result = await Promise.race([fn(), timeoutPromise]);
      
      // Successo, ritorna risultato
      if (attempt > 0) {
        logger.info(`Retry successful after ${attempt} attempts`);
      }
      return result;
      
    } catch (error: any) {
      lastError = error;
      
      // Verifica se dovremmo fare retry
      if (!finalConfig.shouldRetry!(error)) {
        logger.debug('Error not retryable', { error: error.message });
        throw error;
      }
      
      // Se abbiamo esaurito i retry, lancia errore
      if (attempt === finalConfig.maxRetries) {
        logger.error(`All ${finalConfig.maxRetries} retries failed`, {
          error: error.message,
          attempts: attempt + 1
        });
        throw error;
      }
      
      // Log retry attempt
      logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
        error: error.message,
        nextDelay: delay
      });
      
      // Aspetta con exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Aumenta delay per prossimo tentativo
      delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelay);
    }
  }
  
  throw lastError;
}

/**
 * Service-specific Circuit Breakers
 */
const circuitBreakers = {
  openai: new CircuitBreaker('OpenAI', {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minuto
    monitoringPeriod: 120000 // 2 minuti
  }),
  
  stripe: new CircuitBreaker('Stripe', {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 secondi
    monitoringPeriod: 60000 // 1 minuto
  }),
  
  googleMaps: new CircuitBreaker('GoogleMaps', {
    failureThreshold: 5,
    resetTimeout: 30000, // 30 secondi
    monitoringPeriod: 60000 // 1 minuto
  }),
  
  email: new CircuitBreaker('Email', {
    failureThreshold: 10,
    resetTimeout: 120000, // 2 minuti
    monitoringPeriod: 300000 // 5 minuti
  })
};

/**
 * Wrapper per OpenAI con retry e circuit breaker
 */
export async function callOpenAIWithRetry<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  return circuitBreakers.openai.execute(() =>
    retryWithBackoff(apiCall, {
      maxRetries: 3,
      initialDelay: 2000,
      shouldRetry: (error) => {
        // Non fare retry per quota exceeded o invalid API key
        if (error.message?.includes('quota') || error.message?.includes('api_key')) {
          return false;
        }
        return true;
      }
    })
  );
}

/**
 * Wrapper per Stripe con retry e circuit breaker
 */
export async function callStripeWithRetry<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  return circuitBreakers.stripe.execute(() =>
    retryWithBackoff(apiCall, {
      maxRetries: 2,
      initialDelay: 1000,
      shouldRetry: (error) => {
        // Non fare retry per card declined o invalid request
        if (error.type === 'StripeCardError' || error.type === 'StripeInvalidRequestError') {
          return false;
        }
        return true;
      }
    })
  );
}

/**
 * Wrapper per Google Maps con retry e circuit breaker
 */
export async function callGoogleMapsWithRetry<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  return circuitBreakers.googleMaps.execute(() =>
    retryWithBackoff(apiCall, {
      maxRetries: 3,
      initialDelay: 1000,
      shouldRetry: (error) => {
        // Non fare retry per invalid API key o quota
        if (error.message?.includes('API key') || error.message?.includes('quota')) {
          return false;
        }
        return true;
      }
    })
  );
}

/**
 * Wrapper per Email con retry e circuit breaker
 */
export async function sendEmailWithRetry<T>(
  apiCall: () => Promise<T>
): Promise<T> {
  return circuitBreakers.email.execute(() =>
    retryWithBackoff(apiCall, {
      maxRetries: 5,
      initialDelay: 3000,
      maxDelay: 60000,
      shouldRetry: (error) => {
        // Sempre retry per email (importante che arrivino)
        return true;
      }
    })
  );
}

/**
 * Health check per circuit breakers
 */
export function getCircuitBreakerHealth() {
  const health: Record<string, any> = {};
  
  for (const [name, breaker] of Object.entries(circuitBreakers)) {
    health[name] = breaker.getState();
  }
  
  return health;
}

/**
 * Reset circuit breaker manualmente (per admin)
 */
export function resetCircuitBreaker(service: keyof typeof circuitBreakers) {
  if (circuitBreakers[service]) {
    // Ricrea il circuit breaker
    const config = {
      openai: { failureThreshold: 5, resetTimeout: 60000, monitoringPeriod: 120000 },
      stripe: { failureThreshold: 3, resetTimeout: 30000, monitoringPeriod: 60000 },
      googleMaps: { failureThreshold: 5, resetTimeout: 30000, monitoringPeriod: 60000 },
      email: { failureThreshold: 10, resetTimeout: 120000, monitoringPeriod: 300000 }
    };
    
    circuitBreakers[service] = new CircuitBreaker(service, config[service]);
    logger.info(`Circuit breaker for ${service} has been reset`);
    return true;
  }
  return false;
}

/**
 * Monitoring endpoint data
 */
export function getRetryMetrics() {
  return {
    circuitBreakers: getCircuitBreakerHealth(),
    timestamp: new Date().toISOString(),
    recommendations: {
      openai: circuitBreakers.openai.getState().state === CircuitState.OPEN 
        ? 'Consider using fallback AI or cache responses' 
        : 'Healthy',
      stripe: circuitBreakers.stripe.getState().state === CircuitState.OPEN
        ? 'Payment processing unavailable - notify customers'
        : 'Healthy',
      googleMaps: circuitBreakers.googleMaps.getState().state === CircuitState.OPEN
        ? 'Use cached location data or manual address entry'
        : 'Healthy',
      email: circuitBreakers.email.getState().state === CircuitState.OPEN
        ? 'Queue emails for later delivery'
        : 'Healthy'
    }
  };
}
