/**
 * 🚗 REQUEST DISTANCE BADGE - Componente Badge Distanza
 * 
 * Badge compatto per mostrare distanza nelle liste
 * Sistema modernizzato v5.2
 * 
 * Data: 2 Ottobre 2025
 */

import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface RequestDistanceBadgeProps {
  // Da database (priorità)
  travelDistanceText?: string | null;
  travelDistance?: number | null;
  // Fallback
  distance?: number;
  distanceText?: string;
}

/**
 * Badge compatto per distanze
 * Usa dati DB se disponibili, altrimenti props passate
 */
export function RequestDistanceBadge({
  travelDistanceText,
  travelDistance,
  distance,
  distanceText
}: RequestDistanceBadgeProps) {
  // Priorità: testo DB > distanza DB > testo prop > distanza prop
  const displayText = travelDistanceText 
    || (travelDistance ? formatDistance(travelDistance) : null)
    || distanceText
    || (distance ? formatDistance(distance) : null);

  if (!displayText) {
    return null;
  }

  return (
    <div className="inline-flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
      <MapPinIcon className="h-3.5 w-3.5" />
      <span>{displayText}</span>
    </div>
  );
}

/**
 * Formatta distanza in metri a km/m
 */
function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
