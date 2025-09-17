/**
 * Google Maps Service
 * Servizio per interazioni con Google Maps API
 * USA LE API KEY DAL DATABASE
 */

import axios from 'axios';
import { apiKeyService } from './apiKey.service';
import { logger } from '../utils/logger';

interface Coordinates {
  lat: number;
  lng: number;
}

interface DistanceResult {
  distance: number; // in km
  duration: number; // in minuti
}

export class GoogleMapsService {
  
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
   * Geocoding: converte un indirizzo in coordinate
   */
  static async geocode(address: string): Promise<Coordinates | null> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        logger.error('Cannot geocode without API key');
        return null;
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/geocode/json',
        {
          params: {
            address: address,
            key: apiKey,
            region: 'IT' // Priorità risultati italiani
          }
        }
      );

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }

      logger.warn('Geocoding failed for address:', address);
      return null;
    } catch (error) {
      logger.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Distance Matrix: calcola distanza e tempo tra due punti
   */
  static async calculateDistance(
    origin: Coordinates,
    destination: Coordinates
  ): Promise<DistanceResult | null> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        logger.error('Cannot calculate distance without API key');
        return null;
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/distancematrix/json',
        {
          params: {
            origins: `${origin.lat},${origin.lng}`,
            destinations: `${destination.lat},${destination.lng}`,
            mode: 'driving',
            units: 'metric',
            language: 'it',
            key: apiKey
          }
        }
      );

      if (
        response.data.status === 'OK' &&
        response.data.rows.length > 0 &&
        response.data.rows[0].elements.length > 0
      ) {
        const element = response.data.rows[0].elements[0];
        
        if (element.status === 'OK') {
          // Aggiorna lastUsedAt nel database
          await apiKeyService.testApiKey('GOOGLE_MAPS');
          
          return {
            distance: element.distance.value / 1000, // Converti da metri a km
            duration: Math.round(element.duration.value / 60) // Converti da secondi a minuti
          };
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
            language: 'it'
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
   * Places Autocomplete: suggerimenti per indirizzi
   */
  static async autocomplete(input: string, sessionToken?: string): Promise<any[]> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        logger.error('Cannot autocomplete without API key');
        return [];
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/autocomplete/json',
        {
          params: {
            input: input,
            key: apiKey,
            language: 'it',
            components: 'country:it',
            sessiontoken: sessionToken
          }
        }
      );

      if (response.data.status === 'OK') {
        return response.data.predictions;
      }

      return [];
    } catch (error) {
      logger.error('Autocomplete error:', error);
      return [];
    }
  }

  /**
   * Place Details: dettagli completi di un luogo
   */
  static async getPlaceDetails(placeId: string): Promise<any | null> {
    try {
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        logger.error('Cannot get place details without API key');
        return null;
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/place/details/json',
        {
          params: {
            place_id: placeId,
            key: apiKey,
            language: 'it',
            fields: 'formatted_address,geometry,address_components'
          }
        }
      );

      if (response.data.status === 'OK') {
        return response.data.result;
      }

      return null;
    } catch (error) {
      logger.error('Place details error:', error);
      return null;
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
}
