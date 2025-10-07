/**
 * DraftBanner Component
 * Componente per mostrare un banner quando è disponibile una bozza salvata
 * Permette all'utente di ripristinare o eliminare la bozza
 */

import React from 'react';
import { ClockIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface DraftInfo {
  timestamp: string;
  timeAgo: string;
  fieldsCount: number;
  hasContent: boolean;
}

interface DraftBannerProps {
  draftInfo: DraftInfo;
  onRestore: () => void;
  onDismiss: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export const DraftBanner: React.FC<DraftBannerProps> = ({
  draftInfo,
  onRestore,
  onDismiss,
  title = "Bozza trovata",
  description,
  className = ""
}) => {
  // Genera la descrizione di default se non fornita
  const defaultDescription = `Hai una bozza salvata ${draftInfo.timeAgo} con ${draftInfo.fieldsCount} campi compilati`;
  const finalDescription = description || defaultDescription;

  return (
    <div className={`bg-amber-50 border-l-4 border-amber-400 p-4 mb-6 rounded-r-lg shadow-sm ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icona principale */}
          <div className="flex-shrink-0 mt-0.5">
            <div className="relative">
              <DocumentTextIcon className="h-6 w-6 text-amber-600" />
              <ClockIcon className="h-3 w-3 text-amber-500 absolute -bottom-0.5 -right-0.5 bg-amber-50 rounded-full" />
            </div>
          </div>

          {/* Contenuto principale */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-amber-900 text-base">
                {title}
              </h3>
              {draftInfo.hasContent && (
                <CheckCircleIcon className="h-4 w-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-amber-800 mb-3 leading-relaxed">
              {finalDescription}
            </p>

            {/* Informazioni aggiuntive */}
            <div className="flex items-center gap-4 text-xs text-amber-700 mb-4">
              <div className="flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                <span>Salvata {draftInfo.timeAgo}</span>
              </div>
              <div className="flex items-center gap-1">
                <DocumentTextIcon className="h-3 w-3" />
                <span>{draftInfo.fieldsCount} campi</span>
              </div>
            </div>

            {/* Azioni */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onRestore}
                className="inline-flex items-center justify-center px-4 py-2 bg-amber-600 hover:bg-amber-700 focus:bg-amber-700 text-white rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                <DocumentTextIcon className="h-4 w-4 mr-2" />
                Ripristina Bozza
              </button>
              
              <button
                onClick={onDismiss}
                className="inline-flex items-center justify-center px-4 py-2 bg-white hover:bg-gray-50 focus:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg font-medium text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                <XMarkIcon className="h-4 w-4 mr-2" />
                Inizia da Capo
              </button>
            </div>
          </div>
        </div>

        {/* Pulsante chiusura in alto a destra */}
        <button
          onClick={onDismiss}
          className="flex-shrink-0 ml-4 text-amber-600 hover:text-amber-800 focus:text-amber-800 transition-colors duration-200 focus:outline-none"
          aria-label="Chiudi banner"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * DraftIndicator Component
 * Piccolo indicatore per mostrare che il salvataggio automatico è attivo
 */
interface DraftIndicatorProps {
  isActive?: boolean;
  lastSaved?: string;
  className?: string;
}

export const DraftIndicator: React.FC<DraftIndicatorProps> = ({
  isActive = true,
  lastSaved,
  className = ""
}) => {
  if (!isActive) return null;

  return (
    <div className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}>
      <div className="relative">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping" />
      </div>
      <span>
        Salvataggio automatico attivo
        {lastSaved && (
          <span className="text-gray-400"> • Ultimo salvataggio: {lastSaved}</span>
        )}
      </span>
    </div>
  );
};

/**
 * DraftIcon Component  
 * Icona per indicare la presenza di una bozza
 */
interface DraftIconProps {
  hasDraft: boolean;
  onClick?: () => void;
  className?: string;
}

export const DraftIcon: React.FC<DraftIconProps> = ({
  hasDraft,
  onClick,
  className = ""
}) => {
  if (!hasDraft) return null;

  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-2 text-amber-600 hover:text-amber-800 focus:text-amber-800 transition-colors duration-200 focus:outline-none ${className}`}
      title="Bozza disponibile"
    >
      <DocumentTextIcon className="h-5 w-5" />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
        <div className="w-1.5 h-1.5 bg-white rounded-full" />
      </div>
    </button>
  );
};

export default DraftBanner;
