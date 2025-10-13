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

  // Carica la chiave API esclusivamente dal backend (DB-only, nessun fallback ENV)
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        console.log('🔑 Caricamento API key dal backend...');
        const response = await api.get('/maps/config');
        
        if (response.data?.data?.apiKey) {
          const rawKey: string = response.data.data.apiKey;
          const normalizedKey = rawKey.trim();

          const preview = normalizedKey.slice(0, 8);
          console.log(`✅ API Key caricata (preview: ${preview}****)`);

          setApiKey(normalizedKey);
        } else {
          throw new Error('API key non trovata');
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

  // Se non abbiamo la chiave, non blocchiamo l'app: rendiamo i children senza APIProvider
  if (!apiKey) {
    return (
      <GoogleMapsContext.Provider value={{ isLoaded: false, loadError, apiKey }}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  // Render con APIProvider (pattern ufficiale @vis.gl/react-google-maps)
  // 🆕 Usa key prop per forzare remount quando apiKey cambia
  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError, apiKey }}>
      <APIProvider 
        apiKey={apiKey!} 
        key={apiKey}
        // Context7 docs recommend setting authReferrerPolicy to 'origin' when
        // the API key uses HTTP referrer restrictions (subdomains/ports).
        authReferrerPolicy="origin"
        // Preload commonly used libraries to avoid late load errors
        libraries={["places", "marker"]}
        onLoad={() => {
          const preview = apiKey?.slice(0, 8) || '';
          console.log(`✅ APIProvider montato (key preview: ${preview}****)`);
        }}
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
