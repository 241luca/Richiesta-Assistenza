import React from 'react';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BoltIcon,
  ClockIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { toast } from 'react-hot-toast';

interface NotificationEvent {
  id: string;
  code: string;
  name: string;
  description?: string;
  eventType: string;
  entityType?: string;
  templateId: string;
  isActive: boolean;
  delay: number;
  NotificationTemplate?: {
    id: string;
    name: string;
    code: string;
  };
}

interface EventManagerProps {
  events: NotificationEvent[];
}

const EventManager: React.FC<EventManagerProps> = ({ events }) => {
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = React.useState<NotificationEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Mutation per trigger manuale evento
  const triggerEventMutation = useMutation({
    mutationFn: async ({ code, recipientId, variables }: any) => {
      return await api.post(`/api/notifications/events/${code}/trigger`, {
        recipientId,
        variables
      });
    },
    onSuccess: () => {
      toast.success('Evento scatenato con successo');
    },
    onError: () => {
      toast.error('Errore nel trigger dell\'evento');
    }
  });

  // Mutation per attivare/disattivare evento
  const toggleEventMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return await api.patch(`/api/notifications/events/${id}`, { isActive });
    },
    onSuccess: () => {
      toast.success('Evento aggiornato');
      queryClient.invalidateQueries({ queryKey: ['notification-events'] });
    }
  });

  // Colore per tipo evento
  const getEventTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'request_created': 'bg-blue-100 text-blue-800',
      'request_assigned': 'bg-indigo-100 text-indigo-800',
      'request_completed': 'bg-green-100 text-green-800',
      'quote_received': 'bg-yellow-100 text-yellow-800',
      'quote_accepted': 'bg-emerald-100 text-emerald-800',
      'payment_completed': 'bg-purple-100 text-purple-800',
      'user_registered': 'bg-pink-100 text-pink-800',
      'message_received': 'bg-cyan-100 text-cyan-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Eventi Automatici</h2>
          <p className="text-sm text-gray-500 mt-1">
            Configura gli eventi che scatenano notifiche automatiche
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Nuovo Evento
        </button>
      </div>

      {/* Lista Eventi */}
      <div className="grid gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center">
                  <BoltIcon className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    {event.name}
                  </h3>
                  <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getEventTypeColor(event.eventType)}`}>
                    {event.eventType}
                  </span>
                  {event.delay > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600 flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {event.delay} min
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-gray-500 mt-1">
                  Codice: <code className="bg-gray-100 px-1 rounded">{event.code}</code>
                </p>
                
                {event.description && (
                  <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                )}
                
                {event.NotificationTemplate && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-md">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Template:</span> {event.NotificationTemplate.name}
                      <code className="ml-2 bg-gray-200 px-1 rounded text-xs">
                        {event.NotificationTemplate.code}
                      </code>
                    </p>
                  </div>
                )}

                {event.entityType && (
                  <p className="text-sm text-gray-500 mt-2">
                    Entità: <span className="font-medium">{event.entityType}</span>
                  </p>
                )}
              </div>

              {/* Azioni */}
              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => {
                    // Apri modal per test trigger
                    const recipientId = prompt('ID utente destinatario:');
                    if (recipientId) {
                      const variables = prompt('Variabili JSON (es. {"name": "Mario"}):');
                      try {
                        const parsedVars = variables ? JSON.parse(variables) : {};
                        triggerEventMutation.mutate({
                          code: event.code,
                          recipientId,
                          variables: parsedVars
                        });
                      } catch (e) {
                        toast.error('Variabili JSON non valide');
                      }
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-indigo-600"
                  title="Test Trigger"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => {
                    setSelectedEvent(event);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title="Modifica"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
                
                <button
                  onClick={() => toggleEventMutation.mutate({ 
                    id: event.id, 
                    isActive: !event.isActive 
                  })}
                  className={`p-2 ${event.isActive ? 'text-green-500' : 'text-gray-400'} hover:text-gray-600`}
                  title={event.isActive ? 'Attivo' : 'Disattivato'}
                >
                  {event.isActive ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <XCircleIcon className="h-5 w-5" />
                  )}
                </button>
                
                <button
                  onClick={() => {
                    if (confirm('Sei sicuro di voler eliminare questo evento?')) {
                      // Implementa eliminazione
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600"
                  title="Elimina"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Se non ci sono eventi */}
      {events.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <BoltIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun evento configurato</h3>
          <p className="mt-1 text-sm text-gray-500">
            Inizia creando un nuovo evento automatico.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nuovo Evento
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManager;
