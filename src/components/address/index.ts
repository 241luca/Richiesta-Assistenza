/**
 * Address Components - Export index
 * 
 * 🆕 v5.1: Export centralizzato per componenti address con Geo Auto-Detect
 */

// Componenti di geolocalizzazione
export { default as LocationDetector, LocationButton, useLocationDetector } from './LocationDetector';
export { default as AddressFormWithGeolocation, SimpleAddressWithGeo } from './AddressFormWithGeolocation';

// Componenti esistenti
export { default as AddressGeocoding } from './AddressGeocoding';
export { default as PlaceAutocomplete } from './PlaceAutocomplete';
export { default as WorkAddressForm } from './WorkAddressForm';

// Hook di geolocalizzazione
export { useGeolocation, useGeolocationCoordinates } from '../../hooks/useGeolocation';

// Types per TypeScript
export interface GeolocationCoordinates {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface GeolocationResult {
  coordinates: GeolocationCoordinates;
  address: string;
  timestamp: number;
}

export interface LocationDetectorProps {
  onLocationDetected: (addressData: {
    address: string;
    coordinates: GeolocationCoordinates;
    timestamp: number;
  }) => void;
  showPrivacyInfo?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  disabled?: boolean;
}
