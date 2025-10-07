# ARCHITETTURA SISTEMA PREVENTIVI - AGGIORNAMENTO 31/08/2025

## STATO ATTUALE: ✅ FUNZIONANTE

### FLUSSO DATI PREZZI (CORRETTO)
```
Frontend (input €) → Backend (€) → Database (€ Decimal)
```
**IMPORTANTE**: Nessuna conversione euro/centesimi. Tutto in EURO.

## SCHEMA DATABASE QUOTE

### Tabella Quote
```sql
- id: String @id -- UUID manuale richiesto
- requestId: String
- professionalId: String  
- title: String
- description: String?
- amount: Decimal -- Totale in EURO
- currency: String @default("EUR")
- status: QuoteStatus @default(DRAFT)
- version: Int @default(1)
- validUntil: DateTime?
- notes: String? -- Note cliente
- terms: String? -- NON termsConditions!
- internalNotes: String?
- depositRequired: Boolean -- NON requiresDeposit!
- customFields: Json? -- Qui salviamo subtotal, taxAmount, etc
- createdAt: DateTime @default(now())
- updatedAt: DateTime -- Richiesto, non ha default!
```

### Tabella QuoteItem
```sql
- id: String @id -- UUID manuale richiesto
- quoteId: String
- description: String
- quantity: Float @default(1)
- unitPrice: Decimal -- In EURO
- totalPrice: Decimal -- In EURO
- taxRate: Float @default(0)
- taxAmount: Decimal @default(0)
- discount: Decimal @default(0)
- order: Int -- NON displayOrder!
- metadata: Json? -- Per itemType, unit, notes
```

### Tabella QuoteRevision (per versionamento)
```sql
- id: String @id -- UUID manuale richiesto
- quoteId: String
- userId: String
- version: Int
- changes: Json -- Snapshot completo
- reason: String?
- createdAt: DateTime @default(now())
```

### Tabella Notification
```sql
- id: String @id -- UUID manuale richiesto
- type: String
- title: String
- content: String -- NON message!
- recipientId: String -- NON userId!
- priority: NotificationPriority (MAIUSCOLO)
- isRead: Boolean @default(false)
```

## PATTERN CORRETTI

### 1. Generazione UUID (SEMPRE RICHIESTA)
```typescript
import { v4 as uuidv4 } from 'uuid';

// Per OGNI create
const quoteId = uuidv4();
await tx.quote.create({
  data: {
    id: quoteId, // SEMPRE necessario
    // ... altri campi
  }
});
```

### 2. Gestione Prezzi (TUTTO IN EURO)
```typescript
// Frontend - NewQuotePage.tsx
items: items.map(item => ({
  ...item,
  unitPrice: item.unitPrice, // GIÀ in euro, NO * 100
  totalPrice: item.quantity * item.unitPrice // NO * 100
}))

// Backend - quote.service.ts
amount: calculations.totalAmount, // NO / 100, già in euro
```

### 3. CustomFields per Dettagli
```typescript
customFields: {
  subtotal: calculations.subtotal,
  taxAmount: calculations.taxAmount,
  discountAmount: calculations.discountAmount,
  totalAmount: calculations.totalAmount,
  depositAmount: depositAmount,
  calculationDetails: calculations
}
```

### 4. Notifiche Corrette
```typescript
// Usa sendToUser, NON createNotification
await notificationService.sendToUser({
  type: 'new_quote',
  title: 'Nuovo Preventivo Ricevuto',
  message: `...`, // Diventa 'content' nel DB
  userId: request.clientId, // Diventa 'recipientId' nel DB
  priority: 'high', // Diventa 'HIGH' nel DB
  channels: ['websocket', 'email']
});
```

### 5. Versionamento con QuoteRevision
```typescript
// Ad ogni modifica
await tx.quoteRevision.create({
  data: {
    id: uuidv4(),
    quoteId: quoteId,
    userId: professionalId,
    version: newVersion,
    changes: {
      action: 'updated',
      before: oldQuote,
      after: newQuote,
      calculations: calculations
    },
    reason: 'Modifica preventivo'
  }
});
```

## ERRORI COMUNI DA EVITARE

### ❌ NON FARE:
```typescript
// NON moltiplicare per 100
unitPrice: item.unitPrice * 100 // SBAGLIATO

// NON dividere per 100  
amount: totalAmount / 100 // SBAGLIATO

// NON usare nomi campi sbagliati
termsConditions: "..." // SBAGLIATO, usa 'terms'
requiresDeposit: true // SBAGLIATO, usa 'depositRequired'
displayOrder: 1 // SBAGLIATO, usa 'order'

// NON dimenticare UUID
await create({ data: { title: "..." }}) // SBAGLIATO, manca id

// NON usare metodi inesistenti
notificationService.createNotification() // SBAGLIATO, usa sendToUser
```

### ✅ FARE SEMPRE:
```typescript
// UUID per ogni create
id: uuidv4()

// Prezzi in euro
unitPrice: 50.00 // euro, non 5000 centesimi

// Nomi campi corretti dal DB
terms: "...", // non termsConditions
depositRequired: true, // non requiresDeposit
order: 1, // non displayOrder

// Notifiche corrette
notificationService.sendToUser({...})

// Versionamento
QuoteRevision per tracciare modifiche
```

## FORMATTAZIONE UI

### Input Prezzi
```tsx
<div className="relative">
  <span className="absolute left-3 top-2 text-gray-500">€</span>
  <input
    type="number"
    value={item.unitPrice}
    step="0.01"
    className="w-full pl-8 pr-3 py-2 border"
    placeholder="0.00"
  />
</div>
```

### Textarea per Descrizioni
```tsx
<textarea
  value={item.description}
  className="w-full px-3 py-2 border resize-none"
  placeholder="Descrizione dettagliata del lavoro/materiale"
  rows={2}
/>
```

### Arrotondamento 2 Decimali
```typescript
// Sempre arrotondare per display
const rounded = Math.round(value * 100) / 100;
const formatted = value.toFixed(2);
```

## FILE CHIAVE

### Backend
- `/backend/src/services/quote.service.ts` - Logica preventivi
- `/backend/src/services/notification.service.ts` - Sistema notifiche
- `/backend/src/routes/quote.routes.ts` - API endpoints

### Frontend
- `/src/pages/NewQuotePage.tsx` - Creazione preventivi
- `/src/pages/QuoteListPage.tsx` - Lista preventivi
- `/src/pages/QuoteDetailPage.tsx` - Dettaglio preventivo

### Database
- `/backend/prisma/schema.prisma` - Schema completo

## TESTING CHECKLIST

- [ ] Creazione preventivo con prezzi normali (€50 non €5000)
- [ ] UUID generati per tutte le entità
- [ ] Notifiche inviate correttamente
- [ ] Versionamento salvato in QuoteRevision
- [ ] CustomFields con dettagli calcoli
- [ ] Formattazione 2 decimali
- [ ] Costi viaggio calcolati correttamente

---

**ULTIMO AGGIORNAMENTO**: 31 Agosto 2025
**STATO**: Sistema completamente funzionante
