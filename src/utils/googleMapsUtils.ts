/**
 * 🗺️ GOOGLE MAPS UTILITIES - Costanti e Helper
 * 
 * Centralizza tutti i mapId e configurazioni Maps
 * Data: 2 Ottobre 2025
 */

/**
 * MAP IDs standardizzati
 * Ogni componente Map DEVE avere un mapId univoco
 * OBBLIGATORIO per AdvancedMarker
 */
export const MAP_IDS = {
  REQUEST_MAP: 'RICHIESTA_ASSISTENZA_MAP',
  PROFESSIONAL_ZONES: 'PROFESSIONAL_ZONES_MAP',
  ROUTE_MAP: 'ROUTE_MAP',
  TRACKING_MAP: 'LIVE_TRACKING_MAP',
  DEBUG_TEST: 'DEBUG_TEST_MAP',
  CALENDAR_MAP: 'CALENDAR_INTERVENTIONS_MAP',
} as const;

/**
 * Centro mappa default (Italia centrale)
 */
export const DEFAULT_MAP_CENTER = {
  lat: 42.8333,
  lng: 12.8333
};

/**
 * Configurazione comune per tutte le mappe
 */
export const DEFAULT_MAP_OPTIONS = {
  gestureHandling: 'greedy' as const,
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: true,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: true,
};

/**
 * Colori per stati richieste
 */
export const REQUEST_STATUS_COLORS = {
  PENDING: '#FFA500',
  ASSIGNED: '#3B82F6',
  IN_PROGRESS: '#8B5CF6',
  COMPLETED: '#10B981',
  CANCELLED: '#EF4444',
  REJECTED: '#DC2626',
} as const;

/**
 * Colori per priorità
 */
export const PRIORITY_COLORS = {
  URGENT: '#DC2626',
  HIGH: '#F59E0B',
  MEDIUM: '#3B82F6',
  LOW: '#10B981',
} as const;

/**
 * Calcola distanza tra due punti (formula Haversine)
 */
export function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371; // Raggio Terra in km
  const dLat = toRad(point2.lat - point1.lat);
  const dLon = toRad(point2.lng - point1.lng);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.lat)) *
    Math.cos(toRad(point2.lat)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calcola centro di un array di coordinate
 */
export function calculateCenter(
  points: Array<{ lat: number; lng: number }>
): { lat: number; lng: number } {
  if (points.length === 0) return DEFAULT_MAP_CENTER;
  
  const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
  const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
  
  return { lat: avgLat, lng: avgLng };
}

/**
 * Determina zoom ottimale in base al numero di marker
 */
export function getOptimalZoom(markerCount: number): number {
  if (markerCount === 1) return 15;
  if (markerCount <= 3) return 12;
  if (markerCount <= 10) return 10;
  return 8;
}
