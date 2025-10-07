# 🚀 GUIDA RAPIDA DEPLOY

> Per la guida completa vedi: **DEPLOY-DOCKER.md**

## ⚡ IN 5 PASSI

### 1️⃣ CARICA SUL VPS

```bash
# Sul tuo computer
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza
tar --exclude='node_modules' --exclude='backend/node_modules' -czf progetto.tar.gz .
scp progetto.tar.gz root@TUO-IP:/opt/assistenza/

# Sul VPS
ssh root@TUO-IP
mkdir -p /opt/assistenza
cd /opt/assistenza
tar -xzf progetto.tar.gz
```

### 2️⃣ CONFIGURA

```bash
cd /opt/assistenza
cp .env.production .env.production
nano .env.production

# Cambia:
# - DB_PASSWORD
# - REDIS_PASSWORD  
# - JWT_SECRET (3 diversi!)
# - BACKEND_URL e FRONTEND_URL
# - Email Brevo
```

### 3️⃣ PULISCI VPS

```bash
./scripts/clean-vps.sh
# Scrivi: SI
# Se installa Docker: logout e riconnetti
```

### 4️⃣ DEPLOY

```bash
./scripts/deploy.sh
# Aspetta 5-10 minuti
```

### 5️⃣ TEST

```bash
# Apri browser
http://TUO-IP

# Login:
Email: admin@admin.it
Password: Admin123!
```

### 6️⃣ CONFIGURA API KEYS

⚠️ **IMPORTANTE**: Le API si configurano DOPO dal pannello!

```
Admin → Settings → API Keys

1. Google Maps API Key (obbligatorio)
2. OpenAI API Key (per AI)
3. Stripe Keys (per pagamenti)
```

📚 Guida completa: `CONFIGURAZIONE-API-KEYS.md`

## 📱 WHATSAPP

1. Menu → Admin → WhatsApp
2. Genera QR Code
3. Scansiona con telefono
4. ✅ Connesso!

## 🔍 VERIFICA

```bash
# Container attivi
docker-compose ps

# Log
docker-compose logs -f

# Stop tutto
docker-compose down

# Avvia tutto
docker-compose up -d
```

## 🆘 PROBLEMI?

Vedi: **DEPLOY-DOCKER.md** sezione Troubleshooting

## 📊 ARCHITETTURA

```
┌─────────────────────────────────────┐
│  Frontend (porta 80)                │
│  Backend (porta 3200)               │
│  WhatsApp (porta 3201) ← SEPARATO! │
│  Database (porta 5432)              │
│  Redis (porta 6379)                 │
└─────────────────────────────────────┘
```

## ✅ FATTO!

Se tutto funziona, hai:
- ✅ 5 container Docker isolati
- ✅ WhatsApp separato (non satura)
- ✅ Database PostgreSQL
- ✅ Redis per cache
- ✅ Sistema production-ready!
