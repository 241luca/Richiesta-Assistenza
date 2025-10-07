/**
 * 🗺️ ADVANCED ADDRESS AUTOCOMPLETE
 * Componente moderno con @vis.gl/react-google-maps
 * Versione: 2.0 - Nessun conflitto, performance ottimali
 * 
 * Data: 3 Ottobre 2025
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

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
  types?: string[];
  componentRestrictions?: { country: string | string[] };
}

/**
 * Componente Autocomplete Avanzato con Google Maps Places API
 * Usa @vis.gl/react-google-maps (nessun conflitto)
 */
export default function AdvancedAddressAutocomplete({
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
  types = ['address'],
  componentRestrictions = { country: 'it' }
}: AdvancedAddressAutocompleteProps) {
  
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Carica Places library
  const placesLib = useMapsLibrary('places');
  const [autocompleteService, setAutocompleteService] = useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  // Inizializza servizi
  useEffect(() => {
    if (!placesLib) return;

    setAutocompleteService(new placesLib.AutocompleteService());
    
    // PlacesService richiede un elemento DOM (usiamo un div nascosto)
    const div = document.createElement('div');
    setPlacesService(new placesLib.PlacesService(div));
  }, [placesLib]);

  // Sincronizza con value prop
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  // Fetch predictions
  const fetchPredictions = useCallback(async (input: string) => {
    if (!autocompleteService || !input || input.length < 3) {
      setPredictions([]);
      return;
    }

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input,
        types,
        componentRestrictions
      };

      autocompleteService.getPlacePredictions(request, (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          setPredictions(predictions);
          setShowDropdown(true);
        } else {
          setPredictions([]);
        }
      });
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    }
  }, [autocompleteService, types, componentRestrictions]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    if (newValue.length >= 3) {
      fetchPredictions(newValue);
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
    
    setSelectedIndex(-1);
  };

  // Handle place selection
  const handlePlaceSelect = useCallback((prediction: google.maps.places.AutocompletePrediction) => {
    if (!placesService) return;

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: prediction.place_id,
      fields: ['formatted_address', 'address_components', 'geometry', 'place_id']
    };

    placesService.getDetails(request, (place, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && place) {
        const formatted = place.formatted_address || prediction.description;
        
        setInputValue(formatted);
        onChange(formatted, place as AddressDetails);
        
        if (onPlaceSelect) {
          onPlaceSelect(place as AddressDetails);
        }
        
        setShowDropdown(false);
        setPredictions([]);
      }
    });
  }, [placesService, onChange, onPlaceSelect]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || predictions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < predictions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && predictions[selectedIndex]) {
          handlePlaceSelect(predictions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setPredictions([]);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false);
      setSelectedIndex(-1);
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showDropdown]);

  return (
    <div className={`space-y-1 ${className}`} onClick={e => e.stopPropagation()}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type="text"
          name={name}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (predictions.length > 0) setShowDropdown(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete="off"
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${inputClassName}
          `}
        />
        
        {/* Loading indicator */}
        {inputValue.length >= 3 && predictions.length === 0 && !error && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Dropdown con predictions */}
        {showDropdown && predictions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            {predictions.map((prediction, index) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handlePlaceSelect(prediction)}
                className={`
                  w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors
                  ${index === selectedIndex ? 'bg-blue-100' : ''}
                  ${index !== predictions.length - 1 ? 'border-b border-gray-100' : ''}
                `}
              >
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {prediction.structured_formatting.main_text}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <p className="text-xs text-gray-500 flex items-center space-x-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Digita almeno 3 caratteri per vedere i suggerimenti Google</span>
      </p>
    </div>
  );
}

// Export hooks fittizi per compatibilità con vecchi componenti
export const useGoogleMapsLoader = () => ({ isLoaded: true, loadError: null });
export const useLoadScript = () => ({ isLoaded: true, loadError: undefined });

// Export anche come named
export { AdvancedAddressAutocomplete };
