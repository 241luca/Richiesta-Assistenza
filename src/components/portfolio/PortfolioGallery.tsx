import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface Portfolio {
  id: string;
  title: string;
  description?: string;
  beforeImage: string;
  afterImage: string;
  category: {
    id: string;
    name: string;
  };
  technicalDetails?: string;
  materialsUsed?: string;
  duration?: string;
  cost?: number;
  location?: string;
  viewCount: number;
  createdAt: string;
}

interface PortfolioGalleryProps {
  professionalId: string;
  editable?: boolean;
  onEdit?: (portfolio: Portfolio) => void;
  onDelete?: (portfolioId: string) => void;
}

export const PortfolioGallery: React.FC<PortfolioGalleryProps> = ({ 
  professionalId,
  editable = false,
  onEdit,
  onDelete
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showBefore, setShowBefore] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  // Carica i portfolio del professionista
  const { data: portfolios, isLoading, error } = useQuery({
    queryKey: ['portfolio', professionalId],
    queryFn: async () => {
      const response = await api.get(`/portfolio/professional/${professionalId}`);
      return response.data.data as Portfolio[];
    },
    staleTime: 5 * 60 * 1000 // Cache per 5 minuti
  });

  // Se sta caricando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se c'è un errore
  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Errore nel caricamento del portfolio
      </div>
    );
  }

  // Se non ci sono portfolio
  if (!portfolios || portfolios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500">Nessun lavoro nel portfolio</p>
        {editable && (
          <p className="text-sm text-gray-400 mt-2">
            Inizia ad aggiungere i tuoi lavori per mostrare le tue competenze
          </p>
        )}
      </div>
    );
  }

  const current = portfolios[selectedIndex];

  const handlePrevious = () => {
    setSelectedIndex(index => index > 0 ? index - 1 : portfolios.length - 1);
  };

  const handleNext = () => {
    setSelectedIndex(index => index < portfolios.length - 1 ? index + 1 : 0);
  };

  return (
    <div className="space-y-4">
      {/* Immagine principale con controlli */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-video group">
        {/* Immagine */}
        <img
          src={showBefore ? current.beforeImage : current.afterImage}
          alt={`${current.title} - ${showBefore ? 'Prima' : 'Dopo'}`}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay con informazioni */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="text-lg font-semibold">{current.title}</h3>
            {current.location && (
              <p className="text-sm opacity-90">📍 {current.location}</p>
            )}
          </div>
        </div>

        {/* Contatore visualizzazioni */}
        <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
          <EyeIcon className="h-4 w-4" />
          {current.viewCount}
        </div>

        {/* Toggle Prima/Dopo */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-lg overflow-hidden flex">
          <button
            onClick={() => setShowBefore(true)}
            className={`px-6 py-2 font-semibold transition-colors ${
              showBefore 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Prima
          </button>
          <button
            onClick={() => setShowBefore(false)}
            className={`px-6 py-2 font-semibold transition-colors ${
              !showBefore 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            Dopo
          </button>
        </div>

        {/* Navigazione se ci sono più portfolio */}
        {portfolios.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
              aria-label="Precedente"
            >
              <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-colors"
              aria-label="Successivo"
            >
              <ChevronRightIcon className="h-6 w-6 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Informazioni del lavoro */}
      <div className="bg-white rounded-lg p-4 shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{current.title}</h3>
            {current.description && (
              <p className="text-gray-600 mt-1">{current.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {current.category.name}
              </span>
              {current.duration && (
                <span>⏱️ {current.duration}</span>
              )}
              {current.cost && (
                <span>💰 €{current.cost.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Pulsante per dettagli */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            {showDetails ? 'Nascondi dettagli' : 'Mostra dettagli'}
          </button>
        </div>

        {/* Dettagli espandibili */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
            {current.technicalDetails && (
              <div>
                <h4 className="font-semibold text-gray-700 text-sm">Dettagli tecnici:</h4>
                <p className="text-gray-600 text-sm mt-1">{current.technicalDetails}</p>
              </div>
            )}
            {current.materialsUsed && (
              <div>
                <h4 className="font-semibold text-gray-700 text-sm">Materiali utilizzati:</h4>
                <p className="text-gray-600 text-sm mt-1">{current.materialsUsed}</p>
              </div>
            )}
          </div>
        )}

        {/* Azioni per il proprietario */}
        {editable && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(current)}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Modifica
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => {
                  if (confirm('Sei sicuro di voler eliminare questo portfolio?')) {
                    onDelete(current.id);
                  }
                }}
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Elimina
              </button>
            )}
          </div>
        )}
      </div>

      {/* Thumbnails per navigazione rapida */}
      {portfolios.length > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {portfolios.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className={`aspect-video rounded overflow-hidden transition-all ${
                index === selectedIndex 
                  ? 'ring-2 ring-blue-600 ring-offset-2' 
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <img
                src={item.afterImage}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Indicatore di posizione */}
      {portfolios.length > 1 && (
        <div className="text-center text-sm text-gray-500">
          {selectedIndex + 1} di {portfolios.length} lavori
        </div>
      )}
    </div>
  );
};

export default PortfolioGallery;
