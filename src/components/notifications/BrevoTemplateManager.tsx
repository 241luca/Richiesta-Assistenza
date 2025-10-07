import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  EnvelopeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  CodeBracketIcon,
  DocumentDuplicateIcon,
  InformationCircleIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

// Template email predefiniti per Brevo
const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Email di Benvenuto',
    description: 'Inviata quando un nuovo utente si registra',
    category: 'user',
    variables: ['userName', 'email', 'verificationLink'],
    icon: '👋'
  },
  {
    id: 'password_reset',
    name: 'Reset Password',
    description: 'Inviata per il recupero password',
    category: 'auth',
    variables: ['userName', 'resetLink', 'expiryTime'],
    icon: '🔐'
  },
  {
    id: 'email_verification',
    name: 'Verifica Email',
    description: 'Conferma indirizzo email',
    category: 'auth',
    variables: ['userName', 'verificationLink'],
    icon: '✉️'
  },
  {
    id: 'request_created',
    name: 'Richiesta Creata',
    description: 'Conferma creazione richiesta assistenza',
    category: 'request',
    variables: ['userName', 'requestId', 'requestTitle', 'category'],
    icon: '📋'
  },
  {
    id: 'request_assigned',
    name: 'Richiesta Assegnata',
    description: 'Notifica assegnazione professionista',
    category: 'request',
    variables: ['userName', 'professionalName', 'requestTitle'],
    icon: '👷'
  },
  {
    id: 'quote_received',
    name: 'Preventivo Ricevuto',
    description: 'Nuovo preventivo da professionista',
    category: 'quote',
    variables: ['userName', 'professionalName', 'quoteAmount', 'requestTitle'],
    icon: '💰'
  },
  {
    id: 'quote_accepted',
    name: 'Preventivo Accettato',
    description: 'Conferma accettazione preventivo',
    category: 'quote',
    variables: ['professionalName', 'clientName', 'quoteAmount', 'requestTitle'],
    icon: '✅'
  },
  {
    id: 'intervention_scheduled',
    name: 'Intervento Programmato',
    description: 'Conferma appuntamento intervento',
    category: 'intervention',
    variables: ['userName', 'professionalName', 'date', 'time', 'address'],
    icon: '📅'
  },
  {
    id: 'intervention_completed',
    name: 'Intervento Completato',
    description: 'Riepilogo intervento completato',
    category: 'intervention',
    variables: ['userName', 'professionalName', 'reportLink'],
    icon: '🎯'
  },
  {
    id: 'payment_success',
    name: 'Pagamento Confermato',
    description: 'Conferma pagamento ricevuto',
    category: 'payment',
    variables: ['userName', 'amount', 'invoiceNumber', 'downloadLink'],
    icon: '💳'
  }
];

const TEMPLATE_CATEGORIES = {
  user: { label: 'Utente', color: 'blue' },
  auth: { label: 'Autenticazione', color: 'purple' },
  request: { label: 'Richieste', color: 'green' },
  quote: { label: 'Preventivi', color: 'yellow' },
  intervention: { label: 'Interventi', color: 'orange' },
  payment: { label: 'Pagamenti', color: 'emerald' }
};

export default function BrevoTemplateManager() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const queryClient = useQueryClient();

  // Query per ottenere i template salvati
  const { data: savedTemplates, isLoading } = useQuery({
    queryKey: ['brevo-templates'],
    queryFn: async () => {
      const response = await api.get('/admin/email-templates');
      return response.data?.data || [];
    }
  });

  // Mutation per salvare un template
  const saveMutation = useMutation({
    mutationFn: async (template: any) => {
      return await api.post('/admin/email-templates', template);
    },
    onSuccess: () => {
      toast.success('Template salvato con successo!');
      queryClient.invalidateQueries({ queryKey: ['brevo-templates'] });
      setIsEditorOpen(false);
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nel salvataggio');
    }
  });

  // Mutation per testare un template
  const testMutation = useMutation({
    mutationFn: async (templateId: string) => {
      return await api.post(`/admin/email-templates/${templateId}/test`);
    },
    onSuccess: () => {
      toast.success('Email di test inviata!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'invio');
    }
  });

  // Filtra i template
  const filteredTemplates = EMAIL_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Template Email Brevo</h2>
            <p className="mt-1 text-gray-600">
              Gestisci tutti i template email del sistema in un unico posto
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setIsEditorOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuovo Template
          </button>
        </div>
      </div>

      {/* Filtri */}
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Cerca template..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Tutte le categorie</option>
              {Object.entries(TEMPLATE_CATEGORIES).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista Template */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => {
          const saved = savedTemplates?.find((s: any) => s.id === template.id);
          const category = TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES];
          
          return (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{template.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${category.color}-100 text-${category.color}-800 mt-1`}>
                        {category.label}
                      </span>
                    </div>
                  </div>
                  {saved && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                </div>
                
                <p className="mt-3 text-sm text-gray-600">
                  {template.description}
                </p>
                
                {/* Variabili */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Variabili disponibili:
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <span
                        key={variable}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-700"
                      >
                        {`{{${variable}}}`}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Azioni */}
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setSelectedTemplate(template);
                        setIsEditorOpen(true);
                      }}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Modifica
                    </button>
                    {saved && (
                      <button
                        onClick={() => testMutation.mutate(template.id)}
                        disabled={testMutation.isPending}
                        className="inline-flex items-center px-3 py-1 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                      >
                        {testMutation.isPending ? (
                          <ArrowPathIcon className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <PaperAirplaneIcon className="h-4 w-4 mr-1" />
                        )}
                        Test
                      </button>
                    )}
                  </div>
                  {saved && (
                    <span className="text-xs text-gray-500">
                      ID Brevo: {saved.brevoTemplateId || 'Non configurato'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Come funzionano i template
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ol className="list-decimal list-inside space-y-1">
                <li>Crea o modifica un template con l'editor visuale</li>
                <li>Usa le variabili tra doppie graffe: {`{{nomeVariabile}}`}</li>
                <li>Salva il template nel sistema</li>
                <li>Il sistema userà automaticamente il template corretto per ogni tipo di notifica</li>
                <li>Puoi testare ogni template cliccando su "Test"</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal (da implementare) */}
      {isEditorOpen && (
        <TemplateEditorModal
          template={selectedTemplate}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedTemplate(null);
          }}
          onSave={(data) => saveMutation.mutate(data)}
        />
      )}
    </div>
  );
}

// Componente Editor Modal (placeholder)
function TemplateEditorModal({ template, onClose, onSave }: any) {
  // TODO: Implementare editor completo
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg max-w-4xl w-full p-6">
          <h2 className="text-xl font-bold mb-4">
            {template ? `Modifica: ${template.name}` : 'Nuovo Template'}
          </h2>
          {/* Editor content here */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              onClick={() => onSave(template)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Salva Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
