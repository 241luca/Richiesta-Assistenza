/**
 * Travel Service
 * Gestisce i calcoli di distanza, tempo e costi di viaggio per i professionisti
 * Seguendo ISTRUZIONI-PROGETTO.md - Services NON usano ResponseFormatter
 */

import { geocodingService } from './geocoding.service';
import { logger } from '../utils/logger';
import { TravelInfo, LocationCoordinates, WorkAddress, UpdateWorkAddressDto } from '../types/travel';
import { User, AssistanceRequest } from '@prisma/client';
import { prisma } from '../config/database';

export class TravelService {
  
  /**
   * Ottiene professionista con coordinate di partenza
   */
  async getProfessionalWithCoordinates(professionalId: string): Promise<LocationCoordinates | null> {
    try {
      const professional = await prisma.user.findUnique({
        where: { id: professionalId },
        select: {
          id: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
          latitude: true,
          longitude: true,
          workAddress: true,
          workCity: true,
          workProvince: true,
          workPostalCode: true,
          workLatitude: true,
          workLongitude: true,
          useResidenceAsWorkAddress: true
        }
      });

      if (!professional) {
        return null;
      }

      return await this.getProfessionalStartingPoint(professional);
    } catch (error) {
      logger.error('Error getting professional coordinates:', error);
      throw error;
    }
  }

  /**
   * Ottiene richiesta con coordinate di destinazione
   */
  async getRequestWithCoordinates(requestId: string): Promise<LocationCoordinates | null> {
    try {
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        return null;
      }

      return await this.getRequestDestination(request);
    } catch (error) {
      logger.error('Error getting request coordinates:', error);
      throw error;
    }
  }

  /**
   * Ottiene l'indirizzo di lavoro di un professionista
   */
  async getWorkAddress(professionalId: string): Promise<WorkAddress | null> {
    try {
      const professional = await prisma.user.findUnique({
        where: { id: professionalId },
        select: {
          workAddress: true,
          workCity: true,
          workProvince: true,
          workPostalCode: true,
          workLatitude: true,
          workLongitude: true,
          useResidenceAsWorkAddress: true,
          travelRatePerKm: true
        }
      });

      if (!professional) {
        return null;
      }

      const workAddress: WorkAddress = {
        workAddress: professional.workAddress,
        workCity: professional.workCity,
        workProvince: professional.workProvince,
        workPostalCode: professional.workPostalCode,
        workLatitude: professional.workLatitude,
        workLongitude: professional.workLongitude,
        useResidenceAsWorkAddress: professional.useResidenceAsWorkAddress || false,
        travelRatePerKm: professional.travelRatePerKm ? Number(professional.travelRatePerKm) : undefined // Il database contiene già centesimi
      };

      return workAddress;

    } catch (error) {
      logger.error('Error getting work address:', error);
      throw error;
    }
  }

  /**
   * Calcola informazioni di viaggio tra due punti
   */
  async calculateTravelInfo(
    origin: LocationCoordinates,
    destination: LocationCoordinates,
    travelRatePerKm: number = 50 // Default €0.50/km in centesimi
  ): Promise<TravelInfo | null> {
    try {
      const distanceData = await geocodingService.calculateDistance(origin, destination);
      
      if (!distanceData) {
        logger.warn('Unable to calculate distance between points');
        return null;
      }

      const cost = Math.round(distanceData.distance * travelRatePerKm); // In centesimi

      const result: TravelInfo = {
        distance: Math.round(distanceData.distance * 100) / 100, // 2 decimali
        duration: Math.round(distanceData.duration),
        cost: cost
      };

      logger.info(`Travel calculated: ${result.distance}km, ${result.duration}min, €${cost/100}`);
      return result;

    } catch (error) {
      logger.error('Error calculating travel info:', error);
      return null;
    }
  }

  /**
   * Ottiene le coordinate del punto di partenza di un professionista
   */
  async getProfessionalStartingPoint(professional: User): Promise<LocationCoordinates | null> {
    try {
      let coordinates: LocationCoordinates | null = null;

      if (professional.useResidenceAsWorkAddress) {
        // Usa l'indirizzo di residenza
        if (professional.latitude && professional.longitude) {
          coordinates = {
            latitude: professional.latitude,
            longitude: professional.longitude
          };
          logger.info(`Professional ${professional.id} using cached residence coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
        } else if (professional.address && professional.city && professional.province && professional.postalCode) {
          // Geocode l'indirizzo di residenza
          logger.info(`Professional ${professional.id} geocoding residence address: ${professional.address}, ${professional.city}`);
          const geocoded = await geocodingService.geocodeRequest(
            professional.address,
            professional.city,
            professional.province,
            professional.postalCode
          );
          if (geocoded) {
            coordinates = { latitude: geocoded.lat, longitude: geocoded.lng };
            // Salva le coordinate per il futuro
            await prisma.user.update({
              where: { id: professional.id },
              data: {
                latitude: geocoded.lat,
                longitude: geocoded.lng
              }
            });
            logger.info(`Professional ${professional.id} residence geocoded and saved: ${coordinates.latitude}, ${coordinates.longitude}`);
          }
        }
      } else {
        // Usa l'indirizzo di lavoro
        if (professional.workLatitude && professional.workLongitude) {
          coordinates = {
            latitude: professional.workLatitude,
            longitude: professional.workLongitude
          };
          logger.info(`Professional ${professional.id} using cached work coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
        } else if (professional.workAddress && professional.workCity && professional.workProvince && professional.workPostalCode) {
          // Geocode l'indirizzo di lavoro
          logger.info(`Professional ${professional.id} geocoding work address: ${professional.workAddress}, ${professional.workCity}`);
          const geocoded = await geocodingService.geocodeRequest(
            professional.workAddress,
            professional.workCity,
            professional.workProvince,
            professional.workPostalCode
          );
          if (geocoded) {
            coordinates = { latitude: geocoded.lat, longitude: geocoded.lng };
            // Salva le coordinate per il futuro
            await prisma.user.update({
              where: { id: professional.id },
              data: {
                workLatitude: geocoded.lat,
                workLongitude: geocoded.lng
              }
            });
            logger.info(`Professional ${professional.id} work address geocoded and saved: ${coordinates.latitude}, ${coordinates.longitude}`);
          }
        }
      }

      if (!coordinates) {
        logger.warn(`Unable to determine starting point for professional ${professional.id} - useResidenceAsWork: ${professional.useResidenceAsWorkAddress}`);
        logger.warn(`Professional addresses - Residence: ${professional.address ? 'SET' : 'MISSING'}, Work: ${professional.workAddress ? 'SET' : 'MISSING'}`);
      }

      return coordinates;

    } catch (error) {
      logger.error('Error getting professional starting point:', error);
      return null;
    }
  }

  /**
   * Ottiene le coordinate di destinazione di una richiesta
   */
  async getRequestDestination(request: AssistanceRequest): Promise<LocationCoordinates | null> {
    try {
      if (request.latitude && request.longitude) {
        return {
          latitude: request.latitude,
          longitude: request.longitude
        };
      }

      if (request.address && request.city && request.province && request.postalCode) {
        const geocoded = await geocodingService.geocodeRequest(
          request.address,
          request.city,
          request.province,
          request.postalCode
        );

        if (geocoded) {
          // Salva le coordinate per il futuro
          await prisma.assistanceRequest.update({
            where: { id: request.id },
            data: {
              latitude: geocoded.lat,
              longitude: geocoded.lng
            }
          });

          return { latitude: geocoded.lat, longitude: geocoded.lng };
        }
      }

      logger.warn(`Unable to determine destination for request ${request.id}`);
      return null;

    } catch (error) {
      logger.error('Error getting request destination:', error);
      return null;
    }
  }

  /**
   * Calcola informazioni di viaggio per una richiesta specifica
   */
  async calculateRequestTravelInfo(
    professionalId: string,
    requestId: string
  ): Promise<TravelInfo | null> {
    try {
      // Ottieni il professionista con tutti i dati necessari
      const professional = await prisma.user.findUnique({
        where: { id: professionalId },
        select: {
          id: true,
          address: true,
          city: true,
          province: true,
          postalCode: true,
          latitude: true,
          longitude: true,
          workAddress: true,
          workCity: true,
          workProvince: true,
          workPostalCode: true,
          workLatitude: true,
          workLongitude: true,
          useResidenceAsWorkAddress: true,
          travelRatePerKm: true
        }
      });

      if (!professional) {
        throw new Error(`Professional ${professionalId} not found`);
      }

      // Ottieni la richiesta
      const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        throw new Error(`Request ${requestId} not found`);
      }

      // Calcola le coordinate di partenza e destinazione
      const startingPoint = await this.getProfessionalStartingPoint(professional);
      const destination = await this.getRequestDestination(request);

      if (!startingPoint || !destination) {
        return null;
      }

      // Usa la tariffa personalizzata del professionista o default
      const travelRate = professional.travelRatePerKm ? Number(professional.travelRatePerKm) : 50; // Database già in centesimi

      return await this.calculateTravelInfo(startingPoint, destination, travelRate);

    } catch (error) {
      logger.error('Error calculating request travel info:', error);
      throw error; // I services lanciano eccezioni, non usano ResponseFormatter
    }
  }

  /**
   * Aggiorna l'indirizzo di lavoro di un professionista
   */
  async updateWorkAddress(
    professionalId: string,
    workAddressData: UpdateWorkAddressDto
  ): Promise<User> {
    try {
      let workLatitude: number | undefined;
      let workLongitude: number | undefined;

      // Se non usa l'indirizzo di residenza e ha fornito un nuovo indirizzo di lavoro
      if (!workAddressData.useResidenceAsWorkAddress && 
          workAddressData.workAddress && 
          workAddressData.workCity && 
          workAddressData.workProvince && 
          workAddressData.workPostalCode) {
        
        const geocoded = await geocodingService.geocodeRequest(
          workAddressData.workAddress,
          workAddressData.workCity,
          workAddressData.workProvince,
          workAddressData.workPostalCode
        );

        if (geocoded) {
          workLatitude = geocoded.lat;
          workLongitude = geocoded.lng;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: professionalId },
        data: {
          workAddress: workAddressData.workAddress,
          workCity: workAddressData.workCity,
          workProvince: workAddressData.workProvince,
          workPostalCode: workAddressData.workPostalCode,
          workLatitude: workLatitude,
          workLongitude: workLongitude,
          useResidenceAsWorkAddress: workAddressData.useResidenceAsWorkAddress,
          travelRatePerKm: workAddressData.travelRatePerKm, // Il frontend invia già in centesimi
          updatedAt: new Date()
        }
      });

      logger.info(`Work address updated for professional ${professionalId}`);
      return updatedUser;

    } catch (error) {
      logger.error('Error updating work address:', error);
      throw error; // I services lanciano eccezioni
    }
  }

  /**
   * Genera URL per l'itinerario Google Maps
   */
  generateItineraryUrl(
    origin: LocationCoordinates,
    destination: LocationCoordinates
  ): string {
    // CORREZIONE: URL più esplicito per forzare coordinate di partenza
    const baseUrl = 'https://www.google.com/maps/dir/';
    const originStr = `${origin.latitude},${origin.longitude}`;
    const destinationStr = `${destination.latitude},${destination.longitude}`;
    
    // Formato più esplicito che forza le coordinate invece della posizione attuale
    return `${baseUrl}${originStr}/${destinationStr}?travelmode=driving&dir_action=navigate`;
  }

  /**
   * Calcola informazioni di viaggio multiple per un professionista
   * Utile per dashboard con lista richieste
   */
  async calculateMultipleRequestsTravelInfo(
    professionalId: string,
    requestIds: string[]
  ): Promise<Array<{ requestId: string; travelInfo: TravelInfo | null; itineraryUrl?: string }>> {
    try {
      const results = [];

      for (const requestId of requestIds) {
        const travelInfo = await this.calculateRequestTravelInfo(professionalId, requestId);
        let itineraryUrl: string | undefined;

        if (travelInfo) {
          // Per generare URL avremmo bisogno delle coordinate, per ora omettiamo
          // Sarà implementato quando necessario dalla route
        }

        results.push({
          requestId,
          travelInfo,
          itineraryUrl
        });
      }

      return results;

    } catch (error) {
      logger.error('Error calculating multiple requests travel info:', error);
      throw error;
    }
  }

  /**
   * Valida i dati dell'indirizzo di lavoro
   */
  validateWorkAddress(workAddressData: UpdateWorkAddressDto): string[] {
    const errors: string[] = [];

    if (!workAddressData.useResidenceAsWorkAddress) {
      // Se non usa residenza, deve fornire indirizzo di lavoro completo
      if (!workAddressData.workAddress?.trim()) {
        errors.push('Indirizzo di lavoro richiesto');
      }
      if (!workAddressData.workCity?.trim()) {
        errors.push('Città di lavoro richiesta');
      }
      if (!workAddressData.workProvince?.trim()) {
        errors.push('Provincia di lavoro richiesta');
      } else if (!geocodingService.validateItalianProvince(workAddressData.workProvince)) {
        errors.push('Provincia non valida');
      }
      if (!workAddressData.workPostalCode?.trim()) {
        errors.push('CAP di lavoro richiesto');
      } else if (!geocodingService.validateItalianPostalCode(workAddressData.workPostalCode)) {
        errors.push('CAP non valido');
      }
    }

    if (workAddressData.travelRatePerKm !== undefined) {
      if (workAddressData.travelRatePerKm < 0 || workAddressData.travelRatePerKm > 10000) {
        errors.push('Tariffa per km deve essere tra 0 e €100');
      }
    }

    return errors;
  }
}

// Export singleton instance
export const travelService = new TravelService();
