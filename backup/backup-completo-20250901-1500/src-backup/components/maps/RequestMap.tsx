/**
 * RequestMap Component
 * UPDATED: Usa il nuovo googleMapsLoader semplificato per evitare loop infiniti
 */

import React, { useEffect, useState } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '../../utils/googleMapsLoader';

interface Request {
  id: string;
  title: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  status: string;
  priority: string;
}

interface RequestMapProps {
  requests: Request[];
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  showFilters?: boolean;
  singleRequestMode?: boolean;
  showControls?: boolean;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 45.0703, // Torino
  lng: 7.6869
};

const defaultOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
};

export function RequestMap({
  requests,
  center = defaultCenter,
  zoom = 10,
  height = '400px',
  showFilters = true,
  singleRequestMode = false,
  showControls = false,
}: RequestMapProps) {
  const { isLoaded, isLoading, load } = useGoogleMapsLoader();
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Carica Google Maps se non è già caricato
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      console.log('Loading Google Maps...');
      load().catch(err => {
        console.error('Failed to load Google Maps:', err);
        setLoadError(err.message || 'Failed to load Google Maps');
      });
    }
  }, [isLoaded, isLoading]);

  // Aggiungi un piccolo delay per assicurarsi che Google Maps sia completamente caricato
  useEffect(() => {
    if (isLoaded && !map) {
      // Forza un re-render dopo che Google Maps è caricato
      const timer = setTimeout(() => {
        setMap(null); // Trigger re-render
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, map]);

  // Se c'è un errore nel caricamento
  if (loadError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600 text-sm">
          Impossibile caricare la mappa: {loadError}
        </p>
        <p className="text-red-500 text-xs mt-2">
          Verifica che la chiave API di Google Maps sia configurata correttamente.
        </p>
      </div>
    );
  }

  // Se sta caricando
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Caricamento mappa...</span>
      </div>
    );
  }

  // Filter requests with valid coordinates
  const validRequests = requests.filter(r => r.latitude && r.longitude);

  if (validRequests.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-600 text-sm">
          Nessuna richiesta con coordinate disponibili da visualizzare sulla mappa.
        </p>
      </div>
    );
  }

  const getMarkerColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'yellow';
      case 'assigned':
        return 'blue';
      case 'in_progress':
        return 'orange';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      default:
        return 'red';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return '🔴';
      case 'high':
        return '🟠';
      case 'medium':
        return '🟡';
      case 'low':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return (
    <div style={{ height }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={zoom}
        options={defaultOptions}
        onLoad={setMap}
      >
        {validRequests.map((request) => (
          <Marker
            key={request.id}
            position={{ lat: request.latitude!, lng: request.longitude! }}
            onClick={() => setSelectedRequest(request)}
            icon={{
              url: `https://maps.google.com/mapfiles/ms/icons/${getMarkerColor(request.status)}-dot.png`,
            }}
          />
        ))}

        {selectedRequest && (
          <InfoWindow
            position={{ lat: selectedRequest.latitude!, lng: selectedRequest.longitude! }}
            onCloseClick={() => setSelectedRequest(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-semibold text-gray-900 mb-1">
                {getPriorityIcon(selectedRequest.priority)} {selectedRequest.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                {selectedRequest.address}, {selectedRequest.city}
              </p>
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedRequest.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                  selectedRequest.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                  selectedRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedRequest.status}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}