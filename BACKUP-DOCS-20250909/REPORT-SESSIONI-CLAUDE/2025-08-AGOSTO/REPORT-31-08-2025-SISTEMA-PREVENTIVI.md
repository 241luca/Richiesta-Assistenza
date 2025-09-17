# Report Sessione - Sistema Preventivi
**Data**: 31 Agosto 2025  
**Sviluppatore**: Claude  
**Cliente**: Luca Mambelli  
**Progetto**: Sistema Richiesta Assistenza

## OBIETTIVO SESSIONE
Correzione completa del sistema di creazione preventivi che presentava errori multipli nel salvataggio e nella gestione dei prezzi.

## PROBLEMI IDENTIFICATI

### 1. UUID Mancanti nel Database
- **Problema**: Le tabelle Quote, QuoteItem, QuoteRevision e Notification richiedevano UUID espliciti non generati automaticamente
- **Causa**: Schema Prisma senza `@default(uuid())`
- **Impatto**: Errori 500 alla creazione preventivi

### 2. Campi Database Non Corrispondenti
- **Problema**: Il codice usava nomi di campi inesistenti nel database
- **Esempi**:
  - `subtotal`, `taxAmount`, `discountAmount` → NON esistono, solo `amount`
  - `termsConditions` → in realtà `terms`
  - `requiresDeposit` → in realtà `depositRequired`
  - `displayOrder` → in realtà `order`
  - `message` → in realtà `content` (in Notification)
  - `userId` → in realtà `recipientId` (in Notification)

### 3. Conversione Prezzi Errata
- **Problema**: Moltiplicazione per 100 non necessaria causava prezzi in miliardi
- **Causa**: Confusione tra euro e centesimi
- **Risultato**: Un preventivo di 50€ diventava 5000€

### 4. Sistema Notifiche Non Funzionante
- **Problema**: Metodo `createNotification` non esisteva
- **Soluzione**: Usare `sendToUser` con parametri corretti

### 5. Sistema Versionamento Mancante
- **Problema**: Tentativo di rimuovere QuoteRevision invece di correggerlo
- **Soluzione**: Mantenere QuoteRevision per tracciamento versioni

## SOLUZIONI IMPLEMENTATE

### 1. Generazione UUID
```typescript
// quote.service.ts
import { v4 as uuidv4 } from 'uuid';

const quoteId = uuidv4();
const newQuote = await tx.quote.create({
  data: {
    id: quoteId, // UUID generato
    // ... altri campi
  }
});

// Stesso per QuoteItem, QuoteRevision, Notification
```

### 2. Mappatura Corretta Campi
```typescript
// quote.service.ts
const newQuote = await tx.quote.create({
  data: {
    id: quoteId,
    title: input.title,
    description: input.description,
    amount: calculations.totalAmount, // Solo amount, non subtotal/taxAmount/etc
    terms: input.termsConditions, // terms, non termsConditions
    depositRequired: input.requiresDeposit, // depositRequired, non requiresDeposit
    // customFields per salvare dettagli extra
    customFields: {
      subtotal: calculations.subtotal,
      taxAmount: calculations.taxAmount,
      discountAmount: calculations.discountAmount,
      totalAmount: calculations.totalAmount
    }
  }
});
```

### 3. Sistema Prezzi in Euro
```typescript
// Frontend (NewQuotePage.tsx)
items: items.map(item => ({
  ...item,
  unitPrice: item.unitPrice, // Invia in euro, NON moltiplicare per 100
  totalPrice: item.quantity * item.unitPrice
}))

// Backend (quote.service.ts)
amount: calculations.totalAmount, // NON dividere per 100, già in euro
```

### 4. Sistema Notifiche Corretto
```typescript
// quote.service.ts
await notificationService.sendToUser({
  type: 'new_quote',
  title: 'Nuovo Preventivo Ricevuto',
  message: `Hai ricevuto un nuovo preventivo per "${request.title}"`,
  userId: request.clientId,
  priority: 'high',
  channels: ['websocket', 'email']
});

// notification.service.ts
const notification = await prisma.notification.create({
  data: {
    id: uuidv4(),
    type: data.type,
    title: data.title,
    content: data.message, // content, non message
    recipientId: data.userId, // recipientId, non userId
    priority: (data.priority || 'NORMAL').toUpperCase(),
    isRead: false
  }
});
```

### 5. Sistema Versionamento
```typescript
// Salva revisione per ogni modifica
await tx.quoteRevision.create({
  data: {
    id: uuidv4(),
    quoteId: quoteId,
    userId: input.professionalId,
    version: 1,
    changes: {
      action: 'created',
      quote: newQuote,
      items: items,
      calculations: calculations
    },
    reason: 'Creazione preventivo iniziale'
  }
});
```

### 6. Formattazione UI Migliorata
```typescript
// NewQuotePage.tsx - Textarea per descrizioni
<textarea
  value={item.description}
  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
  placeholder="Descrizione dettagliata del lavoro/materiale"
  rows={2}
  required
/>

// Arrotondamento prezzi a 2 decimali
const travelCostInEuro = Math.round((travelData.cost / 100) * 100) / 100;
```

## FILE MODIFICATI

### Backend
1. `/backend/src/services/quote.service.ts`
   - Aggiunto UUID generation
   - Corretti nomi campi database
   - Sistemato sistema prezzi
   - Aggiunto QuoteRevision tracking

2. `/backend/src/services/notification.service.ts`
   - Aggiunto UUID generation
   - Corretti nomi campi (content, recipientId)

3. `/backend/src/routes/quote.routes.ts`
   - Rimossa conversione non necessaria in centesimi

### Frontend
1. `/src/pages/NewQuotePage.tsx`
   - Rimossa moltiplicazione per 100
   - Migliorata formattazione UI con textarea
   - Aggiunto arrotondamento a 2 decimali
   - Layout migliorato con sfondi e spacing

## BACKUP CREATI
- `quote.service.backup-20250831-204000.ts`

## RISULTATO FINALE

### ✅ Funzionalità Ripristinate
1. **Creazione preventivi** funzionante
2. **Prezzi corretti** in euro (non più miliardi)
3. **Notifiche** inviate correttamente
4. **Versionamento** completo con QuoteRevision
5. **UI migliorata** con formattazione professionale

### 📊 Flusso Dati Corretto
```
Frontend (€50) → Backend (€50) → Database (€50)
```
Nessuna conversione non necessaria, tutto in euro.

### 🔄 Sistema Versionamento
- Ogni creazione/modifica tracciata in QuoteRevision
- Snapshot completo dei dati in `changes` field
- Possibilità di vedere storico modifiche

## LEZIONI APPRESE

1. **Verificare SEMPRE lo schema database** prima di assumere nomi campi
2. **Controllare se UUID è richiesto** per TUTTE le tabelle correlate
3. **Mantenere coerenza nelle unità di misura** (tutto euro o tutto centesimi)
4. **Non rimuovere funzionalità esistenti** (versionamento) senza comprenderne l'importanza

## PROSSIMI PASSI SUGGERITI

1. **Implementare modifica preventivi** (EditQuotePage)
2. **Aggiungere visualizzazione storico versioni**
3. **Implementare invio PDF preventivo via email**
4. **Aggiungere firma digitale preventivi**

## NOTE TECNICHE

### Pattern UUID Corretto
Quando una tabella richiede UUID manuale, probabilmente TUTTE le tabelle correlate lo richiedono:
- Quote → QuoteItem, QuoteRevision
- Notification → tutti i create necessitano UUID

### Gestione Prezzi
Sistema finale: tutto in EURO senza conversioni
- Frontend: input e display in euro
- Backend: calcoli in euro
- Database: storage in euro (Decimal field)

---

**Fine Report**  
Sessione completata con successo. Sistema preventivi completamente funzionante.
