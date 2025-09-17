import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheckIcon,
  UserPlusIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  companyRole: 'OWNER' | 'COMPANY_ADMIN' | 'EMPLOYEE' | 'COLLABORATOR';
  permissions?: CompanyPermission;
}

interface CompanyPermission {
  // Permessi operativi
  canViewAllRequests: boolean;
  canAssignRequests: boolean;
  canCreateQuotes: boolean;
  canEditQuotes: boolean;
  canApproveQuotes: boolean;
  // Permessi gestionali
  canManageTeam: boolean;
  canGenerateCodes: boolean;
  canViewReports: boolean;
  canManageServices: boolean;
  canManagePricing: boolean;
  canApproveRequests: boolean;
  canManageDocuments: boolean;
  canViewFinancials: boolean;
  // Permessi comunicazione
  canMessageAllClients: boolean;
  canManageReviews: boolean;
}

export default function CompanyAdminManagement() {
  const queryClient = useQueryClient();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<CompanyPermission>({
    // Permessi operativi
    canViewAllRequests: false,
    canAssignRequests: false,
    canCreateQuotes: false,
    canEditQuotes: false,
    canApproveQuotes: false,
    // Permessi gestionali
    canManageTeam: false,
    canGenerateCodes: false,
    canViewReports: false,
    canManageServices: false,
    canManagePricing: false,
    canApproveRequests: false,
    canManageDocuments: false,
    canViewFinancials: false,
    // Permessi comunicazione
    canMessageAllClients: false,
    canManageReviews: false,
  });

  // Carica team con permessi
  const { data: team, isLoading } = useQuery({
    queryKey: ['company-team-permissions'],
    queryFn: () => api.get('/company/team-with-permissions'),
  });

  // Promuovi a admin
  const promoteToAdminMutation = useMutation({
    mutationFn: (data: { userId: string; permissions: CompanyPermission }) =>
      api.post('/company/promote-to-admin', data),
    onSuccess: () => {
      toast.success('Utente promosso ad Admin Aziendale');
      queryClient.invalidateQueries({ queryKey: ['company-team-permissions'] });
      setEditingUserId(null);
    }
  });

  // Aggiorna permessi
  const updatePermissionsMutation = useMutation({
    mutationFn: (data: { userId: string; permissions: CompanyPermission }) =>
      api.put('/company/update-permissions', data),
    onSuccess: () => {
      toast.success('Permessi aggiornati');
      queryClient.invalidateQueries({ queryKey: ['company-team-permissions'] });
      setEditingUserId(null);
    }
  });

  // Rimuovi admin
  const demoteFromAdminMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post('/company/demote-from-admin', { userId }),
    onSuccess: () => {
      toast.success('Ruolo admin rimosso');
      queryClient.invalidateQueries({ queryKey: ['company-team-permissions'] });
    }
  });

  const handleEditPermissions = (member: TeamMember) => {
    setEditingUserId(member.id);
    setSelectedPermissions(member.permissions || {
      canManageTeam: false,
      canGenerateCodes: false,
      canViewReports: false,
      canManageServices: false,
      canManagePricing: false,
      canApproveRequests: false,
      canManageDocuments: false,
      canViewFinancials: false,
    });
  };

  const handleSavePermissions = (userId: string, isNewAdmin: boolean) => {
    if (isNewAdmin) {
      promoteToAdminMutation.mutate({ userId, permissions: selectedPermissions });
    } else {
      updatePermissionsMutation.mutate({ userId, permissions: selectedPermissions });
    }
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      OWNER: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Titolare' },
      COMPANY_ADMIN: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Admin' },
      EMPLOYEE: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Dipendente' },
      COLLABORATOR: { bg: 'bg-green-100', text: 'text-green-700', label: 'Collaboratore' }
    };
    return badges[role as keyof typeof badges];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <ShieldCheckIcon className="h-7 w-7 mr-3 text-orange-600" />
                Gestione Admin Aziendali
              </h1>
              <p className="text-gray-600 mt-1">
                Assegna ruoli amministrativi e gestisci i permessi del team
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-400">
          <div className="flex">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Ruoli Aziendali:</p>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Titolare</strong>: Controllo completo sull'azienda</li>
                <li>• <strong>Admin Aziendale</strong>: Gestione team e operazioni (permessi personalizzabili)</li>
                <li>• <strong>Dipendente</strong>: Esegue lavori assegnati</li>
                <li>• <strong>Collaboratore</strong>: Lavoratore esterno/temporaneo</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Team List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Membri del Team</h2>
        </div>
        
        <div className="divide-y">
          {team?.members?.map((member: TeamMember) => (
            <div key={member.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-600 font-medium">
                      {member.firstName[0]}{member.lastName[0]}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{member.firstName} {member.lastName}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        getRoleBadge(member.companyRole).bg
                      } ${getRoleBadge(member.companyRole).text}`}>
                        {getRoleBadge(member.companyRole).label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{member.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {member.companyRole === 'EMPLOYEE' && (
                    <button
                      onClick={() => handleEditPermissions(member)}
                      className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                    >
                      <UserPlusIcon className="h-4 w-4 inline mr-1" />
                      Promuovi ad Admin
                    </button>
                  )}
                  
                  {member.companyRole === 'COMPANY_ADMIN' && (
                    <>
                      <button
                        onClick={() => handleEditPermissions(member)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        <PencilIcon className="h-4 w-4 inline mr-1" />
                        Modifica Permessi
                      </button>
                      <button
                        onClick={() => demoteFromAdminMutation.mutate(member.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        <XMarkIcon className="h-4 w-4 inline mr-1" />
                        Rimuovi Admin
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Permessi attuali per admin */}
              {member.companyRole === 'COMPANY_ADMIN' && member.permissions && (
                <div className="mt-3 pl-14">
                  <p className="text-sm font-medium text-gray-700 mb-2">Permessi attuali:</p>
                  <div className="space-y-2">
                    {/* Permessi Operativi */}
                    {(member.permissions.canViewAllRequests || 
                      member.permissions.canAssignRequests ||
                      member.permissions.canCreateQuotes ||
                      member.permissions.canEditQuotes ||
                      member.permissions.canApproveQuotes ||
                      member.permissions.canApproveRequests) && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">🔧 Operativi: </span>
                        {member.permissions.canViewAllRequests && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded ml-1">
                            Vede Tutto
                          </span>
                        )}
                        {member.permissions.canAssignRequests && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded ml-1">
                            Assegna
                          </span>
                        )}
                        {member.permissions.canCreateQuotes && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded ml-1">
                            Preventivi
                          </span>
                        )}
                        {member.permissions.canEditQuotes && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded ml-1">
                            Modifica Prev.
                          </span>
                        )}
                        {member.permissions.canApproveQuotes && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded ml-1">
                            Approva Prev.
                          </span>
                        )}
                        {member.permissions.canApproveRequests && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded ml-1">
                            Accetta/Rifiuta
                          </span>
                        )}
                      </div>
                    )}

                    {/* Permessi Gestionali */}
                    {(member.permissions.canManageTeam || 
                      member.permissions.canGenerateCodes ||
                      member.permissions.canViewReports ||
                      member.permissions.canManageServices ||
                      member.permissions.canManagePricing ||
                      member.permissions.canManageDocuments ||
                      member.permissions.canViewFinancials) && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">📊 Gestionali: </span>
                        {member.permissions.canManageTeam && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded ml-1">
                            Team
                          </span>
                        )}
                        {member.permissions.canGenerateCodes && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded ml-1">
                            Codici
                          </span>
                        )}
                        {member.permissions.canViewReports && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded ml-1">
                            Report
                          </span>
                        )}
                        {member.permissions.canManageServices && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded ml-1">
                            Servizi
                          </span>
                        )}
                        {member.permissions.canManagePricing && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded ml-1">
                            Prezzi
                          </span>
                        )}
                        {member.permissions.canManageDocuments && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded ml-1">
                            Documenti
                          </span>
                        )}
                        {member.permissions.canViewFinancials && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded ml-1">
                            Finanza
                          </span>
                        )}
                      </div>
                    )}

                    {/* Permessi Comunicazione */}
                    {(member.permissions.canMessageAllClients || 
                      member.permissions.canManageReviews) && (
                      <div>
                        <span className="text-xs font-medium text-gray-600">💬 Comunicazione: </span>
                        {member.permissions.canMessageAllClients && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded ml-1">
                            Messaggi Clienti
                          </span>
                        )}
                        {member.permissions.canManageReviews && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded ml-1">
                            Recensioni
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form modifica permessi */}
              {editingUserId === member.id && (
                <div className="mt-4 pl-14 pr-4 py-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium mb-3">Configura Permessi Admin</h3>
                  
                  {/* Permessi Operativi */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      🔧 Permessi Operativi
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canViewAllRequests}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canViewAllRequests: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Visualizza Tutte le Richieste</strong>
                          <p className="text-xs text-gray-500">Vedere richieste assegnate ad altri dipendenti</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canAssignRequests}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canAssignRequests: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Assegna Richieste</strong>
                          <p className="text-xs text-gray-500">Distribuire lavori ai dipendenti</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canCreateQuotes}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canCreateQuotes: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Crea Preventivi</strong>
                          <p className="text-xs text-gray-500">Fare preventivi per conto dell'azienda</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canEditQuotes}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canEditQuotes: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Modifica Preventivi</strong>
                          <p className="text-xs text-gray-500">Modificare preventivi di altri</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canApproveQuotes}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canApproveQuotes: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Approva Preventivi</strong>
                          <p className="text-xs text-gray-500">Validare preventivi prima dell'invio</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canApproveRequests}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canApproveRequests: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Accetta/Rifiuta Richieste</strong>
                          <p className="text-xs text-gray-500">Decidere quali lavori prendere</p>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Permessi Gestionali */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      📊 Permessi Gestionali
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canManageTeam}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canManageTeam: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Gestione Team</strong>
                          <p className="text-xs text-gray-500">Aggiungere/rimuovere dipendenti</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canGenerateCodes}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canGenerateCodes: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Genera Codici Invito</strong>
                          <p className="text-xs text-gray-500">Creare codici per nuovi dipendenti</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canViewReports}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canViewReports: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Visualizza Report</strong>
                          <p className="text-xs text-gray-500">Accesso ai report aziendali</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canManageServices}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canManageServices: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Gestione Servizi</strong>
                          <p className="text-xs text-gray-500">Modificare servizi offerti</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canManagePricing}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canManagePricing: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Gestione Prezzi</strong>
                          <p className="text-xs text-gray-500">Modificare listini prezzi</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canManageDocuments}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canManageDocuments: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Gestione Documenti</strong>
                          <p className="text-xs text-gray-500">Caricare/modificare documenti aziendali</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canViewFinancials}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canViewFinancials: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Dati Finanziari</strong>
                          <p className="text-xs text-gray-500">Vedere fatturato e costi</p>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Permessi Comunicazione */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      💬 Permessi Comunicazione
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canMessageAllClients}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canMessageAllClients: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Messaggia Tutti i Clienti</strong>
                          <p className="text-xs text-gray-500">Comunicare con tutti i clienti aziendali</p>
                        </span>
                      </label>

                      <label className="flex items-start">
                        <input
                          type="checkbox"
                          checked={selectedPermissions.canManageReviews}
                          onChange={(e) => setSelectedPermissions({
                            ...selectedPermissions,
                            canManageReviews: e.target.checked
                          })}
                          className="mr-2 mt-1"
                        />
                        <span className="text-sm">
                          <strong>Gestione Recensioni</strong>
                          <p className="text-xs text-gray-500">Rispondere alle recensioni dei clienti</p>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Presets */}
                  <div className="mb-4 p-3 bg-blue-50 rounded">
                    <p className="text-sm font-medium mb-2">Preset Rapidi:</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPermissions({
                          canViewAllRequests: true,
                          canAssignRequests: true,
                          canCreateQuotes: true,
                          canEditQuotes: true,
                          canApproveQuotes: true,
                          canManageTeam: true,
                          canGenerateCodes: true,
                          canViewReports: true,
                          canManageServices: true,
                          canManagePricing: true,
                          canApproveRequests: true,
                          canManageDocuments: true,
                          canViewFinancials: true,
                          canMessageAllClients: true,
                          canManageReviews: true,
                        })}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                      >
                        Tutti i Permessi
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPermissions({
                          canViewAllRequests: true,
                          canAssignRequests: true,
                          canCreateQuotes: true,
                          canEditQuotes: false,
                          canApproveQuotes: false,
                          canManageTeam: false,
                          canGenerateCodes: false,
                          canViewReports: true,
                          canManageServices: false,
                          canManagePricing: false,
                          canApproveRequests: true,
                          canManageDocuments: false,
                          canViewFinancials: false,
                          canMessageAllClients: true,
                          canManageReviews: false,
                        })}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Responsabile Operativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPermissions({
                          canViewAllRequests: false,
                          canAssignRequests: false,
                          canCreateQuotes: false,
                          canEditQuotes: false,
                          canApproveQuotes: false,
                          canManageTeam: true,
                          canGenerateCodes: true,
                          canViewReports: false,
                          canManageServices: false,
                          canManagePricing: false,
                          canApproveRequests: false,
                          canManageDocuments: true,
                          canViewFinancials: false,
                          canMessageAllClients: false,
                          canManageReviews: false,
                        })}
                        className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                      >
                        Responsabile HR
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setEditingUserId(null)}
                      className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => handleSavePermissions(
                        member.id, 
                        member.companyRole === 'EMPLOYEE'
                      )}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      <CheckIcon className="h-4 w-4 inline mr-1" />
                      Salva Permessi
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Riepilogo Admin */}
      <div className="mt-6 bg-orange-50 rounded-lg p-6">
        <h3 className="font-semibold mb-3 flex items-center">
          <ShieldCheckIcon className="h-5 w-5 mr-2 text-orange-600" />
          Riepilogo Admin Aziendali
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Admin Totali</p>
            <p className="text-2xl font-bold text-orange-600">
              {team?.members?.filter((m: TeamMember) => m.companyRole === 'COMPANY_ADMIN').length || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Con Permessi Completi</p>
            <p className="text-2xl font-bold text-green-600">
              {team?.members?.filter((m: TeamMember) => 
                m.companyRole === 'COMPANY_ADMIN' && 
                m.permissions && 
                Object.values(m.permissions).every(p => p === true)
              ).length || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dipendenti Promuovibili</p>
            <p className="text-2xl font-bold text-blue-600">
              {team?.members?.filter((m: TeamMember) => m.companyRole === 'EMPLOYEE').length || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
