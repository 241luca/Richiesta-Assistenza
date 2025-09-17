# 📅 SISTEMA INTERVENTI PROGRAMMATI
**Versione**: 2.0.0  
**Data Aggiornamento**: 10 Gennaio 2025  
**Stato**: ✅ Completamente Operativo

---

## 📋 PANORAMICA

Il sistema di **Interventi Programmati** permette ai professionisti di proporre date e orari specifici per gli interventi, che i clienti possono confermare, rifiutare o negoziare attraverso la chat integrata.

---

## 🎯 FUNZIONALITÀ PRINCIPALI

### 1. **Proposta Interventi (Professionista)**
- ✅ Proposta di multiple date/orari per un singolo intervento
- ✅ Descrizione dettagliata per ogni intervento proposto
- ✅ Stima della durata dell'intervento
- ✅ Notifica automatica al cliente

### 2. **Gestione Interventi (Cliente)**
- ✅ Visualizzazione prominente nella dashboard
- ✅ Alert arancione per interventi da confermare
- ✅ Conferma diretta dalla dashboard
- ✅ Negoziazione date alternative via chat
- ✅ Messaggio precompilato per proporre modifiche

### 3. **Dashboard Evidenze**
- ✅ Contatore interventi da confermare nelle stats
- ✅ Card dedicata con dettagli completi
- ✅ Badge "DA CONFERMARE" per evidenziare lo stato
- ✅ Pulsanti azione rapida: "Conferma ora" e "Proponi altra data"

---

## 🔄 FLUSSO OPERATIVO

### Lato Professionista
1. Accede alla richiesta assegnata
2. Clicca su "Proponi interventi programmati"
3. Compila il form con:
   - Data e ora proposta
   - Descrizione dell'intervento
   - Durata stimata (opzionale)
4. Può aggiungere multiple proposte
5. Invia le proposte al cliente

### Lato Cliente
1. Riceve notifica di nuovi interventi proposti
2. Vede alert arancione nella dashboard
3. Può:
   - **Confermare**: Accetta la data proposta
   - **Negoziare**: Apre la chat con messaggio precompilato
   - **Rifiutare**: Declina con motivazione

---

## 💻 IMPLEMENTAZIONE TECNICA

### Database Schema
```prisma
model ScheduledIntervention {
  id                String            @id
  requestId         String
  professionalId    String
  proposedDate      DateTime
  confirmedDate     DateTime?
  status            String            @default("PROPOSED")
  description       String?
  estimatedDuration Int?
  actualDuration    Int?
  notes             String?
  clientConfirmed   Boolean           @default(false)
  clientDeclineReason String?
  createdAt         DateTime          @default(now())
  updatedAt         DateTime
  createdBy         String?
  
  // Relations
  professional      User              @relation("ProfessionalInterventions", fields: [professionalId], references: [id])
  request           AssistanceRequest @relation(fields: [requestId], references: [id])
  createdByUser     User?             @relation("InterventionsCreated", fields: [createdBy], references: [id])
}
```

### API Endpoints

#### Proposta Interventi
```typescript
POST /api/scheduled-interventions
Body: {
  requestId: string
  interventions: Array<{
    proposedDate: string
    description?: string
    estimatedDuration?: number
  }>
}
```

#### Conferma/Rifiuto Intervento
```typescript
PATCH /api/scheduled-interventions/:id/respond
Body: {
  action: 'CONFIRM' | 'DECLINE'
  reason?: string // Per decline
  alternativeDate?: string // Per controproposta
}
```

#### Lista Interventi da Confermare
```typescript
GET /api/scheduled-interventions/pending
Response: Array<ScheduledIntervention>
```

---

## 🎨 COMPONENTI UI

### 1. ProposeInterventions Component
**Path**: `/src/components/professional/ProposeInterventions.tsx`
- Form per proposta multipla di interventi
- Validazione date (non nel passato)
- Aggiunta/rimozione dinamica interventi

### 2. Dashboard Alert Section
**Path**: `/src/pages/DashboardPage.tsx`
```tsx
// Alert per interventi da confermare
<Alert className="border-orange-200 bg-orange-50">
  <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
  <AlertDescription>
    Hai {count} interventi da confermare
  </AlertDescription>
</Alert>

// Card con dettagli e azioni
<Card className="border-orange-200">
  <CardHeader className="bg-orange-50">
    <CardTitle>Interventi Programmati da Confermare</CardTitle>
  </CardHeader>
  <CardContent>
    {interventions.map(intervention => (
      <div key={intervention.id}>
        {/* Dettagli intervento */}
        <Button>Conferma ora</Button>
        <Button variant="outline">
          <ChatBubbleLeftRightIcon />
          Proponi altra data
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
```

### 3. Chat Integration
**Parametri URL**:
- `openChat=true`: Apre automaticamente la chat
- `reason=intervention`: Specifica il contesto

**Messaggi Precompilati**:
```typescript
// Per interventi
"Buongiorno, ho visto la data proposta per l'intervento. 
Vorrei proporre una data alternativa perché..."

// Per preventivi
"Buongiorno, ho ricevuto il preventivo. 
Vorrei chiarire alcuni punti prima di accettarlo..."
```

---

## 📊 METRICHE E MONITORAGGIO

### KPI Principali
- **Tempo medio di conferma**: Quanto impiega un cliente a confermare
- **Tasso di accettazione**: % interventi confermati vs proposti
- **Numero negoziazioni**: Quante volte viene usata la chat per negoziare

### Dashboard Admin
- Vista aggregata interventi programmati
- Statistiche per professionista
- Alert per interventi non confermati da troppo tempo

---

## 🔒 SICUREZZA E AUTORIZZAZIONI

### Autorizzazioni
- **Proposta**: Solo professionista assegnato
- **Conferma/Rifiuto**: Solo cliente della richiesta
- **Visualizzazione**: Cliente, professionista assegnato, admin

### Validazioni
- Date non nel passato
- Professionista deve essere assegnato alla richiesta
- Cliente deve essere proprietario della richiesta

---

## 🚀 BEST PRACTICES

### Per Professionisti
1. Proporre sempre almeno 2-3 date alternative
2. Includere descrizione chiara dell'intervento
3. Specificare sempre la durata stimata
4. Considerare i tempi di spostamento

### Per Clienti
1. Rispondere tempestivamente alle proposte
2. Usare la chat per negoziazioni complesse
3. Fornire motivazioni chiare in caso di rifiuto

---

## 🐛 TROUBLESHOOTING

### Problema: Errore "updatedAt is missing"
**Soluzione**: Il campo updatedAt è obbligatorio. Verificare che venga passato nella creazione:
```typescript
await prisma.scheduledIntervention.create({
  data: {
    // ... altri campi
    createdAt: new Date(),
    updatedAt: new Date() // OBBLIGATORIO
  }
});
```

### Problema: Chat non si apre automaticamente
**Soluzione**: Verificare che l'URL contenga i parametri corretti:
```
/requests/{id}?openChat=true&reason=intervention
```

### Problema: Notifiche non arrivano
**Soluzione**: Verificare che:
1. Il servizio notifiche sia attivo
2. Il template notifica esista nel database
3. Il cliente abbia le notifiche abilitate

---

## 📈 SVILUPPI FUTURI

### In Roadmap
- [ ] Sincronizzazione con Google Calendar
- [ ] Reminder automatici pre-intervento
- [ ] Gestione interventi ricorrenti
- [ ] Vista calendario mensile
- [ ] App mobile con notifiche push

### Miglioramenti Pianificati
- [ ] Proposta automatica basata su disponibilità
- [ ] Integrazione con sistema di pagamento per caparra
- [ ] Video-chiamata pre-intervento
- [ ] Check-in/out con geolocalizzazione

---

## 📚 DOCUMENTAZIONE CORRELATA

- [Dashboard Cliente](/Docs/03-FRONTEND/DASHBOARD-CLIENTE.md)
- [Sistema Notifiche](/Docs/04-SISTEMI/NOTIFICHE.md)
- [Chat Sistema](/Docs/04-SISTEMI/CHAT.md)
- [API Reference](/Docs/05-API/SCHEDULED-INTERVENTIONS.md)

---

**Ultimo aggiornamento**: 10 Gennaio 2025  
**Autore**: Sistema di Documentazione Automatica  
**Versione**: 2.0.0
