# 🚀 Sistema di Richiesta Assistenza

**Versione**: 5.2.0  
**Ultimo Aggiornamento**: 02 Ottobre 2025  
**Status**: ✅ Production Ready + Sistema Monitoraggio Completo

## 📋 Panoramica

Il **Sistema di Richiesta Assistenza** è una piattaforma enterprise completa che connette clienti con professionisti qualificati attraverso un sistema intelligente basato su AI. La piattaforma gestisce l'intero ciclo di vita dei servizi, dalla richiesta iniziale alla generazione di preventivi e all'assegnazione dei professionisti.

### 🌟 Caratteristiche Principali

- **🔐 Sicurezza Enterprise**: Security headers OWASP compliant, rate limiting, CSP avanzato
- **⚡ Performance Ottimizzata**: Compression Brotli/Gzip, -70% bandwidth, caching intelligente
- **🤖 AI-Powered**: Assistenza intelligente con OpenAI GPT-4/GPT-3.5-turbo
- **💳 Pagamenti Sicuri**: Integrazione Stripe con retry logic e circuit breaker
- **📍 Geolocalizzazione**: Google Maps integration con cache Redis
- **💬 Real-time**: WebSocket per notifiche e chat istantanee
- **📊 Monitoring Avanzato**: Health checks, circuit breakers, request tracking
- **🔄 Alta Affidabilità**: Retry logic, circuit breaker pattern, 99.9% uptime

### 🚀 Ottimizzazioni Critiche v6.1.0 (04 Ottobre 2025)

- **⚡ Performance Calendario 900% Più Veloce**: Da 800ms a 80ms per 100 interventi
- **🎯 Check Conflitti 100% Accurato**: Formula matematica corretta con durata
- **📊 Query Ottimizzate**: Da 301 query (N+1) a 1 sola query con JOIN
- **💾 Index Compositi**: 3 nuovi index per velocizzare ricerche calendario
- **📖 Documentazione Completa**: 2 nuove guide dettagliate ottimizzazioni e conflitti

### 🆕 Nuove Funzionalità v5.2.0 (02 Ottobre 2025)

- **📊 Sistema Monitoraggio Completo**: Dashboard real-time stato servizi
- **🔴 Service Status Indicator**: Pallino colorato nell'header con 9 servizi monitorati
- **🛡️ Security Status Indicator**: Scudo con eventi sicurezza e statistiche
- **🔔 Enhanced Notification Center**: Centro notifiche avanzato con filtri e azioni
- **📊 System Status Page**: Pagina dettagliata con statistiche CPU/Memoria/Sistema
- **📑 Dettagli Servizi**: 4 card informative + descrizione per ogni servizio
- **⏱️ Auto-Refresh**: Polling automatico ogni 30-60 secondi configurabile
- **🔗 Link Diretti**: Accesso rapido ad Audit Log e dettagli completi
- **🎯 RBAC**: Visibilità basata su ruoli (SUPER_ADMIN, ADMIN, ALL)

### 🆕 Nuove Funzionalità v6.0 (03 Ottobre 2025)

- **📅 Sistema Calendario Professionale Completo**: Gestione interventi con FullCalendar v6
- **⏰ Scheduling Intelligente**: Creazione interventi drag & drop, gestione conflitti orari
- **🔄 Sincronizzazione Real-time**: WebSocket per aggiornamenti istantanei calendario
- **📊 Visualizzazioni Multiple**: Vista mensile, settimanale, giornaliera e lista
- **🎨 Stati Colorati**: Distinzione visiva per stato intervento (proposto, accettato, rifiutato)
- **💬 Notifiche Interventi**: Sistema notifiche per proposte, accettazioni, modifiche
- **📈 Statistiche Calendario**: Report interventi, tassi accettazione, durate medie
- **🎨 Sistema Branding Dinamico Completo**: Personalizzazione totale identità visiva senza codice
- **🏢 System Settings Dashboard**: Pannello admin per gestione completa impostazioni
- **📱 Logo & Favicon Management**: Upload drag & drop con ottimizzazione automatica
- **📞 Contatti Aziendali Dinamici**: Gestione completa contatti, orari, indirizzi
- **🌐 Social Media Integration**: Link social configurabili con icone dinamiche
- **📄 Documenti Legali Personalizzabili**: Privacy, Terms, Cookie Policy editabili
- **🎯 Info Panel Rinnovato**: Pannello informazioni con tutti i dati aziendali
- **👤 User Info in Header**: Spostata info utente nell'header per più spazio menu
- **📊 Footer Multi-Column**: Footer 4 colonne responsive con tutti i dati dinamici
- **⚡ Cache Optimization**: Sistema cache 30 secondi con refresh automatico

### 🆕 Nuove Funzionalità v5.0 (27 Settembre 2025)

- **🗺️ Sistema Maps Completo**: Visualizzazione mappe interattive, calcolo distanze con cache Redis
- **🔄 Ricalcolo Automatico Distanze**: Quando cambia work address, ricalcola automaticamente tutte le distanze
- **📍 Travel Info Enhanced**: Calcolo costi trasferta, tempi percorrenza, salvataggio DB
- **🏢 Work Address Management**: Gestione separata indirizzo lavoro/residenza per professionisti
- **📡 Cache Redis Ottimizzata**: Riduzione 80% chiamate Google Maps API
- **🧪 Test Suite Completa**: Script automatici per verifica sistema maps

### 🆕 Nuove Funzionalità v4.1

- **📚 Tab Guida ai Test**: Documentazione completa integrata nella dashboard Health Check
- **✅ FAQ Complete**: 8+ domande frequenti con risposte dettagliate
- **🎆 UI Migliorata**: Navigazione più intuitiva con 6 tab
- **🔧 Fix Performance**: Monitor completamente funzionante
- **🔗 API Consolidate**: Tutti i percorsi corretti e funzionanti

### 🆕 Funzionalità v4.0

- **🏥 Health Check System**: Monitoraggio completo con auto-remediation
- **🛠️ Script Manager**: Gestione script amministrativi da UI
- **📊 Audit Log**: Tracciamento completo operazioni
- **📈 Performance Monitor**: Metriche real-time CPU, Memory, API
- **🤖 Auto-Remediation**: Risoluzione automatica problemi comuni
- **📄 Report Automatici**: Generazione PDF settimanali

## 🔥 ResponseFormatter - Standard di Comunicazione API

> ⚠️ **FONDAMENTALE**: Il ResponseFormatter è lo standard OBBLIGATORIO per TUTTE le comunicazioni API nel progetto.

### Cos'è il ResponseFormatter?

Il ResponseFormatter è un sistema a due componenti che garantisce comunicazioni consistenti tra Backend e Frontend:

1. **Backend ResponseFormatter** (`/backend/src/utils/responseFormatter.ts`)
   - Crea risposte standardizzate nelle routes
   - MAI usato nei services (che ritornano solo dati)
   - Funzioni: `success()`, `error()`, `paginated()`

2. **Frontend ResponseFormatter** (`/src/utils/responseFormatter.ts`)
   - Interpreta le risposte dal backend
   - Gestisce tutti gli errori in modo uniforme
   - Previene crash React da oggetti non renderizzabili
   - Funzioni: `getErrorMessage()`, `getData()`, `isValidationError()`

### Struttura Standard delle Risposte

```json
// Successo
{
  "success": true,
  "message": "Operazione completata",
  "data": { /* dati */ },
  "timestamp": "2025-01-10T..."
}

// Errore
{
  "success": false,
  "message": "Descrizione errore",
  "error": {
    "code": "ERROR_CODE",
    "details": /* dettagli o array Zod */
  },
  "timestamp": "2025-01-10T..."
}
```

### Esempio di Utilizzo

```typescript
// Backend - Solo nelle routes!
router.get('/users', async (req, res) => {
  try {
    const users = await userService.getUsers(); // Service ritorna solo dati
    return res.json(ResponseFormatter.success(users, 'Utenti recuperati'));
  } catch (error) {
    return res.status(500).json(ResponseFormatter.error('Errore', 'FETCH_ERROR'));
  }
});

// Frontend - Gestione errori
import { ResponseFormatter } from '@/utils/responseFormatter';

onError: (error) => {
  // Sempre una stringa, mai un oggetto!
  toast.error(ResponseFormatter.getErrorMessage(error));
}
```

### Vantaggi

- ✅ **Nessun crash React**: Errori sempre convertiti in stringhe
- ✅ **Consistenza totale**: Tutte le API parlano la stessa lingua
- ✅ **Type Safety**: TypeScript inferisce correttamente i tipi
- ✅ **Manutenzione facile**: Un solo punto per modificare il formato
- ✅ **Debug semplificato**: Struttura prevedibile ovunque

📖 **Documentazione completa**: [DOCUMENTAZIONE/ATTUALE/01-ARCHITETTURA/RESPONSEFORMATTER.md](DOCUMENTAZIONE/ATTUALE/01-ARCHITETTURA/RESPONSEFORMATTER.md)

## 🏗️ Architettura

### Stack Tecnologico

#### Backend (Node.js + TypeScript)
- **Framework**: Express.js 4.x con TypeScript
- **Database**: PostgreSQL 14+ con Prisma ORM
- **Cache**: Redis 7+
- **Real-time**: Socket.io
- **Queue**: Bull + Redis
- **Scheduler**: node-cron
- **Authentication**: JWT + 2FA (Speakeasy)
- **File Storage**: Local + Cloud (S3 compatible)

#### Frontend (React 18)
- **Build Tool**: Vite 5.x
- **Framework**: React 18 con TypeScript
- **State Management**: TanStack Query v5 + Zustand
- **Routing**: React Router v6
- **UI**: Tailwind CSS + Shadcn/UI
- **Icons**: Heroicons + Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

#### Integrazioni Esterne
- **AI**: OpenAI API (GPT-4, GPT-3.5-turbo)
- **Pagamenti**: Stripe
- **Maps**: Google Maps API
- **Email**: Brevo (SendinBlue)
- **SMS**: Twilio (opzionale)
- **Storage**: S3 compatible (opzionale)

### 🔒 Sicurezza Implementata (v4.0)

#### Security Headers
- **Content Security Policy (CSP)**: Protezione XSS avanzata
- **HSTS**: Force HTTPS con preload list
- **X-Frame-Options**: Protezione clickjacking
- **Rate Limiting**: Configurabile per endpoint
- **Security Monitoring**: Detection SQL injection, XSS, path traversal
- **Audit Logging**: Tracciamento completo operazioni

#### Performance & Reliability
- **Response Compression**: Brotli + Gzip (-70% bandwidth)
- **Circuit Breaker**: Per tutti i servizi esterni
- **Retry Logic**: Exponential backoff intelligente
- **Request ID Tracking**: Correlazione log end-to-end
- **Health Checks**: Sistema completo con dashboard
- **Auto-Remediation**: Fix automatici per problemi comuni

## 📁 Struttura Progetto

```
richiesta-assistenza/
├── 📚 DOCUMENTAZIONE/              # TUTTA LA DOCUMENTAZIONE ORGANIZZATA
│   ├── INDEX.md                   # 👉 Inizia da qui per navigare
│   ├── ATTUALE/                   # Documentazione valida e aggiornata
│   │   ├── 00-ESSENZIALI/         # File critici
│   │   ├── 01-ARCHITETTURA/       # Architettura sistema
│   │   ├── 02-FUNZIONALITA/       # Docs per feature
│   │   ├── 03-API/                # API documentation
│   │   ├── 04-GUIDE/              # Guide pratiche
│   │   └── 05-TROUBLESHOOTING/    # Problem solving
│   ├── ARCHIVIO/                  # Documentazione storica
│   └── REPORT-SESSIONI/           # Report di ogni sessione
├── 📂 backend/                    # Backend Node.js + TypeScript
│   ├── src/
│   │   ├── config/               # Configurazioni
│   │   ├── middleware/           # Middleware (security, auth, compression)
│   │   │   ├── security.ts      # Security headers avanzati
│   │   │   ├── compression.ts   # Brotli/Gzip compression
│   │   │   ├── requestId.ts     # Request tracking
│   │   │   ├── auditLogger.ts   # ✨ NEW: Audit logging
│   │   │   └── auth.ts          # Autenticazione JWT + 2FA
│   │   ├── routes/               # API routes
│   │   │   ├── admin/
│   │   │   │   ├── health-check.routes.ts  # ✨ NEW
│   │   │   │   └── scripts.routes.ts       # ✨ NEW
│   │   │   └── ...
│   │   ├── services/             
│   │   │   ├── health-check-automation/    # ✨ NEW
│   │   │   ├── scripts.service.ts          # ✨ NEW
│   │   │   └── ...
│   │   ├── scripts/              # ✨ NEW: Admin scripts
│   │   └── server.ts             # Entry point
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── logs/                     # Log files con rotation
│
├── 📂 src/                        # Frontend React (NON /client!)
│   ├── components/               
│   │   ├── admin/
│   │   │   ├── health-check/    # ✨ NEW: Health Check UI
│   │   │   ├── script-manager/  # ✨ NEW: Script Manager UI
│   │   │   └── audit-log/       # ✨ NEW: Audit Log UI
│   │   └── ...
│   ├── hooks/                    # Custom hooks
│   ├── pages/                    # Pagine applicazione
│   ├── services/                 # API services
│   └── lib/                      # Utilities
│
├── 📂 Docs/                       # ✨ NEW: Documentazione completa
│   ├── 01-GETTING-STARTED/
│   ├── 02-ARCHITETTURA/
│   ├── 03-SVILUPPO/
│   └── 04-SISTEMI/              # ✨ NEW
│       ├── HEALTH-CHECK-SYSTEM.md
│       ├── SCRIPT-MANAGER.md
│       └── README.md
│
├── 📂 scripts/                    # Script di utility
│   └── health-checks/            # ✨ NEW: Health check scripts
│
├── 📄 package.json               # Dipendenze frontend
├── 📄 ISTRUZIONI-PROGETTO.md    # ⚠️ LEGGERE PRIMA DI INIZIARE
└── 📄 README.md                  # Questo file
```

## 🚀 Quick Start

### Prerequisiti
- Node.js 18+ LTS
- PostgreSQL 14+
- Redis 7+ (per queue e cache)
- npm o yarn

### Installazione

```bash
# 1. Clone repository
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd richiesta-assistenza

# 2. Installa dipendenze
npm install
cd backend && npm install && cd ..

# 3. Setup database
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed  # Dati di esempio

# 4. Crea tabelle Health Check
npx ts-node src/scripts/create-health-tables.ts

# 5. Configura environment
cp .env.example .env
# Modifica .env con le tue configurazioni

# 6. Avvia i servizi
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
npm run dev

# Terminal 3 - Redis (se non già attivo)
redis-server
```

### Accesso

- **Frontend**: http://localhost:5193
- **Backend API**: http://localhost:3200
- **Health Check**: http://localhost:3200/health

### Credenziali Default

```
Admin:
  Email: admin@test.com
  Password: password123

Professional:
  Email: professional@test.com
  Password: password123

Client:
  Email: client@test.com
  Password: password123
```

## 📊 Sistema di Monitoraggio (v5.2.0)

### Componenti Installati

Il sistema di monitoraggio fornisce visibilità completa sullo stato del sistema attraverso 4 componenti principali:

#### 1️⃣ Service Status Indicator (🔴 Pallino Colorato)
- **Posizione**: Header (solo SUPER_ADMIN)
- **Funzione**: Mostra stato generale servizi tramite pallino colorato
- **Stati**: 🟢 Verde (healthy) | 🟡 Giallo (degraded) | 🔴 Rosso (critical)
- **Features**: Badge numero servizi offline, dropdown con lista completa, auto-refresh 30s

#### 2️⃣ Security Status Indicator (🛡️ Scudo)
- **Posizione**: Header (ADMIN e SUPER_ADMIN)
- **Funzione**: Monitora eventi di sicurezza del sistema
- **Statistiche**: Login falliti (1h, 24h), IP bloccati, attività sospette
- **Features**: Badge eventi critici, ultimi 10 eventi, link diretto Audit Log

#### 3️⃣ Enhanced Notification Center (🔔 Campanella)
- **Posizione**: Header (tutti gli utenti)
- **Funzione**: Centro notifiche avanzato con filtri e azioni
- **Filtri**: Tutte, Non lette, Oggi
- **Azioni**: Leggi, Archivia, Elimina, "Segna tutte come lette"
- **Categorie**: PAYMENT, REQUEST, QUOTE, SYSTEM, SECURITY, USER

#### 4️⃣ System Status Page (📄 Pagina Dettagliata)
- **Route**: `/admin/system-status`
- **Accesso**: Menu sidebar → Tools e Utility → System Status
- **Sezioni**:
  - Banner stato generale (verde/giallo/rosso)
  - 3 card statistiche (CPU, Memoria, Sistema)
  - Lista dettagliata 9 servizi monitorati
  - 4 card info + descrizione per ogni servizio
- **Features**: Auto-refresh configurabile, pulsante refresh manuale

### Servizi Monitorati

| # | Servizio | Descrizione | Info Visualizzate |
|---|----------|-------------|-------------------|
| 1 | **PostgreSQL** | Database principale | Tipo, Pool (2-20), Performance, Stato |
| 2 | **Redis** | Cache e sessioni | Tipo, Versione, Uso, TTL |
| 3 | **Socket.io** | WebSocket real-time | Tipo, Versione, Client connessi, Clustering |
| 4 | **Email (Brevo)** | Sistema email | Provider, Tipo, Rate limit, Templates |
| 5 | **WhatsApp** | WppConnect | Tipo, Versione, Multidevice, QR refresh |
| 6 | **OpenAI** | AI GPT-4/3.5 | Modello, Dual config, Embeddings, Rate limit |
| 7 | **Stripe** | Pagamenti | Gateway, Webhook, API version, 3D Secure |
| 8 | **Google Maps** | Mappe e geocoding | API, Servizi, Cache, Quota |
| 9 | **Google Calendar** | Calendario | API, OAuth, Sync, Eventi |

### Accesso Rapido

```bash
# Verifica stato servizi
curl http://localhost:3200/api/admin/health-check/status

# Verifica eventi sicurezza
curl http://localhost:3200/api/security/status

# Visualizza notifiche
curl http://localhost:3200/api/notifications
```

### Documentazione Completa

📚 Tutta la documentazione dettagliata disponibile in:
`DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/SISTEMA-MONITORAGGIO/`

- README.md - Panoramica completa
- SERVICE-STATUS-INDICATOR.md - Guida componente pallino
- SECURITY-STATUS-INDICATOR.md - Guida componente scudo
- ENHANCED-NOTIFICATION-CENTER.md - Guida centro notifiche
- SYSTEM-STATUS-PAGE.md - Guida pagina dettagliata

---

## 📊 Dashboard Amministrativa

### Nuove Sezioni v4.0

#### 🏥 Health Check System
**Accesso**: Menu → Health Check → Automation & Alerts

- **Overview**: Stato sistema real-time
- **Scheduler**: Configurazione intervalli automatici
- **Reports**: Generazione PDF on-demand e settimanali
- **Auto-Remediation**: Gestione regole auto-fix
- **Performance**: Grafici metriche real-time

#### 🛠️ Script Manager
**Accesso**: Menu → Script Manager

- Lista script categorizzati
- Esecuzione con parametri dinamici
- Output real-time
- Storia esecuzioni
- Controllo accessi role-based

#### 📊 Audit Log
**Accesso**: Menu → Audit Log

- Tracciamento tutte le operazioni
- Filtri avanzati
- Export CSV/JSON/PDF
- Grafici statistiche
- Retention policy configurabile

## 🔧 Configurazione

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/assistance_db

# Security
JWT_SECRET=your-32-char-minimum-secret
SESSION_SECRET=your-32-char-minimum-secret

# External Services
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_MAPS_API_KEY=AIza...
BREVO_API_KEY=xkeysib-...

# Redis
REDIS_URL=redis://localhost:6379

# Health Check (NEW)
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30
HEALTH_CHECK_ALERT_EMAIL=admin@example.com

# Script Manager (NEW)
SCRIPT_MANAGER_ENABLED=true
SCRIPT_TIMEOUT=300000

# Audit Log (NEW)
AUDIT_LOG_ENABLED=true
AUDIT_RETENTION_DAYS=90
```

## 📚 Documentazione

### Documenti Principali

- **[ISTRUZIONI-PROGETTO.md](./ISTRUZIONI-PROGETTO.md)** - ⚠️ LEGGERE PRIMA DI INIZIARE
- **[Architettura Completa](./Docs/02-ARCHITETTURA/ARCHITETTURA-SISTEMA-COMPLETA.md)**
- **[Health Check System](./Docs/04-SISTEMI/HEALTH-CHECK-SYSTEM.md)** - NEW
- **[Script Manager](./Docs/04-SISTEMI/SCRIPT-MANAGER.md)** - NEW
- **[Aggiornamento v4.0](./Docs/02-ARCHITETTURA/AGGIORNAMENTO-v4.0.md)** - NEW

### API Documentation

- Base URL: `http://localhost:3200/api`
- Authentication: JWT Bearer token
- **Response Format**: SEMPRE ResponseFormatter standard
  - Backend: Tutte le routes usano ResponseFormatter
  - Frontend: Tutti gli errori gestiti con ResponseFormatter
  - Nessuna eccezione permessa!

#### Nuovi Endpoints v4.0

```
Health Check:
  GET    /admin/health-check/status
  POST   /admin/health-check/start
  POST   /admin/health-check/stop
  POST   /admin/health-check/report
  
Script Manager:
  GET    /admin/scripts
  POST   /admin/scripts/:id/execute
  GET    /admin/scripts/:id/output
  
Audit Log:
  GET    /audit
  GET    /audit/export
  POST   /audit/cleanup
```

## 🧪 Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage

# Health Check test
curl http://localhost:3200/api/admin/health-check/status
```

## 🚢 Deployment

### Docker

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check logs
docker-compose logs -f
```

### PM2

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Reload
pm2 reload all
```

## 📈 Monitoring

### Health Checks
- Sistema automatico ogni 5-30 minuti
- Dashboard real-time
- Alert automatici per problemi critici
- Report PDF settimanali

### Metriche Monitorate
- CPU & Memory usage
- API response times
- Database performance
- Error rates
- Request throughput
- WebSocket connections

## 🤝 Contributing

1. Fork il repository
2. Crea un branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📝 Changelog

### v6.1.0 (04 Ottobre 2025) 🚀
- ⚡ **Performance**: Calendario 900% più veloce (query N+1 → 1 query)
- 🎯 **Accuratezza**: Check conflitti 100% preciso (formula matematica corretta)
- 💾 **Database**: Aggiunti 3 index compositi per ottimizzazione query
- 📖 **Docs**: Nuove guide complete ottimizzazioni e sistema conflitti
- 🧪 **Testing**: 10+ test cases per validazione conflitti
- 📊 **Metriche**: 100 interventi caricati in 80ms (era 800ms)

### v6.0.0 (03 Ottobre 2025)
- 📅 Sistema Calendario Professionale completo con FullCalendar v6
- ⏰ Scheduling intelligente con drag & drop e gestione conflitti
- 🔄 Sincronizzazione real-time via WebSocket
- 📊 Multiple visualizzazioni (mese/settimana/giorno/lista)
- 🎨 Sistema branding dinamico completo

### v4.3.0 (10 Gennaio 2025)
- 🔥 **ResponseFormatter**: Implementato standard unificato per tutte le API
- 📖 **Documentazione**: Aggiunto pattern ResponseFormatter come regola fondamentale
- 🐛 **Fix**: Risolto errore React "Objects are not valid as a React child"
- ✅ **Validazione**: Centralizzata gestione errori Zod nel frontend
- 📚 **Docs**: Creata guida completa ResponseFormatter in DOCUMENTAZIONE/

### v4.1.0 (8 Settembre 2025 - Pomeriggio)
- ✨ **NUOVO**: Tab "Guida ai Test" con documentazione integrata
- ✨ FAQ estese con 8+ domande frequenti
- ✨ Spiegazioni user-friendly per tutti i componenti
- 🔧 Fix metodi `getCurrentMetrics()` e `getHistory()`
- 🔧 Correzione tutti i percorsi API duplicati `/api/api/`
- 🔧 Gestione graceful tabelle database mancanti
- 📁 Consolidamento script in posizione unica

### v4.0.0 (8 Settembre 2025 - Mattina)
- ✨ Health Check System con auto-remediation
- ✨ Script Manager con UI
- ✨ Audit Log system
- ✨ Performance monitoring real-time
- ✨ Report PDF automatici
- 📚 Documentazione completa riorganizzata

### v3.0.0 (6 Settembre 2025)
- 🔒 Security headers avanzati
- ⚡ Compression Brotli/Gzip
- 📊 Request ID tracking
- 🔄 Circuit breaker pattern

### v2.0.0 (30 Agosto 2025)
- 🤖 Integrazione AI
- 💳 Sistema pagamenti
- 📍 Geolocalizzazione

## 📄 License

Proprietario - LM Tecnologie © 2025

## 👥 Team

- **Lead Developer**: Luca Mambelli
- **Email**: lucamambelli@lmtecnologie.it
- **GitHub**: [@241luca](https://github.com/241luca)

---

**Sistema Richiesta Assistenza v4.1** - Enterprise Ready Solution 🚀