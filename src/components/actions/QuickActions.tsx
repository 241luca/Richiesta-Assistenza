import React from 'react';
import { 
  CheckIcon, 
  XMarkIcon, 
  ChatBubbleLeftIcon,
  PhoneIcon,
  CalendarIcon,
  PencilIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface Action {
  icon: React.ComponentType<any>;
  label: string;
  action: string;
  color: string;
  confirmMessage?: string;
  disabled?: boolean;
}

interface QuickActionsProps {
  type: 'quote' | 'request' | 'appointment';
  itemId: string;
  status?: string;
  onActionComplete?: (action: string) => void;
  className?: string;
}

const ACTION_CONFIGS = {
  quote: [
    { 
      icon: CheckIcon, 
      label: 'Accetta', 
      action: 'accept',
      color: 'bg-green-600 hover:bg-green-700 text-white',
      confirmMessage: 'Confermi di accettare questo preventivo?'
    },
    { 
      icon: XMarkIcon, 
      label: 'Rifiuta', 
      action: 'reject',
      color: 'bg-red-600 hover:bg-red-700 text-white',
      confirmMessage: 'Sei sicuro di voler rifiutare questo preventivo?'
    },
    { 
      icon: ChatBubbleLeftIcon, 
      label: 'Negozia', 
      action: 'negotiate',
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    { 
      icon: DocumentTextIcon, 
      label: 'Dettagli', 
      action: 'view',
      color: 'bg-gray-600 hover:bg-gray-700 text-white'
    }
  ],
  request: [
    { 
      icon: ChatBubbleLeftIcon, 
      label: 'Chat', 
      action: 'chat',
      color: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    { 
      icon: PhoneIcon, 
      label: 'Chiama', 
      action: 'call',
      color: 'bg-green-600 hover:bg-green-700 text-white'
    },
    { 
      icon: PencilIcon, 
      label: 'Modifica', 
      action: 'edit',
      color: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    { 
      icon: XMarkIcon, 
      label: 'Annulla', 
      action: 'cancel',
      color: 'bg-red-600 hover:bg-red-700 text-white',
      confirmMessage: 'Confermi di voler annullare questa richiesta?'
    }
  ],
  appointment: [
    { 
      icon: CheckIcon, 
      label: 'Conferma', 
      action: 'confirm',
      color: 'bg-green-600 hover:bg-green-700 text-white'
    },
    { 
      icon: CalendarIcon, 
      label: 'Cambia Data', 
      action: 'reschedule',
      color: 'bg-yellow-600 hover:bg-yellow-700 text-white'
    },
    { 
      icon: ClockIcon, 
      label: 'Posticipa', 
      action: 'postpone',
      color: 'bg-orange-600 hover:bg-orange-700 text-white'
    },
    { 
      icon: XMarkIcon, 
      label: 'Cancella', 
      action: 'cancel',
      color: 'bg-red-600 hover:bg-red-700 text-white',
      confirmMessage: 'Confermi di voler cancellare questo appuntamento?'
    }
  ]
};

export const QuickActions: React.FC<QuickActionsProps> = ({
  type,
  itemId,
  status,
  onActionComplete,
  className = ''
}) => {
  const queryClient = useQueryClient();

  const actionMutation = useMutation({
    mutationFn: async ({ action }: { action: string }) => {
      let endpoint = '';
      
      switch (type) {
        case 'quote':
          if (action === 'view') {
            window.location.href = `/quotes/${itemId}`;
            return;
          }
          if (action === 'negotiate') {
            window.location.href = `/chat/quote/${itemId}`;
            return;
          }
          endpoint = `/quotes/${itemId}/${action}`;
          break;
          
        case 'request':
          if (action === 'chat') {
            window.location.href = `/chat/request/${itemId}`;
            return;
          }
          if (action === 'call') {
            // Ottieni numero telefono e apri dialer
            try {
              const response = await api.get(`/requests/${itemId}`);
              const phoneNumber = response.data.data?.professional?.phone;
              if (phoneNumber) {
                window.location.href = `tel:${phoneNumber}`;
              } else {
                toast.error('Numero di telefono non disponibile');
              }
            } catch (error) {
              toast.error('Errore nel recupero del numero');
            }
            return;
          }
          if (action === 'edit') {
            window.location.href = `/requests/${itemId}/edit`;
            return;
          }
          endpoint = `/requests/${itemId}/${action}`;
          break;
          
        case 'appointment':
          if (action === 'reschedule') {
            window.location.href = `/appointments/${itemId}/reschedule`;
            return;
          }
          endpoint = `/appointments/${itemId}/${action}`;
          break;
      }
      
      const response = await api.post(endpoint);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Messaggi di successo personalizzati
      const messages = {
        accept: 'Preventivo accettato con successo! ✓',
        reject: 'Preventivo rifiutato',
        confirm: 'Appuntamento confermato! ✓',
        cancel: 'Operazione annullata',
        postpone: 'Appuntamento posticipato'
      };
      
      const message = messages[variables.action as keyof typeof messages] || 
                     `Azione "${variables.action}" completata con successo!`;
      
      toast.success(message);
      
      // Invalida cache per aggiornare i dati
      queryClient.invalidateQueries({ queryKey: [type] });
      queryClient.invalidateQueries({ queryKey: [type, itemId] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Callback esterno
      onActionComplete?.(variables.action);
    },
    onError: (error: any) => {
      console.error('Quick action error:', error);
      const message = error.response?.data?.message || 
                     `Errore nell'eseguire l'azione. Riprova.`;
      toast.error(message);
    }
  });

  const handleAction = async (actionConfig: Action) => {
    // Verifica se l'azione è disabilitata
    if (actionConfig.disabled) {
      toast.error('Azione non disponibile in questo stato');
      return;
    }

    // Conferma per azioni critiche
    if (actionConfig.confirmMessage) {
      if (!window.confirm(actionConfig.confirmMessage)) {
        return;
      }
    }

    actionMutation.mutate({ action: actionConfig.action });
  };

  // Filtra azioni in base allo stato
  const getFilteredActions = () => {
    const actions = ACTION_CONFIGS[type];
    
    // Logica per disabilitare azioni in base allo stato
    return actions.map(action => {
      let disabled = false;
      
      if (type === 'quote' && status) {
        if (status === 'ACCEPTED' && (action.action === 'accept' || action.action === 'reject')) {
          disabled = true;
        }
        if (status === 'REJECTED' && (action.action === 'accept' || action.action === 'reject')) {
          disabled = true;
        }
      }
      
      if (type === 'appointment' && status) {
        if (status === 'CONFIRMED' && action.action === 'confirm') {
          disabled = true;
        }
        if (status === 'CANCELLED' && action.action !== 'view') {
          disabled = true;
        }
      }
      
      return { ...action, disabled };
    });
  };

  const filteredActions = getFilteredActions();

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filteredActions.map((actionConfig) => (
        <button
          key={actionConfig.action}
          onClick={() => handleAction(actionConfig)}
          disabled={actionMutation.isPending || actionConfig.disabled}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm
            transition-all duration-200 transform hover:scale-105
            ${actionConfig.color}
            ${actionConfig.disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'shadow-md hover:shadow-lg'
            }
            ${actionMutation.isPending ? 'opacity-75 cursor-wait' : ''}
          `}
          title={actionConfig.disabled ? 'Azione non disponibile' : actionConfig.label}
        >
          <actionConfig.icon className="h-4 w-4" />
          <span>{actionConfig.label}</span>
          {actionMutation.isPending && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default QuickActions;