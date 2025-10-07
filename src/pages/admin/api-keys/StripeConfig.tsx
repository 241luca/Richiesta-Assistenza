import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCardIcon,
  KeyIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';
import ApiKeysLayout from './ApiKeysLayout';

interface StripeKey {
  id?: string;
  service: string;
  key: string;
  name: string;
  isActive: boolean;
}

export default function StripeConfig() {
  const queryClient = useQueryClient();
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    STRIPE: '',
    STRIPE_PUBLIC: '',
    STRIPE_WEBHOOK: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Carica chiavi esistenti
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['stripe-keys'],
    queryFn: async () => {
      const response = await api.get('/apikeys');
      const allKeys = response.data?.data || [];
      return allKeys.filter((k: StripeKey) => 
        k.service === 'STRIPE' || 
        k.service === 'STRIPE_PUBLIC' || 
        k.service === 'STRIPE_WEBHOOK'
      );
    }
  });

  // Popola form con chiavi esistenti
  useEffect(() => {
    if (apiKeys && apiKeys.length > 0) {
      const keys: any = {};
      apiKeys.forEach((apiKey: StripeKey) => {
        keys[apiKey.service] = apiKey.key;
      });
      setFormData(prev => ({ ...prev, ...keys }));
    }
  }, [apiKeys]);

  // Mutation per salvare/aggiornare chiavi
  const saveMutation = useMutation({
    mutationFn: async (data: { service: string; key: string; name: string }) => {
      const existing = apiKeys?.find((k: StripeKey) => k.service === data.service);
      
      if (existing && existing.id) {
        return api.put(`/apikeys/${existing.id}`, {
          key: data.key,
          isActive: true
        });
      } else {
        return api.post('/apikeys', {
          service: data.service,
          key: data.key,
          name: data.name,
          isActive: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-keys'] });
      toast.success('Chiave salvata con successo');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvaggio');
    }
  });

  // Test connessione
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await api.post('/payments/test-connection');
      if (response.data?.success) {
        toast.success('✅ Connessione a Stripe verificata!');
      } else {
        toast.error('Test fallito. Verifica le chiavi.');
      }
    } catch (error: any) {
      toast.error('Test connessione fallito. Verifica le chiavi inserite.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSave = async (service: string) => {
    const names = {
      STRIPE: 'Stripe Secret Key',
      STRIPE_PUBLIC: 'Stripe Public Key',
      STRIPE_WEBHOOK: 'Stripe Webhook Secret'
    };

    if (!formData[service as keyof typeof formData]) {
      toast.error('Inserisci una chiave valida');
      return;
    }

    await saveMutation.mutateAsync({
      service,
      key: formData[service as keyof typeof formData],
      name: names[service as keyof typeof names]
    });
  };

  const toggleShowKey = (service: string) => {
    setShowKeys(prev => ({ ...prev, [service]: !prev[service] }));
  };

  const getKeyStatus = (service: string) => {
    const key = apiKeys?.find((k: StripeKey) => k.service === service);
    return key?.isActive ? 'configured' : 'missing';
  };

  const allKeysConfigured = 
    getKeyStatus('STRIPE') === 'configured' && 
    getKeyStatus('STRIPE_PUBLIC') === 'configured' && 
    getKeyStatus('STRIPE_WEBHOOK') === 'configured';

  if (isLoading) {
    return (
      <ApiKeysLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ApiKeysLayout>
    );
  }

  return (
    <ApiKeysLayout>
      <div className="space-y-6">
        {/* Header con stato */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCardIcon className="h-8 w-8 text-indigo-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Configurazione Stripe
                </h2>
                <p className="text-sm text-gray-500">
                  Sistema di pagamenti e fatturazione online
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {allKeysConfigured ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Configurato
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  Configurazione incompleta
                </span>
              )}
              
              <button
                onClick={testConnection}
                disabled={isTestingConnection || !allKeysConfigured}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {isTestingConnection ? 'Test in corso...' : 'Test Connessione'}
              </button>
            </div>
          </div>
        </div>

        {/* Secret Key */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <KeyIcon className="h-5 w-5 mr-2 text-gray-600" />
                Secret Key (Backend)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Chiave segreta per operazioni lato server. Inizia con sk_test_ o sk_live_
              </p>
            </div>
            <StatusBadge status={getKeyStatus('STRIPE')} />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showKeys.STRIPE ? 'text' : 'password'}
                value={formData.STRIPE}
                onChange={(e) => setFormData(prev => ({ ...prev, STRIPE: e.target.value }))}
                placeholder="sk_test_51..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
              />
              <button
                onClick={() => toggleShowKey('STRIPE')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                {showKeys.STRIPE ? 
                  <EyeSlashIcon className="h-5 w-5" /> : 
                  <EyeIcon className="h-5 w-5" />
                }
              </button>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleSave('STRIPE')}
                disabled={saveMutation.isPending || !formData.STRIPE}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva Secret Key'}
              </button>
            </div>
          </div>
        </div>

        {/* Public Key */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-gray-600" />
                Public Key (Frontend)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Chiave pubblica per il checkout frontend. Inizia con pk_test_ o pk_live_
              </p>
            </div>
            <StatusBadge status={getKeyStatus('STRIPE_PUBLIC')} />
          </div>

          <div className="space-y-4">
            <input
              type="text"
              value={formData.STRIPE_PUBLIC}
              onChange={(e) => setFormData(prev => ({ ...prev, STRIPE_PUBLIC: e.target.value }))}
              placeholder="pk_test_51..."
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end">
              <button
                onClick={() => handleSave('STRIPE_PUBLIC')}
                disabled={saveMutation.isPending || !formData.STRIPE_PUBLIC}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva Public Key'}
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Secret */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-gray-600" />
                Webhook Secret
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Secret per verificare webhook da Stripe. Inizia con whsec_
              </p>
            </div>
            <StatusBadge status={getKeyStatus('STRIPE_WEBHOOK')} />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type={showKeys.STRIPE_WEBHOOK ? 'text' : 'password'}
                value={formData.STRIPE_WEBHOOK}
                onChange={(e) => setFormData(prev => ({ ...prev, STRIPE_WEBHOOK: e.target.value }))}
                placeholder="whsec_..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 pr-10"
              />
              <button
                onClick={() => toggleShowKey('STRIPE_WEBHOOK')}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                {showKeys.STRIPE_WEBHOOK ? 
                  <EyeSlashIcon className="h-5 w-5" /> : 
                  <EyeIcon className="h-5 w-5" />
                }
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Webhook URL da configurare in Stripe:</strong><br />
                <code className="bg-white px-2 py-1 rounded">
                  {window.location.origin.replace(':5193', ':3200')}/api/payments/stripe-webhook
                </code>
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => handleSave('STRIPE_WEBHOOK')}
                disabled={saveMutation.isPending || !formData.STRIPE_WEBHOOK}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Salvataggio...' : 'Salva Webhook Secret'}
              </button>
            </div>
          </div>
        </div>

        {/* Istruzioni */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            📚 Come configurare Stripe
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Per ambiente di Test:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Accedi a <a href="https://dashboard.stripe.com/test/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Stripe Test Dashboard</a></li>
                <li>Vai su Developers → API keys</li>
                <li>Copia la <strong>Secret key</strong> (sk_test_...)</li>
                <li>Copia la <strong>Publishable key</strong> (pk_test_...)</li>
                <li>Vai su Developers → Webhooks</li>
                <li>Clicca "Add endpoint"</li>
                <li>Inserisci l'URL webhook mostrato sopra</li>
                <li>Seleziona eventi: payment_intent.succeeded, charge.refunded</li>
                <li>Dopo la creazione, copia il <strong>Signing secret</strong></li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Per ambiente di Produzione:</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Accedi a <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline">Stripe Live Dashboard</a></li>
                <li>Ripeti gli stessi passaggi</li>
                <li>Le chiavi inizieranno con sk_live_ e pk_live_</li>
                <li>⚠️ <strong>Attenzione</strong>: le chiavi live processano pagamenti reali!</li>
              </ol>
              
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-xs text-red-700">
                  <strong>Importante:</strong> Non condividere mai le chiavi live pubblicamente e usa sempre HTTPS in produzione.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ApiKeysLayout>
  );
}

// Componente per mostrare lo stato
function StatusBadge({ status }: { status: string }) {
  if (status === 'configured') {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon className="h-4 w-4 mr-1" />
        Configurato
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
      <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
      Da configurare
    </span>
  );
}
