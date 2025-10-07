/**
 * 🗺️ GOOGLE MAPS CONTEXT - Sistema Modernizzato v5.2
 * 
 * Basato su @vis.gl/react-google-maps (documentazione ufficiale)
 * Data: 2 Ottobre 2025
 * 
 * Questo context wrappa APIProvider e gestisce:
 * - Caricamento API key dal backend
 * - Stato di loading
 * - Gestione errori
 * - Configurazione globale
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { APIProvider, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import api from '../services/api';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
  apiKey: string | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
  apiKey: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

/**
 * Component interno che monitora lo stato di caricamento dell'API
 * Usa useApiLoadingStatus hook da @vis.gl/react-google-maps
 */
function LoadingStatusMonitor({ onStatusChange }: { onStatusChange: (status: APILoadingStatus) => void }) {
  const status = useApiLoadingStatus();
  
  useEffect(() => {
    onStatusChange(status);
    
    if (status === APILoadingStatus.FAILED) {
      console.error('❌ Google Maps API failed to load');
    } else if (status === APILoadingStatus.LOADED) {
      console.log('✅ Google Maps API loaded successfully');
    }
  }, [status, onStatusChange]);

  return null;
}

/**
 * Provider principale che gestisce il caricamento della chiave API
 * e wrappa i children con APIProvider
 */
export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carica la chiave API dal backend
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('🔑 Caricamento API key dal backend...');
        const response = await api.get('/maps/config');
        
        if (response.data?.data?.apiKey) {
          setApiKey(response.data.data.apiKey);
          console.log('✅ API Key caricata dal backend');
        } else {
          throw new Error('API key non trovata nella risposta del server');
        }
      } catch (error) {
        console.error('❌ Errore caricamento API key:', error);
        setLoadError(error instanceof Error ? error : new Error('Failed to load API key'));
      }
    };

    fetchApiKey();
  }, []);

  const handleStatusChange = (status: APILoadingStatus) => {
    setIsLoaded(status === APILoadingStatus.LOADED);
    if (status === APILoadingStatus.FAILED) {
      setLoadError(new Error('Google Maps API failed to load'));
    }
  };

  // 🆕 Se non abbiamo ancora la chiave O c'è errore, NON rendere nulla
  // Questo previene che APIProvider sia montato senza chiave
  if (!apiKey) {
    if (loadError) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-center max-w-md">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Errore caricamento Google Maps
            </h2>
            <p className="text-gray-600 mb-4">
              {loadError.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Ricarica pagina
            </button>
          </div>
        </div>
      );
    }
    
    // Loading
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento Google Maps...</p>
        </div>
      </div>
    );
  }

  // Render con APIProvider (pattern ufficiale @vis.gl/react-google-maps)
  // 🆕 Usa key prop per forzare remount quando apiKey cambia
  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, apiKey }}>
      <APIProvider 
        apiKey={apiKey!} 
        key={apiKey}
        onLoad={() => console.log('✅ APIProvider mounted with key:', apiKey?.substring(0, 20) + '...')}
      >
        <LoadingStatusMonitor onStatusChange={handleStatusChange} />
        {children}
      </APIProvider>
    </GoogleMapsContext.Provider>
  );
}

/**
 * Hook per verificare se l'API è caricata
 * Usa il context invece di useApiIsLoaded per compatibilità
 */
export function useGoogleMapsLoaded(): boolean {
  const { isLoaded } = useGoogleMaps();
  return isLoaded;
}
