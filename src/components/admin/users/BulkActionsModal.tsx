import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface BulkActionsModalProps {
  selectedCount: number;
  onClose: () => void;
  onAction: (action: string, reason?: string) => void;
}

export default function BulkActionsModal({ selectedCount, onClose, onAction }: BulkActionsModalProps) {
  const [selectedAction, setSelectedAction] = useState('');
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const actions = [
    { value: 'activate', label: 'Attiva utenti', color: 'text-green-600', dangerous: false },
    { value: 'deactivate', label: 'Disattiva utenti', color: 'text-orange-600', dangerous: false },
    { value: 'verify_email', label: 'Verifica email', color: 'text-blue-600', dangerous: false },
    { value: 'send_welcome_email', label: 'Invia email benvenuto', color: 'text-blue-600', dangerous: false },
    { value: 'block', label: 'Blocca utenti', color: 'text-red-600', dangerous: true },
    { value: 'unblock', label: 'Sblocca utenti', color: 'text-green-600', dangerous: false },
    { value: 'delete', label: 'Elimina utenti', color: 'text-red-800', dangerous: true }
  ];

  const handleActionSelect = (action: string) => {
    setSelectedAction(action);
    const actionConfig = actions.find(a => a.value === action);
    if (actionConfig?.dangerous) {
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    if (selectedAction === 'block' && !reason) {
      alert('Inserisci un motivo per il blocco');
      return;
    }
    onAction(selectedAction, reason);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="relative my-8 mx-auto p-6 w-full max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Azioni di Massa</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {!showConfirm ? (
          <>
            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Hai selezionato <strong>{selectedCount}</strong> utent{selectedCount === 1 ? 'e' : 'i'}.
                Seleziona l'azione da eseguire:
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {actions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => handleActionSelect(action.value)}
                  className={`w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between ${
                    action.dangerous ? 'border-red-200 hover:bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <span className={action.color}>{action.label}</span>
                  {action.dangerous && (
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  )}
                </button>
              ))}
            </div>

            {/* Cancel */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-900">Conferma azione</h4>
                  <p className="text-sm text-red-800 mt-1">
                    Stai per eseguire un'azione su {selectedCount} utent{selectedCount === 1 ? 'e' : 'i'}.
                    Questa azione potrebbe non essere reversibile.
                  </p>
                </div>
              </div>
            </div>

            {selectedAction === 'block' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo del blocco *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Inserisci il motivo del blocco..."
                />
              </div>
            )}

            {selectedAction === 'delete' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Gli utenti verranno disattivati e bloccati, non eliminati fisicamente dal database.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Indietro
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Conferma ed Esegui
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}