/**
 * RequestMap Component
 * Visualizza le richieste di assistenza su una mappa interattiva
 * 
 * NOTA: Google Maps Marker è deprecato ma continuerà a funzionare per almeno 12 mesi.
 * TODO: Migrare a AdvancedMarkerElement in futuro
 */

// Sopprime temporaneamente l'avviso di deprecazione di Google Maps e warning di elementi già definiti
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (typeof message === 'string' && 
        (message.includes('google.maps.Marker is deprecated') ||
         message.includes('already defined'))) {
      return; // Sopprime questi specifici avvisi
    }
    originalConsoleWarn.apply(console, args);
  };
}

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { GoogleMap, Marker, InfoWindow, MarkerClusterer } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { MapPinIcon, UserIcon, CalendarIcon, TagIcon } from '@heroicons/react/24/outline';
import { useGoogleMaps, MapFallback } from '../../contexts/GoogleMapsContext';
import { api } from '../../services/api';
import { AssistanceRequest } from '../../types';

interface RequestMapProps {
  requests?: any[];
  height?: string;
  showFilters?: boolean;
  onRequestClick?: (request: any) => void;
  center?: { lat: number; lng: number };
  zoom?: number;
  showControls?: boolean;
  singleRequestMode?: boolean;
}

const containerStyle = {
  width: '100%',
  height: '500px',
};

// Icone personalizzate per i marker in base allo stato
const markerIcons = {
  PENDING: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  pending: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
  ASSIGNED: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  assigned: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
  IN_PROGRESS: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  in_progress: 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png',
  COMPLETED: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  completed: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
  CANCELLED: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  cancelled: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
  default: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
};

const statusLabels = {
  PENDING: 'In attesa',
  pending: 'In attesa',
  ASSIGNED: 'Assegnato',
  assigned: 'Assegnato',
  IN_PROGRESS: 'In corso',
  in_progress: 'In corso',
  COMPLETED: 'Completato',
  completed: 'Completato',
  CANCELLED: 'Annullato',
  cancelled: 'Annullato',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  low: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  medium: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  high: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
  urgent: 'bg-red-100 text-red-800',
};

const priorityLabels = {
  LOW: 'Bassa',
  low: 'Bassa',
  MEDIUM: 'Media',
  medium: 'Media',
  HIGH: 'Alta',
  high: 'Alta',
  URGENT: 'Urgente',
  urgent: 'Urgente',
};

export function RequestMap({ 
  requests: propRequests, 
  height = '500px', 
  showFilters = true,
  onRequestClick,
  center,
  zoom = 12,
  showControls = true,
  singleRequestMode = false
}: RequestMapProps) {
  const { isLoaded, loadError, apiKeyConfigured } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<AssistanceRequest | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all',
  });

  // Se non vengono passate richieste, le carichiamo
  const { data: fetchedRequests, isLoading } = useQuery({
    queryKey: ['requests-with-coordinates'],
    queryFn: () => api.get('/assistance-requests?hasCoordinates=true'),
    enabled: !propRequests && !singleRequestMode,
  });

  const requests = propRequests || fetchedRequests?.data || [];

  // Filtra le richieste
  const filteredRequests = useMemo(() => {
    if (singleRequestMode && requests.length === 1) {
      const request = requests[0];
      if (request.latitude && request.longitude) {
        return [request];
      }
      return [];
    }

    return requests.filter((request) => {
      if (!request.latitude || !request.longitude) return false;
      
      if (!showFilters) return true;
      
      if (filters.status !== 'all' && request.status !== filters.status) return false;
      if (filters.category !== 'all' && request.categoryId !== filters.category) return false;
      if (filters.priority !== 'all' && request.priority !== filters.priority) return false;
      
      return true;
    });
  }, [requests, filters, showFilters, singleRequestMode]);

  // Callback quando la mappa è caricata
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);

    if (center && center.lat && center.lng) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
    else if (filteredRequests.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      filteredRequests.forEach((request) => {
        if (request.latitude && request.longitude) {
          bounds.extend({ lat: request.latitude, lng: request.longitude });
        }
      });
      
      if (filteredRequests.length === 1) {
        map.setCenter(bounds.getCenter());
        map.setZoom(zoom);
      } else {
        map.fitBounds(bounds);
      }
    }
  }, [filteredRequests, center, zoom]);

  // Aggiorna la mappa quando cambiano le coordinate del centro
  useEffect(() => {
    if (map && center && center.lat && center.lng) {
      map.setCenter(center);
      map.setZoom(zoom);
    }
  }, [map, center, zoom]);

  // Callback quando la mappa viene smontata
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Gestione click su marker
  const handleMarkerClick = (request: AssistanceRequest) => {
    setSelectedRequest(request);
    if (onRequestClick) {
      onRequestClick(request);
    }
  };

  // Gestione chiusura InfoWindow
  const handleInfoWindowClose = () => {
    setSelectedRequest(null);
  };

  // Se Google Maps non è configurato, mostra il fallback
  if (!apiKeyConfigured || loadError) {
    const request = propRequests?.[0];
    const address = request ? 
      `${request.address}, ${request.city} (${request.province}) ${request.postalCode}` : 
      undefined;
    
    return <MapFallback address={address} />;
  }

  // Se Google Maps è configurato ma non ancora caricato
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento mappa...</p>
        </div>
      </div>
    );
  }

  // Prepara i markers da visualizzare
  let markersToDisplay = filteredRequests;
  
  if (singleRequestMode && requests.length === 1 && center && center.lat && center.lng) {
    const request = requests[0];
    markersToDisplay = [{
      ...request,
      latitude: request.latitude || center.lat,
      longitude: request.longitude || center.lng
    }];
  }

  return (
    <div className="space-y-4">
      {/* Filtri */}
      {showFilters && !singleRequestMode && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro Stato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stato
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutti</option>
                {Object.entries(statusLabels).map(([value, label]) => {
                  if (value === value.toLowerCase()) return null;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filtro Priorità */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tutte</option>
                {Object.entries(priorityLabels).map(([value, label]) => {
                  if (value === value.toLowerCase()) return null;
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Contatore richieste */}
            <div className="flex items-end">
              <div className="bg-blue-50 px-4 py-2 rounded-md w-full">
                <p className="text-sm text-gray-600">Richieste visualizzate</p>
                <p className="text-xl font-semibold text-blue-600">
                  {filteredRequests.length} / {requests.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mappa */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height }}
          center={center || { lat: 41.9028, lng: 12.4964 }}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: showControls,
            mapTypeControl: showControls,
            scaleControl: showControls,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: showControls,
            disableDefaultUI: !showControls,
            gestureHandling: 'greedy',
            mapTypeId: 'roadmap'
          }}
        >
          {/* Marker senza clustering per pochi elementi */}
          {singleRequestMode || markersToDisplay.length <= 3 ? (
            markersToDisplay.map((request) => {
              const markerIcon = markerIcons[request.status] || markerIcons[request.status?.toLowerCase()] || markerIcons.default;
              
              return (
                <Marker
                  key={request.id}
                  position={{ 
                    lat: request.latitude || center?.lat || 41.9028, 
                    lng: request.longitude || center?.lng || 12.4964 
                  }}
                  icon={markerIcon}
                  onClick={() => handleMarkerClick(request)}
                />
              );
            })
          ) : (
            // Marker Clusterer per molti marker
            <MarkerClusterer
              options={{
                imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
                gridSize: 50,
                maxZoom: 15,
              }}
            >
              {(clusterer) => (
                <>
                  {markersToDisplay.map((request) => {
                    const markerIcon = markerIcons[request.status] || markerIcons[request.status?.toLowerCase()] || markerIcons.default;
                    
                    return (
                      <Marker
                        key={request.id}
                        position={{ lat: request.latitude!, lng: request.longitude! }}
                        icon={markerIcon}
                        clusterer={clusterer}
                        onClick={() => handleMarkerClick(request)}
                      />
                    );
                  })}
                </>
              )}
            </MarkerClusterer>
          )}

          {/* InfoWindow per richiesta selezionata */}
          {selectedRequest && (selectedRequest.latitude || center) && (selectedRequest.longitude || center) && (
            <InfoWindow
              position={{ 
                lat: selectedRequest.latitude || center?.lat || 41.9028, 
                lng: selectedRequest.longitude || center?.lng || 12.4964 
              }}
              onCloseClick={handleInfoWindowClose}
            >
              <div className="p-2 max-w-xs">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {selectedRequest.title}
                </h3>
                
                <div className="space-y-2 text-sm">
                  {/* Stato e Priorità */}
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedRequest.status === 'COMPLETED' || selectedRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedRequest.status === 'IN_PROGRESS' || selectedRequest.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      selectedRequest.status === 'ASSIGNED' || selectedRequest.status === 'assigned' ? 'bg-indigo-100 text-indigo-800' :
                      selectedRequest.status === 'CANCELLED' || selectedRequest.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {statusLabels[selectedRequest.status] || 'In attesa'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      priorityColors[selectedRequest.priority] || 'bg-gray-100 text-gray-800'
                    }`}>
                      {priorityLabels[selectedRequest.priority] || 'Media'}
                    </span>
                  </div>

                  {/* Cliente */}
                  {selectedRequest.client && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserIcon className="h-4 w-4" />
                      <span>
                        {selectedRequest.client.firstName} {selectedRequest.client.lastName}
                      </span>
                    </div>
                  )}

                  {/* Data */}
                  {selectedRequest.requestedDate && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <CalendarIcon className="h-4 w-4" />
                      <span>
                        {format(new Date(selectedRequest.requestedDate), 'dd MMM yyyy', { locale: it })}
                      </span>
                    </div>
                  )}

                  {/* Indirizzo */}
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPinIcon className="h-4 w-4 mt-0.5" />
                    <div>
                      <p>{selectedRequest.address}</p>
                      <p>{selectedRequest.postalCode} {selectedRequest.city} ({selectedRequest.province})</p>
                    </div>
                  </div>

                  {/* Categoria */}
                  {selectedRequest.category && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <TagIcon className="h-4 w-4" />
                      <span>{typeof selectedRequest.category === 'string' ? selectedRequest.category : selectedRequest.category.name}</span>
                    </div>
                  )}
                </div>

                {/* Azioni */}
                {!singleRequestMode && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        if (onRequestClick) {
                          onRequestClick(selectedRequest);
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Visualizza dettagli →
                    </button>
                  </div>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Legenda */}
      {!singleRequestMode && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Legenda</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
            {Object.entries(statusLabels).map(([status, label]) => {
              if (status === status.toLowerCase()) return null;
              const icon = markerIcons[status as keyof typeof markerIcons];
              return (
                <div key={status} className="flex items-center gap-2">
                  <img src={icon} alt={label} className="h-4 w-4" />
                  <span className="text-gray-600">{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
