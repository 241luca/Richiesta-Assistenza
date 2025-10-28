/**
 * Image Upload Field Component
 * Campo specifico per upload immagini con preview e crop
 * 
 * @module components/custom-forms/fields/ImageUploadField
 * @version 1.0.0
 */

import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ImageUploadFieldProps {
  label: string;
  value?: string | string[]; // URL o array di URL
  onChange: (images: string | string[] | null) => void;
  isRequired?: boolean;
  isReadonly?: boolean;
  multiple?: boolean;
  config?: {
    maxFileSize?: number; // In MB
    maxImages?: number;
    minWidth?: number;
    minHeight?: number;
    aspectRatio?: string; // '16:9', '1:1', '4:3'
  };
  error?: string;
  className?: string;
}

interface UploadedImage {
  id: string;
  name: string;
  url: string;
  width?: number;
  height?: number;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  value,
  onChange,
  isRequired = false,
  isReadonly = false,
  multiple = false,
  config = {},
  error,
  className
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadError, setUploadError] = useState<string>('');

  const {
    maxFileSize = 5, // 5MB default per immagini
    maxImages = multiple ? 5 : 1,
    minWidth = 0,
    minHeight = 0,
    aspectRatio
  } = config;

  // Converte valore stringa in array di immagini
  React.useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      const images: UploadedImage[] = urls.map((url, index) => ({
        id: `existing-${index}`,
        name: url.split('/').pop() || 'image',
        url
      }));
      setUploadedImages(images);
    }
  }, [value]);

  const validateImage = async (file: File): Promise<string | null> => {
    // Validazione tipo
    if (!file.type.startsWith('image/')) {
      return 'Il file deve essere un\'immagine';
    }

    // Validazione dimensione file
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `L'immagine supera la dimensione massima di ${maxFileSize}MB`;
    }

    // Validazione numero massimo
    if (uploadedImages.length >= maxImages) {
      return `Numero massimo di immagini raggiunto (${maxImages})`;
    }

    // Validazione dimensioni immagine
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (minWidth && img.width < minWidth) {
          resolve(`L'immagine deve essere larga almeno ${minWidth}px`);
          return;
        }
        if (minHeight && img.height < minHeight) {
          resolve(`L'immagine deve essere alta almeno ${minHeight}px`);
          return;
        }

        // Validazione aspect ratio
        if (aspectRatio) {
          const [w, h] = aspectRatio.split(':').map(Number);
          const expectedRatio = w / h;
          const actualRatio = img.width / img.height;
          const tolerance = 0.05; // 5% tolleranza
          
          if (Math.abs(expectedRatio - actualRatio) > tolerance) {
            resolve(`L'immagine deve avere proporzioni ${aspectRatio}`);
            return;
          }
        }

        resolve(null);
      };
      img.onerror = () => {
        resolve('Impossibile caricare l\'immagine');
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError('');
    const newImages: UploadedImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validazione
      const validationError = await validateImage(file);
      if (validationError) {
        setUploadError(validationError);
        continue;
      }

      // Simula upload - In produzione, inviare a backend
      // TODO: Implementare upload reale al backend con compressione
      const imageUrl = URL.createObjectURL(file);
      
      // Ottieni dimensioni immagine
      const img = new Image();
      img.src = imageUrl;
      await new Promise(resolve => { img.onload = resolve; });

      newImages.push({
        id: `new-${Date.now()}-${i}`,
        name: file.name,
        url: imageUrl,
        width: img.width,
        height: img.height
      });
    }

    const updatedImages = multiple 
      ? [...uploadedImages, ...newImages]
      : newImages;

    setUploadedImages(updatedImages);
    
    // Notifica parent component
    const urls = updatedImages.map(img => img.url);
    onChange(multiple ? urls : urls[0] || null);
  };

  const handleRemoveImage = (imageId: string) => {
    const updatedImages = uploadedImages.filter(img => img.id !== imageId);
    setUploadedImages(updatedImages);
    
    const urls = updatedImages.map(img => img.url);
    onChange(multiple ? urls : urls[0] || null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (isReadonly) return;
    handleImageSelect(e.dataTransfer.files);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label>
        {label}
        {isRequired && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Card className={cn(
        'p-4',
        error && 'border-red-500'
      )}>
        {/* Upload Area */}
        {!isReadonly && uploadedImages.length < maxImages && (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
              isDragging 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-2">
              Trascina le immagini qui o{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                sfoglia
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Formati: JPG, PNG, GIF, WebP
              <br />
              Dimensione massima: {maxFileSize}MB
              {minWidth > 0 && minHeight > 0 && (
                <><br />Dimensioni minime: {minWidth}x{minHeight}px</>
              )}
              {aspectRatio && (
                <><br />Proporzioni: {aspectRatio}</>
              )}
              {multiple && <><br />Max {maxImages} immagini</>}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple={multiple}
              accept="image/*"
              onChange={(e) => handleImageSelect(e.target.files)}
              disabled={isReadonly}
            />
          </div>
        )}

        {/* Upload Error */}
        {uploadError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Uploaded Images Grid */}
        {uploadedImages.length > 0 && (
          <div className={cn(
            'space-y-3',
            !isReadonly && uploadedImages.length < maxImages && 'mt-4'
          )}>
            <p className="text-sm font-medium text-gray-700">
              Immagini caricate ({uploadedImages.length}/{maxImages})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {uploadedImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay con info */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-end">
                    <div className="w-full p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-xs text-white truncate">
                        {image.name}
                      </p>
                      {image.width && image.height && (
                        <p className="text-xs text-gray-300">
                          {image.width}x{image.height}px
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Success badge */}
                  <div className="absolute top-2 left-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 bg-white rounded-full" />
                  </div>

                  {/* Remove button */}
                  {!isReadonly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Rimuovi immagine"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state per readonly */}
        {isReadonly && uploadedImages.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Nessuna immagine caricata
          </p>
        )}
      </Card>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
    </div>
  );
};

export default ImageUploadField;
