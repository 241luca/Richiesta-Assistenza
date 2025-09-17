import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeftIcon, 
  DocumentArrowDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  CalendarIcon,
  CurrencyEuroIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: quoteData, isLoading, refetch } = useQuery({
    queryKey: ['quote', id],
    queryFn: async () => {
      const response = await api.get(`/quotes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // ✅ CORREZIONE: Estrai i dati dal ResponseFormatter
  const quote = quoteData?.success ? quoteData.data : quoteData; // Compatibilità con entrambi i formati
  console.log("QuoteDetailPage - Raw response:", quoteData);
  console.log("QuoteDetailPage - Parsed quote:", quote);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount / 100);
  };

  const handleAccept = async () => {
    try {
      await api.post(`/quotes/${id}/accept`);
      toast.success('Preventivo accettato con successo');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore nell\'accettare il preventivo');
    }
  };

  const handleReject = async () => {
    const reason = prompt('Motivo del rifiuto (opzionale):');
    try {
      await api.post(`/quotes/${id}/reject`, { reason });
      toast.success('Preventivo rifiutato');
      refetch();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore nel rifiutare il preventivo');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/quotes/${id}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `preventivo-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('PDF scaricato con successo');
    } catch (error: any) {
      toast.error('Errore nel download del PDF');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Preventivo non trovato</h2>
        <button
          onClick={() => navigate('/quotes')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Torna ai preventivi
        </button>
      </div>
    );
  }

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    REJECTED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/quotes')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          Torna ai preventivi
        </button>
        
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{quote.title}</h1>
            <p className="mt-2 text-gray-600">{quote.description}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[quote.status]}`}>
            {quote.status === 'DRAFT' && 'Bozza'}
            {quote.status === 'PENDING' && 'In Attesa'}
            {quote.status === 'ACCEPTED' && 'Accettato'}
            {quote.status === 'REJECTED' && 'Rifiutato'}
            {quote.status === 'EXPIRED' && 'Scaduto'}
          </span>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <UserIcon className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">
                {user?.role === 'CLIENT' ? 'Professionista' : 'Cliente'}
              </p>
              <p className="font-semibold text-gray-900">
                {user?.role === 'CLIENT' 
                  ? quote.professional?.fullName || 'N/A'
                  : quote.request?.client?.fullName || quote.AssistanceRequest?.client?.fullName || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <CalendarIcon className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Valido fino al</p>
              <p className="font-semibold text-gray-900">
                {quote.validUntil 
                  ? format(new Date(quote.validUntil), 'dd MMMM yyyy', { locale: it })
                  : 'Non specificato'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <CurrencyEuroIcon className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-500">Totale</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(quote.totalAmount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Voci del preventivo</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Descrizione</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Quantità</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Prezzo Unit.</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Totale</th>
                </tr>
              </thead>
              <tbody>
                {quote.items?.map((item: any, index: number) => (
                  <tr key={item.id || index} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-gray-900">{item.description}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatCurrency(item.unitPrice || 0)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">
                      {formatCurrency(item.totalPrice || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-right font-semibold text-gray-700">
                    Subtotale:
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">
                    {formatCurrency(quote.subtotal || quote.totalAmount || 0)}
                  </td>
                </tr>
                {(quote.taxAmount || 0) > 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 px-4 text-right text-gray-700">
                      IVA:
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900">
                      {formatCurrency(quote.taxAmount || 0)}
                    </td>
                  </tr>
                )}
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="py-3 px-4 text-right text-xl font-bold text-gray-700">
                    Totale:
                  </td>
                  <td className="py-3 px-4 text-right text-xl font-bold text-blue-600">
                    {formatCurrency(quote.totalAmount || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(quote.notes || quote.termsConditions) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {quote.notes && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Note</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
          
          {quote.termsConditions && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Termini e Condizioni</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{quote.termsConditions}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <DocumentArrowDownIcon className="h-5 w-5" />
          Scarica PDF
        </button>
        
        {user?.role === 'PROFESSIONAL' && quote.status === 'DRAFT' && (
          <button
            onClick={() => navigate(`/quotes/${id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PencilIcon className="h-5 w-5" />
            Modifica
          </button>
        )}
        
        {user?.role === 'CLIENT' && quote.status === 'PENDING' && (
          <>
            <button
              onClick={handleReject}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircleIcon className="h-5 w-5" />
              Rifiuta
            </button>
            
            <button
              onClick={handleAccept}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Accetta Preventivo
            </button>
          </>
        )}
      </div>
    </div>
  );
}