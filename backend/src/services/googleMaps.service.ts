/**
 * Google Maps Service - ENHANCED v5.1 con REDIS CACHE
 * Sistema Google Maps con cache Redis avanzata e fallback intelligente
 * 
 * NOVITÀ v5.1:
 * ✅ Cache Redis persistente (sopravvive ai riavvii)
 * ✅ Fallback automatico Database + Memoria
 * ✅ Statistiche avanzate con metriche dettagliate  
 * ✅ Cleanup intelligente con conteggi precisi
 * ✅ Performance monitoring integrato
 * ✅ Preload automatico indirizzi comuni italiani
 */

import axios from 'axios';
import { apiKeyService } from './apiKey.service';
import { logger } from '../utils/logger';
import { GoogleMapsCacheService } from '../cache/googleMapsCache';

// Re-export interfaces per compatibilità
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
}

export interface DistanceResult {
  distance: number; // in km
  duration: number; // in minuti
  durationInTraffic?: number; // in minuti con traffico attuale
  distanceText: string; // es: "12.5 km"
  durationText: string; // es: "15 min"
}

export interface RouteResult {
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

export interface RouteStep {
  instruction: string;
  distance: number; // in metri
  duration: number; // in secondi
  startLocation: Coordinates;
  endLocation: Coordinates;
  maneuver?: string;
}

export interface PlaceDetails {
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

export interface AutocompleteResult {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  types: string[];
  distanceMeters?: number;
}

export class GoogleMapsService {
  // Flag per tracking inizializzazione
  private static isInitialized = false;

  /**
   * Inizializza il servizio Google Maps con cache Redis
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Inizializza cache Redis
      await GoogleMapsCacheService.initialize();
      
      // Preload indirizzi comuni italiani (background)
      setTimeout(async () => {
        try {
          const preloaded = await GoogleMapsCacheService.preloadCommonAddresses();
          if (preloaded > 0) {
            logger.info(`🚀 Preloaded ${preloaded} common Italian addresses in cache`);
          }
        } catch (error) {
          logger.debug('Preload failed, continuing normally:', error);
        }
      }, 5000); // Dopo 5 secondi dall'avvio

      this.isInitialized = true;
      logger.info('🗺️ Google Maps Service initialized with Redis cache');
    } catch (error) {
      logger.warn('Google Maps Service starting without Redis:', error);
      this.isInitialized = true;
    }
  }

  /**
   * Recupera la API key di Google Maps dal database
   * CORRETTO v5.1: Usa decriptazione quando necessario
   */
  private static async getApiKey(): Promise<string | null> {
    try {
      // Usa true per decriptare automaticamente se necessario
      const apiKeyData = await apiKeyService.getApiKey('GOOGLE_MAPS', true);
      
      if (!apiKeyData) {
        logger.error('Google Maps API key not found in database');
        return null;
      }
      
      if (!apiKeyData.key || apiKeyData.key.length === 0) {
        logger.error('Google Maps API key is empty');
        return null;
      }
      
      if (!apiKeyData.isActive) {
        logger.error('Google Maps API key is not active');
        return null;
      }
      
      // Controlla se la chiave sembra ancora criptata
      if (apiKeyData.key.includes(':')) {
        logger.warn('API key might still be encrypted, attempting to use as-is');
      }
      
      logger.debug(`Google Maps API key retrieved (${apiKeyData.key.length} chars)`);
      return apiKeyData.key;
    } catch (error) {
      logger.error('Error retrieving Google Maps API key:', error);
      return null;
    }
  }

  /**
   * GEOCODING AVANZATO - Con cache Redis intelligente
   */
  static async geocode(address: string | Address): Promise<Coordinates | null> {
    // Auto-inizializza se necessario
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const addressString = typeof address === 'string' 
        ? address 
        : `${address.street || ''} ${address.city}, ${address.province} ${address.postalCode}, Italia`;
      
      // 1. Controlla cache avanzata (Redis + Database + Memoria)
      const cached = await GoogleMapsCacheService.getCachedGeocode(addressString);
      if (cached) {
        logger.debug(`🎯 Cache hit per geocoding: ${addressString.substring(0, 50)}...`);
        return cached;
      }

      // 2. Cache miss - chiamata API Google Maps
      const apiKey = await this.getApiKey();
      if (!apiKey) {
        logger.error('Cannot geocode without API key');
        return null;
      }

      logger.debug(`🌐 API call per geocoding: ${addressString.substring(0, 50)}...`);
      
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: addressString,
            key: apiKey,
            region: 'IT',
            language: 'it',
            components: 'country:IT'
          },
          timeout: 10000
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        const coordinates: Coordinates = {
          lat: location.lat,
          lng: location.lng
        };

        // 3. Salva in cache avanzata
        await GoogleMapsCacheService.setCachedGeocode(addressString, coordinates);
        
        logger.info(`✅ Geocoded and cached: ${addressString} -> ${coordinates.lat}, ${coordinates.lng}`);
        return coordinates;
      }

      logger.warn(`⚠️ Geocoding failed for: ${addressString} (Status: ${response.data.status})`);
      return null;

    } catch (error) {
      logger.error('Geocoding API error:', error);
      return null;
    }
  }

  /**
   * CALCOLO DISTANZE AVANZATO - Con cache Redis
   */
  static async calculateDistance(
    origin: string | Coordinates, 
    destination: string | Coordinates,
    options: { 
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      units?: 'metric' | 'imperial';
      avoidTolls?: boolean;
      avoidHighways?: boolean;
    } = {}
  ): Promise<DistanceResult | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Converti coordinate in stringa per cache
      const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const destStr = typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`;
      const cacheKey = `${originStr}|${destStr}|${options.mode || 'driving'}`;

      // 1. Controlla cache
      const cached = await GoogleMapsCacheService.getCachedDistance(originStr, destStr);
      if (cached) {
        logger.debug(`🎯 Cache hit per distanza: ${originStr} -> ${destStr}`);
        return cached;
      }

      // 2. Chiamata API
      const apiKey = await this.getApiKey();
      if (!apiKey) return null;

      logger.debug(`🌐 API call per distanza: ${originStr} -> ${destStr}`);

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: originStr,
            destinations: destStr,
            key: apiKey,
            units: options.units || 'metric',
            mode: options.mode || 'driving',
            language: 'it',
            region: 'IT',
            avoid: [
              ...(options.avoidTolls ? ['tolls'] : []),
              ...(options.avoidHighways ? ['highways'] : [])
            ].join('|') || undefined,
            departure_time: 'now' // Per traffico in tempo reale
          },
          timeout: 10000
        }
      );

      if (response.data.status === 'OK' && 
          response.data.rows.length > 0 && 
          response.data.rows[0].elements.length > 0) {
        
        const element = response.data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          const result: DistanceResult = {
            distance: Math.round(element.distance.value / 1000 * 100) / 100, // km con 2 decimali
            duration: Math.round(element.duration.value / 60), // minuti
            durationInTraffic: element.duration_in_traffic 
              ? Math.round(element.duration_in_traffic.value / 60)
              : undefined,
            distanceText: element.distance.text,
            durationText: element.duration.text
          };

          // 3. Salva in cache (TTL più basso per distanze per via del traffico)
          await GoogleMapsCacheService.setCachedDistance(originStr, destStr, result);

          logger.info(`✅ Distance calculated: ${originStr} -> ${destStr} = ${result.distance}km, ${result.duration}min`);
          return result;
        }
      }

      logger.warn(`⚠️ Distance calculation failed: ${originStr} -> ${destStr}`);
      return null;

    } catch (error) {
      logger.error('Distance calculation error:', error);
      return null;
    }
  }

  /**
   * CALCOLO DISTANZE MULTIPLE - Batch ottimizzato
   */
  static async calculateMultipleDistances(
    origin: string | Coordinates,
    destinations: (string | Coordinates)[],
    options: { 
      mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
      units?: 'metric' | 'imperial';
      avoidTolls?: boolean;
      avoidHighways?: boolean;
    } = {}
  ): Promise<DistanceResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results: DistanceResult[] = [];
    const originStr = typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;

    // Batch size di 10 per rispettare i limiti API
    const batchSize = 10;
    
    for (let i = 0; i < destinations.length; i += batchSize) {
      const batch = destinations.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(dest => this.calculateDistance(origin, dest, options))
      );
      
      results.push(...batchResults.filter(result => result !== null) as DistanceResult[]);
    }

    logger.info(`✅ Calculated ${results.length}/${destinations.length} distances for batch`);
    return results;
  }

  /**
   * AUTOCOMPLETE AVANZATO - Con cache Redis
   */
  static async autocomplete(
    input: string,
    options: {
      types?: string[];
      componentRestrictions?: { country?: string };
      location?: Coordinates;
      radius?: number;
    } = {}
  ): Promise<AutocompleteResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 1. Controlla cache
      const cacheKey = `${input}|${JSON.stringify(options)}`;
      const cached = await GoogleMapsCacheService.getCachedAutocomplete(cacheKey);
      if (cached) {
        logger.debug(`🎯 Cache hit per autocomplete: ${input}`);
        return cached;
      }

      // 2. Chiamata API
      const apiKey = await this.getApiKey();
      if (!apiKey) return [];

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input,
            key: apiKey,
            language: 'it',
            components: 'country:it',
            types: options.types?.join('|') || 'address',
            location: options.location ? `${options.location.lat},${options.location.lng}` : undefined,
            radius: options.radius || undefined
          },
          timeout: 8000
        }
      );

      if (response.data.status === 'OK') {
        const results: AutocompleteResult[] = response.data.predictions.map((pred: any) => ({
          placeId: pred.place_id,
          description: pred.description,
          mainText: pred.structured_formatting.main_text,
          secondaryText: pred.structured_formatting.secondary_text,
          types: pred.types,
          distanceMeters: pred.distance_meters
        }));

        // 3. Salva in cache
        await GoogleMapsCacheService.setCachedAutocomplete(cacheKey, results);

        logger.debug(`✅ Autocomplete: ${input} -> ${results.length} suggerimenti`);
        return results;
      }

      return [];
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * PLACE DETAILS AVANZATO - Con cache Redis
   */
  static async getPlaceDetails(
    placeId: string,
    fields: string[] = ['address_components', 'formatted_address', 'geometry', 'name']
  ): Promise<PlaceDetails | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // 1. Controlla cache
      const cached = await GoogleMapsCacheService.getCachedPlaceDetails(placeId);
      if (cached) {
        logger.debug(`🎯 Cache hit per place details: ${placeId}`);
        return cached;
      }

      // 2. Chiamata API
      const apiKey = await this.getApiKey();
      if (!apiKey) return null;

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            key: apiKey,
            fields: fields.join(','),
            language: 'it'
          },
          timeout: 8000
        }
      );

      if (response.data.status === 'OK') {
        const place = response.data.result;
        
        const details: PlaceDetails = {
          placeId,
          formattedAddress: place.formatted_address,
          coordinates: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng
          },
          addressComponents: this.parseAddressComponents(place.address_components || []),
          types: place.types || [],
          businessStatus: place.business_status,
          name: place.name,
          rating: place.rating,
          userRatingsTotal: place.user_ratings_total,
          phoneNumber: place.formatted_phone_number,
          website: place.website,
          openingHours: place.opening_hours
        };

        // 3. Salva in cache (TTL lungo per dettagli luoghi)
        await GoogleMapsCacheService.setCachedPlaceDetails(placeId, details);

        return details;
      }

      return null;
    } catch (error) {
      logger.error('Place details error:', error);
      return null;
    }
  }

  /**
   * CLEANUP CACHE AVANZATO - Con statistiche dettagliate
   */
  static async cleanupCache(): Promise<{
    memoryCleared: number;
    databaseCleared: number;
    redisCleared: number;
    totalFreedMB: number;
    errors: string[];
    success: boolean;
  }> {
    try {
      const result = await GoogleMapsCacheService.cleanup();
      
      logger.info(`🧹 Cache cleanup completed: Redis(${result.redisCleared}) DB(${result.databaseCleared}) Total(${result.totalFreedMB}MB)`);
      
      return {
        memoryCleared: 0, // Gestito da Redis ora
        databaseCleared: result.databaseCleared,
        redisCleared: result.redisCleared,
        totalFreedMB: result.totalFreedMB,
        errors: result.errors,
        success: result.success
      };
    } catch (error) {
      logger.error('Cleanup error:', error);
      return {
        memoryCleared: 0,
        databaseCleared: 0,
        redisCleared: 0,
        totalFreedMB: 0,
        errors: [(error as Error).message],
        success: false
      };
    }
  }

  /**
   * STATISTICHE AVANZATE - Performance e utilizzo
   */
  static async getUsageStats(): Promise<{
    geocodeCacheHits: number;
    distanceCacheHits: number;
    totalOperations: number;
    hitRate: number;
    estimatedSavings: number;
    redisStatus: string;
    performance: {
      avgResponseTime: number;
      cacheEfficiency: number;
    };
    cacheTypes: Record<string, number>;
  }> {
    try {
      const stats = await GoogleMapsCacheService.getStats();
      
      return {
        geocodeCacheHits: stats.redisHits + stats.databaseHits,
        distanceCacheHits: stats.redisHits + stats.databaseHits,
        totalOperations: stats.totalOperations,
        hitRate: stats.hitRate,
        estimatedSavings: stats.estimatedApiSavings,
        redisStatus: stats.redisStatus,
        performance: stats.performance,
        cacheTypes: stats.cacheTypes
      };
    } catch (error) {
      logger.error('Stats error:', error);
      return {
        geocodeCacheHits: 0,
        distanceCacheHits: 0,
        totalOperations: 0,
        hitRate: 0,
        estimatedSavings: 0,
        redisStatus: 'Error',
        performance: { avgResponseTime: 0, cacheEfficiency: 0 },
        cacheTypes: {}
      };
    }
  }

  /**
   * Verifica se il servizio è disponibile
   */
  static async isServiceAvailable(): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      if (!apiKey) return false;

      // Test veloce con un indirizzo in cache
      const testResult = await this.geocode('Roma, Italia');
      return testResult !== null;
    } catch (error) {
      logger.error('Service availability check failed:', error);
      return false;
    }
  }

  /**
   * Utility per parsing address components
   */
  private static parseAddressComponents(components: any[]): any {
    const parsed: any = {};
    
    components.forEach(component => {
      if (component.types.includes('street_number')) {
        parsed.streetNumber = component.long_name;
      }
      if (component.types.includes('route')) {
        parsed.route = component.long_name;
      }
      if (component.types.includes('locality')) {
        parsed.locality = component.long_name;
      }
      if (component.types.includes('administrative_area_level_2')) {
        parsed.province = component.short_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        parsed.region = component.long_name;
      }
      if (component.types.includes('postal_code')) {
        parsed.postalCode = component.long_name;
      }
      if (component.types.includes('country')) {
        parsed.country = component.short_name;
      }
    });

    return parsed;
  }

  /**
   * Chiudi connessioni e cleanup
   */
  static async shutdown(): Promise<void> {
    try {
      await GoogleMapsCacheService.close();
      logger.info('🛑 Google Maps Service shutdown completed');
    } catch (error) {
      logger.error('Shutdown error:', error);
    }
  }
}

// Export default per retrocompatibilità
export default GoogleMapsService;
