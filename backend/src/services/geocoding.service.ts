/**
 * Geocoding Service
 * Gestisce le operazioni di geocoding utilizzando Google Maps API
 * AGGIORNATO v5.1: Usa API keys dal database
 */

import { Client, Language } from '@googlemaps/google-maps-services-js';
import { redis, cache } from '../config/redis';
import { logger } from '../utils/logger';
import { apiKeyService } from './apiKey.service';

const client = new Client({});

// Cache TTL in secondi (30 giorni)
const CACHE_TTL = 30 * 24 * 60 * 60;

export class GeocodingService {
  private apiKey: string | null = null;

  constructor() {
    // API key verrà caricata dal DB quando necessaria
  }

  /**
   * Ottieni API key dal database
   * CORRETTO: Gestisce meglio le chiavi decriptate
   */
  private async getApiKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    try {
      // Il secondo parametro 'true' indica di decriptare se necessario
      const apiKeyData = await apiKeyService.getApiKey('GOOGLE_MAPS', true);
      
      if (!apiKeyData) {
        logger.error('GOOGLE_MAPS key not found in database');
        throw new Error('Google Maps API key not found in database');
      }
      
      // Verifica che la chiave sia presente
      if (!apiKeyData.key || apiKeyData.key.length === 0) {
        logger.error('GOOGLE_MAPS key is empty');
        throw new Error('Google Maps API key is empty');
      }
      
      // Se la chiave sembra ancora criptata (contiene ':'), c'è un problema
      if (apiKeyData.key.includes(':')) {
        logger.error('API key seems to still be encrypted:', apiKeyData.key.substring(0, 20) + '...');
        throw new Error('Google Maps API key decryption failed');
      }
      
      this.apiKey = apiKeyData.key;
      logger.debug(`Google Maps API key loaded successfully (${this.apiKey.length} chars)`);
      return this.apiKey;
    } catch (error) {
      logger.error('Error loading Google Maps API key from database:', error);
      throw new Error('Failed to load Google Maps API key - check database configuration');
    }
  }

  /**
   * Converte un indirizzo in coordinate geografiche
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      // Check cache first
      const cacheKey = `geocode:address:${address}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info(`Geocoding cache hit for address: ${address}`);
        return JSON.parse(cached);
      }

      // Make API request
      const apiKey = await this.getApiKey();
      const response = await client.geocode({
        params: {
          address,
          key: apiKey,
          language: Language.it, // Italiano per indirizzi italiani
          region: 'IT', // Restrizione geografica a Italia
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        const result = { lat: location.lat, lng: location.lng };
        
        // Cache the result
        await cache.set(cacheKey, result, CACHE_TTL);
        
        logger.info(`Geocoded address: ${address} -> ${result.lat}, ${result.lng}`);
        return result;
      }

      logger.warn(`No results found for address: ${address}`);
      return null;
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Converte coordinate geografiche in un indirizzo
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      // Check cache first
      const cacheKey = `geocode:reverse:${lat}:${lng}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info(`Reverse geocoding cache hit for: ${lat}, ${lng}`);
        return cached;
      }

      // Make API request
      const apiKey = await this.getApiKey();
      const response = await client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: apiKey,
          language: Language.it,
        },
      });

      if (response.data.results && response.data.results.length > 0) {
        const address = response.data.results[0].formatted_address;
        
        // Cache the result
        await cache.set(cacheKey, address, CACHE_TTL);
        
        logger.info(`Reverse geocoded: ${lat}, ${lng} -> ${address}`);
        return address;
      }

      logger.warn(`No results found for coordinates: ${lat}, ${lng}`);
      return null;
    } catch (error) {
      logger.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Calcola la distanza tra due punti geografici (in km)
   */
  async calculateDistance(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{ distance: number; duration: number } | null> {
    try {
      // Check cache first
      const cacheKey = `distance:${origin.lat}:${origin.lng}:${destination.lat}:${destination.lng}`;
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info('Distance cache hit');
        return JSON.parse(cached);
      }

      // Make API request
      const apiKey = await this.getApiKey();
      const response = await client.distancematrix({
        params: {
          origins: [{ lat: origin.lat, lng: origin.lng }],
          destinations: [{ lat: destination.lat, lng: destination.lng }],
          key: apiKey,
          language: Language.it,
          units: 'metric',
        },
      });

      if (
        response.data.rows &&
        response.data.rows.length > 0 &&
        response.data.rows[0].elements &&
        response.data.rows[0].elements.length > 0
      ) {
        const element = response.data.rows[0].elements[0];
        
        if (element.status === 'OK' && element.distance && element.duration) {
          const result = {
            distance: element.distance.value / 1000, // Convert to km
            duration: element.duration.value / 60, // Convert to minutes
          };
          
          // Cache the result for 1 day (traffic changes)
          await cache.set(cacheKey, result, 24 * 60 * 60);
          
          logger.info(`Distance calculated: ${result.distance} km, ${result.duration} min`);
          return result;
        }
      }

      logger.warn('No distance results found');
      return null;
    } catch (error) {
      logger.error('Distance calculation error:', error);
      return null;
    }
  }

  /**
   * Geocode automatico per una richiesta di assistenza
   */
  async geocodeRequest(address: string, city: string, province: string, postalCode: string): Promise<{ lat: number; lng: number } | null> {
    // Costruisce l'indirizzo completo per il geocoding
    const fullAddress = `${address}, ${postalCode} ${city} ${province}, Italia`;
    return this.geocodeAddress(fullAddress);
  }

  /**
   * Valida un CAP italiano
   */
  validateItalianPostalCode(postalCode: string): boolean {
    const regex = /^[0-9]{5}$/;
    return regex.test(postalCode);
  }

  /**
   * Valida una provincia italiana (sigla)
   */
  validateItalianProvince(province: string): boolean {
    const provinces = [
      'AG', 'AL', 'AN', 'AO', 'AR', 'AP', 'AT', 'AV', 'BA', 'BT', 'BL', 'BN', 'BG', 'BI', 'BO', 'BZ', 'BS', 'BR',
      'CA', 'CL', 'CB', 'CI', 'CE', 'CT', 'CZ', 'CH', 'CO', 'CS', 'CR', 'KR', 'CN', 'EN', 'FM', 'FE', 'FI', 'FG',
      'FC', 'FR', 'GE', 'GO', 'GR', 'IM', 'IS', 'SP', 'AQ', 'LT', 'LE', 'LC', 'LI', 'LO', 'LU', 'MC', 'MN', 'MS',
      'MT', 'ME', 'MI', 'MO', 'MB', 'NA', 'NO', 'NU', 'OT', 'OR', 'PD', 'PA', 'PR', 'PV', 'PG', 'PU', 'PE', 'PC',
      'PI', 'PT', 'PN', 'PZ', 'PO', 'RG', 'RA', 'RC', 'RE', 'RI', 'RN', 'RM', 'RO', 'SA', 'VS', 'SS', 'SV', 'SI',
      'SR', 'SO', 'TA', 'TE', 'TR', 'TO', 'OG', 'TP', 'TN', 'TV', 'TS', 'UD', 'VA', 'VE', 'VB', 'VC', 'VR', 'VV',
      'VI', 'VT', 'SU', // Sud Sardegna
    ];
    return provinces.includes(province.toUpperCase());
  }

  /**
   * Trova professionisti vicini a una posizione
   */
  async findNearbyProfessionals(
    location: { lat: number; lng: number },
    maxDistanceKm: number,
    professionals: Array<{ id: string; lat: number; lng: number }>
  ): Promise<Array<{ id: string; distance: number; duration: number }>> {
    const results = [];

    for (const professional of professionals) {
      const distanceData = await this.calculateDistance(
        location,
        { lat: professional.lat, lng: professional.lng }
      );

      if (distanceData && distanceData.distance <= maxDistanceKm) {
        results.push({
          id: professional.id,
          distance: distanceData.distance,
          duration: distanceData.duration,
        });
      }
    }

    // Ordina per distanza
    results.sort((a, b) => a.distance - b.distance);
    
    return results;
  }

  /**
   * Ottimizza il percorso per visitare più punti
   */
  async optimizeRoute(
    origin: { lat: number; lng: number },
    waypoints: Array<{ lat: number; lng: number }>,
    destination?: { lat: number; lng: number }
  ): Promise<any> {
    try {
      const apiKey = await this.getApiKey();
      const response = await client.directions({
        params: {
          origin,
          destination: destination || origin, // Se non c'è destinazione, torna all'origine
          waypoints,
          optimizeWaypoints: true,
          key: apiKey,
          language: Language.it,
        },
      });

      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        return {
          totalDistance: route.legs.reduce((acc, leg) => acc + (leg.distance?.value || 0), 0) / 1000, // km
          totalDuration: route.legs.reduce((acc, leg) => acc + (leg.duration?.value || 0), 0) / 60, // min
          waypoints: response.data.geocoded_waypoints,
          legs: route.legs,
          optimizedOrder: response.data.routes[0].waypoint_order,
        };
      }

      return null;
    } catch (error) {
      logger.error('Route optimization error:', error);
      return null;
    }
  }

  /**
   * Pulisce la cache del geocoding (per admin)
   */
  async clearCache(): Promise<void> {
    // Pulisce tutti i pattern di cache geocoding
    await cache.delPattern('geocode:*');
    await cache.delPattern('distance:*');
    
    logger.info('Geocoding cache cleared');
  }

  /**
   * Geocodifica un indirizzo completo già formattato (es. da Google Places)
   * Usa lo stesso metodo di geocodeAddress ma rende più chiaro l'intento
   */
  async geocodeFullAddress(fullAddress: string): Promise<{ lat: number; lng: number } | null> {
    logger.debug(`Geocoding full formatted address: ${fullAddress}`);
    return this.geocodeAddress(fullAddress);
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();
