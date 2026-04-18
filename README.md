# 🚀 Sistema di Richiesta Assistenza

**Versione**: 6.2.0  
**Ultimo Aggiornamento**: 18 Aprile 2026  
**Status**: ✅ Production Ready — In esecuzione su VM 103 (192.168.0.203)

---

## 📋 Panoramica

Il **Sistema di Richiesta Assistenza** è una piattaforma enterprise completa che connette clienti con professionisti qualificati attraverso un sistema intelligente basato su AI. Gestisce l'intero ciclo di vita dei servizi: dalla richiesta iniziale, alla gestione preventivi, all'assegnazione dei professionisti, fino alla fatturazione e recensioni.

### 🌟 Caratteristiche Principali

- **🔐 Sicurezza Enterprise** — JWT + 2FA, rate limiting, CORS dinamico, security headers OWASP
- **⚡ Performance Ottimizzata** — Compression Brotli/Gzip, Redis cache, query N+1 eliminate
- **🤖 AI-Powered** — Assistenza intelligente con OpenAI GPT-4, sistema duale professionisti/clienti
- **💳 Pagamenti Sicuri** — Integrazione Stripe con retry logic e circuit breaker
- **📍 Geolocalizzazione** — Google Maps integration con cache Redis
- **💬 Real-time** — WebSocket (Socket.io) per notifiche e chat istantanee
- **📊 Monitoring Completo** — Health checks, audit log, dashboard stato servizi
- **📝 Custom Forms** — Editor visuale drag & drop per moduli personalizzati
- **📱 WhatsApp** — Integrazione WppConnect per messaggistica
- **🌍 Zero Config Hardcoded** — Tutti gli URL e le chiavi vengono da variabili d'ambiente o dal database

---

## 🏗️ Stack Tecnologico

### Backend
| Tecnologia | Versione | Uso |
|---|---|---|
| Node.js | 20.x LTS | Runtime |
| TypeScript | 5.x | Linguaggio |
| Express.js | 4.x | Framework HTTP |
| Prisma ORM | latest | Database access |
| PostgreSQL | 16 | Database principale |
| Redis | 7 | Cache e code |
| Socket.io | 4.x | WebSocket real-time |
| Bull | 4.x | Job queue |
| JWT + Speakeasy | — | Auth + 2FA |

### Frontend
| Tecnologia | Versione | Uso |
|---|---|---|
| React | 18.x | UI framework |
| TypeScript | 5.x | Linguaggio |
| Vite | 7.x | Build tool |
| TanStack Query | 5.x | Server state |
| Zustand | 4.x | Client state |
| React Router | 6.x | Routing |
| Tailwind CSS | 3.x | Styling |
| Heroicons | 2.x | Icone |

### Integrazioni Esterne (chiavi nel DB)
- **OpenAI** — AI assistant (GPT-4/3.5)
- **Stripe** — Pagamenti
- **Google Maps** — Mappe e geocoding
- **Google Calendar** — Sincronizzazione calendario
- **Brevo** — Email transazionale
- **WppConnect** — WhatsApp Business

---

## 📁 Struttura del Progetto

```
richiesta-assistenza/
├── 📋 ISTRUZIONI-PROGETTO.md       ⚠️  LEGGERE PRIMA DI INIZIARE
├── 📋 README.md                    Questo file
├── 📋 CHANGELOG.md                 Storia delle versioni
├── 📋 LEGGIMI-DOCUMENTAZIONE.md    Guida alla documentazione
│
├── 📚 DOCUMENTAZIONE/              TUTTA la documentazione
│   ├── INDEX.md                   Punto di partenza navigazione
│   ├── ATTUALE/                   Documentazione valida
│   │   ├── 00-ESSENZIALI/         File critici
│   │   ├── 01-ARCHITETTURA/       Architettura sistema
│   │   ├── 02-FUNZIONALITA/       Docs per feature
│   │   ├── 03-API/                Documentazione API
│   │   ├── 04-GUIDE/              Guide pratiche
│   │   └── 05-TROUBLESHOOTING/    Risoluzione problemi
│   ├── ARCHIVIO/                  Documentazione storica
│   └── REPORT-SESSIONI/           Report ogni sessione di sviluppo
│
├── 🖥️  backend/                    Backend Express + TypeScript
│   ├── src/
│   │   ├── routes/                70+ endpoint API
│   │   ├── services/              50+ servizi business logic
│   │   ├── middleware/            Auth, audit, security, compression
│   │   └── utils/                 ResponseFormatter, logger, socket
│   ├── prisma/
│   │   └── schema.prisma          Schema DB (86+ tabelle)
│   ├── Dockerfile                 Ottimizzato — usa dist precompilato
│   └── docker-entrypoint.sh       Fix permessi volumi Docker
│
├── 🎨 src/                         Frontend React (NON /frontend!)
│   ├── components/                Componenti riutilizzabili
│   ├── pages/                     Pagine applicazione
│   ├── contexts/                  React Contexts (Auth, Maps, Socket)
│   ├── hooks/                     Custom hooks
│   ├── services/                  API client e servizi
│   │   └── api.ts                 ⚠️  API_BASE_URL dinamico — no localhost
│   └── types/                     TypeScript types
│
├── 🐋 docker-compose.yml           Configurazione container (DEV)
├── 🔧 nginx.conf                   Nginx con proxy /uploads/ e /api/
├── 📦 Dockerfile.frontend          Nginx con dist precompilato
├── 🚀 deploy-vm.sh                 Script deploy automatico sulla VM
└── 📄 .env.example                 Template variabili d'ambiente
```

---

## 🚀 Quick Start — Sviluppo Locale

### Prerequisiti
- Node.js 20+ LTS
- PostgreSQL 16+
- Redis 7+

### Installazione

```bash
# 1. Clone
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd richiesta-assistenza

# 2. Installa dipendenze
npm install
cd backend && npm install && cd ..

# 3. Configura environment
cp .env.example .env
# Modifica .env con le tue configurazioni

# 4. Setup database
cd backend
npx prisma generate
npx prisma db push
npx prisma db seed   # Dati di esempio
cd ..

# 5. Avvia i servizi
# Terminal 1 — Backend (porta 3200)
cd backend && npm run dev

# Terminal 2 — Frontend (porta 5193)
npm run dev

# Terminal 3 — Redis
redis-server
```

### Accesso
- **Frontend**: http://localhost:5193
- **Backend API**: http://localhost:3200
- **Health check**: http://localhost:3200/health

### Credenziali Default (da seed)
```
Admin:     admin@assistenza.it  /  password123   (SUPER_ADMIN)
Staff:     staff@assistenza.it  /  password123   (ADMIN)
Test:      test@test.com        /  password123   (SUPER_ADMIN)
```

---

## 🌐 Ambiente di Produzione (VM 103)

| Parametro | Valore |
|---|---|
| URL App | http://192.168.0.203 |
| Backend API | http://192.168.0.203:3200 |
| VM Proxmox | Z240 — 192.168.0.211 |
| OS | Ubuntu 24.04 LTS |
| SSH | `ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35` |

### Container Docker in produzione

| Container | Porta host | Stato |
|---|---|---|
| assistenza-frontend | 80:80 | ✅ Running |
| assistenza-backend | 3200:3200 | ✅ Running |
| assistenza-database | 5434:5432 | ✅ Running |
| assistenza-redis | 6382:6379 | ✅ Running |

> ⚠️ Il `docker-compose.yml` sulla VM è personalizzato (porte diverse) — non sovrascriverlo con quello del repository.

---

## 📡 API — Panoramica Endpoint Principali

Base URL: `http://localhost:3200/api`  
Autenticazione: `Authorization: Bearer <token>`

```
Auth:           POST /auth/login, /auth/register, /auth/refresh
Users:          GET/PUT /users/profile, POST /users/avatar
Requests:       CRUD /requests, /requests/:id/attachments
Quotes:         CRUD /quotes, POST /quotes/:id/accept
Professionals:  GET /professionals, /professionals/:id
Notifications:  GET /notifications, PUT /notifications/:id/read
Chat:           GET/POST /chat/:requestId/messages
Maps:           POST /maps/geocode, /maps/calculate-distance
Calendar:       CRUD /calendar/interventions
Payments:       POST /payments/create-intent, /payments/confirm
Admin:          /admin/users, /admin/system-settings, /admin/scripts
Health:         GET /health  (no auth)
Public:         GET /public/system-settings/basic  (no auth)
```

Tutte le risposte seguono il formato **ResponseFormatter**:
```json
{
  "success": true,
  "message": "Operazione completata",
  "data": { },
  "timestamp": "2026-04-18T..."
}
```

---

## 🔐 Sicurezza

### Implementazioni

- **CORS dinamico** — Origini lette da `FRONTEND_URL` e `ALLOWED_ORIGINS` (env), mai hardcoded
- **JWT + 2FA** — Token con refresh, TOTP via Speakeasy
- **Rate limiting** — Configurabile per endpoint (default: 50 req/15min su /auth)
- **Helmet.js** — Security headers (CSP, HSTS, X-Frame-Options)
- **Zod validation** — Su tutti gli endpoint
- **Audit log** — Tracciamento completo ogni azione utente
- **RBAC** — 4 ruoli: CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN
- **bcrypt** — Hash password con 10 rounds

### Chiavi API

Tutte le chiavi API (Google Maps, OpenAI, Stripe, ecc.) sono memorizzate nel **database** nella tabella `ApiKey`. Non sono mai nel codice sorgente né nelle variabili d'ambiente dell'app. L'admin le gestisce dalla dashboard `/admin/api-keys`.

---

## 🔧 Pattern Fondamentali

### ResponseFormatter (OBBLIGATORIO)

```typescript
// ✅ Backend — SOLO nelle routes, MAI nei services
router.get('/items', authenticate, async (req, res) => {
  const items = await itemService.getAll();   // Service ritorna dati grezzi
  return res.json(ResponseFormatter.success(items, 'Recuperati'));
});

// ❌ MAI nei services
async function getAll() {
  return ResponseFormatter.success(await prisma.item.findMany()); // SBAGLIATO
}
```

### API Client Frontend (NO /api doppio)

```typescript
// src/services/api.ts ha già baseURL = 'http://.../api'
// ✅ CORRETTO
api.get('/users')       // → /api/users
api.post('/requests')   // → /api/requests

// ❌ SBAGLIATO — genera /api/api/users
api.get('/api/users')
```

### URL Backend (dinamico, mai hardcoded)

```typescript
// src/services/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost'
    ? 'http://localhost:3200'
    : `http://${window.location.hostname}:3200`);
```

---

## 🐋 Deploy

### Procedura Deploy su VM (rapida)

```bash
# 1. Build sul Mac
npm run build                        # Frontend → dist/
cd backend && npm run build && cd .. # Backend → backend/dist/

# 2. Usa lo script automatico
./deploy-vm.sh
# Oppure con IP LAN: ./deploy-vm.sh 192.168.0.203
```

Lo script `deploy-vm.sh` esegue automaticamente:
- Copia dist frontend e backend sulla VM via rsync
- Aggiorna l'immagine Docker senza rebuild completo
- Riavvia i container
- Verifica che tutto funzioni

Per la guida completa → vedi **[DOCUMENTAZIONE/ATTUALE/04-GUIDE/DEPLOY-VM.md](DOCUMENTAZIONE/ATTUALE/04-GUIDE/DEPLOY-VM.md)**

### Build Docker (solo quando cambia il Dockerfile)

```bash
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35
cd /home/santrack/richiesta-assistenza
sudo docker compose build --no-cache backend
sudo docker compose up -d backend
```

> ⚠️ Il build con `--no-cache` impiega 3-5 minuti sulla VM e satura la CPU — normale.

---

## 📊 Monitoring

Il sistema espone diversi endpoint di monitoraggio:

```bash
# Health check (no auth)
curl http://192.168.0.203:3200/health

# Stato servizi (richiede auth SUPER_ADMIN)
curl -H "Authorization: Bearer TOKEN" http://192.168.0.203:3200/api/admin/health-check/status

# Audit log
curl -H "Authorization: Bearer TOKEN" http://192.168.0.203:3200/api/audit
```

Dalla dashboard admin:
- `/admin/system-status` — Stato 9 servizi in tempo reale
- `/admin/audit` — Log completo operazioni
- `/admin/health-check` — Automation e alert

---

## 🧪 Testing

```bash
# Unit tests
npm test

# TypeScript check (zero errori richiesti)
cd backend && npx tsc --noEmit

# Test sistema (script automatico)
./scripts/test-finale.sh
```

---

## 🤝 Contribuire

1. Leggi **ISTRUZIONI-PROGETTO.md** prima di tutto
2. Crea un branch: `git checkout -b feature/nome-feature`
3. Segui tutti i pattern obbligatori (ResponseFormatter, React Query, ecc.)
4. Esegui `./scripts/pre-commit-check.sh` prima del commit
5. Crea il report di sessione in `DOCUMENTAZIONE/REPORT-SESSIONI/`
6. Apri una Pull Request

---

## 📝 Changelog Rapido

| Versione | Data | Highlights |
|---|---|---|
| **6.2.0** | Apr 2026 | Zero hardcoded — tutti URL dinamici da env; deploy VM 103 |
| 6.1.0 | Ott 2025 | Calendario 900% più veloce, check conflitti corretto |
| 6.0.0 | Ott 2025 | Sistema calendario completo, branding dinamico |
| 5.3.1 | Ott 2025 | Modulo Document Integration, performance 50x |
| 5.3.0 | Ott 2025 | Custom Forms completo con 18 tipi di campo |
| 5.2.0 | Ott 2025 | Sistema monitoraggio, 9 servizi monitorati |

Changelog completo → [CHANGELOG.md](CHANGELOG.md)

---

## 👥 Team

**Lead Developer**: Luca Mambelli  
**Email**: lucamambelli@lmtecnologie.it  
**GitHub**: [@241luca](https://github.com/241luca)

---

**Sistema Richiesta Assistenza v6.2.0** — LM Tecnologie © 2026
