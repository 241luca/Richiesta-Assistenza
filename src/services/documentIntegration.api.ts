import api from './api';

export interface ExtendedDocumentType {
  id: string;
  code: string;
  name: string;
  displayName: string;
  description?: string;
  icon?: string;
  color?: string;
  category?: string;
  sortOrder: number;
  isSystem: boolean;
  isActive: boolean;
  isRequired: boolean;
  requiresApproval: boolean;
  requiresSignature: boolean;
  allowCustomForms: boolean;
  enableVersioning: boolean;
  formTemplateId?: string;
  formTemplateName?: string;
  formTemplateFields?: number;
  documentCount: number;
  templateCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string;
  fieldCount: number;
  isDefault: boolean;
  isPublished: boolean;
  usageCount: number;
  createdAt: string;
}

export interface DocumentFormTemplates {
  defaultTemplate?: FormTemplate;
  availableTemplates: FormTemplate[];
}

export interface UnifiedDocument {
  id: string;
  type: 'LEGAL' | 'FORM_BASED';
  title: string;
  description?: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  documentType?: {
    code: string;
    name: string;
    displayName: string;
  };
  isFormBased: boolean;
  fieldCount?: number;
  metadata?: any;
}

export interface UnifiedDocumentsResponse {
  documents: UnifiedDocument[];
  total: number;
  limit: number;
  offset: number;
}

export interface DocumentStatistics {
  total: number;
  legalDocuments: number;
  formBasedDocuments: number;
  draftDocuments: number;
  publishedDocuments: number;
}

export interface LinkTemplateRequest {
  formTemplateId: string;
  isDefault: boolean;
}

export interface CreateDocumentFromTemplateRequest {
  documentTypeId: string;
  title: string;
  description?: string;
  formTemplateId: string;
  metadata?: any;
}

// Extended Document Types API
export const documentIntegrationAPI = {
  // Get all extended document types
  getAllExtendedTypes: async (filters?: {
    isActive?: boolean;
    category?: string;
    isRequired?: boolean;
  }): Promise<ExtendedDocumentType[]> => {
    const params = new URLSearchParams();
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.category) params.append('category', filters.category);
    if (filters?.isRequired !== undefined) params.append('isRequired', String(filters.isRequired));

    const response = await api.get(`/admin/document-types-extended?${params.toString()}`);
    return response.data?.data || [];
  },

  // Get extended document type by ID
  getExtendedTypeById: async (id: string): Promise<ExtendedDocumentType> => {
    const response = await api.get(`/admin/document-types-extended/${id}`);
    return response.data?.data;
  },

  // Link form template to document type
  linkFormTemplate: async (
    documentTypeId: string,
    data: LinkTemplateRequest
  ): Promise<any> => {
    const response = await api.post(
      `/admin/document-types-extended/${documentTypeId}/link-template`,
      data
    );
    return response.data?.data;
  },

  // Unlink form template from document type
  unlinkFormTemplate: async (
    documentTypeId: string,
    templateId: string
  ): Promise<any> => {
    const response = await api.delete(
      `/admin/document-types-extended/${documentTypeId}/unlink-template/${templateId}`
    );
    return response.data?.data;
  },

  // Get form templates for document type
  getFormTemplatesForType: async (
    documentTypeId: string
  ): Promise<DocumentFormTemplates> => {
    const response = await api.get(
      `/admin/document-types-extended/${documentTypeId}/templates`
    );
    return response.data?.data;
  },

  // Set default form template
  setDefaultFormTemplate: async (
    documentTypeId: string,
    formTemplateId: string
  ): Promise<any> => {
    const response = await api.put(
      `/admin/document-types-extended/${documentTypeId}/default-template`,
      { formTemplateId }
    );
    return response.data?.data;
  },

  // Unified Documents API
  getAllDocuments: async (filters?: {
    type?: string;
    status?: string;
    documentTypeId?: string;
    createdBy?: string;
    limit?: number;
    offset?: number;
  }): Promise<UnifiedDocumentsResponse> => {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.documentTypeId) params.append('documentTypeId', filters.documentTypeId);
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);
    if (filters?.limit) params.append('limit', String(filters.limit));
    if (filters?.offset) params.append('offset', String(filters.offset));

    const response = await api.get(`/unified-documents?${params.toString()}`);
    return response.data?.data;
  },

  // Get document statistics
  getDocumentStatistics: async (filters?: {
    createdBy?: string;
    documentTypeId?: string;
  }): Promise<DocumentStatistics> => {
    const params = new URLSearchParams();
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);
    if (filters?.documentTypeId) params.append('documentTypeId', filters.documentTypeId);

    const response = await api.get(`/unified-documents/statistics?${params.toString()}`);
    return response.data?.data;
  },

  // Get document by ID
  getDocumentById: async (
    id: string,
    type: 'LEGAL' | 'FORM_BASED'
  ): Promise<UnifiedDocument> => {
    const response = await api.get(`/unified-documents/${type}/${id}`);
    return response.data?.data;
  },

  // Create document from template
  createDocumentFromTemplate: async (
    data: CreateDocumentFromTemplateRequest
  ): Promise<any> => {
    const response = await api.post('/unified-documents/from-template', data);
    return response.data?.data;
  }
};
