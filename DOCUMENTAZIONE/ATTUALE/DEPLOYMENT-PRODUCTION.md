# 🚀 DEPLOYMENT IN PRODUZIONE - RICHIESTA ASSISTENZA

**Ultimo aggiornamento**: 17 Settembre 2025  
**URL Produzione**: https://richiestaassistenza.it  
**Server VPS**: Hetzner (37.27.89.35)

---

## 📋 INFORMAZIONI SERVER

### Server VPS Hetzner
- **IP**: 37.27.89.35
- **Sistema**: Ubuntu 24.04 LTS
- **RAM**: 4GB
- **Storage**: 80GB
- **Location**: Helsinki, Finland

### Accesso SSH
```bash
ssh root@37.27.89.35
# oppure
ssh root@richiestaassistenza.it
```

---

## 🌐 CONFIGURAZIONE DOMINIO

### DNS (SiteGround)
- **Record A**: richiestaassistenza.it → 37.27.89.35
- **TTL**: 1 ora
- **Provider DNS**: SiteGround
- **Registrar**: SiteGround

### SSL/HTTPS
- **Provider**: Let's Encrypt (gratuito)
- **Validità**: Fino al 16/12/2025
- **Rinnovo**: Automatico via Certbot
- **Certificati**: `/etc/letsencrypt/live/richiestaassistenza.it/`

---

## 🏗️ ARCHITETTURA PRODUZIONE

### Stack Software
- **Web Server**: NGINX 1.24.0 (reverse proxy)
- **Process Manager**: PM2 5.x
- **Database**: PostgreSQL 14
- **Cache**: Redis 7
- **Node.js**: v18 LTS
- **SSL**: Certbot + Let's Encrypt

### Porte e Servizi
| Servizio | Porta Interna | Accesso Esterno |
|----------|---------------|-----------------|
| NGINX | 80, 443 | Pubblico (HTTP/HTTPS) |
| Frontend | 5193 | Solo via NGINX |
| Backend | 3200 | Solo via NGINX |
| PostgreSQL | 5432 | Solo localhost |
| Redis | 6379 | Solo localhost |

### Directory Struttura
```
/var/www/Richiesta-Assistenza/     # Applicazione principale
├── src/                            # Frontend React
├── backend/                        # Backend Express
├── node_modules/                   # Dipendenze
└── vite.config.ts                  # Config Vite

/root/backup-ra/                    # Backup (FUORI dal progetto)
├── database/                       # Backup database
├── code/                           # Backup codice
└── uploads/                        # Backup file caricati

/etc/nginx/sites-available/         # Configurazioni NGINX
└── richiesta-assistenza            # Config del sito

/etc/letsencrypt/live/              # Certificati SSL
└── richiestaassistenza.it/        # Certificati dominio
```

---

## 🔧 CONFIGURAZIONI

### NGINX Configuration
```nginx
# /etc/nginx/sites-available/richiesta-assistenza

server {
    listen 80;
    server_name richiestaassistenza.it;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name richiestaassistenza.it;

    ssl_certificate /etc/letsencrypt/live/richiestaassistenza.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/richiestaassistenza.it/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:5193;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### PM2 Ecosystem
```javascript
// ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'frontend',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/Richiesta-Assistenza',
      env: {
        NODE_ENV: 'production',
        PORT: 5193
      }
    },
    {
      name: 'backend',
      script: 'npm',
      args: 'run dev',
      cwd: '/var/www/Richiesta-Assistenza/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3200,
        DATABASE_URL: 'postgresql://app_user:password@localhost:5432/richiesta_assistenza'
      }
    }
  ]
}
```

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5193,
    host: true,
    allowedHosts: ['richiestaassistenza.it', 'localhost', '37.27.89.35']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Database Configuration
- **Database**: richiesta_assistenza
- **User**: app_user
- **Connection String**: Configurata in backend/.env
- **Backup**: Automatici in /root/backup-ra/database/

---

## 📦 DEPLOYMENT PROCEDURE

### 1. Aggiornamento Codice
```bash
# Sul VPS
cd /var/www/Richiesta-Assistenza

# Pull ultimi aggiornamenti
git pull origin main

# Installa dipendenze se necessario
npm install
cd backend && npm install && cd ..

# Riavvia servizi
pm2 restart all
```

### 2. Backup Database
```bash
# Backup manuale
cd /var/www/Richiesta-Assistenza/backend
npm run backup:db

# I backup vanno in /root/backup-ra/database/
ls -la /root/backup-ra/database/
```

### 3. Ripristino Database
```bash
# Decomprimi backup
cd /root/backup-ra/database
gunzip backup-file.sql.gz

# Ripristina
sudo -u postgres psql richiesta_assistenza < backup-file.sql

# Dai permessi
sudo -u postgres psql -c "GRANT ALL ON ALL TABLES IN SCHEMA public TO app_user;"
sudo -u postgres psql -c "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app_user;"
```

---

## 🛠️ COMANDI UTILI

### Gestione Servizi
```bash
# PM2 - Process Manager
pm2 status              # Stato servizi
pm2 restart all         # Riavvia tutto
pm2 logs               # Vedi log in tempo reale
pm2 logs frontend      # Log solo frontend
pm2 logs backend       # Log solo backend
pm2 save              # Salva configurazione
pm2 startup           # Configura avvio automatico

# NGINX
systemctl status nginx   # Stato NGINX
systemctl restart nginx  # Riavvia NGINX
nginx -t                # Test configurazione
tail -f /var/log/nginx/error.log  # Log errori

# Database
sudo -u postgres psql   # Accedi a PostgreSQL
\l                     # Lista database
\c richiesta_assistenza # Connetti al database
\dt                    # Lista tabelle

# Redis
redis-cli ping         # Test Redis
redis-cli              # Console Redis
```

### Monitoraggio
```bash
# Sistema
htop                   # Monitor risorse
df -h                  # Spazio disco
free -h                # Memoria RAM
netstat -tlnp          # Porte in ascolto

# Log
tail -f /var/www/Richiesta-Assistenza/logs/error.log
tail -f /var/log/nginx/access.log
journalctl -u nginx -f
```

### SSL/Certificati
```bash
# Verifica certificato
certbot certificates

# Rinnova manualmente (automatico normalmente)
certbot renew

# Test rinnovo
certbot renew --dry-run
```

---

## 🔒 SICUREZZA

### Firewall (UFW)
```bash
# Regole attive
ufw status

# Porte aperte:
- 22 (SSH)
- 80 (HTTP)
- 443 (HTTPS)
```

### Backup Automatici
- **Frequenza**: Configurabile da admin panel
- **Destinazione**: /root/backup-ra/
- **Retention**: 30 giorni default
- **Tipi**: Database, Code, Uploads

### Monitoraggio Sicurezza
- **Audit Log**: Tutte le azioni tracciate
- **Rate Limiting**: Configurato su API
- **CORS**: Configurato per dominio
- **Helmet.js**: Headers sicurezza attivi

---

## 🚨 TROUBLESHOOTING

### Frontend non raggiungibile
```bash
pm2 restart frontend
pm2 logs frontend --lines 50
```

### Backend API non risponde
```bash
pm2 restart backend
pm2 logs backend --lines 50
# Verifica database
sudo -u postgres psql -c "SELECT 1;"
```

### Errori NGINX
```bash
nginx -t
systemctl restart nginx
tail -f /var/log/nginx/error.log
```

### Database connection issues
```bash
# Verifica PostgreSQL attivo
systemctl status postgresql
# Restart se necessario
systemctl restart postgresql
```

### Certificato SSL scaduto
```bash
certbot renew --force-renewal
systemctl restart nginx
```

---

## 📞 CONTATTI & SUPPORTO

### Sviluppatore
- **Nome**: Luca Mambelli
- **Email**: lucamambelli@lmtecnologie.it
- **GitHub**: @241luca

### Accessi Principali
- **Produzione**: https://richiestaassistenza.it
- **Admin Panel**: https://richiestaassistenza.it/admin
- **API Health**: https://richiestaassistenza.it/api/health

### Repository
- **GitHub**: https://github.com/241luca/Richiesta-Assistenza
- **Branch principale**: main

---

## 📅 MANUTENZIONE PIANIFICATA

### Giornaliera
- Backup automatico database (2:00 AM)

### Settimanale
- Verifica spazio disco
- Check log errori
- Analisi performance

### Mensile
- Aggiornamenti sicurezza sistema
- Review backup retention
- Analisi statistiche utilizzo

### Trimestrale
- Test disaster recovery
- Review configurazioni sicurezza
- Aggiornamento dipendenze

---

**Ultimo deployment**: 17 Settembre 2025  
**Versione**: 4.1.0  
**Stato**: ✅ PRODUZIONE ATTIVA
