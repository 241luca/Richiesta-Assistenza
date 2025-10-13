import React from 'react';
import { PlaceAutocomplete } from './PlaceAutocomplete';

interface AddressDetails {
  formatted_address: string;
  address_components: google.maps.GeocoderAddressComponent[];
  geometry?: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
  place_id?: string;
}

interface AdvancedAddressAutocompleteProps {
  value?: string;
  onChange: (value: string, details?: AddressDetails) => void;
  onPlaceSelect?: (place: AddressDetails) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  name?: string;
}

/**
 * Compat wrapper che espone la stessa interfaccia dei componenti AddressAutocomplete
 * ma utilizza la nuova API `PlaceAutocomplete` (senza warning di deprecazione).
 * Non tocca i componenti esistenti: può essere adottato pagina per pagina.
 */
export default function PlaceAutocompleteCompat({
  value = '',
  onChange,
  onPlaceSelect,
  placeholder = 'Inserisci indirizzo completo',
  label,
  required = false,
  error,
  className = '',
  inputClassName = '',
  disabled = false,
  name,
}: AdvancedAddressAutocompleteProps) {
  return (
    <PlaceAutocomplete
      value={value}
      placeholder={placeholder}
      label={label}
      error={error}
      className={className}
      onChange={(formatted, placeResult) => {
        // Propaga compatibilmente con l'interfaccia legacy
        if (!placeResult) {
          onChange(formatted);
          return;
        }

        const loc = (placeResult as any)?.geometry?.location;
        const details: AddressDetails = {
          formatted_address: placeResult.formatted_address || formatted,
          address_components: (placeResult.address_components || []) as any,
          geometry: loc
            ? {
                location: {
                  lat: () => (typeof (loc as any).lat === 'function' ? (loc as any).lat() : (loc as any).lat),
                  lng: () => (typeof (loc as any).lng === 'function' ? (loc as any).lng() : (loc as any).lng),
                },
              }
            : undefined,
          place_id: (placeResult as any).place_id,
        };

        onChange(formatted, details);
        if (onPlaceSelect) onPlaceSelect(details);
      }}
    />
  );
}