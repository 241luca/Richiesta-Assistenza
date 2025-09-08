/**
 * Google Maps Context
 * Fornisce l'accesso a Google Maps in tutta l'applicazione
 * Utilizza la chiave API salvata nel database o dall'environment come fallback
 * 
 * NOTA: Questo context garantisce che Google Maps venga caricato una sola volta
 * per evitare warning di elementi già definiti
 */

import React, { createContext, useContext, ReactNode, useEffect, useState, useRef } from 'react';
import { Libraries } from '@react-google-maps/api';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

// Librerie Google Maps da caricare - definite una sola volta a livello globale
const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'geometry', 'drawing'];

// Variabili globali per gestire il caricamento singleton
declare global {
  interface Window {
    googleMapsLoaded?: boolean;
    googleMapsLoading?: boolean;
    googleMapsLoadPromise?: Promise<void>;
    initGoogleMaps?: () => void;
  }
}

interface GoogleMapsContextValue {
  isLoaded: boolean;
  loadError?: Error;
  apiKeyConfigured: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({
  isLoaded: false,
  apiKeyConfigured: false,
});

interface GoogleMapsProviderProps {
  children: ReactNode;
}

// Funzione per caricare Google Maps in modo singleton
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  // Se è già caricato, ritorna subito
  if (window.google && window.google.maps) {
    window.googleMapsLoaded = true;
    return Promise.resolve();
  }

  // Se sta già caricando, ritorna la promise esistente
  if (window.googleMapsLoadPromise) {
    return window.googleMapsLoadPromise;
  }

  // Crea una nuova promise per il caricamento
  window.googleMapsLoading = true;
  window.googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
    // Cerca se esiste già uno script Google Maps
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        window.googleMapsLoaded = true;
        window.googleMapsLoading = false;
        resolve();
      });
      existingScript.addEventListener('error', () => {
        window.googleMapsLoading = false;
        reject(new Error('Failed to load Google Maps'));
      });
      return;
    }

    // Crea un nuovo script tag
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${GOOGLE_MAPS_LIBRARIES.join(',')}&language=it&region=IT`;
    script.async = true;
    script.defer = true;

    // Callback globale per quando Google Maps è caricato
    window.initGoogleMaps = () => {
      window.googleMapsLoaded = true;
      window.googleMapsLoading = false;
      // Rimuovi i console log in produzione
      if (process.env.NODE_ENV === 'development') {
        console.log('Google Maps loaded successfully');
      }
      resolve();
    };

    script.src += '&callback=initGoogleMaps';

    script.onerror = () => {
      window.googleMapsLoading = false;
      window.googleMapsLoadPromise = undefined;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return window.googleMapsLoadPromise;
}

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | undefined>();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const loadingRef = useRef(false);

  // Use environment variable as immediate fallback
  const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Controlla se Google Maps è già caricato all'avvio
  useEffect(() => {
    if (window.google && window.google.maps && !window.googleMapsLoading) {
      setIsScriptLoaded(true);
      window.googleMapsLoaded = true;
    }
  }, []);

  // Fetch the API key from backend
  const { data, isLoading: isLoadingConfig } = useQuery({
    queryKey: ['google-maps-config'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/maps/config');
        return response.data;
      } catch (err: any) {
        // Se è un errore 401, l'utente non è autenticato
        if (err.response?.status === 401) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('User not authenticated, using env API key fallback');
          }
          return null;
        }
        
        // Non mostrare log per ogni errore 404 in produzione
        if (process.env.NODE_ENV === 'development' && err.response?.status === 404) {
          console.warn('Google Maps API key not configured in database, using env fallback');
        }
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: false, // Non riprovare se fallisce
  });

  // Determina quale API key usare
  useEffect(() => {
    let key = null;
    
    if (data?.apiKey && data.apiKey !== 'AIza_your_google_maps_key_here') {
      key = data.apiKey;
    } else if (envApiKey && envApiKey !== 'AIza_your_google_maps_key_here') {
      key = envApiKey;
    }
    
    setApiKey(key);
  }, [data, envApiKey]);

  // Carica Google Maps quando abbiamo l'API key
  useEffect(() => {
    // Se è già caricato o sta caricando, non fare nulla
    if (window.googleMapsLoaded || window.googleMapsLoading || loadingRef.current) {
      if (window.googleMapsLoaded) {
        setIsScriptLoaded(true);
      }
      return;
    }

    // Se non abbiamo API key, non caricare
    if (!apiKey || apiKey === 'AIza_your_google_maps_key_here') {
      return;
    }

    // Evita caricamenti multipli
    loadingRef.current = true;

    // Carica lo script
    loadGoogleMapsScript(apiKey)
      .then(() => {
        setIsScriptLoaded(true);
        setLoadError(undefined);
      })
      .catch((error) => {
        console.error('Failed to load Google Maps:', error);
        setLoadError(error);
        loadingRef.current = false;
      });
  }, [apiKey]);

  // Stato di caricamento della configurazione
  if (isLoadingConfig) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, apiKeyConfigured: false }}>
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600 text-sm">Caricamento configurazione mappe...</span>
        </div>
      </GoogleMapsContext.Provider>
    );
  }

  // Se non c'è API key
  if (!apiKey || apiKey === 'AIza_your_google_maps_key_here') {
    return (
      <GoogleMapsContext.Provider value={{ 
        isLoaded: false, 
        loadError: new Error('API key not configured'),
        apiKeyConfigured: false 
      }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  // Provide the context value
  const contextValue: GoogleMapsContextValue = {
    isLoaded: isScriptLoaded,
    loadError,
    apiKeyConfigured: true,
  };

  return (
    <GoogleMapsContext.Provider value={contextValue}>
      {children}
    </GoogleMapsContext.Provider>
  );
}

export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps deve essere utilizzato all\'interno di GoogleMapsProvider');
  }
  return context;
}

// Componente di fallback per quando Google Maps non è disponibile
export function MapFallback({ address }: { address?: string }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
      <div className="text-yellow-600 mb-2">
        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <p className="text-yellow-800 font-medium mb-1">
        Mappa non disponibile
      </p>
      <p className="text-yellow-700 text-sm">
        La chiave API di Google Maps non è configurata.
      </p>
      {address && (
        <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
          <p className="text-gray-700 text-sm font-medium">Indirizzo:</p>
          <p className="text-gray-600 text-sm">{address}</p>
        </div>
      )}
      <a 
        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || '')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center mt-4 text-blue-600 hover:text-blue-700 text-sm"
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Apri in Google Maps
      </a>
    </div>
  );
}
