import React, { useState } from 'react';
import { XMarkIcon, ClockIcon, CalendarDaysIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { api } from '../../../services/api';

interface AvailabilityManagerProps {
  onClose: () => void;
}

interface WorkingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Unavailability {
  id?: string;
  startDate: string;
  endDate: string;
  reason: string;
  description: string;
  allDay: boolean;
}

const daysOfWeek = [
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
  { value: 0, label: 'Domenica' }
];

export default function AvailabilityManager({ onClose }: AvailabilityManagerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'working-hours' | 'unavailability'>('working-hours');
  
  // Inizializza editingHours con array vuoto per evitare errori
  const [editingHours, setEditingHours] = useState<WorkingHours[]>(
    // Crea orari default se non esistono
    daysOfWeek.map(day => ({
      dayOfWeek: day.value,
      startTime: day.value === 0 ? '' : '09:00',
      endTime: day.value === 0 ? '' : '18:00',
      isActive: day.value !== 0 // Attivo tutti i giorni tranne domenica
    }))
  );
  
  const [newUnavailability, setNewUnavailability] = useState<Unavailability>({
    startDate: '',
    endDate: '',
    reason: '',
    description: '',
    allDay: true
  });

  // Fetch orari di lavoro
  const { data: workingHours, isLoading: loadingHours } = useQuery({
    queryKey: ['professional-availability'],
    queryFn: async () => {
      const response = await api.get('/calendar/availability');
      return response.data;
    }
  });

  // Fetch giorni di chiusura
  const { data: unavailabilities, isLoading: loadingUnavailabilities } = useQuery({
    queryKey: ['professional-unavailability'],
    queryFn: async () => {
      const response = await api.get('/calendar/unavailability');
      return response.data;
    }
  });

  // Mutation per salvare orari di lavoro
  const saveWorkingHoursMutation = useMutation({
    mutationFn: async (hours: WorkingHours[]) => {
      return await api.put('/calendar/availability', { workingHours: hours });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['professional-availability']);
      toast.success('Orari di lavoro aggiornati');
    },
    onError: () => {
      toast.error('Errore nel salvare gli orari');
    }
  });

  // Mutation per aggiungere giorni di chiusura
  const addUnavailabilityMutation = useMutation({
    mutationFn: async (data: Unavailability) => {
      return await api.post('/calendar/unavailability', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['professional-unavailability']);
      toast.success('Periodo di chiusura aggiunto');
      setNewUnavailability({
        startDate: '',
        endDate: '',
        reason: '',
        description: '',
        allDay: true
      });
    },
    onError: () => {
      toast.error('Errore nell\'aggiungere il periodo di chiusura');
    }
  });

  // Mutation per rimuovere giorni di chiusura
  const deleteUnavailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      return await api.delete(`/calendar/unavailability/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['professional-unavailability']);
      toast.success('Periodo di chiusura rimosso');
    }
  });

  // Inizializza gli orari di lavoro per la modifica
  React.useEffect(() => {
    if (workingHours?.data && Array.isArray(workingHours.data)) {
      // Se abbiamo dati dal backend, usiamo quelli
      setEditingHours(workingHours.data);
    } else if (workingHours && Array.isArray(workingHours)) {
      // Se workingHours è già un array
      setEditingHours(workingHours);
    }
    // Altrimenti manteniamo i valori di default già impostati nell'inizializzazione
  }, [workingHours]);

  const handleWorkingHoursChange = (dayOfWeek: number, field: string, value: any) => {
    setEditingHours(prev => prev.map(h => 
      h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
    ));
  };

  const handleSaveWorkingHours = () => {
    saveWorkingHoursMutation.mutate(editingHours);
  };

  const handleAddUnavailability = () => {
    if (!newUnavailability.startDate || !newUnavailability.endDate || !newUnavailability.reason) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    addUnavailabilityMutation.mutate(newUnavailability);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            <ClockIcon className="w-6 h-6 mr-2" />
            Gestione Disponibilità
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
              onClick={() => setActiveTab('working-hours')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'working-hours'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Orari di Lavoro
            </button>
            <button
              onClick={() => setActiveTab('unavailability')}
              className={`py-2 px-6 border-b-2 font-medium text-sm ${
                activeTab === 'unavailability'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Giorni di Chiusura
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'working-hours' ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Configura i tuoi orari di lavoro standard per ogni giorno della settimana.
                Questi orari verranno utilizzati per mostrare la tua disponibilità ai clienti.
              </p>

              {loadingHours ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {daysOfWeek.map(day => {
                    // Usa sempre un array, anche se vuoto
                    const hours = Array.isArray(editingHours) 
                      ? editingHours.find(h => h.dayOfWeek === day.value)
                      : undefined;
                    
                    return (
                      <div key={day.value} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        <div className="w-32">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={hours?.isActive || false}
                              onChange={(e) => handleWorkingHoursChange(day.value, 'isActive', e.target.checked)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                              {day.label}
                            </span>
                          </label>
                        </div>
                        
                        {hours?.isActive && (
                          <>
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-600">Dalle:</label>
                              <input
                                type="time"
                                value={hours.startTime}
                                onChange={(e) => handleWorkingHoursChange(day.value, 'startTime', e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                            <div className="flex items-center space-x-2">
                              <label className="text-sm text-gray-600">Alle:</label>
                              <input
                                type="time"
                                value={hours.endTime}
                                onChange={(e) => handleWorkingHoursChange(day.value, 'endTime', e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveWorkingHours}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Salva Orari di Lavoro
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Form per aggiungere chiusure */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center">
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Aggiungi Periodo di Chiusura
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Inizio*
                    </label>
                    <input
                      type="date"
                      value={newUnavailability.startDate}
                      onChange={(e) => setNewUnavailability({ ...newUnavailability, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Fine*
                    </label>
                    <input
                      type="date"
                      value={newUnavailability.endDate}
                      onChange={(e) => setNewUnavailability({ ...newUnavailability, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo*
                    </label>
                    <select
                      value={newUnavailability.reason}
                      onChange={(e) => setNewUnavailability({ ...newUnavailability, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Seleziona...</option>
                      <option value="vacation">Ferie</option>
                      <option value="sick">Malattia</option>
                      <option value="training">Formazione</option>
                      <option value="personal">Personale</option>
                      <option value="other">Altro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tutto il giorno
                    </label>
                    <div className="mt-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newUnavailability.allDay}
                          onChange={(e) => setNewUnavailability({ ...newUnavailability, allDay: e.target.checked })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Giornata intera</span>
                      </label>
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Descrizione
                    </label>
                    <textarea
                      value={newUnavailability.description}
                      onChange={(e) => setNewUnavailability({ ...newUnavailability, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Note aggiuntive..."
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleAddUnavailability}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Aggiungi Chiusura
                  </button>
                </div>
              </div>

              {/* Lista chiusure esistenti */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Periodi di Chiusura Programmati</h3>
                
                {loadingUnavailabilities ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                  </div>
                ) : unavailabilities && unavailabilities.length > 0 ? (
                  <div className="space-y-2">
                    {unavailabilities.map((unavail: any) => (
                      <div key={unavail.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(unavail.startDate).toLocaleDateString('it-IT')} - {new Date(unavail.endDate).toLocaleDateString('it-IT')}
                          </div>
                          <div className="text-sm text-gray-600">
                            {unavail.reason === 'vacation' && '🏖️ Ferie'}
                            {unavail.reason === 'sick' && '🤒 Malattia'}
                            {unavail.reason === 'training' && '📚 Formazione'}
                            {unavail.reason === 'personal' && '👤 Personale'}
                            {unavail.reason === 'other' && '📝 Altro'}
                            {unavail.description && ` - ${unavail.description}`}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteUnavailabilityMutation.mutate(unavail.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Nessun periodo di chiusura programmato
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
