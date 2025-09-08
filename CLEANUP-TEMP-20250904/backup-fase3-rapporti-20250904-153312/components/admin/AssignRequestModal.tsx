import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import {
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface AssignRequestModalProps {
  request: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AssignRequestModal({
  request,
  isOpen,
  onClose,
  onSuccess
}: AssignRequestModalProps) {
  const queryClient = useQueryClient();
  const [selectedProfessional, setSelectedProfessional] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch professionals for the subcategory
  const { data: professionalsData, isLoading: loadingProfessionals } = useQuery({
    queryKey: ['professionals', request?.subcategoryId],
    queryFn: async () => {
      if (!request?.subcategoryId) return [];
      
      const response = await api.get(`/subcategories/${request.subcategoryId}/professionals`);
      return response.data?.professionals || [];
    },
    enabled: isOpen && !!request?.subcategoryId
  });

  // Mutation per assegnare la richiesta
  const assignMutation = useMutation({
    mutationFn: async (data: { professionalId: string; notes?: string }) => {
      return api.post(`/requests/${request.id}/assign`, data);
    },
    onSuccess: () => {
      toast.success('Richiesta assegnata con successo!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', request.id] });
      onClose();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore durante l\'assegnazione');
    }
  });

  const handleAssign = () => {
    if (!selectedProfessional) {
      toast.error('Seleziona un professionista');
      return;
    }

    assignMutation.mutate({
      professionalId: selectedProfessional,
      notes: notes.trim() || undefined
    });
  };

  if (!isOpen || !request) return null;

  const professionals = professionalsData || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Assegna Richiesta
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* Request Info */}
            <div className="mb-6 rounded-lg bg-gray-50 p-4">
              <h4 className="font-medium text-gray-900">{request.title}</h4>
              <p className="mt-1 text-sm text-gray-600">{request.description}</p>
              <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <UserIcon className="mr-1 h-4 w-4" />
                  {request.client?.fullName}
                </span>
                <span className="flex items-center">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  {new Date(request.createdAt).toLocaleDateString('it-IT')}
                </span>
                {request.priority === 'URGENT' && (
                  <span className="flex items-center text-red-600">
                    <ExclamationTriangleIcon className="mr-1 h-4 w-4" />
                    Urgente
                  </span>
                )}
              </div>
            </div>

            {/* Professional Selection */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleziona Professionista
                </label>
                
                {loadingProfessionals ? (
                  <div className="text-center py-4">
                    <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Caricamento professionisti...</p>
                  </div>
                ) : professionals.length === 0 ? (
                  <div className="text-center py-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mx-auto" />
                    <p className="mt-2 text-sm text-yellow-800">
                      Nessun professionista disponibile per questa sottocategoria
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {professionals.map((prof: any) => (
                      <label
                        key={prof.user.id}
                        className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedProfessional === prof.user.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="professional"
                            value={prof.user.id}
                            checked={selectedProfessional === prof.user.id}
                            onChange={(e) => setSelectedProfessional(e.target.value)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">
                              {prof.user.fullName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {prof.user.city}, {prof.user.province}
                            </p>
                            {prof.experienceYears && (
                              <p className="text-xs text-gray-400 mt-1">
                                {prof.experienceYears} anni di esperienza
                              </p>
                            )}
                          </div>
                        </div>
                        {prof.user.hourlyRate && (
                          <span className="text-sm font-medium text-gray-600">
                            €{prof.user.hourlyRate}/ora
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (opzionale)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Aggiungi note per il professionista..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedProfessional || assignMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {assignMutation.isPending ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></div>
                    Assegnazione...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Assegna Richiesta
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}