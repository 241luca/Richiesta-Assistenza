import React from 'react';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';

interface EmptyStateProps {
  onCreateNew?: () => void;
}

/**
 * Empty State per calendario senza interventi
 * Mostra un messaggio chiaro e un'azione per creare il primo intervento
 */
export default function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        {/* Icona grande */}
        <div className="mx-auto mb-6 w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
          <CalendarIcon className="w-12 h-12 text-blue-600" />
        </div>

        {/* Titolo */}
        <h3 className="text-2xl font-semibold text-gray-900 mb-3">
          Nessun intervento programmato
        </h3>

        {/* Descrizione */}
        <p className="text-gray-600 mb-6">
          Il tuo calendario è vuoto. Inizia a programmare il tuo primo intervento
          per organizzare al meglio il tuo lavoro.
        </p>

        {/* Call to action */}
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Crea Primo Intervento
          </button>
        )}

        {/* Suggerimenti */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">💡 Suggerimenti:</p>
          <ul className="text-sm text-gray-600 space-y-2 text-left">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Gli interventi devono essere collegati a richieste di assistenza</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Puoi trascinare gli interventi per riorganizzarli</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Il sistema controlla automaticamente i conflitti orari</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
