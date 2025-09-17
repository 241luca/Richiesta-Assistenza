import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import axios, { AxiosProgressEvent } from 'axios';
import { toast } from 'react-hot-toast';

interface UseFileUploadOptions {
  requestId: string;
  onSuccess?: (files: any[]) => void;
  onError?: (error: string) => void;
}

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const useFileUpload = ({ 
  requestId, 
  onSuccess, 
  onError 
}: UseFileUploadOptions) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0
  });
  
  const queryClient = useQueryClient();
  
  // Mutation per upload file
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await axios.post(
        `/api/requests/${requestId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
          onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
            
            setUploadProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total || 0,
              percentage: progress
            });
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      // Reset progress
      setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
      
      // Invalida la cache degli attachments
      queryClient.invalidateQueries({
        queryKey: ['attachments', requestId]
      });
      
      toast.success(data.message || 'File caricati con successo');
      onSuccess?.(data.data);
    },
    onError: (error: any) => {
      // Reset progress
      setUploadProgress({ loaded: 0, total: 0, percentage: 0 });
      
      const errorMessage = error.response?.data?.message || 'Errore durante il caricamento';
      toast.error(errorMessage);
      onError?.(errorMessage);
    }
  });
  
  return {
    uploadFiles: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    error: uploadMutation.error
  };
};

// Hook per recuperare gli attachments di una richiesta
export const useRequestAttachments = (requestId: string) => {
  return useQuery({
    queryKey: ['attachments', requestId],
    queryFn: async () => {
      const response = await axios.get(`/api/requests/${requestId}/attachments`, {
        withCredentials: true
      });
      return response.data.data;
    },
    enabled: !!requestId,
    staleTime: 5 * 60 * 1000, // 5 minuti
  });
};

// Hook per eliminare un attachment
export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await axios.delete(`/api/attachments/${attachmentId}`, {
        withCredentials: true
      });
      return response.data;
    },
    onSuccess: (data, attachmentId) => {
      toast.success('File eliminato con successo');
      
      // Invalida tutte le query degli attachments
      queryClient.invalidateQueries({
        queryKey: ['attachments']
      });
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Errore durante l\'eliminazione';
      toast.error(errorMessage);
    }
  });
};

// Hook per scaricare un attachment
export const useDownloadAttachment = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const downloadFile = async (attachmentId: string, fileName: string) => {
    setIsDownloading(true);
    
    try {
      const response = await axios.get(
        `/api/attachments/${attachmentId}/download`,
        {
          responseType: 'blob',
          withCredentials: true
        }
      );
      
      // Crea un URL per il blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Crea un link temporaneo per il download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Download completato');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Errore durante il download';
      toast.error(errorMessage);
    } finally {
      setIsDownloading(false);
    }
  };
  
  return {
    downloadFile,
    isDownloading
  };
};

// Hook per ottenere la thumbnail di un'immagine
export const useThumbnail = (attachmentId: string | null) => {
  return useQuery({
    queryKey: ['thumbnail', attachmentId],
    queryFn: async () => {
      if (!attachmentId) return null;
      
      const response = await axios.get(
        `/api/attachments/${attachmentId}/thumbnail`,
        {
          responseType: 'blob',
          withCredentials: true
        }
      );
      
      // Converti blob in URL
      return URL.createObjectURL(new Blob([response.data]));
    },
    enabled: !!attachmentId,
    staleTime: 24 * 60 * 60 * 1000, // 24 ore
    gcTime: 24 * 60 * 60 * 1000, // 24 ore
  });
};
