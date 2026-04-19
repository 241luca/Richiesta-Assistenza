import React, { useState, useCallback } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from '../../utils/toast';
import api from '../../services/api';

interface DocumentUploaderProps {
  containerId: string;
  onUploadComplete?: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
}

export default function DocumentUploader({ containerId, onUploadComplete }: DocumentUploaderProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `File type not supported: ${file.type}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB (max 50MB)`;
    }
    return null;
  };

  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: UploadingFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);
      
      if (error) {
        toast.error(error);
        continue;
      }

      newFiles.push({
        file,
        progress: 0,
        status: 'pending'
      });
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const uploadFile = async (fileData: UploadingFile, index: number) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map((f, i) => 
        i === index ? { ...f, status: 'uploading' as const } : f
      ));

      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('container_id', containerId);
      formData.append('title', title || fileData.file.name);
      formData.append('description', description || '');
      formData.append('document_type', 'document');

      const response = await api.post('/smartdocs/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent: any) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress } : f
          ));
        }
      });

      // Update status to success
      setFiles(prev => prev.map((f, i) => 
        i === index 
          ? { 
              ...f, 
              status: 'success' as const, 
              progress: 100,
              documentId: response.data.data.id 
            } 
          : f
      ));

      toast.success(`${fileData.file.name} uploaded successfully!`);
      
      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      
      setFiles(prev => prev.map((f, i) => 
        i === index 
          ? { 
              ...f, 
              status: 'error' as const,
              error: error.response?.data?.error || error.message || 'Upload failed'
            } 
          : f
      ));

      toast.error(`Failed to upload ${fileData.file.name}`);
    }
  };

  const handleUploadAll = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(files[i], i);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getStatusIcon = (status: UploadingFile['status']) => {
    switch (status) {
      case 'pending':
        return <File className="w-5 h-5 text-gray-400" />;
      case 'uploading':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metadata Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Title (optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title..."
            />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
            />
          </div>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
          <p className="text-lg font-medium text-gray-700 mb-2">
            {isDragging ? 'Drop files here' : 'Drag & drop files here'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            or click to browse
          </p>
          <p className="text-xs text-gray-400">
            Supported: PDF, DOC, DOCX, TXT, XLS, XLSX (max 50MB)
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Files List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-700">
                Files ({files.length})
              </h4>
              {files.some(f => f.status === 'success') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCompleted}
                >
                  Clear Completed
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {files.map((fileData, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  {getStatusIcon(fileData.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {fileData.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(fileData.file.size)}
                    </p>
                    {fileData.error && (
                      <p className="text-xs text-red-600 mt-1">
                        {fileData.error}
                      </p>
                    )}
                  </div>

                  {fileData.status === 'uploading' && (
                    <div className="w-24">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${fileData.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-center text-gray-600 mt-1">
                        {fileData.progress}%
                      </p>
                    </div>
                  )}

                  {(fileData.status === 'pending' || fileData.status === 'error') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Button */}
            {files.some(f => f.status === 'pending') && (
              <Button
                onClick={handleUploadAll}
                className="w-full"
                disabled={files.every(f => f.status !== 'pending')}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.filter(f => f.status === 'pending').length} File(s)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
