import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '@/services/api';
import toast from 'react-hot-toast';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface RequestTableRowProps {
  request: any;
  onAssignClick: (e: React.MouseEvent, requestId: string, subcategoryId: string | null) => void;
}

export function RequestTableRow({ request, onAssignClick }: RequestTableRowProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  // Mutations per aggiornare stato e priorità
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, cancelReason }: { status: string; cancelReason?: string }) => {
      const body: any = { status };
      if (cancelReason) {
        body.cancelReason = cancelReason;
      }
      const response = await api.put(`/requests/${request.id}/status`, body);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Stato aggiornato!');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setShowCancelModal(false);
      setCancelReason('');
      setPendingStatus(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore aggiornamento stato');
      setPendingStatus(null);
    }
  });

  const updatePriorityMutation = useMutation({
    mutationFn: async ({ priority }: { priority: string }) => {
      const response = await api.put(`/requests/${request.id}/priority`, { priority });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Priorità aggiornata!');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore aggiornamento priorità');
    }
  });

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'CANCELLED') {
      // Mostra modal per il motivo
      setPendingStatus(newStatus);
      setShowCancelModal(true);
    } else {
      // Aggiorna direttamente
      updateStatusMutation.mutate({ status: newStatus });
    }
  };

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      toast.error('Inserisci un motivo per l\'annullamento');
      return;
    }
    updateStatusMutation.mutate({ 
      status: 'CANCELLED', 
      cancelReason: cancelReason.trim() 
    });
  };

  const handleRowClick = (e: React.MouseEvent<HTMLTableCellElement>) => {
    // Naviga solo se non è un elemento interattivo
    const target = e.target as HTMLElement;
    if (!target.closest('select') && !target.closest('button')) {
      navigate(`/requests/${request.id}`);
    }
  };

  return (
    <>
      <tr className="border-b hover:bg-gray-50 transition-colors">
      <td className="py-2 px-2 cursor-pointer" onClick={handleRowClick}>
        {new Date(request.createdAt).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </td>
      <td className="py-2 px-2 cursor-pointer" onClick={handleRowClick}>
        <span className="font-medium">{request.title}</span>
      </td>
      <td className="py-2 px-2 cursor-pointer" onClick={handleRowClick}>
        {request.subcategory}
      </td>
      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
        <select
          value={request.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`px-2 py-1 text-xs rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            request.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800 border-blue-300' :
            request.status === 'IN_PROGRESS' ? 'bg-purple-100 text-purple-800 border-purple-300' :
            request.status === 'COMPLETED' ? 'bg-green-100 text-green-800 border-green-300' :
            'bg-gray-100 text-gray-800 border-gray-300'
          }`}
          disabled={updateStatusMutation.isPending}
        >
          <option value="PENDING">In Attesa</option>
          <option value="ASSIGNED">Assegnata</option>
          <option value="IN_PROGRESS">In Corso</option>
          <option value="COMPLETED">Completata</option>
          <option value="CANCELLED">Annullata</option>
        </select>
      </td>
      <td className="py-2 px-2" onClick={(e) => e.stopPropagation()}>
        <select
          value={request.priority}
          onChange={(e) => updatePriorityMutation.mutate({ priority: e.target.value })}
          className={`px-2 py-1 text-xs rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            request.priority === 'URGENT' ? 'bg-red-100 text-red-800 border-red-300' :
            request.priority === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-300' :
            request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            'bg-gray-100 text-gray-800 border-gray-300'
          }`}
          disabled={updatePriorityMutation.isPending}
        >
          <option value="LOW">Bassa</option>
          <option value="MEDIUM">Media</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
      </td>
      <td className="py-2 px-2 cursor-pointer" onClick={handleRowClick}>
        {request.client}
      </td>
      <td className="py-2 px-2">
        {request.professional ? (
          <span 
            className="cursor-pointer hover:underline"
            onClick={handleRowClick}
          >
            {request.professional}
          </span>
        ) : (
          <button
            onClick={(e) => onAssignClick(e, request.id, request.subcategoryId)}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
          >
            Assegna
          </button>
        )}
      </td>
      <td className="py-2 px-2 cursor-pointer" onClick={handleRowClick}>
        {request.requestedDate ? new Date(request.requestedDate).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-'}
      </td>
      <td className="py-2 px-2 cursor-pointer" onClick={handleRowClick}>
        {request.scheduledDate ? new Date(request.scheduledDate).toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : '-'}
      </td>
      <td className="py-2 px-2">
        <div className="flex justify-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/requests/${request.id}/chat`);
            }}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Apri chat"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5" />
          </button>
        </div>
      </td>
    </tr>

    {/* Modal di conferma annullamento */}
    {showCancelModal && (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowCancelModal(false)} />
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 shadow-xl z-50 w-full max-w-md">
          <h3 className="text-lg font-semibold mb-4">Conferma Annullamento</h3>
          <p className="text-sm text-gray-600 mb-4">
            Stai per annullare questa richiesta. Inserisci il motivo dell'annullamento:
          </p>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo dell'annullamento..."
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            rows={3}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setShowCancelModal(false);
                setCancelReason('');
                setPendingStatus(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              disabled={updateStatusMutation.isPending}
            >
              Annulla
            </button>
            <button
              onClick={handleConfirmCancel}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              disabled={updateStatusMutation.isPending || !cancelReason.trim()}
            >
              {updateStatusMutation.isPending ? 'Annullamento...' : 'Conferma Annullamento'}
            </button>
          </div>
        </div>
      </>
    )}
    </>
  );
}
