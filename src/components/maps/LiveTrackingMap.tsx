/**
 * 🚗 LIVE TRACKING MAP - Tracking Real-time Professionista
 * 
 * Componente per visualizzare la posizione in tempo reale del professionista
 * con ETA dinamico e notifiche di prossimità.
 * 
 * Funzionalità:
 * - Posizione live del professionista via WebSocket
 * - Calcolo ETA automatico
 * - Mappa interattiva con percorso ottimale
 * - Notifiche "sta arrivando" e "nelle vicinanze"
 * - Azioni rapide (chat, chiamata)
 * 
 * @version 1.0.0
 * @author Sistema Richiesta Assistenza
 * @date 5 Ottobre 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { useQuery } from '@tanstack/react-query';
import { MapPinIcon, ClockIcon, PhoneIcon, ChatBubbleLeftRightIcon, SignalIcon } from '@heroicons/react/24/outline';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../services/api';
import { MAP_IDS, calculateCenter } from '../../utils/googleMapsUtils';

// ============================================
// INTERFACES & TYPES
// ============================================

interface LiveTrackingMapProps {
  requestId: string;
  professionalId: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  onCallProfessional?: () => void;
  onOpenChat?: () => void;
  className?: string;
}

interface ProfessionalLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

interface ETAResult {
  distance: number;
  duration: number;
  durationText: string;
  distanceText: string;
}

interface TrackingData {
  requestId: string;
  professionalLocation: ProfessionalLocation | null;
  eta: ETAResult | null;
  isTrackingActive: boolean;
  lastUpdate: string | null;
  professional: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

// ============================================
// MARKER COMPONENTS
// ============================================

/**
 * Marker animato per il professionista
 */
function ProfessionalMarker({ 
  position, 
  heading,
  accuracy,
  professional
}: { 
  position: { lat: number; lng: number };
  heading?: number;
  accuracy?: number;
  professional: { firstName: string; lastName: string };
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => setShowInfo(!showInfo)}
      >
        <div
          className="relative w-12 h-12 bg-blue-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse cursor-pointer"
          style={{
            transform: heading ? `rotate(${heading}deg)` : undefined
          }}
        >
          {/* Icona auto/professionista */}
          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-blue-600">
              {professional.firstName[0]}
            </span>
          </div>
          
          {/* Cerchio di accuratezza */}
          {accuracy && accuracy < 50 && (
            <div 
              className="absolute border border-blue-400 rounded-full opacity-30"
              style={{
                width: `${Math.max(24, accuracy / 2)}px`,
                height: `${Math.max(24, accuracy / 2)}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          )}
        </div>
      </AdvancedMarker>

      {showInfo && (
        <InfoWindow anchor={marker} onClose={() => setShowInfo(false)}>
          <div className="p-3">
            <h3 className="font-semibold text-gray-900 mb-1">
              {professional.firstName} {professional.lastName}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              {accuracy && (
                <p>📍 Precisione: {Math.round(accuracy)}m</p>
              )}
              {heading !== undefined && (
                <p>🧭 Direzione: {Math.round(heading)}°</p>
              )}
              <p className="text-green-600 font-medium">🟢 In movimento</p>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

/**
 * Marker per la destinazione
 */
function DestinationMarker({ 
  position, 
  address 
}: { 
  position: { lat: number; lng: number };
  address: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => setShowInfo(!showInfo)}
      >
        <div className="w-10 h-10 bg-red-600 rounded-full border-3 border-white shadow-lg flex items-center justify-center cursor-pointer">
          <MapPinIcon className="w-6 h-6 text-white" />
        </div>
      </AdvancedMarker>

      {showInfo && (
        <InfoWindow anchor={marker} onClose={() => setShowInfo(false)}>
          <div className="p-3 max-w-xs">
            <h3 className="font-semibold text-gray-900 mb-1">Destinazione</h3>
            <p className="text-sm text-gray-600">{address}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function LiveTrackingMap({
  requestId,
  professionalId,
  destinationLat,
  destinationLng,
  destinationAddress,
  onCallProfessional,
  onOpenChat,
  className = ""
}: LiveTrackingMapProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isArriving, setIsArriving] = useState(false);
  const [isNearby, setIsNearby] = useState(false);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);

  const socket = useSocket();
  const directionsLibrary = useMapsLibrary('routes');

  // ============================================
  // DATA FETCHING
  // ============================================

  /**
   * Carica dati iniziali di tracking
   */
  const { data: initialData, isLoading, error } = useQuery({
    queryKey: ['tracking', requestId],
    queryFn: () => api.get(`/location/request/${requestId}/tracking`),
    staleTime: 30 * 1000, // 30 secondi
    refetchInterval: 60 * 1000, // Refresh ogni minuto
  });

  // ============================================
  // SOCKET LISTENERS
  // ============================================

  /**
   * Ascolta aggiornamenti di posizione via WebSocket
   */
  useEffect(() => {
    if (!socket) return;

    // Aggiornamenti posizione
    const handleLocationUpdate = (data: any) => {
      if (data.professionalId === professionalId) {
        console.log('📍 Aggiornamento posizione ricevuto:', data);
        
        setTrackingData(prevData => prevData ? {
          ...prevData,
          professionalLocation: data.location,
          eta: data.eta,
          lastUpdate: data.timestamp,
          isTrackingActive: true
        } : null);

        setLastUpdateTime(new Date());

        // Aggiorna percorso se necessario
        if (data.location && directionsLibrary) {
          calculateRoute(data.location);
        }
      }
    };

    // Notifica "sta arrivando"
    const handleArriving = (data: any) => {
      if (data.professionalId === professionalId) {
        console.log('🚗 Professionista sta arrivando:', data);
        setIsArriving(true);
        
        // Rimuovi notifica dopo 30 secondi
        setTimeout(() => setIsArriving(false), 30000);
      }
    };

    // Notifica "nelle vicinanze"
    const handleNearby = (data: any) => {
      if (data.professionalId === professionalId) {
        console.log('📍 Professionista nelle vicinanze:', data);
        setIsNearby(true);
        
        // Rimuovi notifica dopo 60 secondi
        setTimeout(() => setIsNearby(false), 60000);
      }
    };

    // Professionista offline
    const handleOffline = (data: any) => {
      if (data.professionalId === professionalId) {
        console.log('📵 Professionista offline:', data);
        setTrackingData(prevData => prevData ? {
          ...prevData,
          isTrackingActive: false,
          professionalLocation: null
        } : null);
      }
    };

    // Registra listeners
    socket.on('professional:location', handleLocationUpdate);
    socket.on('professional:arriving', handleArriving);
    socket.on('professional:nearby', handleNearby);
    socket.on('professional:offline', handleOffline);

    return () => {
      socket.off('professional:location', handleLocationUpdate);
      socket.off('professional:arriving', handleArriving);
      socket.off('professional:nearby', handleNearby);
      socket.off('professional:offline', handleOffline);
    };
  }, [socket, professionalId, directionsLibrary]);

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Imposta dati iniziali quando caricati
   */
  useEffect(() => {
    if (initialData?.data) {
      setTrackingData(initialData.data);
      setLastUpdateTime(initialData.data.lastUpdate ? new Date(initialData.data.lastUpdate) : null);
      
      // Calcola percorso iniziale se abbiamo la posizione
      if (initialData.data.professionalLocation && directionsLibrary) {
        calculateRoute(initialData.data.professionalLocation);
      }
    }
  }, [initialData, directionsLibrary]);

  // ============================================
  // ROUTE CALCULATION
  // ============================================

  /**
   * Calcola il percorso ottimale
   */
  const calculateRoute = useCallback(async (professionalLocation: ProfessionalLocation) => {
    if (!directionsLibrary) return;

    try {
      const directionsService = new directionsLibrary.DirectionsService();
      
      const result = await directionsService.route({
        origin: {
          lat: professionalLocation.latitude,
          lng: professionalLocation.longitude
        },
        destination: {
          lat: destinationLat,
          lng: destinationLng
        },
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
      });

      setDirections(result);
    } catch (error) {
      console.error('Errore calcolo percorso:', error);
    }
  }, [directionsLibrary, destinationLat, destinationLng]);

  // ============================================
  // RENDER HELPERS
  // ============================================

  /**
   * Calcola centro mappa
   */
  const mapCenter = React.useMemo(() => {
    if (trackingData?.professionalLocation) {
      return calculateCenter([
        { lat: trackingData.professionalLocation.latitude, lng: trackingData.professionalLocation.longitude },
        { lat: destinationLat, lng: destinationLng }
      ]);
    }
    return { lat: destinationLat, lng: destinationLng };
  }, [trackingData?.professionalLocation, destinationLat, destinationLng]);

  /**
   * Formatta tempo dall'ultimo aggiornamento
   */
  const getTimeSinceUpdate = () => {
    if (!lastUpdateTime) return null;
    const seconds = Math.floor((Date.now() - lastUpdateTime.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s fa`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m fa`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h fa`;
  };

  // ============================================
  // LOADING & ERROR STATES
  // ============================================

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${className}`}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento tracking...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
        <div className="text-center">
          <MapPinIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Tracking non disponibile
          </h3>
          <p className="text-gray-600">
            Il professionista non ha attivato il tracking live.
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${className}`}>
      {/* Alert Notifiche */}
      {isArriving && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-orange-400 mr-2" />
            <p className="text-orange-800 font-medium">
              🚗 {trackingData.professional.firstName} sta arrivando! 
              {trackingData.eta && ` ETA: ${trackingData.eta.durationText}`}
            </p>
          </div>
        </div>
      )}

      {isNearby && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex items-center">
            <MapPinIcon className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-800 font-medium">
              📍 {trackingData.professional.firstName} è nelle vicinanze!
            </p>
          </div>
        </div>
      )}

      {/* Card ETA */}
      {trackingData.eta && trackingData.isTrackingActive && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90 mb-1">Arrivo stimato</p>
              <p className="text-3xl font-bold">{trackingData.eta.durationText}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90 mb-1">Distanza</p>
              <p className="text-xl font-semibold">{trackingData.eta.distanceText}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mappa */}
      <div className="h-96 relative">
        <Map
          mapId={MAP_IDS.TRACKING_MAP || 'tracking-map'}
          center={mapCenter}
          zoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Marker Professionista */}
          {trackingData.professionalLocation && trackingData.isTrackingActive && (
            <ProfessionalMarker
              position={{
                lat: trackingData.professionalLocation.latitude,
                lng: trackingData.professionalLocation.longitude
              }}
              heading={trackingData.professionalLocation.heading}
              accuracy={trackingData.professionalLocation.accuracy}
              professional={trackingData.professional}
            />
          )}

          {/* Marker Destinazione */}
          <DestinationMarker
            position={{
              lat: destinationLat,
              lng: destinationLng
            }}
            address={destinationAddress}
          />

          {/* TODO: Renderizzare percorso ottimale */}
          {/* DirectionsRenderer custom per @vis.gl/react-google-maps */}
        </Map>

        {/* Overlay Status */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${
              trackingData.isTrackingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className={trackingData.isTrackingActive ? 'text-green-700' : 'text-gray-500'}>
              {trackingData.isTrackingActive ? 'Live' : 'Offline'}
            </span>
            {trackingData.isTrackingActive && (
              <SignalIcon className="w-4 h-4 text-green-600" />
            )}
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Ultimo aggiornamento</p>
            <p className="text-sm font-medium text-gray-900">
              {trackingData.isTrackingActive && lastUpdateTime
                ? `${getTimeSinceUpdate()}`
                : 'Tracking disattivato'
              }
            </p>
          </div>
          
          {trackingData.professionalLocation?.accuracy && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Precisione GPS</p>
              <p className="text-sm font-medium text-gray-900">
                ±{Math.round(trackingData.professionalLocation.accuracy)}m
              </p>
            </div>
          )}
        </div>

        {/* Azioni Rapide */}
        <div className="flex gap-2">
          <button
            onClick={onOpenChat}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
            disabled={!trackingData.isTrackingActive}
          >
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
            Chat
          </button>
          
          <button
            onClick={onCallProfessional}
            className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-700 transition-colors"
          >
            <PhoneIcon className="w-5 h-5" />
            Chiama
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveTrackingMap;
