import React from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBannerProps {
  error?: any;
  onRetry?: () => void;
  message?: string;
}

/**
 * Error Banner per mostrare errori di caricamento
 * Con possibilità di riprovare
 */
export default function ErrorBanner({ 
  error, 
  onRetry, 
  message = 'Impossibile caricare gli interventi' 
}: ErrorBannerProps) {
  // Estrai messaggio errore se disponibile
  const errorMessage = error?.response?.data?.message 
    || error?.message 
    || message;

  return (
    <div className="h-full flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full">
        {/* Card errore */}
        <div className="bg-white rounded-lg shadow-lg border-2 border-red-200 p-6">
          {/* Icona */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
          </div>

          {/* Titolo */}
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Ops! Qualcosa è andato storto
          </h3>

          {/* Messaggio errore */}
          <p className="text-gray-600 text-center mb-6">
            {errorMessage}
          </p>

          {/* Azioni */}
          <div className="flex flex-col space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                <ArrowPathIcon className="w-5 h-5 mr-2" />
                Riprova
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Ricarica Pagina
            </button>
          </div>

          {/* Dettagli tecnici (collapsabile) */}
          {error && import.meta.env.DEV && (
            <details className="mt-6 pt-4 border-t border-gray-200">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                Dettagli tecnici (solo dev)
              </summary>
              <pre className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 overflow-auto max-h-32">
                {JSON.stringify(error, null, 2)}
              </pre>
            </details>
          )}
        </div>

        {/* Suggerimenti */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 font-medium mb-2">
            Possibili cause:
          </p>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Connessione internet assente o instabile</li>
            <li>• Il server potrebbe essere temporaneamente non disponibile</li>
            <li>• Problema con la sessione (prova a rifare il login)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
