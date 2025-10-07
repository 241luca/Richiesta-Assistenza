# 🚀 GUIDA COMPLETA SETUP VPS HETZNER
# Per Richiesta Assistenza

## 1️⃣ CREAZIONE VPS SU HETZNER

### Dopo login su Hetzner Cloud:

1. Clicca "New Project" → Nome: "Richiesta Assistenza"
2. Clicca "Add Server"
3. **Location**: Nuremberg o Helsinki (più vicini all'Italia)
4. **Image**: Ubuntu 22.04
5. **Type**: CX11 (€3.79/mese) - VA BENISSIMO per iniziare!
   - 2GB RAM
   - 1 vCPU  
   - 20GB SSD
6. **Networking**: IPv4 (incluso)
7. **SSH Keys**: 
   - Se hai una chiave SSH, aggiungila
   - Altrimenti usa password (te la manda via email)
8. **Name**: "richiesta-assistenza-vps"
9. Clicca "Create & Buy now"

### RICEVERAI:
- IP: tipo 95.217.XXX.XXX
- Password root (via email)

---

## 2️⃣ PRIMO ACCESSO AL VPS

### Dal tuo Mac, apri Terminal:

```bash
# Connettiti al VPS
ssh root@TUO_IP_VPS

# Prima volta ti chiede:
# Are you sure you want to continue? → yes
# Password: → quella ricevuta via email

# SEI DENTRO IL TUO VPS! 🎉
```

---

## 3️⃣ SETUP INIZIALE SICUREZZA

```bash
# Cambia password root
passwd
# Inserisci nuova password sicura

# Aggiorna sistema
apt update && apt upgrade -y

# Installa firewall
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 3200
ufw allow 5193
ufw --force enable
```

---

## 4️⃣ INSTALLA TUTTO IL NECESSARIO

### Usa questo comando MEGA che installa TUTTO:

```bash
# COPIA E INCOLLA TUTTO QUESTO BLOCCO:

# Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Redis
apt install -y redis-server

# Nginx
apt install -y nginx

# Git e tools
apt install -y git build-essential

# PM2 (mantiene app attiva)
npm install -g pm2

# Docker (per Evolution API dopo)
curl -fsSL https://get.docker.com | bash

echo "✅ Software installato!"
```

---

## 5️⃣ SCARICA LA TUA APP

```bash
# Vai nella directory web
cd /var/www

# Clona il tuo progetto
git clone https://github.com/241luca/Richiesta-Assistenza.git

# Entra nella directory
cd Richiesta-Assistenza

# Installa dipendenze frontend
npm install

# Installa dipendenze backend
cd backend
npm install

echo "✅ App scaricata!"
```

---

## 6️⃣ CONFIGURA DATABASE

```bash
# Crea database
sudo -u postgres psql << EOF
CREATE DATABASE richiesta_assistenza;
CREATE USER app_user WITH PASSWORD 'cambia_questa_password_123';
GRANT ALL PRIVILEGES ON DATABASE richiesta_assistenza TO app_user;
EOF

echo "✅ Database creato!"
```

---

## 7️⃣ CONFIGURA ENVIRONMENT

```bash
# Crea file .env nel backend
cd /var/www/Richiesta-Assistenza/backend

cat > .env << 'EOF'
# Database
DATABASE_URL="postgresql://app_user:cambia_questa_password_123@localhost:5432/richiesta_assistenza"

# Security
JWT_SECRET="genera-una-stringa-casuale-lunga-qui-123456789"
SESSION_SECRET="altra-stringa-casuale-lunga-qui-987654321"

# Server
PORT=3200
NODE_ENV=production

# Frontend
FRONTEND_URL="http://TUO_IP_VPS:5193"

# Redis
REDIS_URL="redis://localhost:6379"

# Email (configurare dopo)
EMAIL_FROM="noreply@tuodominio.it"

# WhatsApp (configurare dopo)
WHATSAPP_WEBHOOK_URL="http://TUO_IP_VPS:3200/api/whatsapp/webhook"
EOF

# IMPORTANTE: Sostituisci TUO_IP_VPS con il tuo IP reale!
nano .env
# Modifica DATABASE_URL, JWT_SECRET e IP
```

---

## 8️⃣ INIZIALIZZA DATABASE

```bash
cd /var/www/Richiesta-Assistenza/backend

# Genera Prisma Client
npx prisma generate

# Crea tabelle
npx prisma db push

# (Opzionale) Seed con dati di test
npx prisma db seed

echo "✅ Database inizializzato!"
```

---

## 9️⃣ AVVIA L'APPLICAZIONE

```bash
cd /var/www/Richiesta-Assistenza

# Avvia backend
cd backend
pm2 start npm --name backend -- run dev

# Avvia frontend
cd ..
pm2 start npm --name frontend -- run dev

# Salva configurazione PM2
pm2 save
pm2 startup

echo "✅ App avviata!"
```

---

## 🔟 CONFIGURA NGINX (Web Server)

```bash
# Crea configurazione
cat > /etc/nginx/sites-available/richiesta-assistenza << 'EOF'
server {
    listen 80;
    server_name TUO_IP_VPS;

    # Frontend
    location / {
        proxy_pass http://localhost:5193;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

# Attiva configurazione
ln -s /etc/nginx/sites-available/richiesta-assistenza /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx

echo "✅ Nginx configurato!"
```

---

## ✅ FATTO! LA TUA APP È ONLINE!

### Vai su:
- **Frontend**: http://TUO_IP_VPS
- **Backend API**: http://TUO_IP_VPS/api
- **Health Check**: http://TUO_IP_VPS/api/health

---

## 🔧 COMANDI UTILI

```bash
# Vedere log
pm2 logs

# Riavviare app
pm2 restart all

# Stato app
pm2 status

# Monitoraggio
pm2 monit
```

---

## 📱 CONFIGURA WHATSAPP (dopo)

1. Evolution API o SendApp punteranno a:
   http://TUO_IP_VPS:3200/api/whatsapp/webhook
   
2. NIENTE PIÙ NGROK! 🎉

---

## 🆘 SE SERVE AIUTO

Fammi sapere a che punto sei e ti aiuto!
