import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ViewGridIcon,
  ViewListIcon,
  CogIcon,
  ArrowPathIcon,
  BellIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import { api } from '../../../services/api';
import InterventionModal from './InterventionModal';
import CalendarSettings from './CalendarSettings';
import AvailabilityManager from './AvailabilityManager';
import GoogleCalendarSync from './GoogleCalendarSync';
import CalendarFilters from './CalendarFilters';
import CalendarLegend from './CalendarLegend';
import SkeletonCalendar from './SkeletonCalendar';
import EmptyState from './EmptyState';
import ErrorBanner from './ErrorBanner';
import LoadingBadge from './LoadingBadge';
import CalendarStats from './CalendarStats';
import UpcomingInterventions from './UpcomingInterventions';

// Configurazione italiana per FullCalendar
const calendarConfig = {
  locale: 'it',
  buttonText: {
    today: 'Oggi',
    month: 'Mese',
    week: 'Settimana',
    day: 'Giorno',
    list: 'Lista'
  },
  weekText: 'Sett.',
  allDayText: 'Tutto il giorno',
  moreLinkText: 'altri',
  noEventsText: 'Nessun intervento programmato'
};

// Colori per categorie di interventi
const categoryColors = {
  pending: '#FFA500',      // Arancione - In attesa
  confirmed: '#4CAF50',    // Verde - Confermato
  inProgress: '#2196F3',   // Blu - In corso
  completed: '#808080',    // Grigio - Completato
  cancelled: '#FF0000',    // Rosso - Cancellato
  urgent: '#FF1744',       // Rosso acceso - Urgente
  maintenance: '#9C27B0',  // Viola - Manutenzione
  consultation: '#00BCD4'  // Ciano - Consulenza
};

export default function ProfessionalCalendar() {
  const calendarRef = useRef(null);
  const queryClient = useQueryClient();
  const [currentView, setCurrentView] = useState('timeGridWeek');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [showGoogleSync, setShowGoogleSync] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });

  // Fetch interventi programmati
  const { data: interventionsResponse, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['professional-interventions', filters],
    queryFn: async () => {
      const response = await api.get('/calendar/interventions', { params: filters });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minuti
    refetchInterval: 1000 * 60 * 2 // Refresh ogni 2 minuti
  });

  // Estrai gli interventi dalla risposta
  const interventions = interventionsResponse?.data || [];

  // Fetch impostazioni calendario
  const { data: calendarSettingsResponse } = useQuery({
    queryKey: ['calendar-settings'],
    queryFn: async () => {
      const response = await api.get('/calendar/settings');
      return response.data;
    }
  });

  // Estrai le impostazioni dalla risposta
  const calendarSettings = calendarSettingsResponse?.data;

  // Mutation per creare/aggiornare interventi
  const createInterventionMutation = useMutation({
    mutationFn: async (data) => {
      // Il backend si aspetta un formato specifico per gli interventi schedulati
      const formattedData = {
        requestId: data.requestId,
        interventions: [{
          proposedDate: data.proposedDate || data.startDate,
          description: data.description || data.title,
          estimatedDuration: data.estimatedDuration || 60
        }]
      };
      
      // Usa l'endpoint corretto per gli interventi schedulati
      if (data.id) {
        return await api.put(`/scheduled-interventions/${data.id}`, formattedData);
      }
      return await api.post('/scheduled-interventions', formattedData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['professional-interventions']);
      toast.success('Intervento salvato con successo');
      setShowInterventionModal(false);
    },
    onError: (error) => {
      console.error('Error saving intervention:', error);
      toast.error(error.response?.data?.message || 'Errore nel salvare l\'intervento');
    }
  });

  // Mutation per drag & drop
  const updateInterventionDateMutation = useMutation({
    mutationFn: async ({ id, start, end }) => {
      return await api.patch(`/calendar/interventions/${id}/reschedule`, { start, end });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['professional-interventions']);
      toast.success('Intervento riprogrammato');
    },
    onError: () => {
      toast.error('Errore nella riprogrammazione');
      refetch(); // Ricarica per ripristinare la posizione originale
    }
  });

  // Trasforma i dati per FullCalendar
  const calendarEvents = (interventions || []).map(intervention => ({
    id: intervention.id,
    title: intervention.title || `${intervention.client?.fullName} - ${intervention.category?.name}`,
    start: intervention.start || intervention.startDate || intervention.proposedDate,
    end: intervention.end || intervention.endDate || dayjs(intervention.proposedDate).add(intervention.estimatedDuration || 60, 'minute').toISOString(),
    color: categoryColors[intervention.status] || '#3B82F6',
    extendedProps: {
      ...intervention,
      location: intervention.address,
      client: intervention.client,
      status: intervention.status,
      notes: intervention.notes,
      price: intervention.price
    },
    classNames: [
      `status-${intervention.status}`,
      intervention.urgent && 'urgent',
      intervention.clientConfirmed && 'confirmed'
    ].filter(Boolean)
  })) || [];

  // Handler per il click su un evento
  const handleEventClick = (info) => {
    setSelectedIntervention(info.event.extendedProps);
    setShowInterventionModal(true);
  };

  // Handler per il drag & drop
  const handleEventDrop = (info) => {
    const { event } = info;
    
    // Verifica conflitti orari
    const hasConflict = checkTimeConflict(event.start, event.end, event.id);
    
    if (hasConflict) {
      toast.error('Conflitto di orario con un altro intervento');
      info.revert();
      return;
    }

    // Conferma lo spostamento
    if (window.confirm(`Spostare l'intervento a ${dayjs(event.start).format('DD/MM/YYYY HH:mm')}?`)) {
      updateInterventionDateMutation.mutate({
        id: event.id,
        start: event.start,
        end: event.end
      });
    } else {
      info.revert();
    }
  };

  // Handler per la selezione di uno slot libero
  const handleDateSelect = (info) => {
    setSelectedIntervention({
      start: info.start,
      end: info.end,
      allDay: info.allDay,
      // ✅ FIX: Aggiungi anche startDate per il modale
      startDate: info.start,
      proposedDate: info.start
    });
    setShowInterventionModal(true);
  };

  // Verifica conflitti di orario
  const checkTimeConflict = (start, end, excludeId = null) => {
    return interventions?.some(intervention => {
      if (intervention.id === excludeId) return false;
      
      const intStart = new Date(intervention.startDate || intervention.proposedDate);
      const intEnd = new Date(intervention.endDate || 
        dayjs(intervention.proposedDate).add(intervention.estimatedDuration || 60, 'minute').toISOString()
      );
      
      return (start < intEnd && end > intStart);
    }) || false;
  };

  // Handler per il cambio di vista
  const handleViewChange = (view) => {
    setCurrentView(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  };

  // Navigazione calendario
  const handleNavigate = (action) => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      switch(action) {
        case 'prev':
          calendarApi.prev();
          break;
        case 'next':
          calendarApi.next();
          break;
        case 'today':
          calendarApi.today();
          break;
      }
    }
  };

  // Sincronizzazione con Google Calendar
  const syncWithGoogle = async () => {
    try {
      toast.loading('Sincronizzazione in corso...');
      await api.post('/calendar/google/sync');
      await refetch();
      toast.success('Sincronizzazione completata');
    } catch (error) {
      toast.error('Errore nella sincronizzazione');
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header con controlli */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CalendarIcon className="w-7 h-7 mr-2 text-blue-600" />
              Calendario Interventi
            </h1>
            
            {/* Navigazione calendario */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleNavigate('prev')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleNavigate('today')}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Oggi
              </button>
              <button
                onClick={() => handleNavigate('next')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Selettore vista */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleViewChange('dayGridMonth')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'dayGridMonth' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Mese
              </button>
              <button
                onClick={() => handleViewChange('timeGridWeek')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'timeGridWeek' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Settimana
              </button>
              <button
                onClick={() => handleViewChange('timeGridDay')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'timeGridDay' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Giorno
              </button>
              <button
                onClick={() => handleViewChange('listWeek')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  currentView === 'listWeek' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Lista
              </button>
            </div>
          </div>

          {/* Azioni */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGoogleSync(true)}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              title="Sincronizza con Google Calendar"
            >
              <ArrowPathIcon className="w-5 h-5 mr-2" />
              Sincronizza
            </button>
            
            <button
              onClick={() => setShowAvailability(true)}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ClockIcon className="w-5 h-5 mr-2" />
              Disponibilità
            </button>
            
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <CogIcon className="w-5 h-5 mr-2" />
              Impostazioni
            </button>
            
            <button
              onClick={() => setShowInterventionModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nuovo Intervento
            </button>
          </div>
        </div>

        {/* Filtri */}
        <CalendarFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Layout principale */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar sinistra con mini calendario e legenda */}
        <div className="w-64 bg-white border-r p-4 space-y-4 overflow-y-auto">
          {/* Mini calendario per navigazione rapida */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Navigazione Rapida</h3>
            <div className="text-xs">
              {/* Qui potremmo aggiungere un mini calendario */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, idx) => (
                  <div key={idx} className="font-semibold text-gray-600">{day}</div>
                ))}
                {/* Giorni del mese corrente */}
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <button
                    key={day}
                    className="p-1 hover:bg-blue-100 rounded text-gray-700"
                    onClick={() => {
                      const calendarApi = calendarRef.current?.getApi();
                      if (calendarApi) {
                        const date = new Date();
                        date.setDate(day);
                        calendarApi.gotoDate(date);
                      }
                    }}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Legenda colori */}
          <CalendarLegend />

          {/* ✅ FIX PROBLEMA 3: Statistiche dinamiche */}
          <CalendarStats interventions={interventions} />

          {/* ✅ FIX PROBLEMA 3: Prossimi appuntamenti ottimizzati */}
          <UpcomingInterventions 
            interventions={interventions}
            onInterventionClick={(intervention) => {
              setSelectedIntervention(intervention);
              setShowInterventionModal(true);
            }}
          />
        </div>

        {/* Calendario principale */}
        <div className="flex-1 p-4 bg-white">
          {/* Primo caricamento: mostra skeleton */}
          {isLoading && !interventionsResponse && <SkeletonCalendar />}
          
          {/* Errore di rete: mostra banner con retry */}
          {isError && (
            <ErrorBanner
              error={error}
              onRetry={refetch}
              message="Impossibile caricare gli interventi del calendario"
            />
          )}
          
          {/* ✅ FIX: Mostra SEMPRE il calendario, anche se vuoto */}
          {!isLoading && !isError && (
            <>
              {/* Banner informativo se non ci sono interventi */}
              {interventions?.length === 0 && (
                <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    📅 Nessun intervento programmato al momento. 
                    <button
                      onClick={() => setShowInterventionModal(true)}
                      className="font-semibold underline hover:text-blue-900 ml-1"
                    >
                      Clicca qui per crearne uno
                    </button>
                    {' '}oppure clicca su uno slot vuoto nel calendario.
                  </p>
                </div>
              )}
              
              <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={currentView}
              headerToolbar={false} // Usiamo il nostro header custom
              locale="it"
              firstDay={1} // Lunedì come primo giorno
              height="100%"
              events={calendarEvents}
              editable={true}
              droppable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={true}
              weekends={calendarSettings?.showWeekends !== false}
              slotMinTime={calendarSettings?.minTime || '08:00'}
              slotMaxTime={calendarSettings?.maxTime || '20:00'}
              slotDuration={`00:${calendarSettings?.timeSlotDuration || 30}:00`}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              select={handleDateSelect}
              eventResize={handleEventDrop}
              businessHours={calendarSettings?.businessHours}
              nowIndicator={true}
              eventDidMount={(info) => {
                // ✅ FIX: Tooltip semplificato senza HTML
                const event = info.event;
                const tooltipContent = [
                  event.title,
                  event.extendedProps.location ? `📍 ${event.extendedProps.location}` : null,
                  event.extendedProps.notes || null
                ].filter(Boolean).join(' | ');
                
                // Usa il title HTML nativo per il tooltip
                info.el.setAttribute('title', tooltipContent);
              }}
              eventClassNames={(arg) => {
                const classes = [];
                if (arg.event.extendedProps.urgent) classes.push('urgent-event');
                if (arg.event.extendedProps.clientConfirmed) classes.push('confirmed-event');
                return classes;
              }}
              {...calendarConfig}
            />
          </>
          )}
          
          {/* Refresh indicator: badge discreto durante refresh automatico */}
          {isFetching && !isLoading && <LoadingBadge />}
        </div>
      </div>

      {/* Modali */}
      {showInterventionModal && (
        <InterventionModal
          intervention={selectedIntervention}
          onClose={() => {
            setShowInterventionModal(false);
            setSelectedIntervention(null);
          }}
          onSave={(data) => createInterventionMutation.mutate(data)}
        />
      )}

      {showSettings && (
        <CalendarSettings
          onClose={() => setShowSettings(false)}
        />
      )}

      {showAvailability && (
        <AvailabilityManager
          onClose={() => setShowAvailability(false)}
        />
      )}

      {showGoogleSync && (
        <GoogleCalendarSync
          onClose={() => setShowGoogleSync(false)}
        />
      )}

      {/* Stili custom per FullCalendar */}
      <style>{`
        .fc-event {
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .fc-event:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .urgent-event {
          animation: pulse 2s infinite;
          border-left: 4px solid #FF1744 !important;
        }
        
        .confirmed-event {
          border-left: 4px solid #4CAF50 !important;
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .fc-timegrid-slot {
          height: 40px;
        }
        
        .fc-col-header-cell {
          background-color: #F3F4F6;
          font-weight: 600;
        }
        
        .fc-scrollgrid {
          border: 1px solid #E5E7EB;
          border-radius: 0.5rem;
        }
        
        .fc-event-main {
          padding: 2px 4px;
        }
        
        .fc-daygrid-event {
          white-space: normal;
        }
        
        .fc-list-event:hover td {
          background-color: #F3F4F6;
        }
        
        /* Evidenzia l'ora corrente */
        .fc-timegrid-now-indicator-line {
          border-color: #EF4444;
          border-width: 2px;
        }
        
        .fc-timegrid-now-indicator-arrow {
          border-top-color: #EF4444;
        }
        
        /* Stile per i giorni non lavorativi */
        .fc-day-sat, .fc-day-sun {
          background-color: #F9FAFB;
        }
      `}</style>
    </div>
  );
}
