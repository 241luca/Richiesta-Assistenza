import React, { useState } from 'react';
import { WhatsAppConnection } from '@/components/admin/whatsapp/WhatsAppConnection';
import { WhatsAppSendMessage } from '@/components/admin/whatsapp/WhatsAppSendMessage';
import { WhatsAppMessages } from '@/components/admin/whatsapp/WhatsAppMessages';
import { WhatsAppPollingControl } from '@/components/admin/whatsapp/WhatsAppPollingControl';
import { 
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  InboxIcon,
  PaperAirplaneIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

export function WhatsAppAdminPage() {
  const [activeTab, setActiveTab] = useState<'connection' | 'send' | 'messages' | 'polling'>('connection');
  
  const tabs = [
    { id: 'connection', label: 'Connessione', icon: Cog6ToothIcon },
    { id: 'polling', label: 'Ricezione', icon: ArrowPathIcon },
    { id: 'send', label: 'Invia', icon: PaperAirplaneIcon },
    { id: 'messages', label: 'Messaggi', icon: InboxIcon }
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center">
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gestione WhatsApp Business
              </h1>
              <p className="text-gray-600 mt-1">
                Sistema completo per gestire la comunicazione WhatsApp
              </p>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className={`
                      mr-3 h-5 w-5
                      ${activeTab === tab.id ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'}
                    `} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
        
        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'connection' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Configurazione e Connessione</h2>
              <WhatsAppConnection />
            </div>
          )}
          
          {activeTab === 'polling' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sistema di Ricezione Messaggi</h2>
              <WhatsAppPollingControl />
              
              {/* Info aggiuntive */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Come Funziona</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Il sistema controlla automaticamente i nuovi messaggi</li>
                    <li>• Nessun webhook esterno necessario</li>
                    <li>• I dati restano sempre nel tuo server</li>
                    <li>• Puoi configurare la frequenza di controllo</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900 mb-2">Vantaggi</h3>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ 100% sicuro e privato</li>
                    <li>✓ Nessuna esposizione dati</li>
                    <li>✓ Controllo completo</li>
                    <li>✓ Funziona senza configurazioni complesse</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'send' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Invia Messaggio</h2>
              <WhatsAppSendMessage />
            </div>
          )}
          
          {activeTab === 'messages' && (
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Cronologia Messaggi</h2>
              <WhatsAppMessages />
            </div>
          )}
        </div>
        
        {/* Footer Stats */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Statistiche Sistema</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">--</p>
              <p className="text-sm text-gray-600">Messaggi Oggi</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">--</p>
              <p className="text-sm text-gray-600">Inviati</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">--</p>
              <p className="text-sm text-gray-600">Ricevuti</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">--</p>
              <p className="text-sm text-gray-600">Contatti</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
