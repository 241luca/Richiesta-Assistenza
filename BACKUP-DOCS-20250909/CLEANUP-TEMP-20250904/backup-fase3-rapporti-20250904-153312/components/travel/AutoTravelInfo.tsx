import React, { useState, useEffect } from 'react';
import { MapPinIcon, ClockIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { TruckIcon } from '@heroicons/react/24/solid';
import { api } from '../../services/api';

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
  onOpenItinerary 
}: AutoTravelInfoProps) {
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requestId) {
      fetchTravelInfo();
    }
  }, [requestId]);

  const fetchTravelInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usa apiClient che gestisce automaticamente l'autenticazione
      const response = await api.get(`/travel/request/${requestId}/travel-info`);
      
      if (response.data.success && response.data.data) {
        setTravelInfo(response.data.data);
      } else {
        setError(response.data.message || 'Impossibile calcolare la distanza');
      }
    } catch (err: any) {
      console.error('Error fetching travel info:', err);
      
      // Gestisci diversi tipi di errore
      if (err.response?.status === 404) {
        // Se l'endpoint non esiste ancora, nascondi semplicemente il componente
        setError(null);
        setTravelInfo(null);
      } else if (err.response?.status === 401) {
        setError('Non autorizzato');
      } else {
        // Per ora, nascondi gli errori se l'endpoint non è ancora pronto
        setError(null);
      }
    } finally {
      setLoading(false);
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
  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Calcolo distanza in corso...</span>
        </div>
      </div>
    );
  }

  // Se c'è un errore (ma non 404), mostra messaggio
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-red-600">{error}</p>
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
          {travelInfo.isEstimate && (
            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              Stima
            </span>
          )}
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