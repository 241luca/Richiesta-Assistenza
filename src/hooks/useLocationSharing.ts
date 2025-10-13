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
  timestamp: number;
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
// FRONTEND LOGGER (sostituisce il logger backend)
// ============================================

const logger = {
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[LocationSharing] ${message}`, data);
    }
  },
  error: (message: string, data?: any) => {
    console.error(`[LocationSharing] ${message}`, data);
  },
  info: (message: string, data?: any) => {
    console.info(`[LocationSharing] ${message}`, data);
  }
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
      logger.debug('Position sent successfully', variables);
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
      logger.error('Failed to send position:', {
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
        }, retryCountRef.current * 2000); // Backoff esponenziale
      }
    }
  });

  // ============================================
  // CALLBACKS
  // ============================================

  /**
   * Gestisce il successo della geolocalizzazione
   */
  const handleLocationSuccess = useCallback((position: GeolocationPosition) => {
    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: position.timestamp
    };

    logger.debug('Location obtained', locationData);

    // Aggiorna status
    setStatus(prev => ({
      ...prev,
      accuracy: position.coords.accuracy,
      error: null
    }));

    // Callback personalizzato
    onLocationUpdate?.(position);

    // Invia al backend solo se la posizione è cambiata significativamente
    const lastLocation = lastSentLocationRef.current;
    if (!lastLocation || hasLocationChanged(lastLocation, locationData)) {
      updateLocationMutation.mutate(locationData);
    }
  }, [onLocationUpdate, updateLocationMutation]);

  /**
   * Gestisce gli errori di geolocalizzazione
   */
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    let errorMessage = 'Errore geolocalizzazione';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Permesso geolocalizzazione negato';
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Posizione non disponibile';
        break;
      case error.TIMEOUT:
        errorMessage = 'Timeout geolocalizzazione';
        break;
    }

    logger.error('Geolocation error:', { code: error.code, message: error.message });

    // Aggiorna status
    setStatus(prev => ({
      ...prev,
      error: errorMessage
    }));

    // Callback personalizzato
    onError?.(error);
  }, [onError]);

  /**
   * Avvia il tracking della posizione
   */
  const startTracking = useCallback(() => {
    if (!isSupported || !enabled) {
      logger.debug('Tracking not started - not supported or not enabled');
      return;
    }

    logger.info('Starting location tracking');

    const options = highAccuracy ? GEOLOCATION_OPTIONS : GEOLOCATION_OPTIONS_LOW_POWER;
    
    // Avvia il watch
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

    logger.debug('Location tracking started', { watchId, options });
  }, [isSupported, enabled, highAccuracy, handleLocationSuccess, handleLocationError]);

  /**
   * Ferma il tracking della posizione
   */
  const stopTracking = useCallback(() => {
    logger.info('Stopping location tracking');

    // Ferma il watch
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Ferma l'interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Aggiorna status
    setStatus(prev => ({
      ...prev,
      isActive: false,
      watchId: null
    }));

    logger.debug('Location tracking stopped');
  }, []);

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  /**
   * Verifica se la posizione è cambiata significativamente
   */
  function hasLocationChanged(oldLocation: LocationData, newLocation: LocationData): boolean {
    const distance = calculateDistance(
      oldLocation.latitude,
      oldLocation.longitude,
      newLocation.latitude,
      newLocation.longitude
    );

    // Considera cambiata se distanza > 10 metri
    return distance > 0.01; // ~10 metri
  }

  /**
   * Calcola la distanza tra due punti (formula di Haversine)
   */
  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Raggio della Terra in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Verifica supporto geolocalizzazione
   */
  useEffect(() => {
    const supported = 'geolocation' in navigator;
    setIsSupported(supported);

    if (!supported) {
      logger.error('Geolocation not supported');
      setStatus(prev => ({
        ...prev,
        error: 'Geolocalizzazione non supportata'
      }));
    }
  }, []);

  /**
   * Verifica permessi geolocalizzazione
   */
  useEffect(() => {
    if (!isSupported) return;

    // Verifica permessi se supportati
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' })
        .then(result => {
          setPermissionStatus(result.state);
          logger.debug('Geolocation permission status:', result.state);
        })
        .catch(error => {
          logger.error('Failed to check geolocation permission:', error);
        });
    }
  }, [isSupported]);

  /**
   * Gestisce l'avvio/stop del tracking
   */
  useEffect(() => {
    if (enabled && isSupported && permissionStatus !== 'denied') {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, isSupported, permissionStatus, startTracking, stopTracking]);

  /**
   * Notifica cambiamenti di status
   */
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  /**
   * Cleanup al dismount
   */
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // ============================================
  // RETURN
  // ============================================

  return {
    // Status
    isActive: status.isActive,
    isSupported,
    permissionStatus,
    lastUpdate: status.lastUpdate,
    error: status.error,
    accuracy: status.accuracy,
    
    // Actions
    startTracking,
    stopTracking,
    
    // Mutation status
    isSending: updateLocationMutation.isPending,
    sendError: updateLocationMutation.error,
    
    // Full status object
    status
  };
}

export default useLocationSharing;