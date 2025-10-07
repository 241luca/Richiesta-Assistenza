import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'react-hot-toast';
import {
  DocumentIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  FolderOpenIcon,
  DocumentTextIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface KnowledgeBaseManagerProps {
  professionalId: string;
  subcategoryId: string;
  targetAudience: 'professional' | 'client';
}

interface KnowledgeDocument {
  id: string;
  name?: string;
  originalName?: string;
  size?: number;
  fileSize?: number;
  uploadedAt?: string;
  createdAt?: string;
  isProcessed?: boolean;
  processedAt?: string;
}

export function KnowledgeBaseManager({ 
  professionalId, 
  subcategoryId, 
  targetAudience 
}: KnowledgeBaseManagerProps) {
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch documenti esistenti
  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['kb-documents', professionalId, subcategoryId, targetAudience],
    queryFn: async () => {
      try {
        const response = await api.get(`/knowledge-base/${professionalId}/${subcategoryId}`, {
          params: { targetAudience }
        });
        console.log('Documents fetched:', response.data?.data);
        return response.data?.data || [];
      } catch (error) {
        console.error('Error fetching documents:', error);
        return [];
      }
    },
    refetchInterval: 5000, // Refresh ogni 5 secondi per debug
  });

  // Upload documento
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('professionalId', professionalId);
      formData.append('subcategoryId', subcategoryId);
      formData.append('targetAudience', targetAudience);

      const response = await api.post(`/knowledge-base/${professionalId}/${subcategoryId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('Upload response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Upload successful, refreshing query...');
      queryClient.invalidateQueries({ 
        queryKey: ['kb-documents', professionalId, subcategoryId, targetAudience] 
      });
      refetch(); // Forza il refresh immediato
      toast.success('Documento caricato con successo!');
      setSelectedFile(null);
      setUploadingFile(false);
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Errore nel caricamento del documento');
      setUploadingFile(false);
    }
  });

  // Elimina documento
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return api.delete(`/knowledge-base/${professionalId}/${subcategoryId}/${documentId}`, {
        params: { targetAudience }
      });
    },
    onSuccess: () => {
      console.log('Delete successful, refreshing query...');
      queryClient.invalidateQueries({ 
        queryKey: ['kb-documents', professionalId, subcategoryId, targetAudience] 
      });
      refetch(); // Forza il refresh immediato
      toast.success('Documento eliminato');
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error('Errore nell\'eliminazione del documento');
    }
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verifica tipo file
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo file non supportato. Usa PDF, DOC, DOCX, TXT o MD');
        return;
      }

      // Verifica dimensione (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Il file è troppo grande. Max 10MB');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    console.log('Starting upload for file:', selectedFile.name);
    setUploadingFile(true);
    uploadMutation.mutate(selectedFile);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Processa i documenti per l'AI
  const processDocuments = async () => {
    setIsProcessing(true);
    try {
      const response = await api.post(`/knowledge-base/${professionalId}/${subcategoryId}/process`, {
        targetAudience
      });
      
      toast.success(`${response.data?.data?.documentsCount || 0} documenti processati con successo!`);
      refetch(); // Ricarica la lista per aggiornare lo stato
    } catch (error) {
      console.error('Error processing documents:', error);
      toast.error('Errore nel processamento dei documenti');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = (fileName: string | undefined) => {
    if (!fileName) return '📎';
    
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📄';
    if (['doc', 'docx'].includes(ext || '')) return '📝';
    if (['txt', 'md'].includes(ext || '')) return '📃';
    return '📎';
  };

  // Log per debug
  console.log('Current documents:', documents);
  console.log('Target audience:', targetAudience);

  return (
    <div className="space-y-4">
      {/* Upload sezione */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderOpenIcon className="h-5 w-5" />
            Knowledge Base {targetAudience === 'professional' ? 'Professionista' : 'Cliente'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* File input */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 transition-colors">
              <input
                type="file"
                id={`file-upload-${targetAudience}`}
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.md"
              />
              <label
                htmlFor={`file-upload-${targetAudience}`}
                className="cursor-pointer flex flex-col items-center"
              >
                <ArrowUpTrayIcon className="h-10 w-10 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Clicca per selezionare un documento
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, TXT, MD (max 10MB)
                </span>
              </label>
            </div>

            {/* File selezionato */}
            {selectedFile && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DocumentIcon className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setSelectedFile(null)}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploadingFile}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {uploadingFile ? 'Caricamento...' : 'Carica'}
                  </Button>
                </div>
              </div>
            )}

            {/* Info */}
            <Alert>
              <DocumentTextIcon className="h-4 w-4" />
              <AlertDescription>
                I documenti caricati verranno utilizzati dall'AI per fornire risposte più accurate 
                {targetAudience === 'professional' 
                  ? ' con dettagli tecnici completi.'
                  : ' in modo semplice e comprensibile.'}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Lista documenti */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Documenti Caricati ({documents?.length || 0})
            </CardTitle>
            {documents && documents.length > 0 && (
              <Button
                size="sm"
                onClick={processDocuments}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processamento...
                  </>
                ) : (
                  <>Processa per AI</>  
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600 text-sm">Caricamento documenti...</p>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc: KnowledgeDocument) => {
                // Usa 'name' invece di 'fileName' e gestisci entrambi i casi
                const fileName = doc.name || doc.originalName || 'Documento senza nome';
                const fileSize = doc.size || doc.fileSize || 0;
                const uploadDate = doc.uploadedAt || doc.createdAt;
                
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getFileIcon(fileName)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            {fileName}
                          </p>
                          {doc.isProcessed && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              ✓ Processato
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatFileSize(fileSize)}</span>
                          <span>•</span>
                          <span>
                            {uploadDate ? new Date(uploadDate).toLocaleDateString('it-IT') : 'Data sconosciuta'}
                          </span>
                          {doc.processedAt && (
                            <>
                              <span>•</span>
                              <span className="text-green-600">
                                Processato: {new Date(doc.processedAt).toLocaleDateString('it-IT')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        console.log('Deleting document:', doc.id);
                        deleteMutation.mutate(doc.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FolderOpenIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">Nessun documento caricato</p>
              <p className="text-xs mt-1">
                Carica documenti per arricchire la knowledge base
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
