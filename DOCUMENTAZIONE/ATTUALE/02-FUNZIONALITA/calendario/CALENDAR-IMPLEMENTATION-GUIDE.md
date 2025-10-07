# 🛠️ CALENDAR IMPLEMENTATION GUIDE - Guida Tecnica

**Versione**: 2.0.0  
**Data**: 03 Ottobre 2025  
**Tipo**: Technical Documentation

## 📋 SOMMARIO ESECUTIVO

Il sistema calendario è stato completamente ripristinato e migliorato il 03/10/2025. Questa guida fornisce tutti i dettagli tecnici per manutenzione e sviluppo futuro.

---

## 🔧 IMPLEMENTAZIONE TECNICA

### 1. Setup Iniziale

#### Dipendenze Frontend
```bash
npm install @fullcalendar/react @fullcalendar/core
npm install @fullcalendar/daygrid @fullcalendar/timegrid 
npm install @fullcalendar/interaction @fullcalendar/list
npm install dayjs uuid
```

#### Import Componente
```typescript
// In ProfessionalCalendarPage.tsx
import ProfessionalCalendar from '../../components/professional/calendar/ProfessionalCalendar';

// Uso base
<ProfessionalCalendar />
```

### 2. Struttura Dati

#### Intervention Interface
```typescript
interface ScheduledIntervention {
  id: string;
  requestId: string;
  professionalId: string;
  proposedDate: Date;
  confirmedDate?: Date;
  completedDate?: Date;
  description?: string;
  estimatedDuration: number; // minuti
  actualDuration?: number;
  status: InterventionStatus;
  clientConfirmed: boolean;
  clientDeclineReason?: string;
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relazioni
  request?: Request;
  professional?: User;
  createdByUser?: User;
}

enum InterventionStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
```

### 3. API Calls

#### Fetch Interventi
```typescript
// React Query hook
const { data: interventions, isLoading, refetch } = useQuery({
  queryKey: ['professional-interventions', filters],
  queryFn: async () => {
    const response = await api.get('/calendar/interventions', {
      params: {
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        category: filters.category
      }
    });
    return response.data;
  },
  staleTime: 5 * 60 * 1000, // 5 minuti cache
  refetchInterval: 2 * 60 * 1000 // Auto-refresh ogni 2 min
});
```

#### Crea Intervento
```typescript
const createIntervention = useMutation({
  mutationFn: async (data) => {
    const payload = {
      requestId: data.requestId,
      interventions: [{
        proposedDate: data.proposedDate,
        description: data.description,
        estimatedDuration: data.estimatedDuration || 60
      }]
    };
    
    return await api.post('/scheduled-interventions', payload);
  },
  onSuccess: () => {
    queryClient.invalidateQueries(['professional-interventions']);
    toast.success('Intervento creato con successo');
  },
  onError: (error) => {
    toast.error(error.response?.data?.message || 'Errore creazione');
  }
});
```

### 4. WebSocket Events

#### Listener Setup
```typescript
useEffect(() => {
  const socket = getSocket();
  
  // Ascolta eventi interventi
  socket.on('intervention:proposed', handleNewIntervention);
  socket.on('intervention:accepted', handleAcceptedIntervention);
  socket.on('intervention:rejected', handleRejectedIntervention);
  socket.on('intervention:updated', handleUpdatedIntervention);
  
  return () => {
    socket.off('intervention:proposed');
    socket.off('intervention:accepted');
    socket.off('intervention:rejected');
    socket.off('intervention:updated');
  };
}, []);
```

#### Handler Eventi
```typescript
const handleNewIntervention = (data) => {
  // Invalida cache per forzare refresh
  queryClient.invalidateQueries(['professional-interventions']);
  
  // Mostra notifica
  toast.info(`Nuovo intervento proposto per ${data.clientName}`);
};
```

---

## 🐛 DEBUG & TROUBLESHOOTING

### Debug Mode
```javascript
// Abilita debug in console
localStorage.setItem('DEBUG_CALENDAR', 'true');

// Questo attiverà log dettagliati:
// - Caricamento interventi
// - Eventi calendario
// - Conflitti rilevati
// - WebSocket messages
```

### Problemi Frequenti e Soluzioni

#### 1. Interventi Non Visibili
```typescript
// Verifica 1: Token JWT valido
console.log('User ID:', user?.id);

// Verifica 2: Query Response
const response = await api.get('/calendar/interventions');
console.log('Interventions:', response.data);

// Verifica 3: Date Range
console.log('Calendar view:', {
  start: calendarRef.current?.getApi().view.currentStart,
  end: calendarRef.current?.getApi().view.currentEnd
});
```

#### 2. Errore 500 su Creazione
```typescript
// Il problema era in scheduledInterventionService.ts
// SOLUZIONE: Usa file originale senza modifiche a notificationService
// File corretto salvato in: backend/src/services/scheduledInterventionService.ts
```

#### 3. Modal Non Si Apre
```typescript
// Verifica stato modal
console.log('Modal state:', showInterventionModal);

// Verifica richieste disponibili
console.log('Available requests:', availableRequests);
```

#### 4. Conflitti Non Rilevati
```typescript
// Test endpoint conflitti
const checkConflict = async (date) => {
  const response = await api.get('/calendar/check-conflicts', {
    params: {
      professionalId: user.id,
      startDate: date,
      endDate: dayjs(date).add(60, 'minute').toISOString()
    }
  });
  console.log('Conflict check:', response.data);
};
```

### Console Commands Utili
```javascript
// Pulisci cache calendario
queryClient.removeQueries(['professional-interventions']);

// Force refresh
queryClient.invalidateQueries(['professional-interventions']);

// Ottieni stato corrente
const currentState = queryClient.getQueryData(['professional-interventions']);
console.log('Current interventions:', currentState);

// Reset calendario
calendarRef.current?.getApi().refetchEvents();
```

---

## 🔄 MIGRAZIONE DA VECCHIA VERSIONE

Se stai migrando da una versione precedente del calendario:

### 1. Backup Database
```bash
pg_dump -U postgres -d richiesta_assistenza > backup_calendar.sql
```

### 2. Migrazione Schema
```sql
-- Se mancano campi nella tabella ScheduledIntervention
ALTER TABLE "ScheduledIntervention" 
ADD COLUMN IF NOT EXISTS "confirmedDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "completedDate" TIMESTAMP,
ADD COLUMN IF NOT EXISTS "actualDuration" INTEGER,
ADD COLUMN IF NOT EXISTS "clientDeclineReason" TEXT;
```

### 3. Update Frontend
```bash
# Rimuovi vecchie dipendenze
npm uninstall react-big-calendar

# Installa FullCalendar
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @fullcalendar/list
```

### 4. Migrazione Componenti
```typescript
// VECCHIO (react-big-calendar)
<BigCalendar
  events={events}
  startAccessor="start"
  endAccessor="end"
/>

// NUOVO (FullCalendar)
<FullCalendar
  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
  initialView="dayGridMonth"
  events={events}
/>
```

---

## 📊 MONITORAGGIO PERFORMANCE

### Metriche da Tracciare
```typescript
// Tempo caricamento calendario
console.time('calendar-load');
// ... caricamento
console.timeEnd('calendar-load'); // Target: < 2s

// Numero interventi caricati
console.log('Interventions count:', interventions.length);

// Memory usage
console.log('Memory:', performance.memory);
```

### Ottimizzazioni Applicate
1. **React.memo** su componenti pesanti
2. **useMemo** per calcoli costosi
3. **Lazy loading** dei plugin FullCalendar
4. **Debouncing** su filtri ricerca
5. **Virtual scrolling** per liste lunghe

---

## 🔐 SICUREZZA

### Autorizzazioni
```typescript
// Backend verifica sempre:
1. User è autenticato (JWT valido)
2. User è un PROFESSIONAL
3. Interventi appartengono al professional
4. Richiesta è assegnata al professional
```

### Validazione Input
```typescript
// Zod schema per creazione
const createInterventionSchema = z.object({
  requestId: z.string().uuid(),
  interventions: z.array(z.object({
    proposedDate: z.string().datetime(),
    description: z.string().optional(),
    estimatedDuration: z.number().min(15).max(480)
  })).min(1).max(10)
});
```

---

## 📝 CHECKLIST DEPLOYMENT

- [ ] Variabili ambiente configurate
- [ ] Database migrations eseguite
- [ ] Dipendenze frontend installate
- [ ] Build di produzione testata
- [ ] WebSocket configurato per produzione
- [ ] SSL/HTTPS attivo
- [ ] Backup database configurato
- [ ] Monitoring attivo
- [ ] Test E2E passati
- [ ] Documentazione aggiornata

---

## 🆘 SUPPORTO

Per problemi con il calendario:

1. **Controlla i log**
   - Frontend: Browser Console (F12)
   - Backend: `tail -f backend/logs/app.log`

2. **Verifica configurazione**
   - `.env` file corretto
   - Database connesso
   - Redis running per sessioni

3. **Test isolati**
   - Prova endpoint con Postman
   - Test componente in Storybook
   - Query diretta database

4. **Contatti sviluppo**
   - Email: lucamambelli@lmtecnologie.it
   - GitHub Issues: /Richiesta-Assistenza/issues

---

**Fine Documentazione Tecnica**  
**Sistema Calendario v2.0.0**  
**03 Ottobre 2025**
