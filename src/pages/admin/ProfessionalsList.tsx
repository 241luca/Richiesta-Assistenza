import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserGroupIcon,
  CogIcon,
  ChevronRightIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { SelfAssignToggle } from '../../components/admin/SelfAssignToggle';
import { toast } from 'react-hot-toast';
import ProfessionalApprovalModal from '../../components/admin/ProfessionalApprovalModal';

export default function ProfessionalsList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, pending, approved, rejected
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
          canSelfAssign: p.canSelfAssign,
          approvalStatus: p.approvalStatus 
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

  // Mutation per approvare un professionista
  const approveMutation = useMutation({
    mutationFn: async (professionalId: string) => {
      return await api.put(`/users/${professionalId}/approve`, {
        approvalStatus: 'APPROVED'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Professionista approvato con successo');
    },
    onError: () => {
      toast.error('Errore durante l\'approvazione');
    }
  });

  // Mutation per rifiutare un professionista
  const rejectMutation = useMutation({
    mutationFn: async ({ professionalId, reason }: { professionalId: string; reason: string }) => {
      return await api.put(`/users/${professionalId}/reject`, {
        approvalStatus: 'REJECTED',
        rejectionReason: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Professionista rifiutato');
    },
    onError: () => {
      toast.error('Errore durante il rifiuto');
    }
  });

  // Conta i professionisti per stato
  const counts = {
    all: professionals?.length || 0,
    pending: professionals?.filter((p: any) => p.approvalStatus === 'PENDING').length || 0,
    approved: professionals?.filter((p: any) => p.approvalStatus === 'APPROVED').length || 0,
    rejected: professionals?.filter((p: any) => p.approvalStatus === 'REJECTED').length || 0
  };

  const filteredProfessionals = professionals?.filter((prof: any) => {
    // Filtro per stato approvazione
    if (filterStatus !== 'all' && prof.approvalStatus?.toLowerCase() !== filterStatus) {
      return false;
    }

    // Filtro per ricerca
    const search = searchTerm.toLowerCase();
    return (
      prof.firstName?.toLowerCase().includes(search) ||
      prof.lastName?.toLowerCase().includes(search) ||
      prof.email?.toLowerCase().includes(search) ||
      prof.profession?.toLowerCase().includes(search) ||
      prof.professionData?.name?.toLowerCase().includes(search)
    );
  });

  // Componente per il badge dello stato di approvazione
  const ApprovalBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1" />
            Approvato
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1" />
            Rifiutato
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex items-center">
            <ClockIcon className="h-4 w-4 mr-1" />
            In attesa
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header con notifica professionisti in attesa */}
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
          
          <div className="flex items-center space-x-4">
            {counts.pending > 0 && (
              <>
                <div className="flex items-center px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800 font-medium">
                    {counts.pending} in attesa di approvazione
                  </span>
                </div>
                <button
                  onClick={async () => {
                    if (confirm(`Vuoi approvare tutti i ${counts.pending} professionisti in attesa?`)) {
                      const pendingProfs = professionals?.filter((p: any) => 
                        p.approvalStatus === 'PENDING' || !p.approvalStatus
                      );
                      
                      let approved = 0;
                      for (const prof of pendingProfs || []) {
                        try {
                          await api.put(`/users/${prof.id}/approve`, {
                            approvalStatus: 'APPROVED'
                          });
                          approved++;
                        } catch (error) {
                          console.error(`Errore approvazione ${prof.email}:`, error);
                        }
                      }
                      
                      queryClient.invalidateQueries({ queryKey: ['professionals'] });
                      toast.success(`Approvati ${approved} professionisti`);
                    }
                  }}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm"
                  title="Approva tutti i professionisti in attesa"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Approva tutti
                </button>
              </>
            )}
            
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
              <PlusIcon className="h-5 w-5 mr-2" />
              Aggiungi Professionista
            </button>
          </div>
        </div>
      </div>

      {/* Filtri per stato */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tutti ({counts.all})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
              filterStatus === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
            }`}
          >
            <ClockIcon className="h-4 w-4 mr-2" />
            In attesa ({counts.pending})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'approved'
                ? 'bg-green-600 text-white'
                : 'bg-green-50 text-green-800 hover:bg-green-100'
            }`}
          >
            Approvati ({counts.approved})
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'rejected'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-800 hover:bg-red-100'
            }`}
          >
            Rifiutati ({counts.rejected})
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
              className={`bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 ${
                professional.approvalStatus === 'PENDING' ? 'border-l-4 border-yellow-500' : ''
              }`}
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
                  <ApprovalBadge status={professional.approvalStatus || 'PENDING'} />
                  
                  {/* Azioni SOLO per professionisti davvero in attesa */}
                  {(professional.approvalStatus === 'PENDING' || !professional.approvalStatus) && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => approveMutation.mutate(professional.id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center"
                        title="Approva"
                      >
                        <CheckIcon className="h-4 w-4 mr-1" />
                        Approva
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Motivo del rifiuto (opzionale):');
                          rejectMutation.mutate({ 
                            professionalId: professional.id, 
                            reason: reason || 'Rifiutato da admin' 
                          });
                        }}
                        className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors flex items-center"
                        title="Rifiuta"
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Rifiuta
                      </button>
                    </div>
                  )}
                  
                  {/* Gestisci Button - sempre presente */}
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

                {/* Mostra info approvazione se disponibili */}
                {professional.approvedAt && (
                  <div className="text-sm text-gray-500 mb-2">
                    Approvato il {new Date(professional.approvedAt).toLocaleDateString('it-IT')}
                  </div>
                )}
                {professional.rejectionReason && (
                  <div className="text-sm text-red-600 mb-2">
                    Motivo rifiuto: {professional.rejectionReason}
                  </div>
                )}
                
                {/* Self Assign Toggle - solo per professionisti approvati */}
                {professional.approvalStatus === 'APPROVED' && (
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
                )}
              </div>
            </div>
          ))}
          
          {filteredProfessionals?.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                {searchTerm 
                  ? `Nessun professionista trovato per "${searchTerm}"`
                  : filterStatus !== 'all'
                    ? `Nessun professionista ${filterStatus === 'pending' ? 'in attesa' : filterStatus === 'approved' ? 'approvato' : 'rifiutato'}`
                    : 'Nessun professionista registrato'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal di Approvazione */}
      {selectedProfessional && (
        <ProfessionalApprovalModal
          professional={selectedProfessional}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProfessional(null);
            queryClient.invalidateQueries({ queryKey: ['professionals'] });
          }}
        />
      )}
    </div>
  );
}
