/**
 * useGeolocation Hook
 * Gestisce la geolocalizzazione automatica del browser con reverse geocoding
 * 
 * 🆕 v5.1: Hook per Geo Auto-Detect con integrazione backend
 * ✅ Usa API browser + reverse geocoding backend
 * ✅ Gestione errori completa per privacy
 * ✅ Pattern React Query per il reverse geocoding
 */

import { useState, useCallback } from 'react';
import { api } from '../services/api';
import { logger } from '../utils/logger';

interface GeolocationCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
}

interface GeolocationResult {
  coordinates: GeolocationCoordinates;
  address: string;
  timestamp: number;
}

interface UseGeolocationReturn {
  // Stati
  location: GeolocationResult | null;
  isLoading: boolean;
  error: string | null;
  
  // Funzioni
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
  
  // Metadati
  isSupported: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook per la geolocalizzazione automatica con reverse geocoding
 * 
 * @example
 * ```tsx
 * function AddressForm() {
 *   const { 
 *     location, 
 *     isLoading, 
 *     error, 
 *     requestLocation,
 *     isSupported 
 *   } = useGeolocation();
 * 
 *   const handleAutoDetect = async () => {
 *     await requestLocation();
 *     if (location) {
 *       setAddress(location.address);
 *     }
 *   };
 * 
 *   if (!isSupported) {
 *     return <p>Geolocalizzazione non supportata</p>;
 *   }
 * 
 *   return (
 *     <div>
 *       <button onClick={handleAutoDetect} disabled={isLoading}>
 *         {isLoading ? 'Rilevamento...' : 'Usa la mia posizione'}
 *       </button>
 *       {error && <p className="text-red-600">{error}</p>}
 *       {location && <p>Indirizzo: {location.address}</p>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useGeolocation(): UseGeolocationReturn {
  // Stati locali
  const [location, setLocation] = useState<GeolocationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Verifica supporto geolocalizzazione
  const isSupported = 'geolocation' in navigator;

  /**
   * Funzione principale per richiedere la posizione
   */
  const requestLocation = useCallback(async (): Promise<void> => {
    // Controllo supporto browser
    if (!isSupported) {
      const errorMsg = 'Geolocalizzazione non supportata dal browser';
      setError(errorMsg);
      logger.warn('Geolocation API not supported');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Richiedi permessi e posizione GPS
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true, // Precisione massima
            timeout: 15000,           // 15 secondi timeout
            maximumAge: 300000        // Cache 5 minuti
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;

      logger.info(`📍 GPS coordinates obtained: ${latitude}, ${longitude} (accuracy: ${accuracy}m)`);

      // 2. Reverse geocoding usando il nostro backend
      const response = await api.post('/geocode/reverse', {
        lat: latitude,
        lng: longitude
      });

      if (!response.data.success) {
        throw new Error('Impossibile determinare l\'indirizzo dalla posizione');
      }

      const address = response.data.data.address;
      
      // 3. Costruisci il risultato completo
      const result: GeolocationResult = {
        coordinates: {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy
        },
        address: address,
        timestamp: Date.now()
      };

      setLocation(result);
      setLastUpdated(new Date());
      setError(null);

      logger.info(`✅ Geolocation successful: ${address}`);

    } catch (err: any) {
      let errorMessage = 'Errore sconosciuto durante la geolocalizzazione';

      // Gestione errori specifici del browser
      if (err?.code) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Permesso per la posizione negato. Abilitalo nelle impostazioni del browser.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Posizione non disponibile. Verifica di essere connesso a internet.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Timeout nella richiesta di posizione. Riprova.';
            break;
          default:
            errorMessage = 'Errore del browser nella geolocalizzazione.';
        }
      } else if (err?.response?.data?.message) {
        // Errore dal nostro backend
        errorMessage = `Errore reverse geocoding: ${err.response.data.message}`;
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setLocation(null);
      
      logger.error('Geolocation error:', {
        error: err,
        code: err?.code,
        message: err?.message
      });
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  /**
   * Pulisce la posizione corrente
   */
  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
    setLastUpdated(null);
  }, []);

  return {
    // Stati
    location,
    isLoading,
    error,
    
    // Funzioni
    requestLocation,
    clearLocation,
    
    // Metadati
    isSupported,
    lastUpdated
  };
}

/**
 * Hook semplificato che ritorna solo le coordinate
 * Utile quando serve solo la posizione senza reverse geocoding
 */
export function useGeolocationCoordinates() {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCoordinates = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError('Geolocalizzazione non supportata');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000
        });
      });

      setCoordinates({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      });
    } catch (err: any) {
      setError(err.message || 'Errore nella geolocalizzazione');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    coordinates,
    isLoading,
    error,
    requestCoordinates,
    clearCoordinates: () => setCoordinates(null)
  };
}

export default useGeolocation;
