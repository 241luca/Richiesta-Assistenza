import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentIntegrationAPI } from '@/services/documentIntegration.api';
import type {
  ExtendedDocumentType,
  DocumentFormTemplates,
  UnifiedDocumentsResponse,
  DocumentStatistics,
  LinkTemplateRequest,
  CreateDocumentFromTemplateRequest
} from '@/services/documentIntegration.api';

// Query Keys
export const documentIntegrationKeys = {
  all: ['documentIntegration'] as const,
  extendedTypes: () => [...documentIntegrationKeys.all, 'extendedTypes'] as const,
  extendedType: (id: string) => [...documentIntegrationKeys.extendedTypes(), id] as const,
  templates: (id: string) => [...documentIntegrationKeys.extendedTypes(), id, 'templates'] as const,
  unifiedDocuments: () => [...documentIntegrationKeys.all, 'unifiedDocuments'] as const,
  document: (type: string, id: string) => [...documentIntegrationKeys.unifiedDocuments(), type, id] as const,
  statistics: () => [...documentIntegrationKeys.all, 'statistics'] as const,
};

// Hook for Extended Document Types
export function useExtendedDocumentTypes(filters?: {
  isActive?: boolean;
  category?: string;
  isRequired?: boolean;
}) {
  return useQuery({
    queryKey: [...documentIntegrationKeys.extendedTypes(), filters],
    queryFn: () => documentIntegrationAPI.getAllExtendedTypes(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for single Extended Document Type
export function useExtendedDocumentType(id: string) {
  return useQuery({
    queryKey: documentIntegrationKeys.extendedType(id),
    queryFn: () => documentIntegrationAPI.getExtendedTypeById(id),
    enabled: !!id,
  });
}

// Hook for Form Templates of a Document Type
export function useFormTemplatesForType(documentTypeId: string) {
  return useQuery({
    queryKey: documentIntegrationKeys.templates(documentTypeId),
    queryFn: () => documentIntegrationAPI.getFormTemplatesForType(documentTypeId),
    enabled: !!documentTypeId,
  });
}

// Hook for Unified Documents
export function useUnifiedDocuments(filters?: {
  type?: string;
  status?: string;
  documentTypeId?: string;
  createdBy?: string;
  limit?: number;
  offset?: number;
}) {
  return useQuery({
    queryKey: [...documentIntegrationKeys.unifiedDocuments(), filters],
    queryFn: () => documentIntegrationAPI.getAllDocuments(filters),
  });
}

// Hook for Document Statistics
export function useDocumentStatistics(filters?: {
  createdBy?: string;
  documentTypeId?: string;
}) {
  return useQuery({
    queryKey: [...documentIntegrationKeys.statistics(), filters],
    queryFn: () => documentIntegrationAPI.getDocumentStatistics(filters),
  });
}

// Hook for single Document
export function useDocument(id: string, type: 'LEGAL' | 'FORM_BASED') {
  return useQuery({
    queryKey: documentIntegrationKeys.document(type, id),
    queryFn: () => documentIntegrationAPI.getDocumentById(id, type),
    enabled: !!id && !!type,
  });
}

// Mutations
export function useLinkFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentTypeId, data }: {
      documentTypeId: string;
      data: LinkTemplateRequest;
    }) => documentIntegrationAPI.linkFormTemplate(documentTypeId, data),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.extendedTypes(),
      });
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.extendedType(variables.documentTypeId),
      });
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.templates(variables.documentTypeId),
      });
    },
  });
}

export function useUnlinkFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentTypeId, templateId }: {
      documentTypeId: string;
      templateId: string;
    }) => documentIntegrationAPI.unlinkFormTemplate(documentTypeId, templateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.extendedTypes(),
      });
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.extendedType(variables.documentTypeId),
      });
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.templates(variables.documentTypeId),
      });
    },
  });
}

export function useSetDefaultFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentTypeId, formTemplateId }: {
      documentTypeId: string;
      formTemplateId: string;
    }) => documentIntegrationAPI.setDefaultFormTemplate(documentTypeId, formTemplateId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.extendedTypes(),
      });
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.extendedType(variables.documentTypeId),
      });
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.templates(variables.documentTypeId),
      });
    },
  });
}

export function useCreateDocumentFromTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDocumentFromTemplateRequest) =>
      documentIntegrationAPI.createDocumentFromTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.unifiedDocuments(),
      });
      queryClient.invalidateQueries({
        queryKey: documentIntegrationKeys.statistics(),
      });
    },
  });
}
