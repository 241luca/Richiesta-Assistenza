import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api';

export function useSystemSettings() {
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['system-settings-public'],
    queryFn: async () => {
      try {
        // Usa l'endpoint pubblico che non richiede autenticazione
        const response = await apiClient.get('/public/system-settings/basic');
        if (response.data?.success) {
          return response.data.data || [];
        }
        return [];
      } catch (error) {
        // Se l'endpoint fallisce, ritorna valori di default
        console.log('Failed to load system settings, using defaults');
        return [];
      }
    },
    staleTime: 15 * 60 * 1000, // Cache per 15 minuti (aumentato drasticamente)
    retry: false,
    refetchOnWindowFocus: false, // NON ricarica quando la finestra ottiene il focus
    refetchOnMount: false, // NON ricarica al mount se i dati sono freschi
    refetchInterval: false, // Disabilita il polling automatico
    refetchOnReconnect: false // NON ricarica quando si riconnette
  });

  // Funzione helper per ottenere un valore di setting
  const getSetting = (key: string, defaultValue: string = '') => {
    const setting = settings.find((s: any) => s.key === key);
    return setting?.value || defaultValue;
  };

  return {
    siteName: getSetting('site_name', 'Richiesta Assistenza'),
    siteLogo: getSetting('site_logo_url', '/logo.svg'),
    siteFavicon: getSetting('site_favicon_url', '/favicon.ico'),
    siteVersion: getSetting('site_version', 'v1.0'),
    siteClaim: getSetting('site_claim', 'Il tuo problema, la nostra soluzione!'),
    companyName: getSetting('company_name', 'LM Tecnologie'),
    isLoading
  };
}

// Hook per ottenere una mappa di tutte le impostazioni
export function useSystemSettingsMap() {
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['system-settings-public'],
    queryFn: async () => {
      try {
        // Usa l'endpoint pubblico che non richiede autenticazione
        const response = await apiClient.get('/public/system-settings/basic');
        if (response.data?.success) {
          return response.data.data || [];
        }
        return [];
      } catch (error) {
        console.log('Failed to load system settings, using defaults');
        return [];
      }
    },
    staleTime: 15 * 60 * 1000, // Cache per 15 minuti (aumentato drasticamente)
    retry: false,
    refetchOnWindowFocus: false, // NON ricarica quando la finestra ottiene il focus
    refetchOnMount: false, // NON ricarica al mount se i dati sono freschi
    refetchInterval: false, // Disabilita il polling automatico
    refetchOnReconnect: false // NON ricarica quando si riconnette
  });

  // Crea una mappa key->value delle impostazioni
  const settingsMap = settings.reduce((acc: any, setting: any) => {
    acc[setting.key] = setting.value;
    return acc;
  }, {});

  return {
    settings: settingsMap,
    isLoading
  };
}
