# 🚀 GUIDA DEPLOY — VM 103 (Proxmox Z240)

**Aggiornata**: 18 Aprile 2026  
**VM**: 103 — richiesta-assistenza — 192.168.0.203  
**SSH**: `ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35`

---

## 📋 Indice

1. [Architettura VM](#architettura-vm)
2. [Deploy Rapido (uso quotidiano)](#deploy-rapido)
3. [Deploy Completo (prima volta o cambio Dockerfile)](#deploy-completo)
4. [Gestione Database](#gestione-database)
5. [Gestione Uploads](#gestione-uploads)
6. [Monitoraggio e Troubleshooting](#monitoraggio-e-troubleshooting)
7. [Comandi Utili](#comandi-utili)

---

## 🏗️ Architettura VM

### Infrastruttura

| Parametro | Valore |
|---|---|
| Proxmox | Z240 — 192.168.0.211:8006 |
| VM | 103 — richiesta-assistenza |
| IP LAN | 192.168.0.203 |
| IP Tailscale | 100.101.202.35 |
| OS | Ubuntu 24.04 LTS |
| Utente SSH | santrack |
| URL App | http://192.168.0.203 |
| URL Backend | http://192.168.0.203:3200 |

### Container Docker

| Container | Immagine | Porta Host | Porta Interna | Stato |
|---|---|---|---|---|
| assistenza-frontend | richiesta-assistenza-frontend | 80, 443 | 80, 443 | ✅ Running |
| assistenza-backend | richiesta-assistenza-backend | **3200** | 3200 | ✅ Running |
| assistenza-database | postgres:16-alpine | 5434 | 5432 | ✅ Running |
| assistenza-redis | redis:7-alpine | 6382 | 6379 | ✅ Running |

> ⚠️ **IMPORTANTE**: Il backend è esposto sulla porta **3200** (non 3210 come era in precedenza). Il frontend compilato usa dinamicamente `window.location.hostname:3200` — devono combaciare.

### Percorsi importanti sulla VM

| Percorso | Contenuto |
|---|---|
| `/home/santrack/richiesta-assistenza/` | Repository clonato da GitHub |
| `/home/santrack/richiesta-assistenza/.env` | Variabili d'ambiente (NON in git) |
| `/home/santrack/richiesta-assistenza/docker-compose.yml` | Config container (personalizzata per questa VM) |
| `/home/santrack/richiesta-assistenza/backend/dist/` | Backend compilato (copiato dal Mac) |
| `/home/santrack/richiesta-assistenza/dist/` | Frontend compilato (copiato dal Mac) |
| `/home/santrack/uploads-ra/` | File upload backup sul filesystem VM |

---

## ⚡ Deploy Rapido

Usa questo metodo per il deploy quotidiano dopo modifiche al codice.

### Dal Mac — tutto in un comando

```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Build + deploy automatico
./deploy-vm.sh
```

Lo script esegue nell'ordine:
1. Build frontend (`npm run build` → `dist/`)
2. Build backend (`cd backend && npm run build` → `backend/dist/`)
3. Copia `dist/` sulla VM via rsync (solo file cambiati)
4. Aggiorna l'immagine Docker backend senza rebuild completo
5. Riavvia i container
6. Verifica health check

### Manualmente (step by step)

```bash
# 1. Build sul Mac
npm run build
cd backend && npm run build && cd ..

# 2. Copia dist backend sulla VM
rsync -av -e "ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" \
  backend/dist/ \
  santrack@100.101.202.35:/home/santrack/richiesta-assistenza/backend/dist/

# 3. Copia dist frontend sulla VM
rsync -av -e "ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" \
  dist/ \
  santrack@100.101.202.35:/home/santrack/richiesta-assistenza/dist/

# 4. Aggiorna immagine Docker backend senza rebuild
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 "
  cd /home/santrack/richiesta-assistenza
  
  # Ferma backend
  sudo docker compose stop backend
  
  # Crea container temporaneo, copia nuovo dist, committa immagine
  sudo docker run -d --name temp_fix richiesta-assistenza-backend sleep 300
  sudo docker cp backend/dist/. temp_fix:/app/dist/
  sudo docker commit temp_fix richiesta-assistenza-backend:latest
  sudo docker rm -f temp_fix
  
  # Riavvia
  sudo docker compose up -d backend
  
  # Verifica
  sleep 10 && sudo docker compose ps
"

# 5. Verifica finale dal Mac
curl http://192.168.0.203:3200/health
curl -s http://192.168.0.203/ -o /dev/null -w "Frontend: %{http_code}\n"
```

---

## 🔨 Deploy Completo

Usa questo metodo quando cambia il `Dockerfile`, le dipendenze npm, o la struttura del progetto.

> ⚠️ Il build `--no-cache` sulla VM impiega 3-8 minuti e satura la CPU al 90%+. SSH può diventare irresponsivo durante il build — è normale. La VM non è crashata.

### Procedura

```bash
# 1. Build sul Mac
npm run build
cd backend && npm run build && cd ..

# 2. Copia tutto sulla VM
rsync -av -e "ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" \
  backend/dist/ santrack@100.101.202.35:/home/santrack/richiesta-assistenza/backend/dist/
rsync -av -e "ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" \
  dist/ santrack@100.101.202.35:/home/santrack/richiesta-assistenza/dist/

# 3. Git pull sulla VM
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "cd /home/santrack/richiesta-assistenza && git pull origin main"

# 4. Rebuild Docker in background (non blocca il terminale)
# Apri un terminale separato per vedere il progresso
ssh -i ~/.ssh/id_ed25519_github \
  -o ServerAliveInterval=20 \
  santrack@100.101.202.35 \
  "cd /home/santrack/richiesta-assistenza && \
   nohup sudo docker compose build --no-cache backend > /tmp/build.log 2>&1 &
   echo 'Build avviato in background — controlla con: tail -f /tmp/build.log'"

# 5. Monitora il build (da un secondo terminale)
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 "tail -f /tmp/build.log"

# 6. Quando il build è finito, riavvia
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "cd /home/santrack/richiesta-assistenza && sudo docker compose up -d backend"
```

### Se SSH va in timeout durante il build

La VM è ancora viva — controlla dal Proxmox (http://192.168.0.211:8006) che la CPU sia alta. Quando scende sotto il 50%, SSH torna disponibile.

Se la VM sembra bloccata (CPU alta per più di 20 minuti), riavviala dal Proxmox:
```bash
ssh root@192.168.0.211 "qm stop 103 && qm start 103"
# Poi aspetta 50 secondi e riprova SSH
```

---

## 🗄️ Gestione Database

### Ripristino backup locale

```bash
# 1. Copia backup sulla VM
scp -i ~/.ssh/id_ed25519_github \
  backup/assistenza_db_backup_20251224_084204.sql \
  santrack@100.101.202.35:/tmp/db_restore.sql

# 2. Stop backend (per liberare connessioni DB)
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "cd /home/santrack/richiesta-assistenza && sudo docker compose stop backend"

# 3. Drop e ricrea database
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 "
  sudo docker exec assistenza-database psql -U assistenza_user -d postgres \
    -c 'DROP DATABASE IF EXISTS assistenza_db;'
  sudo docker exec assistenza-database psql -U assistenza_user -d postgres \
    -c 'CREATE DATABASE assistenza_db OWNER assistenza_user;'
"

# 4. Importa backup
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker exec -i assistenza-database psql -U assistenza_user -d assistenza_db < /tmp/db_restore.sql"

# 5. Verifica utenti
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker exec assistenza-database psql -U assistenza_user -d assistenza_db \
   -c \"SELECT email, role FROM \\\"User\\\" WHERE role IN ('SUPER_ADMIN', 'ADMIN') LIMIT 5;\""

# 6. Riavvia backend
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "cd /home/santrack/richiesta-assistenza && sudo docker compose up -d backend"
```

### Backup manuale

```bash
# Crea backup dal container DB
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker exec assistenza-database pg_dump -U assistenza_user assistenza_db \
   > /home/santrack/backup_$(date +%Y%m%d_%H%M%S).sql && echo OK"
```

### Shell PostgreSQL interattiva

```bash
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker exec -it assistenza-database psql -U assistenza_user -d assistenza_db"
```

---

## 📂 Gestione Uploads

I file caricati (immagini profilo, loghi, allegati) sono in un **volume Docker** montato su `/app/uploads` nel container backend.

### Sincronizzare uploads dal Mac alla VM

```bash
# Copia tutti gli uploads
rsync -av -e "ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" \
  uploads/ \
  santrack@100.101.202.35:/home/santrack/uploads-ra/

# Copia dal filesystem VM dentro il container
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker cp /home/santrack/uploads-ra/. assistenza-backend:/app/uploads/"
```

### Copia uploads da dist/ (loghi sito)

```bash
rsync -av -e "ssh -i ~/.ssh/id_ed25519_github -o StrictHostKeyChecking=no" \
  dist/uploads/ \
  santrack@100.101.202.35:/tmp/uploads-dist/

ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker cp /tmp/uploads-dist/. assistenza-backend:/app/uploads/"
```

---

## 🔍 Monitoraggio e Troubleshooting

### Verifica stato sistema

```bash
# Stato container
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker compose -f /home/santrack/richiesta-assistenza/docker-compose.yml ps"

# Health check backend
curl http://192.168.0.203:3200/health

# Test login
curl -X POST http://192.168.0.203:3200/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@assistenza.it","password":"password123"}'
```

### Log in tempo reale

```bash
# Backend
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker logs assistenza-backend -f --tail 50"

# Frontend (Nginx)
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker logs assistenza-frontend -f --tail 20"

# Database
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker logs assistenza-database -f --tail 20"
```

### Problemi comuni

**Backend in loop di restart**
```bash
# Leggi il log per capire il motivo
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker logs assistenza-backend --tail 30 2>&1"
```
Cause frequenti:
- Modulo npm mancante → `docker commit` con npm install + riavvio
- Script non trovato nel CMD → controlla il `docker-compose.yml` della VM
- Errore Prisma → verifica schema e connessione DB

**Frontend mostra errore di connessione**
- Verifica che il backend sia su porta 3200 (non 3210): `sudo docker compose ps`
- Se su 3210: `sed -i 's/"3210:3200"/"3200:3200"/' docker-compose.yml && sudo docker compose up -d backend`

**Uploads 404**
```bash
# Controlla che i file siano nel container
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker exec assistenza-backend ls /app/uploads/"

# Ricarica nginx per aggiornare DNS interno
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker exec assistenza-frontend nginx -s reload"
```

**VM irraggiungibile via SSH durante build**

Non è un problema — il build Docker satura la CPU. Controlla dal Proxmox che la VM sia viva. Aspetta che la CPU scenda sotto il 50% (5-15 minuti per build completo).

**Riavvio di emergenza VM**
```bash
# Dal nodo Proxmox
ssh root@192.168.0.211 "qm stop 103 && sleep 5 && qm start 103"
# Aspetta 50 secondi poi riprova SSH
```

---

## 💻 Comandi Utili

### SSH rapido

```bash
# Via Tailscale (da qualsiasi rete)
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35

# Via LAN (solo rete locale)
ssh -i ~/.ssh/id_ed25519_github santrack@192.168.0.203

# Via Proxmox (shell del nodo)
ssh -i ~/.ssh/id_ed25519_github root@192.168.0.211
```

### Docker sulla VM

```bash
# Tutti i container
sudo docker compose ps

# Riavvia tutto
sudo docker compose restart

# Riavvia solo backend
sudo docker compose restart backend

# Rebuild backend (lento, usa --no-cache solo se necessario)
sudo docker compose build backend
sudo docker compose up -d backend

# Shell dentro il container
sudo docker exec -it assistenza-backend sh

# Variabili d'ambiente del container
sudo docker exec assistenza-backend env | grep -v PASSWORD
```

### Nginx reload (aggiorna DNS interno dopo riavvio container)

```bash
ssh -i ~/.ssh/id_ed25519_github santrack@100.101.202.35 \
  "sudo docker exec assistenza-frontend nginx -s reload"
```

---

## 📝 Note Importanti

1. **Il `docker-compose.yml` della VM è personalizzato** — ha porte diverse da quello del repository. Non sovrascriverlo mai con `git pull` diretto (il file non è in git quindi non c'è rischio, ma attenzione).

2. **I dist non sono in git** (sono nel `.gitignore`) — vanno sempre copiati via rsync dopo ogni build.

3. **La porta del backend deve essere 3200** sul lato host — il frontend compilato usa `window.location.hostname:3200` dinamicamente. Se la porta cambia, bisogna ricompilare il frontend con `VITE_API_URL` corretto.

4. **Le chiavi API (Google Maps, OpenAI, ecc.) sono nel DB** — non nelle variabili d'ambiente. Le gestisci da `/admin/api-keys` nell'interfaccia web.

5. **Per aggiungere origini CORS** in produzione: modifica `ALLOWED_ORIGINS` nel `.env` della VM e riavvia il backend.
