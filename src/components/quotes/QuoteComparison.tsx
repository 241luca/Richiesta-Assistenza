import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  DocumentArrowDownIcon,
  ScaleIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { toast } from 'react-hot-toast';

interface QuoteComparisonProps {
  requestId: string;
}

interface QuoteComparisonData {
  id: string;
  professional: {
    id: string;
    fullName: string;
    profession: string;
    hourlyRate?: number;
  };
  title: string;
  totalAmount: number;
  depositAmount?: number | null;
  validUntil?: string;
  status: string;
  isSelected: boolean;
  itemCount: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
}

export const QuoteComparison: React.FC<QuoteComparisonProps> = ({ requestId }) => {
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Fetch comparison data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/quotes/request', requestId, 'compare'],
    queryFn: () => api.get(`/api/quotes/request/${requestId}/compare`)
  });

  const quotes = data?.quotes || [];
  const stats = data?.stats || {};

  // Toggle quote selection for comparison
  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev => 
      prev.includes(quoteId) 
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  // Accept a quote
  const acceptQuote = async (quoteId: string) => {
    try {
      await api.post(`/api/quotes/${quoteId}/accept`);
      toast.success('Preventivo accettato con successo!');
      // Refetch data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore nell\'accettazione del preventivo');
    }
  };

  // Reject a quote
  const rejectQuote = async (quoteId: string) => {
    try {
      const reason = prompt('Motivo del rifiuto (opzionale):');
      await api.post(`/api/quotes/${quoteId}/reject`, { reason });
      toast.success('Preventivo rifiutato');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore nel rifiuto del preventivo');
    }
  };

  // Download PDF
  const downloadPDF = async (quoteId: string) => {
    try {
      const response = await api.get(`/api/quotes/${quoteId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `preventivo-${quoteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download PDF completato');
    } catch (error) {
      toast.error('Errore nel download del PDF');
    }
  };

  // Download comparison PDF
  const downloadComparisonPDF = async () => {
    try {
      const response = await api.get(`/api/quotes/request/${requestId}/comparison-pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `confronto-preventivi-${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Download confronto PDF completato');
    } catch (error) {
      toast.error('Errore nel download del PDF di confronto');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="p-6 text-center text-red-600">
          Errore nel caricamento dei preventivi
        </div>
      </Card>
    );
  }

  if (quotes.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">
          Nessun preventivo disponibile per questa richiesta
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <ScaleIcon className="h-5 w-5 mr-2" />
            Riepilogo Confronto
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.count}</div>
              <div className="text-sm text-gray-600">Preventivi</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                €{stats.minAmount?.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Minimo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                €{stats.avgAmount?.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Media</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                €{stats.maxAmount?.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Massimo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                €{stats.priceRange?.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Differenza</div>
            </div>
          </div>
        </div>
      </Card>

      {/* View Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Vista Griglia
          </Button>
          <Button
            variant={viewMode === 'table' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Vista Tabella
          </Button>
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          icon={<DocumentArrowDownIcon className="h-4 w-4" />}
          onClick={downloadComparisonPDF}
        >
          Download Confronto PDF
        </Button>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote: QuoteComparisonData) => (
            <Card key={quote.id} className={quote.isSelected ? 'ring-2 ring-green-500' : ''}>
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold">{quote.professional.fullName}</h4>
                    <p className="text-sm text-gray-600">{quote.professional.professionData?.name || quote.professional.profession}</p>
                  </div>
                  {quote.status === 'ACCEPTED' && (
                    <Badge variant="success">Accettato</Badge>
                  )}
                  {quote.status === 'PENDING' && (
                    <Badge variant="warning">In attesa</Badge>
                  )}
                </div>

                {/* Price */}
                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    €{quote.totalAmount.toFixed(2)}
                  </div>
                  {quote.depositAmount && (
                    <div className="text-sm text-gray-600">
                      Deposito: €{quote.depositAmount.toFixed(2)}
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Articoli:</span>
                    <span className="font-medium">{quote.itemCount}</span>
                  </div>
                  {quote.validUntil && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valido fino:</span>
                      <span className="font-medium">
                        {new Date(quote.validUntil).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {quote.status === 'PENDING' && (
                    <>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<CheckCircleIcon className="h-4 w-4" />}
                        onClick={() => acceptQuote(quote.id)}
                      >
                        Accetta
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        icon={<XCircleIcon className="h-4 w-4" />}
                        onClick={() => rejectQuote(quote.id)}
                      >
                        Rifiuta
                      </Button>
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<DocumentArrowDownIcon className="h-4 w-4" />}
                    onClick={() => downloadPDF(quote.id)}
                  >
                    PDF
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Professionista
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totale
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deposito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articoli
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Validità
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quotes.map((quote: QuoteComparisonData) => (
                  <tr key={quote.id} className={quote.isSelected ? 'bg-green-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {quote.professional.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {quote.professional.professionData?.name || quote.professional.profession}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">
                        €{quote.totalAmount.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {quote.depositAmount ? `€${quote.depositAmount.toFixed(2)}` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{quote.itemCount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {quote.validUntil 
                          ? new Date(quote.validUntil).toLocaleDateString('it-IT')
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {quote.status === 'ACCEPTED' && (
                        <Badge variant="success">Accettato</Badge>
                      )}
                      {quote.status === 'PENDING' && (
                        <Badge variant="warning">In attesa</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {quote.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => acceptQuote(quote.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Accetta
                            </button>
                            <button
                              onClick={() => rejectQuote(quote.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Rifiuta
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => downloadPDF(quote.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Detailed Comparison for Selected Quotes */}
      {selectedQuotes.length >= 2 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Confronto Dettagliato ({selectedQuotes.length} preventivi selezionati)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="text-left py-2">Voce</th>
                    {selectedQuotes.map(quoteId => {
                      const quote = quotes.find((q: QuoteComparisonData) => q.id === quoteId);
                      return (
                        <th key={quoteId} className="text-left py-2 px-4">
                          {quote?.professional.fullName}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {/* Get all unique item descriptions */}
                  {Array.from(new Set(
                    quotes
                      .filter((q: QuoteComparisonData) => selectedQuotes.includes(q.id))
                      .flatMap((q: QuoteComparisonData) => q.items.map(i => i.description))
                  )).map(description => (
                    <tr key={description} className="border-t">
                      <td className="py-2 text-sm">{description}</td>
                      {selectedQuotes.map(quoteId => {
                        const quote = quotes.find((q: QuoteComparisonData) => q.id === quoteId);
                        const item = quote?.items.find(i => i.description === description);
                        return (
                          <td key={quoteId} className="py-2 px-4 text-sm">
                            {item ? `€${item.total.toFixed(2)}` : '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr className="border-t-2 font-bold">
                    <td className="py-2">Totale</td>
                    {selectedQuotes.map(quoteId => {
                      const quote = quotes.find((q: QuoteComparisonData) => q.id === quoteId);
                      return (
                        <td key={quoteId} className="py-2 px-4 text-blue-600">
                          €{quote?.totalAmount.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
