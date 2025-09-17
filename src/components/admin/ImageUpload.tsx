import React, { useState } from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  currentValue: string;
  settingKey: string;
  onUploadSuccess: (newUrl: string) => void;
  accept?: string;
}

export default function ImageUpload({ 
  currentValue, 
  settingKey, 
  onUploadSuccess,
  accept = "image/*"
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [manualUrl, setManualUrl] = useState(currentValue || '');

  // Sincronizza con il valore corrente
  React.useEffect(() => {
    setManualUrl(currentValue || '');
  }, [currentValue]);

  const handleFile = async (file: File) => {
    // Validazione
    if (!file.type.startsWith('image/')) {
      toast.error('Per favore seleziona un file immagine');
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Il file deve essere più piccolo di 5MB');
      return;
    }

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', settingKey);

    try {
      const response = await api.post('/admin/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        const newUrl = response.data.data.url;
        // Aggiorna immediatamente il valore
        onUploadSuccess(newUrl);
        toast.success('Immagine caricata! Clicca Salva per confermare.');
        // Non rimuovere il preview qui, lasciare che venga gestito dal componente padre
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Errore nel caricamento');
      setPreview(null);
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

  return (
    <div className="space-y-4">
      {/* Immagine attuale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Immagine attuale
        </label>
        <div className="flex items-center gap-4">
          {currentValue ? (
            <img 
              src={currentValue} 
              alt="Current" 
              className="h-16 w-auto max-w-[200px] object-contain bg-gray-50 rounded border border-gray-200 p-2"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/vite.svg';
              }}
            />
          ) : (
            <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-400 text-xs">Nessuna</span>
            </div>
          )}
          <span className="text-sm text-gray-500">{currentValue}</span>
        </div>
      </div>

      {/* Input URL manuale */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL immagine
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => {
              setManualUrl(e.target.value);
              onUploadSuccess(e.target.value);
            }}
            placeholder="https://esempio.com/immagine.jpg"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Puoi inserire un URL diretto o caricare un file qui sotto
        </p>
      </div>

      {/* Area upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Oppure carica un file
        </label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
            ${isUploading ? 'opacity-50 pointer-events-none' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="relative inline-block">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-32 max-w-full mx-auto rounded"
              />
              {!isUploading && (
                <button
                  onClick={() => setPreview(null)}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <>
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                Trascina un'immagine qui oppure
              </p>
              <label className="mt-2 cursor-pointer">
                <span className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Seleziona file
                </span>
                <input
                  type="file"
                  className="sr-only"
                  accept={accept}
                  onChange={handleChange}
                  disabled={isUploading}
                />
              </label>
            </>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Caricamento...</p>
              </div>
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          PNG, JPG, SVG fino a 5MB
        </p>
      </div>
    </div>
  );
}
