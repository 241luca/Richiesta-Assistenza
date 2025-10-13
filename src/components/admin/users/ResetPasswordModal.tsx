import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { api } from '../../../services/api';
import toast from 'react-hot-toast';
import { z } from 'zod';

interface ResetPasswordModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

const passwordSchema = z.object({
  newPassword: z.string().min(8, 'La password deve essere almeno 8 caratteri'),
  confirmPassword: z.string(),
  sendEmail: z.boolean()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"]
});

export default function ResetPasswordModal({ user, onClose, onSuccess }: ResetPasswordModalProps) {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    sendEmail: true
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Valida i dati
      passwordSchema.parse(formData);
      setErrors({});
      
      setLoading(true);
      
      // Invia richiesta
      await api.post(`/admin/users/${user.id}/reset-password`, {
        newPassword: formData.newPassword,
        sendEmail: formData.sendEmail
      });
      
      toast.success('Password reimpostata con successo');
      if (formData.sendEmail) {
        toast.success('Email di notifica inviata all\'utente');
      }
      
      onSuccess();
  } catch (error: any) {
    if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          const field = issue.path?.[0] as string | undefined;
          if (field) {
            fieldErrors[field] = issue.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error(error.response?.data?.message || 'Errore nel reset della password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="relative my-8 mx-auto p-6 w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
            <p className="text-sm text-gray-600 mt-1">
              Utente: {user.fullName} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 p-2"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nuova Password *
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2 ${
                errors.newPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Minimo 8 caratteri"
              disabled={loading}
            />
            {errors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conferma Password *
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2 ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ripeti la password"
              disabled={loading}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.sendEmail}
                onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                className="rounded mr-2"
                disabled={loading}
              />
              <span className="text-sm text-blue-800">
                Invia email di notifica all'utente
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Reimpostazione...' : 'Reimposta Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}