/**
 * useTravel Hook
 * Hook React Query per gestire funzionalità viaggi e distanze
 * Seguendo ISTRUZIONI-PROGETTO.md - Frontend usa SEMPRE React Query
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { travelApi } from '../services/travelApi';
import type { 
  WorkAddress, 
  UpdateWorkAddressDto, 
  RequestTravelResponse,
  TravelInfo
} from '../types/travel';
import toast from 'react-hot-toast';

// Query Keys costanti
const TRAVEL_QUERY_KEYS = {
  workAddress: ['travel', 'work-address'] as const,
  requestTravelInfo: (requestId: string) => ['travel', 'request', requestId] as const,
  batchTravelInfo: (requestIds: string[]) => ['travel', 'batch', requestIds.sort().join(',')] as const,
  itinerary: (requestId: string) => ['travel', 'itinerary', requestId] as const,
  validateAddress: (addressHash: string) => ['travel', 'validate', addressHash] as const,
} as const;

export const useTravel = () => {
  const queryClient = useQueryClient();

  // Query: Ottiene indirizzo di lavoro
  const useWorkAddress = () => {
    return useQuery({
      queryKey: TRAVEL_QUERY_KEYS.workAddress,
      queryFn: travelApi.getWorkAddress,
      staleTime: 5 * 60 * 1000, // 5 minuti
      retry: false,
    });
  };

  // Query: Calcola info viaggio per una richiesta
  const useRequestTravelInfo = (requestId: string, enabled: boolean = true) => {
    return useQuery({
      queryKey: TRAVEL_QUERY_KEYS.requestTravelInfo(requestId),
      queryFn: () => travelApi.getRequestTravelInfo(requestId),
      enabled: enabled && !!requestId,
      staleTime: 2 * 60 * 1000, // 2 minuti (traffico cambia)
      retry: 1,
    });
  };

  // Query: Calcola info viaggio per più richieste (batch)
  const useBatchTravelInfo = (requestIds: string[], enabled: boolean = true) => {
    return useQuery({
      queryKey: TRAVEL_QUERY_KEYS.batchTravelInfo(requestIds),
      queryFn: () => travelApi.getBatchTravelInfo(requestIds),
      enabled: enabled && requestIds.length > 0,
      staleTime: 2 * 60 * 1000, // 2 minuti
      retry: 1,
    });
  };

  // Query: Ottiene itinerario per una richiesta
  const useItinerary = (requestId: string, enabled: boolean = false) => {
    return useQuery({
      queryKey: TRAVEL_QUERY_KEYS.itinerary(requestId),
      queryFn: () => travelApi.getItinerary(requestId),
      enabled: enabled && !!requestId,
      staleTime: 10 * 60 * 1000, // 10 minuti (URL non cambia)
      retry: 1,
    });
  };

  // Mutation: Aggiorna indirizzo di lavoro
  const updateWorkAddressMutation = useMutation({
    mutationFn: travelApi.updateWorkAddress,
    onSuccess: (data, variables) => {
      console.log('✅ Mutation success, dati ricevuti:', data);
      
      // CORREZIONE: Invalida la query invece di setQueryData
      // Questo forza React Query a rifare la fetch e ricaricare i dati freschi
      queryClient.invalidateQueries({ 
        queryKey: TRAVEL_QUERY_KEYS.workAddress 
      });
      
      toast.success('✅ Indirizzo aggiornato! Ricalcola manualmente i viaggi dalle richieste.');
    },
    onError: (error: any) => {
      console.error('Update work address error:', error);
    }
  });

  // Mutation: Valida indirizzo
  const validateAddressMutation = useMutation({
    mutationFn: travelApi.validateAddress,
    onSuccess: (data, variables) => {
      // Crea hash per cache key
      const addressHash = btoa(JSON.stringify(variables)).substring(0, 10);
      
      // Salva in cache per riuso
      queryClient.setQueryData(
        TRAVEL_QUERY_KEYS.validateAddress(addressHash), 
        data
      );
      
      if (data.isValid) {
        toast.success('Indirizzo validato correttamente');
      } else {
        toast.error('Indirizzo non trovato');
      }
    },
    onError: (error: any) => {
      console.error('Validate address error:', error);
      const errorMessage = error.response?.data?.message || 
                          'Errore durante la validazione dell\'indirizzo';
      toast.error(errorMessage);
    }
  });

  // Funzioni helper per invalidare cache
  const invalidateWorkAddress = () => {
    queryClient.invalidateQueries({ queryKey: TRAVEL_QUERY_KEYS.workAddress });
  };

  const invalidateRequestTravelInfo = (requestId?: string) => {
    if (requestId) {
      queryClient.invalidateQueries({ 
        queryKey: TRAVEL_QUERY_KEYS.requestTravelInfo(requestId) 
      });
    } else {
      queryClient.invalidateQueries({ 
        queryKey: ['travel', 'request'],
        exact: false 
      });
    }
  };

  const invalidateAllTravelData = () => {
    queryClient.invalidateQueries({ 
      queryKey: ['travel'],
      exact: false 
    });
  };

  // Funzioni helper per prefetch
  const prefetchRequestTravelInfo = async (requestId: string) => {
    await queryClient.prefetchQuery({
      queryKey: TRAVEL_QUERY_KEYS.requestTravelInfo(requestId),
      queryFn: () => travelApi.getRequestTravelInfo(requestId),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchBatchTravelInfo = async (requestIds: string[]) => {
    await queryClient.prefetchQuery({
      queryKey: TRAVEL_QUERY_KEYS.batchTravelInfo(requestIds),
      queryFn: () => travelApi.getBatchTravelInfo(requestIds),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    // Query hooks
    useWorkAddress,
    useRequestTravelInfo,
    useBatchTravelInfo,
    useItinerary,
    
    // Mutations
    updateWorkAddress: updateWorkAddressMutation.mutate,
    validateAddress: validateAddressMutation.mutate,
    
    // Mutation states
    isUpdatingWorkAddress: updateWorkAddressMutation.isPending,
    isValidatingAddress: validateAddressMutation.isPending,
    
    // Cache management
    invalidateWorkAddress,
    invalidateRequestTravelInfo,
    invalidateAllTravelData,
    
    // Prefetch functions
    prefetchRequestTravelInfo,
    prefetchBatchTravelInfo,
    
    // Query client per operazioni avanzate
    queryClient,
  };
};

// Hook specifico per indirizzo di lavoro (più comodo da usare)
export const useWorkAddress = () => {
  const { useWorkAddress } = useTravel();
  return useWorkAddress();
};

// Hook specifico per info viaggio richiesta (più comodo da usare)
export const useRequestTravelInfo = (requestId: string, enabled?: boolean) => {
  const { useRequestTravelInfo } = useTravel();
  return useRequestTravelInfo(requestId, enabled);
};

// Export default per compatibilità
export default useTravel;
