import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  XMarkIcon,
  CodeBracketIcon,
  EyeIcon,
  DocumentTextIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface NotificationTemplate {
  id?: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  subject?: string;
  htmlContent: string;
  textContent?: string;
  smsContent?: string;
  whatsappContent?: string;
  variables: any[];
  channels: string[];
  priority: string;
  isActive: boolean;
}

interface TemplateEditorProps {
  template: NotificationTemplate | null;
  onClose: () => void;
  onSave: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({ template, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'html' | 'text' | 'sms' | 'whatsapp' | 'preview'>('details');
  const [formData, setFormData] = useState<NotificationTemplate>({
    code: '',
    name: '',
    description: '',
    category: 'system',
    subject: '',
    htmlContent: '',
    textContent: '',
    smsContent: '',
    whatsappContent: '',
    variables: [],
    channels: ['email'],
    priority: 'NORMAL',
    isActive: true,
    ...template
  });
  const [previewData, setPreviewData] = useState<Record<string, any>>({});
  const [previewHtml, setPreviewHtml] = useState('');
  const [showVariableHelp, setShowVariableHelp] = useState(false);

  // Valori di default per le variabili comuni
  const defaultVariableValues: Record<string, any> = {
    // Utente
    nome: 'Mario',
    cognome: 'Rossi',
    fullName: 'Mario Rossi',
    email: 'mario.rossi@example.com',
    telefono: '+39 333 1234567',
    
    // Sistema
    appName: 'Sistema Assistenza',
    companyName: 'LM Tecnologie',
    siteUrl: 'https://assistenza.example.com',
    supportEmail: 'support@assistenza.it',
    supportPhone: '+39 02 12345678',
    
    // Richieste
    requestId: 'REQ-2025-001234',
    requestTitle: 'Riparazione urgente impianto',
    requestStatus: 'In attesa',
    requestDate: new Date().toLocaleDateString('it-IT'),
    requestTime: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
    
    // Professionista
    professionalName: 'Giovanni Bianchi',
    professionalPhone: '+39 335 9876543',
    professionalEmail: 'g.bianchi@pro.it',
    
    // Preventivo
    quoteId: 'QUO-2025-004567',
    quoteAmount: '€ 350,00',
    quoteValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT'),
    
    // Intervento
    interventionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('it-IT'),
    interventionTime: '14:30',
    interventionAddress: 'Via Roma 123, Milano',
    
    // Pagamento
    paymentAmount: '€ 350,00',
    paymentMethod: 'Carta di credito',
    invoiceNumber: 'FAT-2025-001234',
    
    // Altri
    message: 'Questo è un messaggio di esempio',
    link: 'https://assistenza.example.com/link',
    code: 'ABC123',
    password: 'TempPass123!',
    otp: '123456'
  };

  // Funzione per estrarre variabili dal contenuto
  const extractVariablesFromContent = (content: string): string[] => {
    const regex = /{{\s*(\w+)\s*}}/g;
    const variables = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    return Array.from(variables);
  };

  // Auto-popolamento delle variabili quando cambia il contenuto
  useEffect(() => {
    // Estrai tutte le variabili da tutti i contenuti
    const allVariables = new Set<string>();
    
    if (formData.htmlContent) {
      extractVariablesFromContent(formData.htmlContent).forEach(v => allVariables.add(v));
    }
    if (formData.textContent) {
      extractVariablesFromContent(formData.textContent).forEach(v => allVariables.add(v));
    }
    if (formData.smsContent) {
      extractVariablesFromContent(formData.smsContent).forEach(v => allVariables.add(v));
    }
    if (formData.whatsappContent) {
      extractVariablesFromContent(formData.whatsappContent).forEach(v => allVariables.add(v));
    }
    if (formData.subject) {
      extractVariablesFromContent(formData.subject).forEach(v => allVariables.add(v));
    }

    // Aggiorna automaticamente le variabili nel formData
    const variablesList = Array.from(allVariables).map(name => ({
      name,
      description: name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1'),
      type: 'string',
      required: false,
      defaultValue: defaultVariableValues[name] || `[${name}]`
    }));

    setFormData(prev => ({ ...prev, variables: variablesList }));

    // Auto-popola i valori di preview con i default
    const newPreviewData: Record<string, any> = {};
    allVariables.forEach(varName => {
      newPreviewData[varName] = defaultVariableValues[varName] || `[${varName}]`;
    });
    setPreviewData(newPreviewData);
  }, [formData.htmlContent, formData.textContent, formData.smsContent, formData.whatsappContent, formData.subject]);

  // Mutation per salvare il template - CORRETTA URL
  const saveMutation = useMutation({
    mutationFn: async (data: NotificationTemplate) => {
      if (data.id) {
        return await api.put(`/notification-templates/templates/${data.id}`, data);
      } else {
        return await api.post('/notification-templates/templates', data);
      }
    },
    onSuccess: () => {
      toast.success(`Template ${formData.id ? 'aggiornato' : 'creato'} con successo`);
      onSave();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Mutation per preview - CORRETTA URL
  const previewMutation = useMutation({
    mutationFn: async () => {
      // Log per debug
      const requestData = {
        htmlContent: formData.htmlContent || '',
        textContent: formData.textContent || '',
        smsContent: formData.smsContent || '',
        whatsappContent: formData.whatsappContent || '',
        subject: formData.subject || '',
        variables: previewData || {}
      };
      
      console.log('Sending preview request:', requestData);
      
      // Usa l'endpoint /preview generico invece di quello con code
      return await api.post('/notification-templates/preview', requestData);
    },
    onSuccess: (response) => {
      console.log('Preview response:', response.data);
      // Mostra il contenuto HTML renderizzato
      setPreviewHtml(response.data.data.html || '<p>Nessun contenuto HTML</p>');
    },
    onError: (error: any) => {
      console.error('Preview error details:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Errore nella generazione dell\'anteprima';
      toast.error(errorMessage);
      console.error('Preview error:', error);
    }
  });

  // Gestione delle variabili
  const addVariable = () => {
    setFormData({
      ...formData,
      variables: [
        ...formData.variables,
        { name: '', description: '', required: false, defaultValue: '' }
      ]
    });
  };

  const removeVariable = (index: number) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((_, i) => i !== index)
    });
  };

  const updateVariable = (index: number, field: string, value: any) => {
    const newVariables = [...formData.variables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setFormData({ ...formData, variables: newVariables });
  };

  // Icona per canale
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <EnvelopeIcon className="h-4 w-4" />;
      case 'sms':
        return <DevicePhoneMobileIcon className="h-4 w-4" />;
      case 'websocket':
        return <BellIcon className="h-4 w-4" />;
      case 'whatsapp':
        return <ChatBubbleLeftIcon className="h-4 w-4" />;
      default:
        return <BellIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {template ? '✏️ Modifica Template' : '➕ Nuovo Template'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex space-x-6 px-6">
            {[
              { id: 'details', label: '📋 Dettagli', icon: DocumentTextIcon },
              { id: 'html', label: '📧 HTML', icon: EnvelopeIcon },
              { id: 'text', label: '📝 Testo', icon: DocumentTextIcon },
              { id: 'sms', label: '📱 SMS', icon: DevicePhoneMobileIcon },
              { id: 'whatsapp', label: '💬 WhatsApp', icon: ChatBubbleLeftIcon },
              { id: 'preview', label: '👁️ Anteprima', icon: EyeIcon }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab Dettagli */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Codice Template *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="es. welcome_user"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">Codice univoco snake_case</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Template *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es. Benvenuto Nuovo Utente"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Descrizione del template e quando viene utilizzato..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="auth">Autenticazione</option>
                    <option value="request">Richieste</option>
                    <option value="quote">Preventivi</option>
                    <option value="payment">Pagamenti</option>
                    <option value="chat">Chat</option>
                    <option value="professional">Professionisti</option>
                    <option value="system">Sistema</option>
                    <option value="marketing">Marketing</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorità *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="LOW">Bassa</option>
                    <option value="NORMAL">Normale</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stato
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Attivo</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oggetto Email
                </label>
                <input
                  type="text"
                  value={formData.subject || ''}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="es. Benvenuto in {{appName}}! 🎉"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Canali */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Canali di Invio
                </label>
                <div className="flex space-x-4">
                  {['email', 'websocket', 'sms', 'whatsapp'].map((channel) => (
                    <label key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.channels.includes(channel)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, channels: [...formData.channels, channel] });
                          } else {
                            setFormData({ ...formData, channels: formData.channels.filter(c => c !== channel) });
                          }
                        }}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        {getChannelIcon(channel)}
                        <span className="ml-1 capitalize">{channel}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Variabili */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Variabili Template
                  </label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowVariableHelp(true)}
                      className="text-indigo-600 hover:text-indigo-700"
                    >
                      <InformationCircleIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={addVariable}
                      className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Aggiungi
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.variables.map((variable, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 p-2 rounded">
                      <input
                        type="text"
                        value={variable.name}
                        onChange={(e) => updateVariable(index, 'name', e.target.value)}
                        placeholder="Nome (es. firstName)"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={variable.description}
                        onChange={(e) => updateVariable(index, 'description', e.target.value)}
                        placeholder="Descrizione"
                        className="flex-2 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        value={variable.defaultValue || ''}
                        onChange={(e) => updateVariable(index, 'defaultValue', e.target.value)}
                        placeholder="Default"
                        className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={variable.required}
                          onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600"
                        />
                        <span className="ml-1 text-xs">Obblig.</span>
                      </label>
                      <button
                        onClick={() => removeVariable(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab HTML */}
          {activeTab === 'html' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contenuto HTML</h3>
                <p className="text-sm text-gray-500">
                  Usa le variabili con la sintassi {'{{nomeVariabile}}'}
                </p>
              </div>
              <textarea
                value={formData.htmlContent}
                onChange={(e) => setFormData({ ...formData, htmlContent: e.target.value })}
                className="w-full h-96 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="<html>..."
              />
            </div>
          )}

          {/* Tab Text */}
          {activeTab === 'text' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contenuto Testuale</h3>
                <p className="text-sm text-gray-500">Versione solo testo dell'email</p>
              </div>
              <textarea
                value={formData.textContent || ''}
                onChange={(e) => setFormData({ ...formData, textContent: e.target.value })}
                className="w-full h-96 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Testo semplice..."
              />
            </div>
          )}

          {/* Tab SMS */}
          {activeTab === 'sms' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contenuto SMS</h3>
                <p className="text-sm text-gray-500">Max 160 caratteri per SMS standard</p>
              </div>
              <textarea
                value={formData.smsContent || ''}
                onChange={(e) => setFormData({ ...formData, smsContent: e.target.value })}
                maxLength={320}
                className="w-full h-32 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Messaggio SMS breve..."
              />
              <p className="mt-2 text-sm text-gray-500">
                Caratteri: {(formData.smsContent || '').length}/320
              </p>
            </div>
          )}

          {/* Tab WhatsApp */}
          {activeTab === 'whatsapp' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contenuto WhatsApp</h3>
                <p className="text-sm text-gray-500">Supporta formattazione base: *grassetto*, _corsivo_, ~barrato~</p>
              </div>
              <textarea
                value={formData.whatsappContent || ''}
                onChange={(e) => setFormData({ ...formData, whatsappContent: e.target.value })}
                className="w-full h-96 px-3 py-2 font-mono text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Messaggio WhatsApp..."
              />
            </div>
          )}

          {/* Tab Preview */}
          {activeTab === 'preview' && (
            <div>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Anteprima Template</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-green-800">
                    ✅ Le variabili sono state compilate automaticamente con valori di esempio.
                    Puoi modificarle o cliccare direttamente su "Genera Anteprima".
                  </p>
                </div>
              </div>

              {/* Input variabili per preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm text-gray-700 mb-3">Valori Variabili per Preview:</h4>
                {formData.variables.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      {formData.variables.map((variable) => (
                        <div key={variable.name}>
                          <label className="block text-xs text-gray-600 mb-1">
                            {variable.description || variable.name}
                          </label>
                          <input
                            type="text"
                            value={previewData[variable.name] || ''}
                            onChange={(e) => setPreviewData({ ...previewData, [variable.name]: e.target.value })}
                            placeholder={variable.defaultValue || `Valore per ${variable.name}`}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded bg-white"
                          />
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => previewMutation.mutate()}
                      disabled={previewMutation.isPending}
                      className="mt-3 px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {previewMutation.isPending ? 'Generazione...' : 'Genera Anteprima'}
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">
                    Nessuna variabile trovata nel template. Aggiungi variabili usando la sintassi {'{{nomeVariabile}}'}.
                  </div>
                )}
              </div>

              {/* Preview renderizzata */}
              {previewHtml && (
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
                    <span className="text-sm font-medium text-gray-700">Anteprima Email</span>
                  </div>
                  <div className="p-4 bg-white">
                    <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer con azioni */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {template ? `ID: ${template.id}` : 'Nuovo template'}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Annulla
              </button>
              <button
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending || !formData.code || !formData.name}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saveMutation.isPending ? 'Salvataggio...' : (template ? 'Aggiorna Template' : 'Crea Template')}
              </button>
            </div>
          </div>
        </div>

        {/* Help Modal per Variabili */}
        {showVariableHelp && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md">
              <h3 className="text-lg font-semibold mb-4">📝 Come usare le variabili</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-700">Sintassi base:</p>
                  <code className="block bg-gray-100 p-2 rounded mt-1">{'{{nomeVariabile}}'}</code>
                </div>
                
                <div>
                  <p className="font-medium text-gray-700">Condizioni:</p>
                  <code className="block bg-gray-100 p-2 rounded mt-1">
                    {'{{#if condizione}}...{{/if}}'}
                  </code>
                </div>
                
                <div>
                  <p className="font-medium text-gray-700">Loop:</p>
                  <code className="block bg-gray-100 p-2 rounded mt-1">
                    {'{{#each array}}...{{/each}}'}
                  </code>
                </div>
                
                <div>
                  <p className="font-medium text-gray-700">Helper disponibili:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li><code className="bg-gray-100 px-1">formatDate</code> - Formatta date</li>
                    <li><code className="bg-gray-100 px-1">formatCurrency</code> - Formatta valuta</li>
                    <li><code className="bg-gray-100 px-1">uppercase</code> - Testo maiuscolo</li>
                    <li><code className="bg-gray-100 px-1">lowercase</code> - Testo minuscolo</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setShowVariableHelp(false)}
                className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 w-full"
              >
                Ho capito! 👍
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TemplateEditor;
