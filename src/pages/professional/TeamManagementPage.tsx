import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  UserGroupIcon,
  PlusIcon,
  KeyIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  CheckCircleIcon,
  ClockIcon,
  XMarkIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export default function TeamManagementPage() {
  const queryClient = useQueryClient();
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Carica team aziendale
  const { data: team, isLoading } = useQuery({
    queryKey: ['company-team'],
    queryFn: () => api.get('/company/team'),
  });

  // Carica codici attivi
  const { data: activeCodes } = useQuery({
    queryKey: ['employee-codes'],
    queryFn: () => api.get('/company/employee-codes'),
  });

  // Genera nuovo codice
  const generateCodeMutation = useMutation({
    mutationFn: () => api.post('/company/generate-employee-code'),
    onSuccess: (data) => {
      setGeneratedCode(data.code);
      setShowCodeModal(true);
      queryClient.invalidateQueries({ queryKey: ['employee-codes'] });
    }
  });

  // Revoca codice
  const revokeCodeMutation = useMutation({
    mutationFn: (codeId: string) => api.delete(`/company/employee-codes/${codeId}`),
    onSuccess: () => {
      toast.success('Codice revocato');
      queryClient.invalidateQueries({ queryKey: ['employee-codes'] });
    }
  });

  // Rimuovi dipendente
  const removeEmployeeMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/company/team/${userId}`),
    onSuccess: () => {
      toast.success('Dipendente rimosso dal team');
      queryClient.invalidateQueries({ queryKey: ['company-team'] });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiato negli appunti!');
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <UserGroupIcon className="h-7 w-7 mr-3" />
                Gestione Team
              </h1>
              <p className="text-gray-600 mt-1">
                Gestisci i dipendenti e collaboratori della tua azienda
              </p>
            </div>
            <button
              onClick={() => generateCodeMutation.mutate()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Aggiungi Dipendente
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 py-4 grid grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Dipendenti Attivi</p>
            <p className="text-2xl font-bold">{team?.employees?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Collaboratori</p>
            <p className="text-2xl font-bold">{team?.collaborators?.length || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Codici Attivi</p>
            <p className="text-2xl font-bold">{activeCodes?.length || 0}</p>
          </div>
        </div>
      </div>

      {/* Team List */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Team Attuale</h2>
        </div>
        <div className="divide-y">
          {team?.members?.map((member: any) => (
            <div key={member.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium">
                    {member.firstName[0]}{member.lastName[0]}
                  </span>
                </div>
                <div className="ml-4">
                  <p className="font-medium">{member.firstName} {member.lastName}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  member.companyRole === 'OWNER' 
                    ? 'bg-purple-100 text-purple-700'
                    : member.companyRole === 'EMPLOYEE'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {member.companyRole === 'OWNER' ? 'Titolare' : 
                   member.companyRole === 'EMPLOYEE' ? 'Dipendente' : 'Collaboratore'}
                </span>
                {member.companyRole !== 'OWNER' && (
                  <button
                    onClick={() => removeEmployeeMutation.mutate(member.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {(!team?.members || team.members.length === 0) && (
            <div className="px-6 py-12 text-center text-gray-500">
              Nessun dipendente nel team. Genera un codice per invitarli!
            </div>
          )}
        </div>
      </div>

      {/* Active Codes */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Codici di Invito Attivi</h2>
        </div>
        <div className="divide-y">
          {activeCodes?.map((code: any) => (
            <div key={code.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <KeyIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="font-mono font-medium">{code.code}</p>
                  <p className="text-sm text-gray-600">
                    Scade il {new Date(code.expiresAt).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {code.used ? (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    Utilizzato
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                    In attesa
                  </span>
                )}
                <button
                  onClick={() => copyToClipboard(code.code)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <ClipboardDocumentIcon className="h-5 w-5" />
                </button>
                {!code.used && (
                  <button
                    onClick={() => revokeCodeMutation.mutate(code.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          ))}
          
          {(!activeCodes || activeCodes.length === 0) && (
            <div className="px-6 py-12 text-center text-gray-500">
              Nessun codice attivo. Genera un nuovo codice per invitare dipendenti.
            </div>
          )}
        </div>
      </div>

      {/* Modal Codice Generato */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center">
              <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Codice Generato!</h3>
              <p className="text-gray-600 mb-4">
                Condividi questo codice con il dipendente che vuoi aggiungere al team.
              </p>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <p className="font-mono text-2xl font-bold">{generatedCode}</p>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Il codice è valido per 24 ore
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    copyToClipboard(generatedCode);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <DocumentDuplicateIcon className="h-5 w-5 inline mr-2" />
                  Copia Codice
                </button>
                <button
                  onClick={() => {
                    setShowCodeModal(false);
                    setGeneratedCode('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
