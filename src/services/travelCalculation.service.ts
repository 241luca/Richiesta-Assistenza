/**
 * Travel Calculation Service
 * Calcola e salva le informazioni di viaggio per le richieste
 * Usa Google Maps Directions API
 * AGGIORNATO v5.1: Usa API keys dal database
 */

import { Client } from '@googlemaps/google-maps-services-js';
import prisma from '../config/database';
import { apiKeyService } from './apiKey.service';

const mapsClient = new Client({});

interface TravelInfo {
  distance: number; // metri
  duration: number; // secondi
  distanceText: string;
  durationText: string;
  cost: number; // euro
}

class TravelCalculationService {
  /**
   * Calcola le informazioni di viaggio tra professionista e richiesta
   */
  async calculateTravelInfo(
    requestId: string,
    professionalId: string
  ): Promise<TravelInfo | null> {
    try {
      // 1. Recupera la richiesta e il professionista
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: {
          address: true,
          city: true,
          province: true,
          postalCode: true,
          latitude: true,
          longitude: true,
        },
      });

      const professional = await prisma.user.findUnique({
        where: { id: professionalId },
        select: {
          address: true,
          city: true,
          province: true,
          postalCode: true,
          latitude: true,
          longitude: true,
        },
      });

      if (!request || !professional) {
        throw new Error('Richiesta o professionista non trovato');
      }

      // 2. Verifica che entrambi abbiano indirizzi
      if (!request.address || !request.city || !professional.address || !professional.city) {
        console.log('Indirizzi mancanti, impossibile calcolare viaggio');
        return null;
      }

      // 3. Costruisci gli indirizzi
      const origin = this.buildAddress(professional);
      const destination = this.buildAddress(request);

      // 4. Recupera API key dal database
      const apiKeyData = await apiKeyService.getApiKey('GOOGLE_MAPS', true);
      
      if (!apiKeyData || !apiKeyData.key) {
        throw new Error('Google Maps API key not found in database');
      }

      const response = await mapsClient.directions({
        params: {
          origin,
          destination,
          mode: 'driving',
          region: 'it',
          units: 'metric',
          key: apiKeyData.key,
        },
        timeout: 5000,
      });

      if (response.data.status !== 'OK' || !response.data.routes[0]) {
        console.error('Errore Google Maps API:', response.data.status);
        return null;
      }

      const route = response.data.routes[0];
      const leg = route.legs[0];

      // 5. Calcola il costo stimato (€0.50/km)
      const distanceKm = leg.distance.value / 1000;
      const costPerKm = 0.50;
      const cost = Math.round(distanceKm * costPerKm * 100) / 100;

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        distanceText: leg.distance.text,
        durationText: leg.duration.text,
        cost,
      };
    } catch (error) {
      console.error('Errore calcolo informazioni viaggio:', error);
      return null;
    }
  }

  /**
   * Calcola e salva le informazioni di viaggio per una richiesta
   */
  async calculateAndSave(requestId: string, professionalId: string): Promise<boolean> {
    try {
      const travelInfo = await this.calculateTravelInfo(requestId, professionalId);

      if (!travelInfo) {
        console.log('Impossibile calcolare informazioni viaggio');
        return false;
      }

      // Salva nel database
      await prisma.assistanceRequest.update({
        where: { id: requestId },
        data: {
          travelDistance: travelInfo.distance,
          travelDuration: travelInfo.duration,
          travelDistanceText: travelInfo.distanceText,
          travelDurationText: travelInfo.durationText,
          travelCost: travelInfo.cost,
          travelCalculatedAt: new Date(),
        },
      });

      console.log(`✅ Informazioni viaggio salvate per richiesta ${requestId}`);
      return true;
    } catch (error) {
      console.error('Errore salvataggio informazioni viaggio:', error);
      return false;
    }
  }

  /**
   * Ricalcola le informazioni di viaggio per tutte le richieste di un professionista
   * Utile quando il professionista cambia indirizzo
   */
  async recalculateForProfessional(professionalId: string): Promise<number> {
    try {
      const requests = await prisma.assistanceRequest.findMany({
        where: {
          professionalId,
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS'],
          },
        },
        select: { id: true },
      });

      let updated = 0;

      for (const request of requests) {
        const success = await this.calculateAndSave(request.id, professionalId);
        if (success) updated++;
      }

      console.log(`✅ Ricalcolate ${updated}/${requests.length} richieste per professionista ${professionalId}`);
      return updated;
    } catch (error) {
      console.error('Errore ricalcolo per professionista:', error);
      return 0;
    }
  }

  /**
   * Ricalcola le informazioni di viaggio quando l'indirizzo della richiesta cambia
   */
  async recalculateForRequest(requestId: string): Promise<boolean> {
    try {
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        select: { professionalId: true },
      });

      if (!request?.professionalId) {
        console.log('Richiesta non assegnata, skip ricalcolo');
        return false;
      }

      return await this.calculateAndSave(requestId, request.professionalId);
    } catch (error) {
      console.error('Errore ricalcolo per richiesta:', error);
      return false;
    }
  }

  /**
   * Helper per costruire l'indirizzo completo
   */
  private buildAddress(data: any): string {
    const parts = [
      data.address,
      data.city,
      data.province,
      data.postalCode,
      'Italia',
    ].filter(Boolean);
    
    return parts.join(', ');
  }
}

export default new TravelCalculationService();
