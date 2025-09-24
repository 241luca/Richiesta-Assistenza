import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function LegalAnalyticsPage() {
  const navigate = useNavigate();

  // Fetch analytics data
  const { data, isLoading, error } = useQuery({
    queryKey: ['legal-analytics'],
    queryFn: async () => {
      const response = await api.get('/admin/legal-documents/analytics');
      return response.data?.data;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Caricamento analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Errore nel caricamento delle analytics</p>
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

  const analytics = data || {};

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
              <ChartBarIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Analytics Documenti Legali
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Statistiche e metriche del sistema documenti legali
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Documents Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documenti</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <DocumentTextIcon className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm text-gray-500">Documenti Totali</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.documents?.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-gray-500">Documenti Attivi</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.documents?.active || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <ClockIcon className="h-8 w-8 text-gray-500 mb-2" />
              <p className="text-sm text-gray-500">Documenti Inattivi</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.documents?.inactive || 0}</p>
            </div>
          </div>
        </div>

        {/* Versions Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Versioni</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Totali</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.versions?.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Pubblicate</p>
              <p className="text-2xl font-bold text-green-600">{analytics.versions?.published || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Bozze</p>
              <p className="text-2xl font-bold text-yellow-600">{analytics.versions?.draft || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-sm text-gray-500">Approvate</p>
              <p className="text-2xl font-bold text-blue-600">{analytics.versions?.approved || 0}</p>
            </div>
          </div>
        </div>

        {/* Acceptances Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accettazioni</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <CheckCircleIcon className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-gray-500">Accettazioni Totali</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.acceptances?.total || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <ArrowTrendingUpIcon className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-sm text-gray-500">Ultimi 30 Giorni</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.acceptances?.recent30Days || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <UserGroupIcon className="h-8 w-8 text-purple-500 mb-2" />
              <p className="text-sm text-gray-500">Media per Utente</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.acceptances?.averagePerUser || 0}</p>
            </div>
          </div>
        </div>

        {/* Compliance Stats */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <ShieldCheckIcon className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-gray-500">Compliance Stimata</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.compliance?.estimatedCompliance || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Basata su campione di {analytics.users?.sampleSize || 0} utenti
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <UserGroupIcon className="h-8 w-8 text-orange-500 mb-2" />
              <p className="text-sm text-gray-500">Utenti con Documenti Pendenti</p>
              <p className="text-3xl font-bold text-gray-900">
                ~{analytics.users?.estimatedWithPending || 0}%
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Su {analytics.users?.total || 0} utenti totali
              </p>
            </div>
          </div>
        </div>

        {/* Acceptances by Document */}
        {analytics.acceptances?.byDocument && analytics.acceptances.byDocument.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Accettazioni per Documento</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Obbligatorio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Accettazioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analytics.acceptances.byDocument.map((doc: any, index: number) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {doc.documentName}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {doc.documentType}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {doc.isRequired ? (
                          <span className="text-red-600 font-medium">Sì</span>
                        ) : (
                          <span className="text-gray-400">No</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        {doc.acceptances}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
