import React, { createContext, useContext, useEffect, useState } from 'react';

interface GoogleMapsContextType {
  isLoaded: boolean;
  apiKeyConfigured: boolean;
  loadError: Error | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  apiKeyConfigured: false,
  loadError: null,
});

export const useGoogleMaps = () => useContext(GoogleMapsContext);

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

// Variabile globale per tenere traccia del caricamento
let googleMapsPromise: Promise<void> | null = null;

export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);
  
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const apiKeyConfigured = !!apiKey && apiKey !== 'your_api_key_here';

  useEffect(() => {
    if (!apiKeyConfigured) {
      console.warn('Google Maps API key non configurata');
      return;
    }

    // Controlla se Google Maps è già completamente caricato
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Se già in caricamento, aspetta la promise esistente
    if (googleMapsPromise) {
      googleMapsPromise
        .then(() => setIsLoaded(true))
        .catch((err) => setLoadError(err));
      return;
    }

    // Controlla se lo script è già presente nel DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Aspetta che le librerie siano completamente caricate
      const checkGoogleMaps = setInterval(() => {
        if (window.google?.maps?.places) {
          clearInterval(checkGoogleMaps);
          setIsLoaded(true);
        }
      }, 100);
      
      // Timeout dopo 10 secondi
      setTimeout(() => {
        clearInterval(checkGoogleMaps);
        if (!window.google?.maps?.places) {
          setLoadError(new Error('Timeout loading Google Maps libraries'));
        }
      }, 10000);
      return;
    }

    // Crea una nuova promise per il caricamento
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=it&region=IT&loading=async`;
      script.async = true;
      script.defer = true;
      script.id = 'google-maps-script';

      script.addEventListener('load', () => {
        // Aspetta che le librerie siano completamente caricate
        const checkLibraries = setInterval(() => {
          if (window.google?.maps?.places) {
            clearInterval(checkLibraries);
            console.log('Google Maps e Places library caricate con successo');
            resolve();
          }
        }, 100);
        
        // Timeout dopo 5 secondi dal caricamento dello script
        setTimeout(() => {
          clearInterval(checkLibraries);
          if (!window.google?.maps?.places) {
            reject(new Error('Places library non disponibile'));
          }
        }, 5000);
      });

      script.addEventListener('error', () => {
        const error = new Error('Errore nel caricamento di Google Maps');
        console.error('Errore nel caricamento di Google Maps');
        reject(error);
      });

      document.head.appendChild(script);
    });

    googleMapsPromise
      .then(() => setIsLoaded(true))
      .catch((err) => {
        setLoadError(err);
        googleMapsPromise = null; // Reset per permettere retry
      });

    return () => {
      // Cleanup se necessario
    };
  }, [apiKey, apiKeyConfigured]);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, apiKeyConfigured, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
