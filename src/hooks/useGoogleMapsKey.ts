import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/api';

export function useGoogleMapsKey() {
  return useQuery({
    queryKey: ['google-maps-key'],
    queryFn: async () => {
      try {
        // Get the decrypted API key from backend
        const response = await apiClient.get('/api/maps/config');
        return response.data.apiKey;
      } catch (error) {
        console.error('Failed to fetch Google Maps API key:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
    retry: 1,
  });
}
