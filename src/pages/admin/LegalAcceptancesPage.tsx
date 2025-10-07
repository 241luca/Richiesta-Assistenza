import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

export default function LegalAcceptancesPage() {
  const navigate = useNavigate();

  // Fetch acceptances data
  const { data, isLoading, error } = useQuery({
    queryKey: ['legal-acceptances-admin'],
    queryFn: async () => {
      const response = await api.get('/admin/legal-documents/acceptances?includeVersions=true');
      return response.data?.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Caricamento accettazioni...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Errore nel caricamento delle accettazioni</p>
          <button
            onClick={() => navigate('/admin/legal-documents')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Torna ai documenti
          </button>
        </div>
      </div>
    );
  }

  const { acceptances = [], stats = {} } = data || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/admin/legal-documents')}
                className="mr-4 p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Accettazioni Documenti Legali
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Monitora tutte le accettazioni dei documenti legali
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircleIcon className="h-10 w-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Totale Accettazioni</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DocumentTextIcon className="h-10 w-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Documenti Unici</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.byDocument?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <UserIcon className="h-10 w-10 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recenti (200)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recentCount || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Acceptances Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Documento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Versione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data Accettazione
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metodo
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {acceptances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    Nessuna accettazione trovata
                  </td>
                </tr>
              ) : (
                acceptances.map((acceptance: any) => (
                  <tr key={acceptance.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="h-5 w-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {acceptance.user?.fullName || 
                             `${acceptance.user?.firstName} ${acceptance.user?.lastName}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {acceptance.user?.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            {acceptance.user?.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {acceptance.document?.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {acceptance.document?.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {acceptance.version?.version || 'N/D'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {format(new Date(acceptance.acceptedAt), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {acceptance.method || 'EXPLICIT_CLICK'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
