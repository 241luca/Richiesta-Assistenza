# 📋 ISTRUZIONI-PROGETTO - Sistema Richiesta Assistenza v4.3.0

> ⚠️ **LEGGERE PRIMA DI INIZIARE QUALSIASI LAVORO**
> 
> Ultimo aggiornamento: 06 Ottobre 2025 (v4.3.0 - Sistema Moduli Completo)
> 
> Questo documento contiene TUTTE le regole tecniche VINCOLANTI per lo sviluppo del progetto.

┌─────────────────────────────────────────────────────────────────┐
│ 🚨 ATTENZIONE CLAUDE E SVILUPPATORI 🚨                         │
│                                                                 │
│ REGOLA ASSOLUTA DOCUMENTAZIONE:                                │
│ ════════════════════════════════                               │
│ ❌ VIETATO salvare file .md nella root del progetto           │
│ ✅ OBBLIGATORIO usare DOCUMENTAZIONE/ per TUTTI i documenti   │
│                                                                 │
│ SOLO 4 FILE .MD AUTORIZZATI NELLA ROOT:                        │
│ 1. README.md                                                    │
│ 2. ISTRUZIONI-PROGETTO.md (questo file)                       │
│ 3. CHANGELOG.md                                                 │
│ 4. LEGGIMI-DOCUMENTAZIONE.md                                   │
│                                                                 │
│ TUTTI GLI ALTRI → DOCUMENTAZIONE/                              │
│ Il pre-commit-check.sh BLOCCA i commit non conformi!           │
└─────────────────────────────────────────────────────────────────┘

## 🤖 ISTRUZIONI PER CLAUDE (OBBLIGATORIE OGNI SESSIONE)

All'inizio di OGNI sessione:
1. ✅ Leggere ISTRUZIONI-PROGETTO.md (questo file)
2. ✅ Verificare: "Dove salverò la documentazione?" → SEMPRE in DOCUMENTAZIONE/
3. ✅ Creare report finale: DOCUMENTAZIONE/REPORT-SESSIONI/YYYY-MM-DD-descrizione.md

⚠️ **MAI** creare file .md nella root! Il sistema li RIFIUTA!

---

## 🚀 QUICK START (5 MINUTI)

> 📚 **REMINDER**: Tutta la documentazione va in DOCUMENTAZIONE/, MAI nella root!

### Setup Nuovo Developer
```bash
# 1. Clone e setup iniziale
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd richiesta-assistenza

# 2. Installa dipendenze
npm install
cd backend && npm install && cd ..

# 3. Setup database
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed  # Dati di test
cd ..

# 4. Avvia il sistema
# Terminal 1 - Backend
cd backend && npm run dev  # Backend su :3200

# Terminal 2 - Frontend  
npm run dev                # Frontend su :5193

# Terminal 3 - Redis (opzionale ma consigliato)
redis-server

# 5. Verifica funzionamento
curl http://localhost:3200/api/health
# Browser: http://localhost:5193
```

### Comandi Essenziali
```bash
# Prima di iniziare a lavorare
./scripts/check-system.sh       # Verifica stato sistema

# Dopo modifiche
./scripts/validate-work.sh       # Valida il tuo lavoro

# Prima del commit
./scripts/pre-commit-check.sh    # Controlli obbligatori
```

---

## 📖 INDICE

> 🚀 **NUOVO**: Per riferimento rapido del sistema, consultare [QUICK-REFERENCE.md](DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/QUICK-REFERENCE.md)

1. [**🔴 LE 8 REGOLE D'ORO**](#-le-7-regole-doro) - MEMORIZZARE!
2. [**⚠️ ERRORI FREQUENTI DA EVITARE**](#-errori-frequenti-da-evitare)
3. [**📋 Quick Reference Card**](#-quick-reference-card)
4. [**🏗️ Architettura Sistema**](#-architettura-sistema)
5. [**✅ Funzionalità Implementate**](#-funzionalità-implementate)
6. [**💻 Sviluppo**](#-sviluppo)
7. [**🗄️ Database Best Practices**](#-database-best-practices)
8. [**🔐 Security Checklist**](#-security-checklist) 
9. [**🧪 Testing Requirements**](#-testing-requirements)
10. [**⚡ Performance Guidelines**](#-performance-guidelines)
11. [**📦 Deployment**](#-deployment)
12. [**🔧 Troubleshooting**](#-troubleshooting)
13. [**📝 Templates**](#-templates)
14. [**🤖 Script Automazione**](#-script-automazione)
15. [**📚 Gestione Documentazione**](#-gestione-documentazione) - IMPORTANTE!
16. [**✅ Checklist Finale**](#-checklist-finale)

---

## 🔴 LE 8 REGOLE D'ORO - MEMORIZZARE OBBLIGATORIAMENTE!

### 1️⃣ ResponseFormatter SEMPRE nelle Routes
```typescript
// ✅ SEMPRE
return res.json(ResponseFormatter.success(data, 'Success'));
return res.status(400).json(ResponseFormatter.error('Error', 'CODE'));

// ❌ MAI
res.json({ data });
```

### 2️⃣ React Query per TUTTE le API
```typescript
// ✅ SEMPRE
const { data } = useQuery({
  queryKey: ['items'],
  queryFn: () => api.get('/items')  // NO /api/items!
});

// ❌ MAI
const data = await fetch('/api/items');
```

### 3️⃣ API Client ha già /api nel baseURL
```typescript
// ⚠️ ERRORE FREQUENTISSIMO!
// ❌ SBAGLIATO - Risulta in /api/api/users
api.get('/api/users')  

// ✅ CORRETTO - Risulta in /api/users
api.get('/users')

// Il client Axios è configurato così:
const api = axios.create({
  baseURL: 'http://localhost:3200/api',  // <-- /api già incluso!
  headers: { 'Content-Type': 'application/json' }
});
```

### 4️⃣ Relazioni Prisma con @relation
```prisma
// ✅ SEMPRE
client User @relation("ClientRequests", fields: [clientId], references: [id])

// ❌ MAI (nomi auto-generati)
User_AssistanceRequest_clientIdToUser User
```

### 5️⃣ Backup PRIMA di modifiche critiche
```bash
cp file.tsx file.backup-$(date +%Y%m%d-%H%M%S).tsx
```

### 6️⃣ Test PRIMA del commit
```bash
./scripts/pre-commit-check.sh  # OBBLIGATORIO!
```

### 7️⃣ WebSocket per notifiche real-time
```typescript
// ✅ Usa il sistema notifiche centralizzato
notificationService.sendToUser(userId, notification);

// ❌ NON creare WebSocket custom
io.to(userId).emit('custom-event', data);
```

### 8️⃣ Documentazione SEMPRE in DOCUMENTAZIONE/ (CRITICO!)
```bash
# ✅ SEMPRE - Tutti i documenti in DOCUMENTAZIONE/
DOCUMENTAZIONE/REPORT-SESSIONI/2025-09-11-fix-sistema.md
DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/nuova-feature.md

# ❌ MAI - File .md sparsi nella root
REPORT-FIX-COMPLETO.md  # VIETATO!
ANALISI-SISTEMA.md      # BLOCCATO DAL PRE-COMMIT!

# 🚨 CONSEGUENZE: pre-commit-check.sh BLOCCA IL COMMIT!
```

---

## ⚠️ ERRORI FREQUENTI DA EVITARE

### 🔴 ERRORE #1: Doppio /api negli URL
```typescript
// ❌ ERRORE COMUNE - Genera /api/api/endpoint
await api.get('/api/users');
await api.post('/api/requests');

// ✅ CORRETTO - api client ha già /api nel baseURL
await api.get('/users');
await api.post('/requests');

// 📌 RICORDA: services/api.ts configura già baseURL con /api
```

### 🔴 ERRORE #2: ResponseFormatter nei Services
```typescript
// ❌ MAI nei services
export async function getUsers() {
  const users = await prisma.user.findMany();
  return ResponseFormatter.success(users);  // NO!
}

// ✅ SOLO nelle routes
router.get('/users', async (req, res) => {
  const users = await userService.getUsers();
  return res.json(ResponseFormatter.success(users));  // SI!
});
```

### 🔴 ERRORE #3: Fetch invece di React Query
```typescript
// ❌ NON usare fetch diretto
useEffect(() => {
  fetch('/api/data').then(res => res.json())...
}, []);

// ✅ SEMPRE React Query
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: () => api.get('/data')
});
```

### 🔴 ERRORE #4: Console.log in produzione
```typescript
// ❌ Rimuovere prima del commit
console.log('Debug:', data);

// ✅ Usare il logger
logger.debug('Debug:', data);
```

### 🔴 ERRORE #5: File .md sparsi nella root (GRAVISSIMO!)
```bash
# ❌ ERRORE BLOCCANTE - File nella root
REPORT-SESSIONE-COMPLETO.md      # VIETATO!
ANALISI-SISTEMA.md                # RIFIUTATO!
FIX-PROBLEMA.md                   # BLOCCATO!

# ✅ CORRETTO - Sempre in DOCUMENTAZIONE/
DOCUMENTAZIONE/REPORT-SESSIONI/2025-09-11-sessione-completa.md
DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/analisi-sistema.md
DOCUMENTAZIONE/ARCHIVIO/report-vari/fix-problema.md

# 🚨 IL SISTEMA BLOCCA AUTOMATICAMENTE I COMMIT NON CONFORMI!
```

---

## 📋 QUICK REFERENCE CARD

### Porte Sistema
- **Backend**: http://localhost:3200
- **Frontend**: http://localhost:5193
- **Database**: PostgreSQL (vedi .env)
- **Redis**: localhost:6379
- **WebSocket**: ws://localhost:3200

### API Endpoints Base
- **API Base**: http://localhost:3200/api (già configurato in axios)
- **Health Check**: http://localhost:3200/api/health
- **Admin Dashboard**: http://localhost:5193/admin
- **Professional Area**: http://localhost:5193/professional

### Comandi Frequenti
```bash
# Database
cd backend
npx prisma generate         # Rigenera client
npx prisma db push         # Applica schema
npx prisma studio          # GUI database
npx prisma db seed         # Popola dati test

# TypeScript
npx tsc --noEmit          # Check errori

# Test
npm test                  # Run tests
npm run test:coverage     # Coverage report

# Build
npm run build            # Build production

# Scripts utili
./scripts/check-system.sh        # Verifica sistema
./scripts/test-finale.sh          # Test completo
./scripts/backup-all.sh           # Backup completo
```

### File Critici
```
# FILE ROOT (mantenuti nella root)
/ISTRUZIONI-PROGETTO.md                    # Questo file (regole tecniche)
/README.md                                 # Overview progetto
/CHANGELOG.md                              # Storia versioni
/LEGGIMI-DOCUMENTAZIONE.md                 # Guida struttura docs

# DOCUMENTAZIONE ESSENZIALE
/DOCUMENTAZIONE/INDEX.md                                                        # 👈 PUNTO DI PARTENZA navigazione
/DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/QUICK-REFERENCE.md                       # 🆕 Riferimento rapido sistema
/DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/ARCHITETTURA-SISTEMA-COMPLETA.md         # Architettura dettagliata
/DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/CHECKLIST-FUNZIONALITA-SISTEMA.md        # Stato funzionalità
/DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/PIANO-MIGLIORAMENTO-DOCUMENTAZIONE.md    # Roadmap docs
/DOCUMENTAZIONE/REPORT-SESSIONI/                                               # Report sviluppo

# FILE TECNICI
/backend/prisma/schema.prisma             # Schema database (85+ tabelle)
/backend/src/utils/responseFormatter.ts   # ResponseFormatter
/src/services/api.ts                      # API client (⚠️ ha già /api)
/.env                                      # Configurazioni
```

---

## 🏗️ ARCHITETTURA SISTEMA

### Stack Tecnologico Consolidato

#### Frontend
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "tailwindcss": "^3.4.0",  // ⚠️ NON v4!
  "@tanstack/react-query": "^5.x",
  "@heroicons/react": "^2.x",
  "lucide-react": "latest",
  "vite": "^5.x",
  "typescript": "^5.x",
  "axios": "^1.x"
}
```

#### Backend
```json
{
  "express": "^4.x",
  "prisma": "@latest",
  "@prisma/client": "@latest",
  "jsonwebtoken": "^9.x",
  "bcrypt": "^5.x",
  "socket.io": "^4.x",
  "bull": "^4.x",
  "redis": "^4.x",
  "node-cron": "^3.x",
  "winston": "^3.x"
}
```

### Struttura Directory
```
richiesta-assistenza/
├── 📚 DOCUMENTAZIONE/       # ⚠️ TUTTA LA DOCUMENTAZIONE QUI!
│   ├── INDEX.md            # Punto di partenza navigazione
│   ├── ATTUALE/            # Documentazione valida
│   │   ├── 00-ESSENZIALI/  # File critici
│   │   ├── 01-ARCHITETTURA/# Architettura sistema
│   │   ├── 02-FUNZIONALITA/# Docs per feature
│   │   ├── 03-API/         # Documentazione API
│   │   ├── 04-GUIDE/       # Guide pratiche
│   │   └── 05-TROUBLESHOOTING/
│   ├── ARCHIVIO/           # Docs storica
│   └── REPORT-SESSIONI/    # ⚠️ TUTTI I REPORT QUI!
├── src/                    # Frontend React (⚠️ NON /frontend!)
│   ├── components/         # Componenti React
│   ├── pages/              # Pagine route
│   ├── contexts/           # React Contexts
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services (⚠️ api.ts ha /api)
│   └── types/              # TypeScript types
├── backend/                # Backend Express
│   ├── src/
│   │   ├── routes/         # 70+ API endpoints
│   │   ├── services/       # 50+ Business logic services
│   │   ├── middleware/     # Auth, audit, security
│   │   └── utils/          # Utilities
│   └── prisma/
│       └── schema.prisma   # Database schema (30+ tabelle)
├── scripts/                # Script automazione
├── logs/                   # Log applicazione
├── uploads/                # File uploads
└── database-backups/       # Backup automatici
```

---

## ✅ FUNZIONALITÀ IMPLEMENTATE

### 🎯 Sistema Core
- ✅ **Autenticazione**: JWT + 2FA con Speakeasy
- ✅ **Autorizzazione**: RBAC con 4 ruoli (CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN)
- ✅ **Gestione Utenti**: CRUD completo con profili dettagliati
- ✅ **Richieste Assistenza**: Flusso completo da creazione a completamento
- ✅ **Sistema Preventivi**: Multi-versione con accettazione/rifiuto
- ✅ **Categorie/Sottocategorie**: Sistema gerarchico con filtri intelligenti

### 📝 Rapporti Intervento (NUOVO)
- ✅ **Template Personalizzabili**: Per tipo di intervento
- ✅ **Gestione Materiali**: Con prezzi e quantità
- ✅ **Frasi Predefinite**: Per velocizzare compilazione
- ✅ **Export PDF**: Generazione automatica rapporti
- ✅ **Firma Digitale**: Cliente può firmare su tablet/telefono

### 🔔 Sistema Notifiche Centralizzato
- ✅ **Template Manager**: Admin gestisce tutti i template
- ✅ **Multi-canale**: Email (Brevo) + In-app (WebSocket)
- ✅ **Real-time**: Notifiche push immediate
- ✅ **Centro Notifiche**: Per ogni utente con stato letto/non letto
- ✅ **Scheduler**: Invio programmato notifiche

### 📊 Audit Log System
- ✅ **Tracciamento Completo**: Ogni azione registrata
- ✅ **Security Monitoring**: Login, tentativi falliti, azioni sospette
- ✅ **Alert Automatici**: Su eventi critici
- ✅ **Retention Policy**: Per categoria di log
- ✅ **Dashboard Analytics**: Visualizzazione log e statistiche

### 💾 Sistema Backup
- ✅ **Backup Automatici**: Schedulabili con cron
- ✅ **Backup Manuali**: Da interfaccia admin
- ✅ **Retention Management**: Gestione spazio e durata
- ✅ **Recovery Point**: Ripristino a punto specifico
- ✅ **Export Dati**: CSV, JSON, SQL

### ❤️ Health Monitor
- ✅ **Check Automatici**: Ogni 5 minuti
- ✅ **Dashboard Real-time**: Stato tutti i servizi
- ✅ **Auto-remediation**: Fix automatici problemi comuni
- ✅ **Performance Metrics**: CPU, RAM, DB connections
- ✅ **Alert System**: Email/SMS su problemi critici
- ✅ **Report Settimanali**: Analisi trend e problemi

### 🛠️ Script Manager
- ✅ **Esecuzione Sicura**: Solo script autorizzati
- ✅ **Categorizzazione**: Per rischio (low/medium/high/critical)
- ✅ **Log Esecuzione**: Tracciamento completo
- ✅ **Parametri Dinamici**: Input validati
- ✅ **Scheduler Integration**: Script programmabili

### 📅 Interventi Multipli Programmati
- ✅ **Calendario Professionale**: Vista mensile/settimanale
- ✅ **Slot Management**: Gestione disponibilità orarie
- ✅ **Conflict Detection**: Evita sovrapposizioni
- ✅ **Recurring Events**: Interventi ricorrenti
- ✅ **Google Calendar Sync**: (Opzionale)

### 👷 Gestione Professionisti
- ✅ **Skills & Certificazioni**: Portfolio completo
- ✅ **Sistema Tariffe**: Personalizzabile per professionista
- ✅ **Costi Trasferimento**: Scaglioni chilometrici
- ✅ **Rating & Reviews**: Sistema recensioni bidirezionale
- ✅ **Disponibilità**: Calendario e orari di lavoro
- ✅ **Zone Operative**: Gestione aree di copertura

### 💬 Chat & Comunicazione
- ✅ **Chat Real-time**: WebSocket tra cliente e professionista
- ✅ **File Sharing**: Invio documenti e immagini
- ✅ **Message History**: Storico conversazioni
- ✅ **Typing Indicators**: Stato digitazione
- ✅ **Read Receipts**: Conferme di lettura

### 📱 Integrazione WhatsApp (NUOVO v4.3)
- ✅ **Connessione SendApp**: API cloud per WhatsApp Business
- ✅ **Invio Messaggi**: Singoli e di gruppo
- ✅ **Invio Media**: Immagini e documenti
- ✅ **QR Code Login**: Autenticazione WhatsApp Web
- ✅ **Stato Connessione**: Gestione manuale stato
- ✅ **Instance Management**: Creazione e reset istanze
- 📝 **Documentazione**: `/Docs/04-SISTEMI/WHATSAPP-INTEGRATION.md`

### 🤖 AI Integration
- ✅ **AI Assistant**: Supporto professionisti con GPT
- ✅ **Sistema AI Duale**: Configurazioni separate per professionisti e clienti
- ✅ **Smart Suggestions**: Suggerimenti preventivi
- ✅ **Auto-categorization**: Classificazione automatica richieste
- ✅ **Knowledge Base**: Documenti e FAQ con embeddings
- ✅ **Conversation Memory**: Contesto mantenuto
- ✅ **Tabelle Separate**: ProfessionalAiSettings e ClientAiSettings

### 🗺️ Maps & Geocoding
- ✅ **Google Maps Integration**: Visualizzazione indirizzi
- ✅ **Distance Calculation**: Calcolo km per trasferimento
- ✅ **Route Planning**: Itinerari ottimizzati
- ✅ **Area Coverage**: Visualizzazione zone operative
- ✅ **Address Autocomplete**: Suggerimenti indirizzi

### 📈 Analytics & Reporting
- ✅ **Dashboard Multi-ruolo**: KPI personalizzati
- ✅ **Revenue Tracking**: Fatturato e margini
- ✅ **Performance Metrics**: Tempi risposta, conversion rate
- ✅ **Export Reports**: PDF, Excel, CSV
- ✅ **Trend Analysis**: Grafici e previsioni

---

## 💻 SVILUPPO

### 🔥 PATTERN RESPONSEFORMATTER - REGOLA FONDAMENTALE DEL PROGETTO

> ⚠️ **CRITICO**: Il ResponseFormatter è lo STANDARD ASSOLUTO per la comunicazione Backend-Frontend.
> OGNI risposta API DEVE usare ResponseFormatter. NESSUNA ECCEZIONE.

#### 📋 Architettura ResponseFormatter

Il sistema usa **DUE file ResponseFormatter separati** con scopi diversi:

1. **Backend** (`/backend/src/utils/responseFormatter.ts`)
   - **Scopo**: CREARE risposte standardizzate
   - **Uso**: SOLO nelle routes, MAI nei services
   - **Funzioni**: `success()`, `error()`, `paginated()`

2. **Frontend** (`/src/utils/responseFormatter.ts`)
   - **Scopo**: INTERPRETARE risposte dal backend
   - **Uso**: Nei componenti per gestire errori e dati
   - **Funzioni**: `getErrorMessage()`, `getData()`, `isValidationError()`

#### 🎯 Struttura Standard delle Risposte

**Risposta di Successo**:
```json
{
  "success": true,
  "message": "Operazione completata",
  "data": { /* dati richiesti */ },
  "metadata": { /* opzionale */ },
  "timestamp": "2025-01-10T..."
}
```

**Risposta di Errore**:
```json
{
  "success": false,
  "message": "Descrizione errore",
  "error": {
    "code": "ERROR_CODE",
    "details": /* dettagli errore o array Zod */
  },
  "timestamp": "2025-01-10T..."
}
```

#### ✅ USO CORRETTO NEL BACKEND

```typescript
// routes/users.routes.ts - SEMPRE nelle routes!
router.get('/users', authenticate, async (req: any, res) => {
  try {
    const users = await userService.getAllUsers();
    // ✅ SEMPRE ResponseFormatter nelle routes
    return res.json(ResponseFormatter.success(
      users, 
      'Utenti recuperati con successo'
    ));
  } catch (error) {
    logger.error('Error:', error);
    
    // ✅ Gestione errori con ResponseFormatter
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error(
        'Dati non validi',
        'VALIDATION_ERROR',
        error.errors  // Dettagli Zod
      ));
    }
    
    return res.status(500).json(ResponseFormatter.error(
      'Errore nel recupero utenti',
      'FETCH_ERROR'
    ));
  }
});

// services/user.service.ts - MAI ResponseFormatter nei services!
export async function getAllUsers() {
  // ✅ Services ritornano SOLO dati, niente ResponseFormatter
  return await prisma.user.findMany();
}
```

#### ✅ USO CORRETTO NEL FRONTEND

```typescript
import { ResponseFormatter } from '@/utils/responseFormatter';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';

function MyComponent() {
  const mutation = useMutation({
    mutationFn: (data) => api.post('/users', data),
    
    onSuccess: (response) => {
      // ✅ Usa ResponseFormatter per estrarre dati
      const data = ResponseFormatter.getData(response);
      const message = ResponseFormatter.getMessage(response);
      toast.success(message);
    },
    
    onError: (error) => {
      // ✅ Usa ResponseFormatter per gestire errori
      const errorMessage = ResponseFormatter.getErrorMessage(error);
      toast.error(errorMessage);
      
      // Gestione specifica per tipo di errore
      if (ResponseFormatter.isValidationError(error)) {
        const validationErrors = ResponseFormatter.getValidationErrors(error);
        // Mostra errori per campo
      }
      
      if (ResponseFormatter.isAuthError(error)) {
        // Redirect al login
        navigate('/login');
      }
    }
  });
}
```

#### ❌ ERRORI DA NON FARE MAI

```typescript
// ❌ MAI ResponseFormatter nei services
service.getUsers() {
  const users = await prisma.user.findMany();
  return ResponseFormatter.success(users);  // NO!!!
}

// ❌ MAI risposte custom nelle routes
router.get('/users', (req, res) => {
  const users = await service.getUsers();
  res.json({ data: users });  // NO!!! Usa ResponseFormatter
});

// ❌ MAI gestire errori senza ResponseFormatter nel frontend
onError: (error) => {
  toast.error(error.message);  // NO!!! Potrebbe essere un oggetto
  // Usa sempre ResponseFormatter.getErrorMessage(error)
}
```

#### 🔍 Verifica Automatica

Il pre-commit check verifica automaticamente:
1. ResponseFormatter presente in TUTTE le routes
2. ResponseFormatter NON presente nei services
3. Gestione errori corretta nel frontend

```bash
# Verifica manuale
grep -L "ResponseFormatter" backend/src/routes/*.ts  # Non deve trovare nulla
grep -l "ResponseFormatter" backend/src/services/*.ts  # Non deve trovare nulla
```

#### 📊 Vantaggi del Pattern

1. **Consistenza Totale**: Tutte le API rispondono allo stesso modo
2. **Type Safety**: TypeScript può inferire i tipi delle risposte
3. **Error Handling Robusto**: Nessun crash per oggetti errore
4. **Manutenzione Facile**: Un solo punto per modificare il formato
5. **Debug Semplificato**: Struttura prevedibile per tutti
6. **Frontend Sicuro**: Mai errori React per oggetti renderizzati

### Pattern ResponseFormatter (CRITICO!)

#### ✅ CORRETTO - Nelle Routes
```typescript
// routes/users.routes.ts
router.get('/users', authenticate, async (req: any, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.json(ResponseFormatter.success(users, 'Users retrieved'));
  } catch (error) {
    logger.error('Error:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed', 'FETCH_ERROR')
    );
  }
});
```

#### ❌ SBAGLIATO - Nei Services
```typescript
// services/user.service.ts
export async function getAllUsers() {
  return await prisma.user.findMany(); // ✅ Ritorna dati diretti
  // ❌ MAI: return ResponseFormatter.success(users)
}
```

### Pattern API Client (ATTENZIONE!)

#### ⚠️ CONFIGURAZIONE API CLIENT
```typescript
// src/services/api.ts
const api = axios.create({
  baseURL: 'http://localhost:3200/api',  // ⚠️ NOTA: /api GIÀ INCLUSO!
  headers: {
    'Content-Type': 'application/json'
  }
});
```

#### ✅ USO CORRETTO
```typescript
// ✅ CORRETTO - Non aggiungere /api
api.get('/users')           // → http://localhost:3200/api/users
api.post('/requests')       // → http://localhost:3200/api/requests
api.put('/quotes/123')      // → http://localhost:3200/api/quotes/123

// ❌ SBAGLIATO - Doppio /api
api.get('/api/users')       // → http://localhost:3200/api/api/users ❌
```

### Pattern React Query

#### Query Pattern
```typescript
// ✅ CORRETTO - Nota: NO /api nell'URL!
const { data, isLoading, error } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => api.get('/users', { params: filters }),  // NO /api!
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 3
});
```

#### Mutation Pattern
```typescript
// ✅ CORRETTO
const mutation = useMutation({
  mutationFn: (data) => api.post('/users', data),  // NO /api!
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success('User created!');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

### Pattern WebSocket Notifiche

```typescript
// ✅ USA IL SISTEMA CENTRALIZZATO
import { notificationService } from '@/services/notification.service';

// Invio notifica
await notificationService.sendToUser(userId, {
  title: 'Nuovo preventivo',
  message: 'Hai ricevuto un nuovo preventivo',
  type: 'quote_received',
  data: { quoteId, requestId }
});

// ❌ NON CREARE SOCKET CUSTOM
io.to(userId).emit('custom-notification', data);  // NO!
```

### Pattern Prisma Relazioni

#### Schema con @relation
```prisma
model AssistanceRequest {
  id              String   @id @default(cuid())
  clientId        String
  professionalId  String?
  categoryId      String
  
  // ✅ Relazioni con nomi stabili
  client          User     @relation("ClientRequests", fields: [clientId], references: [id])
  professional    User?    @relation("ProfessionalRequests", fields: [professionalId], references: [id])
  category        Category @relation(fields: [categoryId], references: [id])
}

model User {
  id                   String @id @default(cuid())
  clientRequests       AssistanceRequest[] @relation("ClientRequests")
  professionalRequests AssistanceRequest[] @relation("ProfessionalRequests")
}
```

#### Query con Relazioni
```typescript
// ✅ CORRETTO - camelCase nelle query
const request = await prisma.assistanceRequest.findUnique({
  where: { id },
  include: {
    client: true,       // minuscolo
    professional: true, // minuscolo
    category: true,     // minuscolo
    Quote: true,        // ⚠️ Maiuscolo per modelli
    InterventionReport: true  // ⚠️ Maiuscolo per modelli
  }
});
```

### Error Handling Pattern

```typescript
// ✅ Pattern completo per routes
router.post('/endpoint', authenticate, validateRequest(schema), async (req, res) => {
  try {
    // Input validation con Zod
    const validatedData = schema.parse(req.body);
    
    // Business logic nel service
    const result = await service.process(validatedData);
    
    // Response con ResponseFormatter
    return res.json(ResponseFormatter.success(result, 'Operation successful'));
    
  } catch (error) {
    // Logging
    logger.error('Operation failed:', error);
    
    // Error response
    if (error instanceof z.ZodError) {
      return res.status(400).json(
        ResponseFormatter.error('Validation failed', 'VALIDATION_ERROR', error.errors)
      );
    }
    
    if (error instanceof BusinessError) {
      return res.status(400).json(
        ResponseFormatter.error(error.message, error.code)
      );
    }
    
    return res.status(500).json(
      ResponseFormatter.error('Internal server error', 'INTERNAL_ERROR')
    );
  }
});
```

---

## 🗄️ DATABASE BEST PRACTICES

### Schema Attuale - Tabelle Principali

```
User (utenti)
├── AssistanceRequest (richieste assistenza)
│   ├── Quote (preventivi)
│   ├── InterventionReport (rapporti intervento)
│   ├── RequestChatMessage (chat)
│   └── ScheduledIntervention (interventi programmati)
├── Category/Subcategory (categorie servizi)
├── Notification (notifiche)
├── AuditLog (log di audit)
├── BackupSchedule (backup programmati)
├── HealthCheckResult (risultati health check)
└── ScriptExecution (esecuzioni script)
```

### Query Optimization

#### ✅ DO: Specificare campi necessari
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    fullName: true
  }
});
```

#### ❌ DON'T: Caricare tutto
```typescript
const users = await prisma.user.findMany({
  include: {
    clientRequests: true,
    professionalRequests: true,
    quotes: true,
    notifications: true,
    auditLogs: true
  }
});
```

### Pagination Pattern
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.item.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.item.count()
]);

return {
  data: items,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

### Transaction Pattern
```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Create request
  const request = await tx.assistanceRequest.create({ data: requestData });
  
  // 2. Create notification
  await tx.notification.create({
    data: {
      userId: request.professionalId,
      title: 'New request',
      requestId: request.id
    }
  });
  
  // 3. Create audit log
  await tx.auditLog.create({
    data: {
      action: 'REQUEST_CREATED',
      entityType: 'AssistanceRequest',
      entityId: request.id,
      userId: req.user.id
    }
  });
  
  return request;
});
```

### Migration Best Practices
```bash
# Sviluppo
npx prisma migrate dev --name descriptive_name

# Produzione
npx prisma migrate deploy

# Reset (SOLO sviluppo!)
npx prisma migrate reset

# Backup prima di migration
pg_dump database_name > backup_before_migration.sql
```

---

## 🔐 SECURITY CHECKLIST

### Pre-Deploy Security Checks

#### Authentication & Authorization
- [x] JWT secret forte (min 32 caratteri)
- [x] Refresh token implementato
- [x] Rate limiting su login
- [x] Account lockout dopo tentativi falliti
- [x] Password policy (min 8 char, complessità)
- [x] 2FA disponibile con TOTP

#### Input Validation
- [x] Zod validation su TUTTI gli endpoint
- [x] SQL injection prevention (Prisma parameterized queries)
- [x] XSS prevention (sanitizzazione input)
- [x] File upload validation (tipo, dimensione)
- [x] Path traversal prevention

#### Headers & CORS
- [x] Helmet.js configurato
- [x] CORS whitelist configurata
- [x] CSP headers impostati
- [x] HTTPS only cookies
- [x] SameSite cookies

#### Audit & Monitoring
- [x] Audit log su tutte le azioni
- [x] Security alerts configurati
- [x] Failed login monitoring
- [x] Suspicious activity detection
- [x] Session tracking

#### Environment & Config
- [x] .env NON in repository
- [x] Secrets in environment variables
- [x] Production mode enabled
- [x] Debug mode disabled
- [x] Error messages generici in produzione

#### Data Protection
- [x] Password hashing (bcrypt rounds >= 10)
- [x] PII encryption at rest
- [x] Secure session management
- [x] GDPR compliance
- [x] Backup encryption

### Security Headers Configuration
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws://localhost:3200"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 🧪 TESTING REQUIREMENTS

### Coverage Minimo
- **Unit Tests**: 80% coverage
- **Integration Tests**: Tutti gli endpoint critici
- **E2E Tests**: Flow principali utente
- **Performance Tests**: Load testing su API critiche

### Test Structure
```typescript
// __tests__/services/user.service.test.ts
describe('UserService', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123'
      };

      const user = await userService.createUser(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Hashed
    });

    it('should throw error for duplicate email', async () => {
      const userData = { email: 'test@example.com', ... };
      await userService.createUser(userData);

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });
  });
});
```

### API Testing Pattern
```typescript
// __tests__/routes/users.routes.test.ts
describe('GET /api/users', () => {
  it('should return users with ResponseFormatter', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('message');
  });
});
```

### Script di Test Disponibili
```bash
# Test completo sistema
./scripts/test-finale.sh

# Test notifiche
./scripts/test-notification-system.sh

# Test TypeScript
./scripts/test-typescript.sh

# Test admin dashboard
./scripts/test-admin-dashboard.sh

# Check audit system
./scripts/audit-system-check.sh
```

---

## ⚡ PERFORMANCE GUIDELINES

### Target Metrics
- **Page Load**: < 2 secondi
- **API Response**: < 200ms (p95)
- **Database Query**: < 50ms
- **Frontend Bundle**: < 500KB gzipped
- **WebSocket Latency**: < 100ms

### Optimization Checklist

#### Frontend
- [x] Code splitting implementato
- [x] Lazy loading per routes
- [x] Images ottimizzate (WebP)
- [x] Bundle analyzer eseguito
- [x] React.memo per componenti pesanti
- [x] Virtual scrolling per liste lunghe

#### Backend
- [x] Database indexes ottimizzati
- [x] Query N+1 risolte
- [x] Redis caching implementato
- [x] Pagination su liste
- [x] Rate limiting configurato
- [x] Compression abilitata
- [x] Connection pooling

#### Database
- [x] Indexes su campi di ricerca
- [x] Composite indexes per query complesse
- [x] Query EXPLAIN analizzate
- [x] Connection pooling configurato (20 connections)
- [x] Slow query log attivo
- [x] Vacuum automatico configurato

### Caching Strategy
```typescript
// Redis caching pattern
const CACHE_TTL = 300; // 5 minuti

async function getUserWithCache(userId: string) {
  const cacheKey = `user:${userId}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Save to cache
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(user));
  
  return user;
}
```

### WebSocket Optimization
```typescript
// Namespace per tipo di utente
io.of('/client').use(clientAuth);
io.of('/professional').use(professionalAuth);
io.of('/admin').use(adminAuth);

// Room management
socket.join(`user:${userId}`);
socket.join(`request:${requestId}`);

// Broadcast ottimizzato
io.to(`request:${requestId}`).emit('update', data);
```

---

## 📦 DEPLOYMENT

### Pre-Deployment Checklist

#### Code Quality
- [ ] TypeScript: 0 errori (`npx tsc --noEmit`)
- [ ] ESLint: 0 warnings
- [ ] Tests: 100% passing
- [ ] Coverage: > 80%
- [ ] Build: Successful

#### Configuration
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Redis configured
- [ ] SSL certificates valid
- [ ] Monitoring configured
- [ ] Backup schedule active

#### Security
- [ ] Security checklist completed
- [ ] Penetration testing done
- [ ] OWASP top 10 reviewed
- [ ] Dependencies updated
- [ ] Secrets rotated
- [ ] Audit log active

### Deployment Commands
```bash
# Build
npm run build
cd backend && npm run build

# Database
cd backend
npx prisma migrate deploy

# Start production
NODE_ENV=production npm start

# Con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3200
CMD ["npm", "start"]
```

---

## 🔧 TROUBLESHOOTING

### Problemi Comuni e Soluzioni

#### Doppio /api negli URL (ERRORE FREQUENTE!)
```bash
# Sintomo: 404 su tutte le API call
# Causa: api.get('/api/users') invece di api.get('/users')

# Identificare il problema
grep -r "api.get('/api" src/
grep -r "api.post('/api" src/
grep -r "api.put('/api" src/
grep -r "api.delete('/api" src/

# Soluzione: Rimuovere /api dalle chiamate
# api.get('/api/users') → api.get('/users')
```

#### ResponseFormatter non usato
```bash
# Identificare routes senza ResponseFormatter
grep -L "ResponseFormatter" backend/src/routes/*.ts

# Verificare services che lo usano (errore)
grep -l "ResponseFormatter" backend/src/services/*.ts

# Soluzione: Aggiungere ResponseFormatter alle routes identificate
```

#### WebSocket non si connette
```typescript
// Verificare configurazione CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5193",
    credentials: true
  }
});

// Client deve usare stesso URL
const socket = io('http://localhost:3200', {
  withCredentials: true
});
```

#### Errori TypeScript dopo modifica schema
```bash
# Soluzione
cd backend
npx prisma generate
npx prisma db push
npx tsc --noEmit
```

#### Notifiche non arrivano
```bash
# Verificare servizi attivi
redis-cli ping  # Deve rispondere PONG
curl http://localhost:3200/api/health  # Check WebSocket

# Verificare template esistono
SELECT * FROM "NotificationTemplate";

# Check logs
tail -f logs/error.log
```

#### Relazioni Prisma non trovate
```bash
# Verificare schema
npx prisma db pull
git diff prisma/schema.prisma

# Rigenerare client
npx prisma generate

# Verificare query
grep -r "include:" backend/src/
```

#### Query Parameters Opzionali
```typescript
// ❌ PROBLEMA COMUNE
const filters = {
  isActive: req.query.isActive === 'true'  // Se undefined diventa false!
};

// ✅ SOLUZIONE
const filters: any = {};
if (req.query.isActive !== undefined) {
  filters.isActive = req.query.isActive === 'true';
}
```

#### Health Check fallisce
```bash
# Verificare tutti i servizi
systemctl status postgresql
redis-cli ping
lsof -i :3200
lsof -i :5193

# Check orchestrator
ps aux | grep health-check-orchestrator

# Restart se necessario
cd backend
npm run dev
```

#### Porta già in uso
```bash
# Trova processo
lsof -i :3200

# Kill processo
kill -9 [PID]

# O cambia porta in .env
PORT=3201
```

#### Database connection errors
```bash
# Verifica connessione
cd backend
npx prisma db pull

# Reset connessioni
npx prisma generate --force

# Verifica DATABASE_URL in .env
echo $DATABASE_URL
```

#### Backup non funziona
```bash
# Verificare permessi cartella
ls -la database-backups/

# Creare cartella se non esiste
mkdir -p database-backups

# Test backup manuale
./scripts/backup-all.sh

# Check cron job
crontab -l
```

---

## 📝 TEMPLATES

### Template Nuovo Endpoint API (con Audit)
```typescript
// routes/[resource].routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { auditLogger } from '../middleware/auditLogger';
import { [resource]Schema } from '../schemas/[resource].schema';
import * as [resource]Service from '../services/[resource].service';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';

const router = Router();

// GET /api/[resources]
router.get('/', authenticate, auditLogger('LIST_[RESOURCES]'), async (req, res) => {
  try {
    const filters = {
      // Parse query params - ATTENZIONE a undefined!
    };
    
    const result = await [resource]Service.getAll(filters);
    
    return res.json(ResponseFormatter.success(
      result,
      '[Resources] retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error fetching [resources]:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to fetch [resources]',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/[resources]
router.post('/', 
  authenticate, 
  validateRequest([resource]Schema),
  auditLogger('CREATE_[RESOURCE]'),
  async (req, res) => {
    try {
      const result = await [resource]Service.create(req.body);
      
      // Invia notifica se necessario
      await notificationService.sendToUser(result.userId, {
        title: '[Resource] created',
        message: 'Your [resource] has been created',
        type: '[resource]_created',
        data: { [resource]Id: result.id }
      });
      
      return res.status(201).json(ResponseFormatter.success(
        result,
        '[Resource] created successfully'
      ));
    } catch (error) {
      logger.error('Error creating [resource]:', error);
      return res.status(500).json(ResponseFormatter.error(
        'Failed to create [resource]',
        'CREATE_ERROR'
      ));
    }
});

export default router;
```

### Template Nuovo Service
```typescript
// services/[resource].service.ts
import { prisma } from '../lib/prisma';
import { [Resource]CreateInput, [Resource]UpdateInput } from '../types';
import { logger } from '../utils/logger';

export async function getAll(filters: any) {
  return await prisma.[resource].findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
    include: {
      // Relazioni necessarie
    }
  });
}

export async function getById(id: string) {
  const [resource] = await prisma.[resource].findUnique({
    where: { id },
    include: {
      // Relazioni necessarie
    }
  });
  
  if (![resource]) {
    throw new Error('[Resource] not found');
  }
  
  return [resource];
}

export async function create(data: [Resource]CreateInput) {
  return await prisma.$transaction(async (tx) => {
    // Crea risorsa
    const [resource] = await tx.[resource].create({ data });
    
    // Crea audit log
    await tx.auditLog.create({
      data: {
        action: '[RESOURCE]_CREATED',
        entityType: '[Resource]',
        entityId: [resource].id,
        userId: data.userId,
        newValues: [resource],
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      }
    });
    
    return [resource];
  });
}

export async function update(id: string, data: [Resource]UpdateInput) {
  return await prisma.$transaction(async (tx) => {
    const old = await tx.[resource].findUnique({ where: { id } });
    
    const updated = await tx.[resource].update({
      where: { id },
      data
    });
    
    // Audit log con diff
    await tx.auditLog.create({
      data: {
        action: '[RESOURCE]_UPDATED',
        entityType: '[Resource]',
        entityId: id,
        oldValues: old,
        newValues: updated,
        changes: diff(old, updated),
        success: true,
        severity: 'INFO',
        category: 'BUSINESS'
      }
    });
    
    return updated;
  });
}

export async function remove(id: string) {
  return await prisma.[resource].delete({
    where: { id }
  });
}
```

### Template Nuovo Report Sessione (OBBLIGATORIO OGNI SESSIONE!)
```markdown
# 📊 REPORT SESSIONE - [TITOLO]

**SALVARE IN**: DOCUMENTAZIONE/REPORT-SESSIONI/YYYY-MM-DD-descrizione.md
**MAI NELLA ROOT!**

**Data**: [YYYY-MM-DD]  
**Autore**: Claude/[Nome Developer]
**Versione Sistema**: v[X.X]

## 🎯 OBIETTIVO
[Cosa si voleva ottenere]

## 🔧 IMPLEMENTAZIONE  
[Cosa è stato fatto]

## ✅ RISULTATI
[Cosa funziona ora]

## 📝 NOTE
[Eventuali problemi o prossimi passi]
```

### Template React Component con Query (NO /api!)
```tsx
// components/[Resource]List.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';  // ⚠️ Ha già /api nel baseURL
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export function [Resource]List() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['[resources]'],
    queryFn: () => api.get('/[resources]'),  // ✅ NO /api prefix!
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid gap-4">
      {data?.map((item) => (
        <div key={item.id} className="p-4 bg-white rounded-lg shadow">
          {/* Render item */}
        </div>
      ))}
    </div>
  );
}
```

### Template Component con Mutation
```tsx
// components/[Resource]Form.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';  // ⚠️ Ha già /api
import { toast } from 'react-hot-toast';

export function [Resource]Form() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: (data) => api.post('/[resources]', data),  // ✅ NO /api!
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['[resources]'] });
      toast.success('[Resource] created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Error creating [resource]');
    }
  });

  const handleSubmit = (formData) => {
    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button 
        type="submit" 
        disabled={createMutation.isPending}
      >
        {createMutation.isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

---

## 🤖 SCRIPT AUTOMAZIONE

### Script Disponibili

```bash
# 📋 GESTIONE SISTEMA
./scripts/check-system.sh           # Verifica stato completo sistema
./scripts/start-session.sh          # Avvia tutti i servizi
./scripts/end-session.sh            # Ferma tutti i servizi

# 🧪 TESTING
./scripts/test-finale.sh            # Test completo sistema
./scripts/test-typescript.sh        # Verifica errori TypeScript
./scripts/test-notification-system.sh # Test sistema notifiche
./scripts/test-admin-dashboard.sh   # Test dashboard admin
./scripts/audit-system-check.sh     # Verifica audit log

# 💾 BACKUP
./scripts/backup-all.sh             # Backup completo DB + files
./scripts/backup-request-detail.sh  # Backup specifico richiesta

# 🔧 FIX & UTILITIES
./scripts/fix-typescript-errors.sh  # Fix automatico errori TS
./scripts/fix-prisma-complete.sh    # Fix schema e client Prisma
./scripts/validate-addresses.sh     # Valida indirizzi con geocoding

# 📝 DEVELOPMENT
./scripts/pre-commit-check.sh       # Check pre-commit obbligatorio
./scripts/validate-work.sh          # Valida modifiche
./scripts/update-progress.sh        # Aggiorna progresso lavoro
```

### pre-commit-check.sh (AGGIORNATO)
```bash
#!/bin/bash
# scripts/pre-commit-check.sh

echo "🔍 Pre-commit checks..."

# 1. TypeScript check
echo "📌 Checking TypeScript..."
cd backend && npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found!"
  exit 1
fi
cd ..

# 2. ResponseFormatter check
echo "📌 Checking ResponseFormatter..."
SERVICES_WITH_RF=$(grep -r "ResponseFormatter" backend/src/services/ 2>/dev/null | wc -l)
if [ $SERVICES_WITH_RF -gt 0 ]; then
  echo "❌ ResponseFormatter found in services!"
  exit 1
fi

ROUTES_WITHOUT_RF=$(grep -r "res.json\|res.status" backend/src/routes/ 2>/dev/null | grep -v "ResponseFormatter" | wc -l)
if [ $ROUTES_WITHOUT_RF -gt 0 ]; then
  echo "❌ Routes without ResponseFormatter found!"
  exit 1
fi

# 3. Check for /api/api pattern (NUOVO!)
echo "📌 Checking for double /api pattern..."
DOUBLE_API=$(grep -r "api\.\(get\|post\|put\|delete\|patch\)('/api" src/ 2>/dev/null | wc -l)
if [ $DOUBLE_API -gt 0 ]; then
  echo "❌ Found api.get('/api/...') pattern! Remove /api prefix!"
  grep -r "api\.\(get\|post\|put\|delete\|patch\)('/api" src/
  exit 1
fi

# 4. Console.log check
echo "📌 Checking for console.log..."
CONSOLE_LOGS=$(grep -r "console.log" src/ backend/src/ --exclude-dir=node_modules 2>/dev/null | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
  echo "⚠️  Warning: console.log statements found"
fi

# 5. Tests
echo "📌 Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi

# 6. Build check
echo "📌 Checking build..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

# 7. Check backup files not in commit
echo "📌 Checking for backup files..."
BACKUP_FILES=$(git status --porcelain | grep ".backup-" | wc -l)
if [ $BACKUP_FILES -gt 0 ]; then
  echo "❌ Backup files found in commit! Remove them first."
  git status --porcelain | grep ".backup-"
  exit 1
fi

echo "✅ All checks passed! Ready to commit."
```

### check-system.sh (AGGIORNATO)
```bash
#!/bin/bash
# scripts/check-system.sh

echo "🔍 System check..."

# Check Node version
NODE_VERSION=$(node -v)
echo "Node: $NODE_VERSION"

# Check database
cd backend
npx prisma db pull > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database: Connected"
else
  echo "❌ Database: Not connected"
fi

# Check Redis
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Redis: Running"
else
  echo "⚠️  Redis: Not running (optional but recommended)"
fi

# Check ports
lsof -i :3200 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Backend: Running on port 3200"
else
  echo "⚠️  Backend: Not running"
fi

lsof -i :5193 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Frontend: Running on port 5193"
else
  echo "⚠️  Frontend: Not running"
fi

# Check health endpoint
curl -s http://localhost:3200/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ API Health: OK"
else
  echo "⚠️  API Health: Not responding"
fi

# Check WebSocket
curl -s http://localhost:3200/socket.io/ > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ WebSocket: Active"
else
  echo "⚠️  WebSocket: Not active"
fi

# Check critical services
echo ""
echo "📊 Service Status:"
echo "- Notification System: $(curl -s http://localhost:3200/api/health | grep notification || echo 'Unknown')"
echo "- Audit System: $(curl -s http://localhost:3200/api/health | grep audit || echo 'Unknown')"
echo "- Health Monitor: $(ps aux | grep health-check-orchestrator | grep -v grep > /dev/null && echo 'Running' || echo 'Not running')"
echo "- Script Manager: $(curl -s http://localhost:3200/api/admin/scripts/registry > /dev/null && echo 'Available' || echo 'Not available')"

echo ""
echo "✅ System check complete"
```

---

## 📚 GESTIONE DOCUMENTAZIONE (SEZIONE CRITICA!)

> ⚠️ **QUESTA SEZIONE È VINCOLANTE**: Il mancato rispetto BLOCCA i commit!

### 🗂️ Struttura Obbligatoria
**TUTTA** la documentazione DEVE essere salvata in:
```
DOCUMENTAZIONE/
├── INDEX.md                  # 👈 INIZIA DA QUI per navigare
├── ATTUALE/                  # Documentazione valida e aggiornata
│   ├── 00-ESSENZIALI/       # File critici del progetto
│   ├── 01-ARCHITETTURA/     # Architettura sistema
│   ├── 02-FUNZIONALITA/     # Docs per ogni feature
│   ├── 03-API/              # Documentazione API
│   ├── 04-GUIDE/            # Guide pratiche
│   └── 05-TROUBLESHOOTING/  # Risoluzione problemi
├── ARCHIVIO/                # Documentazione storica/obsoleta
└── REPORT-SESSIONI/         # Report di ogni sessione Claude
    └── YYYY-MM-DD-descrizione.md
```

### ⚠️ REGOLE VINCOLANTI (VIOLAZIONE = COMMIT BLOCCATO)

#### 🚫 È ASSOLUTAMENTE VIETATO:
- ❌ Salvare file .md nella root del progetto (eccetto README, ISTRUZIONI-PROGETTO, CHANGELOG, LEGGIMI-DOCUMENTAZIONE)
- ❌ Creare nuove cartelle di documentazione fuori da DOCUMENTAZIONE/
- ❌ Salvare report di sessione fuori da DOCUMENTAZIONE/REPORT-SESSIONI/
- ❌ Duplicare documentazione in più posizioni

#### ✅ È TASSATIVAMENTE OBBLIGATORIO:
- ✅ Salvare TUTTI i nuovi documenti in DOCUMENTAZIONE/
- ✅ Usare DOCUMENTAZIONE/ATTUALE/ per docs attiva
- ✅ Usare DOCUMENTAZIONE/ARCHIVIO/ per docs obsoleta  
- ✅ Nominare i report: `YYYY-MM-DD-descrizione-breve.md`
- ✅ Aggiornare DOCUMENTAZIONE/INDEX.md quando si aggiunge documentazione

### 📝 Workflow Documentazione

#### Per Nuova Documentazione:
1. Determinare la categoria (ATTUALE o ARCHIVIO)
2. Scegliere la sottocartella appropriata
3. Creare il file .md nella posizione corretta
4. Aggiornare DOCUMENTAZIONE/INDEX.md con il link

#### Per Report di Sessione:
```bash
# SEMPRE salvare in:
DOCUMENTAZIONE/REPORT-SESSIONI/YYYY-MM-DD-descrizione.md

# Esempio:
DOCUMENTAZIONE/REPORT-SESSIONI/2025-09-11-gestione-documentazione.md
```

#### Per Aggiornamenti:
1. Modificare il file nella sua posizione in DOCUMENTAZIONE/
2. Se un documento diventa obsoleto, spostarlo in ARCHIVIO/
3. Aggiornare INDEX.md se necessario

### 🔍 Come Trovare Documentazione
```bash
# Cerca in tutta la documentazione
grep -r "termine" DOCUMENTAZIONE/

# Trova file recenti
find DOCUMENTAZIONE/ -type f -name "*.md" -mtime -7

# Visualizza struttura
tree DOCUMENTAZIONE/ -L 2
```

### 🚨 Controllo Pre-Commit Documentazione
```bash
# Verifica che non ci siano .md non autorizzati nella root
ROOT_MD=$(ls *.md 2>/dev/null | grep -v -E "^(README|ISTRUZIONI-PROGETTO|CHANGELOG|LEGGIMI-DOCUMENTAZIONE)\.md$")
if [ ! -z "$ROOT_MD" ]; then
  echo "❌ ERRORE: File .md non autorizzati trovati nella root!"
  echo "$ROOT_MD"
  echo "Spostare in DOCUMENTAZIONE/"
  exit 1
fi
```

### 📋 File Mantenuti nella Root
Solo questi file .md possono rimanere nella root:
- `ISTRUZIONI-PROGETTO.md` - Questo file (regole tecniche vincolanti)
- `README.md` - Overview del progetto per GitHub
- `LEGGIMI-DOCUMENTAZIONE.md` - Guida alla struttura documentazione
- `CHANGELOG.md` - Storico versioni progetto

**TUTTI GLI ALTRI** file .md devono essere in DOCUMENTAZIONE/

### 📚 Navigazione Documentazione
Per navigare nella documentazione:
1. Apri `DOCUMENTAZIONE/INDEX.md`
2. Usa i link per accedere alle sezioni
3. La documentazione è organizzata per argomento
4. I report sono ordinati per data

---

## ✅ CHECKLIST FINALE

### Prima di OGNI Commit

#### Controlli Documentazione 📚 (PRIORITÀ MASSIMA)
- [ ] **ZERO file .md nuovi nella root** (solo i 4 autorizzati)
- [ ] **Report sessione creato** in DOCUMENTAZIONE/REPORT-SESSIONI/
- [ ] **Nuova documentazione** in DOCUMENTAZIONE/ATTUALE/ o ARCHIVIO/
- [ ] **INDEX.md aggiornato** se aggiunti nuovi file
- [ ] **pre-commit-check.sh PASSATO** (obbligatorio!)

#### Controlli Tecnici
- [ ] `npx tsc --noEmit` = 0 errori
- [ ] ResponseFormatter in TUTTE le routes
- [ ] ResponseFormatter NON nei services
- [ ] NO `/api/api/` pattern (controlla api client)
- [ ] React Query per tutte le API calls
- [ ] Relazioni Prisma con @relation
- [ ] No console.log in produzione
- [ ] Tests passano tutti
- [ ] Audit log implementato per azioni critiche

#### Controlli Qualità 
- [ ] Code review effettuata
- [ ] Documentazione aggiornata
- [ ] CHANGELOG.md aggiornato
- [ ] Comments per codice complesso
- [ ] Error handling appropriato
- [ ] Notifiche inviate dove necessario

#### Controlli Performance
- [ ] Query database ottimizzate
- [ ] Nessun N+1 problem
- [ ] Pagination implementata
- [ ] Caching dove necessario
- [ ] WebSocket events ottimizzati

#### Controlli Security
- [ ] Input validation con Zod
- [ ] Authentication verificata
- [ ] Authorization controllata
- [ ] No sensitive data in logs
- [ ] Environment variables usate
- [ ] Audit trail presente

#### Controlli Finali
- [ ] Build production successful
- [ ] No file .backup-* nel commit
- [ ] Git commit message descrittivo
- [ ] PR description completa
- [ ] Tests coverage > 80%
- [ ] Health check passa

---

## 📞 CONTATTI

**Lead Developer**: Luca Mambelli
- Email: lucamambelli@lmtecnologie.it
- GitHub: @241luca

---

## 📅 CHANGELOG

> 📝 **Nota**: Il CHANGELOG completo è mantenuto in `/CHANGELOG.md` nella root del progetto.
> Questo è solo un estratto delle modifiche principali.

### v4.2.1 - 11 Settembre 2025 (CRITICO!)  
- 🔥 **ISTRUZIONI RESE INEQUIVOCABILI**: Box warning, 8ª regola d'oro, errore #5
- 🤖 **ISTRUZIONI OBBLIGATORIE PER CLAUDE**: Sezione dedicata all'inizio
- 📚 **GESTIONE DOCUMENTAZIONE RIGOROSA**: Regole vincolanti e ripetute
- 🚨 **CONTROLLI AUTOMATICI POTENZIATI**: Pre-commit blocca .md non autorizzati
- 📝 **TEMPLATE REPORT OBBLIGATORIO**: Per ogni sessione di sviluppo
- 🔄 **17 FILE SPOSTATI**: Root ora pulita con solo 4 .md autorizzati

### v4.1 - 9 Settembre 2025
- 📚 Riorganizzazione completa documentazione in `/DOCUMENTAZIONE/`
- 🔗 Eliminazione duplicati - file essenziali solo in root
- 📅 Correzione date errate nei report sessioni
- 📁 Creazione INDEX.md navigabile

### v4.0 - 10 Gennaio 2025
- ✨ Documentazione completamente aggiornata con stato reale sistema
- ✨ Aggiunto warning prominente su api client con /api incluso
- ✨ Documentate tutte le nuove funzionalità implementate
- ✨ Aggiunti nuovi pattern per WebSocket e notifiche
- ✨ Aggiornati script di automazione
- ✨ Aggiunti template con audit log
- 🐛 Fix esempi con doppio /api
- 📝 Aggiornata checklist con nuovi controlli

### v3.0 - 6 Settembre 2025
- ✨ Aggiunto Quick Start section
- ✨ Aggiunto Quick Reference Card
- ✨ Aggiunte Database Best Practices
- ✨ Aggiunta Security Checklist
- ✨ Aggiunti Testing Requirements
- ✨ Aggiunte Performance Guidelines
- ✨ Aggiunti Templates pronti all'uso
- ✨ Aggiunti Script di automazione
- ✨ Riorganizzazione completa struttura
- 📝 Miglioramento troubleshooting section
- 🐛 Fix esempi codice

### v2.0 - 30 Agosto 2025
- Aggiunta enfasi su ResponseFormatter
- Aggiunti controlli automatici pre-commit
- Aggiunta funzionalità sottocategorie

### v1.0 - 28 Agosto 2025
- Prima versione completa

---

**⚠️ REMINDER FINALE CRITICO**: 
- Questo documento è VINCOLANTE. Ogni deviazione deve essere approvata e documentata.
- 📚 **DOCUMENTAZIONE SEMPRE IN DOCUMENTAZIONE/** - MAI nella root!
- 🚨 Il pre-commit-check.sh BLOCCA automaticamente i commit non conformi!
- 📝 Ogni sessione DEVE creare un report in DOCUMENTAZIONE/REPORT-SESSIONI/

> 💡 **Pro Tip**: Salva questo file nei bookmark del browser per accesso rapido!
> 
> ⚠️ **RICORDA SEMPRE**: 
> - Il client API ha già `/api` nel baseURL - NON aggiungere `/api` nelle chiamate!
> - La documentazione va SEMPRE in DOCUMENTAZIONE/ - MAI nella root!
> - I report sessione sono OBBLIGATORI in DOCUMENTAZIONE/REPORT-SESSIONI/
