import { useState } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';

interface AddressAutocompleteSimpleProps {
  onAddressSelect: (address: any) => void;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
  id?: string;
}

/**
 * Versione semplificata di AddressAutocomplete che funziona senza Google Maps
 * Permette inserimento manuale degli indirizzi
 */
export function AddressAutocompleteSimple({
  onAddressSelect,
  defaultValue = '',
  placeholder = 'Es: Via Roma 1',
  required = false,
  error,
  label = 'Indirizzo',
  id = 'address-simple'
}: AddressAutocompleteSimpleProps) {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    
    // Simula la struttura dati che verrebbe da Google Maps
    // L'utente dovrà inserire manualmente gli altri campi
    onAddressSelect({
      street: newValue,
      city: '',
      province: '',
      postalCode: '',
      latitude: null,
      longitude: null
    });
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
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
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
      
      <p className="text-xs text-amber-600">
        ⚠️ Inserimento manuale - Completa tutti i campi sottostanti
      </p>
    </div>
  );
}
