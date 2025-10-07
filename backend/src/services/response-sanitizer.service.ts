/**
 * Response Sanitizer Service
 * Rimuove informazioni sensibili dalle risposte AI per clienti
 * 
 * IMPORTANTE:
 * - Per PROFESSIONAL mode: nessuna sanitizzazione
 * - Per CLIENT mode: rimuove prezzi netti, margini, codici interni, fornitori
 * - Converte prezzi netti in pubblici con markup 35%
 * - Semplifica linguaggio tecnico troppo complesso
 */

import { DetectionMode } from '../types/professional-whatsapp.types';
import logger from '../utils/logger';

export class ResponseSanitizer {
  // Pattern da rimuovere per CLIENT mode
  private patterns = {
    // Prezzi netti con varie formattazioni
    netPrices: /€\s*\d+(?:[.,]\d{1,2})?\s*(?:\(netto\)|netto|NETTO)/gi,
    
    // Margini e percentuali di guadagno
    margins: /(?:margine|guadagno|ricarico|markup):?\s*\d+(?:[.,]\d{1,2})?%/gi,
    
    // Codici interni e riferimenti
    internalCodes: /(?:COD|REF|SKU|ART)[-_]\w+/gi,
    
    // Informazioni fornitori
    supplierInfo: /(?:fornitore|distributore|grossista):?\s*[\w\s\-&]+(?:\.|,|\n|$)/gi,
    
    // Note tecniche interne
    technicalNotes: /\[(?:NOTA TECNICA|TECNICO|INTERNAL|INTERNO):.*?\]/gi,
    
    // Commenti interni
    internalComments: /\[(?:INTERNO|PRIVATO|STAFF|TEAM):.*?\]/gi,
    
    // Costi e prezzi di acquisto
    purchaseCosts: /(?:costo acquisto|prezzo acquisto|costo fornitore):?\s*€?\s*\d+(?:[.,]\d{1,2})?/gi,
    
    // Commissioni e percentuali interne
    commissions: /(?:commissione|provvigione):?\s*\d+(?:[.,]\d{1,2})?%/gi,
    
    // Informazioni magazzino sensibili
    warehouseInfo: /(?:giacenza|stock|rimanenze):?\s*\d+\s*(?:pz|pezzi|unità)/gi,
    
    // Sconti riservati
    confidentialDiscounts: /(?:sconto riservato|sconto speciale|sconto insider):?\s*\d+(?:[.,]\d{1,2})?%/gi
  };

  // Termini tecnici da semplificare
  private technicalTerms = new Map([
    ['termocoppie', 'sensori di temperatura'],
    ['collettore idraulico', 'distributore acqua'],
    ['inverter', 'regolatore di velocità'],
    ['scheda elettronica', 'componente di controllo'],
    ['pressostato', 'sensore di pressione'],
    ['flussostato', 'sensore di flusso'],
    ['bypass', 'deviazione'],
    ['ricircolo', 'circolazione continua'],
    ['mandata', 'uscita acqua calda'],
    ['ritorno', 'entrata acqua fredda']
  ]);

  /**
   * Metodo principale per sanitizzare le risposte
   */
  sanitizeResponse(response: string, mode: DetectionMode): string {
    // Per professionisti, nessuna sanitizzazione
    if (mode === DetectionMode.PROFESSIONAL) {
      logger.debug('Professional mode - no sanitization needed');
      return response;
    }

    logger.info(`Sanitizing response for ${mode} mode`);
    
    let sanitized = response;

    // 1. Estrai e converti prezzi netti prima di rimuoverli
    sanitized = this.convertNetPrices(sanitized);

    // 2. Rimuovi tutti i pattern sensibili
    for (const [patternName, pattern] of Object.entries(this.patterns)) {
      const before = sanitized;
      sanitized = sanitized.replace(pattern, '');
      
      if (before !== sanitized) {
        logger.debug(`Removed ${patternName} patterns`);
      }
    }

    // 3. Rimuovi riferimenti interni multipli
    sanitized = this.removeInternalReferences(sanitized);

    // 4. Semplifica linguaggio tecnico
    sanitized = this.simplifyTechnicalLanguage(sanitized);

    // 5. Pulisci spazi e formattazione
    sanitized = this.cleanupFormatting(sanitized);

    // 6. Aggiungi disclaimer se necessario
    if (mode === DetectionMode.CLIENT && this.containsPricing(sanitized)) {
      sanitized = this.addPricingDisclaimer(sanitized);
    }

    logger.debug(`Sanitization complete - removed ${response.length - sanitized.length} characters`);
    
    return sanitized;
  }

  /**
   * Converte prezzi netti in prezzi pubblici con markup
   */
  private convertNetPrices(text: string): string {
    // Pattern per trovare prezzi netti
    const pricePattern = /€\s*(\d+(?:[.,]\d{1,2})?)\s*(?:\(netto\)|netto)/gi;
    
    return text.replace(pricePattern, (match, price) => {
      // Converti virgola in punto per calcolo
      const netPrice = parseFloat(price.replace(',', '.'));
      
      if (isNaN(netPrice)) {
        return match; // Se non è un numero valido, lascia invariato
      }

      // Applica markup del 35%
      const publicPrice = this.convertNetToPublicPrice(netPrice);
      
      logger.debug(`Converting net price €${netPrice} to public €${publicPrice}`);
      
      // Formatta con virgola per prezzi italiani
      const formattedPrice = publicPrice.toFixed(2).replace('.', ',');
      
      return `€ ${formattedPrice}`;
    });
  }

  /**
   * Calcola prezzo pubblico da prezzo netto
   */
  private convertNetToPublicPrice(netPrice: number): number {
    const markup = 1.35; // 35% di markup standard
    const publicPrice = netPrice * markup;
    
    // Arrotonda a 2 decimali
    return Math.round(publicPrice * 100) / 100;
  }

  /**
   * Rimuove riferimenti interni multipli
   */
  private removeInternalReferences(text: string): string {
    // Rimuovi sezioni "Solo per uso interno"
    text = text.replace(/(?:^|\n).*solo\s+(?:per\s+)?uso\s+interno.*(?:\n|$)/gi, '\n');
    
    // Rimuovi sezioni "Riservato staff"
    text = text.replace(/(?:^|\n).*riservato\s+(?:allo?\s+)?staff.*(?:\n|$)/gi, '\n');
    
    // Rimuovi numeri di telefono interni (es: interno 123)
    text = text.replace(/interno\s+\d+/gi, '');
    
    // Rimuovi email interne
    text = text.replace(/[\w.-]+@(?:interno|staff|admin)\.[\w.-]+/gi, '');
    
    return text;
  }

  /**
   * Semplifica linguaggio tecnico per clienti
   */
  private simplifyTechnicalLanguage(text: string): string {
    let simplified = text;
    
    // Sostituisci termini tecnici con versioni semplificate
    this.technicalTerms.forEach((simple, technical) => {
      const regex = new RegExp(`\\b${technical}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    });
    
    // Rimuovi sigle tecniche complesse
    simplified = simplified.replace(/\b[A-Z]{3,}\d+[A-Z]*\b/g, 'modello');
    
    // Semplifica unità di misura tecniche
    simplified = simplified.replace(/\bbar\b/gi, 'pressione');
    simplified = simplified.replace(/\bkW\b/gi, 'potenza');
    simplified = simplified.replace(/\bBTU\b/gi, 'capacità');
    simplified = simplified.replace(/\bm³\/h\b/gi, 'portata');
    
    return simplified;
  }

  /**
   * Pulisce formattazione e spazi extra
   */
  private cleanupFormatting(text: string): string {
    // Rimuovi spazi multipli
    text = text.replace(/\s+/g, ' ');
    
    // Rimuovi righe vuote multiple
    text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Rimuovi spazi prima/dopo punteggiatura
    text = text.replace(/\s+([.,;!?])/g, '$1');
    text = text.replace(/([.,;!?])\s*([a-z])/g, '$1 $2');
    
    // Trim spazi iniziali e finali
    text = text.trim();
    
    return text;
  }

  /**
   * Verifica se il testo contiene informazioni sui prezzi
   */
  private containsPricing(text: string): boolean {
    const priceIndicators = [
      /€\s*\d+/,
      /euro\s+\d+/i,
      /costo/i,
      /prezzo/i,
      /tariffa/i,
      /preventivo/i
    ];
    
    return priceIndicators.some(pattern => pattern.test(text));
  }

  /**
   * Aggiunge disclaimer sui prezzi
   */
  private addPricingDisclaimer(text: string): string {
    const disclaimer = '\n\n💡 I prezzi indicati sono orientativi e potrebbero variare in base alle specifiche del lavoro.';
    
    // Aggiungi solo se non già presente
    if (!text.includes('prezzi indicati sono orientativi')) {
      return text + disclaimer;
    }
    
    return text;
  }

  /**
   * Sanitizza array di messaggi
   */
  sanitizeMessages(messages: string[], mode: DetectionMode): string[] {
    return messages.map(msg => this.sanitizeResponse(msg, mode));
  }

  /**
   * Verifica se un testo contiene informazioni sensibili
   */
  containsSensitiveInfo(text: string): boolean {
    for (const pattern of Object.values(this.patterns)) {
      if (pattern.test(text)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Estrae solo informazioni pubbliche da un testo
   */
  extractPublicInfo(text: string): string {
    // Mantieni solo informazioni generali
    const publicPatterns = [
      /(?:servizio|intervento|assistenza).*?(?:\.|$)/gi,
      /(?:orario|disponibile|aperto).*?(?:\.|$)/gi,
      /(?:garanzia|certificato|qualità).*?(?:\.|$)/gi,
      /(?:professionale|qualificato|esperto).*?(?:\.|$)/gi
    ];
    
    const publicInfo: string[] = [];
    
    for (const pattern of publicPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        publicInfo.push(...matches);
      }
    }
    
    return publicInfo.join(' ').trim() || 'Informazioni disponibili su richiesta.';
  }

  /**
   * Genera statistiche sulla sanitizzazione
   */
  getSanitizationStats(original: string, sanitized: string): object {
    const stats = {
      originalLength: original.length,
      sanitizedLength: sanitized.length,
      removedCharacters: original.length - sanitized.length,
      removedPercentage: Math.round(((original.length - sanitized.length) / original.length) * 100),
      sensitiveItemsFound: 0,
      pricesConverted: 0
    };
    
    // Conta elementi sensibili rimossi
    for (const pattern of Object.values(this.patterns)) {
      const matches = original.match(pattern);
      if (matches) {
        stats.sensitiveItemsFound += matches.length;
      }
    }
    
    // Conta prezzi convertiti
    const pricePattern = /€\s*\d+(?:[.,]\d{1,2})?/g;
    const originalPrices = original.match(pricePattern) || [];
    const sanitizedPrices = sanitized.match(pricePattern) || [];
    stats.pricesConverted = Math.max(0, originalPrices.length - sanitizedPrices.length);
    
    return stats;
  }
}

// Export singleton instance
export const responseSanitizer = new ResponseSanitizer();
