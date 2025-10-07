/**
 * useFormDraft Hook
 * Hook per gestire il salvataggio automatico delle bozze nei form
 * Salva automaticamente i dati nel localStorage ogni 5 secondi
 */

import { useEffect, useCallback, useRef } from 'react';

// Utility function: Implementazione semplice di debounce
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, wait);
  }) as T & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  debounced.flush = () => {
    if (timeoutId && lastArgs) {
      clearTimeout(timeoutId);
      func(...lastArgs);
      timeoutId = null;
    }
  };

  return debounced;
}

// Interfaccia per i dati della bozza
interface DraftData<T> {
  data: T;
  timestamp: string;
  formId: string;
}

// Interfaccia per le opzioni del hook
interface UseFormDraftOptions {
  enabled?: boolean;
  debounceMs?: number;
  maxAge?: number; // in giorni
}

/**
 * Hook per gestire il salvataggio automatico delle bozze
 * @param formData - I dati del form da salvare
 * @param key - Chiave univoca per identificare la bozza
 * @param options - Opzioni di configurazione
 */
export const useFormDraft = <T extends Record<string, any>>(
  formData: T,
  key: string,
  options: UseFormDraftOptions = {}
) => {
  const {
    enabled = true,
    debounceMs = 5000, // 5 secondi di default
    maxAge = 7 // 7 giorni di default
  } = options;

  // Genera la chiave completa per il localStorage
  const getStorageKey = useCallback((draftKey: string) => {
    return `draft_${draftKey}`;
  }, []);

  // Funzione per salvare la bozza
  const saveDraft = useCallback(
    debounce(() => {
      if (!enabled) return;

      try {
        const draftData: DraftData<T> = {
          data: formData,
          timestamp: new Date().toISOString(),
          formId: key
        };

        localStorage.setItem(
          getStorageKey(key),
          JSON.stringify(draftData)
        );

        console.log(`✓ Bozza salvata: ${key}`, {
          timestamp: draftData.timestamp,
          fields: Object.keys(formData).length
        });
      } catch (error) {
        console.error('Errore durante il salvataggio della bozza:', error);
      }
    }, debounceMs),
    [formData, key, enabled, debounceMs, getStorageKey]
  );

  // Auto-save quando i dati cambiano
  useEffect(() => {
    if (!enabled) return;

    // Verifica che i dati non siano vuoti
    const hasData = Object.values(formData).some(value => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    });

    if (hasData) {
      saveDraft();
    }

    // Cleanup della funzione debounced
    return () => {
      saveDraft.cancel();
    };
  }, [formData, enabled, saveDraft]);

  // Funzione per caricare una bozza esistente
  const loadDraft = useCallback((): DraftData<T> | null => {
    try {
      const draftString = localStorage.getItem(getStorageKey(key));
      if (!draftString) return null;

      const draft: DraftData<T> = JSON.parse(draftString);

      // Verifica se la bozza non è troppo vecchia
      const draftDate = new Date(draft.timestamp);
      const now = new Date();
      const daysDiff = (now.getTime() - draftDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > maxAge) {
        // Bozza troppo vecchia, la eliminiamo
        localStorage.removeItem(getStorageKey(key));
        console.log(`🗑️ Bozza eliminata (troppo vecchia): ${key}`);
        return null;
      }

      console.log(`📄 Bozza caricata: ${key}`, {
        timestamp: draft.timestamp,
        age: `${Math.round(daysDiff * 24)}h fa`
      });

      return draft;
    } catch (error) {
      console.error('Errore durante il caricamento della bozza:', error);
      return null;
    }
  }, [key, maxAge, getStorageKey]);

  // Funzione per eliminare una bozza
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(key));
      console.log(`🗑️ Bozza eliminata: ${key}`);
    } catch (error) {
      console.error('Errore durante l\'eliminazione della bozza:', error);
    }
  }, [key, getStorageKey]);

  // Funzione per verificare se esiste una bozza
  const hasDraft = useCallback((): boolean => {
    const draft = loadDraft();
    return draft !== null;
  }, [loadDraft]);

  // Funzione per ottenere informazioni sulla bozza
  const getDraftInfo = useCallback(() => {
    const draft = loadDraft();
    if (!draft) return null;

    const draftDate = new Date(draft.timestamp);
    const now = new Date();
    const diffMs = now.getTime() - draftDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    let timeAgo = '';
    if (diffHours > 0) {
      timeAgo = `${diffHours}h fa`;
    } else if (diffMinutes > 0) {
      timeAgo = `${diffMinutes}min fa`;
    } else {
      timeAgo = 'Pochi secondi fa';
    }

    return {
      timestamp: draft.timestamp,
      timeAgo,
      fieldsCount: Object.keys(draft.data).length,
      hasContent: Object.values(draft.data).some(value => {
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        return value !== null && value !== undefined;
      })
    };
  }, [loadDraft]);

  // Cleanup delle bozze vecchie all'inizializzazione
  useEffect(() => {
    const cleanupOldDrafts = () => {
      try {
        const keysToRemove: string[] = [];
        
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('draft_')) {
            try {
              const draftString = localStorage.getItem(key);
              if (draftString) {
                const draft = JSON.parse(draftString);
                const draftDate = new Date(draft.timestamp);
                const now = new Date();
                const daysDiff = (now.getTime() - draftDate.getTime()) / (1000 * 60 * 60 * 24);
                
                if (daysDiff > maxAge) {
                  keysToRemove.push(key);
                }
              }
            } catch {
              // Se non riesce a parsare, elimina la chiave corrotta
              keysToRemove.push(key);
            }
          }
        }

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🧹 Bozza vecchia eliminata: ${key}`);
        });

        if (keysToRemove.length > 0) {
          console.log(`🧹 Cleanup completato: ${keysToRemove.length} bozze eliminate`);
        }
      } catch (error) {
        console.error('Errore durante il cleanup delle bozze:', error);
      }
    };

    cleanupOldDrafts();
  }, [maxAge]);

  return {
    // Funzioni principali
    loadDraft,
    clearDraft,
    saveDraft: saveDraft.flush, // Forza il salvataggio immediato
    
    // Utility
    hasDraft,
    getDraftInfo,
    
    // Stato
    isEnabled: enabled
  };
};

export default useFormDraft;
