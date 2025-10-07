# 📊 DASHBOARD CLIENTE - DOCUMENTAZIONE COMPLETA
**Versione**: 3.0.0  
**Data Aggiornamento**: 10 Gennaio 2025  
**Stato**: ✅ Completamente Operativo

---

## 📋 PANORAMICA

La Dashboard Cliente è il punto centrale per la gestione di tutte le richieste di assistenza, preventivi e interventi programmati. La versione 3.0 introduce un sistema di evidenze visive per elementi che richiedono attenzione immediata.

---

## 🎯 FUNZIONALITÀ PRINCIPALI

### 1. **Sistema di Alert Prioritari**
- 🟠 **Alert Arancione**: Interventi programmati da confermare
- 🟡 **Alert Ambra**: Preventivi da valutare
- 📢 Posizionamento prominente in cima alla dashboard
- 🔢 Contatori chiari del numero di elementi in attesa

### 2. **Cards Dedicate per Azioni Urgenti**

#### Card Interventi da Confermare
- **Colore**: Bordo arancione con header colorato
- **Contenuto**:
  - Badge "DA CONFERMARE"
  - Titolo richiesta
  - Data e ora proposta (formato esteso italiano)
  - Nome professionista
  - Descrizione intervento
  - Durata stimata
  - Indirizzo intervento
- **Azioni**:
  - ✅ "Conferma ora" - Accetta la data proposta
  - 💬 "Proponi altra data" - Apre chat con messaggio precompilato

#### Card Preventivi da Valutare
- **Colore**: Bordo ambra con header colorato
- **Contenuto**:
  - Badge "DA VALUTARE"
  - Titolo richiesta
  - Importo in evidenza (grande e colorato)
  - Nome e contatti professionista
  - Dettagli items (primi 2 visibili)
  - Data scadenza preventivo
- **Azioni**:
  - 📋 "Valuta ora" - Vai al dettaglio preventivo
  - 💬 "Negozia preventivo" - Apre chat con messaggio precompilato

### 3. **Stats Cards Intelligenti**
- **Richieste Totali**: Contatore generale
- **Da Confermare/Valutare**: 
  - Mostra totale combinato se ci sono elementi in attesa
  - Dettaglio separato per tipo (interventi/preventivi)
  - Icona warning arancione se richiede attenzione
- **In Corso**: Richieste attualmente in lavorazione
- **Spesa Totale**: Totale speso per servizi accettati

---

## 💻 IMPLEMENTAZIONE TECNICA

### API Endpoint Dashboard
```typescript
GET /api/dashboard

Response: {
  stats: {
    totalRequests: number
    pendingRequests: number
    inProgressRequests: number
    completedRequests: number
    totalQuotes: number
    acceptedQuotes: number
    totalSpent: number
    pendingInterventions: number  // NUOVO v3.0
    pendingQuotes: number         // NUOVO v3.0
  },
  recentRequests: Array<Request>,
  recentQuotes: Array<Quote>,
  upcomingAppointments: Array<Appointment>,
  interventionsToConfirm: Array<{  // NUOVO v3.0
    id: string
    requestId: string
    requestTitle: string
    proposedDate: string
    description?: string
    estimatedDuration?: number
    professionalName: string
    address: string
    status: string
    urgent: boolean
  }>,
  quotesToAccept: Array<{  // NUOVO v3.0
    id: string
    requestId: string
    requestTitle: string
    amount: number
    professionalName: string
    professionalPhone?: string
    items: Array<QuoteItem>
    expiresAt?: string
    status: string
    urgent: boolean
  }>
}
```

### Component Structure
```tsx
// DashboardPage.tsx
function DashboardPage() {
  // Stati
  const [searchParams] = useSearchParams();
  const interventionsToConfirm = data?.interventionsToConfirm || [];
  const quotesToAccept = data?.quotesToAccept || [];

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <DashboardHeader user={user} />
      
      {/* Alert Interventi da Confermare */}
      {interventionsToConfirm.length > 0 && (
        <InterventionsAlert 
          count={interventionsToConfirm.length}
          interventions={interventionsToConfirm}
        />
      )}
      
      {/* Alert Preventivi da Valutare */}
      {quotesToAccept.length > 0 && (
        <QuotesAlert 
          count={quotesToAccept.length}
          quotes={quotesToAccept}
        />
      )}
      
      {/* Quick Actions */}
      <QuickActions role={user.role} />
      
      {/* Stats Cards */}
      <StatsCards stats={stats} />
      
      {/* Recent Activity */}
      <RecentActivity 
        requests={recentRequests}
        quotes={recentQuotes}
      />
      
      {/* Upcoming Appointments */}
      <UpcomingAppointments appointments={upcomingAppointments} />
    </div>
  );
}
```

---

## 🎨 DESIGN SYSTEM

### Colori e Stili

#### Sistema Colori Alert
```css
/* Interventi da Confermare - Arancione */
.intervention-alert {
  border-color: rgb(254 215 170); /* orange-200 */
  background-color: rgb(255 247 237); /* orange-50 */
  color: rgb(154 52 18); /* orange-800 */
}

/* Preventivi da Valutare - Ambra */
.quote-alert {
  border-color: rgb(253 230 138); /* amber-200 */
  background-color: rgb(254 252 232); /* amber-50 */
  color: rgb(146 64 14); /* amber-800 */
}
```

#### Icone Utilizzate
- 📅 `CalendarIcon` - Interventi programmati
- 📄 `DocumentTextIcon` - Preventivi
- ⚠️ `ExclamationTriangleIcon` - Alert urgenti
- 💬 `ChatBubbleLeftRightIcon` - Chat/Negoziazione

---

## 🔄 FLUSSI UTENTE

### Flusso Conferma Intervento
1. Cliente vede alert arancione
2. Clicca "Conferma ora"
3. Viene portato alla pagina richiesta
4. Conferma o modifica la data
5. Riceve conferma dell'operazione

### Flusso Negoziazione Date
1. Cliente vede intervento proposto
2. Clicca "Proponi altra data"
3. Si apre automaticamente la chat
4. Messaggio precompilato: *"Buongiorno, ho visto la data proposta per l'intervento. Vorrei proporre una data alternativa perché..."*
5. Cliente personalizza e invia
6. Professionista riceve notifica

### Flusso Valutazione Preventivo
1. Cliente vede alert ambra
2. Clicca "Valuta ora"
3. Visualizza dettagli preventivo
4. Può accettare, rifiutare o negoziare

### Flusso Negoziazione Preventivo
1. Cliente clicca "Negozia preventivo"
2. Si apre chat con messaggio: *"Buongiorno, ho ricevuto il preventivo. Vorrei chiarire alcuni punti prima di accettarlo..."*
3. Dialogo diretto con professionista

---

## 🔐 SICUREZZA E AUTORIZZAZIONI

### Controlli di Accesso
- Solo il cliente proprietario può vedere i propri dati
- Verifica JWT su ogni richiesta
- Rate limiting su API dashboard

### Validazioni
- Controllo ownership richieste
- Verifica scadenza preventivi
- Validazione date interventi

---

## 📱 RESPONSIVE DESIGN

### Mobile (< 768px)
- Cards in colonna singola
- Pulsanti full-width
- Font ridotti per leggibilità
- Menu hamburger per navigazione

### Tablet (768px - 1024px)
- Grid 2 colonne per stats
- Cards affiancate dove possibile
- Pulsanti affiancati

### Desktop (> 1024px)
- Grid 4 colonne per stats
- Layout ottimizzato per produttività
- Sidebar navigazione visibile

---

## 🚀 PERFORMANCE

### Ottimizzazioni Implementate
- **React Query**: Cache automatica dati (5 minuti)
- **Lazy Loading**: Componenti caricati on-demand
- **Memoization**: React.memo per componenti pesanti
- **Debouncing**: Su operazioni frequenti

### Metriche Target
- **Page Load**: < 2 secondi
- **API Response**: < 200ms
- **Interaction Delay**: < 100ms

---

## 🐛 TROUBLESHOOTING

### Dashboard non mostra interventi/preventivi
1. Verificare API response nel Network tab
2. Controllare console per errori
3. Verificare che esistano interventi con `status: 'PROPOSED'`
4. Controllare che i preventivi abbiano `status: 'PENDING'`

### Chat non si apre automaticamente
1. Verificare parametri URL: `?openChat=true&reason=intervention`
2. Controllare che RequestDetailPage gestisca searchParams
3. Verificare che il componente RequestChat accetti `suggestedMessage`

### Alert non visibili
1. Verificare che `interventionsToConfirm.length > 0`
2. Controllare condizioni rendering nel componente
3. Verificare CSS per z-index o display issues

---

## 📈 METRICHE E ANALYTICS

### KPI Dashboard
- **Bounce Rate**: % utenti che escono senza azioni
- **Engagement Rate**: % utenti che interagiscono
- **Action Completion**: % azioni completate vs iniziate
- **Response Time**: Tempo medio per conferma/rifiuto

### Eventi Tracciati
```javascript
// Google Analytics Events
gtag('event', 'intervention_confirmed', {
  intervention_id: id,
  time_to_confirm: timeElapsed
});

gtag('event', 'quote_negotiation_started', {
  quote_id: id,
  amount: amount
});
```

---

## 🔮 SVILUPPI FUTURI

### Prossime Features
- [ ] Notifiche push browser
- [ ] Filtri avanzati per periodo
- [ ] Export dati in Excel
- [ ] Grafici trend spese
- [ ] Comparazione preventivi AI-powered

### Miglioramenti UX
- [ ] Tutorial interattivo primo accesso
- [ ] Shortcuts keyboard
- [ ] Dark mode
- [ ] Personalizzazione layout
- [ ] Widget configurabili

---

## 📚 DOCUMENTAZIONE CORRELATA

- [Interventi Programmati](/Docs/04-SISTEMI/INTERVENTI-PROGRAMMATI.md)
- [Sistema Preventivi](/Docs/04-SISTEMI/PREVENTIVI.md)
- [Chat Sistema](/Docs/04-SISTEMI/CHAT.md)
- [API Dashboard](/Docs/05-API/DASHBOARD.md)

---

**Ultimo aggiornamento**: 10 Gennaio 2025  
**Autore**: Sistema di Documentazione Automatica  
**Versione**: 3.0.0
