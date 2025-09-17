/**
 * ProfessionalZoneMap Component
 * Permette ai professionisti di definire le loro zone di copertura
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, DrawingManager, Polygon, Circle, Rectangle } from '@react-google-maps/api';
import { TrashIcon, PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useGoogleMaps, defaultMapOptions, defaultCenter, ZOOM_LEVELS } from '../../contexts/GoogleMapsContext';
import toast from 'react-hot-toast';

interface Zone {
  id: string;
  type: 'polygon' | 'circle' | 'rectangle';
  coordinates: any;
  name: string;
  color: string;
  area?: number; // km²
}

interface ProfessionalZoneMapProps {
  zones?: Zone[];
  onZonesChange?: (zones: Zone[]) => void;
  height?: string;
  editable?: boolean;
  maxZones?: number;
}

const containerStyle = {
  width: '100%',
  height: '500px',
};

const drawingOptions = {
  drawingControl: true,
  drawingControlOptions: {
    position: google.maps.ControlPosition?.TOP_CENTER,
    drawingModes: [
      google.maps.drawing.OverlayType.POLYGON,
      google.maps.drawing.OverlayType.CIRCLE,
      google.maps.drawing.OverlayType.RECTANGLE,
    ],
  },
  polygonOptions: {
    fillColor: '#3B82F6',
    fillOpacity: 0.3,
    strokeWeight: 2,
    strokeColor: '#2563EB',
    editable: true,
    draggable: true,
  },
  circleOptions: {
    fillColor: '#10B981',
    fillOpacity: 0.3,
    strokeWeight: 2,
    strokeColor: '#059669',
    editable: true,
    draggable: true,
  },
  rectangleOptions: {
    fillColor: '#F59E0B',
    fillOpacity: 0.3,
    strokeWeight: 2,
    strokeColor: '#D97706',
    editable: true,
    draggable: true,
  },
};

export function ProfessionalZoneMap({
  zones: initialZones = [],
  onZonesChange,
  height = '500px',
  editable = true,
  maxZones = 5,
}: ProfessionalZoneMapProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [zones, setZones] = useState<Zone[]>(initialZones);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [editingZone, setEditingZone] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState('');
  const overlaysRef = useRef<Map<string, any>>(new Map());

  // Calcola l'area di un poligono
  const calculatePolygonArea = (path: google.maps.LatLng[]): number => {
    return google.maps.geometry.spherical.computeArea(path) / 1000000; // Converti in km²
  };

  // Calcola l'area di un cerchio
  const calculateCircleArea = (radius: number): number => {
    return Math.PI * Math.pow(radius / 1000, 2); // Converti in km²
  };

  // Calcola l'area di un rettangolo
  const calculateRectangleArea = (bounds: google.maps.LatLngBounds): number => {
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const height = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(ne.lat(), sw.lng()),
      new google.maps.LatLng(sw.lat(), sw.lng())
    );
    const width = google.maps.geometry.spherical.computeDistanceBetween(
      new google.maps.LatLng(sw.lat(), ne.lng()),
      new google.maps.LatLng(sw.lat(), sw.lng())
    );
    return (height * width) / 1000000; // Converti in km²
  };

  // Gestione completamento disegno
  const onOverlayComplete = useCallback((e: google.maps.drawing.OverlayCompleteEvent) => {
    if (zones.length >= maxZones) {
      toast.error(`Puoi creare massimo ${maxZones} zone`);
      e.overlay?.setMap(null);
      return;
    }

    const overlay = e.overlay;
    if (!overlay) return;

    const zoneId = `zone_${Date.now()}`;
    let area = 0;
    let coordinates: any = null;

    // Estrai coordinate e calcola area in base al tipo
    if (e.type === google.maps.drawing.OverlayType.POLYGON) {
      const polygon = overlay as google.maps.Polygon;
      const path = polygon.getPath();
      coordinates = path.getArray().map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));
      area = calculatePolygonArea(path.getArray());
    } else if (e.type === google.maps.drawing.OverlayType.CIRCLE) {
      const circle = overlay as google.maps.Circle;
      coordinates = {
        center: {
          lat: circle.getCenter()?.lat(),
          lng: circle.getCenter()?.lng(),
        },
        radius: circle.getRadius(),
      };
      area = calculateCircleArea(circle.getRadius());
    } else if (e.type === google.maps.drawing.OverlayType.RECTANGLE) {
      const rectangle = overlay as google.maps.Rectangle;
      const bounds = rectangle.getBounds();
      if (bounds) {
        coordinates = {
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        };
        area = calculateRectangleArea(bounds);
      }
    }

    // Crea nuova zona
    const newZone: Zone = {
      id: zoneId,
      type: e.type.toLowerCase() as Zone['type'],
      coordinates,
      name: `Zona ${zones.length + 1}`,
      color: '#3B82F6',
      area: Math.round(area * 100) / 100,
    };

    // Salva riferimento all'overlay
    overlaysRef.current.set(zoneId, overlay);

    // Aggiungi listener per modifiche
    if (editable) {
      if (e.type === google.maps.drawing.OverlayType.POLYGON) {
        const polygon = overlay as google.maps.Polygon;
        google.maps.event.addListener(polygon.getPath(), 'set_at', () => updateZoneArea(zoneId));
        google.maps.event.addListener(polygon.getPath(), 'insert_at', () => updateZoneArea(zoneId));
        google.maps.event.addListener(polygon.getPath(), 'remove_at', () => updateZoneArea(zoneId));
      } else if (e.type === google.maps.drawing.OverlayType.CIRCLE) {
        const circle = overlay as google.maps.Circle;
        google.maps.event.addListener(circle, 'radius_changed', () => updateZoneArea(zoneId));
        google.maps.event.addListener(circle, 'center_changed', () => updateZoneArea(zoneId));
      } else if (e.type === google.maps.drawing.OverlayType.RECTANGLE) {
        const rectangle = overlay as google.maps.Rectangle;
        google.maps.event.addListener(rectangle, 'bounds_changed', () => updateZoneArea(zoneId));
      }
    }

    // Aggiungi click listener
    google.maps.event.addListener(overlay, 'click', () => {
      setSelectedZone(zoneId);
    });

    // Aggiorna stato
    const updatedZones = [...zones, newZone];
    setZones(updatedZones);
    setSelectedZone(zoneId);
    
    if (onZonesChange) {
      onZonesChange(updatedZones);
    }

    toast.success('Zona creata con successo');
  }, [zones, maxZones, editable, onZonesChange]);

  // Aggiorna l'area di una zona
  const updateZoneArea = useCallback((zoneId: string) => {
    const overlay = overlaysRef.current.get(zoneId);
    if (!overlay) return;

    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) return;

    let newArea = 0;
    let newCoordinates: any = null;

    if (zone.type === 'polygon') {
      const polygon = overlay as google.maps.Polygon;
      const path = polygon.getPath();
      newCoordinates = path.getArray().map((latLng) => ({
        lat: latLng.lat(),
        lng: latLng.lng(),
      }));
      newArea = calculatePolygonArea(path.getArray());
    } else if (zone.type === 'circle') {
      const circle = overlay as google.maps.Circle;
      newCoordinates = {
        center: {
          lat: circle.getCenter()?.lat(),
          lng: circle.getCenter()?.lng(),
        },
        radius: circle.getRadius(),
      };
      newArea = calculateCircleArea(circle.getRadius());
    } else if (zone.type === 'rectangle') {
      const rectangle = overlay as google.maps.Rectangle;
      const bounds = rectangle.getBounds();
      if (bounds) {
        newCoordinates = {
          north: bounds.getNorthEast().lat(),
          south: bounds.getSouthWest().lat(),
          east: bounds.getNorthEast().lng(),
          west: bounds.getSouthWest().lng(),
        };
        newArea = calculateRectangleArea(bounds);
      }
    }

    const updatedZones = zones.map((z) =>
      z.id === zoneId
        ? { ...z, coordinates: newCoordinates, area: Math.round(newArea * 100) / 100 }
        : z
    );

    setZones(updatedZones);
    
    if (onZonesChange) {
      onZonesChange(updatedZones);
    }
  }, [zones, onZonesChange]);

  // Elimina una zona
  const deleteZone = useCallback((zoneId: string) => {
    const overlay = overlaysRef.current.get(zoneId);
    if (overlay) {
      overlay.setMap(null);
      overlaysRef.current.delete(zoneId);
    }

    const updatedZones = zones.filter((z) => z.id !== zoneId);
    setZones(updatedZones);
    setSelectedZone(null);
    
    if (onZonesChange) {
      onZonesChange(updatedZones);
    }

    toast.success('Zona eliminata');
  }, [zones, onZonesChange]);

  // Rinomina una zona
  const renameZone = useCallback((zoneId: string, newName: string) => {
    const updatedZones = zones.map((z) =>
      z.id === zoneId ? { ...z, name: newName } : z
    );
    setZones(updatedZones);
    setEditingZone(null);
    setZoneName('');
    
    if (onZonesChange) {
      onZonesChange(updatedZones);
    }

    toast.success('Zona rinominata');
  }, [zones, onZonesChange]);

  // Esporta zone come KML
  const exportAsKML = useCallback(() => {
    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Zone di Copertura</name>
    ${zones.map((zone) => `
    <Placemark>
      <name>${zone.name}</name>
      <description>Area: ${zone.area} km²</description>
      ${zone.type === 'polygon' ? `
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${zone.coordinates.map((coord: any) => `${coord.lng},${coord.lat},0`).join(' ')}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
      ` : ''}
    </Placemark>
    `).join('')}
  </Document>
</kml>`;

    const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zone_copertura.kml';
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Zone esportate come KML');
  }, [zones]);

  // Callback quando la mappa è caricata
  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Callback quando la mappa viene smontata
  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

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

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600">Errore nel caricamento della mappa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {editable && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Zone di Copertura</h3>
              <p className="text-sm text-gray-500 mt-1">
                Disegna sulla mappa le aree dove offri i tuoi servizi ({zones.length}/{maxZones} zone)
              </p>
            </div>
            {zones.length > 0 && (
              <button
                onClick={exportAsKML}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Esporta KML
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mappa */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <GoogleMap
          mapContainerStyle={{ ...containerStyle, height }}
          center={defaultCenter}
          zoom={ZOOM_LEVELS.REGION}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={defaultMapOptions}
        >
          {editable && (
            <DrawingManager
              onOverlayComplete={onOverlayComplete}
              options={drawingOptions}
            />
          )}
        </GoogleMap>
      </div>

      {/* Lista Zone */}
      {zones.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Zone Definite</h4>
            <div className="space-y-2">
              {zones.map((zone) => (
                <div
                  key={zone.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    selectedZone === zone.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedZone(zone.id)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: zone.color }}
                    />
                    {editingZone === zone.id ? (
                      <input
                        type="text"
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900">{zone.name}</p>
                        <p className="text-sm text-gray-500">
                          {zone.type === 'polygon' && 'Poligono'}
                          {zone.type === 'circle' && 'Cerchio'}
                          {zone.type === 'rectangle' && 'Rettangolo'}
                          {zone.area && ` • ${zone.area} km²`}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {editable && (
                    <div className="flex items-center gap-2">
                      {editingZone === zone.id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              renameZone(zone.id, zoneName);
                            }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingZone(null);
                              setZoneName('');
                            }}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingZone(zone.id);
                              setZoneName(zone.name);
                            }}
                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteZone(zone.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-100 rounded"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}