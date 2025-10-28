import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

interface ImageModuleSettings {
  enableAvatars: boolean;
  enableRecognition: boolean;
  enableReminders: boolean;
  maxFileSize: number;
  allowedFormats: string[];
  storagePath: string;
  reminderPosition: string;
  reminderStyle: string;
}

interface ImageModuleData {
  isEnabled: boolean;
  isActive: boolean;
  settings: ImageModuleSettings;
}

export const useImageModule = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['image-module-status'],
    queryFn: async () => {
      try {
        // Recupera il modulo e le sue impostazioni in una sola chiamata
        const moduleResponse = await api.get('/public/modules/image-management');
        const moduleData = moduleResponse.data.data;

        if (!moduleData.isEnabled) {
          return {
            isEnabled: false,
            isActive: false,
            settings: null
          };
        }

        // Le impostazioni sono già incluse nella risposta del modulo
        const moduleSettings = moduleData.settings || {};

        // Converte le impostazioni in un formato più utilizzabile
        const settings: ImageModuleSettings = {
          enableAvatars: moduleSettings.enable_avatars === 'true',
          enableRecognition: moduleSettings.enable_recognition === 'true',
          enableReminders: moduleSettings.enable_reminders === 'true',
          maxFileSize: parseInt(moduleSettings.max_file_size || '5242880'),
          allowedFormats: moduleSettings.allowed_formats?.split(',') || ['jpg', 'jpeg', 'png', 'webp'],
          storagePath: moduleSettings.storage_path || 'uploads/images',
          reminderPosition: moduleSettings.reminder_position || 'top-right',
          reminderStyle: moduleSettings.reminder_style || 'notification'
        };

        return {
          isEnabled: true,
          isActive: moduleData.isEnabled,
          settings
        } as ImageModuleData;

      } catch (error) {
        console.error('Errore nel recupero dello stato del modulo immagini:', error);
        // Se c'è un errore, assumiamo che il modulo sia disabilitato
        return {
          isEnabled: false,
          isActive: false,
          settings: null
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minuti
    refetchOnWindowFocus: false,
    retry: 2
  });

  return {
    imageModule: data,
    isLoading,
    error,
    // Helper functions
    isImageModuleEnabled: data?.isEnabled && data?.isActive,
    canUploadAvatars: data?.isEnabled && data?.isActive && data?.settings?.enableAvatars,
    canUploadRecognition: data?.isEnabled && data?.isActive && data?.settings?.enableRecognition,
    shouldShowReminders: data?.isEnabled && data?.isActive && data?.settings?.enableReminders,
    maxFileSize: data?.settings?.maxFileSize || 5242880,
    allowedFormats: data?.settings?.allowedFormats || ['jpg', 'jpeg', 'png', 'webp'],
    reminderPosition: data?.settings?.reminderPosition || 'top-right',
    reminderStyle: data?.settings?.reminderStyle || 'notification'
  };
};

export default useImageModule;