import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  UserIcon,
  MapPinIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface ScheduleInterventionProps {
  request: any;
  onSuccess?: () => void;
}

export default function ScheduleIntervention({
  request,
  onSuccess
}: ScheduleInterventionProps) {
  const queryClient = useQueryClient();
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Mutation per impostare la data
  const scheduleMutation = useMutation({
    mutationFn: async (data: { scheduledDate: string; notes?: string }) => {
      return api.patch(`/requests/${request.id}/schedule`, data);
    },
    onSuccess: () => {
      toast.success('Data intervento impostata con successo!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', request.id] });
      setIsExpanded(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'impostazione della data');
    }
  });

  const handleSchedule = () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Inserisci data e ora dell\'intervento');
      return;
    }

    const dateTime = `${scheduledDate}T${scheduledTime}:00`;
    
    scheduleMutation.mutate({
      scheduledDate: new Date(dateTime).toISOString(),
      notes: notes.trim() || undefined
    });
  };

  // Se la richiesta ha già una data programmata, mostrala
  if (request.scheduledDate && !isExpanded) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-900">
                Intervento Programmato
              </p>
              <p className="text-sm text-green-700">
                {new Date(request.scheduledDate).toLocaleString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Modifica
          </button>
        </div>
      </div>
    );
  }

  // Se non c'è data programmata o stiamo modificando
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center space-x-2 mb-4">
        <CalendarIcon className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">
          {request.scheduledDate ? 'Modifica Data Intervento' : 'Programma Intervento'}
        </h3>
      </div>

      {/* Info Richiesta - NUOVO! */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="space-y-2 text-sm">
          {/* Cliente */}
          <div className="flex items-start space-x-2">
            <UserIcon className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <span className="font-medium text-gray-700">Cliente:</span>
              <span className="ml-2 text-gray-600">
                {request.client?.fullName || `${request.client?.firstName} ${request.client?.lastName}`}
              </span>
            </div>
          </div>
          
          {/* Indirizzo */}
          <div className="flex items-start space-x-2">
            <MapPinIcon className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <span className="font-medium text-gray-700">Indirizzo:</span>
              <span className="ml-2 text-gray-600">
                {request.address}, {request.city}
              </span>
            </div>
          </div>
          
          {/* Data Creazione */}
          <div className="flex items-start space-x-2">
            <ClockIcon className="h-4 w-4 text-gray-500 mt-0.5" />
            <div>
              <span className="font-medium text-gray-700">Richiesta creata:</span>
              <span className="ml-2 text-gray-600">
                {format(new Date(request.createdAt), 'dd/MM/yyyy HH:mm', { locale: it })}
              </span>
            </div>
          </div>
          
          {/* Data Richiesta dal Cliente - IMPORTANTE! */}
          {request.requestedDate && (
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mt-0.5" />
              <div>
                <span className="font-medium text-orange-700">Data richiesta dal cliente:</span>
                <span className="ml-2 text-orange-600 font-semibold">
                  {format(new Date(request.requestedDate), 'EEEE d MMMM yyyy', { locale: it })}
                </span>
              </div>
            </div>
          )}
          
          {/* Priorità */}
          {request.priority && request.priority !== 'MEDIUM' && (
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mt-0.5" />
              <div>
                <span className="font-medium text-red-700">Priorità:</span>
                <span className="ml-2 text-red-600 font-semibold uppercase">
                  {request.priority === 'URGENT' ? 'URGENTE' : request.priority}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      {request.status === 'ASSIGNED' && !request.scheduledDate && (
        <div className="mb-4 flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
          <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Importante</p>
            <p>Impostando la data dell'intervento, la richiesta passerà automaticamente in lavorazione.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Date and Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ora
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note per il cliente (opzionale)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Es: Arrivo previsto nel pomeriggio, porterò i materiali necessari..."
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          {isExpanded && (
            <button
              onClick={() => setIsExpanded(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
          )}
          <button
            onClick={handleSchedule}
            disabled={!scheduledDate || !scheduledTime || scheduleMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {scheduleMutation.isPending ? (
              <>
                <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                Salvataggio...
              </>
            ) : (
              <>
                <ClockIcon className="h-4 w-4 mr-2" />
                Conferma Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}