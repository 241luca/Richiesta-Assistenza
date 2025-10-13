/**
 * PlaceAutocomplete Component
 * Componente moderno per autocompletamento indirizzi Google Maps
 * Usa le NUOVE API (2025) - NO deprecation warnings
 * 
 * Based on @vis.gl/react-google-maps documentation
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

interface PlaceAutocompleteProps {
  value: string;
  onChange: (formattedAddress: string, placeResult?: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  className?: string;
}

export const PlaceAutocomplete: React.FC<PlaceAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Inizia a digitare un indirizzo...',
  label,
  error,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Carica libreria Places
  const placesLib = useMapsLibrary('places');
  const sessionTokenRef = useRef<any | null>(null);

  // Inizializza servizi quando la libreria è caricata
  useEffect(() => {
    if (!placesLib) return;
    sessionTokenRef.current = null;
  }, [placesLib]);

  // Sincronizza valore esterno con input
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch suggestions quando l'utente digita
  useEffect(() => {
    if (!placesLib || !inputValue || inputValue.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          // @ts-ignore
          sessionTokenRef.current = new placesLib.AutocompleteSessionToken();
        }
        const request: any = {
          input: inputValue,
          includedPrimaryTypes: ['address'],
          includedRegionCodes: ['it'],
          sessionToken: sessionTokenRef.current,
        };
        // @ts-ignore
        const result = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        const list = result?.suggestions || [];
        setSuggestions(list);
        if (document.activeElement === inputRef.current && list.length > 0) {
          setIsOpen(true);
        } else {
          setIsOpen(false);
        }
      } catch (e) {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, placesLib]);

  // Gestisce la selezione di un suggerimento
  const handleSelect = async (s: any) => {
    const p = s?.placePrediction;
    const main = p?.structuredFormat?.mainText
      || p?.text?.text
      || p?.text?.primaryText
      || s?.structured_formatting?.main_text
      || s?.description
      || '';
    setInputValue(main);
    setIsOpen(false);
    setSelectedIndex(-1);

    try {
      // @ts-ignore
      const placeWrapper = p?.toPlace?.();
      if (!placeWrapper) {
        onChange(main);
        sessionTokenRef.current = null;
        return;
      }
      // @ts-ignore
      const { place } = await placeWrapper.fetchFields({
        fields: ['formattedAddress', 'addressComponents', 'location', 'id']
      });
      const formatted = place.formattedAddress || main;
      const placeResult: any = {
        formatted_address: place.formattedAddress,
        address_components: place.addressComponents,
        geometry: place.location ? { location: place.location } : undefined,
        place_id: (place as any)?.id || p?.placeId,
      };
      onChange(formatted, placeResult);
      sessionTokenRef.current = null;
    } catch (e) {
      onChange(main);
      sessionTokenRef.current = null;
    }
  };

  // Gestisce input da tastiera
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Chiudi dropdown quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`
            w-full px-4 py-2 border rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${!placesLib ? 'bg-gray-100 cursor-wait' : ''}
          `}
          disabled={!placesLib}
        />

        {!placesLib && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((s, index) => {
            const p = s?.placePrediction;
            const main = p?.structuredFormat?.mainText
              || p?.text?.text
              || p?.text?.primaryText
              || s?.structured_formatting?.main_text
              || s?.description
              || '';
            const secondary = p?.structuredFormat?.secondaryText
              || p?.text?.secondaryText
              || s?.structured_formatting?.secondary_text
              || '';
            const key = p?.id || p?.placeId || s?.place_id || `${main}-${index}`;
            return (
            <button
              key={key}
              type="button"
              onClick={() => handleSelect(s)}
              className={`
                w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors
                ${index === selectedIndex ? 'bg-blue-100' : ''}
                ${index !== 0 ? 'border-t border-gray-100' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                <svg 
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {main}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {secondary}
                  </p>
                </div>
              </div>
            </button>
          );})}
        </div>
      )}
    </div>
  );
};

export default PlaceAutocomplete;
