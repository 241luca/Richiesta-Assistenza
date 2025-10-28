import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customFormsAPI, CustomFormFilters, CreateCustomFormData } from '../services/customForms.api';
import { api } from '../services/api';
import toast from 'react-hot-toast';

/**
 * Hook per verificare se il modulo custom-forms è abilitato
 */
export const useCustomFormsModule = () => {
  return useQuery({
    queryKey: ['module', 'custom-forms'],
    queryFn: async () => {
      try {
        const response = await api.get('/modules/custom-forms');
        return response.data?.data || response.data;
      } catch (error: any) {
        // Se il modulo non esiste o non è abilitato, ritorna false
        if (error.response?.status === 404 || error.response?.status === 403) {
          return { isEnabled: false };
        }
        throw error;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minuti
    retry: false, // Non riprovare se il modulo non è disponibile
  });
};

/**
 * Hook per gestire i custom forms
 */
export const useCustomForms = (filters: CustomFormFilters = {}) => {
  const queryClient = useQueryClient();
  
  // Verifica se il modulo è abilitato
  const { data: moduleData, isLoading: moduleLoading } = useCustomFormsModule();
  const isModuleEnabled = moduleData?.isEnabled === true;

  // Query per ottenere i custom forms (solo se il modulo è abilitato)
  const customFormsQuery = useQuery({
    queryKey: ['custom-forms', filters],
    queryFn: async () => {
      const response = await customFormsAPI.getAllCustomForms(filters);
      return response.data?.data || response.data || [];
    },
    enabled: isModuleEnabled, // Esegui solo se il modulo è abilitato
    staleTime: 5 * 60 * 1000, // 5 minuti
  });

  // Query per le statistiche
  const statsQuery = useQuery({
    queryKey: ['custom-forms-stats'],
    queryFn: async () => {
      const response = await customFormsAPI.getCustomFormStats();
      return response.data?.data || response.data;
    },
    enabled: isModuleEnabled,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation per creare un custom form
  const createMutation = useMutation({
    mutationFn: (data: CreateCustomFormData) => customFormsAPI.createCustomForm(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      queryClient.invalidateQueries({ queryKey: ['custom-forms-stats'] });
      toast.success('Custom form creato con successo');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante la creazione');
    }
  });

  // Mutation per aggiornare un custom form
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateCustomFormData> }) => 
      customFormsAPI.updateCustomForm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      toast.success('Custom form aggiornato con successo');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'aggiornamento');
    }
  });

  // Mutation per pubblicare un custom form
  const publishMutation = useMutation({
    mutationFn: (formId: string) => customFormsAPI.publishCustomForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      queryClient.invalidateQueries({ queryKey: ['custom-forms-stats'] });
      toast.success('Custom form pubblicato con successo');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante la pubblicazione');
    }
  });

  // Mutation per eliminare un custom form
  const deleteMutation = useMutation({
    mutationFn: (formId: string) => customFormsAPI.deleteCustomForm(formId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-forms'] });
      queryClient.invalidateQueries({ queryKey: ['custom-forms-stats'] });
      toast.success('Custom form eliminato con successo');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'eliminazione');
    }
  });

  return {
    // Stato del modulo
    isModuleEnabled,
    moduleLoading,
    
    // Dati
    customForms: customFormsQuery.data || [],
    stats: statsQuery.data,
    
    // Stati di caricamento
    isLoading: customFormsQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    
    // Errori
    error: customFormsQuery.error,
    statsError: statsQuery.error,
    
    // Mutations
    createCustomForm: createMutation.mutate,
    updateCustomForm: updateMutation.mutate,
    publishCustomForm: publishMutation.mutate,
    deleteCustomForm: deleteMutation.mutate,
    
    // Stati delle mutations
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isPublishing: publishMutation.isPending,
    isDeleting: deleteMutation.isPending,
    
    // Funzioni di utilità
    refetch: customFormsQuery.refetch,
    refetchStats: statsQuery.refetch,
  };
};

/**
 * Hook per ottenere i custom forms di una sottocategoria specifica
 */
export const useCustomFormsBySubcategory = (subcategoryId: string) => {
  const { data: moduleData } = useCustomFormsModule();
  const isModuleEnabled = moduleData?.isEnabled === true;
  
  return useQuery({
    queryKey: ['custom-forms', 'subcategory', subcategoryId],
    queryFn: async () => {
      const response = await customFormsAPI.getCustomFormsBySubcategory(subcategoryId);
      return response.data?.data || response.data || [];
    },
    enabled: isModuleEnabled && !!subcategoryId,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook per ottenere un singolo custom form
 */
export const useCustomForm = (formId: string) => {
  const { data: moduleData } = useCustomFormsModule();
  const isModuleEnabled = moduleData?.isEnabled === true;
  
  return useQuery({
    queryKey: ['custom-forms', formId],
    queryFn: async () => {
      const response = await customFormsAPI.getCustomFormById(formId);
      return response.data?.data || response.data;
    },
    enabled: isModuleEnabled && !!formId,
    staleTime: 5 * 60 * 1000,
  });
};