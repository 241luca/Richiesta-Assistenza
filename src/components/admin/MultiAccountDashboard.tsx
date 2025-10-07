import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { 
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  QrCodeIcon,
  ArrowPathIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface WhatsAppAccount {
  sessionName: string;
  phoneNumber: string;
  description?: string;
  department?: string;
  isConnected: boolean;
  hasQR: boolean;
}

export default function MultiAccountDashboard() {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({
    sessionName: '',
    phoneNumber: '',
    description: '',
    department: 'support'
  });

  // Ottieni stato di tutti gli account
  const { data: accounts = [], isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-accounts'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/multi-account/status');
      return response.data?.data || [];
    },
    refetchInterval: 5000
  });

  // Mutation per aggiungere account
  const addAccountMutation = useMutation({
    mutationFn: async (accountData: typeof newAccount) => {
      return api.post('/whatsapp/multi-account/add', accountData);
    },
    onSuccess: () => {
      toast.success('Account aggiunto! Scansiona il QR code');
      setShowAddAccount(false);
      setNewAccount({
        sessionName: '',
        phoneNumber: '',
        description: '',
        department: 'support'
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore aggiunta account');
    }
  });

  // Colore per stato
  const getStatusColor = (account: WhatsAppAccount) => {
    if (account.isConnected) return 'bg-green-100 text-green-800';
    if (account.hasQR) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Icona per department
  const getDepartmentIcon = (department?: string) => {
    switch (department) {
      case 'support':
        return '🛟';
      case 'technical':
        return '🔧';
      case 'sales':
        return '💼';
      case 'emergency':
        return '🚨';
      default:
        return '📱';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Multi-Account WhatsApp Manager
          </h2>
          <div className="flex space-x-2">
            <button
              onClick={() => refetch()}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              Aggiorna
            </button>
            <button
              onClick={() => setShowAddAccount(!showAddAccount)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Aggiungi Account
            </button>
          </div>
        </div>

        {/* Form aggiunta account */}
        {showAddAccount && (
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-semibold mb-4">Nuovo Account WhatsApp</h3>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Nome sessione (es: supporto-1)"
                value={newAccount.sessionName}
                onChange={(e) => setNewAccount({...newAccount, sessionName: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Numero telefono (es: +393401234567)"
                value={newAccount.phoneNumber}
                onChange={(e) => setNewAccount({...newAccount, phoneNumber: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Descrizione"
                value={newAccount.description}
                onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              />
              <select
                value={newAccount.department}
                onChange={(e) => setNewAccount({...newAccount, department: e.target.value})}
                className="px-4 py-2 border rounded-lg"
              >
                <option value="support">Supporto</option>
                <option value="technical">Tecnico</option>
                <option value="sales">Vendite</option>
                <option value="emergency">Emergenze</option>
                <option value="general">Generale</option>
              </select>
            </div>
            <div className="mt-4 flex space-x-2">
              <button
                onClick={() => addAccountMutation.mutate(newAccount)}
                disabled={!newAccount.sessionName || !newAccount.phoneNumber}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                Aggiungi Account
              </button>
              <button
                onClick={() => setShowAddAccount(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista Account */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account: WhatsAppAccount) => (
          <div
            key={account.sessionName}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedAccount(account.sessionName)}
          >
            {/* Header card */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-2">
                  {getDepartmentIcon(account.department)}
                </span>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {account.sessionName}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {account.description || 'Nessuna descrizione'}
                  </p>
                </div>
              </div>
            </div>

            {/* Numero telefono */}
            <div className="flex items-center text-gray-600 mb-3">
              <PhoneIcon className="h-4 w-4 mr-2" />
              <span className="text-sm">{account.phoneNumber}</span>
            </div>

            {/* Stato connessione */}
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(account)}`}>
                {account.isConnected ? 'Connesso' : account.hasQR ? 'QR Disponibile' : 'Disconnesso'}
              </span>
              
              {account.isConnected ? (
                <CheckCircleIcon className="h-6 w-6 text-green-500" />
              ) : account.hasQR ? (
                <QrCodeIcon className="h-6 w-6 text-yellow-500" />
              ) : (
                <XCircleIcon className="h-6 w-6 text-gray-400" />
              )}
            </div>

            {/* Department badge */}
            <div className="mt-4 pt-4 border-t">
              <span className="text-xs text-gray-500">Reparto:</span>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {account.department || 'Generale'}
              </span>
            </div>

            {/* QR Code hint */}
            {account.hasQR && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ Scansiona il QR code nella console del backend per connettere
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Messaggio se nessun account */}
      {accounts.length === 0 && !isLoading && (
        <div className="bg-gray-50 rounded-lg p-12 text-center">
          <PhoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nessun account configurato
          </h3>
          <p className="text-gray-500 mb-4">
            Aggiungi il tuo primo account WhatsApp per iniziare
          </p>
          <button
            onClick={() => setShowAddAccount(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Aggiungi Account
          </button>
        </div>
      )}
    </div>
  );
}
