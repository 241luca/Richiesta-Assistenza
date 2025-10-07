# ⚙️ GUIDA ALLA CONFIGURAZIONE - SISTEMA BACKUP & CLEANUP

**Versione**: 2.0  
**Data**: 26 Settembre 2025

---

## 📑 INDICE

1. [Configurazione Base](#configurazione-base)
2. [Configurazione Avanzata](#configurazione-avanzata)
3. [Pattern e Esclusioni](#pattern-e-esclusioni)
4. [Schedulazione](#schedulazione)
5. [Notifiche](#notifiche)
6. [Performance Tuning](#performance-tuning)
7. [Esempi Pratici](#esempi-pratici)

---

## 1. CONFIGURAZIONE BASE

### 1.1 Prima Configurazione

Dopo l'installazione, accedi a `/admin/backup` → Tab "Configurazione" e imposta:

#### Percorsi Fondamentali

| Campo | Descrizione | Esempio |
|-------|-------------|---------|
| **Percorso Base Completo** | Il progetto da pulire | `/Users/lucamambelli/Desktop/Richiesta-Assistenza` |
| **Percorso Destinazione Cleanup** | Dove salvare i file puliti | `/Users/lucamambelli/Desktop/backup-cleanup` |

⚠️ **IMPORTANTE**: La destinazione DEVE essere FUORI dal progetto!

### 1.2 Variabili d'Ambiente (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/richiesta_assistenza

# Backup Paths
BACKUP_BASE_DIR=/Users/lucamambelli/Desktop/backup-ra
CLEANUP_TARGET_DIR=/Users/lucamambelli/Desktop/backup-cleanup

# Sistema
NODE_ENV=production
PORT=3200
LOG_LEVEL=info

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=24h

# Redis (opzionale)
REDIS_URL=redis://localhost:6379
```

### 1.3 Configurazione Database

Il sistema crea automaticamente le tabelle necessarie al primo avvio:

```sql
-- Verifica tabelle
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%Cleanup%' OR table_name LIKE '%Backup%';
```

---

## 2. CONFIGURAZIONE AVANZATA

### 2.1 Parametri di Sistema

Modifica da interfaccia o via API:

```javascript
{
  // Scansione
  "maxDepth": 3,              // Profondità massima sottocartelle
  "bufferSize": 104857600,    // Buffer lettura file (100MB)
  "timeout": 60000,           // Timeout operazione (60 secondi)
  
  // Retention
  "retentionDays": 30,        // Giorni mantenimento backup
  "autoDeleteOldBackups": false, // Elimina automaticamente vecchi backup
  
  // Features
  "createReadme": true,       // Crea README.md in ogni cleanup
  "preserveStructure": true,  // Mantieni struttura directory
  "createManifest": true,     // Crea manifest.json dettagliato
  "compressBackups": true,    // Comprimi backup
  
  // Notifiche
  "notifyOnCleanup": true,    // Notifica dopo cleanup
  "notifyOnBackup": true,     // Notifica dopo backup
  "notifyOnError": true       // Notifica su errori
}
```

### 2.2 Configurazione per Progetti Grandi

Per progetti > 1GB o > 10.000 file:

```javascript
{
  "maxDepth": 2,              // Riduci profondità
  "bufferSize": 52428800,     // Buffer ridotto (50MB)
  "timeout": 180000,          // Timeout esteso (3 minuti)
  "chunkSize": 100,           // Processa file a blocchi
  "parallel": false,          // Disabilita processamento parallelo
  "skipLargeFiles": true,     // Salta file > 100MB
  "largeFileThreshold": 104857600
}
```

### 2.3 Configurazione per Server

```javascript
{
  "autoCleanup": true,        // Abilita cleanup automatico
  "autoCleanupDays": 7,       // Ogni 7 giorni
  "autoCleanupTime": "02:00", // Alle 2 di notte
  "autoBackup": true,         // Backup automatico
  "autoBackupSchedule": {
    "database": "0 2 * * *",  // Ogni notte alle 2
    "code": "0 3 * * 0",      // Domenica alle 3
    "uploads": "0 3 1 * *"    // Primo del mese alle 3
  }
}
```

---

## 3. PATTERN E ESCLUSIONI

### 3.1 Pattern di Default

Pattern inclusi di default nel cleanup:

```javascript
const DEFAULT_PATTERNS = [
  "*.backup-*",        // File backup temporanei
  "*.tmp",            // File temporanei
  "*.temp",           // Variante temp
  "*.cache",          // File cache
  "*.log",            // Log files (escluso error.log)
  ".DS_Store",        // macOS system files
  "Thumbs.db",        // Windows thumbnails
  "~$*",              // Office temp files
  "*.swp",            // Vim swap files
  "*.swo",            // Vim swap overflow
  "._*",              // macOS resource forks
  "desktop.ini"       // Windows folder settings
];
```

### 3.2 Pattern Personalizzati

Aggiungi pattern via UI o API:

```javascript
// Esempio: Aggiungi pattern per file di test
POST /api/cleanup/patterns
{
  "pattern": "*.test.backup.*",
  "description": "File di test con backup",
  "category": "TEST",
  "priority": 5,
  "isActive": true
}
```

### 3.3 Esclusioni Obbligatorie

File/cartelle MAI toccati dal sistema:

```javascript
const PROTECTED_ALWAYS = [
  ".env",              // Variabili ambiente
  ".env.*",           // Tutte le varianti
  ".git",             // Repository Git
  "node_modules",     // Dipendenze NPM
  "vendor",           // Dipendenze Composer
  ".ssh",             // Chiavi SSH
  "ssl",              // Certificati SSL
  "private",          // Chiavi private
  "*.key",            // File chiave
  "*.pem",            // Certificati
  "*.crt",            // Certificati
  "id_rsa*",          // Chiavi RSA
  "prisma/migrations", // Migrazioni DB
  "database-backups"  // Backup esistenti
];
```

### 3.4 Esclusioni Custom

Aggiungi esclusioni specifiche:

```javascript
// File specifici
POST /api/cleanup/exclude-files
{
  "path": "src/config/production.json",
  "reason": "Configurazione produzione",
  "isActive": true
}

// Directory specifiche
POST /api/cleanup/exclude-dirs
{
  "path": "important-data",
  "reason": "Dati critici business",
  "recursive": true,
  "isActive": true
}
```

---

## 4. SCHEDULAZIONE

### 4.1 Configurazione Cron

Formato cron per schedulazione automatica:

```javascript
// Esempi comuni
"0 2 * * *"     // Ogni giorno alle 2:00
"0 */6 * * *"   // Ogni 6 ore
"0 0 * * 0"     // Ogni domenica a mezzanotte
"0 0 1 * *"     // Primo del mese a mezzanotte
"*/30 * * * *"  // Ogni 30 minuti

// Configurazione completa
{
  "schedules": {
    "backupDatabase": {
      "cron": "0 2 * * *",
      "enabled": true,
      "timezone": "Europe/Rome"
    },
    "cleanup": {
      "cron": "0 3 * * 5",  // Venerdì alle 3
      "enabled": true,
      "dryRun": false
    },
    "cleanOldBackups": {
      "cron": "0 4 1 * *",  // Primo del mese
      "enabled": true,
      "daysToKeep": 30
    }
  }
}
```

### 4.2 Schedulazione via Sistema

Con systemd (Linux):

```ini
# /etc/systemd/system/backup-cleanup.service
[Unit]
Description=Backup and Cleanup Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/project
ExecStart=/usr/bin/node backend/src/jobs/scheduler.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Con PM2:

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'backup-scheduler',
    script: './backend/src/jobs/scheduler.js',
    cron_restart: '0 2 * * *',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
```

---

## 5. NOTIFICHE

### 5.1 Configurazione Email

```javascript
{
  "email": {
    "enabled": true,
    "provider": "smtp",
    "config": {
      "host": "smtp.gmail.com",
      "port": 587,
      "secure": false,
      "auth": {
        "user": "notifications@example.com",
        "pass": "app-password"
      }
    },
    "recipients": {
      "admin": ["admin@example.com"],
      "backup": ["backup-team@example.com"],
      "errors": ["devops@example.com"]
    },
    "templates": {
      "backupComplete": "email-templates/backup-complete.html",
      "cleanupComplete": "email-templates/cleanup-complete.html",
      "errorAlert": "email-templates/error-alert.html"
    }
  }
}
```

### 5.2 Notifiche In-App

```javascript
{
  "notifications": {
    "inApp": true,
    "priority": {
      "backup": "LOW",
      "cleanup": "MEDIUM",
      "error": "HIGH",
      "diskSpace": "CRITICAL"
    },
    "retention": {
      "LOW": 7,      // giorni
      "MEDIUM": 14,
      "HIGH": 30,
      "CRITICAL": 90
    }
  }
}
```

### 5.3 Webhook Integration

```javascript
{
  "webhooks": {
    "enabled": true,
    "endpoints": [
      {
        "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
        "events": ["backup.completed", "cleanup.completed", "error"],
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        }
      }
    ]
  }
}
```

---

## 6. PERFORMANCE TUNING

### 6.1 Ottimizzazione Database

```sql
-- Indici consigliati
CREATE INDEX idx_backup_type_status ON "SystemBackup"(type, status);
CREATE INDEX idx_backup_created ON "SystemBackup"(createdAt DESC);
CREATE INDEX idx_cleanup_log_dir ON "CleanupLog"(cleanupDir);
CREATE INDEX idx_audit_action ON "AuditLog"(action, createdAt DESC);

-- Pulizia periodica
DELETE FROM "AuditLog" WHERE createdAt < NOW() - INTERVAL '90 days';
DELETE FROM "Notification" WHERE createdAt < NOW() - INTERVAL '30 days';
```

### 6.2 Ottimizzazione File System

```javascript
{
  "filesystem": {
    "readBuffer": 65536,        // 64KB buffer
    "writeBuffer": 131072,      // 128KB buffer
    "maxOpenFiles": 100,        // File aperti contemporaneamente
    "streamHighWaterMark": 16384, // Stream buffer
    "compression": {
      "level": 6,              // Livello compressione (1-9)
      "memLevel": 8,           // Memoria per compressione
      "strategy": "DEFAULT"    // Strategia compressione
    }
  }
}
```

### 6.3 Ottimizzazione Redis

```javascript
{
  "redis": {
    "maxRetriesPerRequest": 3,
    "enableReadyCheck": true,
    "connectTimeout": 10000,
    "keepAlive": 30000,
    "db": 0,
    "keyPrefix": "backup:",
    "lazyConnect": true
  }
}
```

### 6.4 Monitoring Metrics

```javascript
{
  "monitoring": {
    "metrics": {
      "enabled": true,
      "interval": 60000,        // Ogni minuto
      "retention": 604800000    // 7 giorni in ms
    },
    "alerts": {
      "diskUsage": 90,          // Alert se > 90%
      "memoryUsage": 85,        // Alert se > 85%
      "cpuUsage": 80,           // Alert se > 80%
      "queueSize": 100,         // Alert se > 100 job
      "errorRate": 5            // Alert se > 5 errori/minuto
    }
  }
}
```

---

## 7. ESEMPI PRATICI

### 7.1 Setup Ambiente Sviluppo

```bash
# 1. Configurazione base
cat > .env.development << EOF
NODE_ENV=development
PORT=3200
DATABASE_URL=postgresql://dev:devpass@localhost:5432/dev_db
BACKUP_BASE_DIR=/tmp/backup-dev
CLEANUP_TARGET_DIR=/tmp/cleanup-dev
LOG_LEVEL=debug
EOF

# 2. Configurazione cleanup conservativa
curl -X PUT http://localhost:3200/api/cleanup/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxDepth": 1,
    "dryRun": true,
    "createReadme": false,
    "retentionDays": 7
  }'
```

### 7.2 Setup Produzione

```bash
# 1. Configurazione sicura
cat > .env.production << EOF
NODE_ENV=production
PORT=3200
DATABASE_URL=postgresql://prod:$PROD_PASS@db.example.com:5432/prod_db
BACKUP_BASE_DIR=/mnt/backup/primary
CLEANUP_TARGET_DIR=/mnt/backup/cleanup
LOG_LEVEL=warn
REDIS_URL=redis://:$REDIS_PASS@redis.example.com:6379
EOF

# 2. Configurazione ottimizzata
curl -X PUT http://api.example.com/api/cleanup/config \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maxDepth": 3,
    "bufferSize": 52428800,
    "timeout": 300000,
    "retentionDays": 90,
    "autoCleanup": true,
    "autoCleanupDays": 7,
    "compressBackups": true,
    "notifyOnCleanup": true
  }'
```

### 7.3 Configurazione Multi-Tenant

```javascript
// Per gestire più progetti
const projects = [
  {
    name: "project-alpha",
    projectPath: "/apps/project-alpha",
    targetDirectory: "/backup/project-alpha",
    patterns: ["*.alpha.backup", "*.tmp"],
    schedule: "0 2 * * *"
  },
  {
    name: "project-beta", 
    projectPath: "/apps/project-beta",
    targetDirectory: "/backup/project-beta",
    patterns: ["*.beta.backup", "*.cache"],
    schedule: "0 3 * * *"
  }
];

// Configura ogni progetto
for (const project of projects) {
  await configureProject(project);
}
```

### 7.4 Script di Manutenzione

```bash
#!/bin/bash
# maintenance.sh - Script manutenzione settimanale

# 1. Backup completo
echo "Starting full backup..."
curl -X POST http://localhost:3200/api/backup/all \
  -H "Authorization: Bearer $TOKEN"

# 2. Cleanup
echo "Running cleanup..."
curl -X POST http://localhost:3200/api/backup/cleanup-dev \
  -H "Authorization: Bearer $TOKEN"

# 3. Elimina backup vecchi
echo "Cleaning old backups..."
find /backup-ra -type f -mtime +30 -delete

# 4. Ottimizza database
echo "Optimizing database..."
psql $DATABASE_URL -c "VACUUM ANALYZE;"

# 5. Report
echo "Generating report..."
curl http://localhost:3200/api/backup/stats \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### 7.5 Disaster Recovery

```bash
#!/bin/bash
# disaster-recovery.sh - Ripristino completo

# 1. Verifica ultimo backup
LATEST_BACKUP=$(ls -t /backup-ra/database/*.sql.gz | head -1)
echo "Latest backup: $LATEST_BACKUP"

# 2. Stop services
pm2 stop all

# 3. Restore database
echo "Restoring database..."
gunzip < $LATEST_BACKUP | psql $DATABASE_URL

# 4. Restore code
LATEST_CODE=$(ls -t /backup-ra/code/*.tar.gz | head -1)
tar -xzf $LATEST_CODE -C /app

# 5. Restore uploads
LATEST_UPLOADS=$(ls -t /backup-ra/uploads/*.tar.gz | head -1)
tar -xzf $LATEST_UPLOADS -C /app/uploads

# 6. Restart services
pm2 restart all

echo "Recovery complete!"
```

---

## 📚 RISORSE AGGIUNTIVE

### Link Utili
- [Documentazione Completa](./DOCUMENTAZIONE-COMPLETA.md)
- [API Reference](./API-REFERENCE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### File di Configurazione
- `.env` - Variabili ambiente
- `backup-config.json` - Configurazione backup
- `cleanup-patterns.json` - Pattern personalizzati
- `cron-jobs.json` - Schedulazioni

### Log Files
- `logs/backup.log` - Log operazioni backup
- `logs/cleanup.log` - Log operazioni cleanup
- `logs/error.log` - Log errori
- `logs/audit.log` - Audit trail

---

## 🔒 SICUREZZA

### Checklist Sicurezza
- [ ] Percorso destinazione FUORI dal progetto
- [ ] Esclusioni configurate per file sensibili
- [ ] Backup criptati per dati sensibili
- [ ] Accesso limitato a ADMIN/SUPER_ADMIN
- [ ] Log audit abilitato
- [ ] Notifiche errori configurate
- [ ] Retention policy definita
- [ ] Test restore periodici

---

**Versione**: 2.0  
**Ultimo aggiornamento**: 26 Settembre 2025  
**Autore**: Team Sviluppo LM Tecnologie
