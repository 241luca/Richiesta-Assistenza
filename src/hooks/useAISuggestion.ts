import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

// Simple debounce implementation (since lodash is not available)
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };
  
  return debounced;
}

// Simple logger (since utils/logger might not exist)
const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[useAISuggestion] ${message}`, data);
    }
  },
  error: (message: string, data?: any) => {
    console.error(`[useAISuggestion] ${message}`, data);
  }
};

export interface AISuggestion {
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  estimatedDuration: number;
  confidence: number;
  reason: string;
}

interface UseAISuggestionOptions {
  enabled?: boolean;
  minLength?: number;
  debounceMs?: number;
  confidenceThreshold?: number;
}

export const useAISuggestion = (
  description: string, 
  options: UseAISuggestionOptions = {}
) => {
  const {
    enabled = true,
    minLength = 20,
    debounceMs = 1500, // 1.5 secondi di pausa prima di chiamare l'AI
    confidenceThreshold = 0.7 // Mostra solo suggerimenti con confidenza > 70%
  } = options;

  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Funzione per recuperare il suggerimento AI
  const fetchSuggestion = useCallback(async (text: string) => {
    if (!enabled || text.length < minLength) {
      setSuggestion(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // CORRETTO: Usa API service senza /api prefix
      const response = await api.post('/ai/categorize-request', { 
        description: text 
      });
      
      // Estrai i dati dalla risposta usando ResponseFormatter
      const data: AISuggestion = response.data?.data || response.data;

      // Mostra il suggerimento solo se la confidenza è sopra la soglia
      if (data.confidence >= confidenceThreshold) {
        setSuggestion(data);
        
        // Log per debugging (solo in development)
        if (process.env.NODE_ENV === 'development') {
          logger.info('AI Suggestion received:', {
            category: data.categoryName,
            subcategory: data.subcategoryName,
            confidence: data.confidence,
            priority: data.priority
          });
        }
      } else {
        setSuggestion(null);
        
        // Log bassa confidenza
        if (process.env.NODE_ENV === 'development') {
          logger.info('AI Suggestion ignored due to low confidence:', {
            confidence: data.confidence,
            threshold: confidenceThreshold
          });
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error?.message ||
                          'Errore AI temporaneo';
      
      setError(errorMessage);
      setSuggestion(null);
      
      // Log errore (non mostrare toast per non infastidire l'utente)
      logger.error('AI Suggestion error:', {
        error: errorMessage,
        description: text.substring(0, 50) + '...'
      });
      
      // Se l'AI non è configurata, non è un errore "vero"
      if (err.response?.status === 503) {
        setError('AI non configurata'); // Messaggio più user-friendly
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, minLength, confidenceThreshold]);

  // Debounced version della funzione
  const debouncedFetchSuggestion = useCallback(
    debounce(fetchSuggestion, debounceMs),
    [fetchSuggestion, debounceMs]
  );

  // Effect che triggera la ricerca quando cambia la descrizione
  useEffect(() => {
    if (!enabled) {
      setSuggestion(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Reset degli stati quando la descrizione è troppo corta
    if (description.length < minLength) {
      setSuggestion(null);
      setError(null);
      setLoading(false);
      debouncedFetchSuggestion.cancel(); // Cancella chiamate pendenti
      return;
    }

    // Chiamata debounced all'AI
    debouncedFetchSuggestion(description);

    // Cleanup function
    return () => {
      debouncedFetchSuggestion.cancel();
    };
  }, [description, enabled, minLength, debouncedFetchSuggestion]);

  // Funzione per accettare il suggerimento (per uso nei form)
  const acceptSuggestion = useCallback(() => {
    return suggestion;
  }, [suggestion]);

  // Funzione per dismissare il suggerimento
  const dismissSuggestion = useCallback(() => {
    setSuggestion(null);
    setError(null);
  }, []);

  // Funzione per forzare il refresh del suggerimento
  const refreshSuggestion = useCallback(() => {
    if (description.length >= minLength) {
      fetchSuggestion(description);
    }
  }, [description, minLength, fetchSuggestion]);

  return {
    suggestion,
    loading,
    error,
    acceptSuggestion,
    dismissSuggestion,
    refreshSuggestion,
    
    // Utilities
    hasSuggestion: !!suggestion,
    isEnabled: enabled,
    isDescriptionLongEnough: description.length >= minLength
  };
};

export default useAISuggestion;
