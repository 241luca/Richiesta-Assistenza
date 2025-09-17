# 🚀 Sistema di Richiesta Assistenza

**Versione**: 4.1.0  
**Ultimo Aggiornamento**: 8 Settembre 2025  
**Status**: ✅ Production Ready

## 📋 Panoramica

Il **Sistema di Richiesta Assistenza** è una piattaforma enterprise completa che connette clienti con professionisti qualificati attraverso un sistema intelligente basato su AI. La piattaforma gestisce l'intero ciclo di vita dei servizi, dalla richiesta iniziale alla generazione di preventivi e all'assegnazione dei professionisti.

### 🌟 Caratteristiche Principali

- **🔐 Sicurezza Enterprise**: Security headers OWASP compliant, rate limiting, CSP avanzato
- **⚡ Performance Ottimizzata**: Compression Brotli/Gzip, -70% bandwidth, caching intelligente
- **🤖 AI-Powered**: Assistenza intelligente con OpenAI GPT-4/GPT-3.5-turbo
- **💳 Pagamenti Sicuri**: Integrazione Stripe con retry logic e circuit breaker
- **📍 Geolocalizzazione**: Google Maps integration con fallback
- **💬 Real-time**: WebSocket per notifiche e chat istantanee
- **📊 Monitoring Avanzato**: Health checks, circuit breakers, request tracking
- **🔄 Alta Affidabilità**: Retry logic, circuit breaker pattern, 99.9% uptime

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
- Response Format: ResponseFormatter standard

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