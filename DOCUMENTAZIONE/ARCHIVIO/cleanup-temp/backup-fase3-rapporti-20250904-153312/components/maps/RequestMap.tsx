// Backup del file originale
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
  const [forceRender, setForceRender] = useState(0);

  // Carica Google Maps se non è già caricato
  useEffect(() => {
    if (!isLoaded && !isLoading) {
      console.log('Loading Google Maps...');
      load()
        .then(() => {
          console.log('Google Maps loaded successfully');
          // Forza un re-render dopo il caricamento
          setForceRender(prev => prev + 1);
        })
        .catch(err => {
          console.error('Failed to load Google Maps:', err);
          setLoadError(err.message || 'Failed to load Google Maps');
        });
    }
  }, [isLoaded, isLoading, load]);

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
    <div style={{ height, width: '100%' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={
          singleRequestMode && validRequests[0]
            ? { lat: validRequests[0].latitude!, lng: validRequests[0].longitude! }
            : center
        }
        zoom={singleRequestMode ? 15 : zoom}
        options={defaultOptions}
        onLoad={(map) => setMap(map)}
      >
        {validRequests.map((request) => (
          <Marker
            key={request.id}
            position={{
              lat: request.latitude!,
              lng: request.longitude!,
            }}
            onClick={() => setSelectedRequest(request)}
            icon={{
              url: `https://maps.google.com/mapfiles/ms/icons/${getMarkerColor(request.status)}-dot.png`,
              scaledSize: new window.google.maps.Size(32, 32),
            }}
            title={`${getPriorityIcon(request.priority)} ${request.title}`}
          />
        ))}

        {selectedRequest && (
          <InfoWindow
            position={{
              lat: selectedRequest.latitude!,
              lng: selectedRequest.longitude!,
            }}
            onCloseClick={() => setSelectedRequest(null)}
          >
            <div className="p-2">
              <h3 className="font-semibold text-sm">{selectedRequest.title}</h3>
              <p className="text-xs text-gray-600 mt-1">
                {selectedRequest.address}, {selectedRequest.city}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  selectedRequest.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                  selectedRequest.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                  selectedRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedRequest.status}
                </span>
                <span className="text-xs">
                  {getPriorityIcon(selectedRequest.priority)} {selectedRequest.priority}
                </span>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}