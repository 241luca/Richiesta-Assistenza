import React, { useState, useEffect } from 'react';
import { FileText, Download, Trash2, Eye, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { toast } from '../../utils/toast';
import api from '../../services/api';

interface Document {
  id: string;
  container_id: string;
  title: string;
  description?: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  document_type: string;
  status: string;
  upload_date: string;
  processed_date?: string;
  chunks_count?: number;
  error_message?: string;
}

interface DocumentListProps {
  containerId: string;
  refreshTrigger?: number;
}

export default function DocumentList({ containerId, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadDocuments();
  }, [containerId, refreshTrigger]);

  // Auto-refresh se ci sono documenti in PROCESSING
  useEffect(() => {
    const hasProcessing = documents.some(doc => doc.status === 'PROCESSING');
    
    if (hasProcessing && !pollingInterval) {
      console.log('Starting polling - documents in PROCESSING state');
      const interval = setInterval(() => {
        loadDocuments();
      }, 3000); // Poll ogni 3 secondi
      setPollingInterval(interval);
    } else if (!hasProcessing && pollingInterval) {
      console.log('Stopping polling - no documents in PROCESSING state');
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }

    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [documents]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/smartdocs/documents/container/${containerId}`);
      
      if (response.data.success) {
        setDocuments(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load documents');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      setDeleting(documentId);
      await api.delete(`/smartdocs/documents/${documentId}`);
      toast.success('Document deleted successfully');
      loadDocuments();
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      toast.error(error.response?.data?.error || 'Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const handleReprocess = async (documentId: string, fileName: string) => {
    if (!confirm(`Reprocess "${fileName}"? This will generate new embeddings.`)) {
      return;
    }

    try {
      setProcessing(documentId);
      await api.post(`/smartdocs/documents/${documentId}/process`);
      toast.success('Document processing started - will update automatically');
      
      // Refresh immediatamente per mostrare PROCESSING
      setTimeout(loadDocuments, 1000);
    } catch (error: any) {
      console.error('Failed to process document:', error);
      toast.error(error.response?.data?.error || 'Failed to process document');
    } finally {
      setProcessing(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Not Processed', className: 'bg-gray-100 text-gray-800' },
      PROCESSING: { label: 'Processing...', className: 'bg-yellow-100 text-yellow-800' },
      COMPLETED: { label: 'Ready', className: 'bg-green-100 text-green-800' },
      ERROR: { label: 'Error', className: 'bg-red-100 text-red-800' },
      // Old statuses for compatibility
      uploaded: { label: 'Uploaded', className: 'bg-blue-100 text-blue-800' },
      processing: { label: 'Processing', className: 'bg-yellow-100 text-yellow-800' },
      ready: { label: 'Ready', className: 'bg-green-100 text-green-800' },
      error: { label: 'Error', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.PENDING;

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) {
      return <FileText className="w-8 h-8 text-gray-400" />;
    }
    
    if (mimeType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-600" />;
    }
    if (mimeType.includes('word')) {
      return <FileText className="w-8 h-8 text-blue-600" />;
    }
    if (mimeType.includes('text')) {
      return <FileText className="w-8 h-8 text-gray-600" />;
    }
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileText className="w-8 h-8 text-green-600" />;
    }
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600 mt-4">Loading documents...</p>
        </CardContent>
      </Card>
    );
  }

  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No documents yet
          </h3>
          <p className="text-gray-600">
            Upload your first document to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Documents ({documents.length})</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDocuments}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(doc.mime_type)}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900 truncate">
                    {doc.title}
                  </h4>
                  {getStatusBadge(doc.status)}
                </div>
                
                <p className="text-sm text-gray-600 mb-1">
                  {doc.file_name}
                </p>
                
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{formatFileSize(doc.file_size)}</span>
                  <span>•</span>
                  <span>{formatDate(doc.upload_date)}</span>
                  {doc.chunks_count && (
                    <>
                      <span>•</span>
                      <span>{doc.chunks_count} chunks</span>
                    </>
                  )}
                </div>

                {doc.description && (
                  <p className="text-sm text-gray-600 mt-2">
                    {doc.description}
                  </p>
                )}

                {/* Error Message */}
                {doc.status === 'ERROR' && doc.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-800">{doc.error_message}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Process/Reprocess Button - Show if PENDING or ERROR */}
                {(doc.status === 'PENDING' || doc.status === 'ERROR') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReprocess(doc.id, doc.file_name)}
                    disabled={processing === doc.id}
                    title={doc.status === 'PENDING' ? 'Process Document' : 'Reprocess Document'}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                  >
                    {processing === doc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/api/smartdocs/documents/${doc.id}/download`, '_blank')}
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.file_name)}
                  disabled={deleting === doc.id}
                  title="Delete"
                >
                  {deleting === doc.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
