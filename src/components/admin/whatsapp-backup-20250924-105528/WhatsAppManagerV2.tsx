/**
 * WhatsApp Manager V2 - Supporta Evolution API
 * Componente principale per la gestione WhatsApp con EvolutionAPI
 * 
 * @author Luca Mambelli
 * @date 21 Settembre 2025
 * @version 3.0.0
 */

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ChatBubbleLeftRightIcon,
  QrCodeIcon, 
  LinkIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  UserGroupIcon,
  MegaphoneIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';
import WhatsAppConnection from './WhatsAppConnection';
import WhatsAppMessages from './WhatsAppMessages';
import WhatsAppSendMessage from './WhatsAppSendMessage';
import WhatsAppWebhookConfig from './WhatsAppWebhookConfig';

interface WhatsAppStatus {
  connected: boolean;
  configured: boolean;
  instanceName?: string;
  state?: string;
  provider?: string;
  message?: string;
  error?: string;
}

interface WhatsAppGroup {
  id: string;
  subject: string;
  participants: number;
  owner?: string;
}

const WhatsAppManagerV2: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'connection' | 'messages' | 'groups' | 'broadcast' | 'settings'>('connection');
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const queryClient = useQueryClient();

  // Query per stato connessione
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<WhatsAppStatus>({
    queryKey: ['whatsapp', 'status'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/status');
      return response.data.data;
    },
    refetchInterval: 30000 // Refresh ogni 30 secondi
  });

  // Query per provider corrente
  const { data: providerInfo } = useQuery({
    queryKey: ['whatsapp', 'provider'],
    queryFn: async () => {
      const response = await api.get('/whatsapp/provider');
      return response.data.data;
    }
  });

  // Query per gruppi (solo Evolution)
  const { data: groups, isLoading: groupsLoading } = useQuery<WhatsAppGroup[]>({
    queryKey: ['whatsapp', 'groups'],
    queryFn: async () => {
      try {
        const response = await api.get('/whatsapp/groups');
        return response.data.data || [];
      } catch (error) {
        // Se non supportato, ritorna array vuoto
        return [];
      }
    },
    enabled: providerInfo?.provider === 'evolution'
  });

  // Mutation per creare istanza
  const createInstanceMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/create-instance');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Istanza WhatsApp creata con successo');
      refetchStatus();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore creazione istanza');
    }
  });

  // Mutation per disconnettere
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/whatsapp/disconnect');
      return response.data;
    },
    onSuccess: () => {
      toast.success('WhatsApp disconnesso');
      refetchStatus();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore disconnessione');
    }
  });

  // Mutation per creare gruppo (Evolution)
  const createGroupMutation = useMutation({
    mutationFn: async (data: { subject: string; participants: string[] }) => {
      const response = await api.post('/whatsapp/create-group', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Gruppo creato con successo');
      queryClient.invalidateQueries({ queryKey: ['whatsapp', 'groups'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore creazione gruppo');
    }
  });

  // Mutation per broadcast
  const broadcastMutation = useMutation({
    mutationFn: async (data: { phoneNumbers: string[]; message: string }) => {
      const response = await api.post('/whatsapp/broadcast', data);
      return response.data;
    },
    onSuccess: (data) => {
      const result = data.data;
      toast.success(`Broadcast inviato: ${result.sent?.length || 0} successi, ${result.failed?.length || 0} errori`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore broadcast');
    }
  });

  const isEvolution = providerInfo?.provider === 'evolution';

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header con stato */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Gestione WhatsApp
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Provider: <span className="font-semibold">
                {isEvolution ? 'EvolutionAPI ✨' : providerInfo?.provider || 'Caricamento...'}
              </span>
            </p>
          </div>
          
          {/* Status Badge */}
          <div className="flex items-center space-x-4">
            {statusLoading ? (
              <div className="flex items-center text-gray-500">
                <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                Verifica stato...
              </div>
            ) : status?.connected ? (
              <div className="flex items-center text-green-600">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Connesso
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <ExclamationCircleIcon className="h-5 w-5 mr-2" />
                Non connesso
              </div>
            )}

            <button
              onClick={() => refetchStatus()}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title="Aggiorna stato"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('connection')}
            className={`py-2 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'connection'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <QrCodeIcon className="h-5 w-5 inline-block mr-2" />
            Connessione
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`py-2 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'messages'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 inline-block mr-2" />
            Messaggi
          </button>

          {isEvolution && (
            <>
              <button
                onClick={() => setActiveTab('groups')}
                className={`py-2 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'groups'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <UserGroupIcon className="h-5 w-5 inline-block mr-2" />
                Gruppi
              </button>

              <button
                onClick={() => setActiveTab('broadcast')}
                className={`py-2 px-6 text-sm font-medium border-b-2 ${
                  activeTab === 'broadcast'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MegaphoneIcon className="h-5 w-5 inline-block mr-2" />
                Broadcast
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CogIcon className="h-5 w-5 inline-block mr-2" />
            Impostazioni
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'connection' && (
          <div>
            <WhatsAppConnection />
            
            {/* Azioni aggiuntive */}
            <div className="mt-6 flex space-x-4">
              {!status?.connected && (
                <button
                  onClick={() => createInstanceMutation.mutate()}
                  disabled={createInstanceMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {createInstanceMutation.isPending ? 'Creazione...' : 'Crea Istanza'}
                </button>
              )}
              
              {status?.connected && (
                <button
                  onClick={() => {
                    if (confirm('Sei sicuro di voler disconnettere WhatsApp?')) {
                      disconnectMutation.mutate();
                    }
                  }}
                  disabled={disconnectMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {disconnectMutation.isPending ? 'Disconnessione...' : 'Disconnetti'}
                </button>
              )}

              <button
                onClick={() => setShowWebhookConfig(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <LinkIcon className="h-5 w-5 inline-block mr-2" />
                Configura Webhook
              </button>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <WhatsAppSendMessage />
            <WhatsAppMessages />
          </div>
        )}

        {activeTab === 'groups' && isEvolution && (
          <div className="space-y-6">
            {/* Crea nuovo gruppo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Crea Nuovo Gruppo</h3>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const subject = formData.get('subject') as string;
                  const participants = (formData.get('participants') as string)
                    .split(',')
                    .map(p => p.trim())
                    .filter(p => p);
                  
                  if (subject && participants.length > 0) {
                    createGroupMutation.mutate({ subject, participants });
                  }
                }}
                className="space-y-4"
              >
                <input
                  type="text"
                  name="subject"
                  placeholder="Nome del gruppo"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <textarea
                  name="participants"
                  placeholder="Numeri partecipanti (separati da virgola)"
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  required
                />
                <button
                  type="submit"
                  disabled={createGroupMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {createGroupMutation.isPending ? 'Creazione...' : 'Crea Gruppo'}
                </button>
              </form>
            </div>

            {/* Lista gruppi */}
            <div>
              <h3 className="text-lg font-medium mb-4">Gruppi Esistenti</h3>
              {groupsLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <ArrowPathIcon className="h-8 w-8 animate-spin mx-auto" />
                  Caricamento gruppi...
                </div>
              ) : groups && groups.length > 0 ? (
                <div className="grid gap-4">
                  {groups.map((group) => (
                    <div key={group.id} className="border rounded-lg p-4">
                      <h4 className="font-medium">{group.subject}</h4>
                      <p className="text-sm text-gray-600">
                        {group.participants} partecipanti
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Nessun gruppo trovato</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'broadcast' && isEvolution && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">Invia Broadcast</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const phoneNumbers = (formData.get('phoneNumbers') as string)
                  .split(',')
                  .map(p => p.trim())
                  .filter(p => p);
                const message = formData.get('message') as string;
                
                if (phoneNumbers.length > 0 && message) {
                  broadcastMutation.mutate({ phoneNumbers, message });
                }
              }}
              className="space-y-4"
            >
              <textarea
                name="phoneNumbers"
                placeholder="Numeri destinatari (separati da virgola)"
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                required
              />
              <textarea
                name="message"
                placeholder="Messaggio da inviare"
                className="w-full px-3 py-2 border rounded-lg"
                rows={4}
                required
              />
              <button
                type="submit"
                disabled={broadcastMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {broadcastMutation.isPending ? 'Invio in corso...' : 'Invia Broadcast'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Informazioni Sistema</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Provider:</dt>
                  <dd className="font-medium">{providerInfo?.provider || 'N/A'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Istanza:</dt>
                  <dd className="font-medium">{status?.instanceName || 'main'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Stato:</dt>
                  <dd className="font-medium">{status?.state || status?.message || 'N/A'}</dd>
                </div>
              </dl>
            </div>

            {isEvolution && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Funzionalità EvolutionAPI
                </h3>
                <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                  <li>✅ Gestione gruppi avanzata</li>
                  <li>✅ Broadcast multipli</li>
                  <li>✅ Verifica numeri WhatsApp</li>
                  <li>✅ Multi-istanza</li>
                  <li>✅ Webhook avanzati</li>
                  <li>✅ Nessun limite messaggi</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Webhook Config Modal */}
      {showWebhookConfig && (
        <WhatsAppWebhookConfig onClose={() => setShowWebhookConfig(false)} />
      )}
    </div>
  );
};

export default WhatsAppManagerV2;