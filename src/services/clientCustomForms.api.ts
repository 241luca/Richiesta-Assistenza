/**
 * Client Custom Forms API
 * API service for client-side custom forms operations
 */

import { api } from './api';

export interface ClientReceivedForm {
  id: string;
  requestId: string;
  customFormId: string;
  isCompleted: boolean;
  submittedAt?: string;
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
  CustomForm: {
    id: string;
    name: string;
    description?: string;
    displayType?: string;
    Fields: Array<{
      id: string;
      code: string;
      label: string;
      fieldType: string;
      isRequired: boolean;
      config?: any;
      possibleValues?: any;
      displayOrder: number;
    }>;
  };
  Responses?: Array<{
    id: string;
    fieldId: string;
    fieldName: string;
    fieldType: string;
    value?: string;
    valueJson?: any;
  }>;
  Request?: {
    id: string;
    title: string;
    professionalId?: string;
  };
}

export interface FormResponse {
  fieldId: string;
  fieldName: string;
  fieldType: string;
  value?: string;
  valueJson?: any;
}

class ClientCustomFormsAPI {
  /**
   * Get all forms received for a specific request
   */
  async getRequestForms(requestId: string) {
    const response = await api.get(`/requests/${requestId}/forms`);
    return response.data;
  }

  /**
   * Get a specific form with responses
   */
  async getFormWithResponses(requestCustomFormId: string) {
    const response = await api.get(`/request-forms/${requestCustomFormId}`);
    return response.data;
  }

  /**
   * Save form responses as draft (partial submission)
   */
  async saveDraft(requestCustomFormId: string, responses: FormResponse[]) {
    const response = await api.post(`/request-forms/${requestCustomFormId}/save-draft`, {
      responses
    });
    return response.data;
  }

  /**
   * Submit completed form
   */
  async submitForm(requestCustomFormId: string, responses: FormResponse[]) {
    const response = await api.post(`/request-forms/${requestCustomFormId}/submit`, {
      responses
    });
    return response.data;
  }

  /**
   * Get all pending forms for the current client
   * Ottimizzato con endpoint backend dedicato
   */
  async getPendingForms() {
    try {
      const response = await api.get('/client/pending-forms');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending forms:', error);
      return {
        success: false,
        data: [],
        message: 'Errore nel recupero dei moduli pendenti'
      };
    }
  }

  /**
   * Get all completed forms for the current client
   */
  async getCompletedForms() {
    try {
      const requestsResponse = await api.get('/requests');
      // Assicuriamoci che requests sia sempre un array
      const requestsData = requestsResponse.data.data || requestsResponse.data || [];
      const requests = Array.isArray(requestsData) ? requestsData : [];
      
      const allForms: ClientReceivedForm[] = [];
      for (const request of requests) {
        try {
          const formsResponse = await api.get(`/requests/${request.id}/forms`);
          const forms = formsResponse.data.data || formsResponse.data || [];
          
          forms.forEach((form: ClientReceivedForm) => {
            allForms.push({
              ...form,
              Request: {
                id: request.id,
                title: request.title,
                professionalId: request.professionalId
              }
            });
          });
        } catch (error) {
          console.error(`Error fetching forms for request ${request.id}:`, error);
        }
      }
      
      const completedForms = allForms.filter(form => form.isCompleted);
      
      return {
        success: true,
        data: completedForms,
        message: `${completedForms.length} form completati trovati`
      };
    } catch (error) {
      console.error('Error fetching completed forms:', error);
      return {
        success: false,
        data: [],
        message: 'Errore nel recupero dei form completati'
      };
    }
  }

  /**
   * Get all forms (both pending and completed)
   */
  async getAllForms() {
    try {
      const requestsResponse = await api.get('/requests');
      // Assicuriamoci che requests sia sempre un array
      const requestsData = requestsResponse.data.data || requestsResponse.data || [];
      const requests = Array.isArray(requestsData) ? requestsData : [];
      
      const allForms: ClientReceivedForm[] = [];
      for (const request of requests) {
        try {
          const formsResponse = await api.get(`/requests/${request.id}/forms`);
          const forms = formsResponse.data.data || formsResponse.data || [];
          
          forms.forEach((form: ClientReceivedForm) => {
            allForms.push({
              ...form,
              Request: {
                id: request.id,
                title: request.title,
                professionalId: request.professionalId
              }
            });
          });
        } catch (error) {
          console.error(`Error fetching forms for request ${request.id}:`, error);
        }
      }
      
      return {
        success: true,
        data: allForms,
        message: `${allForms.length} form totali trovati`
      };
    } catch (error) {
      console.error('Error fetching all forms:', error);
      return {
        success: false,
        data: [],
        message: 'Errore nel recupero dei form'
      };
    }
  }
}

export const clientCustomFormsAPI = new ClientCustomFormsAPI();
