import React, { useEffect, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface DistanceBadgeProps {
  fromAddress?: string;
  toAddress?: string;
  showRoute?: boolean;
  className?: string;
}

/**
 * Componente per mostrare la distanza tra due indirizzi
 * Utilizza l'API Google Maps per calcolare la distanza reale
 */
export function DistanceBadge({ 
  fromAddress, 
  toAddress, 
  showRoute = false,
  className = "" 
}: DistanceBadgeProps) {
  const [distance, setDistance] = useState<number | null>(null);

  // Query per calcolare la distanza
  const { data: distanceData } = useQuery({
    queryKey: ['distance', fromAddress, toAddress],
    queryFn: async () => {
      if (!fromAddress || !toAddress) return null;
      
      try {
        const response = await api.post('/maps/calculate-distance', {
          origin: fromAddress,
          destination: toAddress
        });
        return response.data;
      } catch (error) {
        console.error('Errore calcolo distanza:', error);
        return null;
      }
    },
    enabled: !!fromAddress && !!toAddress,
    staleTime: 5 * 60 * 1000, // Cache per 5 minuti
    retry: 1
  });

  useEffect(() => {
    if (distanceData?.distance) {
      setDistance(distanceData.distance);
    }
  }, [distanceData]);

  // Se non c'è distanza calcolata, usa SimpleDistanceBadge
  if (!distance) {
    return null;
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <MapPinIcon className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-600">
        {distance.toFixed(1)} km
      </span>
      {distanceData?.duration && (
        <span className="text-xs text-gray-500">
          ({Math.round(distanceData.duration / 60)} min)
        </span>
      )}
    </div>
  );
}

/**
 * Versione semplificata che mostra solo la distanza statica
 * Utile quando la distanza è già calcolata e salvata
 */
export function SimpleDistanceBadge({ 
  distance, 
  duration,
  className = "" 
}: { 
  distance: string | number | undefined;
  duration?: number; // in minuti
  className?: string;
}) {
  // Se non c'è distanza, non mostra nulla
  if (!distance) return null;
  
  // Formatta la distanza se è un numero
  const formattedDistance = typeof distance === 'number' 
    ? `${distance.toFixed(1)} km`
    : distance;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <MapPinIcon className="h-4 w-4 text-blue-600" />
      <span className="text-sm font-medium text-blue-600">
        {formattedDistance}
      </span>
      {duration && (
        <span className="text-xs text-gray-500">
          ({duration} min)
        </span>
      )}
    </div>
  );
}