/**
 * Google Maps Service - VERSIONE 2025 AGGIORNATA
 * Servizio completo per interazioni con Google Maps API
 * Utilizza le ultime API disponibili e implementa caching intelligente
 * 
 * MIGLIORAMENTI:
 * - Supporto Directions API per itinerari
 * - Cache intelligente per ridurre chiamate API
 * - Batch processing per multiple richieste
 * - Gestione errori robusta
 * - Metriche e logging avanzato
 */

import axios from 'axios';
import { apiKeyService } from './apiKey.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import crypto from 'crypto';

// ===== TIPI E INTERFACCE =====

interface Coordinates {
  lat: number;
  lng: number;
}

interface Address {
  street?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}

interface DistanceResult {
  distance: number; // in km
  duration: number; // in minuti
  durationInTraffic?: number; // in minuti con traffico attuale
  distanceText: string; // es: "12.5 km"
  durationText: string; // es: "15 min"
}

interface RouteResult {
  distance: number; // in km
  duration: number; // in minuti
  durationInTraffic?: number; // in minuti con traffico
  polyline: string; // encoded polyline per disegnare il percorso
  bounds: {
    northeast: Coordinates;
    southwest: Coordinates;
  };
  steps: RouteStep[];
  warnings?: string[];
  waypoints?: Coordinates[];
}

interface RouteStep {
  instruction: string; // es: "Svolta a destra in Via Roma"
  distance: number; // in metri
  duration: number; // in secondi
  startLocation: Coordinates;
  endLocation: Coordinates;
  maneuver?: string; // es: "turn-right", "roundabout-left"
}

interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  coordinates: Coordinates;
  addressComponents: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    province?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  };
  types: string[];
  businessStatus?: string;
  name?: string;
  rating?: number;
  userRatingsTotal?: number;
  phoneNumber?: string;
  website?: string;
  openingHours?: {
    openNow?: boolean;
    periods?: any[];
    weekdayText?: string[];
  };
}

interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  distanceMeters?: number; // se fornita una location di riferimento
}

// ===== CLASSE PRINCIPALE =====

export class GoogleMapsService {
  // Cache in memoria per sessione (si resetta al riavvio server)
  private static geocodeCache = new Map<string, { coordinates: Coordinates; timestamp: number }>();
  private static distanceCache = new Map<string, { result: DistanceResult; timestamp: number }>();
  private static CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ore
  
  /**
   * Recupera la API key di Google Maps dal database
   */
  private static async getApiKey(): Promise<string | null> {
    try {
      const apiKeyData = await apiKeyService.getApiKey('GOOGLE_MAPS');
      
      if (!apiKeyData || !apiKeyData.key) {
        logger.error('Google Maps API key not found in database');
        return null;
      }
      
      if (!apiKeyData.isActive) {
        logger.error('Google Maps API key is not active');
        return null;
      }
      
      return apiKeyData.key;
    } catch (error) {
      logger.error('Error retrieving Google Maps API key:', error);
      return null;
    }
  }

  /**
   * Genera una chiave cache unica per un indirizzo
   */
  private static getCacheKey(input: string | Address | Coordinates): string {
    if (typeof input === 'string') {
      return crypto.createHash('md5').update(input.toLowerCase()).digest('hex');
    } else if ('lat' in input && 'lng' in input) {
      return crypto.createHash('md5').update(`${input.lat},${input.lng}`).digest('hex');
    } else {
      const addressString = `${input.street || ''} ${input.city} ${input.province} ${input.postalCode}`.toLowerCase();
      return crypto.createHash('md5').update(addressString).digest('hex');
    }
  }

  /**
   * Verifica se un elemento in cache è ancora valido
   */
  private static isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  /**
   * Geocoding con cache: converte un indirizzo in coordinate
   */
  static async geocode(address: string | Address): Promise<Coordinates | null> {
    try {
      const addressString = typeof address === 'string' 
        ? address 
        : `${address.street || ''} ${address.city}, ${address.province} ${address.postalCode}, Italia`;
      
      // Controlla cache
      const cacheKey = this.getCacheKey(addressString);
      const cached = this.geocodeCache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        logger.debug(`Geocode cache hit for: ${addressString}`);
        return cached.coordinates;
      }

      // Controlla cache persistente nel database
      const dbCache = await prisma.addressCache.findUnique({
        where: { addressHash: cacheKey }
      });

      if (dbCache && dbCache.expiresAt > new Date()) {
        const coordinates = { lat: dbCache.latitude, lng: dbCache.longitude };
        // Aggiorna cache in memoria
        this.geocodeCache.set(cacheKey, { coordinates, timestamp: Date.now() });
        logger.debug(`Geocode DB cache hit for: ${addressString}`);
        return coordinates;
      }

      // Chiamata API
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error('Cannot geocode without API key');
        return null;
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: addressString,
            key: apiKey,
            region: 'IT',
            language: 'it',
            components: 'country:IT' // Priorità a risultati italiani
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        const coordinates = {
          lat: location.lat,
          lng: location.lng
        };

        // Salva in cache memoria
        this.geocodeCache.set(cacheKey, { coordinates, timestamp: Date.now() });

        // Salva in cache database
        await prisma.addressCache.upsert({
          where: { addressHash: cacheKey },
          update: {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            formattedAddress: response.data.results[0].formatted_address,
            expiresAt: new Date(Date.now() + this.CACHE_TTL),
            lastUsedAt: new Date()
          },
          create: {
            addressHash: cacheKey,
            originalAddress: addressString,
            formattedAddress: response.data.results[0].formatted_address,
            latitude: coordinates.lat,
            longitude: coordinates.lng,
            expiresAt: new Date(Date.now() + this.CACHE_TTL),
            lastUsedAt: new Date()
          }
        });

        logger.info(`Geocoded address: ${addressString} -> ${coordinates.lat}, ${coordinates.lng}`);
        return coordinates;
      }

      logger.warn('Geocoding failed for address:', addressString);
      return null;
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Distance Matrix con cache: calcola distanza e tempo tra due punti
   * Ora include il traffico attuale se disponibile
   */
  static async calculateDistance(
    origin: Coordinates | string,
    destination: Coordinates | string,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      avoid?: ('tolls' | 'highways' | 'ferries')[];
      departureTime?: Date | 'now';
      trafficModel?: 'best_guess' | 'pessimistic' | 'optimistic';
    }
  ): Promise<DistanceResult | null> {
    try {
      // Converti in stringa per la cache
      const originStr = typeof origin === 'string' 
        ? origin 
        : `${origin.lat},${origin.lng}`;
      const destStr = typeof destination === 'string' 
        ? destination 
        : `${destination.lat},${destination.lng}`;
      
      const cacheKey = `${this.getCacheKey(originStr)}-${this.getCacheKey(destStr)}-${options?.mode || 'driving'}`;
      
      // Controlla cache (solo per richieste senza departure_time specifico)
      if (!options?.departureTime || options.departureTime === 'now') {
        const cached = this.distanceCache.get(cacheKey);
        if (cached && this.isCacheValid(cached.timestamp)) {
          logger.debug(`Distance cache hit for: ${originStr} -> ${destStr}`);
          return cached.result;
        }
      }

      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error('Cannot calculate distance without API key');
        return null;
      }

      // Prepara parametri
      const params: any = {
        origins: originStr,
        destinations: destStr,
        mode: options?.mode || 'driving',
        units: 'metric',
        language: 'it',
        region: 'IT',
        key: apiKey
      };

      // Aggiungi parametri opzionali
      if (options?.avoid && options.avoid.length > 0) {
        params.avoid = options.avoid.join('|');
      }

      if (options?.departureTime) {
        if (options.departureTime === 'now') {
          params.departure_time = 'now';
        } else {
          params.departure_time = Math.floor(options.departureTime.getTime() / 1000);
        }
        params.traffic_model = options.trafficModel || 'best_guess';
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        { params }
      );

      if (
        response.data.status === 'OK' &&
        response.data.rows.length > 0 &&
        response.data.rows[0].elements.length > 0
      ) {
        const element = response.data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          const result: DistanceResult = {
            distance: element.distance.value / 1000, // Converti da metri a km
            duration: Math.round(element.duration.value / 60), // Converti da secondi a minuti
            distanceText: element.distance.text,
            durationText: element.duration.text
          };

          // Se disponibile, aggiungi durata con traffico
          if (element.duration_in_traffic) {
            result.durationInTraffic = Math.round(element.duration_in_traffic.value / 60);
          }

          // Salva in cache solo se non è una richiesta con tempo specifico
          if (!options?.departureTime || options.departureTime === 'now') {
            this.distanceCache.set(cacheKey, { result, timestamp: Date.now() });
          }

          // Aggiorna lastUsedAt nel database per tracking
          await apiKeyService.testApiKey('GOOGLE_MAPS');
          
          logger.info(`Distance calculated: ${result.distanceText}, ${result.durationText}`);
          return result;
        }
      }

      logger.warn('Distance calculation failed');
      return null;
    } catch (error) {
      logger.error('Distance Matrix error:', error);
      return null;
    }
  }

  /**
   * NUOVO: Directions API per ottenere percorso dettagliato con itinerario
   */
  static async getDirections(
    origin: Coordinates | string,
    destination: Coordinates | string,
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      waypoints?: (Coordinates | string)[];
      optimizeWaypoints?: boolean;
      avoid?: ('tolls' | 'highways' | 'ferries')[];
      departureTime?: Date | 'now';
      alternatives?: boolean;
    }
  ): Promise<RouteResult | null> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error('Cannot get directions without API key');
        return null;
      }

      // Converti coordinate in stringhe
      const originStr = typeof origin === 'string' 
        ? origin 
        : `${origin.lat},${origin.lng}`;
      const destStr = typeof destination === 'string' 
        ? destination 
        : `${destination.lat},${destination.lng}`;

      // Prepara parametri
      const params: any = {
        origin: originStr,
        destination: destStr,
        mode: options?.mode || 'driving',
        units: 'metric',
        language: 'it',
        region: 'IT',
        key: apiKey
      };

      // Aggiungi waypoints se presenti
      if (options?.waypoints && options.waypoints.length > 0) {
        const waypointStrs = options.waypoints.map(wp => 
          typeof wp === 'string' ? wp : `${wp.lat},${wp.lng}`
        );
        params.waypoints = options.optimizeWaypoints 
          ? `optimize:true|${waypointStrs.join('|')}`
          : waypointStrs.join('|');
      }

      // Altri parametri opzionali
      if (options?.avoid && options.avoid.length > 0) {
        params.avoid = options.avoid.join('|');
      }

      if (options?.departureTime) {
        if (options.departureTime === 'now') {
          params.departure_time = 'now';
        } else {
          params.departure_time = Math.floor(options.departureTime.getTime() / 1000);
        }
      }

      if (options?.alternatives) {
        params.alternatives = true;
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        { params }
      );

      if (response.data.status === 'OK' && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0]; // Per ora prendiamo solo il primo tratto

        // Estrai gli step con istruzioni in italiano
        const steps: RouteStep[] = leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Rimuovi HTML
          distance: step.distance.value,
          duration: step.duration.value,
          startLocation: {
            lat: step.start_location.lat,
            lng: step.start_location.lng
          },
          endLocation: {
            lat: step.end_location.lat,
            lng: step.end_location.lng
          },
          maneuver: step.maneuver
        }));

        const result: RouteResult = {
          distance: leg.distance.value / 1000, // km
          duration: Math.round(leg.duration.value / 60), // minuti
          polyline: route.overview_polyline.points,
          bounds: {
            northeast: route.bounds.northeast,
            southwest: route.bounds.southwest
          },
          steps,
          warnings: route.warnings
        };

        // Aggiungi duration_in_traffic se disponibile
        if (leg.duration_in_traffic) {
          result.durationInTraffic = Math.round(leg.duration_in_traffic.value / 60);
        }

        // Se abbiamo ottimizzato i waypoints, aggiungi l'ordine
        if (options?.optimizeWaypoints && route.waypoint_order) {
          result.waypoints = route.waypoint_order;
        }

        logger.info(`Directions calculated: ${result.distance}km, ${result.duration}min`);
        return result;
      }

      logger.warn('Directions calculation failed');
      return null;
    } catch (error) {
      logger.error('Directions API error:', error);
      return null;
    }
  }

  /**
   * Reverse Geocoding: converte coordinate in indirizzo
   */
  static async reverseGeocode(coordinates: Coordinates): Promise<string | null> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error('Cannot reverse geocode without API key');
        return null;
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            latlng: `${coordinates.lat},${coordinates.lng}`,
            key: apiKey,
            language: 'it',
            region: 'IT'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }

      return null;
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Places Autocomplete: suggerimenti per indirizzi con sessione
   * Migliorato per ridurre costi usando sessiontoken
   */
  static async autocomplete(
    input: string, 
    options?: {
      sessionToken?: string;
      location?: Coordinates;
      radius?: number;
      types?: string[];
      componentRestrictions?: { country: string };
    }
  ): Promise<AutocompleteResult[]> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error('Cannot autocomplete without API key');
        return [];
      }

      const params: any = {
        input: input,
        key: apiKey,
        language: 'it',
        components: options?.componentRestrictions?.country 
          ? `country:${options.componentRestrictions.country}` 
          : 'country:it'
      };

      // Session token per raggruppare richieste e ridurre costi
      if (options?.sessionToken) {
        params.sessiontoken = options.sessionToken;
      }

      // Location bias per risultati vicini
      if (options?.location) {
        params.location = `${options.location.lat},${options.location.lng}`;
        params.radius = options.radius || 50000; // 50km default
      }

      // Tipi di luoghi
      if (options?.types && options.types.length > 0) {
        params.types = options.types.join('|');
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        { params }
      );

      if (response.data.status === 'OK') {
        return response.data.predictions.map((prediction: any) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
          types: prediction.types,
          distanceMeters: prediction.distance_meters
        }));
      }

      return [];
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Place Details: dettagli completi di un luogo
   * Ottimizzato per richiedere solo i campi necessari
   */
  static async getPlaceDetails(
    placeId: string,
    fields?: string[]
  ): Promise<PlaceDetails | null> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error('Cannot get place details without API key');
        return null;
      }

      // Campi default se non specificati
      const requestFields = fields && fields.length > 0 
        ? fields 
        : [
            'place_id',
            'formatted_address',
            'geometry',
            'address_components',
            'types',
            'name'
          ];

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            key: apiKey,
            language: 'it',
            region: 'IT',
            fields: requestFields.join(',')
          }
        }
      );

      if (response.data.status === 'OK' && response.data.result) {
        const place = response.data.result;
        
        // Estrai componenti indirizzo
        const addressComponents: any = {};
        if (place.address_components) {
          place.address_components.forEach((component: any) => {
            const types = component.types;
            if (types.includes('street_number')) {
              addressComponents.streetNumber = component.long_name;
            }
            if (types.includes('route')) {
              addressComponents.route = component.long_name;
            }
            if (types.includes('locality')) {
              addressComponents.locality = component.long_name;
            }
            if (types.includes('administrative_area_level_2')) {
              addressComponents.province = component.short_name;
            }
            if (types.includes('administrative_area_level_1')) {
              addressComponents.region = component.long_name;
            }
            if (types.includes('postal_code')) {
              addressComponents.postalCode = component.long_name;
            }
            if (types.includes('country')) {
              addressComponents.country = component.long_name;
            }
          });
        }

        const details: PlaceDetails = {
          placeId: place.place_id,
          formattedAddress: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          addressComponents,
          types: place.types || [],
          name: place.name
        };

        // Aggiungi campi opzionali se richiesti
        if (place.business_status) details.businessStatus = place.business_status;
        if (place.rating) details.rating = place.rating;
        if (place.user_ratings_total) details.userRatingsTotal = place.user_ratings_total;
        if (place.formatted_phone_number) details.phoneNumber = place.formatted_phone_number;
        if (place.website) details.website = place.website;
        if (place.opening_hours) details.openingHours = place.opening_hours;

        return details;
      }

      return null;
    } catch (error) {
      logger.error('Place details error:', error);
      return null;
    }
  }

  /**
   * NUOVO: Calcola distanze multiple in batch (più efficiente)
   * Utile per ordinare richieste per distanza
   */
  static async calculateMultipleDistances(
    origin: Coordinates | string,
    destinations: (Coordinates | string)[],
    options?: {
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      departureTime?: Date | 'now';
    }
  ): Promise<(DistanceResult | null)[]> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error('Cannot calculate distances without API key');
        return destinations.map(() => null);
      }

      // Google limita a 25 destinazioni per richiesta
      const maxDestinationsPerRequest = 25;
      const results: (DistanceResult | null)[] = [];

      // Dividi in batch se necessario
      for (let i = 0; i < destinations.length; i += maxDestinationsPerRequest) {
        const batch = destinations.slice(i, i + maxDestinationsPerRequest);
        
        const originStr = typeof origin === 'string' 
          ? origin 
          : `${origin.lat},${origin.lng}`;
        
        const destStrs = batch.map(dest => 
          typeof dest === 'string' ? dest : `${dest.lat},${dest.lng}`
        ).join('|');

        const params: any = {
          origins: originStr,
          destinations: destStrs,
          mode: options?.mode || 'driving',
          units: 'metric',
          language: 'it',
          region: 'IT',
          key: apiKey
        };

        if (options?.departureTime) {
          if (options.departureTime === 'now') {
            params.departure_time = 'now';
          } else {
            params.departure_time = Math.floor(options.departureTime.getTime() / 1000);
          }
          params.traffic_model = 'best_guess';
        }

        const response = await axios.get(
          'https://maps.googleapis.com/maps/api/distancematrix/json',
          { params }
        );

        if (response.data.status === 'OK' && response.data.rows.length > 0) {
          const elements = response.data.rows[0].elements;
          
          for (const element of elements) {
            if (element.status === 'OK') {
              const result: DistanceResult = {
                distance: element.distance.value / 1000,
                duration: Math.round(element.duration.value / 60),
                distanceText: element.distance.text,
                durationText: element.duration.text
              };

              if (element.duration_in_traffic) {
                result.durationInTraffic = Math.round(element.duration_in_traffic.value / 60);
              }

              results.push(result);
            } else {
              results.push(null);
            }
          }
        } else {
          // Se la richiesta fallisce, aggiungi null per ogni destinazione
          batch.forEach(() => results.push(null));
        }
      }

      logger.info(`Calculated distances for ${results.filter(r => r !== null).length}/${destinations.length} destinations`);
      return results;
    } catch (error) {
      logger.error('Multiple distance calculation error:', error);
      return destinations.map(() => null);
    }
  }

  /**
   * NUOVO: Validazione indirizzo (controlla se esiste e lo normalizza)
   */
  static async validateAddress(address: string | Address): Promise<{
    isValid: boolean;
    normalizedAddress?: string;
    coordinates?: Coordinates;
    confidence?: number;
  }> {
    try {
      const addressString = typeof address === 'string' 
        ? address 
        : `${address.street || ''} ${address.city}, ${address.province} ${address.postalCode}, Italia`;

      const apiKey = await this.getApiKey();
      if (!apiKey) {
        return { isValid: false };
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: addressString,
            key: apiKey,
            region: 'IT',
            language: 'it',
            components: 'country:IT'
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        
        // Calcola confidence basata sui tipi restituiti
        let confidence = 0.5; // Base
        if (result.types.includes('street_address')) confidence = 1.0;
        else if (result.types.includes('route')) confidence = 0.8;
        else if (result.types.includes('locality')) confidence = 0.6;
        
        return {
          isValid: true,
          normalizedAddress: result.formatted_address,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng
          },
          confidence
        };
      }

      return { isValid: false };
    } catch (error) {
      logger.error('Address validation error:', error);
      return { isValid: false };
    }
  }

  /**
   * Verifica se il servizio Google Maps è disponibile
   */
  static async isServiceAvailable(): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        logger.warn('Google Maps service unavailable: No API key configured');
        return false;
      }

      // Test con una geocodifica semplice
      const testResult = await this.geocode('Roma, Italia');
      return testResult !== null;
    } catch (error) {
      logger.error('Google Maps service check failed:', error);
      return false;
    }
  }

  /**
   * NUOVO: Pulisce la cache scaduta (da eseguire periodicamente)
   */
  static async cleanupCache(): Promise<void> {
    try {
      // Pulisci cache in memoria
      const now = Date.now();
      for (const [key, value] of this.geocodeCache.entries()) {
        if (!this.isCacheValid(value.timestamp)) {
          this.geocodeCache.delete(key);
        }
      }
      for (const [key, value] of this.distanceCache.entries()) {
        if (!this.isCacheValid(value.timestamp)) {
          this.distanceCache.delete(key);
        }
      }

      // Pulisci cache database
      await prisma.addressCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      logger.info('Cache cleanup completed');
    } catch (error) {
      logger.error('Cache cleanup error:', error);
    }
  }

  /**
   * NUOVO: Ottieni statistiche utilizzo API
   */
  static async getUsageStats(): Promise<{
    geocodeCacheHits: number;
    distanceCacheHits: number;
    apiCalls: number;
    savedApiCalls: number;
    estimatedSavings: number;
  }> {
    try {
      // Questo andrebbe implementato con un sistema di tracking più sofisticato
      // Per ora restituiamo dati di esempio
      return {
        geocodeCacheHits: this.geocodeCache.size,
        distanceCacheHits: this.distanceCache.size,
        apiCalls: 0, // Da implementare con tracking
        savedApiCalls: this.geocodeCache.size + this.distanceCache.size,
        estimatedSavings: (this.geocodeCache.size * 0.005 + this.distanceCache.size * 0.01) // Stima in EUR
      };
    } catch (error) {
      logger.error('Error getting usage stats:', error);
      return {
        geocodeCacheHits: 0,
        distanceCacheHits: 0,
        apiCalls: 0,
        savedApiCalls: 0,
        estimatedSavings: 0
      };
    }
  }
}

// Esporta per retrocompatibilità
export default GoogleMapsService;
