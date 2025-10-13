// TIPI PER FUNZIONALITÀ VIAGGI E DISTANZE
// Creato seguendo ISTRUZIONI-PROGETTO.md - Schema-First Development

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
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

// Interfacce base senza dipendenze da Prisma
export interface BaseUser {
  id: string;
  email: string;
  name?: string;
  // Altri campi base necessari
}

export interface BaseAssistanceRequest {
  id: string;
  userId: string;
  // Altri campi base necessari
}

export interface UserWithWorkAddress extends BaseUser {
  workAddress?: string;
  workCity?: string;
  workProvince?: string;
  workPostalCode?: string;
  workLatitude?: number;
  workLongitude?: number;
  useResidenceAsWorkAddress: boolean;
  travelRatePerKm?: number; // In EUR centesimi
}

export interface RequestWithTravelInfo extends BaseAssistanceRequest {
  travelInfo?: TravelInfo;
  itineraryUrl?: string; // URL per Google Maps
}

export interface UpdateWorkAddressDto {
  workAddress?: string;
  workCity?: string;
  workProvince?: string;
  workPostalCode?: string;
  useResidenceAsWorkAddress: boolean;
  travelRatePerKm?: number;
}

export interface RequestTravelResponse {
  requestId: string;
  distance: number;
  duration: number;
  cost: number;
  itineraryUrl: string;
}

export interface TravelInfoCardProps {
  requestId: string;
  className?: string;
}