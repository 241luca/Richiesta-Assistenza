import React, { useState, useEffect } from 'react';
import { MapPinIcon, ClockIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { TruckIcon } from '@heroicons/react/24/solid';
import { apiClient } from '../../services/api';

interface TravelInfo {
  distance: number;
  duration: number;
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
 * AGGIORNATO: L'itinerario usa sempre l'indirizzo del professionista come origine
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
      const response = await apiClient.get(`/travel/request/${requestId}/travel-info`);
      
      if (response.data.success && response.data.data) {
        setTravelInfo(response.data.data);
      } else {
        setError(response.data.message || 'Impossibile calcolare la distanza');
      }
    } catch (err: any) {
      console.error('Error fetching travel info:', err);
      
      // Gestisci diversi tipi di errore
      if (err.response?.status === 401) {
        setError('Non autorizzato. Effettua il login.');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Configura il tuo indirizzo di lavoro nel profilo per vedere le informazioni di viaggio');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m`;
    }
    return `${distance.toFixed(1)} km`;
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const formatCost = (costInCents: number) => {
    return `€${(costInCents / 100).toFixed(2)}`;
  };

  const openGoogleMapsItinerary = () => {
    // SEMPRE usa l'indirizzo del professionista come origine se disponibile
    if (travelInfo && travelInfo.origin) {
      // Apri Google Maps con l'itinerario dal professionista al cliente
      const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(travelInfo.origin)}/${encodeURIComponent(travelInfo.destination)}`;
      window.open(mapsUrl, '_blank');
    } else {
      // Fallback: apri solo con la destinazione (userà la posizione corrente)
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(requestAddress)}&travelmode=driving`;
      window.open(mapsUrl, '_blank');
    }
  };

  // Se sta caricando
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Calcolo distanza in corso...</span>
        </div>
      </div>
    );
  }

  // Se c'è un errore
  if (error) {
    return (
      <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
        <div className="flex items-start space-x-2">
          <MapPinIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-yellow-800">{error}</p>
            <div className="mt-3 flex gap-2">
              {onOpenMap && (
                <button
                  onClick={onOpenMap}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  Visualizza Mappa
                </button>
              )}
              <button
                onClick={openGoogleMapsItinerary}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Apri Itinerario
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se non ci sono informazioni
  if (!travelInfo) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Informazioni viaggio non disponibili</span>
          <div className="flex gap-2">
            {onOpenMap && (
              <button
                onClick={onOpenMap}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50"
              >
                <MapPinIcon className="h-4 w-4 mr-1" />
                Mappa
              </button>
            )}
            <button
              onClick={openGoogleMapsItinerary}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Itinerario
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mostra le informazioni di viaggio
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <TruckIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">Informazioni Viaggio</h3>
          {travelInfo.isEstimate && (
            <span className="text-xs text-gray-500 italic">(stima)</span>
          )}
        </div>
      </div>

      {/* Grid informazioni */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        {/* Distanza */}
        <div className="bg-white rounded-lg p-2">
          <div className="flex items-center space-x-1 text-gray-600 mb-1">
            <MapPinIcon className="h-4 w-4" />
            <span className="text-xs">Distanza</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatDistance(travelInfo.distance)}
          </p>
        </div>

        {/* Tempo */}
        <div className="bg-white rounded-lg p-2">
          <div className="flex items-center space-x-1 text-gray-600 mb-1">
            <ClockIcon className="h-4 w-4" />
            <span className="text-xs">Tempo</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatDuration(travelInfo.duration)}
          </p>
        </div>

        {/* Costo */}
        <div className="bg-white rounded-lg p-2">
          <div className="flex items-center space-x-1 text-gray-600 mb-1">
            <CurrencyEuroIcon className="h-4 w-4" />
            <span className="text-xs">Costo viaggio</span>
          </div>
          <p className="text-lg font-bold text-green-600">
            {formatCost(travelInfo.cost)}
          </p>
        </div>
      </div>

      {/* Percorso */}
      <div className="bg-white/50 rounded p-2 mb-3">
        <p className="text-xs text-gray-600">
          <span className="font-medium">Da:</span> {travelInfo.origin}
        </p>
        <p className="text-xs text-gray-600 mt-1">
          <span className="font-medium">A:</span> {travelInfo.destination}
        </p>
      </div>

      {/* Pulsanti azioni */}
      <div className="flex gap-2">
        {onOpenMap && (
          <button
            onClick={onOpenMap}
            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <MapPinIcon className="h-4 w-4 mr-1" />
            Visualizza Mappa
          </button>
        )}
        
        <button
          onClick={openGoogleMapsItinerary}
          className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Itinerario Google Maps
        </button>
      </div>
    </div>
  );
}

// Export anche la versione semplice per retrocompatibilità
export function SimpleTravelButtons({ 
  requestAddress,
  onOpenMap
}: {
  requestAddress: string;
  onOpenMap?: () => void;
}) {
  const openGoogleMaps = () => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(requestAddress)}`;
    window.open(mapsUrl, '_blank');
  };

  const openItinerary = () => {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(requestAddress)}&travelmode=driving`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={onOpenMap || openGoogleMaps}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100"
      >
        <MapPinIcon className="h-4 w-4 mr-1.5" />
        Visualizza Mappa
      </button>
      
      <button
        onClick={openItinerary}
        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
        Itinerario Google Maps
      </button>
    </div>
  );
}