/**
 * Travel API Service
 * Gestisce le chiamate API per funzionalità viaggi e distanze
 * Seguendo ISTRUZIONI-PROGETTO.md - Frontend usa React Query
 */

import { apiClient } from './api';
import type { 
  TravelInfo, 
  WorkAddress, 
  UpdateWorkAddressDto, 
  RequestTravelResponse 
} from '../types/travel';

// DTO per validazione indirizzo
interface ValidateAddressRequest {
  address: string;
  city: string;
  province: string;
  postalCode: string;
}

interface ValidateAddressResponse {
  isValid: boolean;
  coordinates: {
    lat: number;
    lng: number;
  };
  formattedAddress: string;
}

// Servizio API Travel
export const travelApi = {
  /**
   * Ottiene l'indirizzo di lavoro del professionista autenticato
   */
  async getWorkAddress(): Promise<WorkAddress> {
    const response = await apiClient.get('/travel/work-address');
    return response.data.data; // ResponseFormatter.success wraps data in 'data'
  },

  /**
   * Aggiorna l'indirizzo di lavoro del professionista
   */
  async updateWorkAddress(workAddressData: UpdateWorkAddressDto): Promise<WorkAddress> {
    console.log('🔍 TravelAPI: updateWorkAddress chiamata con:', workAddressData);
    
    try {
      const response = await apiClient.put('/travel/work-address', workAddressData);
      console.log('✅ TravelAPI: updateWorkAddress risposta:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ TravelAPI: updateWorkAddress errore:', error);
      throw error;
    }
  },

  /**
   * Calcola informazioni di viaggio per una richiesta specifica
   */
  async getRequestTravelInfo(requestId: string): Promise<RequestTravelResponse> {
    const response = await apiClient.get(`/travel/request/${requestId}/travel-info`);
    return response.data.data;
  },

  /**
   * Calcola informazioni di viaggio per più richieste (batch)
   */
  async getBatchTravelInfo(requestIds: string[]): Promise<Array<{ requestId: string; travelInfo: TravelInfo | null; itineraryUrl?: string }>> {
    const response = await apiClient.post('/travel/requests/batch-travel-info', {
      requestIds
    });
    return response.data.data;
  },

  /**
   * Genera URL itinerario Google Maps per una richiesta
   */
  async getItinerary(requestId: string): Promise<{ itineraryUrl: string; requestId: string }> {
    const response = await apiClient.get(`/travel/itinerary/${requestId}`);
    return response.data.data;
  },

  /**
   * Valida un indirizzo tramite geocoding
   */
  async validateAddress(addressData: ValidateAddressRequest): Promise<ValidateAddressResponse> {
    const response = await apiClient.post('/travel/validate-address', addressData);
    return response.data.data;
  }
};

// Export default per compatibilità
export default travelApi;
