# 🐳 GUIDA GITHUB CONTAINER REGISTRY + DEPLOY

**Data**: Gennaio 2025  
**Sistema**: Deploy automatizzato con GitHub Actions  
**Vantaggio**: Build su GitHub, Deploy velocissimo sul VPS!

---

## 🎯 COME FUNZIONA

```
┌─────────────────────────────────────────┐
│  1. SVILUPPI SUL MAC                    │
│     └─ Modifichi codice                 │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  2. PUSH SU GITHUB                      │
│     └─ git push origin main             │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  3. GITHUB ACTIONS (automatico!)        │
│     ├─ Build immagine frontend          │
│     ├─ Build immagine backend           │
│     ├─ Build immagine whatsapp          │
│     └─ Push su ghcr.io                  │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│  4. VPS HETZNER                         │
│     └─ docker-compose pull              │
│     └─ Immagini pronte in 30 secondi!   │
└─────────────────────────────────────────┘
```

---

## 📋 SETUP INIZIALE (Una volta sola!)

### 1️⃣ Configura GitHub Container Registry

#### A. Rendi pubblico il registry (più semplice)

1. Vai su GitHub → Tuo profilo
2. Packages → richiesta-assistenza-*
3. Package settings → Change visibility → Public

✅ **Fatto!** Le immagini sono pubbliche, nessun login necessario

#### B. Oppure usa token per immagini private

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Seleziona scope:
   - ✅ `write:packages`
   - ✅ `read:packages`
   - ✅ `delete:packages`
4. Copia il token: `ghp_xxxxxxxxxxxx`

Sul VPS:
```bash
# Login con token
echo "ghp_xxxxxxxxxxxx" | docker login ghcr.io -u 241luca --password-stdin
```

### 2️⃣ Primo Push su GitHub

Sul Mac:
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Add e commit tutto
git add .
git commit -m "feat: setup GitHub Container Registry"

# Push su GitHub
git push origin main
```

Questo attiverà automaticamente GitHub Actions! 🚀

### 3️⃣ Verifica Build su GitHub

1. Vai su GitHub → Richiesta-Assistenza
2. Tab "Actions"
3. Dovresti vedere: "Build and Push Docker Images" in corso

⏱️ **Durata**: 10-15 minuti prima build

### 4️⃣ Verifica Immagini Create

Dopo il build:
1. GitHub → Tuo profilo → Packages
2. Dovresti vedere:
   - ✅ `richiesta-assistenza-frontend`
   - ✅ `richiesta-assistenza-backend`
   - ✅ `richiesta-assistenza-whatsapp`

---

## 🚀 DEPLOY SUL VPS

### 1️⃣ Pulisci VPS (se necessario)

```bash
# Sul VPS
cd /opt/assistenza
./scripts/clean-vps.sh
# Scrivi: SI
```

### 2️⃣ Carica progetto

```bash
# Sul VPS
mkdir -p /opt/assistenza
cd /opt/assistenza

# Clone repo
git clone https://github.com/241luca/Richiesta-Assistenza.git .
```

### 3️⃣ Configura .env.production

```bash
cp .env.production.example .env.production
nano .env.production

# Configura:
# - DB_PASSWORD
# - REDIS_PASSWORD
# - JWT_SECRET (3 diversi!)
# - BACKEND_URL e FRONTEND_URL
# - Email SMTP
```

### 4️⃣ Deploy!

```bash
./scripts/deploy-ghcr.sh
```

🎉 **FATTO!** In 1-2 minuti è online!

---

## 🔄 WORKFLOW QUOTIDIANO

### Sul Mac - Sviluppo

```bash
# 1. Sviluppa
code .

# 2. Testa localmente
npm run dev
cd backend && npm run dev

# 3. Quando pronto, push
git add .
git commit -m "feat: nuova funzionalità"
git push origin main
```

### GitHub Actions - Build automatico

GitHub farà automaticamente:
- ✅ Build 3 immagini Docker
- ✅ Test (se configurati)
- ✅ Push su ghcr.io
- ✅ Tag con versione

⏱️ **Durata**: 10-15 minuti

### Sul VPS - Update

```bash
# Connettiti al VPS
ssh root@TUO-IP

cd /opt/assistenza

# Update in 30 secondi!
./scripts/update.sh
```

**Fatto!** Nuova versione live! 🚀

---

## 📊 VANTAGGI GHCR

### ✅ Rispetto a build locale:

| Aspetto | Build Locale | GHCR |
|---------|--------------|------|
| **Deploy VPS** | 10-15 min | 1-2 min |
| **Uso CPU VPS** | 100% | 5% |
| **Uso RAM VPS** | 2-3GB | 200MB |
| **Rollback** | Difficile | Facile |
| **Versioning** | Manuale | Automatico |

### ✅ Altri vantaggi:

- 🚀 Deploy velocissimo
- 💾 Risparmio risorse VPS
- 📦 Versionamento immagini
- ⏪ Rollback istantaneo
- 🔄 CI/CD automatico
- 🏷️ Tag automatici (main, sha, latest)

---

## 🏷️ GESTIONE VERSIONI

### Tag automatici creati:

```bash
# Ultima versione main
ghcr.io/241luca/richiesta-assistenza-backend:latest

# Versione specifica (commit SHA)
ghcr.io/241luca/richiesta-assistenza-backend:main-abc1234

# Branch specifico
ghcr.io/241luca/richiesta-assistenza-backend:main
```

### Rollback a versione precedente:

```bash
# Sul VPS
cd /opt/assistenza

# Modifica docker-compose.prod.yml
nano docker-compose.prod.yml

# Cambia:
# image: ghcr.io/241luca/richiesta-assistenza-backend:latest
# in:
# image: ghcr.io/241luca/richiesta-assistenza-backend:main-abc1234

# Riavvia
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔧 TROUBLESHOOTING

### "Failed to push image"

**Problema**: GitHub Actions non riesce a pushare

**Soluzione**:
1. Verifica che il workflow abbia permessi: Settings → Actions → General → Workflow permissions → Read and write
2. O usa token personale in Repository secrets

### "Image not found" sul VPS

**Problema**: VPS non trova l'immagine

**Soluzione**:
```bash
# Verifica login
docker login ghcr.io

# Verifica che immagine esista su GitHub
# Vai su: github.com/241luca?tab=packages

# Fai pull manuale
docker pull ghcr.io/241luca/richiesta-assistenza-backend:latest
```

### Build GitHub fallisce

**Problema**: GitHub Actions va in errore

**Soluzione**:
1. Vai su Actions → Workflow fallito
2. Leggi i log
3. Spesso è:
   - ❌ Errore TypeScript → Fixalo e ri-pusha
   - ❌ Test falliti → Fixali
   - ❌ Dockerfile sbagliato → Controlla path

### Immagine vecchia sul VPS

**Problema**: Hai fatto push ma VPS usa ancora vecchia

**Soluzione**:
```bash
# Forza pull nuova immagine
docker-compose -f docker-compose.prod.yml pull

# Ricrea container
docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

---

## 🎓 COMANDI UTILI

### GitHub

```bash
# Push e triggera build
git push origin main

# Vedi stato build
# GitHub → Actions

# Cancella vecchie immagini
# GitHub → Packages → Package settings → Manage versions
```

### VPS

```bash
# Login GHCR
docker login ghcr.io

# Pull ultima versione
docker-compose -f docker-compose.prod.yml pull

# Update e restart
./scripts/update.sh

# Vedi immagini locali
docker images | grep richiesta-assistenza

# Pulisci vecchie
docker image prune -a
```

---

## 📊 MONITORING

### Vedi build su GitHub

```
github.com/241luca/Richiesta-Assistenza/actions
```

### Vedi immagini disponibili

```
github.com/241luca?tab=packages
```

### Vedi size immagini

```bash
# Sul VPS
docker images | grep richiesta-assistenza
```

Dimensioni tipiche:
- Frontend: ~200MB
- Backend: ~500MB
- WhatsApp: ~800MB (Chromium!)

---

## 🚦 WORKFLOW COMPLETO ESEMPIO

```bash
# ========================================
# LUNEDÌ - Nuova feature
# ========================================

# Mac: Sviluppo
cd ~/Desktop/Richiesta-Assistenza
git checkout -b feature/nuova-funzione
# ... sviluppa ...
npm run dev  # test locale

# Mac: Commit e push
git add .
git commit -m "feat: aggiunta nuova funzione"
git push origin feature/nuova-funzione

# GitHub: Pull request
# ... review ...
# ... merge su main ...

# GitHub Actions: Build automatico (10-15 min)
# ✅ Build frontend → ghcr.io
# ✅ Build backend → ghcr.io
# ✅ Build whatsapp → ghcr.io

# ========================================
# MARTEDÌ - Deploy produzione
# ========================================

# VPS: Update
ssh root@TUO-IP
cd /opt/assistenza
./scripts/update.sh
# ⏱️ 1-2 minuti
# ✅ Live!

# Test
curl http://TUO-IP/api/health
# ✅ Funziona!

# ========================================
# MERCOLEDÌ - Oops, bug!
# ========================================

# VPS: Rollback veloce
# Cambia tag in docker-compose.prod.yml
# a versione precedente
docker-compose -f docker-compose.prod.yml up -d
# ✅ Rollback in 30 secondi!

# Mac: Fix bug
# ... fix ...
git commit -m "fix: risolto bug"
git push

# GitHub Actions: Build fix
# VPS: Update di nuovo
./scripts/update.sh
# ✅ Fix live!
```

---

## ✅ CHECKLIST SETUP

Prima volta:
- [ ] GitHub Container Registry configurato
- [ ] Token creato (se privato)
- [ ] Workflow GitHub Actions funziona
- [ ] 3 immagini create su GHCR
- [ ] VPS pulito
- [ ] .env.production configurato
- [ ] Deploy eseguito
- [ ] Tutto funziona!

---

**Documenti correlati**:
- `DEPLOY-DOCKER.md` - Deploy generale
- `QUICK-DEPLOY.md` - Guida rapida
- `FAQ-DEPLOY.md` - Domande comuni

**Ultimo aggiornamento**: Gennaio 2025  
**Versione sistema**: 6.1.0 + GHCR
