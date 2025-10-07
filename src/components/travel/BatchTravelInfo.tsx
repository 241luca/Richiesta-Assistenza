/**
 * BatchTravelInfo Component
 * Visualizza informazioni di viaggio per più richieste contemporaneamente
 * Ottimizzato per dashboard professionisti con lista richieste
 * Seguendo ISTRUZIONI-PROGETTO.md - Usa Tailwind e React Query  
 */

import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { useTravel } from '../../hooks/useTravel';
import type { TravelInfo } from '../../types/travel';

interface BatchTravelInfoProps {
  requestIds: string[];
  onRequestSelect?: (requestId: string) => void;
  showSummary?: boolean;
  className?: string;
}

interface TravelSummary {
  totalDistance: number;
  totalDuration: number;
  totalCost: number;
  averageDistance: number;
  requestCount: number;
}

export const BatchTravelInfo: React.FC<BatchTravelInfoProps> = ({
  requestIds,
  onRequestSelect,
  showSummary = true,
  className = ''
}) => {
  const { useBatchTravelInfo } = useTravel();
  const { 
    data: batchData, 
    isLoading, 
    error,
    refetch 
  } = useBatchTravelInfo(requestIds, requestIds.length > 0);

  // Calcola statistiche di riepilogo
  const summary: TravelSummary = useMemo(() => {
    if (!batchData) {
      return {
        totalDistance: 0,
        totalDuration: 0,
        totalCost: 0,
        averageDistance: 0,
        requestCount: 0
      };
    }

    const validTravels = batchData
      .filter(item => item.travelInfo)
      .map(item => item.travelInfo!);

    const totalDistance = validTravels.reduce((sum, travel) => sum + travel.distance, 0);
    const totalDuration = validTravels.reduce((sum, travel) => sum + travel.duration, 0);
    const totalCost = validTravels.reduce((sum, travel) => sum + travel.cost, 0);

    return {
      totalDistance,
      totalDuration,
      totalCost,
      averageDistance: validTravels.length > 0 ? totalDistance / validTravels.length : 0,
      requestCount: validTravels.length
    };
  }, [batchData]);

  // Formattazione
  const formatDistance = (distance: number): string => {
    return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`;
  };

  const formatDuration = (duration: number): string => {
    if (duration < 60) return `${Math.round(duration)}min`;
    const hours = Math.floor(duration / 60);
    const minutes = Math.round(duration % 60);
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  };

  const formatCost = (cost: number): string => {
    return `€${(cost / 100).toFixed(2)}`;
  };

  if (requestIds.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="animate-spin">🔄</span>
            Calcolando informazioni viaggio...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: Math.min(requestIds.length, 3) }).map((_, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded animate-pulse">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="flex gap-4">
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${className} border-red-200`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <span>⚠️</span>
            Errore nel calcolo viaggi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 text-sm mb-4">
            Impossibile calcolare le informazioni di viaggio per le richieste selezionate.
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            size="sm"
            className="text-red-600 border-red-300 hover:bg-red-50"
          >
            Riprova
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🗺️</span>
          Informazioni Viaggio
          <span className="text-sm font-normal text-gray-500">
            ({summary.requestCount} su {requestIds.length} richieste)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Riepilogo totale */}
        {showSummary && summary.requestCount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">
                {formatDistance(summary.totalDistance)}
              </div>
              <div className="text-xs text-blue-600">Distanza Totale</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">
                {formatDuration(summary.totalDuration)}
              </div>
              <div className="text-xs text-blue-600">Tempo Totale</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-green-600">
                {formatCost(summary.totalCost)}
              </div>
              <div className="text-xs text-blue-600">Costo Totale</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-900">
                {formatDistance(summary.averageDistance)}
              </div>
              <div className="text-xs text-blue-600">Distanza Media</div>
            </div>
          </div>
        )}

        {/* Lista dettagli per richiesta */}
        <div className="space-y-2">
          {batchData?.map((item, index) => (
            <div
              key={item.requestId}
              className={`
                flex items-center justify-between p-3 rounded-lg border transition-colors
                ${item.travelInfo 
                  ? 'bg-white border-gray-200 hover:bg-gray-50' 
                  : 'bg-red-50 border-red-200'
                }
                ${onRequestSelect ? 'cursor-pointer' : ''}
              `}
              onClick={() => onRequestSelect?.(item.requestId)}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">#{index + 1}</span>
                <span className="font-medium text-gray-900">
                  Richiesta {item.requestId.slice(-8)}
                </span>
                {!item.travelInfo && (
                  <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                    Indirizzo non valido
                  </span>
                )}
              </div>

              {item.travelInfo && (
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{formatDistance(item.travelInfo.distance)}</div>
                    <div className="text-xs text-gray-500">distanza</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{formatDuration(item.travelInfo.duration)}</div>
                    <div className="text-xs text-gray-500">tempo</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">
                      {formatCost(item.travelInfo.cost)}
                    </div>
                    <div className="text-xs text-gray-500">costo</div>
                  </div>
                  {item.itineraryUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(item.itineraryUrl, '_blank');
                      }}
                      className="text-xs"
                    >
                      🗺️ Mappa
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Messaggio se nessuna richiesta ha info viaggio valide */}
        {batchData && summary.requestCount === 0 && (
          <div className="text-center py-6 text-gray-500">
            <span className="text-2xl block mb-2">📍</span>
            <p>Nessuna richiesta ha un indirizzo valido per il calcolo del viaggio.</p>
            <p className="text-sm mt-1">
              Verifica che le richieste abbiano indirizzi completi e corretti.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchTravelInfo;
