import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CameraIcon, UserCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../services/api';

interface ProfileImageUploadProps {
  currentImage?: string;
  userId?: string;
  onUploadSuccess?: (imageUrl: string) => void;
  isRequired?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ProfileImageUpload: React.FC<ProfileImageUploadProps> = ({
  currentImage,
  userId,
  onUploadSuccess,
  isRequired = false,
  size = 'lg'
}) => {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Dimensioni per ogni size
  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-28 w-28',
    lg: 'h-32 w-32',
    xl: 'h-40 w-40'
  };

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const buttonSizes = {
    sm: 'h-6 w-6 p-1',
    md: 'h-8 w-8 p-1.5',
    lg: 'h-9 w-9 p-2',
    xl: 'h-10 w-10 p-2'
  };

  // Mutation per caricare l'immagine
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await api.post('/upload/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data.data.profileImageUrl;
    },
    onSuccess: (imageUrl) => {
      toast.success('Foto profilo caricata con successo!');
      setPreview(imageUrl);
      
      // Aggiorna la cache di React Query
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      
      // Chiama il callback se fornito
      if (onUploadSuccess) {
        onUploadSuccess(imageUrl);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Errore nel caricamento della foto';
      toast.error(message);
    }
  });

  // Mutation per rimuovere l'immagine
  const removeMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/upload/profile-image');
    },
    onSuccess: () => {
      toast.success('Foto profilo rimossa');
      setPreview(null);
      
      // Aggiorna la cache di React Query
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    },
    onError: () => {
      toast.error('Errore nella rimozione della foto');
    }
  });

  // Gestisce la selezione del file
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validazione lato client
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato non supportato. Usa JPG, PNG o WebP');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File troppo grande. Massimo 5MB');
      return;
    }

    // Crea preview locale
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Carica l'immagine
    setIsUploading(true);
    uploadMutation.mutate(file, {
      onSettled: () => {
        setIsUploading(false);
      }
    });
  };

  // Apre il file picker
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Rimuove l'immagine
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeMutation.mutate();
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative">
        {/* Container immagine */}
        <div 
          className={`${sizeClasses[size]} relative rounded-full overflow-hidden bg-gray-100 cursor-pointer hover:bg-gray-200 transition-colors`}
          onClick={handleClick}
        >
          {preview ? (
            <img 
              src={preview} 
              alt="Foto profilo" 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <UserCircleIcon className={`${iconSizes[size]} text-gray-400`} />
            </div>
          )}

          {/* Overlay durante upload */}
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
        </div>

        {/* Bottoni azione */}
        <div className="absolute -bottom-1 -right-1 flex space-x-1">
          {/* Bottone upload */}
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className={`${buttonSizes[size]} bg-blue-600 rounded-full text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <CameraIcon className="h-full w-full" />
          </button>

          {/* Bottone rimuovi (solo se c'è un'immagine) */}
          {preview && !isRequired && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isUploading || removeMutation.isPending}
              className={`${buttonSizes[size]} bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <XMarkIcon className="h-full w-full" />
            </button>
          )}
        </div>

        {/* Input file nascosto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Testo informativo */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {isRequired ? 'Foto profilo obbligatoria' : 'Foto profilo opzionale'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          JPG, PNG o WebP. Max 5MB. Min 200x200px
        </p>
      </div>
    </div>
  );
};

export default ProfileImageUpload;
