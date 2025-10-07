import React, { useState } from 'react';
import { XMarkIcon, CogIcon, BellIcon, PaintBrushIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../../../services/api';

interface CalendarSettingsProps {
  onClose: () => void;
}

export default function CalendarSettings({ onClose }: CalendarSettingsProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'appearance'>('general');

  // Fetch impostazioni correnti
  const { data: settings, isLoading } = useQuery({
    queryKey: ['calendar-settings'],
    queryFn: async () => {
      const response = await api.get('/calendar/settings');
      return response.data;
    }
  });

  const [formData, setFormData] = useState({
    defaultView: 'week',
    weekStartsOn: 1,
    timeSlotDuration: 30,
    minTime: '08:00',
    maxTime: '20:00',
    showWeekends: true,
    defaultInterventionDuration: 60,
    defaultBufferTime: 15,
    maxConcurrentInterventions: 1,
    autoConfirmInterventions: false,
    sendReminders: true,
    reminderTiming: [1440, 60],
    timeZone: 'Europe/Rome',
    colorScheme: {
      pending: '#FFA500',
      confirmed: '#4CAF50',
      completed: '#808080',
      cancelled: '#FF0000'
    }
  });

  React.useEffect(() => {
    if (settings?.data) {
      // Merge con i valori di default per garantire che tutti i campi siano definiti
      setFormData(prev => ({
        ...prev,
        ...settings.data,
        // Assicurati che colorScheme esista sempre
        colorScheme: settings.data.colorScheme || prev.colorScheme,
        // Assicurati che reminderTiming sia sempre un array
        reminderTiming: Array.isArray(settings.data.reminderTiming) 
          ? settings.data.reminderTiming 
          : prev.reminderTiming
      }));
    } else if (settings && typeof settings === 'object') {
      // Se settings non è wrappato in data
      setFormData(prev => ({
        ...prev,
        ...settings,
        colorScheme: settings.colorScheme || prev.colorScheme,
        reminderTiming: Array.isArray(settings.reminderTiming) 
          ? settings.reminderTiming 
          : prev.reminderTiming
      }));
    }
  }, [settings]);

  // Mutation per salvare le impostazioni
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return await api.put('/calendar/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-settings']);
      toast.success('Impostazioni salvate con successo');
      onClose();
    },
    onError: () => {
      toast.error('Errore nel salvare le impostazioni');
    }
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(formData);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleColorChange = (status: string, color: string) => {
    setFormData(prev => ({
      ...prev,
      colorScheme: {
        ...(prev.colorScheme || {}),
        [status]: color
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            <CogIcon className="w-6 h-6 mr-2" />
            Impostazioni Calendario
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CogIcon className="w-4 h-4 inline mr-2" />
              Generali
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <BellIcon className="w-4 h-4 inline mr-2" />
              Notifiche
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'appearance'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <PaintBrushIcon className="w-4 h-4 inline mr-2" />
              Aspetto
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Generali</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vista predefinita
                    </label>
                    <select
                      value={formData.defaultView}
                      onChange={(e) => handleChange('defaultView', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="day">Giorno</option>
                      <option value="week">Settimana</option>
                      <option value="month">Mese</option>
                      <option value="list">Lista</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Primo giorno della settimana
                    </label>
                    <select
                      value={formData.weekStartsOn}
                      onChange={(e) => handleChange('weekStartsOn', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="0">Domenica</option>
                      <option value="1">Lunedì</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durata slot (minuti)
                    </label>
                    <select
                      value={formData.timeSlotDuration}
                      onChange={(e) => handleChange('timeSlotDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="15">15 minuti</option>
                      <option value="30">30 minuti</option>
                      <option value="60">60 minuti</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fuso orario
                    </label>
                    <select
                      value={formData.timeZone}
                      onChange={(e) => handleChange('timeZone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Europe/Rome">Roma (UTC+1)</option>
                      <option value="Europe/London">Londra (UTC+0)</option>
                      <option value="America/New_York">New York (UTC-5)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orario inizio giornata
                    </label>
                    <input
                      type="time"
                      value={formData.minTime}
                      onChange={(e) => handleChange('minTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Orario fine giornata
                    </label>
                    <input
                      type="time"
                      value={formData.maxTime}
                      onChange={(e) => handleChange('maxTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.showWeekends}
                      onChange={(e) => handleChange('showWeekends', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Mostra weekend</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.autoConfirmInterventions}
                      onChange={(e) => handleChange('autoConfirmInterventions', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Conferma automatica interventi</span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tempi Predefiniti</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durata intervento standard (minuti)
                    </label>
                    <input
                      type="number"
                      value={formData.defaultInterventionDuration}
                      onChange={(e) => handleChange('defaultInterventionDuration', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tempo buffer tra interventi (minuti)
                    </label>
                    <input
                      type="number"
                      value={formData.defaultBufferTime}
                      onChange={(e) => handleChange('defaultBufferTime', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max interventi contemporanei
                    </label>
                    <input
                      type="number"
                      value={formData.maxConcurrentInterventions}
                      onChange={(e) => handleChange('maxConcurrentInterventions', parseInt(e.target.value))}
                      min="1"
                      max="5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Impostazioni Notifiche</h3>
                
                <div className="space-y-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sendReminders}
                      onChange={(e) => handleChange('sendReminders', e.target.checked)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Invia promemoria automatici</span>
                  </label>

                  {formData.sendReminders && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tempi di promemoria (seleziona multipli)
                        </label>
                        <div className="space-y-2">
                          {[
                            { value: 15, label: '15 minuti prima' },
                            { value: 30, label: '30 minuti prima' },
                            { value: 60, label: '1 ora prima' },
                            { value: 120, label: '2 ore prima' },
                            { value: 1440, label: '1 giorno prima' },
                            { value: 2880, label: '2 giorni prima' }
                          ].map(option => (
                            <label key={option.value} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={Array.isArray(formData.reminderTiming) && formData.reminderTiming.includes(option.value)}
                                onChange={(e) => {
                                  const currentTimings = Array.isArray(formData.reminderTiming) ? formData.reminderTiming : [];
                                  if (e.target.checked) {
                                    handleChange('reminderTiming', [...currentTimings, option.value]);
                                  } else {
                                    handleChange('reminderTiming', currentTimings.filter(t => t !== option.value));
                                  }
                                }}
                                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Notifiche per Evento</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Nuovo intervento programmato</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Modifica intervento</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Cancellazione intervento</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" defaultChecked className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
                      <span className="ml-2 text-sm text-gray-700">Conferma cliente</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Colori Stati Intervento</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Personalizza i colori utilizzati per distinguere i diversi stati degli interventi nel calendario.
                </p>
                
                <div className="space-y-3">
                  {formData.colorScheme && Object.entries(formData.colorScheme).map(([status, color]) => (
                    <div key={status} className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {status === 'pending' && 'In attesa'}
                        {status === 'confirmed' && 'Confermato'}
                        {status === 'completed' && 'Completato'}
                        {status === 'cancelled' && 'Cancellato'}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => handleColorChange(status, e.target.value)}
                          className="h-8 w-16 border border-gray-300 rounded cursor-pointer"
                        />
                        <span className="text-xs text-gray-500 font-mono">{color}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Anteprima</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {formData.colorScheme && Object.entries(formData.colorScheme).map(([status, color]) => (
                      <div 
                        key={status}
                        className="px-3 py-2 rounded text-white text-sm font-medium"
                        style={{ backgroundColor: color }}
                      >
                        Esempio intervento - {status === 'pending' && 'In attesa'}
                        {status === 'confirmed' && 'Confermato'}
                        {status === 'completed' && 'Completato'}
                        {status === 'cancelled' && 'Cancellato'}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Salva Impostazioni
          </button>
        </div>
      </div>
    </div>
  );
}
