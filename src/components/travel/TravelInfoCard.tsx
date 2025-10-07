/**
 * TravelInfoCard Component  
 * Visualizza le informazioni di viaggio per una richiesta specifica
 * Seguendo ISTRUZIONI-PROGETTO.md - Usa Tailwind e React Query
 */

import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useRequestTravelInfo } from '../../hooks/useTravel';
import type { TravelInfoCardProps } from '../../types/travel';

export const TravelInfoCard: React.FC<TravelInfoCardProps> = ({
  requestId,
  travelInfo,
  onOpenItinerary
}) => {
  // Formatta la distanza
  const formatDistance = (distance: number): string => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  // Formatta la durata
  const formatDuration = (duration: number): string => {
    if (duration < 60) {
      return `${Math.round(duration)}min`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration % 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  };

  // Formatta il costo
  const formatCost = (cost: number): string => {
    return `€${(cost / 100).toFixed(2)}`;
  };

  const handleOpenItinerary = () => {
    if (onOpenItinerary) {
      onOpenItinerary();
    } else {
      // Fallback: apre Google Maps con indirizzo generico
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=richiesta-${requestId}&travelmode=driving`;
      window.open(mapsUrl, '_blank');
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Icona e titolo */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚗</span>
            <div>
              <h4 className="font-medium text-gray-900">Informazioni Viaggio</h4>
              <p className="text-sm text-gray-500">Dalla tua posizione</p>
            </div>
          </div>

          {/* Info viaggio */}
          <div className="flex items-center gap-6">
            {/* Distanza */}
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatDistance(travelInfo.distance)}
              </div>
              <div className="text-xs text-gray-500">Distanza</div>
            </div>

            {/* Durata */}
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {formatDuration(travelInfo.duration)}
              </div>
              <div className="text-xs text-gray-500">Tempo</div>
            </div>

            {/* Costo */}
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {formatCost(travelInfo.cost)}
              </div>
              <div className="text-xs text-gray-500">Costo</div>
            </div>

            {/* Pulsante itinerario */}
            <Button
              onClick={handleOpenItinerary}
              size="sm"
              variant="outline"
              className="flex items-center gap-2"
            >
              <span>🗺️</span>
              Itinerario
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * TravelInfoLoading Component
 * Placeholder durante il caricamento delle info viaggio
 */
export const TravelInfoLoading: React.FC = () => (
  <Card className="border-l-4 border-l-gray-300">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
          <div className="text-center">
            <div className="h-6 w-12 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
          <div className="text-center">
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mt-1"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

/**
 * TravelInfoError Component
 * Visualizzato quando non è possibile calcolare le info viaggio
 */
export const TravelInfoError: React.FC<{ 
  onRetry?: () => void;
  message?: string;
}> = ({ 
  onRetry,
  message = "Impossibile calcolare informazioni viaggio" 
}) => (
  <Card className="border-l-4 border-l-red-500">
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <h4 className="font-medium text-red-900">Errore Calcolo Viaggio</h4>
            <p className="text-sm text-red-600">{message}</p>
          </div>
        </div>
        
        {onRetry && (
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Riprova
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
);

/**
 * RequestTravelInfo Component
 * Hook wrapper che gestisce automaticamente loading/error states
 */
export const RequestTravelInfo: React.FC<{
  requestId: string;
  onOpenItinerary?: () => void;
  enabled?: boolean;
}> = ({ requestId, onOpenItinerary, enabled = true }) => {
  const { 
    data: travelResponse, 
    isLoading, 
    error,
    refetch 
  } = useRequestTravelInfo(requestId, enabled);

  if (isLoading) {
    return <TravelInfoLoading />;
  }

  if (error || !travelResponse) {
    return (
      <TravelInfoError
        onRetry={() => refetch()}
        message={error?.message || "Dati indirizzo mancanti o non validi"}
      />
    );
  }

  const travelInfo = {
    distance: travelResponse.distance,
    duration: travelResponse.duration,
    cost: travelResponse.cost
  };

  const handleOpenItinerary = () => {
    if (onOpenItinerary) {
      onOpenItinerary();
    } else {
      window.open(travelResponse.itineraryUrl, '_blank');
    }
  };

  return (
    <TravelInfoCard
      requestId={requestId}
      travelInfo={travelInfo}
      onOpenItinerary={handleOpenItinerary}
    />
  );
};

export default TravelInfoCard;
