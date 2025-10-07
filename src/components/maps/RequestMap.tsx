/**
 * 🗺️ REQUEST MAP - Sistema Modernizzato v5.2
 * 
 * Basato su @vis.gl/react-google-maps
 * Pattern dalla documentazione ufficiale
 * Data: 2 Ottobre 2025
 */

import React, { useState, useMemo } from 'react';
import { Map, AdvancedMarker, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';

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
  onRequestClick?: (request: Request) => void;
}

const defaultCenter = {
  lat: 45.0703, // Torino
  lng: 7.6869
};

/**
 * Componente per marker singolo con InfoWindow
 */
function RequestMarker({ request, onClick }: { request: Request; onClick?: (request: Request) => void }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoWindowOpen, setInfoWindowOpen] = useState(false);

  const position = useMemo(() => ({
    lat: request.latitude!,
    lng: request.longitude!
  }), [request.latitude, request.longitude]);

  // Colore marker in base allo stato
  const getMarkerColor = () => {
    switch (request.status) {
      case 'PENDING': return '#FFA500';
      case 'IN_PROGRESS': return '#3B82F6';
      case 'COMPLETED': return '#10B981';
      case 'CANCELLED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Colore in base alla priorità
  const getPriorityColor = () => {
    switch (request.priority) {
      case 'URGENT': return '#DC2626';
      case 'HIGH': return '#F59E0B';
      case 'MEDIUM': return '#3B82F6';
      case 'LOW': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={position}
        onClick={() => {
          setInfoWindowOpen(true);
          onClick?.(request);
        }}
      >
        <div
          style={{
            width: '30px',
            height: '30px',
            backgroundColor: getMarkerColor(),
            borderRadius: '50%',
            border: `3px solid ${getPriorityColor()}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        >
          {request.priority === 'URGENT' ? '!' : ''}
        </div>
      </AdvancedMarker>

      {infoWindowOpen && (
        <InfoWindow
          anchor={marker}
          onClose={() => setInfoWindowOpen(false)}
        >
          <div className="p-2 max-w-xs">
            <h3 className="font-semibold text-gray-900 mb-1">
              {request.title}
            </h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📍 {request.address}, {request.city}</p>
              <p>
                <span className="inline-block px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: getMarkerColor() + '20', color: getMarkerColor() }}
                >
                  {request.status}
                </span>
              </p>
              <p>
                <span className="inline-block px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: getPriorityColor() + '20', color: getPriorityColor() }}
                >
                  Priorità: {request.priority}
                </span>
              </p>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

/**
 * Componente principale mappa richieste
 */
export function RequestMap({
  requests,
  center,
  zoom = 10,
  height = '500px',
  singleRequestMode = false,
  showControls = true,
  onRequestClick
}: RequestMapProps) {
  // Filtra richieste con coordinate valide
  const validRequests = useMemo(
    () => requests.filter(r => r.latitude && r.longitude),
    [requests]
  );

  // Calcola centro automaticamente se non fornito
  const mapCenter = useMemo(() => {
    if (center) return center;
    
    if (validRequests.length === 1) {
      return {
        lat: validRequests[0].latitude!,
        lng: validRequests[0].longitude!
      };
    }

    if (validRequests.length > 1) {
      const avgLat = validRequests.reduce((sum, r) => sum + r.latitude!, 0) / validRequests.length;
      const avgLng = validRequests.reduce((sum, r) => sum + r.longitude!, 0) / validRequests.length;
      return { lat: avgLat, lng: avgLng };
    }

    return defaultCenter;
  }, [center, validRequests]);

  // Zoom automatico: singola richiesta = più vicino, multiple = più lontano
  const mapZoom = useMemo(() => {
    if (singleRequestMode || validRequests.length === 1) return 15;
    if (validRequests.length <= 3) return 12;
    if (validRequests.length <= 10) return 10;
    return 9;
  }, [singleRequestMode, validRequests.length]);

  if (validRequests.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">📍</p>
          <p>Nessuna richiesta con coordinate valide</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <Map
        mapId="RICHIESTA_ASSISTENZA_MAP"
        center={mapCenter}
        zoom={zoom || mapZoom}
        gestureHandling="greedy"
        disableDefaultUI={!showControls}
        style={{ width: '100%', height: '100%' }}
      >
        {validRequests.map(request => (
          <RequestMarker
            key={request.id}
            request={request}
            onClick={onRequestClick}
          />
        ))}
      </Map>
    </div>
  );
}
