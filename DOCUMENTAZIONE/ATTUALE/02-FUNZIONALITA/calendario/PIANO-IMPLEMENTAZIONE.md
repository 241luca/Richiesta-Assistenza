# 🚀 PIANO DI IMPLEMENTAZIONE CALENDARIO

**Data**: 27 Settembre 2025  
**Priorità**: Alta  
**Tempo stimato**: 4-6 ore

---

## 📋 AZIONI DA INTRAPRENDERE

### ✅ FASE 1: FIX CRITICI (1-2 ore)
**Obiettivo**: Rendere il calendario utilizzabile senza errori

#### 1.1 Correzione InterventionModal.tsx
```javascript
// DA FARE:
// 1. Cambiare endpoint richieste
'/assistance-requests' → '/requests'

// 2. Rimuovere fetch clienti non autorizzato
// Sostituire con form manuale inserimento cliente

// 3. Disabilitare temporaneamente check conflitti
// Commentare useEffect che chiama checkConflictsMutation
```

#### 1.2 Fix Backend Routes
```typescript
// calendar.routes.ts - AGGIUNGERE:
// Endpoint per richieste del professionista
router.get('/my-requests', authenticate, async (req, res) => {
  const requests = await requestService.getByProfessionalId(req.user.id);
  return res.json(ResponseFormatter.success(requests));
});
```

---

### 🔧 FASE 2: IMPLEMENTAZIONI NECESSARIE (2-3 ore)
**Obiettivo**: Completare funzionalità mancanti

#### 2.1 Backend - Check Conflitti
```typescript
// calendar.service.ts - AGGIUNGERE:
export async function checkTimeConflicts(
  professionalId: string,
  start: Date,
  end: Date,
  excludeId?: string
) {
  const conflicts = await prisma.scheduledIntervention.findMany({
    where: {
      professionalId,
      status: { not: 'cancelled' },
      id: excludeId ? { not: excludeId } : undefined,
      OR: [
        {
          // Conflitto: nuovo intervento inizia durante esistente
          proposedDate: { lte: start },
          confirmedDate: { gte: start }
        },
        {
          // Conflitto: nuovo intervento finisce durante esistente
          proposedDate: { lte: end },
          confirmedDate: { gte: end }
        },
        {
          // Conflitto: nuovo intervento contiene esistente
          proposedDate: { gte: start },
          confirmedDate: { lte: end }
        }
      ]
    },
    include: {
      request: {
        include: {
          client: true,
          category: true
        }
      }
    }
  });
  
  return conflicts;
}

// calendar.routes.ts - AGGIUNGERE:
router.post('/check-conflicts', authenticate, async (req, res) => {
  try {
    const { start, end, excludeId } = req.body;
    
    if (!start || !end) {
      return res.status(400).json(
        ResponseFormatter.error('Date richieste', 'MISSING_DATES')
      );
    }
    
    const conflicts = await calendarService.checkTimeConflicts(
      req.user.id,
      new Date(start),
      new Date(end),
      excludeId
    );
    
    return res.json(ResponseFormatter.success({
      hasConflicts: conflicts.length > 0,
      conflicts: conflicts.map(c => ({
        id: c.id,
        start: c.proposedDate,
        end: c.confirmedDate,
        title: c.request?.title || 'Intervento',
        client: c.request?.client?.fullName
      }))
    }));
  } catch (error) {
    logger.error('Error checking conflicts:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore verifica conflitti', 'CHECK_ERROR')
    );
  }
});
```

#### 2.2 Backend - Clienti del Professionista
```typescript
// client.service.ts - AGGIUNGERE:
export async function getClientsForProfessional(professionalId: string) {
  // Trova tutti i clienti da richieste assegnate al professionista
  const requests = await prisma.assistanceRequest.findMany({
    where: {
      professionalId
    },
    select: {
      client: {
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          address: true,
          city: true
        }
      }
    },
    distinct: ['clientId']
  });
  
  return requests.map(r => r.client).filter(Boolean);
}

// user.routes.ts - AGGIUNGERE:
router.get('/my-clients', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'PROFESSIONAL') {
      return res.status(403).json(
        ResponseFormatter.error('Solo professionisti', 'FORBIDDEN')
      );
    }
    
    const clients = await clientService.getClientsForProfessional(req.user.id);
    return res.json(ResponseFormatter.success(clients));
  } catch (error) {
    logger.error('Error fetching clients:', error);
    return res.status(500).json(
      ResponseFormatter.error('Errore recupero clienti', 'FETCH_ERROR')
    );
  }
});
```

---

### 🎨 FASE 3: MIGLIORAMENTI UX (1 ora)
**Obiettivo**: Migliorare l'esperienza utente

#### 3.1 InterventionModal - Versione Migliorata
```javascript
// Autocomplete cliente esistente
const [isNewClient, setIsNewClient] = useState(false);

// Select per clienti esistenti
{!isNewClient ? (
  <select 
    value={formData.clientId}
    onChange={(e) => setFormData({...formData, clientId: e.target.value})}
  >
    <option value="">Seleziona cliente...</option>
    {myClients?.map(client => (
      <option key={client.id} value={client.id}>
        {client.fullName} - {client.city}
      </option>
    ))}
  </select>
) : (
  // Form nuovo cliente
  <div>
    <input placeholder="Nome cliente" />
    <input placeholder="Email" />
    <input placeholder="Telefono" />
  </div>
)}

// Visualizzazione conflitti in tempo reale
{conflicts?.hasConflicts && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
    <p className="text-red-700 font-medium">⚠️ Conflitto di orario!</p>
    <ul className="text-sm text-red-600 mt-1">
      {conflicts.conflicts.map(c => (
        <li key={c.id}>
          {c.title} - {c.client} ({dayjs(c.start).format('HH:mm')})
        </li>
      ))}
    </ul>
  </div>
)}
```

#### 3.2 Calendario - Evidenziare Conflitti
```javascript
// ProfessionalCalendar.tsx
const eventClassNames = (arg) => {
  const classes = [];
  
  // Controlla conflitti
  if (hasConflictWithOthers(arg.event)) {
    classes.push('conflict-event'); // Bordo rosso
  }
  
  if (arg.event.extendedProps.urgent) {
    classes.push('urgent-event'); // Animazione pulse
  }
  
  return classes;
};
```

---

## 🧪 TEST DA ESEGUIRE

### Test Manuali
1. **Creazione intervento**
   - [ ] Modal si apre senza errori
   - [ ] Form si compila correttamente
   - [ ] Salvataggio funziona
   - [ ] Intervento appare nel calendario

2. **Gestione conflitti**
   - [ ] Warning se sovrapposizione oraria
   - [ ] Possibilità di salvare comunque
   - [ ] Visualizzazione conflitti nel calendario

3. **Selezione cliente**
   - [ ] Lista clienti esistenti
   - [ ] Possibilità nuovo cliente
   - [ ] Dati cliente salvati correttamente

### Test Automatici (da implementare)
```javascript
// __tests__/calendar.test.js
describe('Calendar Interventions', () => {
  it('should create intervention without conflicts', async () => {
    // Test creazione
  });
  
  it('should detect time conflicts', async () => {
    // Test conflitti
  });
  
  it('should handle client selection', async () => {
    // Test clienti
  });
});
```

---

## 📊 METRICHE DI SUCCESSO

- **Zero errori in console** quando si apre il modal
- **Tutti gli endpoint rispondono** con status 200/201
- **Interventi salvati** appaiono nel calendario
- **Conflitti rilevati** prima del salvataggio
- **UX fluida** senza interruzioni

---

## ⚠️ RISCHI E MITIGAZIONI

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|------------|---------|-------------|
| Breaking changes | Media | Alto | Backup prima di modifiche |
| Conflitti non rilevati | Bassa | Medio | Validazione lato server |
| Performance degradata | Bassa | Basso | Ottimizzazione query |
| Dati inconsistenti | Media | Alto | Transaction database |

---

## 📝 DOCUMENTAZIONE DA AGGIORNARE

Dopo implementazione:
1. `API-ENDPOINTS.md` - Nuovi endpoint
2. `DATABASE-SCHEMA.md` - Se modifiche schema
3. `USER-GUIDE.md` - Nuove funzionalità
4. `CHANGELOG.md` - Versione e modifiche

---

**Approvato da**: Da approvare  
**Inizio lavori**: Da definire  
**Deadline**: Da definire
