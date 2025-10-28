# 📚 SmartDocs System - Guida Completa

## 🏗️ Architettura Sistema

```
┌─────────────────────────────────────────────────────────────┐
│              RICHIESTA ASSISTENZA BACKEND                    │
│                    (porta 3200)                              │
│   - Gestisce sync rules e configurazioni                    │
│   - Trigger sync jobs da eventi applicazione                │
│   - Proxy API per SmartDocs                                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  SMARTDOCS ECOSYSTEM                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Admin UI    │  │ SmartDocs API│  │ Sync Worker  │     │
│  │  :3501       │  │  :3500       │  │  Background  │     │
│  │  Web Panel   │  │  REST API    │  │  Processor   │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│  ┌──────▼──────────────────▼──────────────────▼───────┐    │
│  │           PostgreSQL + pgvector (:5433)             │    │
│  └──────┬──────────────────┬──────────────────┬───────┘    │
│         │                  │                  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐     │
│  │    Redis     │  │   Qdrant     │  │    MinIO     │     │
│  │    :6380     │  │  Vector DB   │  │   Storage    │     │
│  │    Cache     │  │  :6333-6334  │  │  :9000-9001  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Servizi e Gestione

### 0. **Admin UI (Standalone)** (porta 3501) 🆕

**Descrizione:** Pannello di gestione web standalone per SmartDocs.

**URL:** http://localhost:3501

**Funzionalità:**
- ✅ Dashboard con stato servizi
- ✅ Gestione API Keys (OpenAI, Encryption)
- ✅ Monitor sync jobs
- ✅ Gestione container
- ✅ System health monitoring
- ✅ Comandi Docker reference

**Comandi:**
```bash
# Avvio (dalla root smartdocs)
npm run admin

# Oppure direttamente
cd admin-ui
node server.js

# In background
cd admin-ui
node server.js &
```

**Accesso:** http://localhost:3501

---

### 1. **SmartDocs API** (porta 3500)

**Descrizione:** REST API principale per gestione documenti, container, embedding e query RAG.

**Posizione:**
```bash
/Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs/
```

**Comandi:**
```bash
# Avvia in dev mode
cd smartdocs
npm run dev

# Avvia in produzione
npm start

# Build
npm run build

# Test
npm test
```

**Health Check:**
```bash
curl http://localhost:3500/health
```

**Configurazione:** `.env` in `/smartdocs/`

---

### 2. **Sync Worker** (Background)

**Descrizione:** Elabora in background i job di sincronizzazione, genera embeddings e chunking.

**Posizione:**
```bash
/Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs/src/worker.ts
```

**Comandi:**
```bash
# Avvia worker
cd smartdocs
npm run worker

# Avvia in background
npm run worker &

# Ferma worker
pkill -f "ts-node src/worker.ts"

# Verifica se è in esecuzione
ps aux | grep "worker.ts"
```

**Funzionalità:**
- ✅ Polling automatico ogni 5 secondi
- ✅ Genera embeddings con OpenAI
- ✅ Split intelligente in chunks
- ✅ Gestione retry automatico
- ✅ Reset job stuck (>5 minuti)

---

### 3. **PostgreSQL + pgvector** (porta 5433)

**Descrizione:** Database principale con supporto vettoriale per embeddings.

**Container Docker:** `smartdocs-db`

**Comandi:**
```bash
# Via Docker Compose
cd smartdocs
docker-compose up -d smartdocs-db

# Restart
docker-compose restart smartdocs-db

# Logs
docker-compose logs -f smartdocs-db

# Accesso diretto
psql postgresql://smartdocs:smartdocs_secure_pwd@localhost:5433/smartdocs
```

**Schema:**
- `smartdocs.container_instances`
- `smartdocs.documents`
- `smartdocs.document_chunks`
- `smartdocs.sync_jobs`
- `smartdocs.sync_config`
- `smartdocs.user_sync_overrides`
- `smartdocs.category_sync_exclusions`

---

### 4. **Redis Cache** (porta 6380)

**Descrizione:** Cache per embedding e query, migliora performance.

**Container Docker:** `smartdocs-redis`

**Comandi:**
```bash
# Via Docker Compose
docker-compose up -d smartdocs-redis

# Restart
docker-compose restart smartdocs-redis

# Accesso CLI
docker exec -it smartdocs-redis redis-cli

# Flush cache
docker exec -it smartdocs-redis redis-cli FLUSHALL
```

---

### 5. **Qdrant Vector DB** (porte 6333-6334)

**Descrizione:** Database vettoriale specializzato per semantic search.

**Container Docker:** `smartdocs-vector`

**Comandi:**
```bash
# Via Docker Compose
docker-compose up -d smartdocs-vector

# Restart
docker-compose restart smartdocs-vector

# Web UI
open http://localhost:6333/dashboard
```

**API:**
- REST: `http://localhost:6333`
- gRPC: `http://localhost:6334`

---

### 6. **MinIO Storage** (porte 9000-9001)

**Descrizione:** Object storage S3-compatible per file e documenti.

**Container Docker:** `smartdocs-storage`

**Comandi:**
```bash
# Via Docker Compose
docker-compose up -d smartdocs-storage

# Restart
docker-compose restart smartdocs-storage

# Web Console
open http://localhost:9001
```

**Credenziali default:**
- Username: `minioadmin`
- Password: `minioadmin`

---

## 🚀 Comandi Docker Completi

### Gestione Tutti i Servizi

```bash
# Avvia tutto
cd smartdocs
docker-compose up -d

# Ferma tutto
docker-compose down

# Riavvia tutto
docker-compose restart

# Vedi stato
docker-compose ps

# Vedi logs di tutti
docker-compose logs -f

# Vedi logs di uno specifico
docker-compose logs -f smartdocs-db

# Rebuild e restart
docker-compose down
docker-compose build
docker-compose up -d
```

### Controllo Individuale

```bash
# Avvia solo database
docker-compose up -d smartdocs-db

# Ferma solo worker
docker-compose stop smartdocs-api

# Restart solo Redis
docker-compose restart smartdocs-redis
```

---

## 🎯 Workflow Tipico di Avvio

### 1. **Avvio Completo del Sistema**

```bash
# 1. Avvia Docker (se non già avviato)
open -a Docker

# 2. Avvia tutti i container SmartDocs
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs
docker-compose up -d

# 3. Verifica che tutti i container siano UP
docker-compose ps

# 4. Avvia SmartDocs API
npm run dev

# 5. In un altro terminale, avvia il Worker
npm run worker &

# 6. Avvia backend principale (in altra directory)
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend
npm run dev

# 7. Verifica tutto funzioni
curl http://localhost:3500/health
curl http://localhost:3200/health
```

### 2. **Stop Completo**

```bash
# 1. Ferma worker
pkill -f "ts-node src/worker.ts"

# 2. Ferma SmartDocs API
# (Ctrl+C nel terminale dove gira)

# 3. Ferma backend principale
# (Ctrl+C nel terminale dove gira)

# 4. Ferma container Docker
cd smartdocs
docker-compose down
```

---

## 📊 Pagine di Monitoraggio

### 1. **SmartDocs System Status**

**URL:** http://localhost:5193/admin/smartdocs/system-status

**Funzionalità:**
- ✅ Stato real-time di tutti i servizi
- ✅ Health check automatico ogni 10s
- ✅ Dettagli uptime e connessioni
- ✅ Quick actions e comandi
- ✅ Documentazione integrata

### 2. **SmartDocs Sync Monitor**

**URL:** http://localhost:5193/admin/smartdocs/sync-monitor

**Funzionalità:**
- ✅ Monitoraggio job in tempo reale
- ✅ Statistiche (Total, Pending, Processing, Completed, Failed)
- ✅ Filtri avanzati
- ✅ Retry job falliti
- ✅ Export CSV

### 3. **SmartDocs Sync Settings**

**URL:** http://localhost:5193/admin/smartdocs/sync-settings

**Funzionalità:**
- ✅ Configurazione globale sync
- ✅ Override per utenti specifici
- ✅ Esclusioni per categoria
- ✅ Gestione container

---

## 🐛 Troubleshooting

### Problema: "Cannot connect to database"

**Soluzione:**
```bash
# Verifica Docker
docker ps | grep smartdocs

# Riavvia database
cd smartdocs
docker-compose restart smartdocs-db

# Verifica logs
docker-compose logs smartdocs-db
```

### Problema: "Worker not processing jobs"

**Soluzione:**
```bash
# Verifica se è in esecuzione
ps aux | grep worker

# Riavvia worker
pkill -f "ts-node src/worker.ts"
cd smartdocs
npm run worker &
```

### Problema: "API returning 500"

**Soluzione:**
```bash
# Check logs SmartDocs API
# Verifica .env configuration
cat smartdocs/.env

# Riavvia API
cd smartdocs
npm run dev
```

### Problema: "Job stuck in PROCESSING"

**Soluzione:**
- Il worker resetta automaticamente job stuck >5 minuti
- Oppure manualmente:
```sql
UPDATE smartdocs.sync_jobs 
SET status = 'pending', started_at = NULL
WHERE status = 'processing' 
  AND started_at < NOW() - INTERVAL '5 minutes';
```

---

## 📁 Struttura File Importante

```
smartdocs/
├── src/
│   ├── index.ts              # SmartDocs API entry point
│   ├── worker.ts             # Background worker (NUOVO)
│   ├── api/
│   │   └── routes/           # REST API routes
│   ├── services/             # Business logic
│   ├── database/             # Database client
│   └── utils/                # Utilities
├── docker-compose.yml        # Docker services config
├── .env                      # Configuration
└── package.json              # Scripts and dependencies

backend/
└── src/
    ├── routes/
    │   └── smartdocs-config.routes.ts  # Sync config API
    └── services/
        ├── smartdocs-config.service.ts # Sync rules logic
        └── smartdocs-hooks.service.ts   # Auto-sync triggers
```

---

## ✅ Checklist Pre-Produzione

- [ ] Tutti i container Docker avviati
- [ ] SmartDocs API risponde su :3500
- [ ] Worker in esecuzione
- [ ] Database accessibile su :5433
- [ ] OpenAI API key configurata
- [ ] Health check tutti green
- [ ] Nessun job stuck in processing
- [ ] Logs senza errori critici

---

## 📞 Quick Reference

| Servizio | Porta | Health Check |
|----------|-------|--------------|
| Backend Principale | 3200 | `http://localhost:3200/health` |
| SmartDocs API | 3500 | `http://localhost:3500/health` |
| PostgreSQL | 5433 | `psql postgresql://...` |
| Redis | 6380 | `redis-cli -p 6380 ping` |
| Qdrant | 6333 | `http://localhost:6333` |
| MinIO API | 9000 | `http://localhost:9000` |
| MinIO Console | 9001 | `http://localhost:9001` |

---

**Ultima modifica:** 26 Ottobre 2025  
**Versione:** 1.0.0
