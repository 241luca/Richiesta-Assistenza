import { useEffect, useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { useGoogleMaps } from '../../contexts/GoogleMapsContext';

interface AddressAutocompleteProps {
  onAddressSelect: (address: any) => void;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
  id?: string;
}

/**
 * Componente intelligente per l'autocompletamento degli indirizzi
 * Usa Google Maps quando disponibile, altrimenti fallback a input manuale
 */
export function AddressAutocomplete({
  onAddressSelect,
  defaultValue = '',
  placeholder = 'Inizia a digitare un indirizzo...',
  required = false,
  error,
  label = 'Indirizzo',
  id = 'address-autocomplete'
}: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [value, setValue] = useState(defaultValue);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [inputRef, setInputRef] = useState<HTMLInputElement | null>(null);

  useEffect(() => {
    // Se Google Maps non è caricato o c'è un errore, usa il fallback
    if (!isLoaded || loadError || !inputRef) {
      return;
    }

    // Verifica che Places sia disponibile
    if (!window.google?.maps?.places?.Autocomplete) {
      console.warn('Google Places Autocomplete non disponibile');
      return;
    }

    try {
      // Crea l'autocomplete
      const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef, {
        types: ['address'],
        componentRestrictions: { country: 'it' },
        fields: ['address_components', 'geometry', 'formatted_address']
      });

      // Gestisci la selezione
      autocompleteInstance.addListener('place_changed', () => {
        const place = autocompleteInstance.getPlace();
        
        if (!place.address_components) {
          console.warn('Nessun dettaglio disponibile per questo indirizzo');
          return;
        }

        // Estrai i componenti dell'indirizzo
        const components = place.address_components;
        const getComponent = (type: string) => {
          const component = components.find(c => c.types.includes(type));
          return component?.long_name || '';
        };

        const address = {
          street: `${getComponent('route')} ${getComponent('street_number')}`.trim(),
          city: getComponent('locality'),
          province: getComponent('administrative_area_level_2'),
          postalCode: getComponent('postal_code'),
          latitude: place.geometry?.location?.lat() || null,
          longitude: place.geometry?.location?.lng() || null,
          formatted: place.formatted_address || ''
        };

        setValue(place.formatted_address || '');
        onAddressSelect(address);
      });

      setAutocomplete(autocompleteInstance);
    } catch (err) {
      console.error('Errore inizializzazione autocomplete:', err);
    }

    return () => {
      // Cleanup
      if (autocomplete) {
        window.google.maps.event.clearInstanceListeners(autocomplete);
      }
    };
  }, [isLoaded, loadError, inputRef]);

  // Gestione input manuale (fallback)
  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Se non c'è Google Maps, fornisci una struttura base
    if (!isLoaded || loadError) {
      onAddressSelect({
        street: newValue,
        city: '',
        province: '',
        postalCode: '',
        latitude: null,
        longitude: null,
        formatted: newValue
      });
    }
  };

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
          ref={setInputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleManualChange}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-3 py-2 
            border ${error ? 'border-red-300' : 'border-gray-300'}
            rounded-md shadow-sm 
            focus:ring-blue-500 focus:border-blue-500 
            sm:text-sm
          `}
          required={required}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      {/* Messaggio di stato */}
      {loadError && (
        <p className="text-xs text-amber-600">
          ⚠️ Google Maps non disponibile - Inserimento manuale attivo
        </p>
      )}
      
      {!isLoaded && !loadError && (
        <p className="text-xs text-gray-500">
          Caricamento Google Maps...
        </p>
      )}
    </div>
  );
}
