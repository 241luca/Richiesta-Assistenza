import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/services/api';
import {
  DocumentTextIcon,
  ShieldCheckIcon,
  CakeIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationCircleIcon,
  ScaleIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';

// Mappa icone dinamica basata sul nome stringa
const iconMap: Record<string, React.ComponentType<any>> = {
  'ShieldCheckIcon': ShieldCheckIcon,
  'DocumentTextIcon': DocumentTextIcon,
  'CakeIcon': CakeIcon,
  'ScaleIcon': ScaleIcon,
  'DocumentDuplicateIcon': DocumentDuplicateIcon
};

export default function LegalDocumentsIndexPage() {
  const navigate = useNavigate();

  // Funzione per tornare indietro
  const handleGoBack = () => {
    // Se c'è una storia di navigazione, torna indietro
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Altrimenti vai alla home
      navigate('/');
    }
  };

  // Fetch tutti i documenti pubblici dal database
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['public-legal-documents-all'],
    queryFn: async () => {
      const response = await api.get('/public/legal/all');
      return response.data?.data || [];
    },
    retry: 2
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento documenti...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <ExclamationCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Errore nel caricamento
          </h2>
          <p className="text-gray-600 mb-4">
            Non è stato possibile caricare i documenti legali. Riprova più tardi.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bottone Torna Indietro */}
          <div className="pt-4">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              title="Torna indietro"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Torna indietro
            </button>
          </div>
          
          {/* Contenuto Header */}
          <div className="py-16 text-center">
            <ShieldCheckIcon className="h-16 w-16 mx-auto mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              Centro Documenti Legali
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Trasparenza e fiducia sono alla base del nostro servizio. 
              Qui trovi tutti i documenti legali che regolano l'utilizzo della nostra piattaforma.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <ExclamationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun documento disponibile
            </h2>
            <p className="text-gray-600">
              I documenti legali saranno disponibili a breve.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => {
              // Ottieni l'icona corretta dalla mappa o usa default
              const IconComponent = iconMap[doc.icon || 'DocumentTextIcon'] || DocumentTextIcon;
              
              // Genera href basato sul tipo
              const href = `/legal/${doc.type?.toLowerCase().replace(/_/g, '-') || doc.code?.toLowerCase().replace(/_/g, '-')}`;
              
              // Determina il colore del badge
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-800 border-blue-200',
                green: 'bg-green-100 text-green-800 border-green-200',
                yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                purple: 'bg-purple-100 text-purple-800 border-purple-200',
                gray: 'bg-gray-100 text-gray-800 border-gray-200'
              };
              const badgeColor = colorClasses[doc.color as keyof typeof colorClasses] || colorClasses.gray;

              return (
                <Link
                  key={doc.id}
                  to={href}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden border border-gray-200 hover:border-blue-300"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${badgeColor} border`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      {doc.hasPublishedVersion && (
                        <CheckBadgeIcon className="h-5 w-5 text-green-500" title="Pubblicato" />
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {doc.displayName || doc.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {doc.description || 'Documento legale'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-gray-500">
                        {doc.lastUpdated ? (
                          <>
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            {new Date(doc.lastUpdated).toLocaleDateString('it-IT')}
                          </>
                        ) : (
                          <span className="text-yellow-600">In preparazione</span>
                        )}
                      </div>
                      
                      <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-12 bg-blue-50 rounded-xl p-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Il nostro impegno per la trasparenza
            </h2>
            <p className="text-gray-700 mb-6">
              Crediamo che ogni utente abbia il diritto di sapere come vengono gestiti i propri dati 
              e quali sono i termini del servizio. Per questo manteniamo tutti i nostri documenti 
              legali sempre aggiornati e facilmente accessibili.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <ShieldCheckIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Privacy First</h3>
                <p className="text-sm text-gray-600">
                  I tuoi dati sono protetti secondo i più alti standard
                </p>
              </div>
              <div className="text-center">
                <CheckBadgeIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Sempre Aggiornati</h3>
                <p className="text-sm text-gray-600">
                  Documenti revisionati e conformi alle normative
                </p>
              </div>
              <div className="text-center">
                <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900 mb-1">Facili da Capire</h3>
                <p className="text-sm text-gray-600">
                  Linguaggio chiaro e comprensibile per tutti
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Hai domande sui nostri documenti legali?{' '}
            <a href="/contatti" className="text-blue-600 hover:underline">
              Contattaci
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
