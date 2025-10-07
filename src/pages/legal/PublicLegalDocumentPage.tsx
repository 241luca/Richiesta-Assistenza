import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ClockIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ArrowLeftIcon,
  PrinterIcon,
  ShareIcon,
  GlobeAltIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import { apiClient } from '@/services/api';
import { toast } from 'react-hot-toast';

export default function PublicLegalDocumentPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();

  // Funzione per tornare indietro
  const handleGoBack = () => {
    // Se c'è una storia di navigazione, torna indietro
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Altrimenti vai alla pagina indice dei documenti
      navigate('/legal');
    }
  };

  // Converti il parametro URL nel formato tipo documento (es: privacy-policy -> PRIVACY_POLICY)
  const documentType = type?.toUpperCase().replace(/-/g, '_') || '';

  // Fetch del documento pubblico
  const { data: document, isLoading, error } = useQuery({
    queryKey: ['public-legal-document', documentType],
    queryFn: async () => {
      // L'endpoint pubblico non richiede autenticazione
      // Usa apiClient direttamente invece di api wrapper
      const response = await apiClient.get(`/public/legal/${type}`);
      return response.data?.data;
    },
    enabled: !!type
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document?.displayName,
        text: document?.description,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copiato negli appunti');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento documento...</p>
        </div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Documento non trovato
          </h2>
          <p className="text-gray-600 mb-4">
            Il documento richiesto non è disponibile o è in fase di preparazione.
          </p>
          <button
            onClick={() => navigate('/legal')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Torna ai documenti
          </button>
        </div>
      </div>
    );
  }

  const currentVersion = document.currentVersion;
  const hasContent = currentVersion && currentVersion.content;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleGoBack}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Torna indietro"
              >
                <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {document.displayName || document.type}
                </h1>
                {currentVersion && (
                  <p className="text-sm text-gray-500 mt-1">
                    Versione {currentVersion.version} • 
                    Effettiva dal {new Date(currentVersion.effectiveDate).toLocaleDateString('it-IT')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Stampa"
              >
                <PrinterIcon className="h-5 w-5" />
              </button>
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Condividi"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Document */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          {hasContent ? (
            <>
              {/* Summary Box */}
              {currentVersion.summary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 no-print">
                  <div className="flex">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">
                        Riepilogo
                      </h3>
                      <p className="text-sm text-blue-800">
                        {currentVersion.summary}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Content with Complete Styling */}
              <div 
                className="prose prose-lg max-w-none
                  prose-headings:text-gray-900 
                  prose-h1:text-3xl prose-h1:font-bold prose-h1:border-b-2 prose-h1:border-blue-600 prose-h1:pb-3 prose-h1:mb-6
                  prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-gray-800
                  prose-h3:text-xl prose-h3:font-medium prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-gray-700
                  prose-p:text-gray-700 prose-p:text-justify prose-p:leading-relaxed prose-p:mb-4
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-em:text-gray-600 prose-em:italic
                  prose-ul:list-disc prose-ul:pl-6 prose-ul:my-4 prose-ul:text-gray-700
                  prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-4 prose-ol:text-gray-700
                  prose-li:my-2 prose-li:leading-relaxed
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:bg-blue-50 
                  prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:italic prose-blockquote:text-gray-700
                  prose-blockquote:my-6 prose-blockquote:rounded-r-lg
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-700 hover:prose-a:underline
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto
                  prose-table:w-full prose-table:border-collapse prose-table:my-6
                  prose-th:bg-blue-600 prose-th:text-white prose-th:p-3 prose-th:text-left prose-th:font-semibold
                  prose-td:border prose-td:border-gray-300 prose-td:p-3 prose-td:text-gray-700
                  prose-tr:even:bg-gray-50 prose-tr:hover:bg-gray-100
                  prose-img:rounded-lg prose-img:shadow-md prose-img:my-6
                  prose-hr:border-gray-300 prose-hr:my-8"
                dangerouslySetInnerHTML={{ __html: currentVersion.content }}
                style={{
                  lineHeight: '1.8',
                  fontSize: '1.05rem'
                }}
              />

              {/* Document Footer */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    <span>
                      Ultimo aggiornamento: {new Date(document.lastUpdated || currentVersion.effectiveDate).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <DocumentCheckIcon className="h-4 w-4 mr-1" />
                    <span>Versione {currentVersion.version}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Documento in preparazione
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                {document.description || 'Questo documento è attualmente in fase di preparazione e sarà disponibile a breve.'}
              </p>
            </div>
          )}
        </div>

        {/* Info Section - Solo per documenti con contenuto */}
        {hasContent && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
            {/* Document Type */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Tipo Documento
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {document.displayName}
                  </p>
                </div>
              </div>
            </div>

            {/* Language */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <GlobeAltIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Lingua
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {currentVersion.language === 'it' ? 'Italiano' : currentVersion.language?.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            {/* Version */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">
                    Versione
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {currentVersion.version}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8 no-print">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Hai bisogno di chiarimenti?
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              Se hai domande su questo documento o sui nostri servizi, il nostro team è qui per aiutarti.
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="/contatti"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Contatta il supporto
              </a>
              <button
                onClick={() => navigate('/legal')}
                className="inline-flex items-center px-4 py-2 bg-white text-blue-600 rounded-lg border border-blue-300 hover:bg-blue-50 transition-colors"
              >
                Altri documenti
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-gray-500 mt-8 no-print">
          <p>
            Questo documento è fornito a scopo informativo. Per la versione legalmente vincolante,
            consulta i termini accettati al momento della registrazione.
          </p>
        </div>
      </div>
    </div>
  );
}
