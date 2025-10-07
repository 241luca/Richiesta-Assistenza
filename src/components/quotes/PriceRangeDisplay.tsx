import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyEuroIcon, ChartBarIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

interface PriceRangeDisplayProps {
  categoryId: string;
  subcategoryId?: string;
  className?: string;
}

interface PriceRange {
  min: number;
  max: number;
  median: number;
  average: number;
  sampleSize: number;
  lastUpdated: string;
}

export const PriceRangeDisplay: React.FC<PriceRangeDisplayProps> = ({
  categoryId,
  subcategoryId,
  className = ''
}) => {
  // Query per ottenere il range di prezzi
  const { data: priceData, isLoading, error } = useQuery({
    queryKey: ['price-range', categoryId, subcategoryId],
    queryFn: async () => {
      console.log('[PriceRangeDisplay] Caricamento range prezzi per:', { categoryId, subcategoryId });
      
      const response = await api.pricing.getEstimate(categoryId, subcategoryId);
      return response.data;
    },
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000, // 5 minuti
    retry: 1
  });

  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse bg-gray-100 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
            <div className="h-8 bg-gray-300 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    console.error('[PriceRangeDisplay] Errore caricamento:', error);
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium">Range prezzi non disponibile</p>
            <p>Si è verificato un errore nel caricamento dei dati di prezzo.</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state - quando l'API restituisce null
  if (!priceData || !priceData.data) {
    return (
      <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start space-x-2">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Range prezzi non disponibile</p>
            <p>Non ci sono abbastanza preventivi per calcolare una stima affidabile.</p>
            <p className="text-xs mt-1 text-blue-600">
              Sono necessari almeno 5 preventivi accettati negli ultimi 6 mesi.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const range: PriceRange = priceData.data;

  // Formatta i numeri per la visualizzazione
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Data di ultimo aggiornamento
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200 ${className}`}>
      <div className="flex items-start gap-3">
        <CurrencyEuroIcon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
        
        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 text-lg">
              Stima Indicativa
            </h3>
            <div className="flex items-center text-xs text-gray-500">
              <ChartBarIcon className="h-3 w-3 mr-1" />
              {range.sampleSize} preventivi
            </div>
          </div>

          {/* Price Range */}
          <div className="flex items-baseline gap-3 mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-blue-600">
                {formatPrice(range.min)}
              </span>
              <span className="text-gray-600 text-lg">-</span>
              <span className="text-3xl font-bold text-blue-600">
                {formatPrice(range.max)}
              </span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-sm">
              <span className="text-gray-600">Prezzo medio:</span>
              <span className="font-semibold text-gray-900 ml-1">
                {formatPrice(range.average)}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Mediana:</span>
              <span className="font-semibold text-gray-900 ml-1">
                {formatPrice(range.median)}
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-1 text-xs text-gray-600 mb-3">
            <div className="flex items-center">
              <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
              Include sopralluogo gratuito
            </div>
            <div className="flex items-center">
              <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
              Garanzia 12 mesi sui lavori
            </div>
            <div className="flex items-center">
              <span className="w-1 h-1 bg-green-500 rounded-full mr-2"></span>
              Preventivo dettagliato senza impegno
            </div>
          </div>

          {/* Disclaimer */}
          <div className="border-t border-blue-200 pt-3">
            <div className="flex items-start gap-2">
              <InformationCircleIcon className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">
                  ⚠️ Prezzo indicativo basato su {range.sampleSize} interventi simili
                </p>
                <p>
                  Il preventivo finale può variare in base a complessità, materiali e condizioni specifiche del lavoro.
                </p>
                <p className="mt-1 text-blue-600">
                  Ultimo aggiornamento: {formatDate(range.lastUpdated)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceRangeDisplay;
