/**
 * RouteMap Component
 * Visualizza l'itinerario tra due punti con Google Maps
 * Mostra il percorso, le indicazioni turn-by-turn e informazioni sul viaggio
 */

import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, DirectionsRenderer, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';
import { 
  MapPinIcon, 
  ClockIcon, 
  TruckIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  HomeIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface RouteMapProps {
  origin: {
    address: string;
    lat?: number;
    lng?: number;
    label?: string;
  };
  destination: {
    address: string;
    lat?: number;
    lng?: number;
    label?: string;
  };
  travelCost?: number; // in centesimi
  onRouteCalculated?: (route: RouteInfo) => void;
  height?: string;
  showDirections?: boolean;
  showCostBreakdown?: boolean;
  departureTime?: Date | 'now';
  mode?: google.maps.TravelMode;
}

interface RouteInfo {
  distance: number; // km
  duration: number; // minuti
  durationInTraffic?: number; // minuti con traffico
  polyline?: string;
  steps?: google.maps.DirectionsStep[];
  travelCost?: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 41.9028, // Roma
  lng: 12.4964
};

const mapOptions: google.maps.MapOptions = {
  zoomControl: true,
  streetViewControl: true,
  mapTypeControl: true,
  fullscreenControl: true,
  styles: [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ]
};

export function RouteMap({
  origin,
  destination,
  travelCost,
  onRouteCalculated,
  height = '500px',
  showDirections = true,
  showCostBreakdown = false,
  departureTime = 'now',
  mode = google.maps.TravelMode.DRIVING
}: RouteMapProps) {
  const { isLoaded, apiKeyConfigured } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<'origin' | 'destination' | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(false);

  // Calcola il percorso quando cambiano origine o destinazione
  useEffect(() => {
    if (!isLoaded || !apiKeyConfigured) return;
    
    calculateRoute();
  }, [isLoaded, apiKeyConfigured, origin, destination, departureTime, mode]);

  const calculateRoute = async () => {
    if (!window.google || !origin || !destination) {
      return;
    }

    setIsCalculating(true);
    setError(null);

    try {
      const directionsService = new google.maps.DirectionsService();
      
      // Prepara la richiesta
      const request: google.maps.DirectionsRequest = {
        origin: origin.lat && origin.lng 
          ? { lat: origin.lat, lng: origin.lng }
          : origin.address,
        destination: destination.lat && destination.lng
          ? { lat: destination.lat, lng: destination.lng }
          : destination.address,
        travelMode: mode,
        unitSystem: google.maps.UnitSystem.METRIC,
        region: 'IT',
        language: 'it',
        avoidHighways: false,
        avoidTolls: false,
        optimizeWaypoints: true,
        provideRouteAlternatives: true
      };

      // Aggiungi departure time se specificato
      if (departureTime) {
        if (departureTime === 'now') {
          request.drivingOptions = {
            departureTime: new Date(),
            trafficModel: google.maps.TrafficModel.BEST_GUESS
          };
        } else {
          request.drivingOptions = {
            departureTime: departureTime,
            trafficModel: google.maps.TrafficModel.BEST_GUESS
          };
        }
      }

      // Calcola il percorso
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);
          
          // Estrai informazioni dalla route
          const route = result.routes[0];
          const leg = route.legs[0];
          
          const info: RouteInfo = {
            distance: leg.distance?.value ? leg.distance.value / 1000 : 0,
            duration: leg.duration?.value ? Math.round(leg.duration.value / 60) : 0,
            steps: leg.steps,
            travelCost
          };

          // Aggiungi durata con traffico se disponibile
          if (leg.duration_in_traffic?.value) {
            info.durationInTraffic = Math.round(leg.duration_in_traffic.value / 60);
          }

          // Salva polyline per uso futuro
          if (route.overview_polyline) {
            info.polyline = route.overview_polyline;
          }

          setRouteInfo(info);
          
          // Callback con le informazioni del percorso
          if (onRouteCalculated) {
            onRouteCalculated(info);
          }

          // Centra la mappa sul percorso
          if (mapRef.current && route.bounds) {
            mapRef.current.fitBounds(route.bounds);
          }
        } else {
          let errorMessage = 'Impossibile calcolare il percorso';
          
          switch (status) {
            case google.maps.DirectionsStatus.NOT_FOUND:
              errorMessage = 'Uno degli indirizzi non è stato trovato';
              break;
            case google.maps.DirectionsStatus.ZERO_RESULTS:
              errorMessage = 'Nessun percorso disponibile tra questi punti';
              break;
            case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
              errorMessage = 'Troppe tappe nel percorso';
              break;
            case google.maps.DirectionsStatus.INVALID_REQUEST:
              errorMessage = 'Richiesta non valida';
              break;
            case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
              errorMessage = 'Limite di richieste superato. Riprova più tardi';
              break;
            case google.maps.DirectionsStatus.REQUEST_DENIED:
              errorMessage = 'Richiesta negata. Verifica la configurazione API';
              break;
          }
          
          setError(errorMessage);
          toast.error(errorMessage);
        }
      });
    } catch (err) {
      console.error('Errore calcolo percorso:', err);
      setError('Errore durante il calcolo del percorso');
      toast.error('Errore durante il calcolo del percorso');
    } finally {
      setIsCalculating(false);
    }
  };

  const onMapLoad = (map: google.maps.Map) => {
    mapRef.current = map;
  };

  // Formatta la durata in modo leggibile
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  // Formatta il costo
  const formatCost = (cents: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100);
  };

  // Traduci le manovre in italiano
  const translateManeuver = (maneuver?: string): string => {
    if (!maneuver) return 'Prosegui';
    
    const translations: Record<string, string> = {
      'turn-slight-left': 'Svolta leggermente a sinistra',
      'turn-sharp-left': 'Svolta secca a sinistra',
      'turn-left': 'Svolta a sinistra',
      'turn-slight-right': 'Svolta leggermente a destra',
      'turn-sharp-right': 'Svolta secca a destra',
      'turn-right': 'Svolta a destra',
      'straight': 'Prosegui dritto',
      'ramp-left': 'Prendi la rampa a sinistra',
      'ramp-right': 'Prendi la rampa a destra',
      'merge': 'Immettiti',
      'fork-left': 'Mantieni la sinistra',
      'fork-right': 'Mantieni la destra',
      'ferry': 'Prendi il traghetto',
      'roundabout-left': 'Alla rotonda svolta a sinistra',
      'roundabout-right': 'Alla rotonda svolta a destra',
      'uturn-left': 'Inversione a U a sinistra',
      'uturn-right': 'Inversione a U a destra'
    };
    
    return translations[maneuver] || 'Prosegui';
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  if (!apiKeyConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6" style={{ height }}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-yellow-800">
              Mappa non disponibile
            </h3>
            <p className="text-yellow-700 mt-1">
              La chiave API di Google Maps non è configurata.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Info Box del percorso */}
      {routeInfo && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Distanza */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <MapPinIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Distanza</p>
                <p className="text-lg font-semibold text-gray-900">
                  {routeInfo.distance.toFixed(1)} km
                </p>
              </div>
            </div>

            {/* Durata */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Durata</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDuration(routeInfo.duration)}
                </p>
                {routeInfo.durationInTraffic && routeInfo.durationInTraffic !== routeInfo.duration && (
                  <p className="text-xs text-orange-600">
                    Con traffico: {formatDuration(routeInfo.durationInTraffic)}
                  </p>
                )}
              </div>
            </div>

            {/* Mezzo */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <TruckIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Mezzo</p>
                <p className="text-lg font-semibold text-gray-900">
                  {mode === google.maps.TravelMode.DRIVING ? 'Auto' :
                   mode === google.maps.TravelMode.WALKING ? 'A piedi' :
                   mode === google.maps.TravelMode.BICYCLING ? 'Bicicletta' :
                   mode === google.maps.TravelMode.TRANSIT ? 'Mezzi pubblici' : 'Auto'}
                </p>
              </div>
            </div>

            {/* Costo viaggio */}
            {travelCost !== undefined && (
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <CurrencyEuroIcon className="h-8 w-8 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Costo viaggio</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCost(travelCost)}
                  </p>
                  {showCostBreakdown && (
                    <button
                      onClick={() => {/* TODO: Mostra breakdown costi */}}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Dettagli
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pulsante per mostrare/nascondere indicazioni */}
          {showDirections && routeInfo.steps && routeInfo.steps.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowSteps(!showSteps)}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium"
              >
                <ArrowRightIcon className={`h-4 w-4 mr-2 transform transition-transform ${showSteps ? 'rotate-90' : ''}`} />
                {showSteps ? 'Nascondi' : 'Mostra'} indicazioni stradali ({routeInfo.steps.length} passaggi)
              </button>
            </div>
          )}
        </div>
      )}

      {/* Indicazioni stradali */}
      {showSteps && routeInfo?.steps && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Indicazioni stradali
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {routeInfo.steps.map((step, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-800">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <p 
                    className="text-gray-900"
                    dangerouslySetInnerHTML={{ __html: step.instructions }}
                  />
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                    <span>{step.distance?.text}</span>
                    <span>{step.duration?.text}</span>
                    {step.maneuver && (
                      <span className="italic">{translateManeuver(step.maneuver)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mappa */}
      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200" style={{ height }}>
        {isCalculating && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Calcolo percorso...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 rounded-lg p-3 z-10">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={13}
          center={defaultCenter}
          options={mapOptions}
          onLoad={onMapLoad}
        >
          {/* Renderizza il percorso */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: false,
                suppressInfoWindows: false,
                polylineOptions: {
                  strokeColor: '#4285F4',
                  strokeOpacity: 0.8,
                  strokeWeight: 5
                },
                markerOptions: {
                  animation: google.maps.Animation.DROP
                }
              }}
            />
          )}

          {/* Marker personalizzati per origine e destinazione */}
          {!directions && origin.lat && origin.lng && (
            <Marker
              position={{ lat: origin.lat, lng: origin.lng }}
              onClick={() => setSelectedMarker('origin')}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }}
            />
          )}

          {!directions && destination.lat && destination.lng && (
            <Marker
              position={{ lat: destination.lat, lng: destination.lng }}
              onClick={() => setSelectedMarker('destination')}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#EA4335',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
              }}
            />
          )}

          {/* Info Windows */}
          {selectedMarker === 'origin' && origin.lat && origin.lng && (
            <InfoWindow
              position={{ lat: origin.lat, lng: origin.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <HomeIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Partenza</h3>
                </div>
                <p className="text-sm text-gray-600">{origin.label || 'Punto di partenza'}</p>
                <p className="text-xs text-gray-500 mt-1">{origin.address}</p>
              </div>
            </InfoWindow>
          )}

          {selectedMarker === 'destination' && destination.lat && destination.lng && (
            <InfoWindow
              position={{ lat: destination.lat, lng: destination.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2">
                  <BriefcaseIcon className="h-5 w-5 text-red-600" />
                  <h3 className="font-semibold">Destinazione</h3>
                </div>
                <p className="text-sm text-gray-600">{destination.label || 'Punto di arrivo'}</p>
                <p className="text-xs text-gray-500 mt-1">{destination.address}</p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

export default RouteMap;
