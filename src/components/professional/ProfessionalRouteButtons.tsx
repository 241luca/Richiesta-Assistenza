/**
 * ProfessionalRouteButtons Component
 * Pulsanti per visualizzare mappa e itinerario per i professionisti
 * AGGIORNATO: Usa l'indirizzo di lavoro del professionista come origine
 */

import React from 'react';
import { 
  MapIcon, 
  MapPinIcon,
  TruckIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

interface ProfessionalRouteButtonsProps {
  requestAddress: string;
  className?: string;
}

export function ProfessionalRouteButtons({ 
  requestAddress,
  className = ""
}: ProfessionalRouteButtonsProps) {
  const { user } = useAuth();
  
  // Apri Google Maps con l'indirizzo di destinazione
  const openGoogleMaps = () => {
    const encodedAddress = encodeURIComponent(requestAddress);
    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    window.open(url, '_blank');
  };

  // Apri Google Maps con itinerario dall'indirizzo di lavoro del professionista
  const openDirections = () => {
    const encodedDestination = encodeURIComponent(requestAddress);
    
    // Costruisci l'indirizzo di origine del professionista
    let originAddress = '';
    
    if (user) {
      // Usa workAddress se disponibile, altrimenti usa l'indirizzo di residenza
      if (user.workAddress && user.workCity) {
        originAddress = `${user.workAddress}, ${user.workCity} ${user.workProvince}`;
      } else if (user.address && user.city) {
        originAddress = `${user.address}, ${user.city} ${user.province}`;
      }
    }
    
    let url = '';
    if (originAddress) {
      // Se abbiamo l'indirizzo del professionista, usalo come origine
      const encodedOrigin = encodeURIComponent(originAddress);
      url = `https://www.google.com/maps/dir/${encodedOrigin}/${encodedDestination}`;
    } else {
      // Fallback: usa la posizione corrente
      url = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}&travelmode=driving`;
    }
    
    window.open(url, '_blank');
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-2 ${className}`}>
      <button
        onClick={openGoogleMaps}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        title="Visualizza sulla mappa"
      >
        <MapPinIcon className="h-5 w-5" />
        <span>Visualizza Mappa</span>
      </button>

      <button
        onClick={openDirections}
        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        title={user?.workAddress ? "Itinerario dal tuo indirizzo di lavoro" : "Calcola itinerario"}
      >
        <TruckIcon className="h-5 w-5" />
        <span>Itinerario</span>
        <ArrowRightOnRectangleIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * ProfessionalRouteCard Component
 * Card completa con informazioni viaggio per professionisti
 * AGGIORNATO: Mostra l'indirizzo di partenza del professionista
 */
export function ProfessionalRouteCard({ 
  requestAddress,
  city,
  province,
  postalCode,
  distance,
  duration,
  className = ""
}: {
  requestAddress: string;
  city: string;
  province: string;
  postalCode: string;
  distance?: number; // in km
  duration?: number; // in minuti
  className?: string;
}) {
  const { user } = useAuth();
  const fullAddress = `${requestAddress}, ${city} (${province}) ${postalCode}`;
  
  // Determina l'indirizzo di partenza del professionista
  let professionalAddress = '';
  if (user) {
    if (user.workAddress && user.workCity) {
      professionalAddress = `${user.workAddress}, ${user.workCity}`;
    } else if (user.address && user.city) {
      professionalAddress = `${user.address}, ${user.city}`;
    }
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      {/* Mostra l'indirizzo di partenza se disponibile */}
      {professionalAddress && (
        <div className="mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <TruckIcon className="h-4 w-4 text-gray-400" />
            <span className="font-medium">Partenza:</span>
            <span>{professionalAddress}</span>
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            📍 Indirizzo Intervento
          </h3>
          <p className="text-gray-900">
            {requestAddress}
          </p>
          <p className="text-sm text-gray-600">
            {city} ({province}) - {postalCode}
          </p>
          
          {/* Mostra distanza e durata se disponibili */}
          {(distance || duration) && (
            <div className="mt-2 flex gap-4 text-sm">
              {distance && (
                <span className="text-blue-600 font-medium">
                  🚗 {distance.toFixed(1)} km
                </span>
              )}
              {duration && (
                <span className="text-gray-600">
                  ⏱️ ~{Math.round(duration)} min
                </span>
              )}
            </div>
          )}
        </div>
        
        <MapIcon className="h-8 w-8 text-gray-400" />
      </div>

      <ProfessionalRouteButtons 
        requestAddress={fullAddress}
        className="mt-3"
      />
    </div>
  );
}