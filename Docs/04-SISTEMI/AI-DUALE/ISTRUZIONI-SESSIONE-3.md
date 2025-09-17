# 🚀 CONTINUA IMPLEMENTAZIONE SISTEMA AI DUALE - SESSIONE 3

## 📌 CONTESTO PROGETTO
Sistema AI Duale per professionisti nel progetto Richiesta-Assistenza.
Ogni professionista ha DUE configurazioni AI separate:
1. **AI TECNICA** - quando scrive il professionista (info complete, prezzi netti, margini)
2. **AI CLIENTE** - per i clienti (info pubbliche, prezzi finali, no dettagli interni)

## 🎯 STATO ATTUALE - COMPLETATO 60%

### ✅ Lavoro già completato (Sessioni 1-2)
1. **Database** (100% completato)
   - Schema Prisma integrato con 11 nuove tabelle
   - Migration SQL pronto in `/Docs/04-SISTEMI/AI-DUALE/migration.sql`
   - TypeScript types in `/backend/src/types/professional-whatsapp.types.ts`
   - Relazioni aggiunte in User e Subcategory models

2. **Detection Service** (80% completato)
   - `DualModeDetector` service implementato in `/backend/src/services/dual-mode-detector.service.ts`
   - Logica detection basata su numeri telefonici
   - Sistema confidence scoring
   - Override manuale per correzioni

3. **API Routes Base** (completate)
   - 8 endpoints implementati in `/backend/src/routes/professional-whatsapp.routes.ts`
   - Setup, gestione numeri, test detection, override

### ⏳ DA COMPLETARE - 40% rimanente

## 📋 TASK SESSIONE 3 - DUAL KB SERVICE

### 1️⃣ CREAZIONE DUAL KB SERVICE [Priority: HIGH]
**File da creare**: `/backend/src/services/dual-kb.service.ts`

```typescript
// STRUTTURA DEL SERVICE DA IMPLEMENTARE:

export class DualKnowledgeBaseService {
  // Metodo principale - ritorna KB basata su modalità
  async getKBForMode(
    mode: DetectionMode, 
    whatsappId: string,
    subcategoryId: string
  ): Promise<KnowledgeBase>
  
  // Update KB separate
  async updateProfessionalKB(
    whatsappId: string, 
    subcategoryId: string, 
    kb: any
  ): Promise<void>
  
  async updateClientKB(
    whatsappId: string, 
    subcategoryId: string, 
    kb: any
  ): Promise<void>
  
  // Merge KB - combina KB base con personalizzazioni
  private mergeKnowledgeBases(
    baseKB: any, 
    customKB: any
  ): KnowledgeBase
  
  // Sanitize per CLIENT mode
  sanitizeKBForClient(kb: any): any
}
```

**LOGICA IMPORTANTE**:
- **PROFESSIONAL mode**: Ritorna `kbProfessional` con TUTTI i dettagli tecnici
- **CLIENT mode**: Ritorna `kbClient` SANITIZZATA (senza prezzi netti, margini, fornitori)
- Se KB specifica non esiste, usa KB generale della sottocategoria
- Fallback su KB di default se niente disponibile

### 2️⃣ RESPONSE SANITIZER SERVICE [Priority: HIGH]
**File da creare**: `/backend/src/services/response-sanitizer.service.ts`

```typescript
export class ResponseSanitizer {
  // Pattern da rimuovere per CLIENT mode
  private patterns = {
    netPrices: /€\s*\d+(?:\.\d{2})?\s*\(netto\)/gi,
    margins: /margine:?\s*\d+%/gi,
    internalCodes: /COD-INT-\w+/gi,
    supplierInfo: /fornitore:?\s*[\w\s]+/gi,
    technicalNotes: /\[NOTA TECNICA:.*?\]/gi,
    internalComments: /\[INTERNO:.*?\]/gi
  };
  
  // Metodo principale
  sanitizeResponse(
    response: string, 
    mode: DetectionMode
  ): string {
    if (mode === DetectionMode.PROFESSIONAL) {
      return response; // Nessuna sanitizzazione
    }
    
    // Per CLIENT mode:
    // 1. Rimuovi pattern sensibili
    // 2. Converti prezzi netti in pubblici (+35% markup)
    // 3. Rimuovi riferimenti interni
    // 4. Semplifica linguaggio tecnico
  }
  
  // Conversione prezzi
  private convertNetToPublicPrice(netPrice: number): number {
    const markup = 1.35; // 35% markup standard
    const publicPrice = netPrice * markup;
    return Math.round(publicPrice * 100) / 100;
  }
}
```

**REGOLE SANITIZZAZIONE**:
1. Rimuovere SEMPRE: margini, codici fornitori, note interne
2. Convertire prezzi: netto → pubblico con markup 35%
3. Semplificare termini tecnici troppo complessi
4. Mantenere info utili per cliente ma senza dettagli business

### 3️⃣ API ROUTES PER DUAL KB [Priority: MEDIUM]
**File da modificare**: `/backend/src/routes/professional-whatsapp.routes.ts`

Aggiungere questi nuovi endpoints:

```typescript
// GET /api/professional/whatsapp/kb/:subcategoryId
// Ottieni KB duale per sottocategoria
router.get('/kb/:subcategoryId', authenticate, async (req, res) => {
  // Ritorna sia kbProfessional che kbClient
});

// PUT /api/professional/whatsapp/kb/:subcategoryId/professional
// Aggiorna KB tecnica
router.put('/kb/:subcategoryId/professional', authenticate, async (req, res) => {
  // Solo info tecniche complete
});

// PUT /api/professional/whatsapp/kb/:subcategoryId/client
// Aggiorna KB cliente
router.put('/kb/:subcategoryId/client', authenticate, async (req, res) => {
  // Solo info pubbliche
});

// POST /api/professional/whatsapp/test-sanitization
// Test sanitizzazione risposta
router.post('/test-sanitization', authenticate, async (req, res) => {
  const { text, mode } = req.body;
  // Testa come viene sanitizzato un testo
});
```

### 4️⃣ INTEGRAZIONE CON WHATSAPP SERVICE [Priority: HIGH]
**File da modificare**: `/backend/src/services/whatsapp.service.ts`

Trova la funzione che processa i messaggi in arrivo e aggiungi:

```typescript
// PSEUDO-CODICE DA INTEGRARE:

async processIncomingMessage(message: any) {
  // 1. Detect sender type
  const detection = await dualModeDetector.detectSenderType(
    message.from, 
    instanceId
  );
  
  // 2. Get appropriate KB
  const kb = await dualKBService.getKBForMode(
    detection.mode,
    whatsappId,
    subcategoryId
  );
  
  // 3. Generate AI response with correct config
  const aiConfig = detection.mode === DetectionMode.PROFESSIONAL 
    ? whatsappConfig.aiConfigProfessional
    : whatsappConfig.aiConfigClient;
    
  const aiResponse = await generateAIResponse(
    message.text,
    kb,
    aiConfig
  );
  
  // 4. Sanitize response if needed
  const finalResponse = sanitizer.sanitizeResponse(
    aiResponse,
    detection.mode
  );
  
  // 5. Send response
  await sendWhatsAppMessage(message.from, finalResponse);
  
  // 6. Log detection result
  await logDetectionResult(detection, message);
}
```

### 5️⃣ TEST CASES DA IMPLEMENTARE [Priority: MEDIUM]
**File da creare**: `/backend/src/__tests__/dual-mode.test.ts`

```typescript
describe('Dual Mode Detection', () => {
  test('Professional number detected correctly', async () => {
    // Test con numero registrato come professional
  });
  
  test('Client number gets sanitized response', async () => {
    // Test che risposta per cliente non contenga info sensibili
  });
  
  test('Override detection works', async () => {
    // Test override manuale
  });
  
  test('Price conversion working', async () => {
    // Test conversione prezzi netti → pubblici
  });
});
```

## 🔧 COMANDI PER INIZIARE

```bash
# 1. Naviga al progetto
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# 2. Verifica stato attuale
cat Docs/04-SISTEMI/AI-DUALE/AI-DUALE-PROGRESS.md

# 3. Controlla file esistenti
ls -la backend/src/services/dual-*
ls -la backend/src/types/professional-whatsapp.types.ts

# 4. Genera Prisma client (se necessario)
cd backend
npx prisma generate

# 5. Verifica che il detection service esista
cat backend/src/services/dual-mode-detector.service.ts | head -50
```

## ⚠️ ATTENZIONE - PUNTI CRITICI

1. **NON modificare** la logica di detection già implementata
2. **SEMPRE usare** ResponseFormatter nelle routes (MAI nei services)
3. **Il client API ha già `/api`** nel baseURL - NON duplicare!
4. **Fare BACKUP** prima di modifiche a file esistenti
5. **La modalità CLIENT è il default** per sicurezza (99% messaggi da clienti)

## 📊 TESTING CHECKLIST

Dopo aver completato l'implementazione, testare:

- [ ] Professional invia messaggio → riceve info complete con prezzi netti
- [ ] Cliente invia messaggio → riceve info semplificate con prezzi pubblici
- [ ] Override manuale funziona correttamente
- [ ] Sanitizzazione rimuove tutti i pattern sensibili
- [ ] Conversione prezzi aggiunge 35% markup
- [ ] KB separate per sottocategoria funzionano
- [ ] Fallback su KB default se specifica non esiste

## 📝 EXPECTED OUTPUT SESSIONE 3

Al termine della sessione dovresti avere:

1. ✅ `dual-kb.service.ts` completo e funzionante
2. ✅ `response-sanitizer.service.ts` con tutti i pattern
3. ✅ 4 nuovi endpoints per gestione KB duale
4. ✅ Integrazione con WhatsApp service
5. ✅ Test base implementati
6. ✅ Progress aggiornato al 80%+

## 🎯 NEXT STEPS (Sessione 4)

Dopo questa sessione, rimarrà da fare:
- Frontend dashboard per gestione
- Testing E2E completo
- Documentazione utente
- Deploy e configurazione produzione

## 📚 FILE DI RIFERIMENTO

**LEGGERE SEMPRE**:
- `/ISTRUZIONI-PROGETTO.md` - Regole tecniche OBBLIGATORIE
- `/Docs/04-SISTEMI/AI-DUALE/AI-DUALE-PROGRESS.md` - Tracking progress
- `/backend/src/types/professional-whatsapp.types.ts` - TypeScript types

**FILE GIÀ CREATI**:
- `/backend/src/services/dual-mode-detector.service.ts` - Detection service
- `/backend/src/routes/professional-whatsapp.routes.ts` - Routes esistenti
- `/backend/prisma/schema.prisma` - Schema con tabelle AI duale

## 💡 SUGGERIMENTI

1. **Inizia dal Dual KB Service** - è il componente più importante
2. **Testa la sanitizzazione** con esempi reali di testi con prezzi
3. **Usa i TypeScript types** già definiti, non crearne di nuovi
4. **Segui i pattern esistenti** nel progetto per coerenza
5. **Aggiorna il progress tracking** dopo ogni componente completato

---

**INIZIA CON**: Creazione del Dual KB Service seguendo la struttura indicata sopra.