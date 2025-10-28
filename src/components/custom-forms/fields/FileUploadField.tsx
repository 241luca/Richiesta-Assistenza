/**
 * File Upload Field Component
 * Campo per upload generico di file con drag-drop, preview e validazione
 * 
 * @module components/custom-forms/fields/FileUploadField
 * @version 1.0.0
 */

import React, { useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, File, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FileUploadFieldProps {
  label: string;
  value?: string | string[]; // URL o array di URL
  onChange: (files: string | string[] | null) => void;
  isRequired?: boolean;
  isReadonly?: boolean;
  multiple?: boolean;
  config?: {
    maxFileSize?: number; // In MB
    allowedExtensions?: string[]; // ['.pdf', '.doc', '.docx']
    maxFiles?: number;
  };
  error?: string;
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  url: string;
  type: string;
}

export const FileUploadField: React.FC<FileUploadFieldProps> = ({
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploadError, setUploadError] = useState<string>('');

  const {
    maxFileSize = 10, // 10MB default
    allowedExtensions = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'],
    maxFiles = multiple ? 5 : 1
  } = config;

  // Converte valore stringa in array di file
  React.useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      const files: UploadedFile[] = urls.map((url, index) => ({
        id: `existing-${index}`,
        name: url.split('/').pop() || 'file',
        size: 0,
        url,
        type: 'existing'
      }));
      setUploadedFiles(files);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    // Validazione dimensione
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSize) {
      return `Il file ${file.name} supera la dimensione massima di ${maxFileSize}MB`;
    }

    // Validazione estensione
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
      return `Formato file non supportato. Formati ammessi: ${allowedExtensions.join(', ')}`;
    }

    // Validazione numero massimo
    if (uploadedFiles.length >= maxFiles) {
      return `Numero massimo di file raggiunto (${maxFiles})`;
    }

    return null;
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError('');
    const newFiles: UploadedFile[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validazione
      const validationError = validateFile(file);
      if (validationError) {
        setUploadError(validationError);
        continue;
      }

      // Simula upload - In produzione, inviare a backend
      // TODO: Implementare upload reale al backend
      const fileUrl = URL.createObjectURL(file);
      
      newFiles.push({
        id: `new-${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        url: fileUrl,
        type: file.type
      });
    }

    const updatedFiles = multiple 
      ? [...uploadedFiles, ...newFiles]
      : newFiles;

    setUploadedFiles(updatedFiles);
    
    // Notifica parent component
    const urls = updatedFiles.map(f => f.url);
    onChange(multiple ? urls : urls[0] || null);
  };

  const handleRemoveFile = (fileId: string) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    
    const urls = updatedFiles.map(f => f.url);
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
    handleFileSelect(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
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
        {!isReadonly && uploadedFiles.length < maxFiles && (
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
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-2">
              Trascina i file qui o{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                sfoglia
              </button>
            </p>
            <p className="text-xs text-gray-500">
              Formati supportati: {allowedExtensions.join(', ')}
              <br />
              Dimensione massima: {maxFileSize}MB
              {multiple && ` • Max ${maxFiles} file`}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple={multiple}
              accept={allowedExtensions.join(',')}
              onChange={(e) => handleFileSelect(e.target.files)}
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

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className={cn('space-y-2', !isReadonly && uploadedFiles.length < maxFiles && 'mt-4')}>
            <p className="text-sm font-medium text-gray-700">
              File caricati ({uploadedFiles.length}/{maxFiles})
            </p>
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <File className="h-8 w-8 text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.name}
                  </p>
                  {file.size > 0 && (
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  )}
                </div>
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                {!isReadonly && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(file.id)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Rimuovi file"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty state per readonly */}
        {isReadonly && uploadedFiles.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4">
            Nessun file caricato
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

export default FileUploadField;
