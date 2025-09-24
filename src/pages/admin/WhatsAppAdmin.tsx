import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  PhoneIcon, 
  ChatBubbleLeftRightIcon, 
  QrCodeIcon, 
  CogIcon,
  ArrowPathIcon,
  TrashIcon,
  PaperAirplaneIcon,
  UserGroupIcon,
  ClockIcon,
  WifiIcon,
  PowerIcon,
  KeyIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface InstanceInfo {
  instanceName: string;
  instanceId?: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  status?: string;
  state?: string;
  serverUrl?: string;
  apikey?: string;
  integration?: any;
}

interface ConnectionState {
  instance: {
    instanceName: string;
    state: string;
  };
}

export default function WhatsAppAdminPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [instances, setInstances] = useState<InstanceInfo[]>([]);
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [currentInstance, setCurrentInstance] = useState<string>('');
  const [apiInfo, setApiInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'manage' | 'send' | 'settings'>('status');
  
  // Form per invio messaggi
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Settings states
  const [settings, setSettings] = useState({
    rejectCall: false,
    msgCall: '',
    groupsIgnore: false,
    alwaysOnline: false,
    readMessages: false,
    readStatus: false,
    syncFullHistory: false
  });
  
  // Webhook states
  const [webhookConfig, setWebhookConfig] = useState({
    enabled: false,
    url: '',
    webhookByEvents: true,
    webhookBase64: true,
    events: [] as string[]
  });

  // Carica stato iniziale
  useEffect(() => {
    loadStatus();
    loadInstances();
    loadApiInfo();
    if (currentInstance) {
      loadSettings();
      loadWebhookConfig();
    }
  }, []);
  
  // Carica settings quando cambia istanza
  useEffect(() => {
    if (currentInstance) {
      loadSettings();
      loadWebhookConfig();
    }
  }, [currentInstance]);

  // Sincronizza currentInstance con le istanze disponibili
  useEffect(() => {
    if (instances.length > 0 && !currentInstance) {
      // Se non c'è un'istanza corrente ma ci sono istanze, usa la prima
      const firstInstance = instances[0];
      if (firstInstance.instanceName) {
        setCurrentInstance(firstInstance.instanceName);
        toast.info(`Istanza selezionata: ${firstInstance.instanceName}`);
      }
    }
  }, [instances]);

  // DISABILITATO - Causava check continui che mandavano in loop Evolution API
  // Il polling automatico verificava lo stato ogni 5 secondi
  // ma questo causava il numero 393331234567 nei log del VPS
  /*
  useEffect(() => {
    if (currentInstance) {
      const interval = setInterval(() => {
        checkConnectionState();
      }, 5000); // Ogni 5 secondi
      
      return () => clearInterval(interval);
    }
  }, [currentInstance]);
  */

  const loadApiInfo = async () => {
    try {
      const response = await api.get('/whatsapp/info');
      if (response.data?.data) {
        setApiInfo(response.data.data);
      }
    } catch (error: any) {
      console.error('Error loading API info:', error);
    }
  };

  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await api.get('/whatsapp/status');
      
      console.log('Status response:', response.data); // Debug
      
      if (response.data?.data) {
        const statusData = response.data.data;
        
        // Salva lo stato completo con tutte le info
        setStatus({
          ...statusData,
          phoneNumber: statusData.phoneNumber || statusData.instanceDetails?.owner?.replace('@s.whatsapp.net', '')
        });
        
        // Se c'è un'istanza, salvala come corrente
        if (statusData.instance) {
          setCurrentInstance(statusData.instance);
        }
        
        // Aggiorna anche lo stato di connessione basandosi su 'connected' e 'state'
        const isConnected = statusData.connected === true || statusData.state === 'open';
        
        setConnectionState({
          instance: {
            instanceName: statusData.instance || currentInstance,
            state: isConnected ? 'open' : (statusData.state || 'close')
          }
        });
      }
    } catch (error: any) {
      console.error('Error loading status:', error);
      toast.error('Errore nel caricamento dello stato');
    } finally {
      setLoading(false);
    }
  };

  const loadInstances = async () => {
    try {
      const response = await api.get('/whatsapp/instances');
      
      if (response.data?.data?.instances) {
        const instancesList = Array.isArray(response.data.data.instances) 
          ? response.data.data.instances 
          : [];
        
        // Estrai le info delle istanze (Evolution API nida i dati in .instance)
        const formattedInstances = instancesList.map((item: any) => {
          // Se l'oggetto ha una proprietà 'instance', usa quella
          const instanceData = item.instance || item;
          
          return {
            instanceName: instanceData.instanceName || instanceData.name || 'Senza nome',
            instanceId: instanceData.instanceId,
            owner: instanceData.owner,
            profileName: instanceData.profileName,
            profilePictureUrl: instanceData.profilePictureUrl,
            profileStatus: instanceData.profileStatus,
            status: instanceData.status || instanceData.state,
            state: instanceData.state || instanceData.status,
            serverUrl: instanceData.serverUrl,
            apikey: instanceData.apikey,
            token: instanceData.apikey || instanceData.token, // Token per l'istanza
            integration: instanceData.integration
          };
        });
        
        setInstances(formattedInstances);
        
        // Se c'è un'istanza corrente nel response
        if (response.data.data.currentInstance) {
          setCurrentInstance(response.data.data.currentInstance);
        }
        
        // Se c'è un'istanza connessa, prendi il numero del proprietario
        const connectedInstance = formattedInstances.find((inst: any) => 
          inst.status === 'open' || inst.state === 'open'
        );
        
        if (connectedInstance?.owner) {
          // Owner è nel formato numero@s.whatsapp.net
          const phoneNumber = connectedInstance.owner.replace('@s.whatsapp.net', '');
          setStatus(prev => ({ ...prev, phoneNumber }));
        }
      }
    } catch (error: any) {
      console.error('Error loading instances:', error);
    }
  };

  const checkConnectionState = async () => {
    if (!currentInstance) return;
    
    try {
      const response = await api.get('/whatsapp/status');
      
      if (response.data?.data) {
        // Lo stato reale viene da 'state' o dal campo 'connected'
        // Se connected è false o state non è 'open', non è connesso
        const isConnected = response.data.data.connected === true || 
                           response.data.data.state === 'open';
        
        const state = isConnected ? 'open' : 
                     response.data.data.state || 'close';
        
        setConnectionState({
          instance: {
            instanceName: currentInstance,
            state: state
          }
        });
        
        // NON generare automaticamente il QR - solo se l'utente clicca
        if (isConnected) {
          // Se è connesso, pulisci QR e pairing code
          setQrCode(null);
          setPairingCode(null);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const createInstance = async () => {
    setLoading(true);
    try {
      // Ottieni il nome dell'istanza dalla configurazione o usa default
      const instanceName = currentInstance || 'assistenza';
      
      const response = await api.post('/whatsapp/instance/create', {
        instanceName: instanceName,
        integration: 'WHATSAPP-BAILEYS',
        qrcode: true,
        alwaysOnline: true,
        readMessages: true,
        readStatus: true
      });
      
      if (response.data?.success) {
        toast.success('Istanza creata con successo!');
        
        // Se c'è un QR code nella risposta
        if (response.data.data?.qrcode) {
          setQrCode(response.data.data.qrcode);
        }
        
        // Aggiorna istanza corrente
        if (response.data.data?.instanceName) {
          setCurrentInstance(response.data.data.instanceName);
        }
        
        // Ricarica stato e istanze
        await loadStatus();
        await loadInstances();
        
        // Ottieni QR code se necessario
        if (!response.data.data?.qrcode) {
          await getQRCode();
        }
      } else {
        toast.error(response.data?.message || 'Errore nella creazione');
      }
    } catch (error: any) {
      console.error('Error creating instance:', error);
      const errorMsg = error.response?.data?.message || 'Errore nella creazione dell\'istanza';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getQRCode = async () => {
    if (!currentInstance) {
      toast.error('Nessuna istanza selezionata');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get('/whatsapp/qrcode');
      
      if (response.data?.data?.qrcode) {
        setQrCode(response.data.data.qrcode);
        toast.success('QR Code generato!');
      } else if (response.data?.data?.connected) {
        toast.info('WhatsApp già connesso');
        setQrCode(null);
      }
    } catch (error: any) {
      console.error('Error getting QR:', error);
      const errorMsg = error.response?.data?.message || 'Errore nel recupero del QR code';
      
      if (!errorMsg.includes('già connesso')) {
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const connectWithPhone = async () => {
    if (!phoneNumber) {
      toast.error('Inserisci un numero di telefono');
      return;
    }
    
    if (!currentInstance) {
      toast.error('Crea prima un\'istanza');
      return;
    }
    
    setLoading(true);
    try {
      // Formatta numero (rimuovi spazi e caratteri)
      const number = phoneNumber.replace(/\D/g, '');
      
      const response = await api.get(`/whatsapp/connect/${currentInstance}?number=${number}`);
      
      if (response.data?.pairingCode) {
        setPairingCode(response.data.pairingCode);
        toast.success(`Codice di accoppiamento: ${response.data.pairingCode}`);
      }
      
      if (response.data?.code) {
        setQrCode(response.data.code);
      }
    } catch (error: any) {
      console.error('Error connecting with phone:', error);
      toast.error('Errore nella connessione');
    } finally {
      setLoading(false);
    }
  };

  const restartInstance = async () => {
    if (!currentInstance) {
      toast.error('Nessuna istanza da riavviare');
      return;
    }
    
    // Verifica prima se l'istanza esiste davvero
    try {
      setLoading(true);
      
      // Prima controlla lo stato per vedere se esiste
      const statusCheck = await api.get('/whatsapp/status');
      if (!statusCheck.data?.data?.exists && statusCheck.data?.data?.state !== 'open') {
        toast.error('L\'istanza non esiste o non è connessa. Crea prima l\'istanza.');
        return;
      }
      
      // Procedi con il restart
      const response = await api.put(`/whatsapp/restart/${currentInstance}`);
      
      if (response.data?.success) {
        toast.success('Istanza riavviata con successo');
        
        // Ricarica stato dopo un breve delay
        setTimeout(() => {
          loadStatus();
          loadInstances();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error restarting:', error);
      
      if (error.response?.status === 404) {
        toast.error('Istanza non trovata. Verifica che l\'istanza esista su Evolution API.');
        // Ricarica la lista istanze per vedere quelle disponibili
        loadInstances();
      } else {
        const errorMsg = error.response?.data?.message || 'Errore nel riavvio dell\'istanza';
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const logoutInstance = async () => {
    if (!currentInstance) return;
    
    if (!confirm('Sei sicuro di voler disconnettere WhatsApp?')) return;
    
    setLoading(true);
    try {
      await api.delete(`/whatsapp/logout/${currentInstance}`);
      toast.success('Disconnesso da WhatsApp');
      
      setQrCode(null);
      setPairingCode(null);
      await loadStatus();
    } catch (error: any) {
      console.error('Error logout:', error);
      toast.error('Errore nella disconnessione');
    } finally {
      setLoading(false);
    }
  };

  const deleteInstance = async () => {
    if (!currentInstance) return;
    
    if (!confirm(`Sei sicuro di voler eliminare l'istanza "${currentInstance}"? Questa azione è irreversibile.`)) {
      return;
    }
    
    setLoading(true);
    try {
      await api.delete('/whatsapp/instance');
      toast.success('Istanza eliminata con successo');
      
      setCurrentInstance('');
      setQrCode(null);
      setPairingCode(null);
      await loadStatus();
      await loadInstances();
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error('Errore nell\'eliminazione dell\'istanza');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.get('/whatsapp/settings');
      if (response.data?.data) {
        setSettings({
          rejectCall: response.data.data.reject_call || false,
          msgCall: response.data.data.msg_call || '',
          groupsIgnore: response.data.data.groups_ignore || false,
          alwaysOnline: response.data.data.always_online || false,
          readMessages: response.data.data.read_messages || false,
          readStatus: response.data.data.read_status || false,
          syncFullHistory: response.data.data.sync_full_history || false
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
    }
  };
  
  const saveSettings = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/settings', settings);
      toast.success('Impostazioni salvate con successo');
      await loadSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Errore nel salvare le impostazioni');
    } finally {
      setLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if (!recipient || !message) {
      toast.error('Inserisci destinatario e messaggio');
      return;
    }
    
    setSending(true);
    try {
      const response = await api.post('/whatsapp/send', {
        recipient,
        message,
        delay: 1000  // Opzionale - millisecondi prima dell'invio
      });
      
      if (response.data?.success) {
        toast.success('Messaggio inviato con successo!');
        // Pulisci il form
        setMessage('');
        setRecipient('');
        
        // Salva il messaggio nel database se necessario
        try {
          await api.post('/whatsapp/messages/save', {
            phoneNumber: recipient,
            message: message,
            direction: 'outgoing',
            status: 'sent',
            messageId: response.data.data?.messageId,
            timestamp: new Date()
          });
        } catch (saveError) {
          console.error('Error saving message:', saveError);
        }
      } else {
        toast.error(response.data?.message || 'Errore nell\'invio');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMsg = error.response?.data?.message || 'Errore nell\'invio del messaggio';
      
      if (errorMsg.includes('not connected')) {
        toast.error('WhatsApp non connesso. Connetti prima WhatsApp dalla sezione "Gestione Istanza"');
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setSending(false);
    }
  };
  
  const loadWebhookConfig = async () => {
    try {
      const response = await api.get('/whatsapp/webhook');
      if (response.data?.data) {
        setWebhookConfig({
          enabled: response.data.data.enabled || false,
          url: response.data.data.url || '',
          webhookByEvents: response.data.data.webhookByEvents !== false,
          webhookBase64: response.data.data.webhookBase64 !== false,
          events: response.data.data.events || []
        });
      }
    } catch (error: any) {
      console.error('Error loading webhook config:', error);
    }
  };
  
  const saveWebhookConfig = async () => {
    setLoading(true);
    try {
      await api.post('/whatsapp/webhook', webhookConfig);
      toast.success('Webhook configurato con successo');
      await loadWebhookConfig();
    } catch (error: any) {
      console.error('Error saving webhook config:', error);
      toast.error('Errore nella configurazione del webhook');
    } finally {
      setLoading(false);
    }
  };

  const verifyConnectionViaNumberCheck = async () => {
    setLoading(true);
    try {
      // Verifica la connessione usando il metodo number check
      const response = await api.get('/whatsapp/verify-connection');
      
      if (response.data?.data?.connected) {
        // Siamo connessi!
        toast.success('Connessione verificata! WhatsApp è online.');
        
        // Aggiorna lo stato manualmente
        setStatus(prev => ({
          ...prev,
          connected: true,
          state: 'open'
        }));
        
        setConnectionState({
          instance: {
            instanceName: currentInstance,
            state: 'open'
          }
        });
        
        // Ricarica anche le istanze per ottenere più info
        await loadInstances();
      } else {
        toast.error('WhatsApp non connesso');
      }
    } catch (error) {
      console.error('Error verifying connection:', error);
      toast.error('Errore nella verifica');
    } finally {
      setLoading(false);
    }
  };

  const forceReconnect = async () => {
    setLoading(true);
    try {
      // Prima disconnetti
      toast.info('Disconnessione in corso...');
      await api.delete(`/whatsapp/logout/${currentInstance}`);
      
      // Aspetta un attimo
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Poi riconnetti
      toast.info('Riconnessione in corso...');
      await api.get(`/whatsapp/qrcode`);
      
      // Ricarica stato
      await loadStatus();
      await loadInstances();
      
      toast.success('Riconnessione completata');
    } catch (error: any) {
      console.error('Error forcing reconnect:', error);
      toast.error('Errore nella riconnessione');
    } finally {
      setLoading(false);
    }
  };

  // Funzione rimossa perché c'è già sendMessage sopra

  const getStatusColor = (state?: string) => {
    switch (state) {
      case 'open':
        return 'text-green-600';
      case 'connecting':
        return 'text-yellow-600';
      case 'close':
      default:
        return 'text-red-600';
    }
  };

  const getStatusText = (state?: string) => {
    switch (state) {
      case 'open':
        return 'Connesso';
      case 'connecting':
        return 'Connessione in corso...';
      case 'close':
        return 'Disconnesso';
      default:
        return 'Sconosciuto';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <PhoneIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">WhatsApp Business</h1>
              <p className="text-gray-600">Gestione integrazione Evolution API</p>
              <div className="flex items-center gap-3 mt-1">
                {currentInstance && (
                  <p className="text-sm text-blue-600">
                    <KeyIcon className="h-4 w-4 inline mr-1" />
                    Istanza: <span className="font-semibold">{currentInstance}</span>
                  </p>
                )}
                {status?.connected && status?.phoneNumber && (
                  <span className="flex items-center px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-sm">
                    <PhoneIcon className="h-3 w-3 mr-1" />
                    <span className="font-semibold">{status.phoneNumber}</span>
                  </span>
                )}
                {status?.profileName && (
                  <span className="text-sm text-gray-700 font-medium">
                    {status.profileName}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={loadStatus}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Aggiorna</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('status')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'status'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <WifiIcon className="h-5 w-5 inline mr-2" />
              Stato Connessione
            </button>
            
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <CogIcon className="h-5 w-5 inline mr-2" />
              Gestione Istanza
            </button>
            
            <button
              onClick={() => setActiveTab('send')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'send'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <PaperAirplaneIcon className="h-5 w-5 inline mr-2" />
              Invia Messaggio
            </button>
            
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5 inline mr-2" />
              Info Sistema
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'status' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stato Connessione */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <WifiIcon className="h-5 w-5 mr-2" />
              Stato Connessione
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Istanza:</span>
                <span className="font-medium">{currentInstance || 'Non configurata'}</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Stato:</span>
                <span className={`font-medium ${getStatusColor(status?.state || connectionState?.instance?.state)}`}>
                  {getStatusText(status?.state || connectionState?.instance?.state)}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b">
                <span className="text-gray-600">Provider:</span>
                <span className="font-medium">Evolution API</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600">URL Server:</span>
                <span className="font-medium text-sm">{status?.url || 'Non configurato'}</span>
              </div>
            </div>

            {/* Azioni rapide */}
            <div className="mt-6 flex flex-wrap gap-2">
              {!currentInstance ? (
                <button
                  onClick={createInstance}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Crea Istanza
                </button>
              ) : (
                <button
                  onClick={restartInstance}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  <ArrowPathIcon className="h-5 w-5 inline mr-2" />
                  Riavvia Istanza
                </button>
              )}
            </div>
          </div>

          {/* QR Code o Info Connessione */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {qrCode ? (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Scansiona il QR Code
                </h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {/* Verifica se è già un'immagine base64 valida o un codice da convertire */}
                  {qrCode.startsWith('data:image') ? (
                    <img src={qrCode} alt="QR Code" className="mx-auto" />
                  ) : qrCode.startsWith('2@') ? (
                    // È un codice WhatsApp, generiamo il QR con una libreria
                    <div className="p-8 bg-white rounded border-2 border-gray-300">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                          Apri WhatsApp sul tuo telefono e vai su:
                        </p>
                        <p className="text-sm font-semibold text-gray-800 mb-2">
                          Impostazioni → Dispositivi collegati → Collega un dispositivo
                        </p>
                        <p className="text-xs text-gray-500 mt-4">
                          Codice di connessione ricevuto. In attesa di implementazione QR visivo.
                        </p>
                        <div className="mt-4 p-4 bg-gray-100 rounded">
                          <p className="text-xs font-mono break-all">
                            {qrCode.substring(0, 50)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Altro formato non riconosciuto
                    <div className="p-4 bg-white rounded border-2 border-gray-300">
                      <p className="text-sm text-gray-600 mb-2">Codice ricevuto:</p>
                      <pre className="text-xs break-all bg-gray-100 p-2 rounded">
                        {qrCode.substring(0, 100)}...
                      </pre>
                    </div>
                  )}
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  {qrCode.startsWith('2@') 
                    ? 'Il QR code è stato generato ma richiede una libreria per la visualizzazione'
                    : 'Apri WhatsApp sul tuo telefono e scansiona questo codice'
                  }
                </p>
              </div>
            ) : pairingCode ? (
              <div className="text-center">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Codice di Accoppiamento
                </h2>
                <div className="bg-blue-50 p-6 rounded-lg">
                  <p className="text-3xl font-mono font-bold text-blue-600">
                    {pairingCode}
                  </p>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Inserisci questo codice su WhatsApp del tuo telefono
                </p>
              </div>
            ) : (status?.connected === true || status?.state === 'open' || connectionState?.instance?.state === 'open') ? (
              <div className="text-center py-8">
                <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900">
                  WhatsApp Connesso
                </h2>
                <p className="mt-2 text-gray-600">
                  Il sistema è connesso e pronto per inviare messaggi
                </p>
                {status?.phoneNumber && (
                  <p className="mt-2 text-sm text-gray-500">
                    Numero: {status.phoneNumber}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <ExclamationCircleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900">
                  WhatsApp Non Connesso
                </h2>
                <p className="mt-2 text-gray-600">
                  {currentInstance 
                    ? 'Clicca su "Genera QR" per connettere WhatsApp' 
                    : 'Crea prima un\'istanza per iniziare'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gestione Istanza */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gestione Istanza
            </h2>
            
            <div className="space-y-4">
              {/* Genera QR Code se non connesso */}
              {currentInstance && status?.connected !== true && status?.state !== 'open' && (
                <div className="mb-4">
                  <button
                    onClick={getQRCode}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center"
                  >
                    <QrCodeIcon className="h-5 w-5 mr-2" />
                    Genera QR Code per Connessione
                  </button>
                </div>
              )}
              
              {/* Bottone per forzare aggiornamento stato - Mostra solo se disconnesso */}
              {(status?.state === 'connecting' || status?.state === 'unknown' || (!status?.connected && status?.state !== 'open')) && (
                <div className="mb-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-3">
                      ⚠️ Stato non sincronizzato. Se WhatsApp è connesso nella dashboard Evolution, usa questi pulsanti:
                    </p>
                    <div className="space-y-2">
                      <button
                        onClick={verifyConnectionViaNumberCheck}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                        Verifica Connessione (Metodo Affidabile)
                      </button>
                      
                      <button
                        onClick={async () => {
                          setLoading(true);
                          // Forza un restart dell'istanza per sincronizzare
                          try {
                            await api.put(`/whatsapp/restart/${currentInstance}`);
                            toast.info('Riavvio istanza... Attendere 5 secondi');
                            setTimeout(async () => {
                              await verifyConnectionViaNumberCheck();
                              setLoading(false);
                            }, 5000);
                          } catch (error) {
                            console.error('Error:', error);
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-400"
                      >
                        <ArrowPathIcon className="h-5 w-5 inline mr-2" />
                        Riavvia e Verifica
                      </button>
                      
                      <button
                        onClick={() => {
                          // Considera manualmente come connesso
                          setStatus(prev => ({
                            ...prev,
                            connected: true,
                            state: 'open'
                          }));
                          setConnectionState({
                            instance: {
                              instanceName: currentInstance,
                              state: 'open'
                            }
                          });
                          toast.success('Stato forzato a connesso');
                        }}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        ✓ Forza Stato Connesso (Temporaneo)
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Connessione con numero */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oppure Connetti con Numero di Telefono
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="es: 393331234567"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={connectWithPhone}
                    disabled={loading || !phoneNumber}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Connetti
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Inserisci il numero con prefisso internazionale senza +
                </p>
              </div>

              {/* Azioni istanza */}
              <div className="pt-4 border-t space-y-2">
                <button
                  onClick={logoutInstance}
                  disabled={loading || !currentInstance || connectionState?.instance?.state !== 'open'}
                  className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400"
                >
                  <PowerIcon className="h-5 w-5 inline mr-2" />
                  Disconnetti WhatsApp
                </button>
                
                <button
                  onClick={deleteInstance}
                  disabled={loading || !currentInstance}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                >
                  <TrashIcon className="h-5 w-5 inline mr-2" />
                  Elimina Istanza
                </button>
              </div>
            </div>
          </div>

          {/* Lista Istanze */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Istanze Disponibili ({instances.length})
            </h2>
            
            {instances.length > 0 ? (
              <div className="space-y-3">
                {instances.map((instance, index) => (
                  <div 
                    key={instance.instanceId || index}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {instance.instanceName || 'Istanza senza nome'}
                          </p>
                          {instance.instanceName === currentInstance && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                              Corrente
                            </span>
                          )}
                        </div>
                        
                        {instance.owner && (
                          <p className="text-xs text-gray-500 mt-1">
                            <PhoneIcon className="h-3 w-3 inline mr-1" />
                            {instance.owner.replace('@s.whatsapp.net', '')}
                          </p>
                        )}
                        
                        {instance.profileName && (
                          <p className="text-xs text-gray-500 mt-1">
                            <UserGroupIcon className="h-3 w-3 inline mr-1" />
                            {instance.profileName}
                          </p>
                        )}
                        
                        {instance.instanceId && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            ID: {instance.instanceId.substring(0, 8)}...
                          </p>
                        )}
                        
                        {instance.owner && (
                          <p className="text-xs text-gray-500 mt-1">
                            Owner: {instance.owner.replace('@s.whatsapp.net', '')}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          instance.status === 'open' || instance.state === 'open'
                            ? 'bg-green-100 text-green-800'
                            : instance.status === 'connecting' || instance.state === 'connecting'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {instance.status || instance.state || 'disconnesso'}
                        </span>
                        
                        {instance.apikey && (
                          <span className="text-xs text-gray-400">
                            Token: ...{instance.apikey.slice(-6)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Mostra token completo per l'istanza corrente */}
                    {instance.instanceName === currentInstance && instance.apikey && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600">Token API completo:</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs font-mono bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                            {instance.apikey || instance.token}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(instance.apikey || instance.token);
                              toast.success('Token copiato!');
                            }}
                            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Copia
                          </button>
                        </div>
                      </div>
                    )}  
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nessuna istanza trovata</p>
                <button
                  onClick={createInstance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Crea Prima Istanza
                </button>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={loadInstances}
                className="w-full px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <ArrowPathIcon className="h-4 w-4 inline mr-2" />
                Aggiorna Lista
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'send' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Invia Messaggio
          </h2>
          
          {connectionState?.instance?.state === 'open' || status?.connected === true ? (
            <div className="max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Colonna sinistra: Form base */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Messaggio Semplice</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numero Destinatario <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      placeholder="es: 393331234567"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Inserisci il numero con prefisso internazionale senza +
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Messaggio <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={6}
                      placeholder="Scrivi il tuo messaggio..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {message.length}/4096 caratteri
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ritardo invio (millisecondi)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10000"
                      placeholder="1000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Simula digitazione umana (1000 = 1 secondo)
                    </p>
                  </div>
                  
                  <button
                    onClick={sendMessage}
                    disabled={sending || !recipient || !message}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center justify-center"
                  >
                    {sending ? (
                      <>
                        <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                        Invio in corso...
                      </>
                    ) : (
                      <>
                        <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                        Invia Messaggio
                      </>
                    )}
                  </button>
                </div>
                
                {/* Colonna destra: Opzioni avanzate */}
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-800 mb-3">Opzioni Avanzate</h3>
                  
                  {/* Tipo di messaggio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo Messaggio
                    </label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                      <option value="text">Testo Semplice</option>
                      <option value="image">Immagine con Didascalia</option>
                      <option value="document">Documento</option>
                      <option value="audio">Audio</option>
                      <option value="video">Video</option>
                      <option value="location">Posizione</option>
                      <option value="contact">Contatto</option>
                      <option value="link">Link con Anteprima</option>
                    </select>
                  </div>
                  
                  {/* Menzioni (per gruppi) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menzioni (per gruppi)
                    </label>
                    <input
                      type="text"
                      placeholder="@393331234567, @393332345678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Separa i numeri con virgola
                    </p>
                  </div>
                  
                  {/* Opzioni */}
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="text-sm">Messaggio effimero</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="text-sm">Invia come broadcast</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" className="rounded text-blue-600" />
                      <span className="text-sm">Anteprima link disabilitata</span>
                    </label>
                  </div>
                  
                  {/* File upload (nascosto per ora) */}
                  <div className="hidden">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allega File
                    </label>
                    <input
                      type="file"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  {/* Templates predefiniti */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Predefiniti
                    </label>
                    <select 
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                      onChange={(e) => {
                        if (e.target.value) {
                          setMessage(e.target.value);
                        }
                      }}
                    >
                      <option value="">Seleziona template...</option>
                      <option value="Ciao! Grazie per averci contattato. Come possiamo aiutarti?">Benvenuto</option>
                      <option value="Il tuo appuntamento è confermato per il giorno [DATA] alle ore [ORA].">Conferma Appuntamento</option>
                      <option value="Abbiamo ricevuto la tua richiesta. Ti risponderemo entro 24 ore.">Richiesta Ricevuta</option>
                      <option value="Il tecnico sta arrivando. Tempo stimato di arrivo: [MINUTI] minuti.">Tecnico in Arrivo</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Sezione Test Multipli */}
              <div className="mt-8 pt-8 border-t">
                <h3 className="text-md font-medium text-gray-800 mb-3">Test Invio Multiplo</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    Invia lo stesso messaggio a più destinatari per testing
                  </p>
                  <textarea
                    placeholder="393331234567&#10;393332345678&#10;393333456789"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Un numero per riga, con prefisso internazionale
                  </p>
                  <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Invia a Tutti
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <p className="text-gray-600">
                WhatsApp deve essere connesso per inviare messaggi
              </p>
              <button
                onClick={() => setActiveTab('manage')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Vai a Gestione Istanza
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Row 1: Info API e Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Info API */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informazioni Evolution API
              </h2>
              
              {apiInfo ? (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Versione:</span>
                    <span className="font-medium">{apiInfo.version}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Stato:</span>
                    <span className="font-medium text-green-600">{apiInfo.message}</span>
                  </div>
                  {apiInfo.manager && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Manager:</span>
                      <a 
                        href={apiInfo.manager}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Apri Manager
                      </a>
                    </div>
                  )}
                  {apiInfo.documentation && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Docs:</span>
                      <a 
                        href={apiInfo.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Documentazione
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Caricamento informazioni...</p>
              )}
            </div>

            {/* Features */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Funzionalità Disponibili
              </h2>
              
              <div className="grid grid-cols-2 gap-3">
                {status?.features?.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-gray-700">
                      {feature.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Instance Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurazione Istanza
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Settings checkboxes */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.alwaysOnline}
                  onChange={(e) => setSettings({...settings, alwaysOnline: e.target.checked})}
                  className="rounded text-blue-600" 
                />
                <span className="text-sm">Sempre Online</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.readMessages}
                  onChange={(e) => setSettings({...settings, readMessages: e.target.checked})}
                  className="rounded text-blue-600" 
                />
                <span className="text-sm">Leggi Messaggi</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.readStatus}
                  onChange={(e) => setSettings({...settings, readStatus: e.target.checked})}
                  className="rounded text-blue-600" 
                />
                <span className="text-sm">Mostra Stato Lettura</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.rejectCall}
                  onChange={(e) => setSettings({...settings, rejectCall: e.target.checked})}
                  className="rounded text-blue-600" 
                />
                <span className="text-sm">Rifiuta Chiamate</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.groupsIgnore}
                  onChange={(e) => setSettings({...settings, groupsIgnore: e.target.checked})}
                  className="rounded text-blue-600" 
                />
                <span className="text-sm">Ignora Gruppi</span>
              </label>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.syncFullHistory}
                  onChange={(e) => setSettings({...settings, syncFullHistory: e.target.checked})}
                  className="rounded text-blue-600" 
                />
                <span className="text-sm">Sincronizza Storia Completa</span>
              </label>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Messaggio Rifiuto Chiamate
              </label>
              <input 
                type="text" 
                value={settings.msgCall}
                onChange={(e) => setSettings({...settings, msgCall: e.target.value})}
                placeholder="Messaggio da inviare quando si rifiuta una chiamata"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={!settings.rejectCall}
              />
            </div>
            
            <button 
              onClick={saveSettings}
              disabled={loading}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Salvataggio...' : 'Salva Configurazione'}
            </button>
          </div>

          {/* Row 3: Webhook Configuration */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Configurazione Webhook
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL Webhook
                </label>
                <input 
                  type="text" 
                  value={webhookConfig.url}
                  onChange={(e) => setWebhookConfig({...webhookConfig, url: e.target.value})}
                  placeholder="https://tuodominio.com/webhook"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Evolution invierà tutti gli eventi a questo URL
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Eventi da Ricevere
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'MESSAGES_UPSERT',
                    'MESSAGES_UPDATE', 
                    'CONNECTION_UPDATE',
                    'QRCODE_UPDATED',
                    'GROUP_UPDATE',
                    'GROUP_PARTICIPANTS_UPDATE'
                  ].map(event => (
                    <label key={event} className="flex items-center space-x-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={webhookConfig.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setWebhookConfig({
                              ...webhookConfig,
                              events: [...webhookConfig.events, event]
                            });
                          } else {
                            setWebhookConfig({
                              ...webhookConfig,
                              events: webhookConfig.events.filter(ev => ev !== event)
                            });
                          }
                        }}
                        className="rounded text-blue-600" 
                      />
                      <span className="text-xs">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Header Authorization
                  </label>
                  <input 
                    type="text" 
                    placeholder="Bearer token..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content-Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                    <option>application/json</option>
                    <option>application/x-www-form-urlencoded</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={webhookConfig.webhookByEvents}
                    onChange={(e) => setWebhookConfig({...webhookConfig, webhookByEvents: e.target.checked})}
                    className="rounded text-blue-600" 
                  />
                  <span className="text-sm">Eventi Separati</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={webhookConfig.webhookBase64}
                    onChange={(e) => setWebhookConfig({...webhookConfig, webhookBase64: e.target.checked})}
                    className="rounded text-blue-600" 
                  />
                  <span className="text-sm">Base64 per Media</span>
                </label>
                
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={webhookConfig.enabled}
                    onChange={(e) => setWebhookConfig({...webhookConfig, enabled: e.target.checked})}
                    className="rounded text-blue-600" 
                  />
                  <span className="text-sm font-semibold">Webhook Abilitato</span>
                </label>
              </div>
              
              <button 
                onClick={saveWebhookConfig}
                disabled={loading || !webhookConfig.url}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Configurazione...' : 'Configura Webhook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}