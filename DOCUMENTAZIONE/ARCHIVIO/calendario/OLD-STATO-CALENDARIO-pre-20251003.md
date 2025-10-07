# 📅 DOCUMENTAZIONE CALENDARIO PROFESSIONISTI

**Data Documentazione**: 27 Settembre 2025  
**Versione Sistema**: 4.0.0  
**Stato Funzionalità**: ⚠️ PARZIALMENTE FUNZIONANTE

---

## 📊 STATO ATTUALE

### ✅ COSA FUNZIONA
- **Visualizzazione calendario**: L'interfaccia FullCalendar è correttamente renderizzata
- **Vista multipla**: Mese, settimana, giorno e lista funzionanti
- **Navigazione**: Controlli per navigare tra le date
- **Backend service**: Il service calendar.service.ts è stato corretto e funzionante
- **Route API**: L'endpoint `/api/interventions/calendar` risponde correttamente
- **Database**: La tabella `ScheduledIntervention` esiste e ha la struttura corretta

### ❌ COSA NON FUNZIONA
- **Modal Interventi**: Il modal per creare/modificare interventi presenta errori multipli
- **Chiamate API errate**: Il modal tenta di chiamare endpoint inesistenti o non autorizzati
- **Fetch richieste**: L'endpoint `/api/assistance-requests` non esiste (dovrebbe essere `/api/requests`)
- **Permessi clienti**: Non autorizzato a vedere tutti i clienti (`/api/users?role=CLIENT` ritorna 403)
- **Check conflitti**: L'endpoint `/api/calendar/check-conflicts` non è implementato

### ⚠️ PROBLEMI IDENTIFICATI

#### 1. Errori nel Modal (InterventionModal.tsx)
```javascript
// ERRORE 1: Endpoint sbagliato
await api.get('/assistance-requests?status=ASSIGNED'); // 404
// Dovrebbe essere: await api.get('/requests?status=ASSIGNED');

// ERRORE 2: Non autorizzato
await api.get('/users?role=CLIENT'); // 403
// Il professionista non può vedere tutti i clienti

// ERRORE 3: Endpoint non implementato
await api.post('/calendar/check-conflicts', data); // 500
// Questa funzionalità non esiste nel backend
```

#### 2. Struttura Database
Il model `ScheduledIntervention` NON ha i seguenti campi che il codice frontend si aspetta:
- ❌ `isCancelled` - Non esiste, viene usato `status = 'cancelled'` 
- ❌ `CalendarSettings` - Tabella non creata
- ❌ `CalendarAvailability` - Tabella non creata

---

## 📁 STRUTTURA FILE

### Backend
```
backend/
├── src/
│   ├── routes/
│   │   └── calendar/
│   │       └── calendar.routes.ts      ✅ Funzionante (corretto)
│   ├── services/
│   │   └── calendar/
│   │       └── calendar.service.ts     ✅ Funzionante (corretto)
│   └── prisma/
│       └── schema.prisma               ✅ Model ScheduledIntervention presente
```

### Frontend
```
src/
└── components/
    └── professional/
        └── calendar/
            ├── ProfessionalCalendar.tsx  ✅ Funzionante (con fix applicati)
            ├── InterventionModal.tsx      ❌ Problematico (errori multipli)
            ├── CalendarFilters.tsx        ✅ Funzionante
            ├── CalendarLegend.tsx         ✅ Funzionante
            ├── CalendarSettings.tsx       ⚠️ Non testato
            ├── AvailabilityManager.tsx    ⚠️ Non testato
            └── GoogleCalendarSync.tsx     ⚠️ Non testato
```

---

## 🔧 CORREZIONI APPLICATE

### 1. Backend - calendar.service.ts
**Problema**: Usava `isCancelled` che non esiste nel model  
**Soluzione**: Rimosso completamente il filtro `isCancelled`

```typescript
// PRIMA (errato)
where: {
  professionalId,
  isCancelled: false
}

// DOPO (corretto)
where: {
  professionalId
}
```

### 2. Backend - calendar.routes.ts
**Problema**: Passava l'oggetto filters invece di professionalId e filters separati  
**Soluzione**: Passaggio corretto dei parametri

```typescript
// PRIMA (errato)
const filters = { professionalId: req.user.id, ... };
await calendarService.getCalendarInterventions(filters);

// DOPO (corretto)
await calendarService.getCalendarInterventions(req.user.id, {
  status: req.query.status,
  category: req.query.category,
  // ...
});
```

### 3. Frontend - ProfessionalCalendar.tsx
**Problema**: ResponseFormatter restituiva dati annidati  
**Soluzione**: Estrazione corretta dei dati dalla risposta

```typescript
// PRIMA (errato)
const { data: interventions } = useQuery(...);

// DOPO (corretto)
const { data: interventionsResponse } = useQuery(...);
const interventions = interventionsResponse?.data || [];
```

---

## 🚨 PROBLEMI DA RISOLVERE

### PRIORITÀ ALTA

#### 1. Fix Modal Interventi
Il modal `InterventionModal.tsx` deve essere corretto per:
- Usare l'endpoint corretto `/api/requests` invece di `/api/assistance-requests`
- Rimuovere il fetch dei clienti (non autorizzato)
- Rimuovere o implementare il check conflitti
- Gestire correttamente i dati del form

#### 2. Implementare Endpoint Mancanti
Backend deve implementare:
- `POST /api/calendar/check-conflicts` - Per verificare sovrapposizioni
- `GET /api/requests?professionalId=X` - Per ottenere solo le richieste del professionista

#### 3. Creare Tabelle Mancanti
Se necessarie, creare nel database:
- `CalendarSettings` - Per salvare le impostazioni del calendario
- `CalendarAvailability` - Per gestire la disponibilità oraria

### PRIORITÀ MEDIA

#### 4. Test Componenti Non Verificati
- `CalendarSettings.tsx` - Verificare funzionamento
- `AvailabilityManager.tsx` - Testare gestione disponibilità
- `GoogleCalendarSync.tsx` - Verificare integrazione (se necessaria)

#### 5. Gestione Stati Intervento
Implementare logica per stati:
- `pending` - In attesa di conferma
- `confirmed` - Confermato
- `in_progress` - In corso
- `completed` - Completato
- `cancelled` - Cancellato

---

## 💡 SOLUZIONE PROPOSTA

### Approccio 1: Fix Minimale (Rapido)
1. Modificare `InterventionModal.tsx` per rimuovere tutte le chiamate problematiche
2. Creare form semplice senza dipendenze esterne
3. Salvare direttamente in `ScheduledIntervention`

### Approccio 2: Fix Completo (Corretto)
1. Implementare gli endpoint mancanti nel backend
2. Creare le tabelle necessarie nel database
3. Aggiornare il modal per usare gli endpoint corretti
4. Implementare logica completa di gestione interventi

### Approccio 3: Refactoring (Consigliato)
1. Analizzare il flusso reale di business
2. Ridisegnare la struttura dati se necessario
3. Implementare solo le funzionalità realmente necessarie
4. Evitare over-engineering

---

## 📝 NOTE TECNICHE

### Struttura Model ScheduledIntervention
```prisma
model ScheduledIntervention {
  id                  String    @id
  requestId           String
  professionalId      String
  proposedDate        DateTime
  confirmedDate       DateTime?
  status              String    @default("PROPOSED")
  description         String?
  estimatedDuration   Int?
  actualDuration      Int?
  notes               String?
  clientConfirmed     Boolean   @default(false)
  clientDeclineReason String?
  createdAt           DateTime  @default(now())
  updatedAt           DateTime
  createdBy           String?
  
  // Relazioni
  professional        User              @relation("ProfessionalInterventions", fields: [professionalId], references: [id])
  request             AssistanceRequest @relation(fields: [requestId], references: [id])
  createdByUser       User?             @relation("InterventionsCreated", fields: [createdBy], references: [id])
}
```

### API Endpoints Disponibili
```
GET  /api/interventions/calendar     ✅ Funzionante
POST /api/interventions              ⚠️ Da verificare
PUT  /api/interventions/:id          ⚠️ Da verificare
DELETE /api/interventions/:id        ⚠️ Da verificare
GET  /api/calendar/settings          ✅ Ritorna default (no DB)
POST /api/calendar/check-conflicts   ❌ Non implementato
```

---

## 🎯 RACCOMANDAZIONI

1. **Non nascondere i problemi**: La soluzione di rimuovere le chiamate API problematiche è temporanea
2. **Implementare correttamente**: Gli endpoint mancanti sono necessari per il funzionamento completo
3. **Testare tutto**: Ogni componente deve essere testato individualmente
4. **Documentare le decisioni**: Ogni scelta tecnica deve essere documentata
5. **Considerare il refactoring**: Il sistema potrebbe beneficiare di una revisione strutturale

---

## 📋 CHECKLIST COMPLETAMENTO

- [ ] Fix InterventionModal con endpoint corretti
- [ ] Implementare endpoint `/api/calendar/check-conflicts`
- [ ] Verificare creazione/modifica interventi
- [ ] Testare drag & drop sul calendario
- [ ] Implementare notifiche per interventi
- [ ] Testare filtri calendario
- [ ] Verificare sincronizzazione Google Calendar (se necessaria)
- [ ] Implementare gestione disponibilità
- [ ] Aggiungere validazione date/orari
- [ ] Implementare visualizzazione conflitti
- [ ] Test completo end-to-end
- [ ] Aggiornare documentazione API

---

**Ultimo Aggiornamento**: 27 Settembre 2025  
**Autore**: Sistema di Documentazione Automatica  
**Verificato da**: Da verificare
