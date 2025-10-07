/**
 * 📍 USE LOCATION SHARING HOOK
 * 
 * Hook per la condivisione della posizione del professionista
 * Gestisce il tracking GPS automatico e l'invio al backend
 * 
 * Funzionalità:
 * - Tracking GPS ad alta precisione
 * - Invio automatico ogni 10-30 secondi
 * - Gestione errori e fallback
 * - Controllo consenso privacy
 * - Ottimizzazione batteria
 * 
 * @version 1.0.0
 * @author Sistema Richiesta Assistenza
 * @date 5 Ottobre 2025
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { logger } from '../utils/logger';

// ============================================
// INTERFACES & TYPES
// ============================================

interface LocationSharingOptions {
  enabled: boolean;
  highAccuracy?: boolean;
  updateInterval?: number; // milliseconds
  onLocationUpdate?: (position: GeolocationPosition) => void;
  onError?: (error: GeolocationPositionError) => void;
  onStatusChange?: (status: LocationSharingStatus) => void;
}

interface LocationSharingStatus {
  isActive: boolean;
  lastUpdate: Date | null;
  error: string | null;
  accuracy: number | null;
  watchId: number | null;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_UPDATE_INTERVAL = 15 * 1000; // 15 secondi
const HIGH_ACCURACY_INTERVAL = 10 * 1000;  // 10 secondi (alta precisione)
const LOW_ACCURACY_INTERVAL = 30 * 1000;   // 30 secondi (risparmio batteria)

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 15000,        // 15 secondi timeout
  maximumAge: 30000      // Cache location per 30 secondi
};

const GEOLOCATION_OPTIONS_LOW_POWER: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 30000,        // 30 secondi timeout
  maximumAge: 60000      // Cache location per 1 minuto
};

// ============================================
// HOOK
// ============================================

export function useLocationSharing({
  enabled,
  highAccuracy = true,
  updateInterval,
  onLocationUpdate,
  onError,
  onStatusChange
}: LocationSharingOptions) {
  
  // ============================================
  // STATE
  // ============================================

  const [status, setStatus] = useState<LocationSharingStatus>({
    isActive: false,
    lastUpdate: null,
    error: null,
    accuracy: null,
    watchId: null
  });

  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);

  // ============================================
  // REFS
  // ============================================

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentLocationRef = useRef<LocationData | null>(null);
  const retryCountRef = useRef<number>(0);

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Mutation per inviare la posizione al backend
   */
  const updateLocationMutation = useMutation({
    mutationFn: (locationData: LocationData) => 
      api.post('/location/update', locationData),
    
    onSuccess: (response, variables) => {
      logger.debug('[LocationSharing] Position sent successfully', variables);
      lastSentLocationRef.current = variables;
      retryCountRef.current = 0; // Reset retry count
      
      // Aggiorna status
      setStatus(prev => ({
        ...prev,
        lastUpdate: new Date(),
        error: null
      }));
    },
    
    onError: (error, variables) => {
      logger.error('[LocationSharing] Failed to send position:', {
        error: error instanceof Error ? error.message : 'Unknown',
        position: variables
      });
      
      retryCountRef.current++;
      
      // Aggiorna status con errore
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Errore invio posizione'
      }));

      // Retry con backoff se non troppi tentativi
      if (retryCountRef.current <= 3) {
        setTimeout(() => {
          updateLocationMutation.mutate(variables);
        }, retryCountRef.current * 2000); // 2s, 4s, 6s
      }
    }
  });

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Verifica supporto geolocalizzazione e permessi
   */
  useEffect(() => {
    const checkSupport = async () => {
      // Verifica supporto API
      const supported = 'geolocation' in navigator;
      setIsSupported(supported);

      if (!supported) {
        logger.warn('[LocationSharing] Geolocation not supported');
        return;
      }

      // Verifica permessi se disponibile
      if ('permissions' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          setPermissionStatus(permission.state);
          
          // Ascolta cambiamenti permessi
          permission.addEventListener('change', () => {
            setPermissionStatus(permission.state);
          });
        } catch (error) {
          logger.warn('[LocationSharing] Permission API not supported:', error);
        }
      }
    };

    checkSupport();
  }, []);

  /**
   * Gestisce attivazione/disattivazione tracking
   */
  useEffect(() => {
    if (!enabled || !isSupported) {
      stopTracking();
      return;
    }

    startTracking();

    return () => {
      stopTracking();
    };
  }, [enabled, isSupported, highAccuracy]);

  /**
   * Notifica cambiamenti status
   */
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // ============================================
  // LOCATION HANDLING
  // ============================================

  /**
   * Callback successo posizione
   */
  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const { coords } = position;
    
    logger.debug('[LocationSharing] Got position:', {
      lat: coords.latitude.toFixed(6),
      lng: coords.longitude.toFixed(6),
      accuracy: coords.accuracy
    });

    // Aggiorna status
    setStatus(prev => ({
      ...prev,
      isActive: true,
      accuracy: coords.accuracy,
      error: null
    }));

    // Callback esterno
    onLocationUpdate?.(position);

    // Prepara dati per invio
    const locationData: LocationData = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: coords.accuracy,
      heading: coords.heading || undefined,
      speed: coords.speed || undefined
    };

    // Controlla se la posizione è sufficientemente diversa dalla precedente
    if (shouldSendUpdate(locationData)) {
      updateLocationMutation.mutate(locationData);
    }

  }, [onLocationUpdate, updateLocationMutation]);

  /**
   * Callback errore posizione
   */
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Errore sconosciuto';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permesso geolocalizzazione negato';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Posizione non disponibile';
        break;
      case error.TIMEOUT:
        errorMessage = 'Timeout richiesta posizione';
        break;
    }

    logger.error('[LocationSharing] Geolocation error:', {
      code: error.code,
      message: errorMessage
    });

    // Aggiorna status
    setStatus(prev => ({
      ...prev,
      isActive: false,
      error: errorMessage
    }));

    // Callback esterno
    onError?.(error);

    // Retry automatico per errori temporanei
    if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
      setTimeout(() => {
        if (enabled && watchIdRef.current) {
          startTracking();
        }
      }, 5000);
    }

  }, [enabled, onError]);

  // ============================================
  // TRACKING CONTROL
  // ============================================

  /**
   * Avvia il tracking GPS
   */
  const startTracking = useCallback(() => {
    if (!isSupported || !enabled) return;

    // Pulisci tracking precedente
    stopTracking();

    logger.info('[LocationSharing] Starting location tracking', {
      highAccuracy,
      updateInterval: updateInterval || (highAccuracy ? HIGH_ACCURACY_INTERVAL : LOW_ACCURACY_INTERVAL)
    });

    // Opzioni geolocalizzazione
    const options = highAccuracy ? GEOLOCATION_OPTIONS : GEOLOCATION_OPTIONS_LOW_POWER;

    // Avvia watch position
    const watchId = navigator.geolocation.watchPosition(
      handleLocationSuccess,
      handleLocationError,
      options
    );

    watchIdRef.current = watchId;

    // Aggiorna status
    setStatus(prev => ({
      ...prev,
      isActive: true,
      watchId,
      error: null
    }));

    // Interval di backup per invio periodico
    const interval = updateInterval || (highAccuracy ? HIGH_ACCURACY_INTERVAL : LOW_ACCURACY_INTERVAL);
    
    intervalRef.current = setInterval(() => {
      // Richiesta posizione singola come backup
      navigator.geolocation.getCurrentPosition(
        handleLocationSuccess,
        handleLocationError,
        options
      );
    }, interval);

  }, [
    isSupported, 
    enabled, 
    highAccuracy, 
    updateInterval, 
    handleLocationSuccess, 
    handleLocationError
  ]);

  /**
   * Ferma il tracking GPS
   */
  const stopTracking = useCallback(() => {
    logger.info('[LocationSharing] Stopping location tracking');

    // Ferma watch position
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Ferma interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Reset refs
    lastSentLocationRef.current = null;
    retryCountRef.current = 0;

    // Aggiorna status
    setStatus(prev => ({
      ...prev,
      isActive: false,
      watchId: null,
      error: null
    }));

  }, []);

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Determina se inviare aggiornamento posizione
   */
  const shouldSendUpdate = useCallback((newLocation: LocationData): boolean => {
    const lastLocation = lastSentLocationRef.current;
    
    if (!lastLocation) return true;

    // Calcola distanza approssimativa in metri
    const latDiff = Math.abs(newLocation.latitude - lastLocation.latitude);
    const lngDiff = Math.abs(newLocation.longitude - lastLocation.longitude);
    
    // Approssimazione: 1 grado ≈ 111km
    const distance = Math.sqrt(
      Math.pow(latDiff * 111000, 2) + 
      Math.pow(lngDiff * 111000 * Math.cos(newLocation.latitude * Math.PI / 180), 2)
    );

    // Invia se movimento > 10 metri o più di 15 secondi dall'ultimo invio
    const timeDiff = Date.now() - (status.lastUpdate?.getTime() || 0);
    
    return distance > 10 || timeDiff > 15000;
  }, [status.lastUpdate]);

  /**
   * Richiede permesso manualmente
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionStatus('granted');
          resolve(true);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setPermissionStatus('denied');
          }
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }, [isSupported]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Status
    isSupported,
    isActive: status.isActive,
    permissionStatus,
    lastUpdate: status.lastUpdate,
    accuracy: status.accuracy,
    error: status.error,
    
    // Loading states
    isSending: updateLocationMutation.isPending,
    
    // Controls
    startTracking,
    stopTracking,
    requestPermission,
    
    // Info
    retryCount: retryCountRef.current,
    watchId: status.watchId
  };
}

export default useLocationSharing;
