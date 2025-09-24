import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface NotificationTemplate {
  id: string;
  name: string;
  eventType: string;
  channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  subject?: string;
  body: string;
  variables: string[];
  isActive: boolean;
}

export default function DocumentNotificationsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    eventType: 'DOCUMENT_CREATED',
    channel: 'EMAIL',
    subject: '',
    body: '',
    variables: [] as string[],
    isActive: true
  });

  const eventTypes = [
    { value: 'DOCUMENT_CREATED', label: 'Documento Creato' },
    { value: 'DOCUMENT_UPDATED', label: 'Documento Aggiornato' },
    { value: 'DOCUMENT_APPROVED', label: 'Documento Approvato' },
    { value: 'DOCUMENT_REJECTED', label: 'Documento Rifiutato' },
    { value: 'DOCUMENT_SHARED', label: 'Documento Condiviso' },
    { value: 'DOCUMENT_EXPIRED', label: 'Documento Scaduto' },
    { value: 'APPROVAL_REQUESTED', label: 'Approvazione Richiesta' },
    { value: 'REMINDER', label: 'Promemoria' }
  ];

  const channels = [
    { value: 'EMAIL', label: 'Email', icon: EnvelopeIcon },
    { value: 'SMS', label: 'SMS', icon: DevicePhoneMobileIcon },
    { value: 'PUSH', label: 'Push', icon: BellIcon },
    { value: 'IN_APP', label: 'In-App', icon: ChatBubbleLeftIcon }
  ];

  // Placeholder data
  const templates: NotificationTemplate[] = [];

  // Carica statistiche
  const { data: stats } = useQuery({
    queryKey: ['notification-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/document-notifications/stats');
      return response.data?.data || { templates: { total: 0, active: 0 } };
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Template salvato con successo');
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      eventType: 'DOCUMENT_CREATED',
      channel: 'EMAIL',
      subject: '',
      body: '',
      variables: [],
      isActive: true
    });
    setSelectedTemplate(null);
    setPreviewMode(false);
  };

  const addVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;
    setFormData({
      ...formData,
      body: formData.body + placeholder,
      variables: [...new Set([...formData.variables, variable])]
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Notifiche Documenti</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configura i template per le notifiche automatiche
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuovo Template
          </button>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <BellIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Template Totali</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.templates?.total || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Attivi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.templates?.active || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <EnvelopeIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Email</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Altri Canali</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista Template */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Template Configurati</h2>
        </div>
        
        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun template</h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia creando il tuo primo template di notifica.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Crea Template
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Template items here */}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedTemplate ? 'Modifica Template' : 'Nuovo Template'}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Template</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo Evento</label>
                    <select
                      value={formData.eventType}
                      onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                    >
                      {eventTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Canale</label>
                  <div className="grid grid-cols-4 gap-4">
                    {channels.map(channel => {
                      const Icon = channel.icon;
                      return (
                        <button
                          key={channel.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, channel: channel.value as any })}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            formData.channel === channel.value
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                          <span className="text-sm font-medium">{channel.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formData.channel === 'EMAIL' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Oggetto</label>
                    <input
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                      placeholder="Es. Nuovo documento da approvare"
                    />
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Corpo del Messaggio</label>
                    <div className="text-xs text-gray-500">
                      Variabili disponibili: 
                      <button type="button" onClick={() => addVariable('userName')} className="ml-2 text-blue-600 hover:text-blue-800">{{userName}}</button>
                      <button type="button" onClick={() => addVariable('documentName')} className="ml-2 text-blue-600 hover:text-blue-800">{{documentName}}</button>
                      <button type="button" onClick={() => addVariable('date')} className="ml-2 text-blue-600 hover:text-blue-800">{{date}}</button>
                    </div>
                  </div>
                  <textarea
                    required
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={8}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm font-mono"
                    placeholder="Gentile {{userName}},&#10;&#10;Ti informiamo che il documento {{documentName}} richiede la tua attenzione.&#10;&#10;Cordiali saluti,&#10;Il Team"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Template Attivo
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  {previewMode ? 'Nascondi Preview' : 'Mostra Preview'}
                </button>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                  >
                    Salva Template
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
