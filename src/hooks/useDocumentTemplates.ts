// hooks/useDocumentTemplates.ts
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export const useDocumentTemplates = () => {
  return useQuery({
    queryKey: ['legal-document-templates'],
    queryFn: async () => {
      const response = await api.get('/admin/legal-documents/templates');
      return response.data?.data || [];
    },
    staleTime: 10 * 60 * 1000 // Cache per 10 minuti
  });
};

export const useDocumentTypes = () => {
  return useQuery({
    queryKey: ['document-types-active'],
    queryFn: async () => {
      const response = await api.get('/admin/document-types?isActive=true');
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000 // Cache per 5 minuti
  });
};

export const useDocumentStatuses = () => {
  // Invece di enum hardcoded, carichiamo dal database
  return useQuery({
    queryKey: ['document-statuses'],
    queryFn: async () => {
      const response = await api.get('/admin/system-enums/version-status');
      return response.data?.data || [
        { value: 'DRAFT', label: 'Bozza' },
        { value: 'REVIEW', label: 'In Revisione' },
        { value: 'APPROVED', label: 'Approvato' },
        { value: 'PUBLISHED', label: 'Pubblicato' },
        { value: 'ARCHIVED', label: 'Archiviato' }
      ];
    },
    staleTime: 10 * 60 * 1000
  });
};
