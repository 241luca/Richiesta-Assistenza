/**
 * Utility per il caricamento di Google Maps
 * VERSIONE SEMPLIFICATA per evitare loop infiniti
 * Non usa React Query per evitare dipendenze circolari
 */

declare global {
  interface Window {
    google: any;
    initMap: () => void;
    googleMapsLoaded?: boolean;
    googleMapsLoading?: boolean;
  }
}

let mapLoadPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (): Promise<void> => {
  // Se è già caricato
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  // Se sta già caricando
  if (mapLoadPromise) {
    return mapLoadPromise;
  }

  // Crea la promise di caricamento
  mapLoadPromise = new Promise((resolve, reject) => {
    try {
      // Controlla se lo script esiste già
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')));
        return;
      }

      // Crea nuovo script
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      
      // Se non c'è API key, non caricare
      if (!apiKey || apiKey === 'AIza_your_google_maps_key_here') {
        reject(new Error('Google Maps API key not configured'));
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&language=it&region=IT&callback=initMap`;
      script.async = true;
      script.defer = true;

      // Callback globale
      window.initMap = () => {
        window.googleMapsLoaded = true;
        window.googleMapsLoading = false;
        resolve();
      };

      script.onerror = () => {
        window.googleMapsLoading = false;
        mapLoadPromise = null;
        reject(new Error('Failed to load Google Maps script'));
      };

      document.head.appendChild(script);
      window.googleMapsLoading = true;
    } catch (error) {
      reject(error);
    }
  });

  return mapLoadPromise;
};

// Hook per usare Google Maps
export const useGoogleMapsLoader = () => {
  const isLoaded = !!(window.google && window.google.maps);
  const isLoading = window.googleMapsLoading || false;
  
  return {
    isLoaded,
    isLoading,
    load: loadGoogleMapsScript
  };
};