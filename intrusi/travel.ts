// TIPI PER FUNZIONALITÀ VIAGGI E DISTANZE
// Creato seguendo ISTRUZIONI-PROGETTO.md - Schema-First Development

import { User, AssistanceRequest } from '@prisma/client';

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

export interface UserWithWorkAddress extends User {
  workAddress?: string;
  workCity?: string;
  workProvince?: string;
  workPostalCode?: string;
  workLatitude?: number;
  workLongitude?: number;
  useResidenceAsWorkAddress: boolean;
  travelRatePerKm?: number; // In EUR centesimi
}

export interface RequestWithTravelInfo extends AssistanceRequest {
  travelInfo?: TravelInfo;
  itineraryUrl?: string; // URL per Google Maps
}

// DTO per aggiornamento indirizzo di lavoro
export interface UpdateWorkAddressDto {
  workAddress?: string;
  workCity?: string;
  workProvince?: string;
  workPostalCode?: string;
  useResidenceAsWorkAddress: boolean;
  travelRatePerKm?: number;
}

// DTO per risposta con info viaggi
export interface RequestTravelResponse {
  requestId: string;
  distance: number;
  duration: number;
  cost: number;
  itineraryUrl: string;
}
