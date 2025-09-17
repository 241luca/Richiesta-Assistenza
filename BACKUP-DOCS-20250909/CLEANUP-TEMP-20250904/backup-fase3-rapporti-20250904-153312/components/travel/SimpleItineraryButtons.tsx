/**
 * SimpleItineraryButtons Component
 * Componente semplificato che mostra solo i pulsanti Mappa e Itinerario
 * senza richiedere API per calcolare distanze
 */

import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface SimpleItineraryButtonsProps {
  requestAddress: string;
  onOpenMap?: () => void;
}

export const SimpleItineraryButtons: React.FC<SimpleItineraryButtonsProps> = ({
  requestAddress,
  onOpenMap
}) => {
  const handleOpenMap = () => {
    if (onOpenMap) {
      onOpenMap();
    } else {
      // Apre Google Maps con l'indirizzo
      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(requestAddress)}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const handleOpenItinerary = () => {
    // Apre Google Maps con direzioni
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(requestAddress)}&travelmode=driving`;
    window.open(directionsUrl, '_blank');
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPinIcon className="h-6 w-6 text-blue-600" />
          <div>
            <h4 className="font-medium text-gray-900">Strumenti di Navigazione</h4>
            <p className="text-sm text-gray-600">Visualizza mappa e ottieni indicazioni stradali</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleOpenMap}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
          >
            <span>🗺️</span>
            <span>Visualizza Mappa</span>
          </button>
          
          <button
            onClick={handleOpenItinerary}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <span>🧭</span>
            <span>Itinerario</span>
          </button>
        </div>
      </div>
      
      <div className="mt-3 text-xs text-gray-500">
        <p>💡 Suggerimento: Il pulsante "Itinerario" aprirà Google Maps con le indicazioni dal tuo punto di partenza</p>
      </div>
    </div>
  );
};

export default SimpleItineraryButtons;
