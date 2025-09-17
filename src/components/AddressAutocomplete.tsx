import React, { useRef, useEffect, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (addressComponents: AddressComponents) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  error?: string;
}

interface AddressComponents {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
}

export function AddressAutocomplete({
  value,
  onChange,
  onAddressSelect,
  placeholder = "Inizia a digitare l'indirizzo...",
  className = "",
  label,
  required = false,
  error
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Verifica se Google Maps è caricato
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn('Google Maps API non ancora caricata');
      return;
    }

    if (!inputRef.current || autocompleteRef.current) return;

    // Inizializza autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'it' }, // Solo Italia
      fields: ['address_components', 'geometry', 'formatted_address'],
      types: ['address'] // Solo indirizzi
    });

    // Listener per selezione indirizzo
    const listener = autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      
      if (!place || !place.address_components) return;

      // Estrai componenti indirizzo
      const components: AddressComponents = {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'Italia',
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng()
      };

      // Parse componenti
      place.address_components.forEach((component) => {
        const types = component.types;

        if (types.includes('route')) {
          components.street = component.long_name;
        }
        if (types.includes('street_number')) {
          components.street = `${components.street} ${component.long_name}`.trim();
        }
        if (types.includes('locality')) {
          components.city = component.long_name;
        }
        if (types.includes('administrative_area_level_2')) {
          components.province = component.short_name;
        }
        if (types.includes('postal_code')) {
          components.postalCode = component.long_name;
        }
      });

      // Aggiorna valore input
      if (place.formatted_address) {
        onChange(place.formatted_address);
      }

      // Callback con componenti parsati
      if (onAddressSelect) {
        onAddressSelect(components);
      }
    });

    setIsLoaded(true);

    // Cleanup
    return () => {
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, []);

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPinIcon className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`
            pl-10 pr-3 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${className}
          `}
        />
      </div>

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}

      {!isLoaded && (
        <p className="mt-1 text-xs text-gray-500">
          Caricamento autocompletamento...
        </p>
      )}
    </div>
  );
}

// Hook per caricare Google Maps API
export function useGoogleMapsLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Se già caricato
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Carica script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&language=it&region=IT`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsLoaded(true);
    };
    
    script.onerror = () => {
      setError('Errore caricamento Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup se necessario
    };
  }, []);

  return { isLoaded, error };
}
