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
      // 1. Recupera configurazione KB duale per la sottocategoria
      const dualConfig = await prisma.professionalSubcategoryDualConfig.findFirst({
        where: {
          whatsappId,
          subcategoryId
        }
      });

      // 2. Se non esiste config specifica, usa KB generale della sottocategoria
      if (!dualConfig) {
        logger.info(`No dual config found for subcategory ${subcategoryId}, using default`);
        return this.getDefaultKBForMode(mode, subcategoryId);
      }

      // 3. Selezione KB basata su modalità
      let selectedKB;
      switch (mode) {
        case DetectionMode.PROFESSIONAL:
          // Per professionisti: KB tecnica completa
          selectedKB = dualConfig.kbProfessional || {};
          logger.info(`Using PROFESSIONAL KB for subcategory ${subcategoryId}`);
          break;

        case DetectionMode.CLIENT:
        case DetectionMode.UNKNOWN:
        default:
          // Per clienti o sconosciuti: KB sanitizzata
          selectedKB = dualConfig.kbClient || {};
          logger.info(`Using CLIENT KB for subcategory ${subcategoryId}`);
          break;
      }

      // 4. Merge con KB base se necessario
      const baseKB = await this.getBaseKBForSubcategory(subcategoryId);
      const mergedKB = this.mergeKnowledgeBases(baseKB, selectedKB);

      // 5. Sanitizza ulteriormente se modalità CLIENT
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
      // Verifica se esiste già una configurazione
      const existing = await prisma.professionalSubcategoryDualConfig.findFirst({
        where: {
          whatsappId,
          subcategoryId
        }
      });

      if (existing) {
        // Aggiorna KB esistente
        await prisma.professionalSubcategoryDualConfig.update({
          where: { id: existing.id },
          data: {
            kbProfessional: kb,
            lastSyncProfessional: new Date()
          }
        });
      } else {
        // Crea nuova configurazione
        await prisma.professionalSubcategoryDualConfig.create({
          data: {
            whatsappId,
            subcategoryId,
            kbProfessional: kb,
            kbClient: {}, // KB cliente vuota inizialmente
            enableDualMode: true,
            lastSyncProfessional: new Date()
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
      // Verifica se esiste già una configurazione
      const existing = await prisma.professionalSubcategoryDualConfig.findFirst({
        where: {
          whatsappId,
          subcategoryId
        }
      });

      if (existing) {
        // Aggiorna KB esistente
        await prisma.professionalSubcategoryDualConfig.update({
          where: { id: existing.id },
          data: {
            kbClient: kb,
            lastSyncClient: new Date()
          }
        });
      } else {
        // Crea nuova configurazione
        await prisma.professionalSubcategoryDualConfig.create({
          data: {
            whatsappId,
            subcategoryId,
            kbProfessional: {}, // KB professional vuota inizialmente
            kbClient: kb,
            enableDualMode: true,
            lastSyncClient: new Date()
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
          description: true,
          basePrice: true,
          estimatedDuration: true,
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
      const configs = await prisma.professionalSubcategoryDualConfig.findMany({
        where: { whatsappId },
        select: {
          subcategoryId: true,
          enableDualMode: true,
          lastSyncProfessional: true,
          lastSyncClient: true
        }
      });

      return {
        totalConfigs: configs.length,
        enabledConfigs: configs.filter(c => c.enableDualMode).length,
        lastSync: {
          professional: configs.map(c => c.lastSyncProfessional).filter(Boolean).sort().pop(),
          client: configs.map(c => c.lastSyncClient).filter(Boolean).sort().pop()
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
