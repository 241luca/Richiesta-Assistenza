import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  EyeIcon,
  EyeSlashIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { api } from '../../services/api';
import toast from 'react-hot-toast';

export default function ContactVisibilitySettings() {
  const queryClient = useQueryClient();
  
  // Carica impostazioni attuali
  const { data: settings, isLoading } = useQuery({
    queryKey: ['contact-visibility'],
    queryFn: () => api.get('/professional/contact-visibility'),
  });

  const [formData, setFormData] = useState({
    // Telefoni
    showPersonalPhone: false,
    showCompanyPhone: true,
    
    // Email
    showPersonalEmail: false,
    showCompanyEmail: true,
    showPec: false,
    
    // Indirizzi
    showPersonalAddress: false,
    showBusinessAddress: true,
    
    // Orari e note
    preferredContactHours: '',
    contactNotes: ''
  });

  // Aggiorna settings quando arrivano dal server
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put('/professional/contact-visibility', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-visibility'] });
      toast.success('Impostazioni salvate con successo!');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verifica che almeno un contatto sia visibile
    const hasPhone = formData.showPersonalPhone || formData.showCompanyPhone;
    const hasEmail = formData.showPersonalEmail || formData.showCompanyEmail || formData.showPec;
    
    if (!hasPhone || !hasEmail) {
      toast.error('Devi rendere visibile almeno un telefono e un\'email');
      return;
    }
    
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="animate-pulse">Caricamento...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="text-xl font-semibold">Visibilità Contatti</h2>
          <p className="text-sm text-gray-600 mt-1">
            Scegli quali informazioni di contatto mostrare ai clienti
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Come funziona:</p>
                <ul className="space-y-1 ml-4">
                  <li>• I clienti vedranno solo i contatti che scegli di rendere visibili</li>
                  <li>• Consigliamo di mostrare almeno un telefono e un'email</li>
                  <li>• I contatti professionali sono visibili di default</li>
                  <li>• Puoi modificare queste impostazioni in qualsiasi momento</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sezione Telefoni */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <PhoneIcon className="h-5 w-5 mr-2" />
              Numeri di Telefono
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showPersonalPhone}
                    onChange={(e) => setFormData({...formData, showPersonalPhone: e.target.checked})}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Telefono Personale</span>
                    <p className="text-sm text-gray-500">+39 333 1234567</p>
                  </div>
                </div>
                {formData.showPersonalPhone ? (
                  <EyeIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                )}
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showCompanyPhone}
                    onChange={(e) => setFormData({...formData, showCompanyPhone: e.target.checked})}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Telefono Professionale</span>
                    <p className="text-sm text-gray-500">+39 02 12345678</p>
                  </div>
                </div>
                {formData.showCompanyPhone ? (
                  <EyeIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                )}
              </label>
            </div>
          </div>

          {/* Sezione Email */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <EnvelopeIcon className="h-5 w-5 mr-2" />
              Indirizzi Email
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showPersonalEmail}
                    onChange={(e) => setFormData({...formData, showPersonalEmail: e.target.checked})}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Email Personale</span>
                    <p className="text-sm text-gray-500">mario.rossi@gmail.com</p>
                  </div>
                </div>
                {formData.showPersonalEmail ? (
                  <EyeIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                )}
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showCompanyEmail}
                    onChange={(e) => setFormData({...formData, showCompanyEmail: e.target.checked})}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Email Professionale</span>
                    <p className="text-sm text-gray-500">info@mariorossi.it</p>
                  </div>
                </div>
                {formData.showCompanyEmail ? (
                  <EyeIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                )}
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showPec}
                    onChange={(e) => setFormData({...formData, showPec: e.target.checked})}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">PEC</span>
                    <p className="text-sm text-gray-500">mario.rossi@pec.it</p>
                  </div>
                </div>
                {formData.showPec ? (
                  <EyeIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                )}
              </label>
            </div>
          </div>

          {/* Sezione Indirizzi */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Indirizzi
            </h3>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showPersonalAddress}
                    onChange={(e) => setFormData({...formData, showPersonalAddress: e.target.checked})}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Indirizzo di Residenza</span>
                    <p className="text-sm text-gray-500">Via Roma 123, Milano</p>
                  </div>
                </div>
                {formData.showPersonalAddress ? (
                  <EyeIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                )}
              </label>

              <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.showBusinessAddress}
                    onChange={(e) => setFormData({...formData, showBusinessAddress: e.target.checked})}
                    className="mr-3 h-4 w-4 text-blue-600"
                  />
                  <div>
                    <span className="font-medium">Indirizzo Professionale/Sede</span>
                    <p className="text-sm text-gray-500">Via Milano 456, Milano</p>
                  </div>
                </div>
                {formData.showBusinessAddress ? (
                  <EyeIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                )}
              </label>
            </div>
          </div>

          {/* Orari e Note */}
          <div>
            <h3 className="text-lg font-medium mb-4 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Preferenze di Contatto
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orari Preferiti di Contatto
                </label>
                <input
                  type="text"
                  value={formData.preferredContactHours}
                  onChange={(e) => setFormData({...formData, preferredContactHours: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Es: Lun-Ven 9:00-18:00, Sab 9:00-13:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note per i Clienti
                  <span className="text-xs text-gray-500 ml-2">(opzionale)</span>
                </label>
                <textarea
                  value={formData.contactNotes}
                  onChange={(e) => setFormData({...formData, contactNotes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Es: Preferisco WhatsApp per comunicazioni urgenti. Per preventivi dettagliati contattatemi via email."
                />
              </div>
            </div>
          </div>

          {/* Preview Box */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-3">Anteprima - Cosa vedranno i clienti:</h4>
            <div className="bg-white rounded p-3 space-y-2 text-sm">
              {(formData.showPersonalPhone || formData.showCompanyPhone) && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {formData.showCompanyPhone && 'Tel: 02 12345678'}
                    {formData.showPersonalPhone && formData.showCompanyPhone && ' / '}
                    {formData.showPersonalPhone && '333 1234567'}
                  </span>
                </div>
              )}
              
              {(formData.showPersonalEmail || formData.showCompanyEmail || formData.showPec) && (
                <div className="flex items-center">
                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>
                    {formData.showCompanyEmail && 'info@mariorossi.it'}
                    {formData.showPec && ' (PEC: mario.rossi@pec.it)'}
                  </span>
                </div>
              )}
              
              {formData.preferredContactHours && (
                <div className="flex items-center">
                  <ClockIcon className="h-4 w-4 mr-2 text-gray-500" />
                  <span>{formData.preferredContactHours}</span>
                </div>
              )}
              
              {formData.contactNotes && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  {formData.contactNotes}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <>Salvataggio...</>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5 inline mr-2" />
                  Salva Impostazioni
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
