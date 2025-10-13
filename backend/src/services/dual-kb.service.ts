/**
 * Dual Knowledge Base Service
 * Gestisce le Knowledge Base separate per professionisti e clienti
 * 
 * IMPORTANTE:
 * - PROFESSIONAL mode: ritorna KB tecnica completa con prezzi netti, margini, fornitori
 * - CLIENT mode: ritorna KB sanitizzata senza info sensibili
 * - Default mode CLIENT per sicurezza (99% messaggi da clienti)
 */

import prisma from '../config/database';
import { DetectionMode } from '../types/professional-whatsapp.types';
import logger from '../utils/logger';

export class DualKnowledgeBaseService {
  /**
   * Ottiene la KB appropriata basata sulla modalità detection
   * 
   * @param mode - Modalità detection (PROFESSIONAL/CLIENT/UNKNOWN)
   * @param whatsappId - ID configurazione WhatsApp
   * @param subcategoryId - ID sottocategoria
   * @returns Knowledge Base appropriata per la modalità
   */
  async getKBForMode(
    mode: DetectionMode,
    whatsappId: string,
    subcategoryId: string
  ): Promise<any> {
    try {
      // 1. Mappa whatsappId -> professionalId
      const whatsapp = await prisma.professionalWhatsApp.findUnique({
        where: { id: whatsappId },
        select: { professionalId: true }
      });

      if (!whatsapp) {
        logger.warn(`WhatsApp config ${whatsappId} non trovata. Uso KB di default.`);
        return this.getDefaultKBForMode(mode, subcategoryId);
      }

      // 2. Recupera eventuale personalizzazione AI per professionista+sottocategoria
      const customization = await prisma.professionalAiCustomization.findFirst({
        where: {
          professionalId: whatsapp.professionalId,
          subcategoryId,
          isActive: true
        },
        select: {
          customKnowledgeBase: true,
          metadata: true
        }
      });

      // 3. Se non esiste personalizzazione, usa KB di default
      if (!customization) {
        logger.info(`Nessuna KB custom per subcategory ${subcategoryId}. Uso default.`);
        return this.getDefaultKBForMode(mode, subcategoryId);
      }

      // 4. Selezione KB basata su modalità
      let selectedKB: any = {};
      switch (mode) {
        case DetectionMode.PROFESSIONAL:
          selectedKB = customization.customKnowledgeBase || {};
          logger.info(`Using PROFESSIONAL KB for subcategory ${subcategoryId}`);
          break;
        case DetectionMode.CLIENT:
        case DetectionMode.UNKNOWN:
        default:
          // Se presente una KB specifica lato cliente in metadata, usala; altrimenti deriva da quella professionale
          const clientKB = (customization.metadata as any)?.clientKB;
          selectedKB = clientKB ?? customization.customKnowledgeBase ?? {};
          logger.info(`Using CLIENT KB for subcategory ${subcategoryId}`);
          break;
      }

      // 5. Merge con KB base se necessario
      const baseKB = await this.getBaseKBForSubcategory(subcategoryId);
      const mergedKB = this.mergeKnowledgeBases(baseKB, selectedKB);

      // 6. Sanitizza ulteriormente se modalità CLIENT
      if (mode === DetectionMode.CLIENT) {
        return this.sanitizeKBForClient(mergedKB);
      }

      return mergedKB;

    } catch (error) {
      logger.error('Error getting KB for mode:', error);
      // In caso di errore, ritorna KB di emergenza
      return this.getEmergencyKB(mode);
    }
  }

  /**
   * Aggiorna la KB per professionisti
   */
  async updateProfessionalKB(
    whatsappId: string,
    subcategoryId: string,
    kb: any
  ): Promise<void> {
    try {
      // Mappa whatsappId -> professionalId
      const whatsapp = await prisma.professionalWhatsApp.findUnique({
        where: { id: whatsappId },
        select: { professionalId: true }
      });

      if (!whatsapp) {
        throw new Error(`WhatsApp config ${whatsappId} non trovata`);
      }

      // Recupera/crea settings base per la sottocategoria
      let baseSettings = await prisma.subcategoryAiSettings.findUnique({
        where: { subcategoryId }
      });

      if (!baseSettings) {
        baseSettings = await prisma.subcategoryAiSettings.create({
          data: {
            id: require('crypto').randomUUID(),
            subcategoryId,
            systemPrompt: 'Impostazioni AI di base per la sottocategoria',
            updatedAt: new Date()
          }
        });
      }

      // Cerca personalizzazione esistente
      const existing = await prisma.professionalAiCustomization.findFirst({
        where: {
          professionalId: whatsapp.professionalId,
          subcategoryId
        },
        select: { id: true }
      });

      if (existing) {
        await prisma.professionalAiCustomization.update({
          where: { id: existing.id },
          data: {
            customKnowledgeBase: kb,
            settingsId: baseSettings.id,
            updatedAt: new Date(),
            isActive: true
          }
        });
      } else {
        await prisma.professionalAiCustomization.create({
          data: {
            id: require('crypto').randomUUID(),
            professionalId: whatsapp.professionalId,
            subcategoryId,
            settingsId: baseSettings.id,
            customKnowledgeBase: kb,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      logger.info(`Professional KB updated for subcategory ${subcategoryId}`);
    } catch (error) {
      logger.error('Error updating professional KB:', error);
      throw error;
    }
  }

  /**
   * Aggiorna la KB per clienti
   */
  async updateClientKB(
    whatsappId: string,
    subcategoryId: string,
    kb: any
  ): Promise<void> {
    try {
      // Mappa whatsappId -> professionalId
      const whatsapp = await prisma.professionalWhatsApp.findUnique({
        where: { id: whatsappId },
        select: { professionalId: true }
      });

      if (!whatsapp) {
        throw new Error(`WhatsApp config ${whatsappId} non trovata`);
      }

      // Recupera/crea settings base per la sottocategoria
      let baseSettings = await prisma.subcategoryAiSettings.findUnique({
        where: { subcategoryId }
      });

      if (!baseSettings) {
        baseSettings = await prisma.subcategoryAiSettings.create({
          data: {
            id: require('crypto').randomUUID(),
            subcategoryId,
            systemPrompt: 'Impostazioni AI di base per la sottocategoria',
            updatedAt: new Date()
          }
        });
      }

      // Cerca personalizzazione esistente
      const existing = await prisma.professionalAiCustomization.findFirst({
        where: {
          professionalId: whatsapp.professionalId,
          subcategoryId
        },
        select: { id: true, metadata: true }
      });

      if (existing) {
        await prisma.professionalAiCustomization.update({
          where: { id: existing.id },
          data: {
            settingsId: baseSettings.id,
            updatedAt: new Date(),
            isActive: true,
            // Memorizza la KB lato cliente dentro metadata.clientKB
            metadata: {
              ...(existing.metadata as any ?? {}),
              clientKB: kb
            }
          }
        });
      } else {
        await prisma.professionalAiCustomization.create({
          data: {
            id: require('crypto').randomUUID(),
            professionalId: whatsapp.professionalId,
            subcategoryId,
            settingsId: baseSettings.id,
            // Nessuna KB professionale inizialmente, solo client override
            customKnowledgeBase: {},
            metadata: { clientKB: kb },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      logger.info(`Client KB updated for subcategory ${subcategoryId}`);
    } catch (error) {
      logger.error('Error updating client KB:', error);
      throw error;
    }
  }

  /**
   * Combina KB base con personalizzazioni
   */
  private mergeKnowledgeBases(baseKB: any, customKB: any): any {
    // Deep merge delle KB mantenendo le personalizzazioni
    const merged = { ...baseKB };

    // Override con custom KB
    for (const key in customKB) {
      if (typeof customKB[key] === 'object' && !Array.isArray(customKB[key])) {
        // Merge ricorsivo per oggetti
        merged[key] = {
          ...(merged[key] || {}),
          ...customKB[key]
        };
      } else {
        // Override diretto per valori primitivi e array
        merged[key] = customKB[key];
      }
    }

    return merged;
  }

  /**
   * Sanitizza KB per modalità CLIENT rimuovendo info sensibili
   */
  sanitizeKBForClient(kb: any): any {
    const sanitized = JSON.parse(JSON.stringify(kb)); // Deep clone

    // Pattern di info da rimuovere
    const sensitivePatterns = [
      'netPrice',
      'margin',
      'supplier',
      'internalCode',
      'cost',
      'markup',
      'technicalNote',
      'internalComment',
      'wholesale',
      'commission'
    ];

    // Funzione ricorsiva per rimuovere proprietà sensibili
    const removeSensitiveData = (obj: any): any => {
      if (!obj || typeof obj !== 'object') return obj;

      for (const key in obj) {
        // Rimuovi chiavi che contengono pattern sensibili
        const lowerKey = key.toLowerCase();
        if (sensitivePatterns.some(pattern => lowerKey.includes(pattern.toLowerCase()))) {
          delete obj[key];
          continue;
        }

        // Ricorsione per oggetti nested
        if (typeof obj[key] === 'object') {
          obj[key] = removeSensitiveData(obj[key]);
        }

        // Converti prezzi netti in pubblici se presenti
        if (lowerKey.includes('price') && typeof obj[key] === 'number') {
          // Applica markup 35% per prezzi pubblici
          obj[key] = Math.round(obj[key] * 1.35 * 100) / 100;
        }
      }

      return obj;
    };

    return removeSensitiveData(sanitized);
  }

  /**
   * Ottiene KB base per sottocategoria
   */
  private async getBaseKBForSubcategory(subcategoryId: string): Promise<any> {
    try {
      const subcategory = await prisma.subcategory.findUnique({
        where: { id: subcategoryId },
        select: {
          name: true,
          description: true
          // Altri campi utili per KB base
        }
      });

      return {
        subcategory: subcategory || {},
        services: [],
        materials: [],
        faqs: []
      };
    } catch (error) {
      logger.error('Error getting base KB:', error);
      return {};
    }
  }

  /**
   * KB di default per modalità quando non esiste config specifica
   */
  private async getDefaultKBForMode(mode: DetectionMode, subcategoryId: string): Promise<any> {
    const baseKB = await this.getBaseKBForSubcategory(subcategoryId);

    if (mode === DetectionMode.PROFESSIONAL) {
      // KB tecnica di default per professionisti
      return {
        ...baseKB,
        technicalInfo: {
          standards: 'Normative tecniche di riferimento',
          tools: 'Attrezzature professionali necessarie',
          safety: 'Procedure di sicurezza',
          suppliers: 'Elenco fornitori consigliati'
        },
        pricing: {
          laborCost: 'Costo orario manodopera',
          margins: 'Margini consigliati 30-40%',
          discounts: 'Sconti volume disponibili'
        }
      };
    } else {
      // KB pubblica di default per clienti
      return {
        ...baseKB,
        publicInfo: {
          services: 'Servizi disponibili',
          timing: 'Tempi di intervento standard',
          warranty: 'Garanzia sui lavori',
          support: 'Assistenza post-vendita'
        },
        pricing: {
          estimatedCost: 'Prezzi indicativi al pubblico',
          paymentMethods: 'Modalità di pagamento accettate'
        }
      };
    }
  }

  /**
   * KB di emergenza in caso di errore
   */
  private getEmergencyKB(mode: DetectionMode): any {
    if (mode === DetectionMode.PROFESSIONAL) {
      return {
        message: 'Sistema KB temporaneamente non disponibile',
        contacts: {
          support: 'Contatta supporto tecnico',
          documentation: 'Consulta documentazione interna'
        }
      };
    } else {
      return {
        message: 'Benvenuto! Come possiamo aiutarti?',
        services: 'I nostri professionisti sono a tua disposizione',
        contact: 'Per assistenza immediata contatta il servizio clienti'
      };
    }
  }

  /**
   * Recupera statistiche utilizzo KB
   */
  async getKBUsageStats(whatsappId: string): Promise<any> {
    try {
      // Mappa whatsappId -> professionalId
      const whatsapp = await prisma.professionalWhatsApp.findUnique({
        where: { id: whatsappId },
        select: { professionalId: true }
      });

      if (!whatsapp) {
        return { totalConfigs: 0, enabledConfigs: 0, lastSync: { professional: null, client: null } };
      }

      const customizations = await prisma.professionalAiCustomization.findMany({
        where: { professionalId: whatsapp.professionalId },
        select: { subcategoryId: true, isActive: true, updatedAt: true, metadata: true }
      });

      const professionalLast = customizations
        .map(c => c.updatedAt)
        .filter(Boolean)
        .sort()
        .pop() || null;

      const clientLast = customizations
        .filter(c => (c.metadata as any)?.clientKB)
        .map(c => c.updatedAt)
        .filter(Boolean)
        .sort()
        .pop() || null;

      return {
        totalConfigs: customizations.length,
        enabledConfigs: customizations.filter(c => c.isActive).length,
        lastSync: {
          professional: professionalLast,
          client: clientLast
        }
      };
    } catch (error) {
      logger.error('Error getting KB usage stats:', error);
      return {};
    }
  }
}

// Export singleton instance
export const dualKBService = new DualKnowledgeBaseService();
