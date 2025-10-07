/**
 * Location Service
 * Gestisce il tracking live delle posizioni dei professionisti
 * 
 * Funzionalità:
 * - Aggiornamento posizione professionista in tempo reale
 * - Calcolo ETA con Google Maps Distance Matrix API
 * - Notifiche automatiche ai clienti interessati
 * - Cache Redis per performance
 * - Gestione privacy e consenso
 * 
 * @module services/location
 * @version 1.0.0
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import { notificationService } from './notification.service';
import { googleMapsService } from './googleMaps.service';
import { logger } from '../utils/logger';
import { auditLogService } from './auditLog.service';

/**
 * Interfaccia per la posizione del professionista
 */
export interface ProfessionalLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  heading?: number; // Direzione in gradi (0-360)
  speed?: number;   // Velocità in m/s
}

/**
 * Interfaccia per i risultati ETA
 */
export interface ETAResult {
  distance: number;      // Distanza in metri
  duration: number;      // Durata in secondi
  durationText: string;  // Durata formattata es. "15 min"
  distanceText: string;  // Distanza formattata es. "2.5 km"
  trafficDuration?: number; // Durata con traffico
}

/**
 * Location Service Class
 */
export class LocationService {
  // Cache in memoria per posizioni (in produzione usare Redis)
  private locationCache = new Map<string, ProfessionalLocation>();
  
  // Cache per ETA calcolati per evitare troppe chiamate API
  private etaCache = new Map<string, { eta: ETAResult; timestamp: Date }>();
  
  // Timeout cache ETA (2 minuti)
  private readonly ETA_CACHE_TIMEOUT = 2 * 60 * 1000;

  constructor() {
    logger.info('[LocationService] Service initialized');
    
    // Cleanup cache ogni 5 minuti
    setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Aggiorna la posizione di un professionista
   * 
   * @param {string} professionalId - ID del professionista
   * @param {ProfessionalLocation} location - Nuova posizione
   * @returns {Promise<ProfessionalLocation>} Posizione aggiornata
   */
  async updateProfessionalLocation(
    professionalId: string,
    location: ProfessionalLocation
  ): Promise<ProfessionalLocation> {
    try {
      logger.debug(`[LocationService] Updating location for professional: ${professionalId}`, {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy
      });

      // Verifica che il professionista esista
      const professional = await prisma.user.findUnique({
        where: { 
          id: professionalId,
          role: 'PROFESSIONAL'
        }
      });

      if (!professional) {
        throw new Error(`Professional ${professionalId} not found`);
      }

      // Salva in cache
      this.locationCache.set(professionalId, location);

      // Trova richieste attive per questo professionista
      const activeRequests = await prisma.assistanceRequest.findMany({
        where: {
          professionalId,
          status: 'IN_PROGRESS',
          scheduledDate: {
            gte: new Date(),
            // Solo richieste nelle prossime 24 ore
            lte: new Date(Date.now() + 24 * 60 * 60 * 1000)
          }
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              notificationPreference: true
            }
          }
        }
      });

      logger.info(`[LocationService] Found ${activeRequests.length} active requests for professional ${professionalId}`);

      // Processa ogni richiesta attiva
      for (const request of activeRequests) {
        if (request.latitude && request.longitude) {
          await this.processLocationUpdate(
            professionalId,
            location,
            request,
            professional
          );
        }
      }

      // Registra nell'audit log
      await auditLogService.log({
        userId: professionalId,
        ipAddress: 'mobile-app',
        userAgent: 'location-service',
        action: 'LOCATION_UPDATED' as any,
        entityType: 'ProfessionalLocation',
        entityId: professionalId,
        newValues: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp
        },
        success: true,
        severity: 'INFO' as any,
        category: 'BUSINESS' as any,
        metadata: {
          activeRequestsCount: activeRequests.length
        }
      });

      return location;

    } catch (error) {
      logger.error('[LocationService] Error updating professional location:', {
        error: error instanceof Error ? error.message : 'Unknown',
        professionalId,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Audit log errore
      await auditLogService.log({
        userId: professionalId,
        ipAddress: 'mobile-app',
        userAgent: 'location-service',
        action: 'LOCATION_UPDATE_FAILED' as any,
        entityType: 'ProfessionalLocation',
        entityId: professionalId,
        success: false,
        errorMessage: (error as Error).message,
        severity: 'ERROR' as any,
        category: 'BUSINESS' as any
      });

      throw error;
    }
  }

  /**
   * Processa l'aggiornamento di posizione per una richiesta specifica
   * 
   * @private
   * @param {string} professionalId - ID professionista
   * @param {ProfessionalLocation} location - Posizione corrente
   * @param {any} request - Richiesta assistenza
   * @param {any} professional - Dati professionista
   */
  private async processLocationUpdate(
    professionalId: string,
    location: ProfessionalLocation,
    request: any,
    professional: any
  ): Promise<void> {
    try {
      // Calcola ETA
      const eta = await this.calculateETA(
        {
          latitude: location.latitude,
          longitude: location.longitude
        },
        {
          latitude: request.latitude,
          longitude: request.longitude
        }
      );

      if (!eta) {
        logger.warn(`[LocationService] Could not calculate ETA for request ${request.id}`);
        return;
      }

      // Invia aggiornamento posizione al cliente via WebSocket
      notificationService.emitToUser(request.clientId, 'professional:location', {
        requestId: request.id,
        professionalId,
        professionalName: `${professional.firstName} ${professional.lastName}`,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
          heading: location.heading,
          speed: location.speed
        },
        eta,
        timestamp: new Date()
      });

      // Invia anche alla room della richiesta (se altri stanno guardando)
      notificationService.emitToRequest(request.id, 'professional:location', {
        professionalId,
        location,
        eta,
        timestamp: new Date()
      });

      // Controlla se il professionista sta arrivando (< 5 minuti)
      if (eta.duration < 5 * 60) { // 5 minuti in secondi
        await this.handleProfessionalArriving(request, professional, eta);
      }

      // Controlla se il professionista è molto vicino (< 100 metri)
      if (eta.distance < 100) { // 100 metri
        await this.handleProfessionalNearby(request, professional, eta);
      }

      logger.debug(`[LocationService] Location update processed for request ${request.id}`, {
        eta: `${Math.ceil(eta.duration / 60)} min`,
        distance: `${(eta.distance / 1000).toFixed(1)} km`
      });

    } catch (error) {
      logger.error('[LocationService] Error processing location update for request:', {
        error: error instanceof Error ? error.message : 'Unknown',
        requestId: request.id,
        professionalId
      });
    }
  }

  /**
   * Gestisce la notifica quando il professionista sta arrivando
   * 
   * @private
   * @param {any} request - Richiesta assistenza
   * @param {any} professional - Dati professionista
   * @param {ETAResult} eta - Risultato ETA
   */
  private async handleProfessionalArriving(
    request: any,
    professional: any,
    eta: ETAResult
  ): Promise<void> {
    try {
      // Verifica se abbiamo già inviato questa notifica di recente
      const cacheKey = `arriving-${request.id}`;
      const lastNotification = this.etaCache.get(cacheKey);
      
      if (lastNotification && 
          Date.now() - lastNotification.timestamp.getTime() < 2 * 60 * 1000) {
        return; // Non inviare se abbiamo notificato negli ultimi 2 minuti
      }

      // Salva in cache per evitare spam
      this.etaCache.set(cacheKey, { eta, timestamp: new Date() });

      const estimatedMinutes = Math.ceil(eta.duration / 60);

      // Notifica WebSocket speciale
      notificationService.emitToUser(request.clientId, 'professional:arriving', {
        requestId: request.id,
        professionalId: professional.id,
        professionalName: `${professional.firstName} ${professional.lastName}`,
        estimatedMinutes,
        message: `${professional.firstName} sta arrivando! Tempo stimato: ${estimatedMinutes} ${estimatedMinutes === 1 ? 'minuto' : 'minuti'}`
      });

      // Crea notifica in-app
      await notificationService.sendToUser({
        userId: request.clientId,
        type: 'professional_arriving',
        title: 'Il professionista sta arrivando!',
        message: `${professional.firstName} ${professional.lastName} arriverà tra circa ${estimatedMinutes} ${estimatedMinutes === 1 ? 'minuto' : 'minuti'}`,
        priority: 'high',
        channels: ['websocket', 'email'],
        data: {
          requestId: request.id,
          professionalId: professional.id,
          eta: estimatedMinutes
        }
      });

      logger.info(`[LocationService] Arrival notification sent for request ${request.id}`, {
        estimatedMinutes,
        professional: professional.firstName
      });

    } catch (error) {
      logger.error('[LocationService] Error handling professional arriving:', {
        error: error instanceof Error ? error.message : 'Unknown',
        requestId: request.id
      });
    }
  }

  /**
   * Gestisce la notifica quando il professionista è molto vicino
   * 
   * @private
   * @param {any} request - Richiesta assistenza
   * @param {any} professional - Dati professionista
   * @param {ETAResult} eta - Risultato ETA
   */
  private async handleProfessionalNearby(
    request: any,
    professional: any,
    eta: ETAResult
  ): Promise<void> {
    try {
      // Verifica cache per evitare spam
      const cacheKey = `nearby-${request.id}`;
      const lastNotification = this.etaCache.get(cacheKey);
      
      if (lastNotification && 
          Date.now() - lastNotification.timestamp.getTime() < 5 * 60 * 1000) {
        return; // Non inviare se abbiamo notificato negli ultimi 5 minuti
      }

      this.etaCache.set(cacheKey, { eta, timestamp: new Date() });

      // Notifica WebSocket
      notificationService.emitToUser(request.clientId, 'professional:nearby', {
        requestId: request.id,
        professionalId: professional.id,
        professionalName: `${professional.firstName} ${professional.lastName}`,
        distance: eta.distance,
        message: `${professional.firstName} è arrivato nelle vicinanze!`
      });

      // Notifica push importante
      await notificationService.sendToUser({
        userId: request.clientId,
        type: 'professional_nearby',
        title: 'Il professionista è arrivato!',
        message: `${professional.firstName} ${professional.lastName} è nelle immediate vicinanze`,
        priority: 'urgent',
        channels: ['websocket', 'push'],
        data: {
          requestId: request.id,
          professionalId: professional.id,
          distance: eta.distance
        }
      });

      logger.info(`[LocationService] Nearby notification sent for request ${request.id}`, {
        distance: eta.distance,
        professional: professional.firstName
      });

    } catch (error) {
      logger.error('[LocationService] Error handling professional nearby:', {
        error: error instanceof Error ? error.message : 'Unknown',
        requestId: request.id
      });
    }
  }

  /**
   * Calcola l'ETA tra due posizioni usando Google Maps Distance Matrix API
   * 
   * @param {Object} from - Posizione di partenza
   * @param {Object} to - Posizione di destinazione
   * @returns {Promise<ETAResult | null>} Risultato ETA o null se errore
   */
  async calculateETA(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): Promise<ETAResult | null> {
    try {
      // Verifica cache
      const cacheKey = `eta-${from.latitude}-${from.longitude}-${to.latitude}-${to.longitude}`;
      const cached = this.etaCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp.getTime() < this.ETA_CACHE_TIMEOUT) {
        logger.debug('[LocationService] Returning cached ETA');
        return cached.eta;
      }

      // Chiama Google Maps Distance Matrix API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?` +
        `origins=${from.latitude},${from.longitude}&` +
        `destinations=${to.latitude},${to.longitude}&` +
        `mode=driving&` +
        `departure_time=now&` +
        `traffic_model=best_guess&` +
        `language=it&` +
        `key=${process.env.GOOGLE_MAPS_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Google Maps API status: ${data.status}`);
      }

      const element = data.rows[0]?.elements[0];

      if (!element || element.status !== 'OK') {
        logger.warn('[LocationService] Google Maps could not calculate route', {
          element_status: element?.status
        });
        return null;
      }

      const eta: ETAResult = {
        distance: element.distance.value, // metri
        duration: element.duration_in_traffic?.value || element.duration.value, // secondi
        durationText: element.duration_in_traffic?.text || element.duration.text,
        distanceText: element.distance.text,
        trafficDuration: element.duration_in_traffic?.value
      };

      // Salva in cache
      this.etaCache.set(cacheKey, { eta, timestamp: new Date() });

      logger.debug('[LocationService] ETA calculated successfully', {
        distance: eta.distanceText,
        duration: eta.durationText
      });

      return eta;

    } catch (error) {
      logger.error('[LocationService] Error calculating ETA:', {
        error: error instanceof Error ? error.message : 'Unknown',
        from,
        to,
        stack: error instanceof Error ? error.stack : undefined
      });
      return null;
    }
  }

  /**
   * Ottiene la posizione corrente di un professionista
   * 
   * @param {string} professionalId - ID del professionista
   * @returns {ProfessionalLocation | null} Posizione corrente o null
   */
  getCurrentLocation(professionalId: string): ProfessionalLocation | null {
    const location = this.locationCache.get(professionalId);
    
    // Verifica che la posizione non sia troppo vecchia (10 minuti)
    if (location && Date.now() - location.timestamp.getTime() > 10 * 60 * 1000) {
      this.locationCache.delete(professionalId);
      return null;
    }

    return location || null;
  }

  /**
   * Ottiene tutte le posizioni attive dei professionisti
   * 
   * @returns {Map<string, ProfessionalLocation>} Mappa delle posizioni
   */
  getAllActiveLocations(): Map<string, ProfessionalLocation> {
    const now = Date.now();
    const activeLocations = new Map<string, ProfessionalLocation>();

    // Filtra solo posizioni recenti (ultimi 10 minuti)
    for (const [professionalId, location] of this.locationCache.entries()) {
      if (now - location.timestamp.getTime() <= 10 * 60 * 1000) {
        activeLocations.set(professionalId, location);
      }
    }

    return activeLocations;
  }

  /**
   * Rimuove la posizione di un professionista (quando va offline)
   * 
   * @param {string} professionalId - ID del professionista
   */
  clearProfessionalLocation(professionalId: string): void {
    this.locationCache.delete(professionalId);
    
    // Notifica che il professionista è andato offline
    notificationService.emitToProfessionals('professional:offline', {
      professionalId,
      timestamp: new Date()
    });

    logger.debug(`[LocationService] Cleared location for professional: ${professionalId}`);
  }

  /**
   * Cleanup delle cache vecchie
   * 
   * @private
   */
  private cleanupCache(): void {
    const now = Date.now();
    let cleanedLocations = 0;
    let cleanedETA = 0;

    // Cleanup location cache (10 minuti)
    for (const [professionalId, location] of this.locationCache.entries()) {
      if (now - location.timestamp.getTime() > 10 * 60 * 1000) {
        this.locationCache.delete(professionalId);
        cleanedLocations++;
      }
    }

    // Cleanup ETA cache (2 minuti)
    for (const [key, cached] of this.etaCache.entries()) {
      if (now - cached.timestamp.getTime() > this.ETA_CACHE_TIMEOUT) {
        this.etaCache.delete(key);
        cleanedETA++;
      }
    }

    if (cleanedLocations > 0 || cleanedETA > 0) {
      logger.debug('[LocationService] Cache cleanup completed', {
        cleanedLocations,
        cleanedETA,
        remainingLocations: this.locationCache.size,
        remainingETA: this.etaCache.size
      });
    }
  }

  /**
   * Statistiche del servizio (per health check)
   * 
   * @returns {Object} Statistiche correnti
   */
  getStats(): {
    activeLocations: number;
    cacheSize: number;
    etaCacheSize: number;
  } {
    return {
      activeLocations: this.getAllActiveLocations().size,
      cacheSize: this.locationCache.size,
      etaCacheSize: this.etaCache.size
    };
  }
}

/**
 * Export singleton instance
 */
export const locationService = new LocationService();
