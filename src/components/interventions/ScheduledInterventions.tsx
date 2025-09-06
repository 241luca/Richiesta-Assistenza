import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface ScheduledInterventionsProps {
  requestId: string;
  userRole: 'CLIENT' | 'PROFESSIONAL' | 'ADMIN';
  userId: string;
}

interface Intervention {
  id: string;
  proposedDate: string;
  confirmedDate?: string;
  completedDate?: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  interventionNumber: number;
  description?: string;
  estimatedDuration?: number;
  professional: {
    id: string;
    firstName: string;
    lastName: string;
  };
  acceptedByUser?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  acceptedAt?: string;
  rejectedReason?: string;
  report?: {
    id: string;
    reportNumber: string;
  };
}

export default function ScheduledInterventions({
  requestId,
  userRole,
  userId
}: ScheduledInterventionsProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Query per caricare gli interventi
  const { data: interventions, isLoading } = useQuery({
    queryKey: ['scheduled-interventions', requestId],
    queryFn: async () => {
      const response = await api.get(`/scheduled-interventions/request/${requestId}`);
      return response.data.data as Intervention[];
    }
  });

  // Mutation per accettare
  const acceptMutation = useMutation({
    mutationFn: async (interventionId: string) => {
      return api.put(`/scheduled-interventions/${interventionId}/accept`);
    },
    onSuccess: () => {
      toast.success('Data intervento confermata!');
      queryClient.invalidateQueries({ queryKey: ['scheduled-interventions', requestId] });
    },
    onError: () => {
      toast.error('Errore nella conferma');
    }
  });

  // Mutation per rifiutare
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      return api.put(`/scheduled-interventions/${id}/reject`, {
        rejectedReason: reason
      });
    },
    onSuccess: () => {
      toast.success('Data rifiutata. Discuti un\'alternativa in chat.');
      queryClient.invalidateQueries({ queryKey: ['scheduled-interventions', requestId] });
      setShowRejectModal(null);
      setRejectReason('');
    },
    onError: () => {
      toast.error('Errore nel rifiuto');
    }
  });

  // Mutation per cancellare (professionista)
  const cancelMutation = useMutation({
    mutationFn: async (interventionId: string) => {
      return api.delete(`/scheduled-interventions/${interventionId}`);
    },
    onSuccess: () => {
      toast.success('Proposta cancellata');
      queryClient.invalidateQueries({ queryKey: ['scheduled-interventions', requestId] });
    },
    onError: () => {
      toast.error('Errore nella cancellazione');
    }
  });

  const getStatusBadge = (intervention: Intervention) => {
    switch (intervention.status) {
      case 'PROPOSED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="h-3 w-3 mr-1" />
            Da confermare
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Confermato
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            Rifiutato
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <DocumentTextIcon className="h-3 w-3 mr-1" />
            Completato
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (!interventions || interventions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">Nessun intervento programmato</p>
      </div>
    );
  }

  // Separa interventi per stato
  const pendingInterventions = interventions.filter(i => i.status === 'PROPOSED');
  const confirmedInterventions = interventions.filter(i => i.status === 'ACCEPTED');
  const completedInterventions = interventions.filter(i => i.status === 'COMPLETED');

  return (
    <div className="space-y-6">
      {/* Interventi da confermare (solo per cliente) */}
      {userRole === 'CLIENT' && pendingInterventions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <h3 className="font-medium text-yellow-900">
              Interventi da confermare
            </h3>
          </div>
          <div className="space-y-3">
            {pendingInterventions.map((intervention) => (
              <div key={intervention.id} className="bg-white rounded-lg p-4 border border-yellow-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Intervento #{intervention.interventionNumber}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      📅 {format(new Date(intervention.proposedDate), 'EEEE d MMMM yyyy', { locale: it })}
                      {' alle '}
                      {format(new Date(intervention.proposedDate), 'HH:mm')}
                    </p>
                    {intervention.description && (
                      <p className="text-sm text-gray-700 mt-2">
                        {intervention.description}
                      </p>
                    )}
                    {intervention.estimatedDuration && (
                      <p className="text-xs text-gray-500 mt-1">
                        Durata prevista: {intervention.estimatedDuration} minuti
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => acceptMutation.mutate(intervention.id)}
                      disabled={acceptMutation.isPending}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      Accetta
                    </button>
                    <button
                      onClick={() => setShowRejectModal(intervention.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                    >
                      Rifiuta
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm text-yellow-700">
            💬 Se le date non vanno bene, puoi discutere alternative nella chat
          </div>
        </div>
      )}

      {/* Prossimi interventi confermati */}
      {confirmedInterventions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-3">
            Prossimi interventi confermati
          </h3>
          <div className="space-y-2">
            {confirmedInterventions.map((intervention) => (
              <div key={intervention.id} className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      #{intervention.interventionNumber} - {format(new Date(intervention.confirmedDate || intervention.proposedDate), 'dd/MM/yyyy HH:mm', { locale: it })}
                    </p>
                    {intervention.description && (
                      <p className="text-sm text-gray-600 mt-1">{intervention.description}</p>
                    )}
                    {intervention.acceptedByUser && (
                      <p className="text-xs text-gray-500 mt-1">
                        ✅ Confermato da {intervention.acceptedByUser.firstName} {intervention.acceptedByUser.lastName}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(intervention)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interventi completati */}
      {completedInterventions.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Interventi completati
          </h3>
          <div className="space-y-2">
            {completedInterventions.map((intervention) => (
              <div key={intervention.id} className="bg-white rounded-lg p-3 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      #{intervention.interventionNumber} - {format(new Date(intervention.completedDate!), 'dd/MM/yyyy', { locale: it })}
                    </p>
                    {intervention.description && (
                      <p className="text-sm text-gray-600 mt-1">{intervention.description}</p>
                    )}
                    {intervention.report && (
                      <button
                        onClick={() => navigate(`/reports/${intervention.report.id}`)}
                        className="text-sm text-blue-600 hover:text-blue-700 mt-1 flex items-center"
                      >
                        <DocumentTextIcon className="h-4 w-4 mr-1" />
                        Rapporto #{intervention.report.reportNumber}
                      </button>
                    )}
                  </div>
                  {getStatusBadge(intervention)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal rifiuto */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rifiuta data proposta
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Vuoi indicare un motivo? (opzionale)
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="es: Non sono disponibile in quella data, preferirei di mattina..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason('');
                }}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  rejectMutation.mutate({ 
                    id: showRejectModal, 
                    reason: rejectReason 
                  });
                }}
                disabled={rejectMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Rifiuta e discuti in chat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
