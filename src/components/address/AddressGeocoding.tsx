/**
 * AddressGeocoding Component
 * Componente per geolocalizzazione indirizzi usando Geocoding API
 * Alternativa a Places API che è deprecata
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPinIcon, CheckCircleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useLoadScript } from '@react-google-maps/api';
import toast from 'react-hot-toast';
import { api } from '../../services/api';

const libraries: ("places" | "geocoding")[] = ["geocoding"];

interface AddressGeocodingProps {
  value: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  onChange: (addressData: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  errors?: {
    address?: { message?: string };
    city?: { message?: string };
    province?: { message?: string };
    postalCode?: { message?: string };
  };
}

export default function AddressGeocoding({ value, onChange, errors }: AddressGeocodingProps) {
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'it',
    region: 'IT',
  });

  // Funzione per cercare indirizzi usando il nostro backend
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    try {
      // Costruisci la query completa
      const fullQuery = `${query}, ${value.city || ''} ${value.province || ''} ${value.postalCode || ''} Italia`.trim();
      
      const response = await api.get('/maps/geocode', { 
        params: { address: fullQuery }
      });

      if (response.data.success) {
        // Crea dei suggerimenti dall'indirizzo trovato
        const suggestion = {
          formatted_address: response.data.formatted_address || response.data.formattedAddress,
          address_components: [],
          location: response.data.location || { 
            lat: response.data.latitude, 
            lng: response.data.longitude 
          },
          components: response.data.components
        };
        
        setSuggestions([suggestion]);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Errore nella ricerca indirizzo:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounce della ricerca
  const handleAddressChange = (newAddress: string) => {
    onChange({ ...value, address: newAddress });
    
    // Cancella il timeout precedente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Imposta un nuovo timeout per la ricerca
    searchTimeoutRef.current = setTimeout(() => {
      searchAddress(newAddress);
    }, 500);
  };

  // Seleziona un indirizzo dai suggerimenti
  const selectAddress = (suggestion: any) => {
    const components = suggestion.components || {};
    
    // Estrai l'indirizzo dalla stringa formattata
    let streetAddress = value.address;
    if (suggestion.formatted_address) {
      // Prova a estrarre solo la parte dell'indirizzo (prima virgola)
      const parts = suggestion.formatted_address.split(',');
      if (parts.length > 0) {
        streetAddress = parts[0].trim();
      }
    }

    // Aggiorna tutti i campi
    onChange({
      address: streetAddress,
      city: components.city || components.locality || value.city,
      province: (components.province || components.administrative_area_level_2 || value.province).substring(0, 2).toUpperCase(),
      postalCode: components.postalCode || components.postal_code || value.postalCode,
      latitude: suggestion.location?.lat,
      longitude: suggestion.location?.lng,
    });

    setCoordinates(suggestion.location ? {
      lat: suggestion.location.lat,
      lng: suggestion.location.lng
    } : null);
    
    setIsAddressVerified(true);
    setShowSuggestions(false);
    setShowMap(true);
    
    toast.success('Indirizzo verificato e geolocalizzato!', {
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    });
  };

  // Geocodifica l'indirizzo completo
  const geocodeFullAddress = async () => {
    const fullAddress = `${value.address}, ${value.city}, ${value.province} ${value.postalCode}, Italia`;
    
    setIsSearching(true);
    try {
      const response = await api.get('/maps/geocode', { 
        params: { address: fullAddress }
      });

      if (response.data.success) {
        const location = response.data.location || { 
          lat: response.data.latitude, 
          lng: response.data.longitude 
        };
        
        // Aggiorna con le coordinate trovate
        onChange({
          ...value,
          latitude: location.lat,
          longitude: location.lng,
        });
        
        setCoordinates(location);
        setIsAddressVerified(true);
        setShowMap(true);
        
        toast.success('Indirizzo verificato e geolocalizzato!');
      } else {
        toast.error('Impossibile verificare l\'indirizzo. Controlla i dati inseriti.');
      }
    } catch (error) {
      console.error('Errore geocoding:', error);
      toast.error('Errore nella verifica dell\'indirizzo');
    } finally {
      setIsSearching(false);
    }
  };

  // Mini map component
  const MiniMap = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
      if (isLoaded && mapRef.current && coordinates && !map) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: coordinates,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
        });

        new google.maps.Marker({
          position: coordinates,
          map: mapInstance,
          title: 'Indirizzo intervento',
        });

        setMap(mapInstance);
      }
    }, [isLoaded, coordinates, map]);

    return (
      <div className="mt-4 border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-green-50 px-4 py-2 border-b border-green-200">
          <p className="text-sm text-green-800 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Indirizzo verificato - Posizione: {coordinates?.lat.toFixed(6)}, {coordinates?.lng.toFixed(6)}
          </p>
        </div>
        <div ref={mapRef} className="h-48 w-full" />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Campo indirizzo con ricerca */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Indirizzo * 
          {isAddressVerified && (
            <span className="ml-2 text-green-600">
              <CheckCircleIcon className="h-4 w-4 inline" />
              Verificato
            </span>
          )}
        </label>
        <div className="mt-1 relative">
          <input
            type="text"
            id="address"
            value={value.address}
            onChange={(e) => handleAddressChange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10 pr-10"
            placeholder="Es: Via Roma, 10 oppure Corso Italia, 25"
          />
          <MapPinIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        
        {/* Suggerimenti */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
                onClick={() => selectAddress(suggestion)}
              >
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="block truncate">
                    {suggestion.formatted_address || suggestion.formattedAddress}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {errors?.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          <strong>Formato corretto:</strong> Via/Corso/Piazza [Nome], [Numero Civico]. 
          Esempio: "Via Garibaldi, 15" o "Piazza Duomo, 1"
        </p>
      </div>

      {/* Altri campi */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Città *
          </label>
          <input
            type="text"
            id="city"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Es: Milano, Roma, Napoli"
          />
          {errors?.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700">
            Provincia *
          </label>
          <input
            type="text"
            id="province"
            value={value.province}
            onChange={(e) => onChange({ ...value, province: e.target.value.toUpperCase() })}
            maxLength={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase"
            placeholder="Es: MI, RM, NA (2 lettere)"
          />
          {errors?.province && (
            <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            CAP *
          </label>
          <input
            type="text"
            id="postalCode"
            value={value.postalCode}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            maxLength={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Es: 20121 (5 cifre)"
          />
          {errors?.postalCode && (
            <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      {/* Pulsante per verificare l'indirizzo */}
      {!isAddressVerified && value.address && value.city && value.province && value.postalCode && (
        <div>
          <button
            type="button"
            onClick={geocodeFullAddress}
            disabled={isSearching}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            {isSearching ? 'Verifica in corso...' : 'Verifica e Geolocalizza Indirizzo'}
          </button>
        </div>
      )}

      {/* Mostra la mappa se l'indirizzo è verificato */}
      {isAddressVerified && showMap && coordinates && isLoaded && <MiniMap />}
    </div>
  );
}