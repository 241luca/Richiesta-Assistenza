// ==========================================
// DUAL MODE DETECTOR SERVICE
// Sistema di rilevamento modalità per AI duale
// ==========================================

import prisma from '../config/database';
import logger from '../utils/logger';
import { 
  DetectionMode, 
  DetectionResult, 
  ContactType,
  DetectionOverride,
  ProfessionalWhatsApp
} from '../types/professional-whatsapp.types';
import logger from '../utils/logger';

export class DualModeDetector {
  private static instance: DualModeDetector;

  private constructor() {}

  public static getInstance(): DualModeDetector {
    if (!DualModeDetector.instance) {
      DualModeDetector.instance = new DualModeDetector();
    }
    return DualModeDetector.instance;
  }

  /**
   * Metodo principale per rilevare il tipo di mittente
   * @param phoneNumber - Numero di telefono del mittente
   * @param whatsappInstanceId - ID dell'istanza WhatsApp
   * @returns DetectionResult con modalità, confidence e dettagli
   */
  async detectSenderType(
    phoneNumber: string, 
    whatsappInstanceId: string
  ): Promise<DetectionResult> {
    try {
      // 1. Recupera configurazione WhatsApp del professionista
      const whatsappConfig = await prisma.professionalWhatsApp.findUnique({
        where: { instanceId: whatsappInstanceId },
        include: {
          contacts: {
            where: { phoneNumber }
          }
        }
      });

      if (!whatsappConfig) {
        logger.error(`WhatsApp config not found for instance: ${whatsappInstanceId}`);
        return this.createDefaultResult(DetectionMode.CLIENT, 0.5, 'Configuration not found');
      }

      // 2. Controlla se è un numero bloccato
      if (whatsappConfig.blacklistedNumbers.includes(phoneNumber)) {
        logger.info(`Blocked number detected: ${phoneNumber}`);
        return {
          mode: DetectionMode.UNKNOWN,
          confidence: 1.0,
          reason: 'Number is blacklisted',
          factors: {
            isRegisteredProfessional: false,
            isTrustedNumber: false,
            isBlacklistedNumber: true,
            languagePatternMatch: false,
            contextClues: ['BLOCKED'],
            historicalPattern: 'BLOCKED'
          },
          suggestedAction: 'MANUAL_REVIEW'
        };
      }

      // 3. Controlla se è il numero del professionista stesso
      if (whatsappConfig.professionalPhones.includes(phoneNumber)) {
        logger.info(`Professional number detected: ${phoneNumber}`);
        return {
          mode: DetectionMode.PROFESSIONAL,
          confidence: 1.0,
          reason: 'Registered professional phone number',
          factors: {
            isRegisteredProfessional: true,
            isTrustedNumber: true,
            isBlacklistedNumber: false,
            languagePatternMatch: true,
            contextClues: ['REGISTERED_PROFESSIONAL'],
            historicalPattern: 'PROFESSIONAL'
          },
          suggestedAction: 'USE_DETECTED'
        };
      }

      // 4. Controlla se è un numero fidato (collaboratori, dipendenti)
      if (whatsappConfig.trustedNumbers.includes(phoneNumber)) {
        logger.info(`Trusted number detected: ${phoneNumber}`);
        return {
          mode: DetectionMode.PROFESSIONAL,
          confidence: 0.9,
          reason: 'Trusted collaborator number',
          factors: {
            isRegisteredProfessional: false,
            isTrustedNumber: true,
            isBlacklistedNumber: false,
            languagePatternMatch: true,
            contextClues: ['TRUSTED_COLLABORATOR'],
            historicalPattern: 'PROFESSIONAL'
          },
          suggestedAction: 'USE_DETECTED'
        };
      }

      // 5. Controlla se esiste già un contatto classificato
      if (whatsappConfig.contacts && whatsappConfig.contacts.length > 0) {
        const existingContact = whatsappConfig.contacts[0];
        
        if (existingContact.isVerified) {
          const mode = this.mapContactTypeToMode(existingContact.contactType as ContactType);
          logger.info(`Verified contact found: ${phoneNumber} -> ${mode}`);
          
          return {
            mode,
            confidence: 0.95,
            reason: `Verified ${existingContact.contactType} contact`,
            factors: {
              isRegisteredProfessional: existingContact.contactType === ContactType.PROFESSIONAL,
              isTrustedNumber: existingContact.contactType === ContactType.TRUSTED,
              isBlacklistedNumber: false,
              languagePatternMatch: false,
              contextClues: [`VERIFIED_${existingContact.contactType}`],
              historicalPattern: existingContact.contactType
            },
            suggestedAction: 'USE_DETECTED'
          };
        }
      }

      // 6. Controlla override precedenti per questo numero
      const previousOverride = await this.getLatestOverride(whatsappInstanceId, phoneNumber);
      if (previousOverride) {
        logger.info(`Previous override found for ${phoneNumber}: ${previousOverride.overriddenTo}`);
        return {
          mode: previousOverride.overriddenTo as DetectionMode,
          confidence: 0.85,
          reason: 'Based on previous manual override',
          factors: {
            isRegisteredProfessional: previousOverride.overriddenTo === DetectionMode.PROFESSIONAL,
            isTrustedNumber: false,
            isBlacklistedNumber: false,
            languagePatternMatch: false,
            contextClues: ['PREVIOUS_OVERRIDE'],
            historicalPattern: previousOverride.overriddenTo
          },
          suggestedAction: 'USE_DETECTED'
        };
      }

      // 7. DEFAULT: Considera come CLIENT (più sicuro)
      logger.info(`Default detection for ${phoneNumber}: CLIENT mode`);
      return {
        mode: DetectionMode.CLIENT,
        confidence: 0.95,
        reason: 'Default classification - unregistered number',
        factors: {
          isRegisteredProfessional: false,
          isTrustedNumber: false,
          isBlacklistedNumber: false,
          languagePatternMatch: false,
          contextClues: ['DEFAULT_CLIENT'],
          historicalPattern: undefined
        },
        suggestedAction: 'USE_DETECTED'
      };

    } catch (error) {
      logger.error('Error in detectSenderType:', error);
      return this.createDefaultResult(DetectionMode.CLIENT, 0.5, 'Error during detection');
    }
  }

  /**
   * Aggiunge un numero alla lista dei professionisti
   */
  async addProfessionalNumber(instanceId: string, phoneNumber: string): Promise<void> {
    try {
      const whatsappConfig = await prisma.professionalWhatsApp.findUnique({
        where: { instanceId }
      });

      if (!whatsappConfig) {
        throw new Error('WhatsApp configuration not found');
      }

      // Aggiungi il numero se non esiste già
      if (!whatsappConfig.professionalPhones.includes(phoneNumber)) {
        await prisma.professionalWhatsApp.update({
          where: { instanceId },
          data: {
            professionalPhones: {
              push: phoneNumber
            }
          }
        });
        
        logger.info(`Added professional number: ${phoneNumber} to instance: ${instanceId}`);
      }

      // Crea o aggiorna il contatto
      await this.updateContactClassification(instanceId, phoneNumber, ContactType.PROFESSIONAL);
      
    } catch (error) {
      logger.error('Error adding professional number:', error);
      throw error;
    }
  }

  /**
   * Aggiunge un numero alla lista dei numeri fidati
   */
  async addTrustedNumber(instanceId: string, phoneNumber: string): Promise<void> {
    try {
      const whatsappConfig = await prisma.professionalWhatsApp.findUnique({
        where: { instanceId }
      });

      if (!whatsappConfig) {
        throw new Error('WhatsApp configuration not found');
      }

      // Aggiungi il numero se non esiste già
      if (!whatsappConfig.trustedNumbers.includes(phoneNumber)) {
        await prisma.professionalWhatsApp.update({
          where: { instanceId },
          data: {
            trustedNumbers: {
              push: phoneNumber
            }
          }
        });
        
        logger.info(`Added trusted number: ${phoneNumber} to instance: ${instanceId}`);
      }

      // Crea o aggiorna il contatto
      await this.updateContactClassification(instanceId, phoneNumber, ContactType.TRUSTED);
      
    } catch (error) {
      logger.error('Error adding trusted number:', error);
      throw error;
    }
  }

  /**
   * Rimuove un numero da tutte le liste
   */
  async removeFromLists(instanceId: string, phoneNumber: string): Promise<void> {
    try {
      const whatsappConfig = await prisma.professionalWhatsApp.findUnique({
        where: { instanceId }
      });

      if (!whatsappConfig) {
        throw new Error('WhatsApp configuration not found');
      }

      // Rimuovi da tutte le liste
      const updatedProfessionalPhones = whatsappConfig.professionalPhones.filter(p => p !== phoneNumber);
      const updatedTrustedNumbers = whatsappConfig.trustedNumbers.filter(p => p !== phoneNumber);
      const updatedBlacklistedNumbers = whatsappConfig.blacklistedNumbers.filter(p => p !== phoneNumber);

      await prisma.professionalWhatsApp.update({
        where: { instanceId },
        data: {
          professionalPhones: updatedProfessionalPhones,
          trustedNumbers: updatedTrustedNumbers,
          blacklistedNumbers: updatedBlacklistedNumbers
        }
      });

      // Aggiorna il contatto come CLIENT
      await this.updateContactClassification(instanceId, phoneNumber, ContactType.CLIENT);
      
      logger.info(`Removed ${phoneNumber} from all lists in instance: ${instanceId}`);
      
    } catch (error) {
      logger.error('Error removing from lists:', error);
      throw error;
    }
  }

  /**
   * Registra un override manuale per il machine learning
   */
  async recordDetectionOverride(override: Omit<DetectionOverride, 'id' | 'createdAt'>): Promise<void> {
    try {
      await prisma.professionalWhatsAppDetectionOverride.create({
        data: {
          whatsappId: override.whatsappId,
          phoneNumber: override.phoneNumber,
          originalDetection: override.originalDetection,
          overriddenTo: override.overriddenTo,
          overriddenBy: override.overriddenBy,
          reason: override.reason,
          shouldLearnFrom: override.shouldLearnFrom ?? true
        }
      });

      // Aggiorna classificazione del contatto
      const contactType = this.modeToContactType(override.overriddenTo as DetectionMode);
      await this.updateContactClassification(override.whatsappId, override.phoneNumber, contactType);

      logger.info(`Recorded detection override: ${override.phoneNumber} from ${override.originalDetection} to ${override.overriddenTo}`);
      
    } catch (error) {
      logger.error('Error recording detection override:', error);
      throw error;
    }
  }

  /**
   * Calcola l'accuratezza del sistema di detection
   */
  async getDetectionAccuracy(instanceId: string): Promise<number> {
    try {
      const analytics = await prisma.professionalWhatsAppAnalytics.findMany({
        where: { 
          whatsapp: {
            instanceId 
          }
        },
        orderBy: { date: 'desc' },
        take: 30 // Ultimi 30 giorni
      });

      if (analytics.length === 0) {
        return 100; // Nessun dato, assumiamo 100%
      }

      let totalDetections = 0;
      let correctDetections = 0;

      analytics.forEach(day => {
        totalDetections += day.correctDetections + day.incorrectDetections;
        correctDetections += day.correctDetections;
      });

      if (totalDetections === 0) {
        return 100;
      }

      const accuracy = (correctDetections / totalDetections) * 100;
      return Math.round(accuracy * 100) / 100; // Arrotonda a 2 decimali
      
    } catch (error) {
      logger.error('Error calculating detection accuracy:', error);
      return 0;
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private createDefaultResult(mode: DetectionMode, confidence: number, reason: string): DetectionResult {
    return {
      mode,
      confidence,
      reason,
      factors: {
        isRegisteredProfessional: false,
        isTrustedNumber: false,
        isBlacklistedNumber: false,
        languagePatternMatch: false,
        contextClues: [],
        historicalPattern: undefined
      },
      suggestedAction: confidence < 0.7 ? 'MANUAL_REVIEW' : 'USE_DETECTED'
    };
  }

  private mapContactTypeToMode(contactType: ContactType): DetectionMode {
    switch (contactType) {
      case ContactType.PROFESSIONAL:
      case ContactType.TRUSTED:
        return DetectionMode.PROFESSIONAL;
      case ContactType.BLOCKED:
        return DetectionMode.UNKNOWN;
      case ContactType.CLIENT:
      default:
        return DetectionMode.CLIENT;
    }
  }

  private modeToContactType(mode: DetectionMode): ContactType {
    switch (mode) {
      case DetectionMode.PROFESSIONAL:
        return ContactType.PROFESSIONAL;
      case DetectionMode.CLIENT:
        return ContactType.CLIENT;
      default:
        return ContactType.CLIENT;
    }
  }

  private async updateContactClassification(
    whatsappId: string, 
    phoneNumber: string, 
    contactType: ContactType
  ): Promise<void> {
    try {
      // Trova l'ID del record ProfessionalWhatsApp
      const whatsappRecord = await prisma.professionalWhatsApp.findFirst({
        where: {
          OR: [
            { instanceId: whatsappId },
            { id: whatsappId }
          ]
        }
      });

      if (!whatsappRecord) {
        logger.error(`WhatsApp record not found for: ${whatsappId}`);
        return;
      }

      // Usa upsert per creare o aggiornare il contatto
      await prisma.professionalWhatsAppContact.upsert({
        where: {
          whatsappId_phoneNumber: {
            whatsappId: whatsappRecord.id,
            phoneNumber
          }
        },
        update: {
          contactType,
          updatedAt: new Date()
        },
        create: {
          whatsappId: whatsappRecord.id,
          phoneNumber,
          contactType,
          status: 'ACTIVE'
        }
      });
      
    } catch (error) {
      logger.error('Error updating contact classification:', error);
    }
  }

  private async getLatestOverride(
    instanceId: string, 
    phoneNumber: string
  ): Promise<DetectionOverride | null> {
    try {
      const whatsappRecord = await prisma.professionalWhatsApp.findFirst({
        where: {
          OR: [
            { instanceId },
            { id: instanceId }
          ]
        }
      });

      if (!whatsappRecord) {
        return null;
      }

      const override = await prisma.professionalWhatsAppDetectionOverride.findFirst({
        where: {
          whatsappId: whatsappRecord.id,
          phoneNumber
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (override) {
        return {
          id: override.id,
          whatsappId: override.whatsappId,
          phoneNumber: override.phoneNumber,
          originalDetection: override.originalDetection as DetectionMode,
          overriddenTo: override.overriddenTo as DetectionMode,
          overriddenBy: override.overriddenBy,
          reason: override.reason || undefined,
          shouldLearnFrom: override.shouldLearnFrom,
          createdAt: override.createdAt
        };
      }

      return null;
      
    } catch (error) {
      logger.error('Error getting latest override:', error);
      return null;
    }
  }
}

// Export singleton instance
export const dualModeDetector = DualModeDetector.getInstance();