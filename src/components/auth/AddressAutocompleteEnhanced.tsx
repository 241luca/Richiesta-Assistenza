import { useEffect, useRef, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';

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
  className?: string;
}

export function AddressAutocomplete({
  onAddressSelect,
  defaultValue = '',
  placeholder = 'Via, numero civico, città...',
  required = false,
  error,
  label = 'Indirizzo',
  id = 'address-autocomplete',
  className = ''
}: AddressAutocompleteProps) {
  const [value, setValue] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded, apiKeyConfigured } = useGoogleMaps();
  
  // Aggiorna il valore quando cambia defaultValue
  useEffect(() => {
    if (defaultValue && defaultValue !== value) {
      setValue(defaultValue);
    }
  }, [defaultValue]);

  useEffect(() => {
    // Se Google Maps non è caricato, non fare nulla
    if (!isLoaded || !apiKeyConfigured) {
      return;
    }

    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn('Google Maps Places API non disponibile');
      return;
    }

    if (!inputRef.current) return;

    // Configura l'autocomplete per l'Italia
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'it' },
      fields: ['address_components', 'formatted_address', 'geometry', 'name'],
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

      let streetNumber = '';
      let route = '';

      // Mappa i componenti di Google
      place.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        }
        if (types.includes('route')) {
          route = component.long_name;
        }
        if (types.includes('locality')) {
          addressData.city = component.long_name;
        }
        if (types.includes('administrative_area_level_3')) {
          // Alcuni comuni italiani usano questo livello
          if (!addressData.city) {
            addressData.city = component.long_name;
          }
        }
        if (types.includes('administrative_area_level_2')) {
          // Provincia
          addressData.province = component.short_name.toUpperCase();
        }
        if (types.includes('postal_code')) {
          addressData.postalCode = component.long_name;
        }
      });

      // Combina via e numero civico nell'ordine italiano
      addressData.street = route;
      if (streetNumber) {
        addressData.street = `${route}, ${streetNumber}`;
      }

      // Formatta l'indirizzo per la visualizzazione
      const formattedAddress = `${addressData.street}, ${addressData.city} ${addressData.province}`;
      setValue(formattedAddress);
      
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

  // Gestione manuale dell'input quando Google Maps non è disponibile
  const handleManualInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    
    // Se Google Maps non è disponibile, permetti l'input manuale
    if (!isLoaded || !apiKeyConfigured) {
      // Prova a estrarre informazioni base dall'input manuale
      const parts = e.target.value.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        onAddressSelect({
          street: parts[0] || '',
          city: parts[1] || '',
          province: '',
          postalCode: '',
          country: 'IT'
        });
      }
    }
  };

  return (
    <div className={`space-y-1 ${className}`}>
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
          onChange={handleManualInput}
          placeholder={placeholder}
          required={required}
          className={`
            block w-full pl-10 pr-3 py-3 border rounded-lg shadow-sm
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
            transition-all duration-200
            ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            ${isLoading ? 'bg-gray-50' : 'bg-white'}
          `}
          disabled={isLoading}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
      
      {!apiKeyConfigured ? (
        <p className="text-xs text-amber-600 mt-1">
          ⚠️ Autocompletamento non disponibile - Inserisci l'indirizzo manualmente
        </p>
      ) : isLoaded ? (
        <p className="text-xs text-gray-500 mt-1">
          💡 Inizia a digitare per vedere i suggerimenti
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1">
          Caricamento autocompletamento...
        </p>
      )}
    </div>
  );
}
