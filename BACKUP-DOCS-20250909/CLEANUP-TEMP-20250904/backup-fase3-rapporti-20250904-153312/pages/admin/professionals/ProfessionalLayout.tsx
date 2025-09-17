import React from 'react';
import { NavLink, Outlet, useParams, Navigate } from 'react-router-dom';
import { 
  AcademicCapIcon,
  CurrencyEuroIcon,
  CpuChipIcon,
  SparklesIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/api';

export default function ProfessionalLayout() {
  const { professionalId } = useParams<{ professionalId: string }>();
  
  // Se non c'è ID, mostra errore
  if (!professionalId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center text-red-600 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
            <h2 className="text-xl font-bold">ID Professionista Mancante</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Non è stato specificato un ID professionista valido nell'URL.
          </p>
          <a 
            href="/admin/professionals" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Torna alla lista professionisti
          </a>
        </div>
      </div>
    );
  }
  
  const { data: professional, isLoading, error } = useQuery({
    queryKey: ['professional', professionalId],
    queryFn: async () => {
      // Prima prova con l'endpoint generico utenti che sicuramente esiste
      try {
        const response = await apiClient.get(`/users/${professionalId}`);
        const userData = response.data.data || response.data;
        
        // Verifica che sia un professionista
        if (userData && (userData.role === 'PROFESSIONAL' || userData.role === 'ADMIN' || userData.role === 'SUPER_ADMIN')) {
          return userData;
        }
        
        // Se non è un professionista, mostra comunque i dati per admin
        return userData;
      } catch (error) {
        console.error('Errore nel caricamento professionista:', error);
        throw new Error('Impossibile caricare i dati del professionista');
      }
    },
    enabled: !!professionalId,
    retry: 2
  });

  const navigation = [
    { 
      name: 'Competenze', 
      href: `/admin/professionals/${professionalId}/competenze`, 
      icon: AcademicCapIcon,
      description: 'Gestisci sottocategorie e competenze'
    },
    { 
      name: 'Tariffe', 
      href: `/admin/professionals/${professionalId}/tariffe`, 
      icon: CurrencyEuroIcon,
      description: 'Configura tariffe e costi'
    },
    { 
      name: 'AI Settings', 
      href: `/admin/professionals/${professionalId}/ai`, 
      icon: CpuChipIcon,
      description: 'Personalizza assistente AI'
    },
    { 
      name: 'Skills', 
      href: `/admin/professionals/${professionalId}/skills`, 
      icon: SparklesIcon,
      description: 'Skills e certificazioni'
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center text-red-600 mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 mr-3" />
            <h2 className="text-xl font-bold">Errore</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Impossibile caricare i dati del professionista.
          </p>
          <a 
            href="/admin/professionals" 
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Torna alla lista professionisti
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Menu Laterale */}
      <div className="w-80 bg-white shadow-lg">
        {/* Header del menu */}
        <div className="p-6 border-b">
          <a 
            href="/admin/professionals" 
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span>Torna alla lista</span>
          </a>
          
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {professional?.firstName} {professional?.lastName}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {professional?.email}
            </p>
            <p className="text-sm text-gray-600">
              {professional?.professionData?.name || professional?.profession || 'Professionista'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              ID: {professionalId}
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-start px-3 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-700'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="h-6 w-6 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </div>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Stats Footer */}
        <div className="p-6 mt-auto border-t">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Stato</span>
              <span className="font-medium text-green-600">Attivo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Verificato</span>
              <span className="font-medium">
                {professional?.isVerified ? '✓ Sì' : 'No'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Registrato</span>
              <span className="font-medium">
                {professional?.createdAt ? 
                  new Date(professional.createdAt).toLocaleDateString('it-IT') : 
                  'N/D'
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
}
