import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  DocumentCheckIcon,
  RocketLaunchIcon,
  CalendarIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface VersionWorkflowProps {
  version: any;
  documentId: string;
  onStatusChange?: () => void;
}

export default function LegalDocumentVersionWorkflow({ 
  version, 
  documentId,
  onStatusChange 
}: VersionWorkflowProps) {
  const queryClient = useQueryClient();
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  const [publishDate, setPublishDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [notifyUsers, setNotifyUsers] = useState(true);

  // Mutation per approvare la versione
  const approveMutation = useMutation({
    mutationFn: async (versionId: string) => {
      return api.put(`/admin/legal-documents/versions/${versionId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-document', documentId] });
      toast.success('Versione approvata con successo!');
      setShowConfirmDialog(null);
      onStatusChange?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'approvazione');
    }
  });

  // Mutation per pubblicare la versione
  const publishMutation = useMutation({
    mutationFn: async (data: { versionId: string; notifyUsers: boolean; publishDate?: string }) => {
      return api.post(`/admin/legal-documents/versions/${data.versionId}/publish`, {
        notifyUsers: data.notifyUsers,
        publishDate: data.publishDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-document', documentId] });
      toast.success('Versione pubblicata con successo!');
      setShowConfirmDialog(null);
      onStatusChange?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella pubblicazione');
    }
  });

  // Mutation per rifiutare/archiviare la versione
  const rejectMutation = useMutation({
    mutationFn: async (versionId: string) => {
      return api.put(`/admin/legal-documents/versions/${versionId}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-document', documentId] });
      toast.success('Versione archiviata');
      setShowConfirmDialog(null);
      onStatusChange?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nell\'operazione');
    }
  });

  // Mutation per revocare la pubblicazione
  const unpublishMutation = useMutation({
    mutationFn: async (versionId: string) => {
      return api.put(`/admin/legal-documents/versions/${versionId}/unpublish`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['legal-document', documentId] });
      toast.success('Pubblicazione revocata');
      setShowConfirmDialog(null);
      onStatusChange?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Errore nella revoca');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <ClockIcon className="w-4 h-4 mr-1" />
            Bozza
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Approvata
          </span>
        );
      case 'PUBLISHED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <RocketLaunchIcon className="w-4 h-4 mr-1" />
            Pubblicata
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            <XCircleIcon className="w-4 h-4 mr-1" />
            Archiviata
          </span>
        );
      default:
        return null;
    }
  };

  const canApprove = version.status === 'DRAFT';
  const canPublish = version.status === 'APPROVED';
  const canUnpublish = version.status === 'PUBLISHED';
  const canReject = version.status === 'DRAFT' || version.status === 'APPROVED';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Workflow Versione {version.version}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Gestisci lo stato e la pubblicazione della versione
            </p>
          </div>
          <div>{getStatusBadge(version.status)}</div>
        </div>
      </div>

      {/* Current Status Info */}
      <div className="px-6 py-4 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Creata da:</span>
            <p className="font-medium text-gray-900">
              {version.creator?.fullName || 'N/D'}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(version.createdAt).toLocaleString('it-IT')}
            </p>
          </div>
          
          {version.approver && (
            <div>
              <span className="text-gray-500">Approvata da:</span>
              <p className="font-medium text-gray-900">
                {version.approver.fullName}
              </p>
              <p className="text-xs text-gray-500">
                {version.approvedAt && new Date(version.approvedAt).toLocaleString('it-IT')}
              </p>
            </div>
          )}
          
          {version.publisher && (
            <div>
              <span className="text-gray-500">Pubblicata da:</span>
              <p className="font-medium text-gray-900">
                {version.publisher.fullName}
              </p>
              <p className="text-xs text-gray-500">
                {version.publishedAt && new Date(version.publishedAt).toLocaleString('it-IT')}
              </p>
            </div>
          )}

          {version.effectiveDate && (
            <div>
              <span className="text-gray-500">Data Effettiva:</span>
              <p className="font-medium text-gray-900">
                {new Date(version.effectiveDate).toLocaleDateString('it-IT')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4">
        <div className="flex flex-wrap gap-3">
          {canApprove && (
            <button
              onClick={() => setShowConfirmDialog('approve')}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              Approva Versione
            </button>
          )}

          {canPublish && (
            <button
              onClick={() => setShowConfirmDialog('publish')}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RocketLaunchIcon className="w-5 h-5 mr-2" />
              Pubblica Versione
            </button>
          )}

          {canUnpublish && (
            <button
              onClick={() => setShowConfirmDialog('unpublish')}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <XCircleIcon className="w-5 h-5 mr-2" />
              Revoca Pubblicazione
            </button>
          )}

          {canReject && (
            <button
              onClick={() => setShowConfirmDialog('reject')}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XMarkIcon className="w-5 h-5 mr-2" />
              Archivia Versione
            </button>
          )}
        </div>

        {/* Info Messages */}
        {version.status === 'DRAFT' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="ml-3 text-sm text-blue-900">
                <p className="font-medium">Versione in bozza</p>
                <p className="mt-1">
                  Questa versione deve essere approvata prima di poter essere pubblicata.
                  L'approvazione conferma che il contenuto è stato revisionato e validato.
                </p>
              </div>
            </div>
          </div>
        )}

        {version.status === 'APPROVED' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="ml-3 text-sm text-green-900">
                <p className="font-medium">Versione approvata</p>
                <p className="mt-1">
                  Questa versione è pronta per essere pubblicata. 
                  Una volta pubblicata, sarà visibile agli utenti e potranno accettarla.
                </p>
              </div>
            </div>
          </div>
        )}

        {version.status === 'PUBLISHED' && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex">
              <RocketLaunchIcon className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="ml-3 text-sm text-green-900">
                <p className="font-medium">Versione attualmente pubblicata</p>
                <p className="mt-1">
                  Questa versione è visibile agli utenti. 
                  {version._count?.acceptances > 0 && (
                    <span className="font-medium">
                      {' '}È stata accettata da {version._count.acceptances} utenti.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialogs */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              {showConfirmDialog === 'approve' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Conferma Approvazione
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sei sicuro di voler approvare questa versione? 
                    Una volta approvata, potrà essere pubblicata.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirmDialog(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(version.id)}
                      disabled={approveMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {approveMutation.isPending ? 'Approvazione...' : 'Approva'}
                    </button>
                  </div>
                </>
              )}

              {showConfirmDialog === 'publish' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Pubblica Versione
                  </h3>
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data di Pubblicazione
                      </label>
                      <input
                        type="date"
                        value={publishDate}
                        onChange={(e) => setPublishDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Lascia la data odierna per pubblicare immediatamente
                      </p>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={notifyUsers}
                          onChange={(e) => setNotifyUsers(e.target.checked)}
                          className="h-4 w-4 text-green-600 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Notifica tutti gli utenti della nuova versione
                        </span>
                      </label>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                        La pubblicazione renderà questa versione visibile a tutti gli utenti.
                        Le versioni precedenti verranno archiviate automaticamente.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirmDialog(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => publishMutation.mutate({
                        versionId: version.id,
                        notifyUsers,
                        publishDate: publishDate === new Date().toISOString().split('T')[0] 
                          ? undefined 
                          : publishDate
                      })}
                      disabled={publishMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {publishMutation.isPending ? 'Pubblicazione...' : 'Pubblica'}
                    </button>
                  </div>
                </>
              )}

              {showConfirmDialog === 'unpublish' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Revoca Pubblicazione
                  </h3>
                  <div className="mb-6">
                    <p className="text-gray-600 mb-3">
                      Sei sicuro di voler revocare la pubblicazione di questa versione?
                    </p>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <p className="text-sm text-red-800">
                        <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                        Gli utenti non potranno più visualizzare o accettare questo documento.
                        Le accettazioni esistenti rimarranno valide.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirmDialog(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => unpublishMutation.mutate(version.id)}
                      disabled={unpublishMutation.isPending}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      {unpublishMutation.isPending ? 'Revoca in corso...' : 'Revoca Pubblicazione'}
                    </button>
                  </div>
                </>
              )}

              {showConfirmDialog === 'reject' && (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Archivia Versione
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sei sicuro di voler archiviare questa versione? 
                    Non sarà più possibile approvarla o pubblicarla.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirmDialog(null)}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Annulla
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(version.id)}
                      disabled={rejectMutation.isPending}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      {rejectMutation.isPending ? 'Archiviazione...' : 'Archivia'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
