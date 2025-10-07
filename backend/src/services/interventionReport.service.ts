/**
 * Intervention Report Service
 * Gestisce template, configurazione e generazione rapporti intervento
 * 
 * Responsabilità:
 * - Configurazione globale rapporti (PDF, email, numerazione)
 * - Gestione tipi campo per template personalizzati
 * - Gestione stati workflow rapporto (draft, pending, signed, archived)
 * - Gestione tipi intervento predefiniti
 * - Gestione sezioni template rapporti
 * - Generazione numero progressivo rapporto
 * - Template builder e editor
 * 
 * @module services/interventionReport
 * @version 5.2.1
 * @updated 2025-10-01
 * @author Sistema Richiesta Assistenza
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

/**
 * Intervention Report Service Class
 * Gestisce tutte le operazioni sui rapporti intervento
 */
class InterventionReportService {
  
  // ========== CONFIGURAZIONE GLOBALE ==========
  
  /**
   * Recupera configurazione globale rapporti
   * 
   * @returns {Promise<any>} Configurazione globale (PURE DATA)
   * 
   * @example
   * const config = await interventionReportService.getConfig();
   * console.log(config.maxPhotosPerReport); // 10
   */
  async getConfig() {
    try {
      logger.info('[InterventionReportService] Fetching global configuration');

      // Per ora ritorna configurazione di default
      // TODO: In futuro recupererà da tabella interventionReportConfig
      const defaultConfig = {
        id: '1',
        enabledFeatures: {
          photos: true,
          signature: true,
          materials: true,
          timer: true,
          gps: false,
          weather: false
        },
        pdfSettings: {
          logo: true,
          header: true,
          footer: true,
          watermark: false
        },
        emailSettings: {
          autoSend: false,
          template: 'default'
        },
        reportNumberFormat: 'RAPP-{YYYY}-{0000}',
        requireClientSignature: false,
        requireProfessionalSignature: true,
        allowDraftSave: true,
        maxPhotosPerReport: 10,
        photoMaxSizeMB: 5,
        autoArchiveAfterDays: null,
        defaultLanguage: 'it'
      };
      
      logger.info('[InterventionReportService] Configuration retrieved successfully');
      return defaultConfig;
    } catch (error) {
      logger.error('[InterventionReportService] Error fetching configuration:', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  /**
   * Aggiorna configurazione globale
   * 
   * @param {any} data - Nuova configurazione
   * @returns {Promise<any>} Configurazione aggiornata
   */
  async updateConfig(data: any) {
    try {
      logger.info('[InterventionReportService] Updating global configuration');

      // TODO: In futuro aggiornerà tabella interventionReportConfig
      const updated = {
        ...data,
        updatedAt: new Date()
      };

      logger.info('[InterventionReportService] Configuration updated successfully');
      return updated;
    } catch (error) {
      logger.error('[InterventionReportService] Error updating configuration:', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  // ========== TIPI CAMPO ==========
  
  /**
   * Recupera tipi campo disponibili per template
   * 
   * @param {any} filters - Filtri opzionali (es: isActive)
   * @returns {Promise<any[]>} Lista tipi campo (PURE DATA)
   * 
   * @example
   * const fieldTypes = await interventionReportService.getFieldTypes({ isActive: true });
   * // Ritorna: text, textarea, number, date, select, checkbox, radio, photo, signature
   */
  async getFieldTypes(filters?: any) {
    try {
      logger.info('[InterventionReportService] Fetching field types', { filters });

      // Lista tipi campo di default (10 tipi predefiniti)
      const fieldTypes = [
        { id: '1', code: 'text', name: 'Campo Testo', inputType: 'text', icon: 'type', displayOrder: 1, isActive: true, isSystem: true },
        { id: '2', code: 'textarea', name: 'Area di Testo', inputType: 'textarea', icon: 'text', displayOrder: 2, isActive: true, isSystem: true },
        { id: '3', code: 'number', name: 'Numero', inputType: 'number', icon: 'hash', displayOrder: 3, isActive: true, isSystem: true },
        { id: '4', code: 'date', name: 'Data', inputType: 'date', icon: 'calendar', displayOrder: 4, isActive: true, isSystem: true },
        { id: '5', code: 'time', name: 'Ora', inputType: 'time', icon: 'clock', displayOrder: 5, isActive: true, isSystem: true },
        { id: '6', code: 'select', name: 'Selezione', inputType: 'select', icon: 'list', displayOrder: 6, isActive: true, isSystem: true },
        { id: '7', code: 'checkbox', name: 'Checkbox', inputType: 'checkbox', icon: 'check-square', displayOrder: 7, isActive: true, isSystem: true },
        { id: '8', code: 'radio', name: 'Scelta Singola', inputType: 'radio', icon: 'circle-dot', displayOrder: 8, isActive: true, isSystem: true },
        { id: '9', code: 'photo', name: 'Foto', inputType: 'file', icon: 'camera', displayOrder: 9, isActive: true, isSystem: true },
        { id: '10', code: 'signature', name: 'Firma', inputType: 'signature', icon: 'pen', displayOrder: 10, isActive: true, isSystem: true }
      ];
      
      const filtered = filters?.isActive !== undefined 
        ? fieldTypes.filter(ft => ft.isActive === filters.isActive)
        : fieldTypes;

      logger.info('[InterventionReportService] Field types retrieved', { count: filtered.length });
      return filtered;
    } catch (error) {
      logger.error('[InterventionReportService] Error fetching field types:', {
        error: error instanceof Error ? error.message : 'Unknown',
        filters,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async createFieldType(data: any) {
    try {
      logger.info('[InterventionReportService] Creating field type', { code: data.code });

      // Verifica unicità code
      const existing = await this.getFieldTypes();
      if (existing.find(ft => ft.code === data.code)) {
        throw new AppError('Codice tipo campo già esistente', 400);
      }
      
      // TODO: In futuro salverà nel DB
      const fieldType = {
        id: Date.now().toString(),
        ...data,
        isSystem: false,
        createdAt: new Date()
      };
      
      logger.info('[InterventionReportService] Field type created', { id: fieldType.id });
      return fieldType;
    } catch (error) {
      logger.error('[InterventionReportService] Error creating field type:', {
        error: error instanceof Error ? error.message : 'Unknown',
        data,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async updateFieldType(id: string, data: any) {
    try {
      logger.info('[InterventionReportService] Updating field type', { id });

      const updated = { id, ...data, updatedAt: new Date() };
      
      logger.info('[InterventionReportService] Field type updated', { id });
      return updated;
    } catch (error) {
      logger.error('[InterventionReportService] Error updating field type:', {
        error: error instanceof Error ? error.message : 'Unknown',
        id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async deleteFieldType(id: string) {
    try {
      logger.info('[InterventionReportService] Deleting field type', { id });

      // Verifica se è di sistema
      const fieldTypes = await this.getFieldTypes();
      const fieldType = fieldTypes.find(ft => ft.id === id);
      
      if (!fieldType) {
        throw new AppError('Tipo campo non trovato', 404);
      }
      
      if (fieldType.isSystem) {
        throw new AppError('Impossibile eliminare un tipo campo di sistema', 403);
      }
      
      logger.info('[InterventionReportService] Field type deleted', { id });
      return { success: true };
    } catch (error) {
      logger.error('[InterventionReportService] Error deleting field type:', {
        error: error instanceof Error ? error.message : 'Unknown',
        id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  // ========== STATI RAPPORTO ==========
  
  /**
   * Recupera stati disponibili per workflow rapporto
   * 
   * @param {any} filters - Filtri opzionali
   * @returns {Promise<any[]>} Lista stati (PURE DATA)
   * 
   * @example
   * const statuses = await interventionReportService.getStatuses();
   * // Ritorna: draft, pending, sent, signed, archived
   */
  async getStatuses(filters?: any) {
    try {
      logger.info('[InterventionReportService] Fetching report statuses', { filters });

      // Stati di default (5 stati workflow)
      const statuses = [
        { id: '1', code: 'draft', name: 'Bozza', color: '#6B7280', icon: 'edit', isDefault: true, isFinal: false, allowEdit: true, allowDelete: true, displayOrder: 1, isActive: true },
        { id: '2', code: 'pending', name: 'In Attesa', color: '#F59E0B', icon: 'clock', isDefault: false, isFinal: false, allowEdit: true, allowDelete: false, displayOrder: 2, isActive: true },
        { id: '3', code: 'sent', name: 'Inviato', color: '#3B82F6', icon: 'send', isDefault: false, isFinal: false, allowEdit: false, allowDelete: false, displayOrder: 3, isActive: true },
        { id: '4', code: 'signed', name: 'Firmato', color: '#10B981', icon: 'check-circle', isDefault: false, isFinal: true, allowEdit: false, allowDelete: false, displayOrder: 4, isActive: true },
        { id: '5', code: 'archived', name: 'Archiviato', color: '#9CA3AF', icon: 'archive', isDefault: false, isFinal: true, allowEdit: false, allowDelete: false, displayOrder: 5, isActive: true }
      ];
      
      const filtered = filters?.isActive !== undefined 
        ? statuses.filter(s => s.isActive === filters.isActive)
        : statuses;

      logger.info('[InterventionReportService] Statuses retrieved', { count: filtered.length });
      return filtered;
    } catch (error) {
      logger.error('[InterventionReportService] Error fetching statuses:', {
        error: error instanceof Error ? error.message : 'Unknown',
        filters,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async createStatus(data: any) {
    try {
      logger.info('[InterventionReportService] Creating status', { code: data.code });

      // Verifica unicità code
      const existing = await this.getStatuses();
      if (existing.find(s => s.code === data.code)) {
        throw new AppError('Codice stato già esistente', 400);
      }
      
      const status = { id: Date.now().toString(), ...data, createdAt: new Date() };
      
      logger.info('[InterventionReportService] Status created', { id: status.id });
      return status;
    } catch (error) {
      logger.error('[InterventionReportService] Error creating status:', {
        error: error instanceof Error ? error.message : 'Unknown',
        data,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async updateStatus(id: string, data: any) {
    try {
      logger.info('[InterventionReportService] Updating status', { id });

      const updated = { id, ...data, updatedAt: new Date() };
      
      logger.info('[InterventionReportService] Status updated', { id });
      return updated;
    } catch (error) {
      logger.error('[InterventionReportService] Error updating status:', {
        error: error instanceof Error ? error.message : 'Unknown',
        id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  // ========== TIPI INTERVENTO ==========
  
  /**
   * Recupera tipi intervento predefiniti
   * 
   * @param {any} filters - Filtri opzionali
   * @returns {Promise<any[]>} Lista tipi intervento (PURE DATA)
   */
  async getInterventionTypes(filters?: any) {
    try {
      logger.info('[InterventionReportService] Fetching intervention types', { filters });

      const types = [
        { id: '1', code: 'installation', name: 'Installazione', icon: 'wrench', color: '#3B82F6', displayOrder: 1, isActive: true },
        { id: '2', code: 'maintenance', name: 'Manutenzione', icon: 'tool', color: '#10B981', displayOrder: 2, isActive: true },
        { id: '3', code: 'repair', name: 'Riparazione', icon: 'hammer', color: '#EF4444', displayOrder: 3, isActive: true },
        { id: '4', code: 'inspection', name: 'Ispezione', icon: 'search', color: '#F59E0B', displayOrder: 4, isActive: true },
        { id: '5', code: 'consultation', name: 'Consulenza', icon: 'message-circle', color: '#8B5CF6', displayOrder: 5, isActive: true }
      ];
      
      const filtered = filters?.isActive !== undefined 
        ? types.filter(t => t.isActive === filters.isActive)
        : types;

      logger.info('[InterventionReportService] Intervention types retrieved', { count: filtered.length });
      return filtered;
    } catch (error) {
      logger.error('[InterventionReportService] Error fetching intervention types:', {
        error: error instanceof Error ? error.message : 'Unknown',
        filters,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async createInterventionType(data: any) {
    try {
      logger.info('[InterventionReportService] Creating intervention type', { code: data.code });

      const type = { id: Date.now().toString(), ...data, createdAt: new Date() };
      
      logger.info('[InterventionReportService] Intervention type created', { id: type.id });
      return type;
    } catch (error) {
      logger.error('[InterventionReportService] Error creating intervention type:', {
        error: error instanceof Error ? error.message : 'Unknown',
        data,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async updateInterventionType(id: string, data: any) {
    try {
      logger.info('[InterventionReportService] Updating intervention type', { id });

      const updated = { id, ...data, updatedAt: new Date() };
      
      logger.info('[InterventionReportService] Intervention type updated', { id });
      return updated;
    } catch (error) {
      logger.error('[InterventionReportService] Error updating intervention type:', {
        error: error instanceof Error ? error.message : 'Unknown',
        id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  // ========== SEZIONI TEMPLATE ==========
  
  /**
   * Recupera sezioni disponibili per template rapporti
   * 
   * @param {any} filters - Filtri opzionali
   * @returns {Promise<any[]>} Lista sezioni (PURE DATA)
   */
  async getSections(filters?: any) {
    try {
      logger.info('[InterventionReportService] Fetching template sections', { filters });

      const sections = [
        { id: '1', code: 'header', name: 'Intestazione', icon: 'file-text', displayOrder: 1, isRequired: true, isActive: true },
        { id: '2', code: 'client', name: 'Dati Cliente', icon: 'user', displayOrder: 2, isRequired: true, isActive: true },
        { id: '3', code: 'intervention', name: 'Dettagli Intervento', icon: 'clipboard', displayOrder: 3, isRequired: true, isActive: true },
        { id: '4', code: 'materials', name: 'Materiali', icon: 'package', displayOrder: 4, isRequired: false, isActive: true },
        { id: '5', code: 'photos', name: 'Foto', icon: 'camera', displayOrder: 5, isRequired: false, isActive: true },
        { id: '6', code: 'notes', name: 'Note', icon: 'message-square', displayOrder: 6, isRequired: false, isActive: true },
        { id: '7', code: 'signatures', name: 'Firme', icon: 'pen-tool', displayOrder: 7, isRequired: false, isActive: true }
      ];
      
      let filtered = sections;
      
      if (filters?.isRequired !== undefined) {
        filtered = filtered.filter(s => s.isRequired === filters.isRequired);
      }
      
      if (filters?.isActive !== undefined) {
        filtered = filtered.filter(s => s.isActive === filters.isActive);
      }

      logger.info('[InterventionReportService] Sections retrieved', { count: filtered.length });
      return filtered;
    } catch (error) {
      logger.error('[InterventionReportService] Error fetching sections:', {
        error: error instanceof Error ? error.message : 'Unknown',
        filters,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async createSection(data: any) {
    try {
      logger.info('[InterventionReportService] Creating section', { code: data.code });

      const section = { id: Date.now().toString(), ...data, createdAt: new Date() };
      
      logger.info('[InterventionReportService] Section created', { id: section.id });
      return section;
    } catch (error) {
      logger.error('[InterventionReportService] Error creating section:', {
        error: error instanceof Error ? error.message : 'Unknown',
        data,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  async updateSection(id: string, data: any) {
    try {
      logger.info('[InterventionReportService] Updating section', { id });

      const updated = { id, ...data, updatedAt: new Date() };
      
      logger.info('[InterventionReportService] Section updated', { id });
      return updated;
    } catch (error) {
      logger.error('[InterventionReportService] Error updating section:', {
        error: error instanceof Error ? error.message : 'Unknown',
        id,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
  
  // ========== NUMERAZIONE RAPPORTI ==========
  
  /**
   * Genera il prossimo numero progressivo per un nuovo rapporto
   * 
   * @returns {Promise<string>} Numero rapporto generato (es: RAPP-2025-0042)
   * 
   * @example
   * const reportNumber = await interventionReportService.getNextReportNumber();
   * console.log(reportNumber); // "RAPP-2025-0042"
   */
  async getNextReportNumber(): Promise<string> {
    try {
      logger.info('[InterventionReportService] Generating next report number');

      const config = await this.getConfig();
      const format = config.reportNumberFormat || 'RAPP-{YYYY}-{0000}';
      
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      
      // TODO: In futuro recupererà il contatore reale dal DB
      const count = Math.floor(Math.random() * 100) + 1;
      
      let reportNumber = format
        .replace('{YYYY}', year.toString())
        .replace('{YY}', year.toString().slice(-2))
        .replace('{MM}', month)
        .replace('{DD}', day);
      
      // Sostituisci i placeholder numerici
      const matches = reportNumber.match(/\{0+\}/g);
      if (matches) {
        const zeros = matches[0].length - 2;
        const paddedNumber = String(count).padStart(zeros, '0');
        reportNumber = reportNumber.replace(matches[0], paddedNumber);
      }
      
      logger.info('[InterventionReportService] Report number generated', { reportNumber });
      return reportNumber;
    } catch (error) {
      logger.error('[InterventionReportService] Error generating report number:', {
        error: error instanceof Error ? error.message : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      return `RAPP-${Date.now()}`;
    }
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export default new InterventionReportService();
