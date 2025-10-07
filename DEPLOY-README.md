# 🚀 DEPLOY AUTOMATIZZATO - README

## 🎯 PANORAMICA

Sistema di deploy completamente automatizzato con:
- ✅ **GitHub Container Registry** - Build automatico immagini
- ✅ **5 Container Docker** separati e ottimizzati
- ✅ **WhatsApp isolato** - Non satura il sistema
- ✅ **Deploy in 1-2 minuti** - Solo pull, no build
- ✅ **Rollback facile** - Versioning automatico

---

## 📋 QUICK START

### 1️⃣ PRIMO DEPLOY (Una volta sola)

```bash
# 1. Push su GitHub (triggera build automatico)
git push origin main

# 2. Aspetta build GitHub Actions (10-15 min)
# Vai su: github.com/241luca/Richiesta-Assistenza/actions

# 3. Sul VPS Hetzner
ssh root@TUO-IP
cd /opt/assistenza
./scripts/clean-vps.sh  # Pulisci VPS
./scripts/deploy-ghcr.sh  # Deploy (1-2 min)
```

### 2️⃣ UPDATE QUOTIDIANI

```bash
# Mac: Sviluppa e push
git push origin main

# GitHub Actions: Build automatico (10-15 min)

# VPS: Update veloce
ssh root@TUO-IP
cd /opt/assistenza
./scripts/update.sh  # Solo 30 secondi!
```

---

## 📚 DOCUMENTAZIONE

| Documento | Descrizione | Quando usarlo |
|-----------|-------------|---------------|
| **DEPLOY-GHCR.md** | 🏆 Guida completa GHCR | Setup iniziale |
| **QUICK-DEPLOY.md** | ⚡ Guida rapida 5 passi | Deploy veloce |
| **DEPLOY-DOCKER.md** | 🐳 Guida Docker generale | Approfondimento |
| **CONFIGURAZIONE-API-KEYS.md** | 🔑 Setup API Keys | Dopo deploy |
| **FAQ-DEPLOY.md** | ❓ Domande frequenti | Troubleshooting |

---

## 🏗️ ARCHITETTURA

```
GitHub Actions
  ├─ Build Frontend → ghcr.io/241luca/richiesta-assistenza-frontend
  ├─ Build Backend → ghcr.io/241luca/richiesta-assistenza-backend  
  └─ Build WhatsApp → ghcr.io/241luca/richiesta-assistenza-whatsapp

VPS Hetzner
  ├─ Container Frontend (80/443)
  ├─ Container Backend (3200)
  ├─ Container WhatsApp (3201) ← SEPARATO!
  ├─ Container Database (5432)
  └─ Container Redis (6379)
```

---

## 🔄 WORKFLOW COMPLETO

### Sviluppo locale

```bash
# Frontend
npm run dev  # http://localhost:5193

# Backend
cd backend
npm run dev  # http://localhost:3200
```

### Push su GitHub

```bash
git add .
git commit -m "feat: nuova funzionalità"
git push origin main
```

### GitHub Actions (Automatico!)

- ✅ Build 3 immagini Docker
- ✅ Push su GitHub Container Registry
- ✅ Tag automatici (latest, main, sha)
- ⏱️ Durata: 10-15 minuti

### Deploy VPS

```bash
ssh root@TUO-IP
cd /opt/assistenza
./scripts/update.sh
```

⏱️ **Durata**: 30 secondi!

---

## 🎛️ SCRIPT DISPONIBILI

| Script | Descrizione | Quando usarlo |
|--------|-------------|---------------|
| `clean-vps.sh` | Pulisce VPS completamente | Prima installazione |
| `deploy-ghcr.sh` | Deploy da GHCR | Primo deploy |
| `update.sh` | Update veloce | Aggiornamenti |
| `deploy.sh` | Deploy con build locale | Solo per dev |

---

## 🔐 CONFIGURAZIONE

### File .env.production (VPS)

```bash
# Database
DB_PASSWORD=xxx

# Redis  
REDIS_PASSWORD=xxx

# JWT (3 diversi!)
JWT_SECRET=xxx
JWT_REFRESH_SECRET=xxx
SESSION_SECRET=xxx

# URLs
BACKEND_URL=https://api.tuodominio.it
FRONTEND_URL=https://tuodominio.it

# Email SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=xxx
SMTP_PASS=xxx
EMAIL_FROM=noreply@tuodominio.it
```

### API Keys (Pannello Admin)

**NON in .env!** Si configurano dopo dal pannello:

```
Admin → Settings → API Keys
  ├─ Google Maps API Key (obbligatorio)
  ├─ OpenAI API Key (AI features)
  └─ Stripe Keys (pagamenti)
```

---

## 🏷️ GESTIONE VERSIONI

### Tag automatici

```bash
# Ultima versione
:latest

# Commit specifico
:main-abc1234

# Branch
:main
```

### Rollback

```bash
# Modifica docker-compose.prod.yml
image: ghcr.io/241luca/richiesta-assistenza-backend:main-abc1234

# Riavvia
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🆘 TROUBLESHOOTING

### GitHub Actions fallisce

```bash
# Vai su GitHub Actions e leggi log
github.com/241luca/Richiesta-Assistenza/actions

# Spesso:
# - Errore TypeScript → Fix e ri-push
# - Test falliti → Fix test
# - Dockerfile error → Controlla path
```

### VPS non scarica immagine

```bash
# Login GHCR (se immagini private)
docker login ghcr.io

# Pull manuale
docker pull ghcr.io/241luca/richiesta-assistenza-backend:latest
```

### Container non si avvia

```bash
# Vedi log
docker-compose -f docker-compose.prod.yml logs backend

# Riavvia
docker-compose -f docker-compose.prod.yml restart backend
```

---

## 📊 METRICHE

### Build GitHub

- ⏱️ Durata: 10-15 minuti
- 💾 Cache: Sì (build successivi più veloci)
- 📦 Size immagini:
  - Frontend: ~200MB
  - Backend: ~500MB
  - WhatsApp: ~800MB

### Deploy VPS

- ⏱️ Deploy completo: 1-2 minuti
- ⏱️ Update: 30 secondi
- 💻 CPU deploy: ~5%
- 💾 RAM deploy: ~200MB

### Runtime VPS

- 💾 RAM totale: ~1.2GB
- 💻 CPU medio: ~55%
- 💿 Disco: ~3GB

---

## ✅ CHECKLIST

### Primo setup
- [ ] Push su GitHub
- [ ] Build GitHub Actions OK
- [ ] 3 immagini su GHCR
- [ ] VPS pulito
- [ ] .env.production configurato
- [ ] Deploy eseguito
- [ ] API Keys configurate
- [ ] WhatsApp connesso
- [ ] SSL installato (se dominio)

### Update normale
- [ ] Push su GitHub
- [ ] Build GitHub Actions OK
- [ ] VPS: `./scripts/update.sh`
- [ ] Test sito funziona

---

## 🔗 LINK UTILI

- **GitHub**: https://github.com/241luca/Richiesta-Assistenza
- **Actions**: https://github.com/241luca/Richiesta-Assistenza/actions
- **Packages**: https://github.com/241luca?tab=packages
- **VPS**: http://TUO-IP
- **Backend API**: http://TUO-IP:3200/api/health

---

## 📞 SUPPORTO

**Sviluppatore**: Luca Mambelli  
**Email**: lucamambelli@lmtecnologie.it  
**GitHub**: [@241luca](https://github.com/241luca)

---

**Versione**: 6.1.0 + GHCR  
**Ultimo aggiornamento**: Gennaio 2025  
**Stato**: Production Ready ✅
