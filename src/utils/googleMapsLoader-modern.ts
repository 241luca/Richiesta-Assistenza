/**
 * Google Maps Loader moderno con @googlemaps/js-api-loader
 * Versione aggiornata 2025 - Usa la libreria ufficiale di Google
 */

import { Loader } from '@googlemaps/js-api-loader';

// Singleton per il loader
let loaderInstance: Loader | null = null;
let loadPromise: Promise<typeof google> | null = null;

/**
 * Ottiene o crea l'istanza del loader
 */
function getLoader(): Loader {
  if (!loaderInstance) {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    
    if (!apiKey || apiKey === 'LA_TUA_NUOVA_CHIAVE_QUI') {
      throw new Error('Google Maps API key not configured');
    }

    loaderInstance = new Loader({
      apiKey,
      version: 'weekly',  // Usa sempre l'ultima versione stabile
      libraries: ['places', 'geometry', 'marker', 'drawing'],  // Tutte le librerie necessarie
      language: 'it',
      region: 'IT'
    });
  }
  
  return loaderInstance;
}

/**
 * Carica Google Maps Script (nuovo metodo)
 */
export const loadGoogleMapsScript = async (): Promise<typeof google> => {
  // Se è già caricato
  if (window.google && window.google.maps) {
    return window.google;
  }

  // Se sta già caricando
  if (loadPromise) {
    return loadPromise;
  }

  try {
    const loader = getLoader();
    loadPromise = loader.load();
    const google = await loadPromise;
    
    console.log('✅ Google Maps caricato con successo');
    return google;
  } catch (error) {
    loadPromise = null;  // Reset per retry
    console.error('❌ Errore caricamento Google Maps:', error);
    throw error;
  }
};

/**
 * Carica una libreria specifica
 */
export const loadGoogleMapsLibrary = async (libraryName: 'maps' | 'marker' | 'places' | 'geometry' | 'drawing') => {
  const loader = getLoader();
  return loader.importLibrary(libraryName);
};

/**
 * Hook per usare Google Maps (compatibile con il vecchio codice)
 */
export const useGoogleMapsLoader = () => {
  const isLoaded = !!(window.google && window.google.maps);
  const isLoading = loadPromise !== null && !isLoaded;
  
  return {
    isLoaded,
    isLoading,
    load: loadGoogleMapsScript,
    loadLibrary: loadGoogleMapsLibrary
  };
};

/**
 * Esempio di utilizzo con le nuove Advanced Marker
 */
export const createAdvancedMarker = async (map: google.maps.Map, position: google.maps.LatLngLiteral) => {
  // Carica la libreria marker se necessario
  const { AdvancedMarkerElement } = await loadGoogleMapsLibrary('marker') as google.maps.MarkerLibrary;
  
  return new AdvancedMarkerElement({
    map,
    position,
    title: 'Posizione'
  });
};
