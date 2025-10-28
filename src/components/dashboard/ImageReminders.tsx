import React from 'react';
import { ExclamationTriangleIcon, PhotoIcon, UserIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { useImageModule } from '../../hooks/useImageModule';

interface ImageStatus {
  avatar: {
    present: boolean;
    required: boolean;
    missing: boolean;
  };
  recognitionImage: {
    present: boolean;
    required: boolean;
    missing: boolean;
  };
}

interface ImageRemindersData {
  imageStatus: ImageStatus;
  hasMissingImages: boolean;
  userRole: string;
}

const ImageReminders: React.FC = () => {
  const { shouldShowReminders, isImageModuleEnabled, isLoading: moduleLoading } = useImageModule();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['user-image-status'],
    queryFn: async () => {
      const response = await api.get('/users/image-status');
      return response.data.data as ImageRemindersData;
    },
    staleTime: 5 * 60 * 1000, // 5 minuti
    refetchOnWindowFocus: false,
    enabled: isImageModuleEnabled && shouldShowReminders // Solo se il modulo è abilitato e i promemoria sono attivi
  });

  // Se il modulo non è abilitato o i promemoria sono disabilitati, non mostrare nulla
  if (!isImageModuleEnabled || !shouldShowReminders) {
    return null;
  }

  if (moduleLoading || isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Errore nel recupero dello stato delle immagini:', error);
    return null;
  }

  if (!data || !data.hasMissingImages) {
    return null;
  }

  const { imageStatus, userRole } = data;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
      <div className="flex items-start space-x-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-amber-800 mb-2">
            Immagini Mancanti
          </h3>
          <p className="text-amber-700 mb-4">
            Per completare il tuo profilo, aggiungi le seguenti immagini:
          </p>
          
          <div className="space-y-3">
            {imageStatus.avatar.missing && (
              <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-amber-200">
                <UserIcon className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900">Immagine Avatar</p>
                  <p className="text-sm text-gray-600">
                    {imageStatus.avatar.required ? 'Obbligatoria' : 'Consigliata'} per {userRole === 'PROFESSIONAL' ? 'professionisti' : 'clienti'}
                  </p>
                </div>
              </div>
            )}
            
            {imageStatus.recognitionImage.missing && (
              <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-amber-200">
                <PhotoIcon className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-gray-900">Immagine di Riconoscimento</p>
                  <p className="text-sm text-gray-600">
                    {imageStatus.recognitionImage.required ? 'Obbligatoria' : 'Consigliata'} per {userRole === 'PROFESSIONAL' ? 'professionisti' : 'clienti'}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => window.location.href = '/profile'}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Vai al Profilo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageReminders;