import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  XMarkIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ClockIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

interface LegalDocument {
  id: string;
  type: string;
  displayName: string;
  requiresAcceptance: boolean;
  currentVersion: {
    id: string;
    version: string;
    title: string;
    content: string;
    effectiveDate: string;
    summary?: string;
  };
}

interface LegalAcceptanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onComplete?: () => void;
  canSkip?: boolean;
}

export default function LegalAcceptanceModal({
  isOpen,
  onClose,
  onComplete,
  canSkip = false
}: LegalAcceptanceModalProps) {
  const [currentDocIndex, setCurrentDocIndex] = useState(0);
  const [acceptedDocs, setAcceptedDocs] = useState<Set<string>>(new Set());
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch pending documents
  const { data: pendingDocuments = [], isLoading } = useQuery({
    queryKey: ['pending-legal-documents'],
    queryFn: async () => {
      const response = await api.get('/legal/pending');
      return response.data?.data || [];
    },
    enabled: isOpen
  });

  // Accept documents mutation
  const acceptMutation = useMutation({
    mutationFn: async (acceptances: Array<{ documentId: string; versionId: string }>) => {
      return api.post('/legal/accept-multiple', {
        acceptances,
        method: 'EXPLICIT_CLICK',
        source: 'modal_acceptance'
      });
    },
    onSuccess: () => {
      toast.success('Documenti accettati con successo!');
      onComplete?.();
    },
    onError: () => {
      toast.error('Errore nell\'accettazione dei documenti');
      setIsSubmitting(false);
    }
  });

  // Current document
  const currentDoc = pendingDocuments[currentDocIndex];

  // Handle scroll tracking
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const scrolledToBottom = 
      Math.abs(element.scrollHeight - element.clientHeight - element.scrollTop) < 10;
    
    if (scrolledToBottom && currentDoc) {
      setHasScrolledToBottom(prev => new Set(prev).add(currentDoc.document.id));
    }
  };

  // Handle document acceptance
  const handleAcceptDocument = () => {
    if (!currentDoc) return;
    
    setAcceptedDocs(prev => new Set(prev).add(currentDoc.document.id));
    
    if (currentDocIndex < pendingDocuments.length - 1) {
      setCurrentDocIndex(currentDocIndex + 1);
    }
  };

  // Handle final submission
  const handleSubmitAll = async () => {
    setIsSubmitting(true);
    
    const acceptances = pendingDocuments
      .filter(doc => acceptedDocs.has(doc.document.id))
      .map(doc => ({
        documentId: doc.document.id,
        versionId: doc.version.id
      }));
    
    acceptMutation.mutate(acceptances);
  };

  // Can accept current document?
  const canAcceptCurrent = currentDoc && 
    (hasScrolledToBottom.has(currentDoc.document.id) || !currentDoc.document.isRequired);

  // All required documents accepted?
  const allRequiredAccepted = pendingDocuments
    .filter(doc => doc.document.isRequired)
    .every(doc => acceptedDocs.has(doc.document.id));

  if (!isOpen || pendingDocuments.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Documenti Legali da Accettare
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Per continuare, devi accettare i seguenti documenti
              </p>
            </div>
          </div>
          
          {canSkip && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Documento {currentDocIndex + 1} di {pendingDocuments.length}
            </span>
            <span className="text-sm text-gray-600">
              {acceptedDocs.size} accettati
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentDocIndex + 1) / pendingDocuments.length) * 100}%` }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <ClockIcon className="h-8 w-8 text-gray-400 animate-spin" />
          </div>
        ) : currentDoc ? (
          <>
            {/* Document Info */}
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    {currentDoc.document.displayName}
                    {currentDoc.document.isRequired && (
                      <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                        Obbligatorio
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <DocumentTextIcon className="h-4 w-4 mr-1" />
                      Versione {currentDoc.version.version}
                    </span>
                    <span className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {new Date(currentDoc.version.effectiveDate).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  {currentDoc.version.summary && (
                    <p className="mt-2 text-sm text-gray-700">
                      {currentDoc.version.summary}
                    </p>
                  )}
                </div>
                
                {acceptedDocs.has(currentDoc.document.id) && (
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                )}
              </div>
            </div>

            {/* Document Content */}
            <div 
              className="flex-1 overflow-y-auto px-6 py-4"
              onScroll={handleScroll}
            >
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: currentDoc.version.content }}
              />
              
              {/* Scroll indicator */}
              {!hasScrolledToBottom.has(currentDoc.document.id) && currentDoc.document.isRequired && (
                <div className="sticky bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none flex items-end justify-center pb-2">
                  <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full shadow-sm">
                    ↓ Scorri per leggere tutto il documento
                  </span>
                </div>
              )}
            </div>

            {/* Document Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              {!acceptedDocs.has(currentDoc.document.id) ? (
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={handleAcceptDocument}
                      disabled={!canAcceptCurrent}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <span className={`text-sm ${canAcceptCurrent ? 'text-gray-700' : 'text-gray-400'}`}>
                      Ho letto e accetto {currentDoc.document.displayName}
                    </span>
                  </label>
                  
                  {currentDocIndex < pendingDocuments.length - 1 && (
                    <button
                      onClick={() => setCurrentDocIndex(currentDocIndex + 1)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      Salta per ora
                      <ArrowRightIcon className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-green-600">
                    <CheckCircleIcon className="h-5 w-5" />
                    <span className="text-sm font-medium">Documento accettato</span>
                  </div>
                  
                  {currentDocIndex < pendingDocuments.length - 1 ? (
                    <button
                      onClick={() => setCurrentDocIndex(currentDocIndex + 1)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center"
                    >
                      Prossimo documento
                      <ArrowRightIcon className="h-4 w-4 ml-2" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitAll}
                      disabled={!allRequiredAccepted || isSubmitting}
                      className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <ClockIcon className="h-4 w-4 mr-2 animate-spin" />
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="h-4 w-4 mr-2" />
                          Conferma e Continua
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Footer Navigation */}
        {pendingDocuments.length > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setCurrentDocIndex(Math.max(0, currentDocIndex - 1))}
              disabled={currentDocIndex === 0}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Precedente
            </button>
            
            <div className="flex space-x-1">
              {pendingDocuments.map((doc, index) => (
                <button
                  key={doc.document.id}
                  onClick={() => setCurrentDocIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentDocIndex 
                      ? 'bg-blue-600' 
                      : acceptedDocs.has(doc.document.id)
                        ? 'bg-green-600'
                        : 'bg-gray-300'
                  }`}
                  title={doc.document.displayName}
                />
              ))}
            </div>
            
            <button
              onClick={() => setCurrentDocIndex(Math.min(pendingDocuments.length - 1, currentDocIndex + 1))}
              disabled={currentDocIndex === pendingDocuments.length - 1}
              className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Successivo
              <ArrowRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
