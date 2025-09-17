/**
 * AddressAutocomplete Component
 * Autocompletamento indirizzi con Google Places
 */

import React, { useRef, useEffect, useState } from 'react';
import { StandaloneSearchBox } from '@react-google-maps/api';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';
import toast from 'react-hot-toast';

interface AddressAutocompleteProps {
  value?: string;
  onChange: (address: string, details?: AddressDetails) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  label?: string;
  helperText?: string;
}

export interface AddressDetails {
  formatted_address: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_2?: string; // Provincia
  administrative_area_level_1?: string; // Regione
  postal_code?: string;
  country?: string;
  lat?: number;
  lng?: number;
}

export function AddressAutocomplete({
  value = '',
  onChange,
  placeholder = 'Inserisci un indirizzo...',
  required = false,
  disabled = false,
  error,
  className = '',
  label,
  helperText,
}: AddressAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const onLoad = (ref: google.maps.places.SearchBox) => {
    searchBoxRef.current = ref;
  };

  const onPlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces();
    
    if (!places || places.length === 0) {
      toast.error('Nessun indirizzo trovato');
      return;
    }

    const place = places[0];
    
    if (!place.geometry || !place.geometry.location) {
      toast.error('Indirizzo non valido');
      return;
    }

    // Estrai i componenti dell'indirizzo
    const addressComponents = place.address_components || [];
    const details: AddressDetails = {
      formatted_address: place.formatted_address || '',
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    };

    // Mappa i componenti dell'indirizzo
    addressComponents.forEach((component) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        details.street_number = component.long_name;
      }
      if (types.includes('route')) {
        details.route = component.long_name;
      }
      if (types.includes('locality')) {
        details.locality = component.long_name;
      }
      if (types.includes('administrative_area_level_2')) {
        details.administrative_area_level_2 = component.short_name; // Sigla provincia
      }
      if (types.includes('administrative_area_level_1')) {
        details.administrative_area_level_1 = component.long_name; // Regione
      }
      if (types.includes('postal_code')) {
        details.postal_code = component.long_name;
      }
      if (types.includes('country')) {
        details.country = component.short_name;
      }
    });

    // Verifica che sia un indirizzo italiano
    if (details.country !== 'IT') {
      toast.error('Seleziona un indirizzo italiano');
      return;
    }

    // Costruisci l'indirizzo per il campo
    const streetAddress = details.street_number 
      ? `${details.route} ${details.street_number}`
      : details.route || '';

    // Se manca il CAP, prova a recuperarlo con una chiamata geocoding aggiuntiva
    if (!details.postal_code && details.lat && details.lng) {
      // Usa geocoding inverso per ottenere il CAP dalla posizione
      fetch(`/api/maps/geocode?address=${encodeURIComponent(details.formatted_address || streetAddress)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.components?.postalCode) {
            details.postal_code = data.components.postalCode;
          }
          setInputValue(streetAddress);
          onChange(streetAddress, details);
        })
        .catch(err => {
          console.error('Errore nel recupero del CAP:', err);
          setInputValue(streetAddress);
          onChange(streetAddress, details);
        });
    } else {
      setInputValue(streetAddress);
      onChange(streetAddress, details);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Se l'utente cancella tutto, notifica il parent
    if (newValue === '') {
      onChange('');
    }
  };

  // Se Google Maps non è caricato, usa un input normale
  if (!isLoaded) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`
              w-full px-3 py-2 pl-10 border rounded-md
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
          />
          <MapPinIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
        {error && (
          <p className="mt-1 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <StandaloneSearchBox
        onLoad={onLoad}
        onPlacesChanged={onPlacesChanged}
        options={{
          componentRestrictions: { country: 'it' }, // Solo indirizzi italiani
          types: ['address'], // Solo indirizzi, non luoghi generici
        }}
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className={`
              w-full px-3 py-2 pl-10 border rounded-md
              ${error ? 'border-red-500' : 'border-gray-300'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              focus:outline-none focus:ring-2 focus:ring-blue-500
            `}
          />
          <MapPinIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </StandaloneSearchBox>
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}