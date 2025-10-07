/**
 * useGoogleMaps Hook
 * Carica Google Maps API dinamicamente dal database
 * 
 * 🆕 v5.1.1: Hook React per gestione Google Maps centralizzata
 */

import { useState, useEffect } from 'react';
import { googleMapsConfig } from '../services/googleMapsConfig';

interface UseGoogleMapsResult {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  apiKey: string | null;
  loadError: Error | null;
}

/**
 * Hook per caricare Google Maps API
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isLoaded, isLoading, error } = useGoogleMaps();
 *   
 *   if (isLoading) return <div>Loading Google Maps...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!isLoaded) return null;
 *   
 *   // Usa Google Maps API
 *   return <div>Map component here</div>;
 * }
 * ```
 */
export function useGoogleMaps(): UseGoogleMapsResult {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadMaps() {
      try {
        // Controlla se già caricato
        if (window.google && window.google.maps) {
          if (isMounted) {
            setIsLoaded(true);
            setIsLoading(false);
          }
          return;
        }

        setIsLoading(true);
        setError(null);

        // Carica API key e script
        await googleMapsConfig.loadGoogleMapsScript();
        
        // Ottieni API key per info
        const key = await googleMapsConfig.getApiKey();

        if (isMounted) {
          setApiKey(key);
          setIsLoaded(true);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error loading Google Maps:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load Google Maps');
          setLoadError(err);
          setIsLoading(false);
        }
      }
    }

    loadMaps();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isLoaded,
    isLoading,
    error,
    apiKey,
    loadError
  };
}

/**
 * Hook che ritorna solo quando Google Maps è caricato
 * Semplifica l'uso quando non serve gestire loading/error
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const isReady = useGoogleMapsReady();
 *   
 *   if (!isReady) return null;
 *   
 *   // Google Maps è pronto
 *   return <Map />;
 * }
 * ```
 */
export function useGoogleMapsReady(): boolean {
  const { isLoaded } = useGoogleMaps();
  return isLoaded;
}

export default useGoogleMaps;
