import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

interface SelfAssignToggleProps {
  professionalId: string;
  canSelfAssign: boolean;
  professionalName: string;
}

export function SelfAssignToggle({ 
  professionalId, 
  canSelfAssign: initialValue, 
  professionalName 
}: SelfAssignToggleProps) {
  const queryClient = useQueryClient();
  const [enabled, setEnabled] = React.useState(initialValue);

  // Aggiorna lo stato quando cambia la prop
  React.useEffect(() => {
    setEnabled(initialValue);
  }, [initialValue]);

  const toggleMutation = useMutation({
    mutationFn: async (newValue: boolean) => {
      console.log('Sending toggle request:', { professionalId, canSelfAssign: newValue });
      const response = await api.post(`/professionals/toggle-self-assign/${professionalId}`, {
        canSelfAssign: newValue
      });
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Toggle response:', data);
      const newValue = data.data?.canSelfAssign;
      setEnabled(newValue);
      toast.success(
        newValue 
          ? `Auto-assegnazione abilitata per ${professionalName}`
          : `Auto-assegnazione disabilitata per ${professionalName}`
      );
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
    },
    onError: (error: any) => {
      // Ripristina il valore precedente
      setEnabled(!enabled);
      toast.error(error.response?.data?.message || 'Errore durante l\'aggiornamento');
    }
  });

  const handleToggle = () => {
    const newValue = !enabled;
    setEnabled(newValue);
    toggleMutation.mutate(newValue);
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={toggleMutation.isPending}
        className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          backgroundColor: enabled ? '#2563eb' : '#e5e7eb'
        }}
        role="switch"
        aria-checked={enabled}
      >
        <span className="sr-only">Auto-assegnazione</span>
        <span
          aria-hidden="true"
          className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
          style={{
            transform: enabled ? 'translateX(20px)' : 'translateX(0)'
          }}
        />
      </button>
      <span className="text-sm text-gray-600">
        Auto-assegnazione
      </span>
    </div>
  );
}