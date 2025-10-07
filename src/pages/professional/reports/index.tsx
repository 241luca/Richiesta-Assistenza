import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  PlusCircleIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ChatBubbleLeftRightIcon,
  CubeIcon,
  FolderIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiClient } from '../../../services/api';

export default function ProfessionalReportsPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalReports: 0,
    draftReports: 0,
    completedReports: 0,
    todayReports: 0,
    pendingSignatures: 0,
    requestsWithoutReport: 0
  });

  // Query per le statistiche
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['professional-reports-stats'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/intervention-reports/professional/stats');
        return response.data?.data || response.data;
      } catch (error) {
        console.warn('Stats API not available, using mock data');
        // Ritorna dati mock se l'API non esiste ancora
        return {
          totalReports: 0,
          draftReports: 0,
          completedReports: 0,
          todayReports: 0,
          pendingSignatures: 0,
          requestsWithoutReport: 0
        };
      }
    },
    onSuccess: (data) => {
      setStats(data);
    },
    onError: () => {
      // Se fallisce, usa dati di default
      setStats({
        totalReports: 0,
        draftReports: 0,
        completedReports: 0,
        todayReports: 0,
        pendingSignatures: 0,
        requestsWithoutReport: 0
      });
    }
  });

  // Query per richieste assegnate (tutte, per poter creare rapporti anche per quelle in corso)
  const { data: myRequests, isLoading: requestsLoading } = useQuery({
    queryKey: ['my-assigned-requests'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/professionals/my-requests', {
          params: { assignedToMe: true }
        });
        return response.data?.data || [];
      } catch (error) {
        console.warn('My requests API not available, using empty array');
        // Ritorna array vuoto se l'API non esiste ancora
        return [];
      }
    }
  });

  const menuItems = [
    {
      title: 'Nuovo Rapporto',
      description: 'Crea un nuovo rapporto di intervento',
      icon: PlusCircleIcon,
      color: 'bg-green-500',
      href: '/professional/reports/new',
      badge: null
    },
    {
      title: 'I Miei Rapporti',
      description: 'Visualizza e gestisci tutti i tuoi rapporti',
      icon: DocumentTextIcon,
      color: 'bg-blue-500',
      href: '/professional/reports/list',
      badge: stats.totalReports > 0 ? stats.totalReports : null
    },
    {
      title: 'Frasi Ricorrenti',
      description: 'Gestisci le tue frasi preimpostate',
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-purple-500',
      href: '/professional/reports/phrases',
      badge: null
    },
    {
      title: 'Materiali',
      description: 'Gestisci il tuo listino materiali',
      icon: CubeIcon,
      color: 'bg-orange-500',
      href: '/professional/reports/materials',
      badge: null
    },
    {
      title: 'Template',
      description: 'I tuoi modelli di rapporto personalizzati',
      icon: ClipboardDocumentListIcon,
      color: 'bg-indigo-500',
      href: '/professional/reports/templates',
      badge: null
    },
    {
      title: 'Impostazioni',
      description: 'Configura dati aziendali e preferenze',
      icon: Cog6ToothIcon,
      color: 'bg-gray-500',
      href: '/professional/reports/settings',
      badge: null
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Rapporti di Intervento
          </h1>
          <p className="mt-2 text-gray-600">
            Gestisci i tuoi rapporti di intervento digitali
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ChartBarIcon className="h-10 w-10 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Totale Rapporti</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.totalReports}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <DocumentTextIcon className="h-10 w-10 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Bozze</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.draftReports}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-10 w-10 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Da Firmare</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.pendingSignatures}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <FolderIcon className="h-10 w-10 text-green-500" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Oggi</p>
                <p className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats.todayReports}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Le mie richieste attive - possono tutte avere rapporti */}
        {myRequests && myRequests.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <ClipboardDocumentListIcon className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Le tue richieste attive
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  Puoi creare rapporti di intervento per tutte le tue richieste, anche quelle in corso.
                </p>
                <div className="mt-3 space-y-2">
                  {myRequests.slice(0, 3).map((request: any) => {
                    const statusIcon = request.status === 'COMPLETED' ? '✅' : 
                                      request.status === 'IN_PROGRESS' ? '🔄' : '👤';
                    return (
                      <div key={request.id} className="flex items-center justify-between bg-white rounded p-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {statusIcon} {request.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.client?.fullName} - Stato: {request.status}
                          </p>
                        </div>
                        <button
                          onClick={() => navigate(`/professional/reports/new?requestId=${request.id}`)}
                          className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          Crea Rapporto
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <div
              key={item.title}
              onClick={() => navigate(item.href)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-start">
                <div className={`${item.color} p-3 rounded-lg text-white group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                      {item.title}
                    </h3>
                    {item.badge && (
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {item.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Azioni Rapide</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate('/professional/reports/new')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Nuovo Rapporto
            </button>
            <button
              onClick={() => navigate('/professional/reports/list?status=draft')}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
            >
              Visualizza Bozze
            </button>
            <button
              onClick={() => navigate('/professional/reports/list?status=pending_signature')}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              Da Firmare
            </button>
            <button
              onClick={() => window.open('http://localhost:3200/api/intervention-reports/professional/export', '_blank')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Esporta Rapporti
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
