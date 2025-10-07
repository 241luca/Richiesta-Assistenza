# 📝 SISTEMA RECENSIONI - Documentazione Completa

**Data Implementazione**: 05 Ottobre 2025  
**Versione**: 1.0.0  
**Stato**: ✅ Implementato e Funzionante

---

## 🎯 PANORAMICA

Il Sistema Recensioni permette ai clienti di valutare e recensire i professionisti dopo il completamento di un intervento. Questo sistema migliora la trasparenza e aiuta i futuri clienti nella scelta del professionista più adatto.

---

## ⚙️ CARATTERISTICHE PRINCIPALI

### Funzionalità Base
- ✅ **Valutazione a stelle** (1-5 stelle)
- ✅ **Commenti testuali** (opzionali, min 10 - max 1000 caratteri)
- ✅ **Una recensione per intervento** (no duplicati)
- ✅ **Solo interventi completati** possono essere recensiti
- ✅ **Verifica automatica** delle recensioni
- ✅ **Calcolo rating medio** per professionista
- ✅ **Distribuzione stelle** visualizzata

### Sicurezza
- 🔒 Solo il cliente dell'intervento può recensire
- 🔒 Recensioni immutabili dopo la creazione
- 🔒 Validazione Zod su tutti gli input
- 🔒 Protezione XSS sui commenti

---

## 📊 STRUTTURA DATABASE

### Tabella: Review
```prisma
model Review {
  id            String   @id @default(cuid())
  rating        Int      // 1-5 stelle
  comment       String?  @db.Text
  
  // Relazioni
  requestId     String   @unique
  request       AssistanceRequest  @relation(...)
  
  clientId      String
  client        User     @relation("ClientReviews", ...)
  
  professionalId String
  professional   User     @relation("ProfessionalReviews", ...)
  
  // Metadata
  isVerified    Boolean  @default(false)
  helpfulCount  Int      @default(0)
  reportedCount Int      @default(0)
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([professionalId])
  @@index([clientId])
  @@index([rating])
}
```

### Relazioni
- **User**: Ha `reviewsGiven` e `reviewsReceived`
- **AssistanceRequest**: Ha `review` (one-to-one)

---

## 🔌 API ENDPOINTS

### 1. Creare Recensione
**POST** `/api/reviews`
```json
{
  "requestId": "cuid_richiesta",
  "rating": 5,
  "comment": "Ottimo servizio, professionista molto competente!"
}
```

**Risposta**:
```json
{
  "success": true,
  "data": {
    "id": "review_id",
    "rating": 5,
    "comment": "Ottimo servizio...",
    "client": {
      "firstName": "Mario",
      "lastName": "R"
    },
    "createdAt": "2025-10-05T10:00:00Z"
  },
  "message": "Recensione creata con successo"
}
```

### 2. Ottenere Recensioni Professionista
**GET** `/api/reviews/professional/:professionalId`

Query params:
- `page` (default: 1)
- `limit` (default: 10)

### 3. Statistiche Recensioni
**GET** `/api/reviews/professional/:professionalId/stats`

**Risposta**:
```json
{
  "totalReviews": 42,
  "averageRating": 4.7,
  "distribution": {
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 12,
    "5": 24
  }
}
```

### 4. Verifica Possibilità Recensione
**GET** `/api/reviews/can-review/:requestId`

**Risposta**:
```json
{
  "canReview": true,
  "reason": null
}
```

---

## 🎨 COMPONENTI FRONTEND

### 1. StarRating Component
Componente riutilizzabile per visualizzare e selezionare stelle.

**Props**:
- `rating`: numero da 1 a 5
- `onRatingChange`: callback per cambio rating
- `readonly`: solo visualizzazione
- `size`: 'sm' | 'md' | 'lg'
- `showNumber`: mostra il numero accanto alle stelle

**Utilizzo**:
```tsx
<StarRating 
  rating={4.5} 
  readonly 
  size="lg"
/>
```

### 2. ReviewForm Component
Form per creare una nuova recensione.

**Props**:
- `requestId`: ID della richiesta da recensire
- `onSuccess`: callback dopo invio
- `onCancel`: callback per annullamento

### 3. ReviewList Component
Lista completa delle recensioni con statistiche.

**Props**:
- `professionalId`: ID del professionista

---

## 🔄 FLUSSO OPERATIVO

1. **Cliente completa intervento** → Status = COMPLETED
2. **Sistema mostra pulsante** "Lascia una recensione"
3. **Cliente compila form** con stelle e commento opzionale
4. **Validazione**:
   - Verifica intervento completato
   - Verifica cliente autorizzato
   - Verifica no duplicati
5. **Salvataggio recensione**
6. **Aggiornamento rating** professionista
7. **Notifica professionista** (opzionale)

---

## ⚡ REGOLE DI BUSINESS

### Quando si può recensire:
- ✅ Intervento con status COMPLETED
- ✅ Sei il cliente dell'intervento
- ✅ Non hai già recensito questo intervento
- ✅ Esiste un professionista assegnato

### Validazioni:
- Rating: intero tra 1 e 5
- Commento: opzionale, ma se presente min 10 caratteri
- Una sola recensione per intervento

---

## 🧪 TESTING

### Test Backend
```typescript
// Test creazione recensione
describe('Review Service', () => {
  it('should create review for completed request', async () => {
    const review = await reviewService.createReview({
      requestId: 'completed_request',
      rating: 5,
      comment: 'Ottimo lavoro',
      clientId: 'client_id'
    });
    expect(review.rating).toBe(5);
  });

  it('should reject review for non-completed request', async () => {
    await expect(reviewService.createReview({
      requestId: 'pending_request',
      rating: 5,
      clientId: 'client_id'
    })).rejects.toThrow('Puoi recensire solo interventi completati');
  });
});
```

### Test Frontend
```typescript
// Test componente StarRating
describe('StarRating', () => {
  it('should display correct number of filled stars', () => {
    const { container } = render(<StarRating rating={3} readonly />);
    const filledStars = container.querySelectorAll('.text-yellow-400');
    expect(filledStars).toHaveLength(3);
  });
});
```

---

## 📈 STATISTICHE E METRICHE

### KPI da Monitorare:
- **Tasso di recensione**: % interventi recensiti
- **Rating medio**: per professionista e globale
- **Tempo medio recensione**: da completamento a recensione
- **Lunghezza media commenti**: caratteri
- **Distribuzione rating**: 1-5 stelle

### Query Utili:
```sql
-- Rating medio per categoria
SELECT 
  c.name as categoria,
  AVG(r.rating) as rating_medio,
  COUNT(r.id) as totale_recensioni
FROM Review r
JOIN AssistanceRequest ar ON r.requestId = ar.id
JOIN Category c ON ar.categoryId = c.id
GROUP BY c.id;

-- Top professionisti
SELECT 
  u.firstName,
  u.lastName,
  AVG(r.rating) as rating_medio,
  COUNT(r.id) as num_recensioni
FROM Review r
JOIN User u ON r.professionalId = u.id
GROUP BY u.id
HAVING COUNT(r.id) >= 5
ORDER BY rating_medio DESC
LIMIT 10;
```

---

## 🔧 CONFIGURAZIONE

### Variabili Ambiente
```env
# Non richieste variabili specifiche per recensioni
# Usa configurazione esistente del sistema
```

### Permessi
```typescript
// Solo CLIENT può creare recensioni
// Tutti possono leggere recensioni
// Solo ADMIN può eliminare recensioni
```

---

## 🚀 MIGLIORAMENTI FUTURI

### Fase 2 (Prossimi 3 mesi)
- [ ] **Risposte professionista** alle recensioni
- [ ] **Foto nelle recensioni**
- [ ] **Recensioni verificate** con badge
- [ ] **Filtri avanzati** (per rating, data, categoria)
- [ ] **Ordinamento** (più recenti, più utili, rating)

### Fase 3 (6 mesi)
- [ ] **Sistema di moderazione** automatica
- [ ] **AI per analisi sentiment**
- [ ] **Suggerimenti recensione** basati su AI
- [ ] **Badge di eccellenza** per professionisti
- [ ] **Report recensioni** mensili

### Fase 4 (1 anno)
- [ ] **Video recensioni**
- [ ] **Sistema punti fedeltà** per recensioni
- [ ] **Integrazione social** sharing
- [ ] **API pubblica** per recensioni

---

## 🐛 TROUBLESHOOTING

### Problema: "Puoi recensire solo interventi completati"
**Soluzione**: Verifica che lo status della richiesta sia COMPLETED

### Problema: "Hai già recensito questo intervento"
**Soluzione**: Una sola recensione per intervento è permessa

### Problema: Stelle non cliccabili
**Soluzione**: Verifica che `readonly` sia false e `onRatingChange` sia passato

### Problema: Recensione non salvata
**Soluzione**: Controlla i log backend per errori di validazione

---

## 📝 NOTE IMPLEMENTAZIONE

### Sicurezza Implementata:
- ✅ Sanitizzazione HTML nei commenti
- ✅ Validazione Zod su tutti gli input
- ✅ Controllo autorizzazioni per cliente
- ✅ Rate limiting su creazione recensioni

### Performance:
- ✅ Indici su professionalId e rating
- ✅ Cache delle statistiche (React Query)
- ✅ Paginazione liste recensioni

### Accessibilità:
- ✅ ARIA labels su stelle
- ✅ Keyboard navigation
- ✅ Screen reader compatible

---

**Autore**: Sistema Recensioni Team  
**Ultimo Aggiornamento**: 05 Ottobre 2025  
**Stato Documento**: ✅ Completo e Verificato
