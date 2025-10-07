/**
 * LocationDetector Component
 * Componente per la rilevazione automatica della posizione GPS con reverse geocoding
 * 
 * 🆕 v5.1: Geo Auto-Detect con UI moderna e gestione errori
 * ✅ Integrazione con useGeolocation hook
 * ✅ Design con Tailwind CSS e Heroicons
 * ✅ Gestione privacy e permessi utente
 */

import React from 'react';
import { 
  MapPinIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { MapPinIcon as MapPinSolidIcon } from '@heroicons/react/24/solid';
import { useGeolocation } from '../../hooks/useGeolocation';
import toast from 'react-hot-toast';

interface LocationDetectorProps {
  /** Callback chiamato quando l'indirizzo viene rilevato */
  onLocationDetected: (addressData: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
      accuracy: number;
    };
    timestamp: number;
  }) => void;
  
  /** Mostra informazioni aggiuntive sulla privacy */
  showPrivacyInfo?: boolean;
  
  /** Dimensione del componente */
  size?: 'sm' | 'md' | 'lg';
  
  /** Stile del bottone */
  variant?: 'primary' | 'secondary' | 'ghost';
  
  /** Classe CSS aggiuntiva */
  className?: string;
  
  /** Disabilita il componente */
  disabled?: boolean;
}

/**
 * Componente principale per la rilevazione automatica della posizione
 * 
 * @example
 * ```tsx
 * function AddressForm() {
 *   const [address, setAddress] = useState('');
 * 
 *   return (
 *     <div>
 *       <input 
 *         value={address} 
 *         onChange={(e) => setAddress(e.target.value)} 
 *         placeholder="Inserisci indirizzo"
 *       />
 *       
 *       <LocationDetector 
 *         onLocationDetected={(data) => {
 *           setAddress(data.address);
 *           console.log('Coordinate:', data.coordinates);
 *         }}
 *         showPrivacyInfo={true}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function LocationDetector({
  onLocationDetected,
  showPrivacyInfo = true,
  size = 'md',
  variant = 'secondary',
  className = '',
  disabled = false
}: LocationDetectorProps) {
  const { 
    location, 
    isLoading, 
    error, 
    requestLocation, 
    clearLocation,
    isSupported,
    lastUpdated
  } = useGeolocation();

  // Gestione del click sul pulsante
  const handleDetectLocation = async () => {
    try {
      await requestLocation();
    } catch (err) {
      // L'errore è già gestito dal hook
      console.error('Location detection failed:', err);
    }
  };

  // Effetto quando la posizione è stata rilevata
  React.useEffect(() => {
    if (location) {
      // Callback al componente padre
      onLocationDetected({
        address: location.address,
        coordinates: location.coordinates,
        timestamp: location.timestamp
      });
      
      // Toast di successo
      toast.success('Posizione rilevata!', {
        icon: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
        duration: 3000
      });
    }
  }, [location, onLocationDetected]);

  // Effetto per gli errori
  React.useEffect(() => {
    if (error) {
      toast.error(error, {
        icon: <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />,
        duration: 5000
      });
    }
  }, [error]);

  // Configurazioni di stile in base alle props
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
    ghost: 'bg-transparent hover:bg-gray-50 text-blue-600 border-transparent'
  };

  const iconSize = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5', 
    lg: 'h-6 w-6'
  };

  // Se non supportato dal browser
  if (!isSupported) {
    return (
      <div className={`p-3 bg-yellow-50 border border-yellow-200 rounded-lg ${className}`}>
        <div className="flex items-center text-yellow-800">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          <span className="text-sm">Geolocalizzazione non supportata dal browser</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Pulsante principale */}
      <button
        onClick={handleDetectLocation}
        disabled={disabled || isLoading}
        className={`
          inline-flex items-center border font-medium rounded-lg
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
      >
        {/* Icona dinamica */}
        {isLoading ? (
          <svg className={`${iconSize[size]} mr-2 animate-spin`} fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : location ? (
          <CheckCircleIcon className={`${iconSize[size]} mr-2 text-green-500`} />
        ) : (
          <MapPinIcon className={`${iconSize[size]} mr-2`} />
        )}
        
        {/* Testo dinamico */}
        {isLoading 
          ? 'Rilevamento in corso...' 
          : location 
            ? 'Posizione rilevata'
            : 'Usa la mia posizione'
        }
      </button>

      {/* Informazioni posizione rilevata */}
      {location && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <MapPinSolidIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">Indirizzo rilevato:</p>
              <p className="text-sm text-green-700 break-words">{location.address}</p>
              
              <div className="mt-2 flex items-center space-x-4 text-xs text-green-600">
                <span>
                  📍 {location.coordinates.lat.toFixed(6)}, {location.coordinates.lng.toFixed(6)}
                </span>
                <span>
                  📶 Precisione: {Math.round(location.coordinates.accuracy)}m
                </span>
                {lastUpdated && (
                  <span className="flex items-center">
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>
            
            {/* Pulsante per cancellare */}
            <button
              onClick={() => {
                clearLocation();
                toast.success('Posizione cancellata');
              }}
              className="text-green-600 hover:text-green-800 p-1"
              title="Cancella posizione"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Informazioni sulla privacy */}
      {showPrivacyInfo && !location && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Privacy e sicurezza:</p>
              <ul className="space-y-1 text-xs">
                <li>• La tua posizione viene usata solo per completare l'indirizzo</li>
                <li>• Non salviamo le coordinate GPS</li>
                <li>• Puoi negare il permesso in qualsiasi momento</li>
                <li>• Funziona solo su connessioni sicure (HTTPS)</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Componente semplificato per integrazione rapida
 * Solo il pulsante senza info aggiuntive
 */
export function LocationButton({ 
  onLocationDetected, 
  className = '' 
}: Pick<LocationDetectorProps, 'onLocationDetected' | 'className'>) {
  return (
    <LocationDetector
      onLocationDetected={onLocationDetected}
      showPrivacyInfo={false}
      size="sm"
      variant="ghost"
      className={className}
    />
  );
}

/**
 * Hook per usare LocationDetector in modalità programmatica
 */
export function useLocationDetector() {
  const geolocation = useGeolocation();
  
  return {
    ...geolocation,
    detectLocation: geolocation.requestLocation
  };
}

export default LocationDetector;
