# 🔍 ANALISI TECNICA ERRORI CALENDARIO

**Data Analisi**: 27 Settembre 2025  
**Componente**: InterventionModal.tsx  
**Severità**: Alta

---

## 🐛 ERRORI RILEVATI

### Errore 1: Endpoint Inesistente
```
GET http://localhost:3200/api/assistance-requests?status=ASSIGNED 
Status: 404 (Not Found)
```

**Causa**: L'endpoint `/api/assistance-requests` non esiste nel backend.  
**Posizione nel codice**: InterventionModal.tsx, linea 74

```javascript
// Codice errato
const { data: requests } = useQuery({
  queryKey: ['open-requests'],
  queryFn: async () => {
    const response = await api.get('/assistance-requests?status=ASSIGNED');
    return response.data;
  }
});
```

**Soluzione corretta**:
```javascript
// L'endpoint corretto è /api/requests
const response = await api.get('/requests?status=ASSIGNED&professionalId=' + userId);
```

---

### Errore 2: Accesso Non Autorizzato
```
GET http://localhost:3200/api/users?role=CLIENT
Status: 403 (Forbidden)
```

**Causa**: Un professionista non ha i permessi per visualizzare tutti i clienti del sistema.  
**Posizione nel codice**: InterventionModal.tsx, linea 56

```javascript
// Codice errato
const { data: clients } = useQuery({
  queryKey: ['clients'],
  queryFn: async () => {
    const response = await api.get('/users?role=CLIENT');
    return response.data;
  }
});
```

**Analisi**: Questo è un problema di sicurezza. I professionisti dovrebbero vedere solo:
- I propri clienti (da richieste assegnate)
- I clienti con cui hanno già lavorato

---

### Errore 3: Endpoint Non Implementato
```
POST http://localhost:3200/api/calendar/check-conflicts
Status: 500 (Internal Server Error)
```

**Causa**: L'endpoint per il controllo conflitti non è stato implementato nel backend.  
**Posizione nel codice**: InterventionModal.tsx, linea 82

```javascript
// Codice che causa l'errore
const checkConflictsMutation = useMutation({
  mutationFn: async (data: any) => {
    const response = await api.post('/calendar/check-conflicts', data);
    return response.data;
  }
});
```

**Implementazione necessaria nel backend**:
```typescript
// calendar.routes.ts - DA AGGIUNGERE
router.post('/check-conflicts', authenticate, async (req, res) => {
  const { start, end, excludeId } = req.body;
  const conflicts = await calendarService.checkTimeConflicts(
    req.user.id,
    start, 
    end,
    excludeId
  );
  return res.json(ResponseFormatter.success(conflicts));
});
```

---

## 📊 IMPATTO DEGLI ERRORI

### Funzionalità Bloccate
1. **Creazione interventi da richieste esistenti**: Non può selezionare richieste
2. **Selezione cliente**: Non può vedere lista clienti
3. **Verifica conflitti orari**: Non può prevenire sovrapposizioni

### User Experience
- Modal si apre ma con errori in console
- Form parzialmente funzionante
- Impossibile collegare intervento a richiesta esistente
- Rischio di sovrapposizioni orarie

---

## 🛠️ PIANO DI RISOLUZIONE

### Fase 1: Fix Immediato (Priorità Alta)
1. **Correggere endpoint richieste**
   - Cambiare `/api/assistance-requests` → `/api/requests`
   - Aggiungere filtro per professionalId

2. **Rimuovere fetch clienti non autorizzato**
   - Sostituire con input manuale cliente
   - O implementare endpoint per clienti del professionista

3. **Disabilitare temporaneamente check conflitti**
   - Commentare la mutation
   - Aggiungere TODO per implementazione futura

### Fase 2: Implementazione Completa (Priorità Media)
1. **Backend - Implementare check conflitti**
   ```typescript
   // calendar.service.ts
   async checkTimeConflicts(
     professionalId: string,
     start: Date,
     end: Date,
     excludeId?: string
   ) {
     return await prisma.scheduledIntervention.findMany({
       where: {
         professionalId,
         id: excludeId ? { not: excludeId } : undefined,
         OR: [
           {
             proposedDate: { lte: end },
             confirmedDate: { gte: start }
           }
         ]
       }
     });
   }
   ```

2. **Backend - Endpoint clienti del professionista**
   ```typescript
   // clients.routes.ts
   router.get('/my-clients', authenticate, async (req, res) => {
     const clients = await clientService.getClientsForProfessional(req.user.id);
     return res.json(ResponseFormatter.success(clients));
   });
   ```

### Fase 3: Miglioramenti UX (Priorità Bassa)
1. Autocomplete per clienti esistenti
2. Visualizzazione conflitti in tempo reale
3. Suggerimenti orari liberi
4. Integrazione con disponibilità

---

## 📝 CODICE CORRETTO PROPOSTO

```javascript
// InterventionModal.tsx - Versione corretta
export default function InterventionModal({ intervention, onClose, onSave }) {
  const userId = useAuth().user?.id;
  
  // Fetch solo richieste del professionista
  const { data: requests } = useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const response = await api.get(`/requests?professionalId=${userId}&status=ASSIGNED`);
      return response.data;
    },
    enabled: !!userId
  });

  // Input manuale cliente (temporaneo)
  // In futuro: fetch clienti del professionista
  
  // Check conflitti (quando implementato)
  const checkConflicts = async (start, end) => {
    try {
      const response = await api.post('/calendar/check-conflicts', {
        start,
        end,
        professionalId: userId,
        excludeId: intervention?.id
      });
      return response.data;
    } catch (error) {
      console.warn('Check conflitti non disponibile');
      return { conflicts: [] };
    }
  };
  
  // ... resto del componente
}
```

---

## ⚠️ RISCHI E CONSIDERAZIONI

### Sicurezza
- Non esporre mai tutti i clienti a un professionista
- Validare sempre l'ownership delle richieste
- Controllare permessi su ogni operazione

### Performance
- Evitare fetch non necessari
- Implementare cache per dati statici
- Usare pagination per liste lunghe

### Manutenibilità
- Documentare ogni endpoint
- Mantenere consistenza nei nomi
- Aggiungere test per ogni nuovo endpoint

---

**Redatto da**: Analisi Sistema  
**Review necessaria**: Sì  
**Priorità fix**: Alta
