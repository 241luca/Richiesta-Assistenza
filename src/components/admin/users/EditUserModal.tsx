import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { api } from '../../../services/api';
import { toast } from 'react-hot-toast';

interface EditUserModalProps {
  user: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditUserModal({ user, onClose, onSuccess }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
    province: user.province || '',
    postalCode: user.postalCode || '',
    codiceFiscale: user.codiceFiscale || '',
    partitaIva: user.partitaIva || '',
    profession: user.profession || '',
    hourlyRate: user.hourlyRate || '',
    workRadius: user.workRadius || '',
    canSelfAssign: user.canSelfAssign || false,
    emailVerified: user.emailVerified || false,
    isActive: user.isActive !== false,
    blocked: user.blocked || false,
    blockedReason: user.blockedReason || ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = 'Email obbligatoria';
    if (!formData.email.includes('@')) newErrors.email = 'Email non valida';
    if (!formData.firstName) newErrors.firstName = 'Nome obbligatorio';
    if (!formData.lastName) newErrors.lastName = 'Cognome obbligatorio';

    if (formData.role === 'PROFESSIONAL' && !formData.profession) {
      newErrors.profession = 'Professione obbligatoria per professionisti';
    }

    if (formData.blocked && !formData.blockedReason) {
      newErrors.blockedReason = 'Motivo del blocco obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate.toString()) : undefined,
        workRadius: formData.workRadius ? parseInt(formData.workRadius.toString()) : undefined
      };

      await api.put(`/admin/users/${user.id}`, dataToSend);
      toast.success('Utente aggiornato con successo');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Errore nell\'aggiornamento utente');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Modifica Utente</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stato account */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Stato Account</h4>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="rounded mr-2"
                />
                <span className="text-sm">Attivo</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="emailVerified"
                  checked={formData.emailVerified}
                  onChange={handleChange}
                  className="rounded mr-2"
                />
                <span className="text-sm">Email Verificata</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="blocked"
                  checked={formData.blocked}
                  onChange={handleChange}
                  className="rounded mr-2"
                />
                <span className="text-sm text-red-600">Bloccato</span>
              </label>
            </div>

            {formData.blocked && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700">
                  Motivo del blocco *
                </label>
                <textarea
                  name="blockedReason"
                  value={formData.blockedReason}
                  onChange={handleChange}
                  rows={2}
                  className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                    errors.blockedReason ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.blockedReason && (
                  <p className="text-red-500 text-xs mt-1">{errors.blockedReason}</p>
                )}
              </div>
            )}
          </div>

          {/* Dati base */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nome *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.firstName && (
                <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cognome *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.lastName && (
                <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email e Ruolo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Ruolo *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="CLIENT">Cliente</option>
                <option value="PROFESSIONAL">Professionista</option>
                <option value="ADMIN">Amministratore</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </div>
          </div>

          {/* Contatti */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Telefono
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Città
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Indirizzo */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Indirizzo
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Provincia
              </label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                maxLength={2}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="RM"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CAP
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                maxLength={5}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Codice Fiscale
              </label>
              <input
                type="text"
                name="codiceFiscale"
                value={formData.codiceFiscale}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* Campi professionista */}
          {formData.role === 'PROFESSIONAL' && (
            <>
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Dati Professionali</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Professione *
                    </label>
                    <input
                      type="text"
                      name="profession"
                      value={formData.profession}
                      onChange={handleChange}
                      className={`mt-1 block w-full border rounded-lg px-3 py-2 ${
                        errors.profession ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.profession && (
                      <p className="text-red-500 text-xs mt-1">{errors.profession}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      name="partitaIva"
                      value={formData.partitaIva}
                      onChange={handleChange}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Tariffa oraria (€)
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Raggio operativo (km)
                    </label>
                    <input
                      type="number"
                      name="workRadius"
                      value={formData.workRadius}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="canSelfAssign"
                      checked={formData.canSelfAssign}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Può auto-assegnarsi le richieste
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}