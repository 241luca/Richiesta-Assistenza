/**
 * Hook per calcolare distanze tra professionista e richieste
 * Utilizza il nuovo servizio Google Maps con cache
 */

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from './useAuth';

interface DistanceInfo {
  requestId: string;
  distance: number; // km
  duration: number; // minuti
  distanceText: string;
  durationText: string;
}

interface UseRequestDistancesOptions {
  enabled?: boolean;
  professionalAddress?: string;
  professionalCoordinates?: {
    lat: number;
    lng: number;
  };
}

export function useRequestDistances(
  requestIds: string[],
  options: UseRequestDistancesOptions = {}
) {
  const { user } = useAuth();
  const [distances, setDistances] = useState<Record<string, DistanceInfo>>({});

  // Recupera l'indirizzo di lavoro del professionista se non fornito
  const { data: workAddress } = useQuery({
    queryKey: ['professional-work-address', user?.id],
    queryFn: async () => {
      if (user?.role !== 'PROFESSIONAL' || options.professionalAddress) {
        return null;
      }
      
      try {
        const response = await api.get(`/travel/work-address`);
        return response.data?.data || response.data;
      } catch (error) {
        console.error('Error fetching work address:', error);
        return null;
      }
    },
    enabled: user?.role === 'PROFESSIONAL' && !options.professionalAddress && options.enabled !== false
  });

  // Calcola le distanze in batch
  const { data: distanceData, isLoading } = useQuery({
    queryKey: ['request-distances', requestIds, workAddress, options.professionalCoordinates],
    queryFn: async () => {
      // Determina l'origine (indirizzo di lavoro del professionista)
      let origin = null;
      
      if (options.professionalCoordinates) {
        origin = options.professionalCoordinates;
      } else if (options.professionalAddress) {
        origin = options.professionalAddress;
      } else if (workAddress) {
        if (workAddress.workLatitude && workAddress.workLongitude) {
          origin = {
            lat: workAddress.workLatitude,
            lng: workAddress.workLongitude
          };
        } else if (workAddress.useResidenceAsWorkAddress && workAddress.latitude && workAddress.longitude) {
          origin = {
            lat: workAddress.latitude,
            lng: workAddress.longitude
          };
        } else {
          // Costruisci l'indirizzo testuale
          const addressParts = [];
          if (workAddress.useResidenceAsWorkAddress) {
            if (workAddress.address) addressParts.push(workAddress.address);
            if (workAddress.city) addressParts.push(workAddress.city);
            if (workAddress.province) addressParts.push(workAddress.province);
            if (workAddress.postalCode) addressParts.push(workAddress.postalCode);
          } else {
            if (workAddress.workAddress) addressParts.push(workAddress.workAddress);
            if (workAddress.workCity) addressParts.push(workAddress.workCity);
            if (workAddress.workProvince) addressParts.push(workAddress.workProvince);
            if (workAddress.workPostalCode) addressParts.push(workAddress.workPostalCode);
          }
          
          if (addressParts.length > 0) {
            origin = addressParts.join(', ') + ', Italia';
          }
        }
      }

      if (!origin || requestIds.length === 0) {
        return {};
      }

      try {
        // Chiama l'API per calcolare le distanze in batch
        const response = await api.post('/maps/calculate-distances', {
          origin,
          requestIds,
          mode: 'driving',
          departureTime: 'now' // Include traffico attuale
        });

        const data = response.data?.data || response.data;
        
        // Trasforma i dati in un dizionario per facile accesso
        const distanceMap: Record<string, DistanceInfo> = {};
        
        if (data.distances && Array.isArray(data.distances)) {
          data.distances.forEach((item: any) => {
            if (item.requestId && item.distance) {
              distanceMap[item.requestId] = {
                requestId: item.requestId,
                distance: item.distance,
                duration: item.duration || 0,
                distanceText: item.distanceText || `${item.distance.toFixed(1)} km`,
                durationText: item.durationText || `${item.duration || 0} min`
              };
            }
          });
        }

        return distanceMap;
      } catch (error) {
        console.error('Error calculating distances:', error);
        return {};
      }
    },
    enabled: !!origin && requestIds.length > 0 && options.enabled !== false,
    staleTime: 5 * 60 * 1000, // Cache per 5 minuti
    gcTime: 10 * 60 * 1000 // Mantieni in cache per 10 minuti
  });

  // Aggiorna lo stato quando i dati cambiano
  useEffect(() => {
    if (distanceData) {
      setDistances(distanceData);
    }
  }, [distanceData]);

  return {
    distances,
    isLoading,
    getDistance: (requestId: string) => distances[requestId] || null,
    sortByDistance: (requests: any[]) => {
      return [...requests].sort((a, b) => {
        const distA = distances[a.id]?.distance || Infinity;
        const distB = distances[b.id]?.distance || Infinity;
        return distA - distB;
      });
    }
  };
}

export default useRequestDistances;
