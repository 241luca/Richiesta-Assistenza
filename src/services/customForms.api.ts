import { api } from './api';

export interface CustomFormField {
  id: string;
  code: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  fieldType: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'DATETIME' | 'CHECKBOX' | 'RADIO' | 'SELECT' | 'MULTISELECT' | 'FILE' | 'FILE_IMAGE' | 'SIGNATURE' | 'SLIDER' | 'RATING' | 'TAGS' | 'AUTOCOMPLETE' | 'LOCATION' | 'HIDDEN' | 'RICH_TEXT' | 'DIVIDER' | 'LABEL' | 'EMAIL' | 'PHONE' | 'ADDRESS' | 'URL' | 'PASSWORD' | 'TIME' | 'BOOLEAN' | 'IMAGE';
  displayOrder: number;
  isRequired?: boolean;
  isReadonly?: boolean;
  isHidden?: boolean;
  visibleOnlyToProfessional?: boolean;
  columnSpan?: number;
  rowNumber?: number;
  groupName?: string;
  sectionCode?: string;
  config?: any;
  validationRules?: any;
  defaultValue?: string;
  possibleValues?: string[];
  dependencies?: any;
  showIf?: any;
  requiredIf?: any;
}

export interface CustomForm {
  id: string;
  name: string;
  description?: string;
  version: number;
  isDefault: boolean;
  isPublished: boolean;
  status: string;
  displayType: 'SIMPLE' | 'STANDARD' | 'ADVANCED';
  subcategoryId: string;
  professionalId?: string;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
  fields: CustomFormField[];  // Lowercase (for compatibility)
  Fields?: CustomFormField[]; // PascalCase (as returned by Prisma)
  subcategory?: {
    id: string;
    name: string;
  };
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  // Backend usa PascalCase per le relazioni Prisma
  Professional?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  Subcategory?: {
    id: string;
    name: string;
  };
  CreatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateCustomFormData {
  name: string;
  description?: string;
  subcategoryId: string;
  professionalId?: string;
  displayType?: 'SIMPLE' | 'STANDARD' | 'ADVANCED' | 'MODAL' | 'PAGE' | 'INLINE';
  fields: Omit<CustomFormField, 'id'>[];
}

export interface CustomFormFilters {
  subcategoryId?: string;
  professionalId?: string | null;
  isProfessionalView?: boolean; // Indica se la richiesta proviene da un professional
  professionalSubcategoryIds?: string[]; // IDs delle sottocategorie abilitate per il professional
  isPublished?: boolean;
  isDefault?: boolean;
  displayType?: 'SIMPLE' | 'STANDARD' | 'ADVANCED' | 'MODAL' | 'PAGE' | 'INLINE';
  search?: string;
}

export interface CustomFormStats {
  total: number;
  published: number;
  draft: number;
  bySubcategory: Array<{
    subcategoryId: string;
    _count: { id: number };
  }>;
}

class CustomFormsAPI {
  /**
   * Ottiene tutti i custom forms con filtri opzionali
   */
  async getAllCustomForms(filters: CustomFormFilters = {}) {
    console.log('🔍 CustomFormsAPI.getAllCustomForms - Filters IN:', filters);
    
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        // Per professionalId, inviamo anche null (template repository)
        if (key === 'professionalSubcategoryIds' && Array.isArray(value)) {
          // Converti array in stringa separata da virgole
          const paramValue = value.join(',');
          params.append(key, paramValue);
          console.log(`🔍   - Aggiunto param: ${key} = ${paramValue}`);
        } else {
          const paramValue = value === null ? 'null' : value.toString();
          params.append(key, paramValue);
          console.log(`🔍   - Aggiunto param: ${key} = ${paramValue}`);
        }
      }
    });

    const queryString = params.toString();
    const url = queryString ? `/custom-forms?${queryString}` : '/custom-forms';
    
    console.log('🔍 CustomFormsAPI - URL finale:', url);
    console.log('🔍 CustomFormsAPI - Tutti i params:', Object.fromEntries(params.entries()));
    
    const response = await api.get(url);
    console.log('🔍 CustomFormsAPI - Risposta:', {
      success: response.data.success,
      count: response.data.data?.length || 0
    });
    
    return response;
  }

  /**
   * Ottiene un custom form per ID
   */
  async getCustomFormById(id: string) {
    return api.get(`/custom-forms/${id}`);
  }

  /**
   * Ottiene i custom forms per una sottocategoria specifica
   */
  async getCustomFormsBySubcategory(subcategoryId: string) {
    return api.get(`/custom-forms/subcategory/${subcategoryId}`);
  }

  /**
   * Crea un nuovo custom form
   */
  async createCustomForm(data: CreateCustomFormData) {
    return api.post('/custom-forms', data);
  }

  /**
   * Aggiorna un custom form esistente
   */
  async updateCustomForm(id: string, data: Partial<CreateCustomFormData>) {
    return api.put(`/custom-forms/${id}`, data);
  }

  /**
   * Pubblica un custom form
   */
  async publishCustomForm(id: string) {
    return api.post(`/custom-forms/${id}/publish`, {});
  }

  /**
   * Elimina un custom form
   */
  async deleteCustomForm(id: string) {
    return api.delete(`/custom-forms/${id}`);
  }

  /**
   * Imposta un custom form come default per una sottocategoria
   */
  async setDefaultCustomForm(id: string, subcategoryId: string) {
    return api.patch(`/custom-forms/${id}/set-default`, { subcategoryId });
  }

  /**
   * Ottiene le statistiche sui custom forms
   */
  async getCustomFormStats() {
    return api.get('/custom-forms/stats');
  }

  /**
   * Ottiene tutti i template condivisi
   */
  async getTemplates(filters?: { subcategoryId?: string; search?: string }) {
    const params = new URLSearchParams();
    
    if (filters?.subcategoryId) params.append('subcategoryId', filters.subcategoryId);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `/custom-forms/templates?${queryString}` : '/custom-forms/templates';
    
    return api.get(url);
  }

  /**
   * Clona un form/template esistente
   */
  async cloneForm(id: string, newName?: string) {
    return api.post(`/custom-forms/${id}/clone`, { newName });
  }

  /**
   * Marca o rimuove il flag template da un form
   */
  async markAsTemplate(id: string, isTemplate: boolean) {
    return api.patch(`/custom-forms/${id}/template`, { isTemplate });
  }

  /**
   * Invia un form a una richiesta specifica
   */
  async sendFormToRequest(formId: string, requestId: string) {
    return api.post(`/custom-forms/${formId}/send`, { requestId });
  }

  /**
   * Ottiene tutti i form inviati a una richiesta
   */
  async getRequestForms(requestId: string) {
    return api.get(`/requests/${requestId}/forms`);
  }

  /**
   * Salva le risposte parziali (draft)
   */
  async saveDraft(requestCustomFormId: string, responses: any[]) {
    return api.post(`/request-forms/${requestCustomFormId}/save-draft`, { responses });
  }

  /**
   * Invia le risposte finali del form
   */
  async submitForm(requestCustomFormId: string, responses: any[]) {
    return api.post(`/request-forms/${requestCustomFormId}/submit`, { responses });
  }

  /**
   * Marca un form come verificato dal professionista
   */
  async verifyForm(requestCustomFormId: string, isVerified: boolean) {
    return api.patch(`/request-forms/${requestCustomFormId}/verify`, { isVerified });
  }
}

export const customFormsAPI = new CustomFormsAPI();