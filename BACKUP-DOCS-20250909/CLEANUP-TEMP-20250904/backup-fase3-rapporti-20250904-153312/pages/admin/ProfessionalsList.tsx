import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  UserGroupIcon,
  CogIcon,
  ChevronRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { SelfAssignToggle } from '../../components/admin/SelfAssignToggle';

export default function ProfessionalsList() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');

  const { data: professionals, isLoading } = useQuery({
    queryKey: ['professionals'],
    queryFn: async () => {
      try {
        // Prova prima l'endpoint specifico per professionisti
        const response = await api.get('/users/professionals');
        const profs = response.data.data || [];
        console.log('Professionals data:', profs.map((p: any) => ({ 
          id: p.id, 
          name: p.firstName + ' ' + p.lastName,
          canSelfAssign: p.canSelfAssign 
        })));
        return profs;
      } catch (error) {
        // Se fallisce, prendi tutti gli utenti e filtra per ruolo
        const response = await api.get('/users');
        const allUsers = response.data.data || response.data || [];
        return allUsers.filter((u: any) => u.role === 'PROFESSIONAL');
      }
    }
  });

  const filteredProfessionals = professionals?.filter((prof: any) => {
    const search = searchTerm.toLowerCase();
    return (
      prof.firstName?.toLowerCase().includes(search) ||
      prof.lastName?.toLowerCase().includes(search) ||
      prof.email?.toLowerCase().includes(search) ||
      prof.profession?.toLowerCase().includes(search) ||
      prof.professionData?.name?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Gestione Professionisti</h1>
              <p className="text-gray-600">
                {professionals?.length || 0} professionisti registrati
              </p>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi Professionista
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca per nome, email o professione..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Lista Professionisti */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento professionisti...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProfessionals?.map((professional: any) => (
            <div
              key={professional.id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                      <span className="text-xl font-bold text-gray-600">
                        {professional.firstName?.[0]}{professional.lastName?.[0]}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {professional.firstName} {professional.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{professional.email}</p>
                      <p className="text-sm text-gray-500">
                        {professional.professionData?.name || professional.profession || 'Professionista'} • ID: {professional.id}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Status Badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    professional.isVerified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {professional.isVerified ? 'Verificato' : 'Da verificare'}
                  </span>
                  
                  {/* Gestisci Button */}
                  <button
                    onClick={() => {
                      console.log('Navigating to professional competenze:', professional.id);
                      navigate(`/admin/professionals/${professional.id}/competenze`);
                    }}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CogIcon className="h-5 w-5 mr-2" />
                    Gestisci
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
              
              {/* Additional Info */}
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="text-gray-500">Telefono:</span>
                    <p className="font-medium">{professional.phone || 'N/D'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Città:</span>
                    <p className="font-medium">{professional.city || 'N/D'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Registrato:</span>
                    <p className="font-medium">
                      {professional.createdAt 
                        ? new Date(professional.createdAt).toLocaleDateString('it-IT')
                        : 'N/D'}
                    </p>
                  </div>
                </div>
                
                {/* Self Assign Toggle - NUOVO! */}
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <SelfAssignToggle
                    professionalId={professional.id}
                    canSelfAssign={professional.canSelfAssign === true || professional.canSelfAssign === null || professional.canSelfAssign === undefined}
                    professionalName={`${professional.firstName} ${professional.lastName}`}
                  />
                  <div className="flex items-center space-x-2 text-sm">
                    {(professional.canSelfAssign === false) ? (
                      <>
                        <XCircleIcon className="h-5 w-5 text-red-500" />
                        <span className="text-red-700">Auto-assegnazione bloccata</span>
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        <span className="text-green-700">Può auto-assegnarsi</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {filteredProfessionals?.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm 
                  ? `Nessun professionista trovato per "${searchTerm}"`
                  : 'Nessun professionista registrato'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
