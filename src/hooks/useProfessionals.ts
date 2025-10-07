import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

interface ProfessionalFilters {
  verified?: boolean;
  search?: string;
  city?: string;
  subcategoryId?: string;
  limit?: number;
  offset?: number;
}

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  province?: string;
  isVerified: boolean;
  verifiedAt?: string;
  verificationDetails?: {
    documentsVerified: boolean;
    backgroundCheck: boolean;
    certificatesVerified: boolean;
  };
  hourlyRate?: number;
  subcategories: Array<{
    id: string;
    name: string;
    experienceYears?: number;
  }>;
}

interface ProfessionalsResponse {
  data: Professional[];
  meta: {
    total: number;
    verified: number;
    showing: number;
    hasMore: boolean;
  };
}

/**
 * Hook per gestire la lista dei professionisti con filtri
 */
export const useProfessionals = (filters: ProfessionalFilters = {}) => {
  return useQuery({
    queryKey: ['professionals', filters],
    queryFn: async (): Promise<ProfessionalsResponse> => {
      const params = new URLSearchParams();
      
      if (filters.verified !== undefined) {
        params.append('verified', filters.verified.toString());
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.city) {
        params.append('city', filters.city);
      }
      if (filters.limit) {
        params.append('limit', filters.limit.toString());
      }
      if (filters.offset) {
        params.append('offset', filters.offset.toString());
      }

      const url = filters.subcategoryId 
        ? `/professionals/by-subcategory/${filters.subcategoryId}${params.toString() ? '?' + params.toString() : ''}`
        : `/professionals${params.toString() ? '?' + params.toString() : ''}`;

      const response = await api.get(url);
      return {
        data: response.data.data,
        meta: response.data.meta || {}
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minuti
    refetchOnWindowFocus: false
  });
};

/**
 * Hook specifico per professionisti verificati
 */
export const useVerifiedProfessionals = (subcategoryId?: string) => {
  return useProfessionals({
    verified: true,
    subcategoryId,
    limit: 10
  });
};

/**
 * Hook per statistiche sui professionisti
 */
export const useProfessionalsStats = () => {
  return useQuery({
    queryKey: ['professionals-stats'],
    queryFn: async () => {
      const [allResponse, verifiedResponse] = await Promise.all([
        api.get('/professionals?limit=1'), // Solo per contare
        api.get('/professionals?verified=true&limit=1') // Solo per contare
      ]);

      return {
        total: allResponse.data.meta?.total || 0,
        verified: verifiedResponse.data.meta?.total || 0,
        verificationRate: allResponse.data.meta?.total > 0 
          ? Math.round((verifiedResponse.data.meta?.total / allResponse.data.meta?.total) * 100)
          : 0
      };
    },
    staleTime: 10 * 60 * 1000 // 10 minuti
  });
};

export type { Professional, ProfessionalFilters, ProfessionalsResponse };