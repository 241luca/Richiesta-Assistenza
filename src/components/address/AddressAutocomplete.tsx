import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapPinIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import toast from 'react-hot-toast';

const libraries: ("places")[] = ["places"];

interface AddressAutocompleteProps {
  value: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  onChange: (addressData: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
  }) => void;
  errors?: {
    address?: { message?: string };
    city?: { message?: string };
    province?: { message?: string };
    postalCode?: { message?: string };
  };
}

export default function AddressAutocomplete({ value, onChange, errors }: AddressAutocompleteProps) {
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [showMap, setShowMap] = useState(false);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    libraries,
    language: 'it',
    region: 'IT',
  });

  const onLoad = useCallback((autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
    // Restrict to Italy
    autocompleteInstance.setComponentRestrictions({
      country: 'it',
    });
    // Prefer addresses
    autocompleteInstance.setTypes(['address']);
  }, []);

  const onPlaceChanged = useCallback(() => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      
      if (!place.address_components) {
        toast.error('Indirizzo non trovato. Prova a selezionare dalla lista suggerita.');
        setIsAddressVerified(false);
        return;
      }

      // Parse the address components
      let streetNumber = '';
      let route = '';
      let city = '';
      let province = '';
      let postalCode = '';
      let country = '';

      place.address_components.forEach((component) => {
        const types = component.types;
        
        if (types.includes('street_number')) {
          streetNumber = component.long_name;
        } else if (types.includes('route')) {
          route = component.long_name;
        } else if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_3')) {
          // Sometimes city is here for Italian addresses
          if (!city) city = component.long_name;
        } else if (types.includes('administrative_area_level_2')) {
          // Province code (e.g., MI for Milano)
          province = component.short_name;
        } else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        } else if (types.includes('country')) {
          country = component.short_name;
        }
      });
      
      // Se non c'è il CAP e abbiamo un formatted_address, proviamo a estrarlo
      if (!postalCode && place.formatted_address) {
        // Cerca un pattern di 5 cifre nell'indirizzo formattato (CAP italiano)
        const capMatch = place.formatted_address.match(/\b\d{5}\b/);
        if (capMatch) {
          postalCode = capMatch[0];
        }
      }

      // Validate it's an Italian address
      if (country !== 'IT') {
        toast.error('Per favore seleziona un indirizzo in Italia');
        setIsAddressVerified(false);
        return;
      }

      // Format the street address (formato italiano: Via Nome, Numero)
      const fullAddress = streetNumber 
        ? `${route}, ${streetNumber}` 
        : route || '';
      
      // Se manca qualche campo essenziale, prova a fare una chiamata di geocoding
      if (!postalCode || !city || !province) {
        // Usa l'indirizzo formattato per provare a recuperare i dati mancanti
        if (place.formatted_address) {
          const parts = place.formatted_address.split(',');
          if (!city && parts.length > 1) {
            // Prova a estrarre la città dalla seconda parte
            const cityPart = parts[1]?.trim().split(' ');
            if (cityPart && cityPart.length > 1) {
              postalCode = postalCode || cityPart[0];
              city = city || cityPart.slice(1).join(' ');
            }
          }
        }
      }

      // Get coordinates
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      if (place.geometry?.location) {
        latitude = place.geometry.location.lat();
        longitude = place.geometry.location.lng();
        setCoordinates({ lat: latitude, lng: longitude });
      }

      // Update all fields
      onChange({
        address: fullAddress,
        city: city,
        province: province.toUpperCase(),
        postalCode: postalCode,
        latitude,
        longitude,
      });

      setIsAddressVerified(true);
      setShowMap(true);
      
      toast.success('Indirizzo verificato con successo!', {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
      });
    }
  }, [autocomplete, onChange]);

  // Mini map component
  const MiniMap = () => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
      if (isLoaded && mapRef.current && coordinates && !map) {
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: coordinates,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
        });

        new google.maps.Marker({
          position: coordinates,
          map: mapInstance,
          title: 'Indirizzo intervento',
        });

        setMap(mapInstance);
      }
    }, [isLoaded, coordinates, map]);

    return (
      <div className="mt-4 border rounded-lg overflow-hidden shadow-sm">
        <div className="bg-green-50 px-4 py-2 border-b border-green-200">
          <p className="text-sm text-green-800 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Indirizzo verificato - Posizione sulla mappa
          </p>
        </div>
        <div ref={mapRef} className="h-48 w-full" />
      </div>
    );
  };

  if (loadError) {
    console.error('Error loading Google Maps:', loadError);
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800 flex items-center">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            Autocompletamento indirizzo non disponibile. Inserisci manualmente.
          </p>
        </div>
        {/* Fallback to manual input fields */}
        <ManualAddressFields value={value} onChange={onChange} errors={errors} />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
        <ManualAddressFields value={value} onChange={onChange} errors={errors} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Google Autocomplete Address Field */}
      <div className="sm:col-span-2">
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Indirizzo * 
          {isAddressVerified && (
            <span className="ml-2 text-green-600">
              <CheckCircleIcon className="h-4 w-4 inline" />
              Verificato
            </span>
          )}
        </label>
        <div className="mt-1 relative">
          <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
          >
            <input
              ref={addressInputRef}
              type="text"
              id="address"
              defaultValue={value.address}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 pl-10"
              placeholder="Inizia a digitare l'indirizzo..."
            />
          </Autocomplete>
          <MapPinIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
        </div>
        {errors?.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Inizia a digitare e seleziona l'indirizzo dalla lista per compilare automaticamente tutti i campi
        </p>
      </div>

      {/* Auto-filled fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Città *
          </label>
          <input
            type="text"
            id="city"
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
            placeholder="Verrà compilato automaticamente"
            readOnly={isAddressVerified}
          />
          {errors?.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="province" className="block text-sm font-medium text-gray-700">
            Provincia *
          </label>
          <input
            type="text"
            id="province"
            value={value.province}
            onChange={(e) => onChange({ ...value, province: e.target.value.toUpperCase() })}
            maxLength={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase bg-gray-50"
            placeholder="XX"
            readOnly={isAddressVerified}
          />
          {errors?.province && (
            <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
            CAP *
          </label>
          <input
            type="text"
            id="postalCode"
            value={value.postalCode}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            maxLength={5}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-50"
            placeholder="00000"
            readOnly={isAddressVerified}
          />
          {errors?.postalCode && (
            <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
          )}
        </div>
      </div>

      {/* Show mini map if address is verified */}
      {isAddressVerified && showMap && coordinates && <MiniMap />}
    </div>
  );
}

// Fallback component for manual address input
const ManualAddressFields: React.FC<{
  value: {
    address: string;
    city: string;
    province: string;
    postalCode: string;
  };
  onChange: (value: any) => void;
  errors?: any;
}> = ({ value, onChange, errors }) => (
  <>
    <div className="sm:col-span-2">
      <label htmlFor="address" className="block text-sm font-medium text-gray-700">
        Indirizzo *
      </label>
      <input
        type="text"
        id="address"
        value={value.address}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        placeholder="Via Roma, 1"
      />
      {errors?.address && (
        <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
      )}
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
          Città *
        </label>
        <input
          type="text"
          id="city"
          value={value.city}
          onChange={(e) => onChange({ ...value, city: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Milano"
        />
        {errors?.city && (
          <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="province" className="block text-sm font-medium text-gray-700">
          Provincia *
        </label>
        <input
          type="text"
          id="province"
          value={value.province}
          onChange={(e) => onChange({ ...value, province: e.target.value.toUpperCase() })}
          maxLength={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase"
          placeholder="MI"
        />
        {errors?.province && (
          <p className="mt-1 text-sm text-red-600">{errors.province.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
          CAP *
        </label>
        <input
          type="text"
          id="postalCode"
          value={value.postalCode}
          onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
          maxLength={5}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="20100"
        />
        {errors?.postalCode && (
          <p className="mt-1 text-sm text-red-600">{errors.postalCode.message}</p>
        )}
      </div>
    </div>
  </>
);
