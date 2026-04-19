import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  CreditCardIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  FunnelIcon,
  CalendarIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  ReceiptPercentIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';

interface Payment {
  id: string;
  amount: number;
  totalAmount: number;
  currency: string;
  status: string;
  type: string;
  paymentMethod?: string;
  description?: string;
  paidAt?: string;
  createdAt: string;
  professional?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    ragioneSociale?: string;  // Campo opzionale per la ragione sociale
  };
  request?: {
    id: string;
    title: string;
    description?: string;
    subcategory?: {
      name: string;
    };
  };
  quote?: {
    id: string;
    amount?: number;  // Importo del preventivo
    description?: string;  // Descrizione del preventivo
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    createdAt: string;  // Data creazione invece di issuedAt
    pdfUrl?: string;    // URL del PDF se disponibile
  };
  receipt?: {
    id: string;
    receiptNumber: string;
    url?: string;
  };
}

export default function ClientPaymentsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  // Carica i pagamenti del cliente
  const { data: paymentsData, isLoading, refetch } = useQuery({
    queryKey: ['my-payments', searchTerm, filterStatus, filterType, dateRange],
    queryFn: async () => {
      const params: any = {};
      
      if (searchTerm) params.search = searchTerm;
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      if (dateRange.start) params.from = dateRange.start;
      if (dateRange.end) params.to = dateRange.end;
      
      const response = await api.get('/payments/my-payments', { params });
      return response.data.data;
    }
  });

  const payments = paymentsData?.payments || [];
  const stats = paymentsData?.stats || {
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Completato
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            In Attesa
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Non Riuscito
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            <BanknotesIcon className="w-4 h-4 mr-1" />
            Rimborsato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      'DEPOSIT': 'Acconto',
      'FINAL_PAYMENT': 'Saldo Finale',
      'FULL_PAYMENT': 'Pagamento Completo',
      'PARTIAL': 'Pagamento Parziale',
      'SUBSCRIPTION': 'Abbonamento',
      'BOOKING': 'Prenotazione',
      'ACCESSORY': 'Accessorio'
    };
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {typeLabels[type] || type}
      </span>
    );
  };

  const handleDownloadInvoice = async (paymentId: string, invoiceId?: string) => {
    try {
      if (invoiceId) {
        // Se c'è già una fattura, scaricala
        window.open(`/invoices/${invoiceId}/download`, '_blank');
      } else {
        // Altrimenti genera una ricevuta
        const response = await api.post(`/payments/${paymentId}/receipt`);
        if (response.data.data?.url) {
          window.open(response.data.data.url, '_blank');
        }
      }
    } catch (error) {
      console.error('Errore download documento:', error);
      alert('Errore nel download del documento');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CreditCardIcon className="h-8 w-8 mr-3 text-indigo-600" />
              I Miei Pagamenti
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Storico completo dei tuoi pagamenti e ricevute
            </p>
          </div>
        </div>
      </div>

      {/* Statistiche Riepilogo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Totale Speso</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.total)}
              </p>
            </div>
            <BanknotesIcon className="h-12 w-12 text-indigo-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagamenti Completati</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
            </div>
            <CheckCircleIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">In Attesa</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <ClockIcon className="h-12 w-12 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Documenti</p>
              <p className="text-2xl font-bold text-gray-900">
                {payments.filter((p: any) => p.invoice || p.receipt).length}
              </p>
            </div>
            <DocumentTextIcon className="h-12 w-12 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Cerca per descrizione, professionista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tutti gli Stati</option>
              <option value="COMPLETED">Completati</option>
              <option value="PENDING">In Attesa</option>
              <option value="FAILED">Non Riusciti</option>
              <option value="REFUNDED">Rimborsati</option>
            </select>
          </div>

          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Tutti i Tipi</option>
              <option value="DEPOSIT">Acconto</option>
              <option value="FINAL_PAYMENT">Saldo Finale</option>
              <option value="FULL_PAYMENT">Pagamento Completo</option>
              <option value="SUBSCRIPTION">Abbonamento</option>
            </select>
          </div>

          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('');
                setFilterType('');
                setDateRange({ start: '', end: '' });
              }}
              className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Pulisci Filtri
            </button>
          </div>
        </div>
      </div>

      {/* Tabella Pagamenti */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Professionista
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Servizio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Importo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documenti
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nessun pagamento trovato
                  </td>
                </tr>
              ) : (
                payments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(payment.paidAt || payment.createdAt), 'dd/MM/yyyy', { locale: it })}
                      <div className="text-xs text-gray-500">
                        {format(new Date(payment.paidAt || payment.createdAt), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {payment.professional?.ragioneSociale || 
                         `${payment.professional?.firstName} ${payment.professional?.lastName}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {payment.professional?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {payment.request?.title || payment.description || 'Servizio'}
                      </div>
                      {payment.request?.subcategory && (
                        <div className="text-xs text-gray-500">
                          {payment.request.subcategory.name}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTypeBadge(payment.type)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payment.amount)}
                      </div>
                      {payment.paymentMethod && (
                        <div className="text-xs text-gray-500">
                          {payment.paymentMethod}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {payment.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleDownloadInvoice(payment.id, payment.invoice?.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            title={payment.invoice ? "Scarica Fattura" : "Scarica Ricevuta"}
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                            {payment.invoice ? 'Fattura' : 'Ricevuta'}
                          </button>
                        )}
                        
                        {payment.quote?.id && (
                          <button
                            onClick={() => window.location.href = `/quotes/${payment.quote.id}`}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            title="Vedi Preventivo"
                          >
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            Preventivo
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginazione */}
        {paymentsData?.pagination && paymentsData.pagination.pages > 1 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Pagina {paymentsData.pagination.page} di {paymentsData.pagination.pages}
              </div>
              <div className="flex space-x-2">
                {Array.from({ length: paymentsData.pagination.pages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`px-3 py-1 rounded ${
                      paymentsData.pagination.page === i + 1
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <ReceiptPercentIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Informazioni sui Documenti
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Le fatture sono disponibili per i pagamenti completati</li>
                <li>Puoi scaricare una ricevuta per ogni pagamento</li>
                <li>I documenti sono in formato PDF</li>
                <li>Per assistenza contatta il supporto</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
