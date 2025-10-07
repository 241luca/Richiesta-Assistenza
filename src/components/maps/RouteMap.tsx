/**
 * 🗺️ ROUTE MAP - Mappa Itinerario Modernizzata v5.2
 * 
 * Mostra percorso tra professionista e richiesta
 * Usa @vis.gl/react-google-maps + DirectionsService
 * 
 * Data: 2 Ottobre 2025
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPinIcon, ClockIcon, CurrencyEuroIcon } from '@heroicons/react/24/outline';
import { MAP_IDS, calculateDistance, calculateCenter } from '../../utils/googleMapsUtils';

interface RouteMapProps {
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  height?: string;
  showControls?: boolean;
  onTravelInfoCalculated?: (info: TravelInfo) => void;
}

interface TravelInfo {
  distance: number;
  duration: number;
  distanceText: string;
  durationText: string;
  cost: number;
}

/**
 * Marker con InfoWindow
 */
function LocationMarker({ 
  position, 
  label, 
  address,
  color = '#3B82F6'
}: { 
  position: { lat: number; lng: number }; 
  label: string; 
  address: string;
  color?: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => setInfoOpen(!infoOpen)}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            backgroundColor: color,
            borderRadius: '50%',
            border: '3px solid white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          {label}
        </div>
      </AdvancedMarker>

      {infoOpen && (
        <InfoWindow anchor={marker} onClose={() => setInfoOpen(false)}>
          <div className="p-2 max-w-xs">
            <h3 className="font-semibold text-gray-900 mb-1">{label}</h3>
            <p className="text-sm text-gray-600">{address}</p>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

/**
 * Calcola costo (€0.50/km)
 */
function calculateCost(distanceMeters: number): number {
  const km = distanceMeters / 1000;
  return Math.round(km * 0.50 * 100) / 100;
}

/**
 * Componente principale RouteMap
 */
export function RouteMap({
  origin,
  destination,
  height = '500px',
  showControls = true,
  onTravelInfoCalculated
}: RouteMapProps) {
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carica libreria routes
  const routesLibrary = useMapsLibrary('routes');

  // Calcola centro mappa tra origine e destinazione
  const mapCenter = useMemo(() => 
    calculateCenter([origin, destination]),
    [origin, destination]
  );

  // Calcola distanza Haversine (fallback se Directions API fallisce)
  const straightLineDistance = useMemo(() => 
    calculateDistance(origin, destination),
    [origin, destination]
  );

  // Calcola percorso quando la libreria è caricata
  useEffect(() => {
    if (!routesLibrary) return;

    calculateRoute();
  }, [routesLibrary, origin, destination]);

  /**
   * Calcola percorso usando DirectionsService
   */
  const calculateRoute = async () => {
    if (!routesLibrary) return;

    setLoading(true);
    setError(null);

    try {
      const directionsService = new routesLibrary.DirectionsService();

      const response = await directionsService.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      });

      if (response.routes && response.routes.length > 0) {
        setDirectionsResult(response);

        const route = response.routes[0];
        const leg = route.legs[0];

        if (leg.distance && leg.duration) {
          const info: TravelInfo = {
            distance: leg.distance.value,
            duration: leg.duration.value,
            distanceText: leg.distance.text,
            durationText: leg.duration.text,
            cost: calculateCost(leg.distance.value)
          };

          setTravelInfo(info);
          onTravelInfoCalculated?.(info);
        }
      } else {
        throw new Error('Nessun percorso trovato');
      }
    } catch (err) {
      console.error('Errore calcolo percorso:', err);
      setError('Impossibile calcolare il percorso');
      
      // Fallback: usa distanza in linea d'aria
      const info: TravelInfo = {
        distance: straightLineDistance * 1000,
        duration: Math.round((straightLineDistance * 1000) / 13.89), // ~50 km/h
        distanceText: `~${straightLineDistance.toFixed(1)} km`,
        durationText: `~${Math.round((straightLineDistance * 1000) / 13.89 / 60)} min`,
        cost: calculateCost(straightLineDistance * 1000)
      };
      
      setTravelInfo(info);
      onTravelInfoCalculated?.(info);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: '100%', height }}>
      <Map
        mapId={MAP_IDS.ROUTE_MAP}
        center={mapCenter}
        zoom={12}
        gestureHandling="greedy"
        disableDefaultUI={!showControls}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Marker Origine (Professionista) */}
        <LocationMarker
          position={origin}
          label="P"
          address={origin.address}
          color="#10B981"
        />

        {/* Marker Destinazione (Richiesta) */}
        <LocationMarker
          position={destination}
          label="R"
          address={destination.address}
          color="#3B82F6"
        />

        {/* TODO: Renderizzare polyline del percorso quando disponibile */}
        {/* DirectionsRenderer non è disponibile in @vis.gl, */}
        {/* servirà componente custom per disegnare il path */}
      </Map>

      {/* Info Box sotto la mappa */}
      {travelInfo && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Distanza */}
            <div className="flex items-center space-x-3">
              <MapPinIcon className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Distanza</p>
                <p className="text-lg font-semibold text-gray-900">
                  {travelInfo.distanceText}
                </p>
              </div>
            </div>

            {/* Durata */}
            <div className="flex items-center space-x-3">
              <ClockIcon className="h-6 w-6 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Tempo Stimato</p>
                <p className="text-lg font-semibold text-gray-900">
                  {travelInfo.durationText}
                </p>
              </div>
            </div>

            {/* Costo */}
            <div className="flex items-center space-x-3">
              <CurrencyEuroIcon className="h-6 w-6 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Costo Stimato</p>
                <p className="text-lg font-semibold text-gray-900">
                  €{travelInfo.cost.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-4 text-center text-sm text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
          Calcolo percorso...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          ⚠️ {error} - Usando distanza in linea d'aria come stima
        </div>
      )}
    </div>
  );
}
