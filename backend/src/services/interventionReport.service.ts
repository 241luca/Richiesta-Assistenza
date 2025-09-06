import { db } from '../utils/db';
import { AppError } from '../utils/errors';
import { eq } from 'drizzle-orm';

class InterventionReportService {
  // ========== CONFIGURAZIONE GLOBALE ==========
  
  async getConfig() {
    try {
      // Per ora ritorna configurazione di default
      // In futuro recupererà da tabella interventionReportConfig
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
      
      return defaultConfig;
    } catch (error) {
      console.error('Errore recupero configurazione:', error);
      throw error;
    }
  }
  
  async updateConfig(data: any) {
    try {
      // Per ora aggiorna solo in memoria
      // In futuro aggiornerà la tabella interventionReportConfig
      console.log('Aggiornamento configurazione:', data);
      
      return {
        ...data,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Errore aggiornamento configurazione:', error);
      throw error;
    }
  }
  
  // ========== TIPI CAMPO ==========
  
  async getFieldTypes(filters?: any) {
    try {
      // Lista tipi campo di default
      const fieldTypes = [
        {
          id: '1',
          code: 'text',
          name: 'Campo Testo',
          description: 'Campo di input testo semplice',
          inputType: 'text',
          icon: 'type',
          displayOrder: 1,
          isActive: true,
          isSystem: true
        },
        {
          id: '2',
          code: 'textarea',
          name: 'Area di Testo',
          description: 'Campo di testo multi-riga',
          inputType: 'textarea',
          icon: 'text',
          displayOrder: 2,
          isActive: true,
          isSystem: true
        },
        {
          id: '3',
          code: 'number',
          name: 'Numero',
          description: 'Campo numerico',
          inputType: 'number',
          icon: 'hash',
          displayOrder: 3,
          isActive: true,
          isSystem: true
        },
        {
          id: '4',
          code: 'date',
          name: 'Data',
          description: 'Selettore data',
          inputType: 'date',
          icon: 'calendar',
          displayOrder: 4,
          isActive: true,
          isSystem: true
        },
        {
          id: '5',
          code: 'time',
          name: 'Ora',
          description: 'Selettore orario',
          inputType: 'time',
          icon: 'clock',
          displayOrder: 5,
          isActive: true,
          isSystem: true
        },
        {
          id: '6',
          code: 'select',
          name: 'Selezione',
          description: 'Menu a tendina',
          inputType: 'select',
          icon: 'list',
          displayOrder: 6,
          isActive: true,
          isSystem: true
        },
        {
          id: '7',
          code: 'checkbox',
          name: 'Checkbox',
          description: 'Casella di controllo',
          inputType: 'checkbox',
          icon: 'check-square',
          displayOrder: 7,
          isActive: true,
          isSystem: true
        },
        {
          id: '8',
          code: 'radio',
          name: 'Scelta Singola',
          description: 'Pulsanti radio',
          inputType: 'radio',
          icon: 'circle-dot',
          displayOrder: 8,
          isActive: true,
          isSystem: true
        },
        {
          id: '9',
          code: 'photo',
          name: 'Foto',
          description: 'Upload foto',
          inputType: 'file',
          icon: 'camera',
          displayOrder: 9,
          isActive: true,
          isSystem: true
        },
        {
          id: '10',
          code: 'signature',
          name: 'Firma',
          description: 'Campo firma digitale',
          inputType: 'signature',
          icon: 'pen',
          displayOrder: 10,
          isActive: true,
          isSystem: true
        }
      ];
      
      if (filters?.isActive !== undefined) {
        return fieldTypes.filter(ft => ft.isActive === filters.isActive);
      }
      
      return fieldTypes;
    } catch (error) {
      console.error('Errore recupero tipi campo:', error);
      throw error;
    }
  }
  
  async createFieldType(data: any) {
    try {
      // Verifica unicità code
      const existing = await this.getFieldTypes();
      if (existing.find(ft => ft.code === data.code)) {
        throw new AppError('Codice tipo campo già esistente', 400);
      }
      
      // In futuro salverà nel DB
      const fieldType = {
        id: Date.now().toString(),
        ...data,
        isSystem: false,
        createdAt: new Date()
      };
      
      console.log('Tipo campo creato:', fieldType);
      return fieldType;
    } catch (error) {
      console.error('Errore creazione tipo campo:', error);
      throw error;
    }
  }
  
  async updateFieldType(id: string, data: any) {
    try {
      // In futuro aggiornerà nel DB
      const updated = {
        id,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Tipo campo aggiornato:', updated);
      return updated;
    } catch (error) {
      console.error('Errore aggiornamento tipo campo:', error);
      throw error;
    }
  }
  
  async deleteFieldType(id: string) {
    try {
      // Verifica se è di sistema
      const fieldTypes = await this.getFieldTypes();
      const fieldType = fieldTypes.find(ft => ft.id === id);
      
      if (!fieldType) {
        throw new AppError('Tipo campo non trovato', 404);
      }
      
      if (fieldType.isSystem) {
        throw new AppError('Impossibile eliminare un tipo campo di sistema', 403);
      }
      
      console.log('Tipo campo eliminato:', id);
      return { success: true };
    } catch (error) {
      console.error('Errore eliminazione tipo campo:', error);
      throw error;
    }
  }
  
  // ========== STATI RAPPORTO ==========
  
  async getStatuses(filters?: any) {
    try {
      // Stati di default
      const statuses = [
        {
          id: '1',
          code: 'draft',
          name: 'Bozza',
          description: 'Rapporto in fase di compilazione',
          color: '#6B7280',
          icon: 'edit',
          isDefault: true,
          isFinal: false,
          allowEdit: true,
          allowDelete: true,
          displayOrder: 1,
          isActive: true
        },
        {
          id: '2',
          code: 'pending',
          name: 'In Attesa',
          description: 'In attesa di firma o approvazione',
          color: '#F59E0B',
          icon: 'clock',
          isDefault: false,
          isFinal: false,
          allowEdit: true,
          allowDelete: false,
          displayOrder: 2,
          isActive: true
        },
        {
          id: '3',
          code: 'sent',
          name: 'Inviato',
          description: 'Inviato al cliente',
          color: '#3B82F6',
          icon: 'send',
          isDefault: false,
          isFinal: false,
          allowEdit: false,
          allowDelete: false,
          displayOrder: 3,
          isActive: true
        },
        {
          id: '4',
          code: 'signed',
          name: 'Firmato',
          description: 'Firmato da entrambe le parti',
          color: '#10B981',
          icon: 'check-circle',
          isDefault: false,
          isFinal: true,
          allowEdit: false,
          allowDelete: false,
          displayOrder: 4,
          isActive: true
        },
        {
          id: '5',
          code: 'archived',
          name: 'Archiviato',
          description: 'Rapporto archiviato',
          color: '#9CA3AF',
          icon: 'archive',
          isDefault: false,
          isFinal: true,
          allowEdit: false,
          allowDelete: false,
          displayOrder: 5,
          isActive: true
        }
      ];
      
      if (filters?.isActive !== undefined) {
        return statuses.filter(s => s.isActive === filters.isActive);
      }
      
      return statuses;
    } catch (error) {
      console.error('Errore recupero stati:', error);
      throw error;
    }
  }
  
  async createStatus(data: any) {
    try {
      // Verifica unicità code
      const existing = await this.getStatuses();
      if (existing.find(s => s.code === data.code)) {
        throw new AppError('Codice stato già esistente', 400);
      }
      
      const status = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date()
      };
      
      console.log('Stato creato:', status);
      return status;
    } catch (error) {
      console.error('Errore creazione stato:', error);
      throw error;
    }
  }
  
  async updateStatus(id: string, data: any) {
    try {
      const updated = {
        id,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Stato aggiornato:', updated);
      return updated;
    } catch (error) {
      console.error('Errore aggiornamento stato:', error);
      throw error;
    }
  }
  
  // ========== TIPI INTERVENTO ==========
  
  async getInterventionTypes(filters?: any) {
    try {
      const types = [
        {
          id: '1',
          code: 'installation',
          name: 'Installazione',
          description: 'Installazione nuovo impianto o componente',
          icon: 'wrench',
          color: '#3B82F6',
          displayOrder: 1,
          isActive: true
        },
        {
          id: '2',
          code: 'maintenance',
          name: 'Manutenzione',
          description: 'Manutenzione ordinaria o straordinaria',
          icon: 'tool',
          color: '#10B981',
          displayOrder: 2,
          isActive: true
        },
        {
          id: '3',
          code: 'repair',
          name: 'Riparazione',
          description: 'Riparazione guasto',
          icon: 'hammer',
          color: '#EF4444',
          displayOrder: 3,
          isActive: true
        },
        {
          id: '4',
          code: 'inspection',
          name: 'Ispezione',
          description: 'Controllo e verifica',
          icon: 'search',
          color: '#F59E0B',
          displayOrder: 4,
          isActive: true
        },
        {
          id: '5',
          code: 'consultation',
          name: 'Consulenza',
          description: 'Consulenza tecnica',
          icon: 'message-circle',
          color: '#8B5CF6',
          displayOrder: 5,
          isActive: true
        }
      ];
      
      if (filters?.isActive !== undefined) {
        return types.filter(t => t.isActive === filters.isActive);
      }
      
      return types;
    } catch (error) {
      console.error('Errore recupero tipi intervento:', error);
      throw error;
    }
  }
  
  async createInterventionType(data: any) {
    try {
      const type = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date()
      };
      
      console.log('Tipo intervento creato:', type);
      return type;
    } catch (error) {
      console.error('Errore creazione tipo intervento:', error);
      throw error;
    }
  }
  
  async updateInterventionType(id: string, data: any) {
    try {
      const updated = {
        id,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Tipo intervento aggiornato:', updated);
      return updated;
    } catch (error) {
      console.error('Errore aggiornamento tipo intervento:', error);
      throw error;
    }
  }
  
  // ========== SEZIONI TEMPLATE ==========
  
  async getSections(filters?: any) {
    try {
      const sections = [
        {
          id: '1',
          code: 'header',
          name: 'Intestazione',
          description: 'Dati principali del rapporto',
          icon: 'file-text',
          displayOrder: 1,
          isRequired: true,
          isActive: true
        },
        {
          id: '2',
          code: 'client',
          name: 'Dati Cliente',
          description: 'Informazioni del cliente',
          icon: 'user',
          displayOrder: 2,
          isRequired: true,
          isActive: true
        },
        {
          id: '3',
          code: 'intervention',
          name: 'Dettagli Intervento',
          description: 'Descrizione dell\'intervento',
          icon: 'clipboard',
          displayOrder: 3,
          isRequired: true,
          isActive: true
        },
        {
          id: '4',
          code: 'materials',
          name: 'Materiali',
          description: 'Materiali utilizzati',
          icon: 'package',
          displayOrder: 4,
          isRequired: false,
          isActive: true
        },
        {
          id: '5',
          code: 'photos',
          name: 'Foto',
          description: 'Documentazione fotografica',
          icon: 'camera',
          displayOrder: 5,
          isRequired: false,
          isActive: true
        },
        {
          id: '6',
          code: 'notes',
          name: 'Note',
          description: 'Note e raccomandazioni',
          icon: 'message-square',
          displayOrder: 6,
          isRequired: false,
          isActive: true
        },
        {
          id: '7',
          code: 'signatures',
          name: 'Firme',
          description: 'Firme di validazione',
          icon: 'pen-tool',
          displayOrder: 7,
          isRequired: false,
          isActive: true
        }
      ];
      
      if (filters?.isRequired !== undefined) {
        return sections.filter(s => s.isRequired === filters.isRequired);
      }
      
      if (filters?.isActive !== undefined) {
        return sections.filter(s => s.isActive === filters.isActive);
      }
      
      return sections;
    } catch (error) {
      console.error('Errore recupero sezioni:', error);
      throw error;
    }
  }
  
  async createSection(data: any) {
    try {
      const section = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date()
      };
      
      console.log('Sezione creata:', section);
      return section;
    } catch (error) {
      console.error('Errore creazione sezione:', error);
      throw error;
    }
  }
  
  async updateSection(id: string, data: any) {
    try {
      const updated = {
        id,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Sezione aggiornata:', updated);
      return updated;
    } catch (error) {
      console.error('Errore aggiornamento sezione:', error);
      throw error;
    }
  }
  
  // ========== NUMERAZIONE RAPPORTI ==========
  
  async getNextReportNumber(): Promise<string> {
    try {
      const config = await this.getConfig();
      const format = config.reportNumberFormat || 'RAPP-{YYYY}-{0000}';
      
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const day = String(new Date().getDate()).padStart(2, '0');
      
      // Per ora usa un numero progressivo simulato
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
      
      return reportNumber;
    } catch (error) {
      console.error('Errore generazione numero rapporto:', error);
      return `RAPP-${Date.now()}`;
    }
  }
}

export default new InterventionReportService();
