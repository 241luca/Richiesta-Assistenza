# 🤖 PROMPT MASTER PER SESSIONI CLAUDE - Sistema Richiesta Assistenza

## 📋 ISTRUZIONI GENERALI PER OGNI SESSIONE

### ⚠️ REGOLE OBBLIGATORIE PER OGNI SESSIONE:

1. **PRIMA di iniziare**: 
   - Eseguire `./scripts/start-session.sh [task-id]` per setup automatico
   - Leggere SEMPRE questi documenti nell'ordine:
     - `ISTRUZIONI-PROGETTO.md` (regole tecniche vincolanti)
     - `PIANO-SVILUPPO-DETTAGLIATO.md` (roadmap completa)
     - `STATO-AVANZAMENTO.md` (cosa è già fatto)
     - Ultimo report in `REPORT-SESSIONI-CLAUDE/`

2. **DURANTE il lavoro**: 
   - Fare backup SEMPRE prima di modifiche
   - Testare OGNI modifica prima di procedere
   - Seguire i pattern obbligatori (React Query, Tailwind v3, Multi-tenancy)
   - Aggiornare documentazione man mano che si procede

3. **DOPO il lavoro**:
   - Eseguire `./scripts/end-session.sh [task-id]` per chiusura automatica
   - Verificare che siano stati aggiornati:
     - `STATO-AVANZAMENTO.md` con percentuale completamento
     - Report sessione in `REPORT-SESSIONI-CLAUDE/`
     - `CHANGELOG.md` con modifiche principali
     - `README.md` se aggiunte nuove features
     - Documentazione API se aggiunti nuovi endpoint

---

## 📚 TEMPLATE PROMPT BASE MIGLIORATO

Usa questo template per OGNI nuova sessione:

```
Sono uno sviluppatore che lavora sul progetto Richiesta Assistenza in /Users/lucamambelli/Desktop/Richiesta-Assistenza

TASK ID: [X.X]
COMPITO: [DESCRIZIONE SPECIFICA DEL TASK]

INIZIALIZZAZIONE:
Per prima cosa esegui:
./scripts/start-session.sh [X.X]

Questo script:
- Crea backup automatico pre-sessione
- Verifica servizi (PostgreSQL, Redis)
- Mostra istruzioni specifiche del task
- Crea template report sessione

POI leggi:
1. ISTRUZIONI-PROGETTO.md per le regole tecniche
2. STATO-AVANZAMENTO.md per verificare cosa è già completato
3. L'ultimo report in REPORT-SESSIONI-CLAUDE/ per il contesto

REQUISITI TECNICI:
- Usa SEMPRE React Query per API (mai fetch diretto)
- Usa SEMPRE Tailwind CSS v3 (mai v4)
- Usa SEMPRE @heroicons/react per icone
- OGNI entità DEVE avere organizationId (multi-tenancy)
- Fai SEMPRE backup prima di modificare file esistenti

DOCUMENTAZIONE DA AGGIORNARE:
Durante lo sviluppo, aggiorna:
- README.md se aggiungi nuove features
- API.md se crei nuovi endpoint (in /Docs/04-API/)
- CHANGELOG.md per ogni modifica significativa
- Schema documentazione in /Docs/02-ARCHITETTURA/ se modifichi database

AL TERMINE:
Esegui ./scripts/end-session.sh [X.X] che automaticamente:
- Esegue test completi
- Aggiorna STATO-AVANZAMENTO.md
- Completa il report sessione
- Fa commit e push su Git
- Crea backup finale

CONFERMA di aver compreso e iniziamo con il task.
```

---

## 🚀 PROMPT SPECIFICI PER FASE

## FASE 1: COMPLETAMENTO CORE

### 📁 SESSIONE 1.1: Sistema Categorie e Sottocategorie
```
Sono uno sviluppatore che lavora sul progetto Richiesta Assistenza in /Users/lucamambelli/Desktop/Richiesta-Assistenza

TASK ID: 1.1
COMPITO: Implementare il sistema completo di categorie e sottocategorie professionali

INIZIALIZZAZIONE SESSIONE:
Esegui prima:
./scripts/start-session.sh 1.1

Questo creerà backup automatico e preparerà l'ambiente.

DOCUMENTI DA LEGGERE:
1. ISTRUZIONI-PROGETTO.md (regole tecniche)
2. STATO-AVANZAMENTO.md (verifica progresso attuale)
3. Docs/03-SVILUPPO/categorie-guida.md (se esiste)

REQUISITI SPECIFICI:
1. Backend (3 ore):
   - Aggiungi al schema Prisma:
     * Modello ProfessionalSubcategory con tutti i campi dal manuale
     * Modello SubcategoryAiSettings per configurazioni AI
     * Relazioni many-to-many user-subcategories
   - Crea API REST in backend/src/routes/subcategory.routes.ts:
     * GET /api/subcategories (con filtri per categoria)
     * GET /api/subcategories/:id
     * POST /api/subcategories (admin only)
     * PUT /api/subcategories/:id (admin only)
     * DELETE /api/subcategories/:id (admin only)
   - Crea seed con categorie italiane tipiche:
     * Idraulico (riparazioni, installazioni, emergenze)
     * Elettricista (impianti, riparazioni, certificazioni)
     * Muratore (ristrutturazioni, piccoli lavori)
     * Imbianchino (tinteggiature, decorazioni)
     * Fabbro (serrature, cancelli, serrande)

2. Frontend (2 ore):
   - Crea componente src/components/categories/CategorySelector.tsx:
     * Select a cascata categoria -> sottocategoria
     * Icone colorate per ogni categoria
     * Descrizioni tooltip al hover
   - Crea pagina admin src/pages/admin/SubcategoriesPage.tsx:
     * DataTable con tutte le sottocategorie
     * Form creazione/modifica con validazione Zod
     * Toggle attivazione/disattivazione
   - Integra nel wizard richiesta esistente

3. Testing (1 ora):
   - Test API con Postman/Thunder Client
   - Test componenti UI manualmente
   - Verifica multi-tenancy (organizationId presente)

PATTERN DA SEGUIRE:
- Usa React Query per tutte le chiamate API
- Validazione con Zod sia backend che frontend
- Tailwind CSS per styling (NO CSS modules)
- Heroicons per icone

FILE DA CREARE/MODIFICARE:
- backend/prisma/schema.prisma (ADD models)
- backend/src/routes/subcategory.routes.ts (NEW)
- backend/src/services/subcategory.service.ts (NEW)
- backend/prisma/seed.ts (UPDATE)
- src/components/categories/CategorySelector.tsx (NEW)
- src/pages/admin/SubcategoriesPage.tsx (NEW)
- src/hooks/useSubcategories.ts (NEW con React Query)

DOCUMENTAZIONE DA AGGIORNARE:
- README.md: Aggiungere sezione "Gestione Categorie"
- Docs/04-API/categories-api.md: Documentare nuovi endpoint (CREATE)
- CHANGELOG.md: Aggiungere entry per sistema categorie
- Docs/02-ARCHITETTURA/database-schema.md: Aggiornare con nuovi modelli

AL TERMINE:
1. Esegui: ./scripts/test-all.sh per verificare tutto funzioni
2. Esegui: ./scripts/end-session.sh 1.1 per:
   - Aggiornare STATO-AVANZAMENTO.md automaticamente
   - Completare report sessione
   - Fare commit e push

CONFERMA di aver compreso tutte le istruzioni e procediamo.
```

### 📎 SESSIONE 1.2: Upload Allegati Multipli
```
Sono uno sviluppatore che lavora sul progetto Richiesta Assistenza in /Users/lucamambelli/Desktop/Richiesta-Assistenza

TASK ID: 1.2
COMPITO: Implementare sistema upload allegati multipli con preview

INIZIALIZZAZIONE SESSIONE:
Esegui prima:
./scripts/start-session.sh 1.2

Verifica che la cartella uploads/attachments esista o verrà creata.

DOCUMENTI DA CONSULTARE:
- DOCUMENTAZIONE_TECNICA_COMPLETA.md sezione "File Upload"
- STATO-AVANZAMENTO.md per verificare dipendenze
- Manuale delle Funzionalità.docx sezione "Upload Allegati"

REQUISITI SPECIFICI:
1. Backend (2 ore):
   - Schema Prisma per RequestAttachment:
     * id, requestId, fileName, originalName, filePath
     * fileType, fileSize, uploadedBy, uploadedAt
   - API endpoints:
     * POST /api/requests/:id/attachments (multer, max 5 files, 10MB each)
     * GET /api/requests/:id/attachments
     * DELETE /api/attachments/:id
     * GET /api/attachments/:id/download
   - Validazioni:
     * Tipi file: jpg, png, pdf, doc, docx
     * Dimensione max: 10MB per file
     * Numero max: 5 file per richiesta
   - Storage in uploads/attachments/ con nomi univoci

2. Frontend (3 ore):
   - Componente FileUploader.tsx:
     * Drag & drop area
     * Progress bar per upload
     * Preview immagini (thumbnail)
     * Lista file con possibilità rimozione
     * Icone per tipo file (PDF, DOC, etc)
   - Integrazione in RequestWizard:
     * Step dedicato per allegati
     * Validazione prima di submit
   - Hook useFileUpload con React Query:
     * Upload progressivo
     * Gestione errori
     * Retry automatico

3. Ottimizzazioni (1 ora):
   - Resize immagini con Sharp (max 1920x1080)
   - Generazione thumbnail (200x200)
   - Compressione JPG/PNG
   - Pulizia file orfani con cron job

TECNOLOGIE DA USARE:
- Multer per upload backend
- Sharp per processing immagini
- React Dropzone per drag & drop
- React Query per gestione stato upload

FILE DA CREARE/MODIFICARE:
- backend/prisma/schema.prisma (ADD RequestAttachment)
- backend/src/routes/attachment.routes.ts (NEW)
- backend/src/middleware/upload.middleware.ts (NEW)
- backend/src/services/file.service.ts (NEW)
- src/components/uploads/FileUploader.tsx (NEW)
- src/components/uploads/FilePreview.tsx (NEW)
- src/hooks/useFileUpload.ts (NEW)

DOCUMENTAZIONE DA AGGIORNARE:
- README.md: Sezione "File Attachments"
- Docs/04-API/attachments-api.md: CREATE con esempi multipart/form-data
- Docs/03-SVILUPPO/file-upload-guide.md: CREATE guida completa
- CHANGELOG.md: Feature upload multipli allegati

ESEMPI DI CODICE DA SEGUIRE:
Vedi sezione "File Upload" in DOCUMENTAZIONE_TECNICA_COMPLETA.md

TEST DA ESEGUIRE:
1. Upload file singolo < 10MB
2. Upload multiplo (3 files)
3. Upload file > 10MB (deve fallire)
4. Upload tipo non permesso (deve fallire)
5. Download file uploadato
6. Delete file con verifica rimozione fisica

AL TERMINE:
./scripts/end-session.sh 1.2

CONFERMA comprensione e procediamo.
```

### 🔔 SESSIONE 1.3: Notifiche Real-time WebSocket
```
Sono uno sviluppatore che lavora sul progetto Richiesta Assistenza in /Users/lucamambelli/Desktop/Richiesta-Assistenza

TASK ID: 1.3
COMPITO: Implementare sistema notifiche real-time con WebSocket

INIZIALIZZAZIONE:
./scripts/start-session.sh 1.3

VERIFICA PREREQUISITI:
- Redis deve essere attivo (redis-cli ping)
- Socket.io già installato in backend
- Verificare CORS configuration

DOCUMENTI RIFERIMENTO:
- DOCUMENTAZIONE_TECNICA_COMPLETA.md sezione "WebSocket Configuration"
- Manuale delle Funzionalità.docx sezione "Sistema Notifiche"

REQUISITI SPECIFICI:
1. Backend Socket.io (3 ore):
   - Setup Socket.io server:
     * Integrazione con Express esistente
     * Autenticazione JWT per connessioni
     * Rooms per organization (multi-tenancy)
   - Eventi da implementare:
     * notification:new (nuova notifica)
     * request:updated (aggiornamento richiesta)
     * quote:received (nuovo preventivo)
     * message:new (nuovo messaggio chat)
   - Notification service:
     * Salvataggio in DB
     * Invio via WebSocket
     * Fallback email se offline
     * Mark as read endpoint

2. Frontend Socket Client (2 ore):
   - Context provider SocketProvider:
     * Connessione automatica al login
     * Reconnection con exponential backoff
     * Gestione stato connessione
   - NotificationCenter component:
     * Bell icon con badge counter
     * Dropdown lista notifiche
     * Mark as read on click
     * Sound alert opzionale
   - Toast notifications:
     * react-hot-toast per notifiche popup
     * Diversi stili per tipo (success, warning, error)
     * Click to dismiss

3. Testing e ottimizzazione (1 ora):
   - Test eventi real-time
   - Verifica multi-tenancy (notifiche solo stessa org)
   - Performance con molte connessioni
   - Gestione offline/online

STRUTTURA EVENTI:
{
  type: 'request_assigned' | 'quote_received' | 'payment_completed',
  title: string,
  message: string,
  data: any,
  priority: 'low' | 'normal' | 'high' | 'urgent',
  timestamp: Date
}

FILE DA CREARE/MODIFICARE:
- backend/src/websocket/socket.server.ts (NEW)
- backend/src/services/notification.service.ts (UPDATE)
- backend/src/websocket/handlers/*.ts (NEW)
- src/contexts/SocketContext.tsx (NEW)
- src/components/notifications/NotificationCenter.tsx (NEW)
- src/components/notifications/NotificationBadge.tsx (NEW)
- src/hooks/useNotifications.ts (NEW)
- src/hooks/useSocket.ts (NEW)

DOCUMENTAZIONE DA AGGIORNARE:
- README.md: Sezione "Real-time Notifications"
- Docs/02-ARCHITETTURA/websocket-architecture.md: CREATE
- Docs/04-API/websocket-events.md: CREATE con tutti gli eventi
- CHANGELOG.md: WebSocket notifications implementate

PATTERN OBBLIGATORI:
- Autenticazione JWT per ogni connessione
- Rooms basate su organizationId
- Eventi tipizzati con TypeScript
- Gestione errori e reconnection

TEST SCENARIO:
1. Apri 2 browser con utenti stessa org
2. Crea richiesta in browser 1
3. Verifica notifica real-time in browser 2
4. Test disconnessione/riconnessione
5. Test notifiche cross-organization (NON devono arrivare)

AL TERMINE:
./scripts/end-session.sh 1.3

CONFERMA e iniziamo implementazione.
```

### 📊 SESSIONE 1.4: Sistema Preventivi Avanzato
```
Sono uno sviluppatore che lavora sul progetto Richiesta Assistenza in /Users/lucamambelli/Desktop/Richiesta-Assistenza

TASK ID: 1.4
COMPITO: Completare sistema preventivi con versionamento e template

INIZIALIZZAZIONE:
./scripts/start-session.sh 1.4

CONTROLLO DIPENDENZE:
- Verificare che Task 1.1 (Categorie) sia completato
- Verificare modello Quote base esistente
- Controllare in STATO-AVANZAMENTO.md

REQUISITI SPECIFICI:
1. Backend Quote System (3 ore):
   - Estendi schema Prisma:
     * QuoteItem (description, quantity, unitPrice, tax)
     * QuoteVersion (snapshot JSON di ogni modifica)
     * QuoteTemplate (template salvati per riuso)
     * DepositRule (regole deposito per categoria)
   - API endpoints:
     * POST /api/quotes (creazione con items)
     * PUT /api/quotes/:id (nuova versione automatica)
     * POST /api/quotes/:id/accept
     * POST /api/quotes/:id/reject
     * GET /api/quotes/:id/versions
     * POST /api/quotes/from-template/:templateId
   - Business logic:
     * Calcolo automatico totali e IVA
     * Validazione date scadenza
     * Gestione stati (draft -> pending -> accepted/rejected)
     * Notifica automatica al cliente

2. Frontend Quote Builder (3 ore):
   - QuoteBuilder.tsx component:
     * Form dinamico aggiunta items
     * Drag & drop per riordinare
     * Calcolo real-time totali
     * Anteprima PDF
   - QuoteComparison.tsx:
     * Vista side-by-side preventivi
     * Evidenziazione differenze prezzo
     * Tabella comparativa features
     * Export Excel comparazione
   - QuoteTemplates.tsx:
     * Lista template salvati
     * Creazione da preventivo esistente
     * Modifica template
     * Applicazione rapida

3. Integrazione e Test (1 ora):
   - Integrazione con sistema notifiche
   - Email automatica con PDF allegato
   - Test workflow completo
   - Verifica calcoli IVA

CALCOLI DA IMPLEMENTARE:
- Subtotale = Σ(quantity × unitPrice)
- IVA = Subtotale × taxRate
- Totale = Subtotale + IVA - Discount
- Deposito = Totale × depositPercentage

FILE DA CREARE/MODIFICARE:
- backend/prisma/schema.prisma (EXTEND Quote model)
- backend/src/services/quote.service.ts (UPDATE)
- backend/src/services/pdf.service.ts (NEW)
- backend/src/routes/quote.routes.ts (UPDATE)
- src/components/quotes/QuoteBuilder.tsx (NEW)
- src/components/quotes/QuoteComparison.tsx (NEW)
- src/components/quotes/QuoteTemplates.tsx (NEW)
- src/pages/professional/QuoteCreatePage.tsx (NEW)

DOCUMENTAZIONE DA AGGIORNARE:
- README.md: Sezione "Quote Management"
- Docs/04-API/quotes-api.md: UPDATE con nuovi endpoint
- Docs/03-SVILUPPO/quote-system-guide.md: CREATE
- Docs/05-BUSINESS-LOGIC/quote-calculations.md: CREATE
- CHANGELOG.md: Sistema preventivi avanzato

TEST COMPLETI:
1. Creazione preventivo con 3 items
2. Modifica preventivo (verifica versioning)
3. Accettazione preventivo
4. Template da preventivo esistente
5. Confronto 2 preventivi
6. Export PDF
7. Calcoli IVA 22%

AL TERMINE:
./scripts/end-session.sh 1.4

Questo completerà FASE 1. Aggiornare PIANO-SVILUPPO-DETTAGLIATO.md.

CONFERMA e procediamo.
```

---

## FASE 2: INTEGRAZIONI ESTERNE

### 🗺️ SESSIONE 2.1: Google Maps Integration
```
Sono uno sviluppatore che lavora sul progetto Richiesta Assistenza in /Users/lucamambelli/Desktop/Richiesta-Assistenza

TASK ID: 2.1
COMPITO: Integrare Google Maps per geolocalizzazione e visualizzazione

INIZIALIZZAZIONE:
./scripts/start-session.sh 2.1

PREREQUISITI:
- Google Cloud Account con billing attivo
- APIs da abilitare: Maps JavaScript API, Geocoding API, Places API
- API Key in .env: GOOGLE_MAPS_API_KEY

REQUISITI SPECIFICI:
1. Setup Google Maps (1 ora):
   - Configurare API key in .env
   - Installare @react-google-maps/api
   - Setup componente GoogleMapsProvider
   - Configurare restrizioni API key

2. Backend Geocoding (2 ore):
   - Service per geocoding indirizzi:
     * Conversione indirizzo -> coordinate
     * Reverse geocoding coordinate -> indirizzo
     * Cache risultati in Redis (TTL 30 giorni)
   - API endpoints:
     * POST /api/geocode/address
     * POST /api/geocode/reverse
     * GET /api/geocode/distance (calcolo distanza)
   - Aggiornare Request model:
     * Aggiungere latitude, longitude
     * Geocoding automatico su creazione

3. Frontend Maps Components (3 ore):
   - RequestMap.tsx:
     * Mappa con tutti i marker richieste
     * Cluster per zone dense
     * InfoWindow con dettagli richiesta
     * Filtri per stato/categoria
   - AddressAutocomplete.tsx:
     * Autocomplete Google Places
     * Restrizione a Italia
     * Validazione CAP
   - ProfessionalZoneMap.tsx:
     * Definizione zone copertura
     * Poligoni editabili
     * Calcolo area servita

4. Features Avanzate (1 ora):
   - Calcolo percorso ottimale professionista
   - Stima tempi percorrenza con traffico
   - Heatmap densità richieste
   - Export KML zone copertura

FILE DA CREARE:
- backend/src/services/geocoding.service.ts
- backend/src/routes/geocoding.routes.ts
- src/components/maps/RequestMap.tsx
- src/components/maps/AddressAutocomplete.tsx
- src/components/maps/ProfessionalZoneMap.tsx
- src/contexts/GoogleMapsContext.tsx

DOCUMENTAZIONE DA AGGIORNARE:
- README.md: Sezione "Maps Integration"
- Docs/02-ARCHITETTURA/maps-integration.md: CREATE
- Docs/06-SETUP/google-maps-setup.md: CREATE con screenshots
- .env.example: Aggiungere GOOGLE_MAPS_API_KEY
- CHANGELOG.md: Google Maps integration

CONFIGURAZIONE GOOGLE CLOUD:
- Abilitare: Maps JavaScript API, Geocoding API, Places API
- Restrizioni: HTTP referrers (localhost + produzione)
- Quote: Impostare limiti giornalieri

TEST:
1. Geocoding indirizzo italiano
2. Autocomplete con "Via Roma"
3. Visualizzazione mappa con markers
4. Calcolo distanza tra 2 punti
5. Definizione zona poligonale

AL TERMINE:
./scripts/end-session.sh 2.1

CONFERMA setup Google Cloud completato e procediamo.
```

### 💳 SESSIONE 2.2: Stripe Payment Integration
```
Sono uno sviluppatore che lavora sul progetto Richiesta Assistenza in /Users/lucamambelli/Desktop/Richiesta-Assistenza

TASK ID: 2.2
COMPITO: Integrare Stripe per gestione pagamenti e depositi

INIZIALIZZAZIONE:
./scripts/start-session.sh 2.2

PREREQUISITI STRIPE:
- Account Stripe in test mode
- API Keys (Publishable e Secret)
- Webhook endpoint configurato
- Prodotti test creati

DOCUMENTI:
- Stripe Docs: https://stripe.com/docs
- DOCUMENTAZIONE_TECNICA_COMPLETA.md sezione "Stripe Payment Integration"

REQUISITI SPECIFICI:
1. Setup Stripe (1 ora):
   - Account Stripe in test mode
   - Configurare webhook endpoint
   - API keys in .env
   - Installare @stripe/stripe-js e stripe

2. Backend Payment Processing (3 ore):
   - Payment service:
     * Create payment intent
     * Process payment
     * Handle webhooks
     * Refund management
   - Deposit rules engine:
     * Regole per categoria
     * Calcolo automatico deposito
     * Gestione eccezioni
   - API endpoints:
     * POST /api/payments/create-intent
     * POST /api/payments/confirm
     * POST /webhook/stripe
     * POST /api/payments/:id/refund
   - Database updates:
     * Payment model completo
     * Transaction history
     * Invoice generation

3. Frontend Payment Flow (2 ore):
   - PaymentForm.tsx:
     * Stripe Elements integration
     * Card input con validazione
     * 3D Secure handling
     * Loading states
   - DepositPayment.tsx:
     * Display importo deposito
     * Termini e condizioni
     * Conferma pagamento
     * Ricevuta download
   - PaymentHistory.tsx:
     * Lista transazioni
     * Filtri e ricerca
     * Export CSV
     * Download fatture

4. Testing e Security (1 ora):
   - Test carte di test Stripe
   - Webhook signature verification
   - PCI compliance check
   - Error handling completo

WEBHOOK EVENTS DA GESTIRE:
- payment_intent.succeeded
- payment_intent.payment_failed  
- charge.refunded
- invoice.payment_succeeded

FILE DA CREARE:
- backend/src/services/stripe.service.ts
- backend/src/services/deposit.service.ts
- backend/src/routes/payment.routes.ts
- backend/src/webhooks/stripe.webhook.ts
- src/components/payments/PaymentForm.tsx
- src/components/payments/DepositPayment.tsx
- src/pages/PaymentPage.tsx
- src/hooks/useStripe.ts

DOCUMENTAZIONE DA AGGIORNARE:
- README.md: Sezione "Payments"
- Docs/02-ARCHITETTURA/payment-flow.md: CREATE con diagrammi
- Docs/04-API/payments-api.md: CREATE
- Docs/06-SETUP/stripe-setup.md: CREATE
- .env.example: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
- CHANGELOG.md: Stripe integration

TESTING CARDS:
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002
- 3D Secure: 4000 0027 6000 3184

TEST END-TO-END:
1. Creazione payment intent
2. Pagamento con carta test
3. Webhook ricevuto e processato
4. Stato aggiornato in DB
5. Ricevuta generata
6. Test refund

AL TERMINE:
./scripts/end-session.sh 2.2

IMPORTANTE: Documentare tutti i webhook URL per produzione.

CONFERMA e iniziamo.
```

---

## FASE 3: INTELLIGENZA ARTIFICIALE

### 🤖 SESSIONE 3.1: OpenAI Integration Base
```
Sono uno sviluppatore che lavora sul progetto Richiesta Assistenza in /Users/lucamambelli/Desktop/Richiesta-Assistenza

TASK ID: 3.1
COMPITO: Integrare OpenAI per assistenza AI

INIZIALIZZAZIONE:
./scripts/start-session.sh 3.1

PREREQUISITI:
- OpenAI API Key con crediti
- Decisione modello: gpt-3.5-turbo o gpt-4
- Budget mensile definito

REQUISITI SPECIFICI:
[contenuto esistente...]

DOCUMENTAZIONE DA AGGIORNARE:
- README.md: Sezione "AI Assistant"
- Docs/02-ARCHITETTURA/ai-architecture.md: CREATE
- Docs/03-SVILUPPO/prompt-engineering.md: CREATE con esempi
- Docs/07-AI/prompts-library.md: CREATE libreria prompt
- .env.example: OPENAI_API_KEY
- CHANGELOG.md: OpenAI integration

AL TERMINE:
./scripts/end-session.sh 3.1
```

---

## 📝 TEMPLATE REPORT SESSIONE MIGLIORATO

Ogni sessione deve generare automaticamente questo report:

```markdown
# REPORT SESSIONE - [DATA] - Task [ID]: [NOME]

## 📋 INFORMAZIONI SESSIONE
- **Data**: 2025-08-24
- **Ora inizio**: 09:00 (da start-session.sh)
- **Ora fine**: 13:00 (da end-session.sh)
- **Durata**: 4 ore
- **Task**: 1.1 - Sistema Categorie e Sottocategorie
- **Developer**: Claude
- **Ambiente**: Development

## ✅ OBIETTIVI COMPLETATI
- [x] Schema Prisma per sottocategorie
- [x] API CRUD complete
- [x] Frontend CategorySelector
- [x] Seed dati italiani
- [ ] Test E2E (parziale)

## 📁 FILE MODIFICATI/CREATI

### Creati (8 file):
- `backend/src/routes/subcategory.routes.ts` (350 LOC)
- `backend/src/services/subcategory.service.ts` (200 LOC)
- `src/components/categories/CategorySelector.tsx` (180 LOC)
- `src/pages/admin/SubcategoriesPage.tsx` (450 LOC)
- `src/hooks/useSubcategories.ts` (120 LOC)
- `Docs/04-API/categories-api.md` (150 LOC)
- `Docs/03-SVILUPPO/categorie-guida.md` (200 LOC)

### Modificati (6 file):
- `backend/prisma/schema.prisma` (+45 LOC)
  - Backup: `schema.prisma.backup-20250824-0900`
- `backend/src/routes/index.ts` (+2 LOC)
- `README.md` (+25 LOC)
- `CHANGELOG.md` (+10 LOC)
- `STATO-AVANZAMENTO.md` (updated 1.1 to 100%)
- `backend/prisma/seed.ts` (+150 LOC)

## 📚 DOCUMENTAZIONE AGGIORNATA
- **README.md**: Aggiunta sezione "Gestione Categorie" con esempi
- **API Docs**: Creato `categories-api.md` con tutti endpoint
- **Dev Guide**: Creato `categorie-guida.md` per futuri sviluppi
- **Changelog**: Documentate tutte le modifiche v0.4.0

## 🧪 TEST EFFETTUATI
- ✅ API test con Thunder Client (tutti endpoint)
- ✅ Multi-tenancy verificato (organizationId presente)
- ✅ UI test manuale (creazione, modifica, delete)
- ✅ Seed data funzionante (5 categorie, 20 sottocategorie)
- ⚠️ Test E2E non completati (da fare in sessione dedicata)

## 🐛 PROBLEMI RISCONTRATI E RISOLTI
1. **Problema**: TypeScript error su import Prisma types
   **Soluzione**: Rigenerato client con `npx prisma generate`
   **Tempo perso**: 15 minuti
   
2. **Problema**: Tailwind classes non applicate su nuovo componente
   **Soluzione**: Aggiunto path in tailwind.config.js
   **Tempo perso**: 10 minuti

## 📊 METRICHE SESSIONE
- **Linee di codice aggiunte**: 1,650
- **Linee di codice rimosse**: 45
- **File creati**: 8
- **File modificati**: 6
- **Test coverage**: +8% (ora 33%)
- **API endpoints aggiunti**: 5
- **Componenti React aggiunti**: 3
- **Tempo produttivo**: 3h 35min / 4h (89%)

## 📸 SCREENSHOT
![Category Selector](./screenshots/category-selector.png)
![Admin Subcategories](./screenshots/admin-subcategories.png)
![API Test Results](./screenshots/api-tests.png)

## 💡 OSSERVAZIONI E MIGLIORIE
- Il sistema di categorie è ora completamente funzionale
- Performance buona con lazy loading delle sottocategorie
- UI intuitiva con feedback visuale immediato
- Possibile ottimizzazione: cache Redis per categorie frequenti
- TODO: Aggiungere ricerca full-text nelle sottocategorie

## ⏭️ PROSSIMI PASSI
1. Task 1.2: Upload Files Multipli (priorità ALTA)
2. Scrivere test E2E per categorie
3. Ottimizzare query N+1 in subcategory service
4. Aggiungere analytics uso categorie

## 📈 IMPATTO SU PROGRESSO GENERALE
- Task 1.1: ✅ 100% completato
- FASE 1 Core: 25% → 35% (+10%)
- Progresso totale: 30% → 33% (+3%)
- On track per completamento FASE 1 entro venerdì

## 💾 BACKUP CREATI
- `backups/session-20250824-090000/` (backup iniziale)
- `schema.prisma.backup-20250824-0900`
- `backups/end-session-20250824-130000/` (backup finale)

## 🔄 GIT COMMITS
```bash
git commit -m "✅ Task 1.1: Implementato sistema categorie e sottocategorie"
git commit -m "📚 Docs: Aggiornata documentazione categorie"
git commit -m "🧪 Test: Aggiunti test API categorie"
```

## ✅ DEFINITION OF DONE CHECKLIST
- [x] Codice implementato e funzionante
- [x] Test scritti (parziale, mancano E2E)
- [x] Documentazione aggiornata
- [x] Code review (self-review)
- [x] Nessun bug critico
- [x] Performance accettabile
- [x] Multi-tenancy verificato
- [x] Responsive mobile verificato

---
**Report generato automaticamente da end-session.sh**
**Verificato da**: Developer
**Status**: APPROVED ✅
```

---

## 🚨 CHECKLIST PRE-SESSIONE AGGIORNATA

Prima di OGNI sessione, il developer Claude deve:

```
□ Eseguire ./scripts/start-session.sh [task-id]
□ Leggere ISTRUZIONI-PROGETTO.md
□ Verificare STATO-AVANZAMENTO.md
□ Leggere ultimo report sessione
□ Controllare prerequisiti del task
□ Verificare ambiente dev funzionante
□ Controllare spazio disco per backup
```

---

## ⚠️ REGOLE D'ORO AGGIORNATE

1. **SEMPRE** eseguire `start-session.sh` prima di iniziare
2. **SEMPRE** aggiornare documentazione mentre si sviluppa
3. **MAI** dimenticare di eseguire `end-session.sh` 
4. **MAI** modificare senza backup
5. **MAI** usare Tailwind v4
6. **MAI** fetch diretto (sempre React Query)
7. **MAI** dimenticare organizationId
8. **SEMPRE** creare/aggiornare documentazione API
9. **SEMPRE** testare prima di committare
10. **SEMPRE** seguire i pattern esistenti

---

Documento aggiornato: 2025-08-23
Versione: 2.0.0 (con documentazione integrata)
