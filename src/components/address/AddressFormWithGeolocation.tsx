/**
 * AddressFormWithGeolocation - Esempio completo di integrazione
 * Mostra come usare LocationDetector in un form di inserimento indirizzo
 * 
 * 🆕 v5.1: Esempio pratico per Geo Auto-Detect
 * ✅ Form completo con validazione
 * ✅ Integrazione LocationDetector  
 * ✅ Pattern responsive e accessibile
 */

import React, { useState } from 'react';
import { MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import LocationDetector from './LocationDetector';
import toast from 'react-hot-toast';

interface AddressData {
  address: string;
  city: string;
  province: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
}

interface AddressFormWithGeolocationProps {
  /** Valore iniziale dell'indirizzo */
  initialValue?: Partial<AddressData>;
  
  /** Callback quando l'indirizzo cambia */
  onChange?: (address: AddressData) => void;
  
  /** Callback quando il form viene inviato */
  onSubmit?: (address: AddressData) => void;
  
  /** Mostra i campi delle coordinate per debug */
  showCoordinates?: boolean;
  
  /** Disabilita il form */
  disabled?: boolean;
}

/**
 * Form di esempio che integra il LocationDetector
 * Dimostra il pattern completo per l'uso in produzione
 */
export function AddressFormWithGeolocation({
  initialValue = {},
  onChange,
  onSubmit,
  showCoordinates = false,
  disabled = false
}: AddressFormWithGeolocationProps) {
  
  // Stato del form
  const [formData, setFormData] = useState<AddressData>({
    address: initialValue.address || '',
    city: initialValue.city || '',
    province: initialValue.province || '',
    postalCode: initialValue.postalCode || '',
    latitude: initialValue.latitude,
    longitude: initialValue.longitude,
    accuracy: initialValue.accuracy
  });

  // Stato per tracking se l'indirizzo è stato auto-rilevato
  const [isAutoDetected, setIsAutoDetected] = useState(false);

  // Funzione per aggiornare i dati
  const updateFormData = (updates: Partial<AddressData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onChange?.(newData);
  };

  // Handler per la geolocalizzazione
  const handleLocationDetected = (locationData: any) => {
    // Parsing dell'indirizzo rilevato per estrarre i componenti
    const address = locationData.address;
    const coordinates = locationData.coordinates;
    
    // Parsing intelligente dell'indirizzo italiano
    const addressParts = address.split(', ');
    
    let street = '';
    let city = '';
    let province = '';
    let postalCode = '';
    
    // Parsing basilare - può essere migliorato
    if (addressParts.length >= 4) {
      street = addressParts[0] || '';
      
      // Cerca il CAP (5 numeri)
      const postalCodeMatch = address.match(/\b\d{5}\b/);
      if (postalCodeMatch) {
        postalCode = postalCodeMatch[0];
      }
      
      // Cerca la provincia (2 lettere maiuscole)
      const provinceMatch = address.match(/\b[A-Z]{2}\b/);
      if (provinceMatch) {
        province = provinceMatch[0];
      }
      
      // La città è tipicamente dopo il CAP
      const cityMatch = address.match(/\d{5}\s+([^,]+)/);
      if (cityMatch) {
        city = cityMatch[1].trim();
      }
    } else {
      // Fallback: usa il primo componente come indirizzo
      street = addressParts[0] || address;
    }

    // Aggiorna il form
    updateFormData({
      address: street,
      city: city,
      province: province,
      postalCode: postalCode,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      accuracy: coordinates.accuracy
    });

    setIsAutoDetected(true);
    
    toast.success('Indirizzo compilato automaticamente!', {
      duration: 4000,
      icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />
    });
  };

  // Handler per i campi input
  const handleInputChange = (field: keyof AddressData, value: string) => {
    updateFormData({ [field]: value });
    
    // Se l'utente modifica manualmente, non è più auto-rilevato
    if (isAutoDetected) {
      setIsAutoDetected(false);
    }
  };

  // Handler submit del form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione basilare
    if (!formData.address || !formData.city || !formData.province || !formData.postalCode) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    
    onSubmit?.(formData);
    toast.success('Indirizzo salvato!');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <MapPinIcon className="h-6 w-6 mr-2 text-blue-600" />
          Inserisci Indirizzo
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Compila manualmente o usa la geolocalizzazione per rilevare automaticamente
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Campo Indirizzo + Geolocalizzazione */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            Indirizzo *
            {isAutoDetected && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-3 w-3 mr-1" />
                Auto-rilevato
              </span>
            )}
          </label>
          
          <div className="space-y-3">
            <input
              type="text"
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              disabled={disabled}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Via Roma, 10"
            />
            
            {/* Componente Geo Auto-Detect */}
            <LocationDetector
              onLocationDetected={handleLocationDetected}
              showPrivacyInfo={!isAutoDetected}
              disabled={disabled}
            />
          </div>
        </div>

        {/* Altri campi in griglia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              Città *
            </label>
            <input
              type="text"
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              disabled={disabled}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
              placeholder="Milano"
            />
          </div>

          <div>
            <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
              Provincia *
            </label>
            <input
              type="text"
              id="province"
              value={formData.province}
              onChange={(e) => handleInputChange('province', e.target.value.toUpperCase())}
              disabled={disabled}
              maxLength={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 uppercase"
              placeholder="MI"
            />
          </div>

          <div>
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
              CAP *
            </label>
            <input
              type="text"
              id="postalCode"
              value={formData.postalCode}
              onChange={(e) => handleInputChange('postalCode', e.target.value)}
              disabled={disabled}
              maxLength={5}
              pattern="[0-9]{5}"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50"
              placeholder="20121"
            />
          </div>
        </div>

        {/* Debug: Coordinate (opzionale) */}
        {showCoordinates && (formData.latitude || formData.longitude) && (
          <div className="p-4 bg-gray-50 rounded-lg border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Informazioni Geolocalizzazione</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Latitudine:</span>
                <span className="ml-2 font-mono">{formData.latitude?.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-600">Longitudine:</span>
                <span className="ml-2 font-mono">{formData.longitude?.toFixed(6)}</span>
              </div>
              <div>
                <span className="text-gray-600">Precisione:</span>
                <span className="ml-2">{formData.accuracy ? `${Math.round(formData.accuracy)}m` : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pulsanti */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              setFormData({
                address: '',
                city: '',
                province: '',
                postalCode: '',
                latitude: undefined,
                longitude: undefined,
                accuracy: undefined
              });
              setIsAutoDetected(false);
            }}
            disabled={disabled}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancella
          </button>
          
          <button
            type="submit"
            disabled={disabled}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Salva Indirizzo
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Esempio semplificato per casi d'uso rapidi
 */
export function SimpleAddressWithGeo({ onAddressChange }: { 
  onAddressChange: (address: string) => void 
}) {
  const [address, setAddress] = useState('');

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Indirizzo
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            onAddressChange(e.target.value);
          }}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Inserisci indirizzo o usa la geolocalizzazione"
        />
      </div>
      
      <LocationDetector
        onLocationDetected={(data) => {
          const fullAddress = data.address;
          setAddress(fullAddress);
          onAddressChange(fullAddress);
        }}
        size="sm"
      />
    </div>
  );
}

export default AddressFormWithGeolocation;
