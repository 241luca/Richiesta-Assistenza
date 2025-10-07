# 🚀 GUIDA DEPLOY DOCKER SU VPS

**Data**: Gennaio 2025  
**Sistema**: Richiesta Assistenza v6.1  
**Architettura**: 5 Container Docker separati

---

## 📋 INDICE

1. [Prerequisiti](#prerequisiti)
2. [Preparazione VPS](#preparazione-vps)
3. [Configurazione](#configurazione)
4. [Deploy](#deploy)
5. [Verifica](#verifica)
6. [WhatsApp Setup](#whatsapp-setup)
7. [SSL Certificate](#ssl-certificate)
8. [Troubleshooting](#troubleshooting)
9. [Manutenzione](#manutenzione)

---

## 🎯 PREREQUISITI

### Sul tuo Computer

- **Git** installato
- **SSH** configurato per il VPS
- Accesso al progetto locale

### Sul VPS

- **Sistema operativo**: Ubuntu 20.04+ o Debian 11+
- **RAM**: Minimo 2GB (consigliato 4GB)
- **Spazio disco**: Minimo 20GB
- **CPU**: Minimo 2 core
- **Accesso root** o sudo

---

## 🖥️ PREPARAZIONE VPS

### 1. Connettiti al VPS

```bash
ssh root@TUO-IP-VPS
# oppure
ssh tuo-utente@TUO-IP-VPS
```

### 2. Aggiorna il sistema

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 3. Pulisci il VPS (se necessario)

Se sul VPS c'è già qualcosa, **fai prima un backup** e poi:

```bash
# Scarica lo script di pulizia
# (lo caricheremo dopo)
```

---

## 📦 CARICAMENTO PROGETTO SUL VPS

### Metodo 1: Git (Consigliato)

Sul VPS:

```bash
# Installa Git
sudo apt-get install -y git

# Crea directory
mkdir -p /opt/assistenza
cd /opt/assistenza

# Clone repository
git clone https://github.com/241luca/Richiesta-Assistenza.git .

# Oppure se privato
git clone https://<token>@github.com/241luca/Richiesta-Assistenza.git .
```

### Metodo 2: SCP (Da computer locale)

Sul tuo computer:

```bash
# Comprimi il progetto (escludi node_modules!)
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza
tar -czf progetto.tar.gz \
  --exclude='node_modules' \
  --exclude='backend/node_modules' \
  --exclude='dist' \
  --exclude='backend/dist' \
  .

# Carica sul VPS
scp progetto.tar.gz root@TUO-IP:/opt/assistenza/

# Sul VPS, decomprimi
ssh root@TUO-IP
cd /opt/assistenza
tar -xzf progetto.tar.gz
rm progetto.tar.gz
```

---

## ⚙️ CONFIGURAZIONE

### 1. Copia e configura .env.production

Sul VPS:

```bash
cd /opt/assistenza
cp .env.production.example .env.production
nano .env.production
```

### 2. Configura TUTTI i valori

```bash
# ===== DATABASE =====
DB_PASSWORD=PASSWORD_SICURA_QUI_123!@#

# ===== REDIS =====
REDIS_PASSWORD=REDIS_PASSWORD_SICURA_456!@#

# ===== JWT (genera con: openssl rand -base64 32) =====
JWT_SECRET=stringa_random_32_caratteri_qui
JWT_REFRESH_SECRET=altra_stringa_random_32_caratteri
SESSION_SECRET=terza_stringa_random_32_caratteri

# ===== URLs (Sostituisci con il tuo dominio!) =====
BACKEND_URL=https://api.tuodominio.it
FRONTEND_URL=https://tuodominio.it

# ===== EMAIL (Brevo) =====
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tua-email@tuodominio.it
SMTP_PASS=la_tua_chiave_api_brevo
EMAIL_FROM=noreply@tuodominio.it
```

**💡 Genera password sicure:**

```bash
# Password database
openssl rand -base64 32

# JWT Secret
openssl rand -base64 32

# Altre password
openssl rand -base64 32
```

### 3. Salva e esci

```
CTRL+X  → Y  → INVIO
```

---

## 🚀 DEPLOY

### 1. Esegui script di pulizia (prima volta)

```bash
cd /opt/assistenza
./scripts/clean-vps.sh
```

Lo script chiederà conferma. Scrivi `SI` per procedere.

⚠️ **Questo installerà Docker e Docker Compose se non presenti**

Se Docker è stato appena installato:

```bash
logout
# Riconnettiti
ssh root@TUO-IP
```

### 2. Esegui deploy

```bash
cd /opt/assistenza
./scripts/deploy.sh
```

Lo script:
- ✅ Verifica prerequisiti
- ✅ Build immagini Docker
- ✅ Avvia container
- ✅ Esegue migrazioni database
- ✅ (Opzionale) Inserisce dati di esempio

**Durata**: 5-10 minuti

---

## ✅ VERIFICA

### 1. Controlla container attivi

```bash
docker-compose ps
```

Dovresti vedere 5 container:
- ✅ assistenza-frontend (porta 80)
- ✅ assistenza-backend (porta 3200)
- ✅ assistenza-whatsapp (porta 3201)
- ✅ assistenza-database (porta 5432)
- ✅ assistenza-redis (porta 6379)

### 2. Verifica log

```bash
# Log di tutti i servizi
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Solo WhatsApp
docker-compose logs -f whatsapp
```

### 3. Test endpoint

```bash
# Backend health
curl http://localhost:3200/api/health

# WhatsApp health
curl http://localhost:3201/health

# Frontend
curl http://localhost
```

### 4. Test dal browser

Apri: `http://TUO-IP-VPS`

Dovresti vedere la pagina di login! 🎉

---

## 🔑 CONFIGURAZIONE API KEYS

> ⚠️ **IMPORTANTE**: Le API Keys si configurano DOPO il deploy dal pannello Admin!

### Perché non in .env?

Le API Keys (Google Maps, OpenAI, Stripe, ecc.) sono salvate **nel database** per:
- ✅ Sicurezza (criptate)
- ✅ Flessibilità (cambi senza restart)
- ✅ Audit (log modifiche)

### Procedura

1. **Login Admin**: http://TUO-IP/login
2. **Vai su**: Admin → Settings → API Keys
3. **Configura**:
   - Google Maps API Key (**Obbligatorio**)
   - OpenAI API Key (per AI)
   - Stripe Keys (per pagamenti)

📚 **Guida dettagliata**: Vedi `CONFIGURAZIONE-API-KEYS.md`

---

## 📱 WHATSAPP SETUP

### 1. Accedi all'admin

```
http://TUO-IP/login
Email: admin@admin.it
Password: Admin123!
```

### 2. Vai alla sezione WhatsApp

```
Menu → Admin → WhatsApp
```

### 3. Genera QR Code

- Clicca "Genera QR Code"
- Attendi che appaia il QR
- Scansiona con WhatsApp sul telefono

### 4. Verifica connessione

Dopo la scansione, dovresti vedere:
- ✅ Stato: **Connesso**
- ✅ Numero telefono collegato
- ✅ Pulsanti per inviare messaggi

### 5. Sessione persistente

La sessione WhatsApp è salvata in un **volume Docker**, quindi:
- ✅ Rimane dopo riavvii
- ✅ Non serve scansionare di nuovo

---

## 🔒 SSL CERTIFICATE (HTTPS)

### Prerequisiti

- **Dominio** configurato che punta al VPS
- **Porte 80 e 443** aperte nel firewall

### 1. Installa Certbot

```bash
sudo apt-get install -y certbot
```

### 2. Ferma Nginx temporaneamente

```bash
docker-compose stop frontend
```

### 3. Genera certificato

```bash
sudo certbot certonly --standalone -d tuodominio.it -d www.tuodominio.it
```

### 4. Copia certificati

```bash
sudo mkdir -p /opt/assistenza/nginx/certs
sudo cp /etc/letsencrypt/live/tuodominio.it/fullchain.pem /opt/assistenza/nginx/certs/
sudo cp /etc/letsencrypt/live/tuodominio.it/privkey.pem /opt/assistenza/nginx/certs/
```

### 5. Abilita HTTPS in nginx.conf

```bash
nano /opt/assistenza/nginx.conf
```

Decommenta la sezione HTTPS (righe con `# server { ... }`)

### 6. Riavvia frontend

```bash
docker-compose up -d frontend
```

### 7. Rinnovo automatico

```bash
# Aggiungi a crontab
sudo crontab -e

# Aggiungi questa riga
0 0 * * * certbot renew --quiet && docker-compose restart frontend
```

---

## 🔧 TROUBLESHOOTING

### Container non si avvia

```bash
# Vedi log errori
docker-compose logs backend

# Riavvia specifico container
docker-compose restart backend
```

### Database non si connette

```bash
# Verifica password in .env.production
cat .env.production | grep DB_PASSWORD

# Ricrea database
docker-compose down
docker volume rm assistenza_postgres_data
docker-compose up -d
```

### WhatsApp non si connette

```bash
# Vedi log WhatsApp
docker-compose logs -f whatsapp

# Riavvia container WhatsApp
docker-compose restart whatsapp

# Reset sessione
docker volume rm assistenza_whatsapp_tokens
docker-compose restart whatsapp
```

### Frontend non carica

```bash
# Controlla Nginx
docker-compose logs frontend

# Verifica che .env.production abbia URL corretti
cat .env.production | grep URL
```

### Spazio disco pieno

```bash
# Pulisci vecchie immagini
docker system prune -a

# Vedi spazio usato
docker system df
```

### Memoria RAM piena

```bash
# Limita RAM WhatsApp (già impostato a 512MB)
# Limita RAM backend se necessario

# In docker-compose.yml sotto backend:
deploy:
  resources:
    limits:
      memory: 768M
```

---

## 🔄 MANUTENZIONE

### Backup

```bash
# Backup database
docker-compose exec database pg_dump -U assistenza_user assistenza_db > backup_db_$(date +%Y%m%d).sql

# Backup volumi
sudo tar -czf backup_volumes_$(date +%Y%m%d).tar.gz -C /var/lib/docker/volumes .

# Backup automatico (crontab)
0 2 * * * cd /opt/assistenza && docker-compose exec -T database pg_dump -U assistenza_user assistenza_db > /backups/db_$(date +\%Y\%m\%d).sql
```

### Update

```bash
cd /opt/assistenza

# Pull nuove modifiche
git pull

# Rebuild e restart
docker-compose build --no-cache
docker-compose up -d

# Migrazioni se necessario
docker-compose exec backend npx prisma migrate deploy
```

### Logs

```bash
# Tutti i log
docker-compose logs -f

# Ultimi 100 righe
docker-compose logs --tail=100

# Solo errori
docker-compose logs | grep ERROR
```

### Monitoring

```bash
# Uso risorse
docker stats

# Container attivi
docker-compose ps

# Spazio disco
df -h
```

### Riavvio completo

```bash
cd /opt/assistenza

# Stop tutto
docker-compose down

# Avvio
docker-compose up -d

# Verifica
docker-compose ps
```

---

## 📊 RISORSE SISTEMA

### Uso tipico

| Container | RAM | CPU | Disco |
|-----------|-----|-----|-------|
| Frontend | 100MB | 5% | 200MB |
| Backend | 300MB | 15% | 500MB |
| **WhatsApp** | **512MB** | **20%** | **300MB** |
| Database | 200MB | 10% | 2GB+ |
| Redis | 50MB | 5% | 100MB |
| **TOTALE** | **~1.2GB** | **55%** | **~3GB** |

### Limiti impostati

- WhatsApp: Max 512MB RAM, 1 CPU
- Altri: Nessun limite hard

---

## 🆘 CONTATTI

- **Sviluppatore**: Luca Mambelli
- **Email**: lucamambelli@lmtecnologie.it
- **GitHub**: [@241luca](https://github.com/241luca)

---

## ✅ CHECKLIST FINALE

Prima di considerare il deploy completo:

- [ ] Tutti i container sono UP
- [ ] Backend risponde su `/api/health`
- [ ] Frontend carica correttamente
- [ ] **API Keys configurate** (Google Maps, ecc.) 🔑
- [ ] WhatsApp connesso e funzionante
- [ ] Database accessibile
- [ ] Redis funziona
- [ ] Email di test inviata con successo
- [ ] SSL certificato installato (se dominio)
- [ ] DNS configurato correttamente
- [ ] Firewall configurato (80, 443)
- [ ] Backup automatico configurato
- [ ] Monitoring attivo

---

**Ultimo aggiornamento**: Gennaio 2025  
**Versione**: 6.1.0  
**Stato**: Production Ready ✅
