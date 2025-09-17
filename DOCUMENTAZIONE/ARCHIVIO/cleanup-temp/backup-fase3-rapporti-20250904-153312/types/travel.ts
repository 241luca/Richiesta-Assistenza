// Frontend Types per funzionalità viaggi
// Definiti seguendo backend types ma ottimizzati per frontend
// Seguendo ISTRUZIONI-PROGETTO.md

export interface TravelInfo {
  distance: number; // Distanza in km
  duration: number; // Durata in minuti  
  cost: number; // Costo in EUR (centesimi)
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface WorkAddress {
  workAddress?: string;
  workCity?: string;
  workProvince?: string;
  workPostalCode?: string;
  useResidenceAsWorkAddress: boolean;
  travelRatePerKm: number; // In EUR (es: 0.50 per 50 cent/km)
}

export interface UpdateWorkAddressDto {
  workAddress?: string;
  workCity?: string;
  workProvince?: string;
  workPostalCode?: string;
  useResidenceAsWorkAddress: boolean;
  travelRatePerKm?: number; // In EUR (es: 0.50 per 50 cent/km)
}

export interface RequestTravelResponse {
  requestId: string;
  distance: number;
  duration: number;
  cost: number;
  itineraryUrl: string;
}

// Interfaccia per componente FormWorkAddress
export interface WorkAddressFormData {
  useResidenceAsWorkAddress: string; // String per radio button compatibility
  workAddress: string;
  workCity: string;
  workProvince: string;
  workPostalCode: string;
  travelRatePerKm: number; // In EUR (non centesimi per form)
}

// Props per componenti
export interface TravelInfoCardProps {
  requestId: string;
  travelInfo: TravelInfo;
  onOpenItinerary?: () => void;
}

export interface WorkAddressSettingsProps {
  onSave?: (data: UpdateWorkAddressDto) => void;
  isLoading?: boolean;
}
