import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  DocumentTextIcon,
  Cog6ToothIcon,
  TagIcon,
  CircleStackIcon,
  BellIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  ChartBarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

export default function DocumentManagementPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>({});

  // Carica statistiche REALI dal database
  const { data: statistics } = useQuery({
    queryKey: ['document-management-stats'],
    queryFn: async () => {
      const responses = await Promise.all([
        api.get('/admin/document-types/stats'),
        api.get('/admin/document-categories/stats'),
        api.get('/admin/approval-workflows/stats'),
        api.get('/admin/document-config/stats'),
        api.get('/admin/document-permissions/stats'),
        api.get('/admin/document-notifications/stats')
      ]);

      return {
        types: responses[0].data?.data || { total: 0, active: 0 },
        categories: responses[1].data?.data || { total: 0, active: 0 },
        workflows: responses[2].data?.data || { total: 0, active: 0 },
        config: responses[3].data?.data || { settings: 0 },
        permissions: responses[4].data?.data || { configured: 0 },
        notifications: responses[5].data?.data || { total: 0, active: 0 }
      };
    },
    staleTime: 30 * 1000 // Refresh ogni 30 secondi
  });

  // Carica tipi documento dal database invece di hardcode
  const { data: documentTypes } = useQuery({
    queryKey: ['document-types-list'],
    queryFn: async () => {
      const response = await api.get('/admin/document-types');
      return response.data?.data || [];
    }
  });

  const managementSections = [
    {
      id: 'types',
      title: 'Tipi Documento',
      description: 'Configura i tipi di documento disponibili nel sistema',
      icon: TagIcon,
      color: 'blue',
      path: '/admin/document-management/types',
      stats: {
        total: statistics?.types?.total || 0,
        active: statistics?.types?.active || 0
      }
    },
    {
      id: 'categories',
      title: 'Categorie',
      description: 'Organizza i documenti in categorie gerarchiche',
      icon: CircleStackIcon,
      color: 'green',
      path: '/admin/document-management/categories',
      stats: {
        total: statistics?.categories?.total || 0,
        active: statistics?.categories?.active || 0
      }
    },
    {
      id: 'workflows',
      title: 'Workflow Approvazione',
      description: 'Definisci i flussi di approvazione per i documenti',
      icon: AdjustmentsHorizontalIcon,
      color: 'purple',
      path: '/admin/document-management/workflows',
      stats: {
        total: statistics?.workflows?.workflows?.total || 0,
        active: statistics?.workflows?.workflows?.active || 0
      }
    },
    {
      id: 'permissions',
      title: 'Permessi',
      description: 'Gestisci i permessi per ruolo e tipo documento',
      icon: ShieldCheckIcon,
      color: 'red',
      path: '/admin/document-management/permissions',
      stats: {
        configured: statistics?.permissions?.permissions?.total || 0
      }
    },
    {
      id: 'notifications',
      title: 'Template Notifiche',
      description: 'Configura i template email per eventi documenti',
      icon: BellIcon,
      color: 'yellow',
      path: '/admin/document-management/notifications',
      stats: {
        total: statistics?.notifications?.templates?.total || 0,
        active: statistics?.notifications?.templates?.active || 0
      }
    },
    {
      id: 'fields',
      title: 'Campi Personalizzati',
      description: 'Definisci campi aggiuntivi per tipo di documento',
      icon: DocumentTextIcon,
      color: 'indigo',
      path: '/admin/document-management/fields',
      stats: {
        total: statistics?.config?.fields?.total || 0
      }
    },
    {
      id: 'ui-config',
      title: 'Configurazione UI',
      description: 'Personalizza l\'interfaccia per ruolo',
      icon: PaintBrushIcon,
      color: 'pink',
      path: '/admin/document-management/ui-config',
      stats: {
        pages: statistics?.config?.uiConfigs?.total || 0
      }
    },
    {
      id: 'system-config',
      title: 'Impostazioni Sistema',
      description: 'Configurazioni globali del sistema documenti',
      icon: Cog6ToothIcon,
      color: 'gray',
      path: '/admin/document-management/system-config',
      stats: {
        settings: statistics?.config?.templates?.total || 0
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tabelle Documenti Configurabili
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Sistema completamente configurabile dal database - Nessuna modifica al codice richiesta
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => navigate('/admin/legal-documents/editor')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Editor Documenti
              </button>
              <button
                onClick={() => navigate('/admin/legal-documents/analytics')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Panoramica Sistema</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {documentTypes?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Tipi Documento</div>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <div className="text-2xl font-bold text-green-600">
                {statistics?.workflows?.total || 0}
              </div>
              <div className="text-sm text-gray-600">Workflow Attivi</div>
            </div>
            <div className="bg-purple-50 p-4 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {statistics?.permissions?.configured || 0}
              </div>
              <div className="text-sm text-gray-600">Permessi Configurati</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded">
              <div className="text-2xl font-bold text-yellow-600">
                {statistics?.notifications?.active || 0}
              </div>
              <div className="text-sm text-gray-600">Template Attivi</div>
            </div>
          </div>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {managementSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.id}
                onClick={() => navigate(section.path)}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <div className={`inline-flex p-3 rounded-lg bg-${section.color}-100 mb-4`}>
                    <Icon className={`h-6 w-6 text-${section.color}-600`} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {section.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {Object.entries(section.stats).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          {key}: <strong>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</strong>
                        </span>
                      ))}
                    </div>
                    <ChartBarIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Azioni Rapide</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/document-management/types')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <TagIcon className="h-6 w-6 text-blue-500 mb-2" />
              <div className="text-sm font-medium">Nuovo Tipo</div>
            </button>
            <button
              onClick={() => navigate('/admin/document-management/workflows')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <AdjustmentsHorizontalIcon className="h-6 w-6 text-purple-500 mb-2" />
              <div className="text-sm font-medium">Nuovo Workflow</div>
            </button>
            <button
              onClick={() => navigate('/admin/document-management/notifications')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <BellIcon className="h-6 w-6 text-yellow-500 mb-2" />
              <div className="text-sm font-medium">Nuovo Template</div>
            </button>
            <button
              onClick={() => navigate('/admin/document-management/system-config')}
              className="p-4 border rounded-lg hover:bg-gray-50 text-left"
            >
              <Cog6ToothIcon className="h-6 w-6 text-gray-500 mb-2" />
              <div className="text-sm font-medium">Configurazione</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
