import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiClient } from '../../../services/api';

export default function ReportsListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  });

  // Query per i rapporti - usa l'endpoint generico che filtra per professionista
  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ['professional-reports', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      // Usa l'endpoint generico /reports che filtra automaticamente per professionista
      const response = await apiClient.get(`/intervention-reports/reports?${params}`);
      return response.data.data || [];
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo rapporto?')) return;
    
    try {
      // Usa apiClient invece di fetch diretto
      await apiClient.delete(`/intervention-reports/reports/${id}`);
      toast.success('Rapporto eliminato con successo');
      refetch();
    } catch (error) {
      toast.error('Errore nell\'eliminazione del rapporto');
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      // Usa apiClient con responseType blob per il download
      const response = await apiClient.get(`/intervention-reports/reports/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Crea URL per il download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `rapporto-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF scaricato con successo');
    } catch (error) {
      toast.error('Errore nel download del PDF');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { icon: ClockIcon, text: 'Bozza', class: 'bg-gray-100 text-gray-800' },
      completed: { icon: CheckCircleIcon, text: 'Completato', class: 'bg-green-100 text-green-800' },
      signed: { icon: CheckCircleIcon, text: 'Firmato', class: 'bg-blue-100 text-blue-800' },
      sent: { icon: CheckCircleIcon, text: 'Inviato', class: 'bg-purple-100 text-purple-800' },
    };
    
    const badge = badges[status as keyof typeof badges] || badges.draft;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
        <Icon className="w-3.5 h-3.5 mr-1" />
        {badge.text}
      </span>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">I Miei Rapporti d'Intervento</h1>
        <p className="text-sm text-gray-600 mt-1">Gestisci i tuoi rapporti d'intervento</p>
      </div>

      {/* Filtri */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cerca
            </label>
            <input
              type="text"
              placeholder="Numero, cliente..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stato
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tutti</option>
              <option value="draft">Bozza</option>
              <option value="completed">Completato</option>
              <option value="signed">Firmato</option>
              <option value="sent">Inviato</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dal
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Al
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Lista Rapporti */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-gray-600">Caricamento rapporti...</p>
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Numero
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Richiesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report: any) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.reportNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.interventionDate).toLocaleDateString('it-IT')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.clientName || report.client?.fullName}</div>
                      <div className="text-sm text-gray-500">{report.clientEmail || report.client?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>{report.requestTitle || report.request?.title}</div>
                      <div className="text-xs text-gray-500">{report.requestAddress || report.request?.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(report.status || 'draft')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/professional/reports/${report.id}`)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Visualizza"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        
                        {(report.status === 'draft' || report.isDraft) && (
                          <button
                            onClick={() => navigate(`/professional/reports/${report.id}/edit`)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Modifica"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {report.pdfUrl && (
                          <button
                            onClick={() => handleDownloadPDF(report.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Scarica PDF"
                          >
                            <ArrowDownTrayIcon className="h-5 w-5" />
                          </button>
                        )}
                        
                        {(report.status === 'draft' || report.isDraft) && (
                          <button
                            onClick={() => handleDelete(report.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Elimina"
                          >
                            <TrashIcon className="h-5 w-5" />
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
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">Nessun rapporto trovato</p>
            <button
              onClick={() => navigate('/professional/reports/new')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Crea il tuo primo rapporto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
