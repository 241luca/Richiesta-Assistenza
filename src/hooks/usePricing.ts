import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

/**
 * Hook per ottenere la stima di prezzo per una categoria/sottocategoria
 */
export const usePriceEstimate = (categoryId: string, subcategoryId?: string) => {
  return useQuery({
    queryKey: ['price-estimate', categoryId, subcategoryId],
    queryFn: async () => {
      const response = await api.pricing.getEstimate(categoryId, subcategoryId);
      return response.data;
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minuti
    retry: 1,
    meta: {
      errorMessage: 'Errore nel caricamento della stima prezzi'
    }
  });
};

/**
 * Hook per ottenere il pricing completo di una categoria
 */
export const useCategoryPricing = (categoryId: string) => {
  return useQuery({
    queryKey: ['category-pricing', categoryId],
    queryFn: async () => {
      const response = await api.pricing.getCategoryPricing(categoryId);
      return response.data;
    },
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000, // 10 minuti
    retry: 1,
    meta: {
      errorMessage: 'Errore nel caricamento del pricing categoria'
    }
  });
};

/**
 * Hook per ottenere le statistiche generali sui prezzi
 */
export const usePricingStats = () => {
  return useQuery({
    queryKey: ['pricing-stats'],
    queryFn: async () => {
      const response = await api.pricing.getStats();
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30 minuti
    retry: 1,
    meta: {
      errorMessage: 'Errore nel caricamento delle statistiche prezzi'
    }
  });
};

/**
 * Hook per verificare lo stato del servizio pricing
 */
export const usePricingHealth = () => {
  return useQuery({
    queryKey: ['pricing-health'],
    queryFn: async () => {
      const response = await api.pricing.checkHealth();
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minuti
    retry: 2,
    meta: {
      errorMessage: 'Errore nel controllo stato servizio pricing'
    }
  });
};

/**
 * Hook combinato per ottenere tutti i dati di pricing necessari
 */
export const usePricingData = (categoryId?: string, subcategoryId?: string) => {
  const estimateQuery = usePriceEstimate(categoryId || '', subcategoryId);
  const categoryQuery = useCategoryPricing(categoryId || '');
  const statsQuery = usePricingStats();
  const healthQuery = usePricingHealth();

  return {
    // Dati singoli
    estimate: estimateQuery.data,
    categoryPricing: categoryQuery.data,
    stats: statsQuery.data,
    health: healthQuery.data,

    // Stati loading
    isLoadingEstimate: estimateQuery.isLoading,
    isLoadingCategory: categoryQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isLoadingHealth: healthQuery.isLoading,

    // Stato loading generale
    isLoading: estimateQuery.isLoading || categoryQuery.isLoading || statsQuery.isLoading,

    // Errori
    estimateError: estimateQuery.error,
    categoryError: categoryQuery.error,
    statsError: statsQuery.error,
    healthError: healthQuery.error,

    // Metodi refresh
    refetchEstimate: estimateQuery.refetch,
    refetchCategory: categoryQuery.refetch,
    refetchStats: statsQuery.refetch,
    refetchHealth: healthQuery.refetch,

    // Refresh generale
    refetchAll: () => {
      estimateQuery.refetch();
      categoryQuery.refetch();
      statsQuery.refetch();
      healthQuery.refetch();
    }
  };
};

/**
 * Utilità per formattare i prezzi
 */
export const formatPrice = (price: number, currency = 'EUR', locale = 'it-IT') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(price);
};

/**
 * Utilità per calcolare la differenza percentuale tra min e max
 */
export const calculatePriceSpread = (min: number, max: number): number => {
  if (min === 0) return 0;
  return Math.round(((max - min) / min) * 100);
};

/**
 * Utilità per determinare se un range è affidabile
 */
export const isPriceRangeReliable = (sampleSize: number, minSampleSize = 5): boolean => {
  return sampleSize >= minSampleSize;
};

/**
 * Utilità per ottenere il livello di affidabilità del range
 */
export const getPriceRangeConfidence = (sampleSize: number): {
  level: 'low' | 'medium' | 'high';
  label: string;
  color: string;
} => {
  if (sampleSize < 5) {
    return {
      level: 'low',
      label: 'Dati insufficienti',
      color: 'text-red-600'
    };
  } else if (sampleSize < 15) {
    return {
      level: 'medium',
      label: 'Affidabilità media',
      color: 'text-yellow-600'
    };
  } else {
    return {
      level: 'high',
      label: 'Alta affidabilità',
      color: 'text-green-600'
    };
  }
};
