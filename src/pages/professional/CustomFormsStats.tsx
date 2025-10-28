import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DocumentDuplicateIcon,
  StarIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { customFormsAPI } from '../../services/customForms.api';

interface CustomForm {
  id: string;
  name: string;
  description?: string;
  version: number;
  subcategoryId: string;
  subcategoryName: string;
  isDefault: boolean;
  isPublished: boolean;
  status: string;
  displayType: 'MODAL' | 'INLINE' | 'SIDEBAR';
  createdBy: string;
  usageCount: number;
  layout: any;
  settings: any;
  fields: any[];
  createdAt: string;
  updatedAt: string;
}

const CustomFormsStats: React.FC = () => {
  const { user } = useAuth();

  // Query per ottenere i custom forms del professionista
  const { data: customForms, isLoading, error } = useQuery({
    queryKey: ['professional-custom-forms', user?.id, 'stats'],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User ID is required');
      }
      // Usa il servizio API che funziona con filtri
      const response = await customFormsAPI.getAllCustomForms({ professionalId: user.id });
      return response.data.data;
    },
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchOnReconnect: false,
    retry: 1,
    retryDelay: 1000
  });

  // Memoized statistics
  const statistics = useMemo(() => {
    if (!customForms) return { 
      total: 0, 
      defaults: 0, 
      published: 0, 
      totalUsage: 0,
      bySubcategory: [],
      byStatus: { published: 0, draft: 0 },
      averageUsage: 0,
      mostUsed: null,
      recentlyCreated: 0
    };
    
    const bySubcategory = customForms.reduce((acc: any, form: CustomForm) => {
      const existing = acc.find((item: any) => item.subcategoryName === form.subcategoryName);
      if (existing) {
        existing.count++;
        existing.totalUsage += form.usageCount;
      } else {
        acc.push({
          subcategoryName: form.subcategoryName,
          count: 1,
          totalUsage: form.usageCount
        });
      }
      return acc;
    }, []);

    const mostUsed = customForms.reduce((max: CustomForm | null, form: CustomForm) => {
      return (!max || form.usageCount > max.usageCount) ? form : max;
    }, null);

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentlyCreated = customForms.filter((form: CustomForm) => 
      new Date(form.createdAt) > oneWeekAgo
    ).length;

    return {
      total: customForms.length,
      defaults: customForms.filter((f: CustomForm) => f.isDefault).length,
      published: customForms.filter((f: CustomForm) => f.isPublished).length,
      totalUsage: customForms.reduce((sum: number, f: CustomForm) => sum + f.usageCount, 0),
      bySubcategory: bySubcategory.sort((a: any, b: any) => b.count - a.count),
      byStatus: {
        published: customForms.filter((f: CustomForm) => f.isPublished).length,
        draft: customForms.filter((f: CustomForm) => !f.isPublished).length
      },
      averageUsage: customForms.length > 0 ? Math.round(customForms.reduce((sum: number, f: CustomForm) => sum + f.usageCount, 0) / customForms.length) : 0,
      mostUsed,
      recentlyCreated
    };
  }, [customForms]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-600">
          Errore nel caricamento delle statistiche: {error.message}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          📊 Statistiche Custom Forms
        </h1>
        <p className="text-gray-600 mt-1">
          Analisi dettagliata dei tuoi moduli personalizzati
        </p>
      </div>

      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DocumentDuplicateIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Totale Forms</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <StarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Predefiniti</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.defaults}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <EyeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pubblicati</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.published}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Utilizzi Totali</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.totalUsage}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiche aggiuntive */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Utilizzo Medio</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.averageUsage}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DocumentDuplicateIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Creati questa settimana</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.recentlyCreated}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <DocumentDuplicateIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Bozze</p>
              <p className="text-2xl font-semibold text-gray-900">{statistics.byStatus.draft}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form più utilizzato */}
      {statistics.mostUsed && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">🏆 Form Più Utilizzato</h3>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{statistics.mostUsed.name}</h4>
                <p className="text-sm text-gray-600">Sottocategoria: {statistics.mostUsed.subcategoryName}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-blue-600">{statistics.mostUsed.usageCount}</p>
                <p className="text-sm text-gray-500">utilizzi</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribuzione per sottocategoria */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">📈 Distribuzione per Sottocategoria</h3>
        {statistics.bySubcategory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Nessun dato disponibile</p>
        ) : (
          <div className="space-y-4">
            {statistics.bySubcategory.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-gray-900">{item.subcategoryName}</h4>
                  <p className="text-sm text-gray-500">{item.count} form{item.count !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{item.totalUsage}</p>
                  <p className="text-sm text-gray-500">utilizzi totali</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFormsStats;