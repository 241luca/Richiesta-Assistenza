import React, { useRef, useState } from 'react';
import { CloudArrowUpIcon, XMarkIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface FormFileUploadProps {
  value: string | null;
  onChange: (fileUrl: string | null, fileName?: string) => void;
  isReadonly?: boolean;
  isRequired?: boolean;
  acceptImages?: boolean; // true per FILE_IMAGE, false per FILE generico
}

/**
 * Componente per upload file nei custom form
 * Supporta sia FILE che FILE_IMAGE
 */
export const FormFileUpload: React.FC<FormFileUploadProps> = ({
  value,
  onChange,
  isReadonly = false,
  isRequired = false,
  acceptImages = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Determina i tipi di file accettati
  const acceptTypes = acceptImages 
    ? 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
    : 'image/jpeg,image/jpg,image/png,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const acceptDescription = acceptImages
    ? 'Immagini: JPG, PNG, GIF, WebP (max 10MB)'
    : 'File: JPG, PNG, GIF, PDF, DOC, DOCX (max 10MB)';

  const handleFile = async (file: File) => {
    // Validazione dimensione (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Il file supera la dimensione massima di 10MB');
      return;
    }

    // Validazione tipo file
    const validTypes = acceptTypes.split(',');
    if (!validTypes.includes(file.type)) {
      toast.error(acceptImages 
        ? 'Formato non valido. Carica solo immagini (JPG, PNG, GIF, WebP)'
        : 'Formato non valido. Carica solo JPG, PNG, GIF, PDF, DOC, DOCX'
      );
      return;
    }

    // Upload
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', acceptImages ? 'form-image' : 'form-file');

    try {
      // Usa l'endpoint /admin/upload che già esiste
      const response = await api.post('/admin/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const fileUrl = response.data.data.url;
        onChange(fileUrl, file.name);
        toast.success('File caricato con successo!');
      } else {
        throw new Error(response.data.message || 'Errore nel caricamento');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Errore nel caricamento del file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileName = (url: string) => {
    return url.split('/').pop() || 'file';
  };

  const isImage = (url: string) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  return (
    <div className="form-file-upload">
      {value ? (
        // File già caricato
        <div className="border-2 border-gray-400 rounded-lg p-4 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {acceptImages && isImage(value) ? (
                <div className="relative flex-shrink-0">
                  <img 
                    src={value} 
                    alt="Preview" 
                    className="h-16 w-16 object-cover rounded border border-gray-300"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0">
                  {isImage(value) ? (
                    <PhotoIcon className="h-10 w-10 text-blue-500" />
                  ) : (
                    <DocumentIcon className="h-10 w-10 text-gray-500" />
                  )}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {getFileName(value)}
                </p>
                <p className="text-xs text-gray-500">
                  File caricato
                </p>
              </div>
            </div>

            {!isReadonly && (
              <button
                type="button"
                onClick={handleRemove}
                className="ml-3 p-1 text-red-500 hover:text-red-700 flex-shrink-0"
                title="Rimuovi file"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Link per visualizzare il file */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Visualizza file →
            </a>
          </div>
        </div>
      ) : (
        // Area di upload
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors bg-white ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-400 hover:border-gray-500'
          } ${
            isUploading ? 'opacity-50 pointer-events-none' : ''
          } ${
            isReadonly ? 'opacity-50 pointer-events-none' : ''
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-3 text-sm text-gray-600">Caricamento in corso...</p>
            </div>
          ) : (
            <>
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Trascina {acceptImages ? "un'immagine" : 'un file'} qui oppure{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                  disabled={isReadonly}
                >
                  sfoglia
                </button>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {acceptDescription}
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept={acceptTypes}
            onChange={handleChange}
            disabled={isReadonly || isUploading}
            required={isRequired && !value}
          />
        </div>
      )}
    </div>
  );
};
