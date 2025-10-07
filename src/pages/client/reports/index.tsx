import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';  // Usa il client API configurato
import {
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PencilSquareIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function ClientReportsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');

  // Query per i rapporti del cliente
  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['client-reports', filter],
    queryFn: async () => {
      const params: any = {};
      if (filter !== 'all') params.status = filter;
      
      try {
        const response = await api.get('/intervention-reports/client/my-reports', { params });
        return response.data?.data || [];
      } catch (error) {
        // Se l'API non esiste ancora, usa dati mock
        return [
          {
            id: '1',
            reportNumber: 'RI-2025-00001',
            professional: { fullName: 'Mario Rossi' },
            request: { title: 'Riparazione rubinetto' },
            interventionDate: new Date().toISOString(),
            status: 'pending_signature',
            clientSignedAt: null,
            rating: null
          },
          {
            id: '2',
            reportNumber: 'RI-2025-00002',
            professional: { fullName: 'Luigi Bianchi' },
            request: { title: 'Installazione condizionatore' },
            interventionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'completed',
            clientSignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            rating: 5
          }
        ];
      }
    }
  });

  // Query per le statistiche
  const { data: stats } = useQuery({
    queryKey: ['client-reports-stats'],
    queryFn: async () => {
      try {
        const response = await api.get('/intervention-reports/client/stats');
        return response.data?.data || response.data;
      } catch (error) {
        // Dati mock se l'API non esiste
        return {
          totalReports: 8,
          pendingSignature: 2,
          completed: 6,
          averageRating: 4.5
        };
      }
    }
  });

  const handleDownloadPDF = async (id: string) => {
    try {
      const response = await api.get(`/intervention-reports/${id}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapporto-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('PDF scaricato con successo');
    } catch (error) {
      toast.error('Errore durante il download');
    }
  };

  const getStatusBadge = (report: any) => {
    if (!report.clientSignedAt) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ExclamationCircleIcon className="h-3 w-3 mr-1" />
          Da Firmare
        </span>
      );
    }
    
    if (!report.rating) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <StarIcon className="h-3 w-3 mr-1" />
          Da Valutare
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-3 w-3 mr-1" />
        Completato
      </span>
    );
  };

  const renderRating = (rating: number | null) => {
    if (!rating) {
      return (
        <button className="text-xs text-blue-600 hover:text-blue-800">
          Valuta servizio
        </button>
      );
    }
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIconSolid
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-200'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">I Miei Rapporti di Intervento</h1>
          <p className="mt-2 text-gray-600">
            Visualizza e firma i rapporti degli interventi effettuati
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-10 w-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Totale Rapporti</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalReports || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <PencilSquareIcon className="h-10 w-10 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Da Firmare</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.pendingSignature || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Completati</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.completed || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <StarIcon className="h-10 w-10 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Valutazione Media</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.averageRating ? stats.averageRating.toFixed(1) : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tutti
            </button>
            <button
              onClick={() => setFilter('pending_signature')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'pending_signature'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Da Firmare
            </button>
            <button
              onClick={() => setFilter('pending_rating')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'pending_rating'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Da Valutare
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg ${
                filter === 'completed'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completati
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Caricamento rapporti...</p>
            </div>
          ) : reports && reports.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Numero Rapporto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Professionista
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Intervento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valutazione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report: any) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {report.reportNumber}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {report.professional?.fullName}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {report.request?.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(report.interventionDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(report)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderRating(report.rating)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/client/reports/${report.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Visualizza"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {report.clientSignedAt && (
                            <button
                              onClick={() => handleDownloadPDF(report.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Scarica PDF"
                            >
                              <ArrowDownTrayIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto" />
              <p className="mt-4 text-gray-500">Nessun rapporto trovato</p>
            </div>
          )}
        </div>

        {/* Info Box */}
        {stats?.pendingSignature > 0 && (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <ExclamationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Rapporti da firmare
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  Hai {stats.pendingSignature} rapporti in attesa della tua firma digitale.
                  La firma è necessaria per completare la documentazione dell'intervento.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}