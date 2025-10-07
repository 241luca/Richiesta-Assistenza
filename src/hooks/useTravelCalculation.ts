/**
 * 🚗 USE TRAVEL CALCULATION - Hook Moderno
 * 
 * Hook per calcolare distanze con @vis.gl/react-google-maps
 * Sistema modernizzato v5.2
 * 
 * Data: 2 Ottobre 2025
 */

import { useState, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface TravelResult {
  distance: number; // metri
  duration: number; // secondi
  distanceText: string;
  durationText: string;
  cost: number; // euro
}

interface UseTravelCalculationReturn {
  calculateTravel: (origin: string, destination: string) => Promise<TravelResult | null>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook per calcolare distanze usando Google Maps DirectionsService
 * 
 * @example
 * ```tsx
 * const { calculateTravel, isLoading } = useTravelCalculation();
 * 
 * const result = await calculateTravel(
 *   'Via Roma 1, Milano',
 *   'Via Dante 10, Roma'
 * );
 * 
 * console.log(result.distanceText); // "573 km"
 * console.log(result.cost); // 286.50
 * ```
 */
export function useTravelCalculation(): UseTravelCalculationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Carica la libreria routes da Google Maps
  const routesLibrary = useMapsLibrary('routes');

  /**
   * Calcola costo viaggio (€0.50/km)
   */
  const calculateCost = (distanceMeters: number): number => {
    const km = distanceMeters / 1000;
    return Math.round(km * 0.50 * 100) / 100;
  };

  /**
   * Calcola informazioni viaggio tra due indirizzi
   */
  const calculateTravel = useCallback(
    async (origin: string, destination: string): Promise<TravelResult | null> => {
      if (!routesLibrary) {
        setError('Google Maps library non ancora caricata');
        return null;
      }

      if (!origin || !destination) {
        setError('Origine e destinazione sono obbligatori');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const directionsService = new routesLibrary.DirectionsService();

        const response = await directionsService.route({
          origin,
          destination,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        });

        if (!response.routes || response.routes.length === 0) {
          throw new Error('Nessun percorso trovato');
        }

        const route = response.routes[0];
        const leg = route.legs[0];

        if (!leg.distance || !leg.duration) {
          throw new Error('Dati percorso incompleti');
        }

        const result: TravelResult = {
          distance: leg.distance.value,
          duration: leg.duration.value,
          distanceText: leg.distance.text,
          durationText: leg.duration.text,
          cost: calculateCost(leg.distance.value)
        };

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Errore calcolo viaggio';
        setError(errorMessage);
        console.error('Errore calculateTravel:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [routesLibrary]
  );

  return {
    calculateTravel,
    isLoading,
    error
  };
}

/**
 * Hook semplificato per calcolare solo la distanza
 */
export function useDistanceCalculation() {
  const { calculateTravel, isLoading, error } = useTravelCalculation();

  const calculateDistance = useCallback(
    async (origin: string, destination: string): Promise<number | null> => {
      const result = await calculateTravel(origin, destination);
      return result ? result.distance : null;
    },
    [calculateTravel]
  );

  return {
    calculateDistance,
    isLoading,
    error
  };
}
