import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
// import { useGoogleMaps } from '../../contexts/GoogleMapsContext'; // TEMPORANEAMENTE DISABILITATO

interface AddressData {
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: AddressData) => void;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
  id?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  defaultValue = '',
  placeholder = 'Inizia a digitare l\'indirizzo...',
  required = false,
  error,
  label = 'Indirizzo',
  id = 'address-autocomplete'
}: AddressAutocompleteProps) {
  const [value, setValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  // const { isLoaded, apiKeyConfigured } = useGoogleMaps(); // TEMPORANEAMENTE DISABILITATO
  const isLoaded = false; // Temporaneamente disabilitato
  const apiKeyConfigured = false; // Temporaneamente disabilitato

  useEffect(() => {
    // Verifica che Google Maps sia caricato e configurato
    if (!isLoaded || !apiKeyConfigured) {
      console.warn('Google Maps non è ancora pronto');
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn('Google Maps API non disponibile');
      return;
    }

    if (!inputRef.current) return;

    // Configura l'autocomplete
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'it' }, // Solo Italia
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address']
    });

    autocompleteRef.current = autocomplete;

    // Gestisci la selezione dell'indirizzo
    const handlePlaceSelect = () => {
      const place = autocomplete.getPlace();
      
      if (!place.address_components) {
        console.warn('Nessun dettaglio disponibile per questo indirizzo');
        return;
      }

      // Estrai i componenti dell'indirizzo
      const addressData: AddressData = {
        street: '',
        city: '',
        province: '',
        postalCode: '',
        country: 'IT',
        latitude: place.geometry?.location?.lat(),
        longitude: place.geometry?.location?.lng()
      };

      // Mappa i componenti di Google
      place.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          addressData.street = component.long_name + ' ' + addressData.street;
        }
        if (types.includes('route')) {
          addressData.street = addressData.street + component.long_name;
        }
        if (types.includes('locality')) {
          addressData.city = component.long_name;
        }
        if (types.includes('administrative_area_level_2')) {
          addressData.province = component.short_name;
        }
        if (types.includes('postal_code')) {
          addressData.postalCode = component.long_name;
        }
      });

      // Pulisci l'indirizzo
      addressData.street = addressData.street.trim();

      // Aggiorna il valore dell'input
      setValue(place.formatted_address || '');
      
      // Notifica il componente padre
      onAddressSelect(addressData);
    };

    autocomplete.addListener('place_changed', handlePlaceSelect);

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onAddressSelect, isLoaded, apiKeyConfigured]);

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
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
          id={id}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`
            block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm
            focus:ring-blue-500 focus:border-blue-500 sm:text-sm
            ${error ? 'border-red-300' : 'border-gray-300'}
            ${isLoading ? 'bg-gray-50' : 'bg-white'}
          `}
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {!apiKeyConfigured ? (
        <p className="text-xs text-amber-600">
          ⚠️ Google Maps non configurato - Inserire l'indirizzo manualmente
        </p>
      ) : (
        <p className="text-xs text-gray-500">
          Inizia a digitare e seleziona l'indirizzo dal menu a tendina
        </p>
      )}
    </div>
  );
}
