/**
 * Travel Calculation Service
 * Calcola e salva le informazioni di viaggio per le richieste
 * Usa GoogleMapsService centralizzato con cache Redis
 * AGGIORNATO v5.1: Sistema centralizzato con cache
 */

import prisma from '../config/database';
import GoogleMapsService from './googleMaps.service';
import { logger } from '../utils/logger';

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
          workAddress: true,
          workCity: true,
          workProvince: true,
          workPostalCode: true
        },
      });

      if (!request || !professional) {
        throw new Error('Richiesta o professionista non trovato');
      }

      // 2. Verifica che entrambi abbiano indirizzi
      // Usa work address se disponibile, altrimenti indirizzo normale
      const profAddress = professional.workAddress || professional.address;
      const profCity = professional.workCity || professional.city;
      
      if (!request.address || !request.city || !profAddress || !profCity) {
        logger.warn('⚠️ Missing addresses, cannot calculate travel');
        return null;
      }

      // 3. Costruisci gli indirizzi
      const origin = professional.workAddress && professional.workCity
        ? this.buildAddress({
            address: professional.workAddress,
            city: professional.workCity,
            province: professional.workProvince,
            postalCode: professional.workPostalCode
          })
        : this.buildAddress(professional);
      const destination = this.buildAddress(request);

      // 4. Usa GoogleMapsService centralizzato con cache Redis!
      logger.info(`📍 Calculating travel: ${origin} -> ${destination}`);
      
      // Inizializza GoogleMapsService se necessario
      await GoogleMapsService.initialize();
      
      const result = await GoogleMapsService.calculateDistance(
        origin,
        destination,
        { mode: 'driving', units: 'metric' }
      );

      if (!result) {
        logger.warn('⚠️ GoogleMapsService returned no result');
        return null;
      }

      // 5. Calcola il costo stimato (€0.50/km base, ma dovremmo usare le tariffe del professionista)
      const professionalPricing = await prisma.user.findUnique({
        where: { id: professionalId },
        select: {
          travelRatePerKm: true,
          pricingData: true
        }
      });
      
      const costPerKm = professionalPricing?.travelRatePerKm || 0.50;
      const cost = Math.round(result.distance * costPerKm * 100) / 100;

      logger.info(`✅ Travel calculated: ${result.distanceText} (${result.durationText}) - Cost: €${cost}`);

      return {
        distance: result.distance * 1000, // GoogleMapsService ritorna km, noi vogliamo metri
        duration: result.duration * 60,   // GoogleMapsService ritorna minuti, noi vogliamo secondi
        distanceText: result.distanceText,
        durationText: result.durationText,
        cost,
      };
    } catch (error) {
      logger.error('❌ Error calculating travel info:', error);
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
        logger.warn('⚠️ Unable to calculate travel info');
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

      logger.info(`✅ Travel info saved for request ${requestId}`);
      return true;
    } catch (error) {
      logger.error('❌ Error saving travel info:', error);
      return false;
    }
  }

  /**
   * Ricalcola le informazioni di viaggio per tutte le richieste di un professionista
   * Utile quando il professionista cambia indirizzo
   */
  async recalculateForProfessional(professionalId: string): Promise<number> {
    try {
      // Usa la relazione professional invece di professionalId
      const requests = await prisma.assistanceRequest.findMany({
        where: {
          professional: {
            id: professionalId
          },
          status: {
            in: ['ASSIGNED', 'IN_PROGRESS'],
          },
        },
        select: { 
          id: true,
          professional: {
            select: { id: true }
          }
        },
      });

      let updated = 0;

      for (const request of requests) {
        const success = await this.calculateAndSave(request.id, professionalId);
        if (success) updated++;
      }

      logger.info(`✅ Recalculated ${updated}/${requests.length} requests for professional ${professionalId}`);
      return updated;
    } catch (error) {
      logger.error('❌ Error recalculating for professional:', error);
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
        select: { 
          professional: {
            select: { id: true }
          }
        },
      });

      if (!request?.professional?.id) {
        logger.debug('Request not assigned, skipping recalculation');
        return false;
      }

      return await this.calculateAndSave(requestId, request.professional.id);
    } catch (error) {
      logger.error('❌ Error recalculating for request:', error);
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
