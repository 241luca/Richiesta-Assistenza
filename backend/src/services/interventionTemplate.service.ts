import { AppError } from '../utils/errors';

class InterventionTemplateService {
  // ========== TEMPLATE BASE ==========
  
  async getTemplates(filters?: any) {
    try {
      // Per ora ritorna template mock
      const templates = [
        {
          id: '1',
          name: 'Template Standard Idraulico',
          description: 'Template base per interventi idraulici',
          subcategoryId: '1',
          categoryId: '1',
          isGeneric: false,
          isActive: true,
          isDefault: true,
          isPublic: true,
          version: 1,
          settings: {
            showMaterials: true,
            showPhotos: true,
            showSignature: true,
            requireClientSignature: false
          },
          requiredSections: ['header', 'client', 'intervention', 'signatures'],
          layout: {
            columns: 2,
            style: 'professional'
          },
          createdBy: 'system',
          createdAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'Template Standard Elettrico',
          description: 'Template base per interventi elettrici',
          subcategoryId: '2',
          categoryId: '2',
          isGeneric: false,
          isActive: true,
          isDefault: true,
          isPublic: true,
          version: 1,
          settings: {
            showMaterials: true,
            showPhotos: true,
            showSignature: true,
            requireClientSignature: true
          },
          requiredSections: ['header', 'client', 'intervention', 'materials', 'signatures'],
          layout: {
            columns: 2,
            style: 'professional'
          },
          createdBy: 'system',
          createdAt: new Date('2024-01-01')
        },
        {
          id: '3',
          name: 'Template Generico',
          description: 'Template generico per qualsiasi intervento',
          subcategoryId: null,
          categoryId: null,
          isGeneric: true,
          isActive: true,
          isDefault: false,
          isPublic: true,
          version: 1,
          settings: {
            showMaterials: true,
            showPhotos: true,
            showSignature: true,
            requireClientSignature: false
          },
          requiredSections: ['header', 'client', 'intervention', 'notes', 'signatures'],
          layout: {
            columns: 1,
            style: 'simple'
          },
          createdBy: 'system',
          createdAt: new Date('2024-01-01')
        }
      ];
      
      // Applica filtri
      let filtered = templates;
      
      if (filters?.isActive !== undefined) {
        filtered = filtered.filter(t => t.isActive === filters.isActive);
      }
      
      if (filters?.isGeneric !== undefined) {
        filtered = filtered.filter(t => t.isGeneric === filters.isGeneric);
      }
      
      if (filters?.subcategoryId) {
        filtered = filtered.filter(t => t.subcategoryId === filters.subcategoryId);
      }
      
      if (filters?.categoryId) {
        filtered = filtered.filter(t => t.categoryId === filters.categoryId);
      }
      
      return filtered;
    } catch (error) {
      console.error('Errore recupero template:', error);
      throw error;
    }
  }
  
  async getTemplateById(id: string) {
    try {
      const templates = await this.getTemplates();
      const template = templates.find(t => t.id === id);
      
      if (!template) {
        throw new AppError('Template non trovato', 404);
      }
      
      // Aggiungi i campi del template
      const fields = await this.getTemplateFields(id);
      
      return {
        ...template,
        fields
      };
    } catch (error) {
      console.error('Errore recupero template:', error);
      throw error;
    }
  }
  
  async createTemplate(data: any, recipientId: string) {
    try {
      // Verifica unicità nome
      const existing = await this.getTemplates();
      if (existing.find(t => t.name === data.name)) {
        throw new AppError('Nome template già esistente', 400);
      }
      
      const template = {
        id: Date.now().toString(),
        ...data,
        version: 1,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('Template creato:', template);
      return template;
    } catch (error) {
      console.error('Errore creazione template:', error);
      throw error;
    }
  }
  
  async updateTemplate(id: string, data: any, recipientId: string) {
    try {
      const template = await this.getTemplateById(id);
      
      // Verifica permessi (solo creatore o admin)
      // In produzione verificare realmente i permessi
      
      const updated = {
        ...template,
        ...data,
        version: (template.version || 0) + 1,
        updatedAt: new Date()
      };
      
      console.log('Template aggiornato:', updated);
      return updated;
    } catch (error) {
      console.error('Errore aggiornamento template:', error);
      throw error;
    }
  }
  
  async deleteTemplate(id: string, recipientId: string) {
    try {
      const template = await this.getTemplateById(id);
      
      // Verifica se è template di sistema
      if (template.createdBy === 'system') {
        throw new AppError('Impossibile eliminare un template di sistema', 403);
      }
      
      // Verifica se è in uso (in produzione controllare nel DB)
      // TODO: Verificare utilizzo in rapporti esistenti
      
      console.log('Template eliminato:', id);
      return { success: true };
    } catch (error) {
      console.error('Errore eliminazione template:', error);
      throw error;
    }
  }
  
  async cloneTemplate(id: string, recipientId: string, newName: string) {
    try {
      const original = await this.getTemplateById(id);
      
      const clone = {
        ...original,
        id: Date.now().toString(),
        name: newName || `${original.name} (Copia)`,
        isDefault: false,
        isPublic: false,
        createdBy: userId,
        createdAt: new Date(),
        version: 1
      };
      
      console.log('Template clonato:', clone);
      return clone;
    } catch (error) {
      console.error('Errore clonazione template:', error);
      throw error;
    }
  }
  
  // ========== CAMPI TEMPLATE ==========
  
  async getTemplateFields(templateId: string) {
    try {
      // Campi mock per template
      const fields = [
        {
          id: '1',
          templateId,
          code: 'client_name',
          label: 'Nome Cliente',
          placeholder: 'Inserisci il nome del cliente',
          helpText: null,
          tooltip: null,
          fieldTypeId: '1', // text
          sectionCode: 'client',
          displayOrder: 1,
          columnSpan: 1,
          rowNumber: 1,
          groupName: null,
          isRequired: true,
          isReadonly: false,
          isHidden: false,
          showOnPDF: true,
          showOnClient: true,
          showOnMobile: true,
          defaultValue: null,
          possibleValues: null,
          validationRules: {
            minLength: 2,
            maxLength: 100
          },
          config: null,
          dependencies: null,
          calculations: null,
          showIf: null,
          requiredIf: null
        },
        {
          id: '2',
          templateId,
          code: 'client_address',
          label: 'Indirizzo',
          placeholder: 'Via, numero civico',
          helpText: null,
          tooltip: null,
          fieldTypeId: '1', // text
          sectionCode: 'client',
          displayOrder: 2,
          columnSpan: 2,
          rowNumber: 2,
          groupName: null,
          isRequired: true,
          isReadonly: false,
          isHidden: false,
          showOnPDF: true,
          showOnClient: true,
          showOnMobile: true,
          defaultValue: null,
          possibleValues: null,
          validationRules: null,
          config: null,
          dependencies: null,
          calculations: null,
          showIf: null,
          requiredIf: null
        },
        {
          id: '3',
          templateId,
          code: 'intervention_date',
          label: 'Data Intervento',
          placeholder: null,
          helpText: null,
          tooltip: null,
          fieldTypeId: '4', // date
          sectionCode: 'intervention',
          displayOrder: 3,
          columnSpan: 1,
          rowNumber: 1,
          groupName: 'Dettagli Intervento',
          isRequired: true,
          isReadonly: false,
          isHidden: false,
          showOnPDF: true,
          showOnClient: true,
          showOnMobile: true,
          defaultValue: 'today',
          possibleValues: null,
          validationRules: null,
          config: null,
          dependencies: null,
          calculations: null,
          showIf: null,
          requiredIf: null
        },
        {
          id: '4',
          templateId,
          code: 'intervention_description',
          label: 'Descrizione Intervento',
          placeholder: 'Descrivi l\'intervento effettuato',
          helpText: 'Inserisci una descrizione dettagliata del lavoro svolto',
          tooltip: null,
          fieldTypeId: '2', // textarea
          sectionCode: 'intervention',
          displayOrder: 4,
          columnSpan: 2,
          rowNumber: 2,
          groupName: 'Dettagli Intervento',
          isRequired: true,
          isReadonly: false,
          isHidden: false,
          showOnPDF: true,
          showOnClient: true,
          showOnMobile: true,
          defaultValue: null,
          possibleValues: null,
          validationRules: {
            minLength: 10,
            maxLength: 2000
          },
          config: {
            rows: 5
          },
          dependencies: null,
          calculations: null,
          showIf: null,
          requiredIf: null
        },
        {
          id: '5',
          templateId,
          code: 'work_completed',
          label: 'Lavoro Completato',
          placeholder: null,
          helpText: null,
          tooltip: 'Indica se il lavoro è stato completato',
          fieldTypeId: '7', // checkbox
          sectionCode: 'intervention',
          displayOrder: 5,
          columnSpan: 1,
          rowNumber: 3,
          groupName: 'Dettagli Intervento',
          isRequired: false,
          isReadonly: false,
          isHidden: false,
          showOnPDF: true,
          showOnClient: true,
          showOnMobile: true,
          defaultValue: 'false',
          possibleValues: null,
          validationRules: null,
          config: null,
          dependencies: null,
          calculations: null,
          showIf: null,
          requiredIf: null
        },
        {
          id: '6',
          templateId,
          code: 'follow_up_required',
          label: 'Richiede Follow-up',
          placeholder: null,
          helpText: null,
          tooltip: 'Seleziona se è necessario un intervento successivo',
          fieldTypeId: '7', // checkbox
          sectionCode: 'intervention',
          displayOrder: 6,
          columnSpan: 1,
          rowNumber: 3,
          groupName: 'Dettagli Intervento',
          isRequired: false,
          isReadonly: false,
          isHidden: false,
          showOnPDF: true,
          showOnClient: true,
          showOnMobile: true,
          defaultValue: 'false',
          possibleValues: null,
          validationRules: null,
          config: null,
          dependencies: null,
          calculations: null,
          showIf: null,
          requiredIf: null
        },
        {
          id: '7',
          templateId,
          code: 'follow_up_notes',
          label: 'Note Follow-up',
          placeholder: 'Descrivi il follow-up necessario',
          helpText: null,
          tooltip: null,
          fieldTypeId: '2', // textarea
          sectionCode: 'intervention',
          displayOrder: 7,
          columnSpan: 2,
          rowNumber: 4,
          groupName: 'Dettagli Intervento',
          isRequired: false,
          isReadonly: false,
          isHidden: false,
          showOnPDF: true,
          showOnClient: true,
          showOnMobile: true,
          defaultValue: null,
          possibleValues: null,
          validationRules: null,
          config: {
            rows: 3
          },
          dependencies: null,
          calculations: null,
          showIf: {
            field: 'follow_up_required',
            value: 'true'
          },
          requiredIf: {
            field: 'follow_up_required',
            value: 'true'
          }
        }
      ];
      
      return fields.filter(f => f.templateId === templateId);
    } catch (error) {
      console.error('Errore recupero campi template:', error);
      throw error;
    }
  }
  
  async addFieldToTemplate(templateId: string, fieldData: any) {
    try {
      // Verifica template
      await this.getTemplateById(templateId);
      
      // Verifica unicità code
      const existing = await this.getTemplateFields(templateId);
      if (existing.find(f => f.code === fieldData.code)) {
        throw new AppError('Codice campo già esistente nel template', 400);
      }
      
      const field = {
        id: Date.now().toString(),
        templateId,
        ...fieldData,
        createdAt: new Date()
      };
      
      console.log('Campo aggiunto al template:', field);
      return field;
    } catch (error) {
      console.error('Errore aggiunta campo:', error);
      throw error;
    }
  }
  
  async updateTemplateField(templateId: string, fieldId: string, data: any) {
    try {
      const fields = await this.getTemplateFields(templateId);
      const field = fields.find(f => f.id === fieldId);
      
      if (!field) {
        throw new AppError('Campo non trovato', 404);
      }
      
      const updated = {
        ...field,
        ...data,
        updatedAt: new Date()
      };
      
      console.log('Campo template aggiornato:', updated);
      return updated;
    } catch (error) {
      console.error('Errore aggiornamento campo:', error);
      throw error;
    }
  }
  
  async deleteTemplateField(templateId: string, fieldId: string) {
    try {
      const fields = await this.getTemplateFields(templateId);
      const field = fields.find(f => f.id === fieldId);
      
      if (!field) {
        throw new AppError('Campo non trovato', 404);
      }
      
      console.log('Campo eliminato dal template:', fieldId);
      return { success: true };
    } catch (error) {
      console.error('Errore eliminazione campo:', error);
      throw error;
    }
  }
  
  async reorderTemplateFields(templateId: string, fieldOrders: any[]) {
    try {
      // Verifica template
      await this.getTemplateById(templateId);
      
      // In produzione aggiornare gli ordini nel DB
      console.log('Campi riordinati:', fieldOrders);
      
      return { success: true };
    } catch (error) {
      console.error('Errore riordino campi:', error);
      throw error;
    }
  }
}

export default new InterventionTemplateService();
