import React from 'react';
import { Button } from '../ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  title: string;
  message: string;
  containerName: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  title,
  message,
  containerName,
  loading,
  onConfirm,
  onCancel
}: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {message}
            </p>
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
              <p className="text-sm font-medium text-red-800">
                Container: <span className="font-bold">{containerName}</span>
              </p>
            </div>
            <p className="text-xs text-gray-500">
              ⚠️ <strong>ATTENZIONE:</strong> Tutti i documenti associati verranno eliminati. Questa operazione non può essere annullata.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Annulla
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Eliminazione...
              </>
            ) : (
              'Elimina'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
