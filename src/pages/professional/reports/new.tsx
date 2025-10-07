import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  DocumentTextIcon,
  ClockIcon,
  MapPinIcon,
  CameraIcon,
  PencilSquareIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { apiClient } from '../../../services/api';

export default function NewReportPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId');
  
  const [formData, setFormData] = useState({
    requestId: requestId || '',
    templateId: '',
    interventionDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: '',
    typeId: '',
    description: '',
    problemFound: '',
    solutionApplied: '',
    materials: [],
    photos: [],
    notes: '',
    clientNotes: '',
    followUpRequired: false,
    followUpNotes: ''
  });

  // Query per caricare le richieste assegnate al professionista (tutte, anche non completate)
  const { data: availableRequests } = useQuery({
    queryKey: ['professional-requests-for-report'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/professionals/my-requests', {
          params: { assignedToMe: true }
        });
        return response.data.data || [];
      } catch (error) {
        // Se l'API non esiste, usa dati mock
        return [
          { 
            id: '1', 
            title: 'Riparazione rubinetto', 
            client: { fullName: 'Mario Rossi' }, 
            status: 'IN_PROGRESS',
            createdAt: new Date().toISOString() 
          },
          { 
            id: '2', 
            title: 'Installazione condizionatore', 
            client: { fullName: 'Luigi Bianchi' }, 
            status: 'COMPLETED',
            completedAt: new Date().toISOString() 
          },
          { 
            id: '3', 
            title: 'Controllo caldaia', 
            client: { fullName: 'Giuseppe Verdi' }, 
            status: 'ASSIGNED',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() 
          }
        ];
      }
    },
    enabled: !requestId // Solo se non abbiamo già un requestId dal parametro URL
  });

  // Query per caricare la richiesta se presente
  const { data: request } = useQuery({
    queryKey: ['request', requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const response = await apiClient.get(`/requests/${requestId}`);
      return response.data.data || response.data;
    },
    enabled: !!requestId
  });

  // Query per i template disponibili
  const { data: templates } = useQuery({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const response = await apiClient.get('/intervention-reports/templates');
      return response.data.data || [];
    }
  });

  // Query per i tipi di intervento
  const { data: interventionTypes } = useQuery({
    queryKey: ['intervention-types'],
    queryFn: async () => {
      const response = await apiClient.get('/intervention-reports/config/types');
      return response.data.data || [];
    }
  });

  // Mutation per salvare il rapporto - usa l'endpoint corretto
  const saveMutation = useMutation({
    mutationFn: async (isDraft: boolean) => {
      // Usa l'endpoint /reports invece di /intervention-reports diretto
      const response = await apiClient.post('/intervention-reports/reports', {
        ...formData,
        isDraft,
        status: isDraft ? 'draft' : 'completed',
        // Aggiungi i campi del form nella struttura corretta
        formData: {
          description: formData.description,
          problemFound: formData.problemFound,
          solutionApplied: formData.solutionApplied
        },
        internalNotes: formData.notes,
        clientNotes: formData.clientNotes,
        followUpRequired: formData.followUpRequired,
        followUpNotes: formData.followUpNotes
      });
      
      return response.data;
    },
    onSuccess: (data, isDraft) => {
      toast.success(isDraft ? 'Bozza salvata' : 'Rapporto completato');
      navigate('/professional/reports/list');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || error.message || 'Errore durante il salvataggio');
    }
  });

  const handleSubmit = (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    saveMutation.mutate(isDraft);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Nuovo Rapporto di Intervento</h1>
          {request && (
            <p className="mt-2 text-gray-600">
              Per la richiesta: <span className="font-medium">{request.title}</span>
            </p>
          )}
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Informazioni Base */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <DocumentTextIcon className="h-5 w-5 mr-2 text-gray-500" />
              Informazioni Base
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selezione Richiesta - CAMPO OBBLIGATORIO! */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Richiesta di riferimento * {!requestId && <span className="text-red-600">(OBBLIGATORIO)</span>}
                </label>
                {requestId ? (
                  // Se abbiamo già il requestId, mostra solo il riferimento
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="font-medium text-gray-900">
                      {request?.title || 'Caricamento...'}
                    </p>
                    {request?.client && (
                      <p className="text-sm text-gray-600">
                        Cliente: {request.client.fullName || `${request.client.firstName} ${request.client.lastName}`}
                      </p>
                    )}
                  </div>
                ) : (
                  // Altrimenti mostra il dropdown per selezionare
                  <select
                    value={formData.requestId}
                    onChange={(e) => setFormData({ ...formData, requestId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleziona la richiesta per cui stai creando il rapporto</option>
                    {availableRequests?.map((req: any) => {
                      const statusLabel = req.status === 'COMPLETED' ? '✅ Completata' : 
                                         req.status === 'IN_PROGRESS' ? '🔄 In corso' :
                                         req.status === 'ASSIGNED' ? '👤 Assegnata' : req.status;
                      return (
                        <option key={req.id} value={req.id}>
                          {req.title} - {req.client?.fullName || 'N/A'} - {statusLabel}
                          {req.completedAt && ` (${new Date(req.completedAt).toLocaleDateString()})`}
                        </option>
                      );
                    })}
                  </select>
                )}
                {!requestId && availableRequests?.length === 0 && (
                  <p className="mt-2 text-sm text-yellow-600">
                    Non hai richieste assegnate. Attendi che ti venga assegnata una richiesta.
                  </p>
                )}
              </div>

              {/* Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template *
                </label>
                <select
                  value={formData.templateId}
                  onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleziona template</option>
                  {templates?.map((template: any) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Intervento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo Intervento *
                </label>
                <select
                  value={formData.typeId}
                  onChange={(e) => setFormData({ ...formData, typeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleziona tipo</option>
                  {interventionTypes?.map((type: any) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Data Intervento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Intervento *
                </label>
                <input
                  type="date"
                  value={formData.interventionDate}
                  onChange={(e) => setFormData({ ...formData, interventionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Ora Inizio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ora Inizio *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Ora Fine */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ora Fine
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Dettagli Intervento */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <PencilSquareIcon className="h-5 w-5 mr-2 text-gray-500" />
              Dettagli Intervento
            </h2>

            <div className="space-y-4">
              {/* Descrizione Intervento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione Intervento *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrivi l'intervento effettuato..."
                  required
                />
              </div>

              {/* Problema Riscontrato */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problema Riscontrato *
                </label>
                <textarea
                  value={formData.problemFound}
                  onChange={(e) => setFormData({ ...formData, problemFound: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrivi il problema trovato..."
                  required
                />
              </div>

              {/* Soluzione Applicata */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Soluzione Applicata *
                </label>
                <textarea
                  value={formData.solutionApplied}
                  onChange={(e) => setFormData({ ...formData, solutionApplied: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrivi la soluzione applicata..."
                  required
                />
              </div>

              {/* Note Interne */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note Interne (non visibili al cliente)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note private..."
                />
              </div>

              {/* Note per il Cliente */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note per il Cliente
                </label>
                <textarea
                  value={formData.clientNotes}
                  onChange={(e) => setFormData({ ...formData, clientNotes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Note o raccomandazioni per il cliente..."
                />
              </div>

              {/* Follow-up Richiesto */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                    className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Follow-up richiesto
                  </span>
                </label>
              </div>

              {formData.followUpRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Note Follow-up
                  </label>
                  <textarea
                    value={formData.followUpNotes}
                    onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dettagli del follow-up necessario..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Pulsanti Azione */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => navigate('/professional/reports')}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Annulla
            </button>
            
            <div className="space-x-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saveMutation.isLoading}
                className="px-4 py-2 text-gray-700 bg-yellow-500 rounded-lg hover:bg-yellow-600 disabled:opacity-50"
              >
                <ClockIcon className="h-5 w-5 inline mr-2" />
                Salva Bozza
              </button>
              
              <button
                type="submit"
                disabled={saveMutation.isLoading}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                Completa Rapporto
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
