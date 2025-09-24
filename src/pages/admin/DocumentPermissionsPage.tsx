import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';
import {
  ShieldCheckIcon,
  UserGroupIcon,
  DocumentIcon,
  LockClosedIcon,
  LockOpenIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface Permission {
  id: string;
  role: string;
  documentType: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canShare: boolean;
  canDownload: boolean;
  canPrint: boolean;
}

export default function DocumentPermissionsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    role: 'CLIENT',
    documentType: '',
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canApprove: false,
    canShare: false,
    canDownload: false,
    canPrint: false
  });

  const roles = ['CLIENT', 'PROFESSIONAL', 'ADMIN', 'SUPER_ADMIN'];
  
  // Placeholder data
  const permissions: Permission[] = [];

  // Carica statistiche
  const { data: stats } = useQuery({
    queryKey: ['permission-stats'],
    queryFn: async () => {
      const response = await api.get('/admin/document-permissions/stats');
      return response.data?.data || { permissions: { total: 0 } };
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Permesso salvato con successo');
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      role: 'CLIENT',
      documentType: '',
      canView: false,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      canShare: false,
      canDownload: false,
      canPrint: false
    });
    setSelectedPermission(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Permessi Documenti</h1>
            <p className="mt-1 text-sm text-gray-600">
              Configura i permessi per ruolo e tipo di documento
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuovo Permesso
          </button>
        </div>

        {/* Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Permessi Configurati</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats?.permissions?.total || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Ruoli</p>
                <p className="text-2xl font-semibold text-gray-900">4</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Tipi Documento</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <LockClosedIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm text-gray-600">Restrizioni Attive</p>
                <p className="text-2xl font-semibold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matrice Permessi */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Matrice Permessi</h2>
        </div>
        
        {permissions.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun permesso configurato</h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia configurando i permessi per ruolo e tipo documento.
            </p>
            <div className="mt-6">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Configura Permessi
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ruolo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo Doc</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Visualizza</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Crea</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Modifica</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Elimina</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Approva</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Condividi</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Azioni</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Rows here */}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedPermission ? 'Modifica Permessi' : 'Nuovi Permessi'}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ruolo</label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                    >
                      {roles.map(role => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo Documento</label>
                    <input
                      type="text"
                      required
                      value={formData.documentType}
                      onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
                      placeholder="Es. CONTRACT, INVOICE..."
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Permessi</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['canView', 'canCreate', 'canEdit', 'canDelete', 'canApprove', 'canShare', 'canDownload', 'canPrint'].map(permission => (
                      <div key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData[permission as keyof typeof formData] as boolean}
                          onChange={(e) => setFormData({ ...formData, [permission]: e.target.checked })}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          {permission.replace('can', '')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Salva Permessi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
