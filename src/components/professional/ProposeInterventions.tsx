import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CalendarIcon, 
  PlusIcon, 
  TrashIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ProposeInterventionsProps {
  requestId: string;
  requestTitle: string;
  clientName: string;
  onClose?: () => void;
}

interface InterventionForm {
  date: string;
  time: string;
  description: string;
  estimatedDuration: number;
}

export default function ProposeInterventions({ 
  requestId, 
  requestTitle,
  clientName,
  onClose 
}: ProposeInterventionsProps) {
  const queryClient = useQueryClient();
  
  // Form state per interventi multipli
  const [interventions, setInterventions] = useState<InterventionForm[]>([
    {
      date: '',
      time: '',
      description: '',
      estimatedDuration: 60
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutation per proporre interventi
  const proposeMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post('/scheduled-interventions', data);
    },
    onSuccess: () => {
      toast.success('Interventi proposti con successo! Il cliente riceverà una notifica.');
      queryClient.invalidateQueries({ queryKey: ['scheduled-interventions', requestId] });
      queryClient.invalidateQueries({ queryKey: ['request', requestId] });
      onClose?.();
    },
    onError: (error: any) => {
      toast.error(ResponseFormatter.getErrorMessage(error));
    }
  });

  // Aggiungi un nuovo intervento al form
  const addIntervention = () => {
    if (interventions.length >= 10) {
      toast.error('Massimo 10 interventi per volta');
      return;
    }

    setInterventions([
      ...interventions,
      {
        date: '',
        time: '',
        description: '',
        estimatedDuration: 60
      }
    ]);
  };

  // Rimuovi un intervento
  const removeIntervention = (index: number) => {
    setInterventions(interventions.filter((_, i) => i !== index));
  };

  // Aggiorna un intervento
  const updateIntervention = (index: number, field: keyof InterventionForm, value: any) => {
    const updated = [...interventions];
    updated[index] = { ...updated[index], [field]: value };
    setInterventions(updated);
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validazione
    for (const [index, intervention] of interventions.entries()) {
      if (!intervention.date || !intervention.time) {
        toast.error(`Inserisci data e ora per l'intervento ${index + 1}`);
        return;
      }
    }

    // Prepara i dati
    const data = {
      requestId,
      interventions: interventions.map(int => ({
        proposedDate: `${int.date}T${int.time}:00.000Z`,  // Aggiungiamo .000Z per il formato ISO 8601
        description: int.description || `Intervento per: ${requestTitle}`,
        estimatedDuration: int.estimatedDuration
      }))
    };

    console.log('Dati da inviare:', data);  // Debug per vedere cosa stiamo inviando

    setIsSubmitting(true);
    await proposeMutation.mutateAsync(data);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Proponi Interventi Programmati
        </h2>
        <p className="text-sm text-gray-600">
          Proponi una o più date per gli interventi. Il cliente <strong>{clientName}</strong> riceverà 
          una notifica e potrà accettare o discutere le date proposte.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Lista interventi */}
        <div className="space-y-4">
          {interventions.map((intervention, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">
                  Intervento #{index + 1}
                </h3>
                {interventions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeIntervention(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    value={intervention.date}
                    onChange={(e) => updateIntervention(index, 'date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Ora */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ora *
                  </label>
                  <input
                    type="time"
                    value={intervention.time}
                    onChange={(e) => updateIntervention(index, 'time', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Descrizione */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrizione intervento
                  </label>
                  <input
                    type="text"
                    value={intervention.description}
                    onChange={(e) => updateIntervention(index, 'description', e.target.value)}
                    placeholder="es: Sopralluogo e valutazione, Installazione componenti, Collaudo finale..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Durata stimata */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durata stimata
                  </label>
                  <select
                    value={intervention.estimatedDuration}
                    onChange={(e) => updateIntervention(index, 'estimatedDuration', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="30">30 minuti</option>
                    <option value="60">1 ora</option>
                    <option value="90">1 ora e mezza</option>
                    <option value="120">2 ore</option>
                    <option value="180">3 ore</option>
                    <option value="240">4 ore</option>
                    <option value="480">Giornata intera</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pulsante aggiungi intervento */}
        {interventions.length < 10 && (
          <button
            type="button"
            onClick={addIntervention}
            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Aggiungi altro intervento
          </button>
        )}

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <CalendarIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Come funziona:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Proponi una o più date per gli interventi necessari</li>
                <li>Il cliente riceverà una notifica per confermare</li>
                <li>Se rifiuta, potrete discutere alternative via chat</li>
                <li>Una volta confermati, gli interventi appariranno nel calendario</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting || interventions.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Invio proposta...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                Proponi {interventions.length === 1 ? 'Intervento' : `${interventions.length} Interventi`}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
