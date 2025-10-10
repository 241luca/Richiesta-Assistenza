/**
 * WhatsApp Validation Service
 * Servizio per validazione e formattazione numeri WhatsApp
 * FASE 1 - Correzioni Urgenti: Sicurezza e Validazione
 */

import logger from '../utils/logger';
import { prisma } from '../config/database';

export interface ValidatedPhoneNumber {
  isValid: boolean;
  formatted: string;
  country: string;
  hasWhatsApp?: boolean;
  error?: string;
}

export interface ValidationOptions {
  checkWhatsApp?: boolean;
  country?: string;
  strict?: boolean;
}

export class WhatsAppValidationService {
  
  // Prefissi internazionali comuni
  private countryPrefixes = {
    'IT': '39',    // Italia
    'US': '1',     // USA
    'UK': '44',    // Regno Unito
    'FR': '33',    // Francia
    'DE': '49',    // Germania
    'ES': '34',    // Spagna
    'CH': '41',    // Svizzera
    'AT': '43',    // Austria
    'PT': '351',   // Portogallo
    'NL': '31',    // Olanda
    'BE': '32',    // Belgio
  };
  
  /**
   * Valida e formatta un numero di telefono per WhatsApp
   */
  async validatePhoneNumber(
    number: string, 
    options: ValidationOptions = {}
  ): Promise<ValidatedPhoneNumber> {
    try {
      logger.info(`🔍 Validazione numero: ${number}`);
      
      // 1. Pulizia iniziale - rimuovi tutti i caratteri non numerici
      let cleanNumber = number.replace(/\D/g, '');
      
      // 2. Rimuovi zeri iniziali (comuni negli input utente)
      cleanNumber = cleanNumber.replace(/^0+/, '');
      
      // 3. Validazione lunghezza minima
      if (cleanNumber.length < 7) {
        logger.warn(`❌ Numero troppo corto: ${cleanNumber}`);
        return {
          isValid: false,
          formatted: '',
          country: '',
          error: 'Numero troppo corto. Minimo 7 cifre richieste.'
        };
      }
      
      // 4. Validazione lunghezza massima
      if (cleanNumber.length > 15) {
        logger.warn(`❌ Numero troppo lungo: ${cleanNumber}`);
        return {
          isValid: false,
          formatted: '',
          country: '',
          error: 'Numero troppo lungo. Massimo 15 cifre.'
        };
      }
      
      // 5. Determina il paese e aggiungi prefisso se necessario
      const country = options.country || 'IT'; // Default Italia
      const countryPrefix = this.countryPrefixes[country] || '39';
      
      // Se il numero non inizia con un prefisso internazionale, aggiungi quello del paese
      if (!this.hasInternationalPrefix(cleanNumber)) {
        // Per l'Italia, se il numero ha 10 cifre è probabilmente senza prefisso
        if (country === 'IT' && cleanNumber.length === 10) {
          cleanNumber = countryPrefix + cleanNumber;
        } else if (cleanNumber.length <= 10) {
          // Per altri paesi o numeri corti, aggiungi prefisso
          cleanNumber = countryPrefix + cleanNumber;
        }
      }
      
      // 6. Validazione formato specifico per paese
      if (options.strict) {
        const isValidFormat = this.validateCountryFormat(cleanNumber, country);
        if (!isValidFormat) {
          return {
            isValid: false,
            formatted: cleanNumber,
            country,
            error: `Formato non valido per ${country}`
          };
        }
      }
      
      // 7. Formattazione finale per WhatsApp (senza + iniziale)
      const formatted = cleanNumber;
      
      // 8. Verifica se il numero ha WhatsApp (opzionale)
      let hasWhatsApp = undefined;
      if (options.checkWhatsApp) {
        hasWhatsApp = await this.checkWhatsAppStatus(formatted);
      }
      
      logger.info(`✅ Numero validato: ${formatted} (${country})`);
      
      return {
        isValid: true,
        formatted,
        country,
        hasWhatsApp
      };
      
    } catch (error: any) {
      logger.error('❌ Errore validazione numero:', error);
      return {
        isValid: false,
        formatted: '',
        country: '',
        error: error.message || 'Errore durante la validazione'
      };
    }
  }
  
  /**
   * Verifica se un numero ha un prefisso internazionale
   */
  private hasInternationalPrefix(number: string): boolean {
    // Controlla se inizia con un prefisso internazionale noto
    for (const prefix of Object.values(this.countryPrefixes)) {
      if (number.startsWith(prefix)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Valida il formato specifico per paese
   */
  private validateCountryFormat(number: string, country: string): boolean {
    switch(country) {
      case 'IT':
        // Italia: prefisso 39 + 10 cifre
        return /^39\d{10}$/.test(number);
      
      case 'US':
        // USA: prefisso 1 + 10 cifre
        return /^1\d{10}$/.test(number);
      
      case 'UK':
        // UK: prefisso 44 + 10 cifre
        return /^44\d{10}$/.test(number);
      
      default:
        // Validazione generica: almeno 10 cifre totali
        return number.length >= 10 && number.length <= 15;
    }
  }
  
  /**
   * Verifica se un numero ha WhatsApp attivo
   * (Implementazione futura con WPPConnect)
   */
  async checkWhatsAppStatus(phoneNumber: string): Promise<boolean> {
    try {
      // TODO: Implementare con WPPConnect quando il client è disponibile
      // const status = await wppClient.checkNumberStatus(phoneNumber + '@c.us');
      // return status.canReceiveMessage;
      
      // Per ora ritorna true di default
      logger.info(`📱 Check WhatsApp per ${phoneNumber} - assumo attivo`);
      return true;
      
    } catch (error) {
      logger.error('Errore check WhatsApp status:', error);
      return false;
    }
  }
  
  /**
   * Valida multipli numeri in batch
   */
  async validateBatch(
    numbers: string[], 
    options: ValidationOptions = {}
  ): Promise<ValidatedPhoneNumber[]> {
    const results: ValidatedPhoneNumber[] = [];
    
    for (const number of numbers) {
      const result = await this.validatePhoneNumber(number, options);
      results.push(result);
      
      // Piccolo delay per evitare rate limiting se checkWhatsApp è attivo
      if (options.checkWhatsApp) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }
  
  /**
   * Estrae e valida numeri da un testo
   */
  extractPhoneNumbersFromText(text: string): string[] {
    // Pattern per trovare possibili numeri di telefono nel testo
    const patterns = [
      /\+?\d{1,4}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,4}[\s.-]?\d{0,4}/g,
      /\d{10,15}/g
    ];
    
    const numbers: Set<string> = new Set();
    
    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const clean = match.replace(/\D/g, '');
          if (clean.length >= 10) {
            numbers.add(clean);
          }
        });
      }
    }
    
    return Array.from(numbers);
  }
  
  /**
   * Formatta numero per visualizzazione
   */
  formatForDisplay(phoneNumber: string, country: string = 'IT'): string {
    switch(country) {
      case 'IT':
        // +39 333 123 4567
        if (phoneNumber.startsWith('39')) {
          const withoutPrefix = phoneNumber.slice(2);
          return `+39 ${withoutPrefix.slice(0, 3)} ${withoutPrefix.slice(3, 6)} ${withoutPrefix.slice(6)}`;
        }
        break;
      
      case 'US':
        // +1 (555) 123-4567
        if (phoneNumber.startsWith('1')) {
          const withoutPrefix = phoneNumber.slice(1);
          return `+1 (${withoutPrefix.slice(0, 3)}) ${withoutPrefix.slice(3, 6)}-${withoutPrefix.slice(6)}`;
        }
        break;
      
      default:
        // Formato generico: +XX XXX XXX XXXX
        return `+${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2, 5)} ${phoneNumber.slice(5, 8)} ${phoneNumber.slice(8)}`;
    }
    
    return phoneNumber;
  }
  
  /**
   * Salva numero validato nel database
   */
  async saveValidatedNumber(validatedNumber: ValidatedPhoneNumber): Promise<void> {
    if (!validatedNumber.isValid) return;
    
    try {
      await prisma.whatsAppContact.upsert({
        where: { phoneNumber: validatedNumber.formatted },
        update: {
          syncedAt: new Date()
        },
        create: {
          phoneNumber: validatedNumber.formatted,
          name: validatedNumber.formatted,
          isUser: true,
          syncedAt: new Date()
        }
      });
      
      logger.info(`💾 Numero salvato/aggiornato: ${validatedNumber.formatted}`);
    } catch (error) {
      logger.error('Errore salvataggio numero validato:', error);
    }
  }
}

// Singleton
export const whatsAppValidation = new WhatsAppValidationService();
