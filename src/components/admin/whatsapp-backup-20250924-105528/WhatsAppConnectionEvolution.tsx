/**
 * WhatsApp Connection Component - Direct Evolution API Version
 * Si connette direttamente a Evolution API senza passare dal backend locale
 * Ottimizzato per Evolution API v2.2.3
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { 
  QrCodeIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon,
  PhoneIcon,
  LinkIcon,
  RocketLaunchIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Configurazione Evolution API diretta
const EVOLUTION_CONFIG = {
  url: import.meta.env.VITE_EVOLUTION_URL || 'http://37.27.89.35:8080',
  apiKey: import.meta.env.VITE_EVOLUTION_API_KEY || 'evolution_key_luca_2025_secure_21806',
  instance: import.meta.env.VITE_EVOLUTION_INSTANCE || 'assistenza'
};

// Client API diretto per Evolution
const evolutionApi = axios.create({
  baseURL: EVOLUTION_CONFIG.url,
  headers: {
    'apikey': EVOLUTION_CONFIG.apiKey,
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

export function WhatsAppConnectionEvolution() {
  const [qrCode, setQrCode] = useState<string>('');
  const [showQR, setShowQR] = useState(false);
  
  // Recupera stato connessione direttamente da Evolution API
  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status-evolution'],
    queryFn: async () => {
      try {
        const response = await evolutionApi.get(`/instance/connectionState/${EVOLUTION_CONFIG.instance}`);
        const data = response.data;
        
        return {
          connected: data?.instance?.state === 'open',
          isConnected: data?.instance?.state === 'open',
          instance: data?.instance,
          phoneNumber: data?.instance?.profileName || data?.instance?.profilePictureUrl,
          provider: 'evolution',
          url: EVOLUTION_CONFIG.url
        };
      } catch (error: any) {
        // 404 è normale se l'istanza non esiste ancora
        if (error.response?.status === 404) {
          console.log('Instance not found (normal if not created yet)');
        } else {
          console.log('Status check error:', error.response?.status, error.message);
        }
        return {
          connected: false,
          isConnected: false,
          provider: 'evolution',
          url: EVOLUTION_CONFIG.url,
          message: error.response?.status === 404 ? 'Istanza non ancora creata' : 'Errore connessione'
        };
      }
    },
    refetchInterval: showQR ? 5000 : 30000
  });
  
  // Mutation per creare istanza e generare QR Code
  const generateQRMutation = useMutation({
    mutationFn: async () => {
      try {
        // Prima configuriamo il webhook in Evolution API
        const ngrokUrl = prompt('Inserisci l\'URL di ngrok (es: https://abc123.ngrok.io):');
        if (!ngrokUrl) {
          toast.error('URL ngrok necessario per ricevere il QR code');
          return null;
        }
        
        // Configura webhook in Evolution API
        const webhookConfig = {
          url: `${ngrokUrl}/api/whatsapp/webhook/assistenza`,
          webhook_by_events: false,
          webhook_base64: true,
          events: [
            "QRCODE_UPDATED",
            "CONNECTION_UPDATE",
            "MESSAGES_UPSERT"
          ]
        };
        
        console.log('Setting up webhook:', webhookConfig);
        
        // Configura il webhook
        await evolutionApi.put(`/webhook/set/${EVOLUTION_CONFIG.instance}`, webhookConfig);
        
        toast.success('Webhook configurato! Generazione QR...');
        
        // Ora crea o riconnetti l'istanza
        const createResponse = await evolutionApi.post('/instance/create', {
          instanceName: EVOLUTION_CONFIG.instance,
          token: EVOLUTION_CONFIG.apiKey,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        });
        
        console.log('Create response:', createResponse.data);
        
        // Aspetta che il webhook riceva il QR
        toast.info('Attendo QR code dal webhook...');
        
        // Dopo 2 secondi, chiedi al nostro backend se ha ricevuto il QR
        setTimeout(async () => {
          try {
            const qrResponse = await api.get(`/whatsapp/webhook/qrcode/${EVOLUTION_CONFIG.instance}`);
            console.log('QR from backend:', qrResponse.data);
            
            if (qrResponse.data?.data?.qrcode) {
              const qrData = qrResponse.data.data.qrcode;
              if (qrData.startsWith('data:image')) {
                setQrCode(qrData);
              } else {
                setQrCode(`data:image/png;base64,${qrData}`);
              }
              setShowQR(true);
              toast.success('QR Code ricevuto!');
            } else {
              toast.error('QR code non ancora disponibile, riprova');
            }
          } catch (error) {
            console.error('Error getting QR from backend:', error);
            toast.error('Errore recupero QR dal backend');
          }
        }, 3000);
        
        return createResponse.data;
        
      } catch (error: any) {
        // Prima prova a creare l'istanza
        const createResponse = await evolutionApi.post('/instance/create', {
          instanceName: EVOLUTION_CONFIG.instance,
          token: EVOLUTION_CONFIG.apiKey,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        });
        
        console.log('Create response:', createResponse.data);
        
        // Se ha restituito un QR code
        if (createResponse.data?.qrcode) {
          return createResponse.data;
        }
        
        // Altrimenti prova a connettersi
        const connectResponse = await evolutionApi.get(`/instance/connect/${EVOLUTION_CONFIG.instance}`);
        return connectResponse.data;
        
      } catch (error: any) {
        // Se l'istanza esiste già (403 o 409)
        if (error.response?.status === 403 || error.response?.status === 409 ||
            error.response?.data?.response?.message?.[0]?.includes('already')) {
          
          console.log('Instance exists, trying with webhook...');
          
          // Prova con webhook
          const ngrokUrl = prompt('Istanza esistente. Inserisci URL ngrok per ricevere QR (es: https://abc123.ngrok.io):');
          if (!ngrokUrl) {
            toast.error('URL ngrok necessario');
            return null;
          }
          
          // Configura webhook
          const webhookConfig = {
            url: `${ngrokUrl}/api/whatsapp/webhook/assistenza`,
            webhook_by_events: false,
            webhook_base64: true,
            events: ["QRCODE_UPDATED", "CONNECTION_UPDATE", "MESSAGES_UPSERT"]
          };
          
          await evolutionApi.put(`/webhook/set/${EVOLUTION_CONFIG.instance}`, webhookConfig);
          
          // Prova a riconnettere
          try {
            await evolutionApi.delete(`/instance/logout/${EVOLUTION_CONFIG.instance}`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            console.log('Could not logout');
          }
          
          // Genera QR
          const connectResponse = await evolutionApi.get(`/instance/connect/${EVOLUTION_CONFIG.instance}`);
          
          // Aspetta QR dal webhook
          setTimeout(async () => {
            try {
              const qrResponse = await api.get(`/whatsapp/webhook/qrcode/${EVOLUTION_CONFIG.instance}`);
              if (qrResponse.data?.data?.qrcode) {
                const qrData = qrResponse.data.data.qrcode;
                setQrCode(qrData.startsWith('data:image') ? qrData : `data:image/png;base64,${qrData}`);
                setShowQR(true);
                toast.success('QR Code ricevuto!');
              }
            } catch (error) {
              console.error('Error getting QR:', error);
            }
          }, 3000);
          
          return connectResponse.data;
        }
        throw error;
      }
    },
    onSuccess: (response) => {
      console.log('QR Response full:', JSON.stringify(response, null, 2));
      
      // Controlla diversi formati possibili di risposta
      let qrData = null;
      
      // Formato 1: response.base64
      if (response?.base64) {
        qrData = response.base64;
      }
      // Formato 2: response.qr
      else if (response?.qr) {
        qrData = response.qr;
      }
      // Formato 3: response.qrcode (vari sotto-formati)
      else if (response?.qrcode) {
        if (typeof response.qrcode === 'string') {
          qrData = response.qrcode;
        } else if (response.qrcode.base64) {
          qrData = response.qrcode.base64;
        } else if (response.qrcode.qr) {
          qrData = response.qrcode.qr;
        }
      }
      // Formato 4: response.data (per axios wrapped responses)
      else if (response?.data) {
        if (response.data.base64) {
          qrData = response.data.base64;
        } else if (response.data.qr) {
          qrData = response.data.qr;
        } else if (response.data.qrcode) {
          qrData = response.data.qrcode;
        }
      }
      // Formato 5: response.pairingCode (codice numerico)
      else if (response?.pairingCode) {
        setQrCode(response.pairingCode);
        setShowQR(true);
        toast.success('Codice accoppiamento: ' + response.pairingCode);
        return;
      }
      // Formato 6: response.code
      else if (response?.code && typeof response.code === 'string' && response.code.length > 10) {
        qrData = response.code;
      }
      
      // Se abbiamo trovato dati QR
      if (qrData) {
        // Se è già un'immagine base64 completa
        if (qrData.startsWith('data:image')) {
          setQrCode(qrData);
        }
        // Se è solo la parte base64
        else if (qrData.match(/^[A-Za-z0-9+/]+=*$/)) {
          setQrCode(`data:image/png;base64,${qrData}`);
        }
        // Altrimenti è probabilmente un codice QR testuale
        else {
          setQrCode(qrData);
        }
        setShowQR(true);
        toast.success('QR Code pronto! Scansiona con WhatsApp');
      }
      // Se WhatsApp è già connesso
      else if (response?.alreadyConnected) {
        setShowQR(false);
        refetch(); // Aggiorna lo stato
      }
      // Se l'istanza è stata creata ma non c'è QR, proviamo a recuperarlo
      else if (response?.instance) {
        toast.success('Istanza creata! Recupero QR Code...');
        
        setTimeout(async () => {
          try {
            if (!evolutionApi) return;
            
            const connectResponse = await evolutionApi.get(`/instance/connect/${EVOLUTION_CONFIG.instance}`);
            console.log('Connect response full:', JSON.stringify(connectResponse.data, null, 2));
            
            // Ricorsivamente processa la risposta connect
            generateQRMutation.mutate();
          } catch (error: any) {
            console.error('Error getting QR after create:', error);
            
            // Se la connessione fallisce, potrebbe essere già connesso
            if (error.response?.status === 404) {
              toast.info('WhatsApp potrebbe essere già connesso. Verifica lo stato.');
              refetch();
            } else {
              toast.error('Errore recupero QR Code - Riprova');
            }
          }
        }, 2000);
      }
      // Nessun QR trovato
      else {
        console.log('No QR found in response. Full object:', response);
        toast.error('QR Code non disponibile - WhatsApp potrebbe essere già connesso');
        refetch(); // Aggiorna lo stato
      }
    },
    onError: (error: any) => {
      console.error('QR Generation error:', error);
      const errorMessage = error.response?.data?.response?.message?.[0] || 
                          error.response?.data?.message || 
                          error.response?.data?.error || 
                          'Errore generazione QR Code';
      toast.error(errorMessage);
    }
  });
  
  // Mutation per disconnettere
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await evolutionApi.delete(`/instance/logout/${EVOLUTION_CONFIG.instance}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('WhatsApp disconnesso');
      setShowQR(false);
      setQrCode('');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore disconnessione');
    }
  });
  
  const isConnected = status?.connected || status?.isConnected;
  const phoneNumber = status?.phoneNumber || status?.instance?.profileName;
  const instanceName = status?.instance?.instanceName || EVOLUTION_CONFIG.instance;
  const evolutionUrl = EVOLUTION_CONFIG.url;
  
  return (
    <div className="space-y-6">
      {/* Header con info Evolution API */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center">
              <RocketLaunchIcon className="h-8 w-8 mr-3" />
              Evolution API - WhatsApp Business
            </h2>
            <p className="mt-2 opacity-90">
              Connessione diretta al server VPS - Messaggi illimitati gratuiti
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-75">Versione</p>
            <p className="text-xl font-bold">v2.2.3</p>
          </div>
        </div>
      </div>

      {/* Alert se backend locale non configurato */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Connessione Diretta</p>
            <p>Stai usando la connessione diretta a Evolution API sul VPS.</p>
            <p className="mt-1 text-xs">Server: {evolutionUrl}</p>
          </div>
        </div>
      </div>

      {/* Stato Connessione */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Stato Connessione</h3>
        
        {/* Messaggio di stato */}
        {status?.message && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              {status.message === 'Istanza non ancora creata' 
                ? '📝 L\'istanza WhatsApp non è ancora stata creata. Clicca su "Genera QR Code" per iniziare.'
                : status.message
              }
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            ) : (
              <XCircleIcon className="h-8 w-8 text-red-500" />
            )}
            <div>
              <p className="text-sm text-gray-500">Stato</p>
              <p className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isConnected ? 'Connesso' : 'Non Connesso'}
              </p>
            </div>
          </div>
          
          {phoneNumber && (
            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Numero/Profilo</p>
                <p className="font-semibold">{phoneNumber}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-center space-x-3">
            <LinkIcon className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-500">Instance</p>
              <p className="font-semibold">{instanceName}</p>
            </div>
          </div>
        </div>
        
        {/* Azioni */}
        <div className="flex gap-3">
          {!isConnected ? (
            <button
              onClick={() => generateQRMutation.mutate()}
              disabled={generateQRMutation.isPending}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <QrCodeIcon className="h-5 w-5 mr-2" />
              {generateQRMutation.isPending ? 'Generazione...' : 'Genera QR Code'}
            </button>
          ) : (
            <button
              onClick={() => disconnectMutation.mutate()}
              disabled={disconnectMutation.isPending}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {disconnectMutation.isPending ? 'Disconnessione...' : 'Disconnetti'}
            </button>
          )}
          
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon className={`h-5 w-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna Stato
          </button>
        </div>
      </div>
      
      {/* QR Code */}
      {showQR && qrCode && !isConnected && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 text-center">
            Scansiona il QR Code con WhatsApp
          </h3>
          <div className="flex flex-col items-center">
            <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
              {typeof qrCode === 'string' && qrCode.startsWith('data:image') ? (
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
              ) : typeof qrCode === 'string' && qrCode.startsWith('data:') ? (
                <img src={qrCode} alt="QR Code WhatsApp" className="w-64 h-64" />
              ) : (
                <div className="w-64 h-64 bg-white p-4 flex items-center justify-center">
                  <p className="text-xs font-mono break-all text-center">
                    {typeof qrCode === 'string' ? qrCode : 'QR Code in generazione...'}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
              <h4 className="font-semibold text-blue-900 mb-2">
                📱 Come collegare WhatsApp:
              </h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Apri WhatsApp sul telefono</li>
                <li>2. Vai su <strong>Impostazioni → Dispositivi collegati</strong></li>
                <li>3. Tocca <strong>"Collega un dispositivo"</strong></li>
                <li>4. Scansiona questo QR code</li>
              </ol>
            </div>
            
            <div className="mt-4 flex items-center text-sm text-amber-600">
              <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
              Controllo connessione automatico ogni 5 secondi...
            </div>
          </div>
        </div>
      )}
      
      {/* Info Evolution API */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
        <div className="flex items-start">
          <InformationCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-green-900 mb-2">
              Configurazione Evolution API (Connessione Diretta)
            </h4>
            <dl className="text-sm space-y-2">
              <div className="flex">
                <dt className="text-green-700 w-32">Server VPS:</dt>
                <dd className="font-mono text-green-900">{evolutionUrl}</dd>
              </div>
              <div className="flex">
                <dt className="text-green-700 w-32">Instance:</dt>
                <dd className="font-mono text-green-900">{instanceName}</dd>
              </div>
              <div className="flex">
                <dt className="text-green-700 w-32">API Key:</dt>
                <dd className="font-mono text-green-900">•••••••{EVOLUTION_CONFIG.apiKey.slice(-6)}</dd>
              </div>
              <div className="flex">
                <dt className="text-green-700 w-32">Tipo:</dt>
                <dd className="font-semibold text-green-900">Self-Hosted (Gratuito)</dd>
              </div>
              <div className="flex">
                <dt className="text-green-700 w-32">Messaggi:</dt>
                <dd className="font-semibold text-green-900">Illimitati ✅</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Test Connection Button */}
      <div className="bg-white rounded-lg shadow p-4">
        <h4 className="font-semibold text-gray-700 mb-2">Test Connessione</h4>
        <button
          onClick={async () => {
            try {
              if (!evolutionApi) {
                toast.error('Evolution API non configurato');
                return;
              }
              const response = await evolutionApi.get('/instance/fetchInstances');
              console.log('Instances:', response.data);
              toast.success('✅ Connessione a Evolution API riuscita!');
            } catch (error) {
              console.error('Test failed:', error);
              toast.error('❌ Errore connessione a Evolution API');
            }
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Test Connessione API
        </button>
      </div>
    </div>
  );
}
