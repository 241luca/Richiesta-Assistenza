import React, { useState, useEffect } from 'react';
import { MapPinIcon, ClockIcon, CurrencyEuroIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { TruckIcon } from '@heroicons/react/24/solid';
import { api } from '../../services/api';
import { useTravelCalculation } from '../../hooks/useTravelCalculation';
import { useAuth } from '../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface TravelInfo {
  distance: number;
  duration: number;
  distanceText?: string;
  durationText?: string;
  cost: number;
  origin: string;
  destination: string;
  isEstimate: boolean;
}

interface AutoTravelInfoProps {
  requestId: string;
  requestAddress: string;
  onOpenMap?: () => void;
  onOpenItinerary?: () => void;
  // Campi opzionali dal database
  travelDistance?: number;
  travelDuration?: number;
  travelDistanceText?: string;
  travelDurationText?: string;
  travelCost?: number;
}

/**
 * AutoTravelInfo Component
 * Mostra automaticamente le informazioni di viaggio per una richiesta
 * Usa l'endpoint esistente /api/travel/request/:id/travel-info
 * AGGIORNATO: Gestione errori migliorata
 */
export function AutoTravelInfo({ 
  requestId, 
  requestAddress,
  onOpenMap,
  onOpenItinerary,
  travelDistance,
  travelDuration,
  travelDistanceText,
  travelDurationText,
  travelCost
}: AutoTravelInfoProps) {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { calculateTravel } = useTravelCalculation();
  const { user } = useAuth();

  // Usa React Query per ottenere i dati di viaggio dal backend
  const { data: travelInfo, isLoading, error, refetch } = useQuery({
    queryKey: ['travel-info', requestId, user?.id],
    queryFn: async () => {
      // Se abbiamo già i dati dal database, usali
      if (travelDistance && travelDuration && travelDistanceText && travelDurationText && travelCost) {
        console.log('📊 Using saved travel data from DB');
        return {
          distance: travelDistance,
          duration: travelDuration,
          distanceText: travelDistanceText,
          durationText: travelDurationText,
          cost: travelCost,
          origin: '',
          destination: requestAddress,
          isEstimate: false,
          fromCache: true
        };
      }

      // Altrimenti chiama l'API per calcolare
      console.log('🔄 Fetching travel info from API...');
      try {
        const response = await api.get(`/travel/request/${requestId}/travel-info`);
        console.log('✅ Travel info response:', response.data);
        
        if (response.data?.success && response.data?.data) {
          const data = response.data.data;
          return {
            distance: data.distance || 0,
            duration: data.duration || 0,
            distanceText: data.distanceText || formatDistance(data.distance),
            durationText: data.durationText || formatDuration(data.duration),
            cost: data.cost || 0,
            origin: data.origin || '',
            destination: data.destination || requestAddress,
            isEstimate: data.isEstimate || false,
            fromCache: false
          };
        }
        return null;
      } catch (err: any) {
        console.error('❌ Error fetching travel info:', err);
        // Se l'endpoint non funziona, proviamo col calcolo locale
        if (user?.role === 'PROFESSIONAL') {
          return await calculateTravelLocal();
        }
        throw err;
      }
    },
    enabled: !!requestId && !!user && user.role === 'PROFESSIONAL',
    staleTime: 5 * 60 * 1000, // 5 minuti
    retry: 1
  });

  // Calcolo locale come fallback
  const calculateTravelLocal = async () => {
    try {
      // Recupera i dettagli della richiesta
      const requestResponse = await api.get(`/requests/${requestId}`);
      const request = requestResponse.data?.data?.request || requestResponse.data?.data;
      
      if (!request || !request.address || !request.city) {
        return null;
      }

      const destination = `${request.address}, ${request.city}, ${request.province || ''} ${request.postalCode || ''}, Italia`.trim();

      // Ottieni l'indirizzo del professionista
      let origin = '';
      if (user?.role === 'PROFESSIONAL') {
        // Prima prova con work address
        const workAddressResponse = await api.get('/travel/work-address').catch(() => null);
        if (workAddressResponse?.data?.data) {
          const workAddress = workAddressResponse.data.data;
          origin = `${workAddress.workAddress || workAddress.address}, ${workAddress.workCity || workAddress.city}, ${workAddress.workProvince || workAddress.province} ${workAddress.workPostalCode || workAddress.postalCode}, Italia`.trim();
        } else if (user?.address && user?.city) {
          origin = `${user.address}, ${user.city}, ${user.province || ''} ${user.postalCode || ''}, Italia`.trim();
        }
      }

      if (!origin) {
        return null;
      }

      // Calcola usando Google Maps API locale
      const travel = await calculateTravel(origin, destination);
      
      if (travel) {
        return {
          ...travel,
          origin,
          destination,
          isEstimate: true,
          fromCache: false
        };
      }
    } catch (err) {
      console.error('❌ Error in local calculation:', err);
    }
    return null;
  };

  // Funzione per forzare il ricalcolo e salvataggio nel DB
  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      // Chiama l'endpoint per ricalcolare
      const response = await api.post(`/travel/request/${requestId}/recalculate`);
      
      if (response.data?.success) {
        toast.success('Distanza ricalcolata e salvata!');
        await refetch(); // Ricarica i dati
      } else {
        toast.error('Errore nel ricalcolo');
      }
    } catch (err: any) {
      console.error('❌ Error recalculating:', err);
      toast.error(err.response?.data?.message || 'Errore nel ricalcolo');
    } finally {
      setIsRecalculating(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) {
      return `${meters} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes} min`;
  };

  // Se sta caricando
  if (isLoading || isRecalculating) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">
            {isRecalculating ? 'Ricalcolo in corso...' : 'Calcolo distanza in corso...'}
          </span>
        </div>
      </div>
    );
  }

  // Se c'è un errore, mostra un messaggio più user-friendly
  if (error && !travelInfo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-800 font-medium">Impossibile calcolare la distanza</p>
            <p className="text-xs text-yellow-600 mt-1">Verifica di avere un indirizzo di lavoro configurato</p>
          </div>
          <button
            onClick={handleRecalculate}
            className="text-yellow-600 hover:text-yellow-700 p-2 hover:bg-yellow-100 rounded-lg transition-colors"
            title="Riprova"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // Se non ci sono dati (endpoint non disponibile o non è un professionista)
  if (!travelInfo) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-blue-900 flex items-center">
          <TruckIcon className="h-5 w-5 mr-2" />
          Informazioni di Viaggio
          <div className="flex items-center gap-2">
            {travelInfo.isEstimate && (
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                Stima
              </span>
            )}
            {travelInfo.fromCache && (
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                Salvato
              </span>
            )}
            <button
              onClick={handleRecalculate}
              className="text-blue-600 hover:text-blue-700 p-1 hover:bg-blue-100 rounded transition-colors"
              title="Ricalcola distanza"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-3">
        <div className="flex items-center">
          <MapPinIcon className="h-4 w-4 text-blue-600 mr-1" />
          <div>
            <p className="text-xs text-gray-600">Distanza</p>
            <p className="text-sm font-semibold text-gray-900">
              {travelInfo.distanceText || formatDistance(travelInfo.distance)}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 text-blue-600 mr-1" />
          <div>
            <p className="text-xs text-gray-600">Durata</p>
            <p className="text-sm font-semibold text-gray-900">
              {travelInfo.durationText || formatDuration(travelInfo.duration)}
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <CurrencyEuroIcon className="h-4 w-4 text-blue-600 mr-1" />
          <div>
            <p className="text-xs text-gray-600">Costo Viaggio</p>
            <p className="text-sm font-semibold text-gray-900">
              €{travelInfo.cost.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {(travelInfo.origin || travelInfo.destination) && (
        <div className="border-t border-blue-200 pt-3 mt-3">
          <div className="text-xs text-gray-600 space-y-1">
            {travelInfo.origin && (
              <p>
                <span className="font-semibold">Da:</span> {travelInfo.origin}
              </p>
            )}
            {travelInfo.destination && (
              <p>
                <span className="font-semibold">A:</span> {travelInfo.destination}
              </p>
            )}
          </div>
        </div>
      )}

      {(onOpenMap || onOpenItinerary) && (
        <div className="flex gap-2 mt-3">
          {onOpenMap && (
            <button
              onClick={onOpenMap}
              className="flex-1 text-xs bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
            >
              Visualizza Mappa
            </button>
          )}
          {onOpenItinerary && (
            <button
              onClick={onOpenItinerary}
              className="flex-1 text-xs bg-white text-blue-600 border border-blue-600 px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
            >
              Mostra Itinerario
            </button>
          )}
        </div>
      )}
    </div>
  );
}