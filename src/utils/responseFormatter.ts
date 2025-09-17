/**
 * ResponseFormatter per il Frontend
 * Versione semplificata del ResponseFormatter del backend
 * Per mantenere consistenza nella gestione delle risposte API
 */

/**
 * Interfaccia per la risposta di successo
 */
export interface SuccessResponse<T = any> {
  success: true;
  message: string;
  data: T;
  metadata?: any;
  timestamp: string;
}

/**
 * Interfaccia per la risposta di errore
 */
export interface ErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details: any;
  };
  timestamp: string;
}

/**
 * Type union per qualsiasi risposta API
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Classe ResponseFormatter per il frontend
 * Fornisce metodi per interpretare le risposte del backend
 */
export class ResponseFormatter {
  /**
   * Verifica se una risposta è di successo
   */
  static isSuccess(response: any): response is SuccessResponse {
    return response?.success === true;
  }

  /**
   * Verifica se una risposta è di errore
   */
  static isError(response: any): response is ErrorResponse {
    return response?.success === false;
  }

  /**
   * Estrae il messaggio da una risposta
   */
  static getMessage(response: any): string {
    if (!response) return 'Nessuna risposta dal server';
    
    // Per risposte Axios, controlla response.data
    if (response.response?.data) {
      return this.getMessage(response.response.data);
    }
    
    // Messaggio principale (presente sia in successo che errore)
    if (response.message) {
      return response.message;
    }
    
    // Fallback
    return 'Risposta senza messaggio';
  }

  /**
   * Estrae i dati da una risposta di successo
   */
  static getData<T = any>(response: any): T | null {
    if (!response) return null;
    
    // Per risposte Axios
    if (response.data && response.status) {
      return this.getData(response.data);
    }
    
    // Per risposte di successo standard
    if (this.isSuccess(response)) {
      return response.data;
    }
    
    return null;
  }

  /**
   * Estrae il codice errore da una risposta di errore
   */
  static getErrorCode(response: any): string {
    if (!response) return 'UNKNOWN_ERROR';
    
    // Per errori Axios
    if (response.response?.data) {
      return this.getErrorCode(response.response.data);
    }
    
    // Per risposte di errore standard
    if (this.isError(response)) {
      return response.error?.code || 'UNKNOWN_ERROR';
    }
    
    // Basato su status HTTP se disponibile
    if (response.response?.status) {
      switch (response.response.status) {
        case 400: return 'BAD_REQUEST';
        case 401: return 'UNAUTHORIZED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 422: return 'VALIDATION_ERROR';
        case 500: return 'INTERNAL_ERROR';
        default: return 'HTTP_ERROR';
      }
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Estrae i dettagli dell'errore
   */
  static getErrorDetails(response: any): any {
    if (!response) return null;
    
    // Per errori Axios
    if (response.response?.data) {
      return this.getErrorDetails(response.response.data);
    }
    
    // Per risposte di errore standard
    if (this.isError(response)) {
      return response.error?.details || null;
    }
    
    return null;
  }

  /**
   * Formatta un messaggio di errore leggibile
   * Compatibile con errori Zod e altri tipi di errore
   */
  static getErrorMessage(error: any): string {
    if (!error) return 'Si è verificato un errore';
    
    // Se è già una stringa
    if (typeof error === 'string') return error;
    
    // Per errori Axios con ResponseFormatter del backend
    if (error.response?.data) {
      const data = error.response.data;
      
      // Usa il messaggio principale
      const mainMessage = this.getMessage(data);
      
      // Se è un errore di validazione con dettagli Zod
      if (this.getErrorCode(data) === 'VALIDATION_ERROR') {
        const details = this.getErrorDetails(data);
        
        if (Array.isArray(details)) {
          const validationMessages = details
            .map((err: any) => {
              // Formato Zod error
              if (err.message) return err.message;
              if (err.path && err.message) {
                const path = Array.isArray(err.path) ? err.path.join('.') : err.path;
                return `${path}: ${err.message}`;
              }
              return JSON.stringify(err);
            })
            .filter(Boolean)
            .join(', ');
          
          if (validationMessages) {
            return `${mainMessage}: ${validationMessages}`;
          }
        }
      }
      
      return mainMessage;
    }
    
    // Per errori con message
    if (error.message) return error.message;
    
    return 'Errore sconosciuto';
  }

  /**
   * Verifica se un errore è di validazione
   */
  static isValidationError(error: any): boolean {
    return this.getErrorCode(error) === 'VALIDATION_ERROR';
  }

  /**
   * Verifica se un errore è di autenticazione
   */
  static isAuthError(error: any): boolean {
    const code = this.getErrorCode(error);
    return code === 'UNAUTHORIZED' || 
           code === 'TOKEN_EXPIRED' || 
           code === 'TOKEN_INVALID';
  }

  /**
   * Verifica se un errore è di autorizzazione
   */
  static isAuthorizationError(error: any): boolean {
    const code = this.getErrorCode(error);
    return code === 'FORBIDDEN' || 
           code === 'INSUFFICIENT_PERMISSIONS';
  }

  /**
   * Estrae i dettagli di validazione in formato chiave-valore
   */
  static getValidationErrors(error: any): Record<string, string> | null {
    if (!this.isValidationError(error)) return null;
    
    const details = this.getErrorDetails(error);
    if (!Array.isArray(details)) return null;
    
    const errors: Record<string, string> = {};
    
    details.forEach((err: any) => {
      if (err.path && err.message) {
        const path = Array.isArray(err.path) ? err.path.join('.') : String(err.path);
        errors[path] = err.message;
      }
    });
    
    return Object.keys(errors).length > 0 ? errors : null;
  }
}

// Export di convenienza per le funzioni più comuni
export const getErrorMessage = ResponseFormatter.getErrorMessage.bind(ResponseFormatter);
export const isValidationError = ResponseFormatter.isValidationError.bind(ResponseFormatter);
export const isAuthError = ResponseFormatter.isAuthError.bind(ResponseFormatter);
export const isAuthorizationError = ResponseFormatter.isAuthorizationError.bind(ResponseFormatter);
export const getValidationErrors = ResponseFormatter.getValidationErrors.bind(ResponseFormatter);
