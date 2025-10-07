# 🔧 TROUBLESHOOTING - SISTEMA BACKUP & CLEANUP

**Versione**: 2.0  
**Data**: 26 Settembre 2025

---

## 📑 INDICE PROBLEMI

1. [Errori di Configurazione](#errori-di-configurazione)
2. [Problemi di Backup](#problemi-di-backup)
3. [Problemi di Cleanup](#problemi-di-cleanup)
4. [Errori Database](#errori-database)
5. [Problemi di Performance](#problemi-di-performance)
6. [Errori di Permessi](#errori-di-permessi)
7. [Problemi di Spazio](#problemi-di-spazio)
8. [Errori API](#errori-api)
9. [Debug Avanzato](#debug-avanzato)

---

## 1. ERRORI DI CONFIGURAZIONE

### ❌ Errore: "Target directory is inside project path"

**Causa**: La directory di destinazione cleanup è configurata dentro il progetto stesso.

**Soluzione**:
```bash
# Verifica configurazione attuale
curl http://localhost:3200/api/cleanup/config -H "Authorization: Bearer $TOKEN"

# Correggi percorso (DEVE essere fuori dal progetto)
curl -X PUT http://localhost:3200/api/cleanup/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetDirectory": "/Users/lucamambelli/Desktop/backup-cleanup"
  }'
```

### ❌ Errore: "Configuration not found"

**Causa**: Configurazione non inizializzata nel database.

**Soluzione**:
```sql
-- Verifica se esiste
SELECT * FROM "CleanupConfig" WHERE name = 'default';

-- Se non esiste, il sistema la crea automaticamente al primo accesso
-- Oppure forza creazione via API
POST /api/cleanup/config/init
```

### ❌ Errore: "Invalid directory format"

**Causa**: Pattern nome directory non valido.

**Pattern validi**:
```javascript
"CLEANUP-{YYYY}-{MM}-{DD}"              // Data
"CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}"    // Data e ora
"CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}" // Completo (default)
"backup-{timestamp}"                     // Unix timestamp
```

---

## 2. PROBLEMI DI BACKUP

### ❌ Errore: "pg_dump: command not found"

**Causa**: PostgreSQL client tools non installati.

**Soluzione**:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# CentOS/RHEL
sudo yum install postgresql

# Verifica installazione
which pg_dump
```

### ❌ Errore: "pg_dump: server version mismatch"

**Causa**: Versione client diversa da server.

**Soluzione**:
```bash
# Verifica versioni
pg_dump --version
psql -c "SELECT version();"

# Installa versione corretta (esempio per PostgreSQL 14)
brew install postgresql@14
export PATH="/usr/local/opt/postgresql@14/bin:$PATH"
```

### ❌ Errore: "Backup file was not created"

**Causa**: Problemi di connessione o permessi database.

**Debug**:
```bash
# Test connessione manuale
pg_dump $DATABASE_URL > test.sql

# Verifica permessi utente
psql $DATABASE_URL -c "\du"

# Verifica variabile ambiente
echo $DATABASE_URL
```

### ❌ Errore: "tar: command not found"

**Causa**: Tar non disponibile per backup codice.

**Soluzione**:
```bash
# Installa tar
# macOS - già presente
# Linux
sudo apt-get install tar  # Debian/Ubuntu
sudo yum install tar      # CentOS/RHEL

# Windows - usa Git Bash o WSL
```

---

## 3. PROBLEMI DI CLEANUP

### ❌ Errore: "No files found matching patterns"

**Causa**: Nessun file corrisponde ai pattern configurati.

**Debug**:
```bash
# Verifica pattern attivi
curl http://localhost:3200/api/cleanup/patterns \
  -H "Authorization: Bearer $TOKEN"

# Test pattern manualmente
find /path/to/project -name "*.backup-*" -o -name "*.tmp"

# Aggiungi pattern se necessario
curl -X POST http://localhost:3200/api/cleanup/patterns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "*.log",
    "description": "Log files",
    "isActive": true
  }'
```

### ❌ Errore: "Cleanup target directory does not exist"

**Causa**: Directory destinazione non esiste.

**Soluzione**:
```bash
# Crea directory
mkdir -p /Users/lucamambelli/Desktop/backup-cleanup

# Verifica permessi
ls -la /Users/lucamambelli/Desktop/backup-cleanup

# Assegna permessi se necessario
chmod 755 /Users/lucamambelli/Desktop/backup-cleanup
```

### ❌ Errore: "Failed to move file: EACCES"

**Causa**: Permessi insufficienti per spostare file.

**Soluzione**:
```bash
# Verifica proprietario file
ls -la file.backup-123.txt

# Verifica permessi directory destinazione
ls -la /backup-cleanup/

# Correggi permessi
sudo chown -R $(whoami) /backup-cleanup/
chmod -R 755 /backup-cleanup/
```

---

## 4. ERRORI DATABASE

### ❌ Errore: "relation does not exist"

**Causa**: Tabelle database non create.

**Soluzione**:
```bash
cd backend
npx prisma generate
npx prisma db push

# Verifica tabelle
npx prisma studio
```

### ❌ Errore: "prisma client version mismatch"

**Causa**: Prisma client non sincronizzato con schema.

**Soluzione**:
```bash
cd backend
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### ❌ Errore: "too many connections"

**Causa**: Pool connessioni esaurito.

**Soluzione**:
```javascript
// In .env
DATABASE_CONNECTION_LIMIT=20

// Oppure in prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 20
}
```

---

## 5. PROBLEMI DI PERFORMANCE

### ❌ Problema: "Cleanup molto lento"

**Causa**: Troppi file o struttura profonda.

**Ottimizzazioni**:
```javascript
// Riduci profondità scansione
{
  "maxDepth": 2,  // Da 3 a 2
  "bufferSize": 52428800,  // Riduci buffer
  "parallel": false  // Disabilita parallelismo
}

// Escludi directory pesanti
POST /api/cleanup/exclude-dirs
{
  "path": "node_modules",
  "recursive": true
}
```

### ❌ Problema: "Backup database timeout"

**Causa**: Database troppo grande.

**Soluzioni**:
```bash
# 1. Aumenta timeout
curl -X PUT /api/cleanup/config \
  -d '{"timeout": 300000}'  # 5 minuti

# 2. Backup manuale con compressione migliore
pg_dump $DATABASE_URL | gzip -9 > backup.sql.gz

# 3. Backup incrementale (solo schema + dati recenti)
pg_dump --schema-only $DATABASE_URL > schema.sql
pg_dump --data-only --table=recent_data $DATABASE_URL > data.sql
```

### ❌ Problema: "High memory usage"

**Causa**: Buffer troppo grandi o memory leak.

**Soluzione**:
```javascript
// Riduci buffer
{
  "bufferSize": 10485760,  // 10MB invece di 100MB
  "streamHighWaterMark": 8192  // 8KB stream buffer
}

// Monitora memoria
pm2 monit

// Restart periodico
pm2 restart backup-service --cron "0 */6 * * *"
```

---

## 6. ERRORI DI PERMESSI

### ❌ Errore: "Permission denied"

**Debug completo**:
```bash
# 1. Verifica utente processo
ps aux | grep node

# 2. Verifica permessi directory
ls -la /backup-cleanup
ls -la /backup-ra

# 3. Verifica SELinux (Linux)
getenforce
# Se Enforcing, prova:
sudo setenforce 0  # Temporaneo

# 4. Verifica ACL (macOS)
ls -le /backup-cleanup
```

### ❌ Errore: "EPERM: operation not permitted"

**Causa**: File di sistema o protetti.

**Soluzione**:
```javascript
// Aggiungi esclusioni
const SKIP_FILES = [
  '.DS_Store',
  'Thumbs.db',
  'System Volume Information',
  '$RECYCLE.BIN'
];
```

---

## 7. PROBLEMI DI SPAZIO

### ❌ Errore: "ENOSPC: no space left on device"

**Analisi spazio**:
```bash
# Verifica spazio disponibile
df -h

# Trova file grandi
find /backup-ra -type f -size +100M -exec ls -lh {} \;

# Pulisci vecchi backup
find /backup-ra -type f -mtime +30 -delete

# Comprimi backup esistenti
for file in /backup-ra/database/*.sql; do
  gzip -9 "$file"
done
```

### ❌ Warning: "Low disk space"

**Automazione pulizia**:
```bash
#!/bin/bash
# auto-cleanup.sh

THRESHOLD=90  # Percentuale
USAGE=$(df /backup-ra | tail -1 | awk '{print $5}' | sed 's/%//')

if [ $USAGE -gt $THRESHOLD ]; then
  # Elimina backup più vecchi di 15 giorni
  find /backup-ra -type f -mtime +15 -delete
  
  # Elimina cartelle cleanup vecchie
  find /backup-cleanup -type d -name "CLEANUP-*" -mtime +7 -exec rm -rf {} \;
  
  # Notifica
  echo "Cleanup eseguito: spazio liberato" | mail -s "Disk Cleanup" admin@example.com
fi
```

---

## 8. ERRORI API

### ❌ Errore: "404 Not Found"

**Verifica route**:
```bash
# Lista tutte le route disponibili
curl http://localhost:3200/api/routes \
  -H "Authorization: Bearer $TOKEN"

# Verifica URL corretto
# ✅ Corretto: /api/backup/cleanup-dirs
# ❌ Sbagliato: /api/backup/cleanup-dir (senza 's')
```

### ❌ Errore: "401 Unauthorized"

**Debug autenticazione**:
```bash
# Verifica token
echo $TOKEN | jwt decode

# Rigenera token
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Verifica ruolo utente
curl http://localhost:3200/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### ❌ Errore: "500 Internal Server Error"

**Debug dettagliato**:
```bash
# 1. Controlla log backend
tail -f backend/logs/error.log

# 2. Abilita debug mode
export DEBUG=backup:*,cleanup:*
export LOG_LEVEL=debug

# 3. Test endpoint diretto
curl -v http://localhost:3200/api/backup/test \
  -H "Authorization: Bearer $TOKEN"

# 4. Verifica stato servizi
curl http://localhost:3200/api/health
```

---

## 9. DEBUG AVANZATO

### 🔍 Logging Dettagliato

```javascript
// In .env
LOG_LEVEL=debug
DEBUG=backup:*,cleanup:*,prisma:*

// Nel codice
import debug from 'debug';
const log = debug('backup:service');
log('Detailed info:', { data });
```

### 🔍 Database Query Log

```sql
-- Abilita log query Prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}

-- PostgreSQL log
ALTER SYSTEM SET log_statement = 'all';
SELECT pg_reload_conf();

-- Verifica log
tail -f /var/log/postgresql/postgresql-14-main.log
```

### 🔍 Network Debug

```bash
# Monitora connessioni
netstat -an | grep 3200
lsof -i :3200

# Test API con curl verbose
curl -v -X POST http://localhost:3200/api/backup/database \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# Trace completo
curl --trace-ascii debug.txt http://localhost:3200/api/backup/stats
```

### 🔍 Process Debug

```bash
# Monitora processo Node
strace -p $(pgrep -f "node.*backup")

# Memory profiling
node --inspect backend/src/server.js
# Apri chrome://inspect

# CPU profiling
node --prof backend/src/server.js
node --prof-process isolate-*.log > profile.txt
```

---

## 🆘 SUPPORTO EMERGENZA

### Reset Completo Sistema

```bash
#!/bin/bash
# emergency-reset.sh

echo "⚠️  RESET COMPLETO SISTEMA BACKUP"

# 1. Stop servizi
pm2 stop all

# 2. Pulisci cache Redis
redis-cli FLUSHDB

# 3. Reset configurazione database
psql $DATABASE_URL << EOF
UPDATE "CleanupConfig" 
SET 
  "targetDirectory" = '/backup-cleanup',
  "maxDepth" = 3,
  "autoCleanup" = false
WHERE name = 'default';
EOF

# 4. Pulisci directory
rm -rf /backup-cleanup/CLEANUP-*
mkdir -p /backup-cleanup

# 5. Restart
pm2 restart all

echo "✅ Reset completato"
```

### Contatti Supporto

- 📧 **Email**: support@lmtecnologie.it
- 📱 **Telefono**: +39 XXX XXXXXXX (Lun-Ven 9-18)
- 🐛 **Bug Report**: GitHub Issues
- 💬 **Chat**: Slack #backup-support

---

## 📚 RISORSE UTILI

### Log Files
- `/backend/logs/error.log` - Errori applicazione
- `/backend/logs/backup.log` - Log backup
- `/backend/logs/cleanup.log` - Log cleanup
- `/var/log/postgresql/*.log` - Log database

### Comandi Utili
```bash
# Stato sistema
npm run status

# Test completo
npm run test:backup

# Pulizia emergenza
npm run emergency:cleanup

# Report diagnostico
npm run diagnostic:report
```

---

**Versione**: 2.0  
**Ultimo aggiornamento**: 26 Settembre 2025  
**Autore**: Team Sviluppo LM Tecnologie
