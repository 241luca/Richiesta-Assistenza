# 🐳 Docker Locale - Guida Rapida

## 📋 Prerequisiti

- Docker Desktop installato e attivo
- PostgreSQL locale con database `assistenza_db` (per migrazione dati)
- File `.env` configurato nella root del progetto

---

## 🚀 Quick Start (Prima Volta)

### 1. Configura `.env`

```bash
# Copia il template
cp .env.example .env

# Modifica le credenziali (se necessario)
# Database Docker - credenziali già configurate per locale
DB_PASSWORD=assistenza_secure_password
REDIS_PASSWORD=redis_secure_password
JWT_SECRET=your_jwt_secret_min_32_chars
SESSION_SECRET=your_session_secret_min_32_chars
```

### 2. Migra Database Locale → Docker

```bash
# Esporta DB locale + Importa in Docker (tutto automatico)
./backup-and-restore-db.sh migrate
```

Questo script:
- ✅ Esporta il tuo database locale in `./backup/`
- ✅ Avvia lo stack Docker (se non attivo)
- ✅ Importa i dati nel PostgreSQL Docker
- ✅ Verifica che tutto funzioni

### 3. Avvia Stack Completo

Se hai già migrato i dati, puoi avviare direttamente:

```bash
./start-local.sh
```

---

## 🎯 Comandi Principali

### Gestione Stack Docker

```bash
# Avvia tutto
./start-local.sh

# Ferma tutto
./stop-local.sh

# Menu interattivo (gestisce Richiesta Assistenza + SmartDocs)
./docker-local.sh
```

### Gestione Database

```bash
# Migrazione completa (export + import)
./backup-and-restore-db.sh migrate

# Solo export DB locale
./backup-and-restore-db.sh export

# Solo import in Docker (richiede stack attivo)
./backup-and-restore-db.sh import

# Help comandi
./backup-and-restore-db.sh help
```

### Docker Compose Diretto

```bash
# Build immagini
docker-compose build

# Avvia servizi
docker-compose up -d

# Ferma servizi
docker-compose down

# Logs in tempo reale
docker-compose logs -f

# Logs solo backend
docker-compose logs -f backend

# Status servizi
docker-compose ps
```

---

## 🌐 Servizi Disponibili

Una volta avviato lo stack, avrai accesso a:

| Servizio | URL | Credenziali |
|----------|-----|-------------|
| **Frontend** | http://localhost:8084 | - |
| **API** | http://localhost:8084/api | - |
| **Health Check** | http://localhost:8084/api/health | - |
| **PostgreSQL** | `localhost:5434` | `assistenza_user` / `assistenza_secure_password` |
| **Redis** | `localhost:6382` | password: `redis_secure_password` |

### Connessione Database

```bash
# Via psql
PGPASSWORD=assistenza_secure_password psql -h localhost -p 5434 -U assistenza_user -d assistenza_db

# Connection string
postgresql://assistenza_user:assistenza_secure_password@localhost:5434/assistenza_db
```

---

## 📦 Architettura Stack

### Servizi Docker Compose

```
┌─────────────────────────────────────┐
│     FRONTEND (Nginx + React)        │
│     Porta: 8084:80, 8443:443        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│     BACKEND (Express API)           │
│     Porta: 3210:3200                │
└─────────────────────────────────────┘
       ↓                ↓
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │
│  Porta: 5434 │  │  Porta: 6382 │
└──────────────┘  └──────────────┘
```

### Volumi Persistenti

- `postgres_data` - Dati database
- `redis_data` - Dati Redis
- `backend_uploads` - File caricati
- `backend_logs` - Log applicazione
- `backend_backups` - Backup automatici

---

## 🔧 Troubleshooting

### Problema: "Port already allocated"

```bash
# Controlla se ci sono servizi in conflitto
docker ps
lsof -i :8084  # Frontend
lsof -i :3210  # Backend
lsof -i :5434  # PostgreSQL
lsof -i :6382  # Redis

# Ferma lo stack e riavvia
docker-compose down
./start-local.sh
```

### Problema: "Database connection refused"

```bash
# Verifica che il container sia healthy
docker-compose ps

# Controlla logs database
docker-compose logs database

# Ricrea il container database
docker-compose down
docker volume rm richiesta-assistenza_postgres_data
./backup-and-restore-db.sh migrate
```

### Problema: "Backend crashes on startup"

```bash
# Controlla logs
docker-compose logs backend

# Verifica variabili ambiente
docker exec assistenza-backend env | grep DATABASE_URL

# Rebuild backend
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Reset Completo

```bash
# Ferma tutto
docker-compose down

# Rimuovi volumi (ATTENZIONE: cancella dati!)
docker volume rm richiesta-assistenza_postgres_data
docker volume rm richiesta-assistenza_redis_data

# Ricostruisci e importa
./backup-and-restore-db.sh migrate
```

---

## 📝 Note Importanti

### Database

- **Porta Host**: `5434` (per evitare conflitto con PostgreSQL locale su `5432`)
- **Volumi**: I dati sono persistenti nel volume Docker
- **Backup**: La directory `./backup/` contiene gli export SQL (ignorata da git)

### Redis

- **Porta Host**: `6382` (per evitare conflitto con Redis locale su `6379`)
- **Password**: Configurata via variabile `REDIS_PASSWORD`

### Network

- Tutti i servizi comunicano sulla rete `assistenza-network`
- Isolamento completo da SmartDocs (rete separata)

### Build

- Il backend ignora errori TypeScript durante la build (`|| true`)
- Frontend usa build ottimizzato Vite + Nginx

---

## 🚦 Workflow Sviluppo

### Sviluppo Normale

```bash
# 1. Avvia stack (se non attivo)
./start-local.sh

# 2. Sviluppa normalmente
# Frontend: modifica file in src/
# Backend: modifica file in backend/src/

# 3. Per vedere modifiche backend (rebuild necessario)
docker-compose build backend
docker-compose up -d backend

# 4. Logs in tempo reale
docker-compose logs -f backend
```

### Aggiornamento Dati DB

```bash
# Se aggiorni il DB locale e vuoi sincronizzare
./backup-and-restore-db.sh export
./backup-and-restore-db.sh import
```

### SmartDocs Parallelo

```bash
# Avvia entrambi con menu
./docker-local.sh

# Oppure manualmente
./start-local.sh                    # Richiesta Assistenza
cd smartdocs && ./start-local.sh    # SmartDocs
```

---

## 📚 Link Utili

- [Docker Compose Reference](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Nginx Docker Hub](https://hub.docker.com/_/nginx)

---

**Creato il**: 24 Dicembre 2024  
**Versione Stack**: 6.1.0
