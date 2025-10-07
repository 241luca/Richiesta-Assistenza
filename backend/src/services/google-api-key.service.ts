import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class GoogleApiKeyService {
  /**
   * Ottiene le API Keys di Google dal database
   */
  static async getGoogleCredentials() {
    try {
      // Cerca prima Google Calendar API Key
      const calendarKey = await prisma.apiKey.findFirst({
        where: {
          service: 'google_calendar',
          isActive: true
        }
      });

      if (calendarKey) {
        // Se abbiamo una chiave specifica per Calendar, usiamola
        // Formato atteso: { clientId: '...', clientSecret: '...', apiKey: '...' }
        try {
          const credentials = JSON.parse(calendarKey.key);
          return {
            clientId: credentials.clientId,
            clientSecret: credentials.clientSecret,
            apiKey: credentials.apiKey || null
          };
        } catch (e) {
          // Se non è JSON, assumiamo sia solo l'API key
          return {
            clientId: null,
            clientSecret: null,
            apiKey: calendarKey.key
          };
        }
      }

      // Fallback: cerca Google Maps API Key (può essere usata per alcuni servizi Google)
      const mapsKey = await prisma.apiKey.findFirst({
        where: {
          service: 'google_maps',
          isActive: true
        }
      });

      if (mapsKey) {
        return {
          clientId: null,
          clientSecret: null,
          apiKey: mapsKey.key
        };
      }

      // Nessuna credenziale trovata nel database
      return {
        clientId: null,
        clientSecret: null,
        apiKey: null
      };
    } catch (error) {
      logger.error('Error fetching Google API credentials:', error);
      // Errore database - restituisci null
      return {
        clientId: null,
        clientSecret: null,
        apiKey: null
      };
    }
  }

  /**
   * Salva o aggiorna le credenziali Google Calendar
   */
  static async saveGoogleCalendarCredentials(credentials: {
    clientId: string;
    clientSecret: string;
    apiKey?: string;
  }) {
    try {
      const existingKey = await prisma.apiKey.findFirst({
        where: { service: 'google_calendar' }
      });

      const keyData = JSON.stringify(credentials);

      if (existingKey) {
        // Aggiorna la chiave esistente
        return await prisma.apiKey.update({
          where: { id: existingKey.id },
          data: {
            key: keyData,
            updatedAt: new Date()
          }
        });
      } else {
        // Crea una nuova chiave
        return await prisma.apiKey.create({
          data: {
            id: uuidv4(),
            service: 'google_calendar',
            key: keyData,
            name: 'Google Calendar OAuth Credentials',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }
    } catch (error) {
      logger.error('Error saving Google Calendar credentials:', error);
      throw error;
    }
  }

  /**
   * Verifica se abbiamo credenziali Google valide
   */
  static async hasValidCredentials(): Promise<boolean> {
    const credentials = await this.getGoogleCredentials();
    
    // Per OAuth abbiamo bisogno di clientId e clientSecret
    if (credentials.clientId && credentials.clientSecret) {
      return true;
    }

    // Per alcuni servizi basta l'API Key
    if (credentials.apiKey) {
      return true;
    }

    return false;
  }
}
