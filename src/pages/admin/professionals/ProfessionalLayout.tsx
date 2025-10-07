import React from 'react';
import { NavLink, Outlet, useParams, Navigate } from 'react-router-dom';
import { 
  AcademicCapIcon,
  CurrencyEuroIcon,
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
    queryKey: ['professional-layout', professionalId],  // Chiave diversa per evitare cache
    queryFn: async () => {
      // Prima prova con l'endpoint admin che ha più dati (solo se l'utente è admin)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPER_ADMIN') {
        try {
          const adminResponse = await apiClient.get(`/admin/users/${professionalId}`);
          if (adminResponse.data.success && adminResponse.data.data?.user) {
            const userData = adminResponse.data.data.user;
            console.log('Professional data in Layout (from admin):', userData);
            console.log('ProfessionData:', userData?.professionData);
            return userData;
          }
        } catch (adminError) {
          console.log('Admin endpoint failed, trying user endpoint');
        }
      }
      
      // Fallback all'endpoint normale
      try {
        const response = await apiClient.get(`/users/${professionalId}`);
        let userData = response.data.data || response.data;
        
        console.log('Professional data in Layout (from users):', userData);
        console.log('ProfessionData:', userData?.professionData);
        console.log('Profession string:', userData?.profession);
        
        // Se non c'è professionData ma c'è professionId, caricalo
        if (userData?.professionId && !userData?.professionData) {
          try {
            const profResponse = await apiClient.get(`/professions/${userData.professionId}`);
            if (profResponse.data.success && profResponse.data.data) {
              userData.professionData = profResponse.data.data;
              console.log('Loaded profession data:', userData.professionData);
            }
          } catch (error) {
            console.error('Error fetching profession data:', error);
          }
        }
        
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
    retry: 2,
    refetchInterval: false,
    staleTime: 0,  // Forza sempre il refresh
    gcTime: 0  // Non cachare
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
            {/* Mostra la professione dalla tabella codificata o il campo testo legacy */}
            <p className="text-sm font-medium text-blue-600 mt-1">
              {professional?.professionData?.name || professional?.profession || 'Nessuna professione'}
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
            {/* Mostra stato approvazione */}
            {professional?.approvalStatus && (
              <div className="flex justify-between text-sm mb-3">
                <span className="text-gray-600">Stato Approvazione</span>
                <span className={`font-medium ${
                  professional.approvalStatus === 'APPROVED' ? 'text-green-600' : 
                  professional.approvalStatus === 'REJECTED' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {professional.approvalStatus === 'APPROVED' ? 'Approvato' :
                   professional.approvalStatus === 'REJECTED' ? 'Rifiutato' :
                   'In attesa'}
                </span>
              </div>
            )}
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
