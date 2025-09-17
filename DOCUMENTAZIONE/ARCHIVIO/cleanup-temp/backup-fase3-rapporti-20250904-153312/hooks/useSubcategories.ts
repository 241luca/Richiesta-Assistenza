import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { toast } from 'react-hot-toast';

interface SubcategoryFilters {
  categoryId?: string;
  isActive?: boolean;
  includeAiSettings?: boolean;
}

export function useSubcategories(filters: SubcategoryFilters = {}) {
  return useQuery({
    queryKey: ['subcategories', filters],
    queryFn: async () => {
      const params: any = {};
      
      if (filters.categoryId) {
        params.categoryId = filters.categoryId;
      }
      
      if (filters.isActive !== undefined) {
        params.isActive = filters.isActive ? 'true' : 'false';
      }
      
      if (filters.includeAiSettings) {
        params.includeAiSettings = 'true';
      }
      
      const response = await api.get('/api/subcategories', { params });
      // ✅ CORRETTO: Usa ResponseFormatter format response.data.data
      return response.data.data;
    },
  });
}

export function useSubcategory(id: string) {
  return useQuery({
    queryKey: ['subcategory', id],
    queryFn: async () => {
      const response = await api.get(`/api/subcategories/${id}`);
      // ✅ CORRETTO: Usa ResponseFormatter format response.data.data
      return response.data.data;
    },
    enabled: !!id,
  });
}

export function useSubcategoryProfessionals(subcategoryId: string) {
  return useQuery({
    queryKey: ['subcategory-professionals', subcategoryId],
    queryFn: async () => {
      const response = await api.get(`/api/subcategories/${subcategoryId}/professionals`);
      // ✅ CORRETTO: Usa ResponseFormatter format response.data.data
      return response.data.data;
    },
    enabled: !!subcategoryId,
  });
}

export function useCreateSubcategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/api/subcategories', data);
      // ✅ CORRETTO: Usa ResponseFormatter format response.data.data
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Sottocategoria creata con successo');
    },
    onError: (error: any) => {
      // ✅ CORRETTO: Gestisce nuovo formato errore ResponseFormatter
      const message = error.response?.data?.message || error.response?.data?.error?.details || 'Errore durante la creazione';
      toast.error(message);
    },
  });
}

export function useUpdateSubcategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/api/subcategories/${id}`, data);
      // ✅ CORRETTO: Usa ResponseFormatter format response.data.data
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['subcategory', variables.id] });
      toast.success('Sottocategoria aggiornata con successo');
    },
    onError: (error: any) => {
      // ✅ CORRETTO: Gestisce nuovo formato errore ResponseFormatter
      const message = error.response?.data?.message || error.response?.data?.error?.details || 'Errore durante l\'aggiornamento';
      toast.error(message);
    },
  });
}

export function useDeleteSubcategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/api/subcategories/${id}`);
      // ✅ CORRETTO: Anche per delete, alcuni endpoints potrebbero ritornare data
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Sottocategoria eliminata con successo');
    },
    onError: (error: any) => {
      // ✅ CORRETTO: Gestisce nuovo formato errore ResponseFormatter
      const message = error.response?.data?.message || error.response?.data?.error?.details || 'Errore durante l\'eliminazione';
      toast.error(message);
    },
  });
}

export function useUpdateAiSettings() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subcategoryId, data }: { subcategoryId: string; data: any }) => {
      const response = await api.post(`/api/subcategories/${subcategoryId}/ai-settings`, data);
      // ✅ CORRETTO: Usa ResponseFormatter format response.data.data
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['subcategory', variables.subcategoryId] });
      queryClient.invalidateQueries({ queryKey: ['subcategories'] });
      toast.success('Impostazioni AI aggiornate con successo');
    },
    onError: (error: any) => {
      // ✅ CORRETTO: Gestisce nuovo formato errore ResponseFormatter
      const message = error.response?.data?.message || error.response?.data?.error?.details || 'Errore durante l\'aggiornamento delle impostazioni AI';
      toast.error(message);
    },
  });
}