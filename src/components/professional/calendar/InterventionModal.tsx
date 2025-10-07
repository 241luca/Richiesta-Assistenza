import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon, MapPinIcon, UserIcon, ExclamationTriangleIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';
import { useAuth } from '@/contexts/AuthContext';

interface InterventionModalProps {
  intervention?: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function InterventionModal({ intervention, onClose, onSave }: InterventionModalProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!intervention?.id;
  
  // Form state - SEMPRE collegato a una richiesta
  const [formData, setFormData] = useState({
    requestId: intervention?.requestId || '',
    title: intervention?.title || '',
    description: intervention?.description || '',
    startDate: intervention?.startDate 
      ? dayjs(intervention.startDate).format('YYYY-MM-DDTHH:mm')
      : intervention?.start // ✅ FIX: Usa anche 'start' se presente
      ? dayjs(intervention.start).format('YYYY-MM-DDTHH:mm')
      : intervention?.proposedDate // ✅ FIX: Usa anche 'proposedDate'
      ? dayjs(intervention.proposedDate).format('YYYY-MM-DDTHH:mm')
      : dayjs().add(1, 'day').set('hour', 9).set('minute', 0).format('YYYY-MM-DDTHH:mm'),
    estimatedDuration: intervention?.estimatedDuration || 60,
    notes: intervention?.notes || '',
    priority: intervention?.priority || 'MEDIUM'
  });

  // Stato per conflitti
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // Fetch richieste assegnate al professionista
  // Il backend filtra automaticamente per professionalId se l'utente è un professionista
  const { data: requestsResponse, isLoading: loadingRequests, error: requestsError } = useQuery({
    queryKey: ['professional-requests', user?.id],
    queryFn: async () => {
      // ✅ FIX PROBLEMA 1: Usa DIRETTAMENTE l'endpoint corretto
      // Rimosso tentativo con endpoint inesistente /requests/my-requests
      const response = await api.get('/requests');
      
      // Estrai i dati dalla struttura ResponseFormatter
      if (response.data?.data?.requests) {
        return response.data.data.requests;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    },
    enabled: !!user?.id && !isEditing // Non caricare se stiamo modificando
  });

  // Debug: Log degli errori (solo in development)
  if (requestsError && import.meta.env.DEV) {
    console.error('Error fetching requests:', requestsError);
  }

  // Le richieste sono già estratte dalla risposta
  const requests = Array.isArray(requestsResponse) 
    ? requestsResponse 
    : [];

  // Fetch clienti del professionista (NUOVO ENDPOINT!)
  const { data: clientsResponse } = useQuery({
    queryKey: ['professional-clients', user?.id],
    queryFn: async () => {
      const response = await api.get('/users/my-clients');
      return response.data;
    },
    enabled: !!user?.id
  });

  // Estrai i clienti dalla risposta
  const clients = clientsResponse?.data || [];

  // Controllo conflitti quando cambiano date
  useEffect(() => {
    if (formData.startDate && formData.estimatedDuration) {
      checkConflicts();
    }
  }, [formData.startDate, formData.estimatedDuration]);

  // Funzione per controllare conflitti
  const checkConflicts = async () => {
    try {
      setCheckingConflicts(true);
      const endDate = dayjs(formData.startDate)
        .add(formData.estimatedDuration, 'minute')
        .toISOString();
      
      const response = await api.post('/calendar/check-conflicts', {
        start: formData.startDate,
        end: endDate,
        excludeId: intervention?.id
      });

      if (response.data?.data?.conflicts) {
        setConflicts(response.data.data.conflicts);
      } else {
        setConflicts([]);
      }
    } catch (error) {
      console.warn('Impossibile verificare conflitti:', error);
      setConflicts([]);
    } finally {
      setCheckingConflicts(false);
    }
  };

  // Quando viene selezionata una richiesta, popola i campi
  const handleRequestSelect = (requestId: string) => {
    if (!Array.isArray(requests)) {
      console.error('Requests is not an array:', requests);
      return;
    }
    const selectedRequest = requests.find((r: any) => r.id === requestId);
    if (selectedRequest) {
      setFormData(prev => ({
        ...prev,
        requestId: requestId,
        title: selectedRequest.title || prev.title,
        description: selectedRequest.description || prev.description,
        priority: selectedRequest.priority || prev.priority
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione: DEVE avere una richiesta associata
    if (!formData.requestId) {
      toast.error('Devi selezionare una richiesta di assistenza');
      return;
    }

    if (!formData.title) {
      toast.error('Il titolo è obbligatorio');
      return;
    }

    // Avvisa se ci sono conflitti ma permetti di salvare
    if (conflicts.length > 0) {
      const confirm = window.confirm(
        `Attenzione: ci sono ${conflicts.length} conflitti di orario.\nVuoi procedere comunque?`
      );
      if (!confirm) return;
    }

    // Prepara i dati per il salvataggio
    const dataToSave = {
      ...formData,
      proposedDate: formData.startDate,
      startDate: formData.startDate,
      endDate: dayjs(formData.startDate).add(formData.estimatedDuration, 'minute').toISOString(),
      professionalId: user?.id,
      // Usa l'ID dell'intervento se stiamo modificando
      id: intervention?.id
    };

    onSave(dataToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2" />
            {isEditing ? 'Modifica Intervento' : 'Programma Intervento'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Alert importante */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <DocumentTextIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Nota importante:</p>
                <p>Ogni intervento deve essere collegato a una richiesta di assistenza esistente. 
                   Seleziona una richiesta dall'elenco sottostante.</p>
              </div>
            </div>
          </div>

          {/* Selezione richiesta (OBBLIGATORIO!) */}
          {!isEditing && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Richiesta di Assistenza *
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Seleziona una richiesta assegnata
                </label>
                {loadingRequests ? (
                  <div className="text-sm text-gray-500">Caricamento richieste...</div>
                ) : Array.isArray(requests) && requests.length > 0 ? (
                  <select
                    value={formData.requestId}
                    onChange={(e) => handleRequestSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">-- Seleziona una richiesta --</option>
                    {requests.map((request: any) => (
                      <option key={request.id} value={request.id}>
                        {request.title} - {request.client?.fullName || 'Cliente'} 
                        ({request.city || 'Città non specificata'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800 font-medium mb-2">
                      Non hai richieste di assistenza al momento
                    </p>
                    <p className="text-sm text-amber-700 mb-3">
                      Per programmare un intervento, devi prima avere una richiesta di assistenza assegnata a te.
                      Le richieste vengono assegnate dall'amministratore o puoi auto-assegnarti quelle disponibili.
                    </p>
                    <div className="mt-4 pt-3 border-t border-amber-300">
                      <p className="text-xs text-amber-600 mb-2">Modalità Demo (solo per test):</p>
                      <button
                        type="button"
                        onClick={() => {
                          // Crea dati demo per testare
                          setFormData({
                            ...formData,
                            requestId: 'demo-123',
                            title: 'Intervento Demo - Test Calendario',
                            description: 'Questo è un intervento di test per verificare il funzionamento del calendario'
                          });
                          toast.info('Modalità demo attivata - Solo per test');
                        }}
                        className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700"
                      >
                        Usa Dati Demo per Test
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Informazioni intervento */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Dettagli Intervento</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titolo *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="es. Riparazione caldaia"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrizione
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Descrizione del problema o dell'intervento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorità
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Bassa</option>
                <option value="MEDIUM">Media</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>
            </div>
          </div>

          {/* Data e ora */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-medium text-gray-900 flex items-center">
              <ClockIcon className="w-5 h-5 mr-2" />
              Data e Ora
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data e Ora Inizio *
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Durata stimata (minuti)
                </label>
                <input
                  type="number"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({...formData, estimatedDuration: parseInt(e.target.value) || 60})}
                  min="15"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Mostra conflitti se presenti */}
            {conflicts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Attenzione: Conflitti di orario rilevati!
                    </p>
                    <ul className="mt-2 text-sm text-red-700 space-y-1">
                      {conflicts.map((conflict: any, index: number) => (
                        <li key={conflict.id || index}>
                          • {conflict.title} - {conflict.client}
                          ({dayjs(conflict.start).format('HH:mm')} - {dayjs(conflict.end).format('HH:mm')})
                        </li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-red-600">
                      Puoi comunque salvare l'intervento se necessario.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {checkingConflicts && (
              <div className="text-sm text-gray-500">
                Verifica conflitti in corso...
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note aggiuntive
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Note per l'intervento..."
              />
            </div>
          </div>

          {/* Riepilogo cliente se una richiesta è selezionata */}
          {formData.requestId && (
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 flex items-center mb-3">
                <UserIcon className="w-5 h-5 mr-2" />
                Dettagli Cliente
              </h3>
              {(() => {
                if (!Array.isArray(requests)) {
                  console.error('Requests is not an array in client details:', requests);
                  return null;
                }
                const selectedRequest = requests.find((r: any) => r.id === formData.requestId);
                if (!selectedRequest) return null;
                
                return (
                  <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                    <p><span className="font-medium">Nome:</span> {selectedRequest.client?.fullName || 'N/D'}</p>
                    <p><span className="font-medium">Telefono:</span> {selectedRequest.client?.phone || 'N/D'}</p>
                    <p><span className="font-medium">Email:</span> {selectedRequest.client?.email || 'N/D'}</p>
                    <p><span className="font-medium">Indirizzo:</span> {selectedRequest.address || 'N/D'}, {selectedRequest.city || ''} {selectedRequest.postalCode || ''}</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Azioni */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={!formData.requestId || loadingRequests}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditing ? 'Aggiorna' : 'Programma Intervento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
