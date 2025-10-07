# 📚 DOCUMENTAZIONE COMPLETA - SISTEMA BACKUP & CLEANUP

**Versione**: 2.0  
**Data**: 26 Settembre 2025  
**Stato**: Production Ready

---

## 📑 INDICE

1. [Introduzione](#introduzione)
2. [Architettura del Sistema](#architettura-del-sistema)
3. [Installazione e Setup](#installazione-e-setup)
4. [Configurazione](#configurazione)
5. [Funzionalità Dettagliate](#funzionalità-dettagliate)
6. [API Reference](#api-reference)
7. [Interfaccia Utente](#interfaccia-utente)
8. [Database Schema](#database-schema)
9. [Sicurezza](#sicurezza)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)
12. [Changelog](#changelog)

---

## 1. INTRODUZIONE

### 1.1 Scopo del Sistema
Il Sistema Backup & Cleanup è una soluzione integrata per:
- **Proteggere** i dati attraverso backup automatici e manuali
- **Ottimizzare** lo spazio eliminando file temporanei
- **Mantenere** l'ordine nel progetto spostando file obsoleti
- **Tracciare** tutte le operazioni con audit log completo

### 1.2 Caratteristiche Principali
- 🔒 **Sicurezza**: Mai eliminazione diretta, sempre spostamento
- ⚙️ **Configurabilità**: Tutto personalizzabile da interfaccia
- 📊 **Tracciabilità**: Log completo di ogni operazione
- 🚀 **Performance**: Operazioni asincrone e ottimizzate
- 🎨 **User-Friendly**: Interfaccia intuitiva con documentazione integrata

---

## 2. ARCHITETTURA DEL SISTEMA

### 2.1 Stack Tecnologico

#### Frontend
```yaml
Framework: React 18.3
Build Tool: Vite 5.x
State Management: TanStack Query v5
UI Framework: TailwindCSS 3.4
Icons: Heroicons v2
Date Handling: date-fns
HTTP Client: Axios
```

#### Backend
```yaml
Runtime: Node.js 18+
Framework: Express.js
Language: TypeScript 5.x
ORM: Prisma 6.x
Database: PostgreSQL 14+
Queue: Bull + Redis
Logger: Winston
Scheduler: node-cron
```

### 2.2 Struttura File

```
sistema-backup/
├── frontend/
│   ├── pages/admin/
│   │   └── SimpleBackupPage.tsx      # Pagina principale
│   └── components/admin/
│       ├── ServiceConfigTab.tsx      # Tab configurazione
│       └── CleanupDocumentationTab.tsx # Tab documentazione
│
├── backend/
│   ├── services/
│   │   ├── simple-backup.service.ts  # Logica backup
│   │   ├── cleanup.service.ts        # Logica cleanup
│   │   └── cleanup-config.service.ts # Config management
│   ├── routes/
│   │   ├── simple-backup.routes.ts   # API backup
│   │   └── cleanup-config.routes.ts  # API config
│   └── database/
│       └── schema.prisma              # Schema DB
```

### 2.3 Flusso Dati

```mermaid
graph TD
    UI[Interfaccia Utente] --> API[API Routes]
    API --> Service[Service Layer]
    Service --> DB[(Database)]
    Service --> FS[File System]
    Service --> Queue[Job Queue]
    Queue --> Worker[Background Worker]
    Worker --> FS
    Worker --> Notification[Sistema Notifiche]
```

---

## 3. INSTALLAZIONE E SETUP

### 3.1 Prerequisiti
- Node.js 18+
- PostgreSQL 14+
- Redis (opzionale, per queue)
- 5GB spazio disco minimo

### 3.2 Installazione

```bash
# 1. Clone del repository
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd Richiesta-Assistenza

# 2. Installazione dipendenze
npm install
cd backend && npm install

# 3. Setup database
cd backend
npx prisma generate
npx prisma db push

# 4. Configurazione ambiente
cp .env.example .env
# Modifica .env con i tuoi parametri

# 5. Avvio sistema
npm run dev         # Frontend
cd backend && npm run dev  # Backend
```

### 3.3 Verifica Installazione

```bash
# Test backup database
curl -X POST http://localhost:3200/api/backup/database \
  -H "Authorization: Bearer YOUR_TOKEN"

# Verifica cleanup config
curl http://localhost:3200/api/cleanup/config \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 4. CONFIGURAZIONE

### 4.1 Variabili d'Ambiente

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Backup Paths
BACKUP_BASE_DIR=/Users/lucamambelli/Desktop/backup-ra
CLEANUP_TARGET_DIR=/Users/lucamambelli/Desktop/backup-cleanup

# Sistema
NODE_ENV=production
PORT=3200

# Notifiche (opzionale)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=notifications@example.com
SMTP_PASS=password
```

### 4.2 Configurazione da Interfaccia

#### Percorsi
- **Percorso Base Completo**: Directory del progetto da pulire
- **Percorso Destinazione Cleanup**: Dove spostare i file (DEVE essere fuori dal progetto!)

#### Pattern File
Default pattern inclusi:
- `*.backup-*` - File di backup
- `*.tmp` - File temporanei
- `*.log` - File di log
- `*.cache` - File cache
- `.DS_Store` - File di sistema macOS

#### Esclusioni Sempre Attive
- `.env` - Variabili ambiente
- `.git` - Repository Git
- `node_modules` - Dipendenze NPM
- `prisma/migrations` - Migrazioni database

### 4.3 Configurazione Avanzata

```typescript
// cleanup-config.ts
export const DEFAULT_CONFIG = {
  maxDepth: 3,              // Profondità scansione
  bufferSize: 104857600,    // 100MB buffer
  timeout: 60000,           // 60 secondi timeout
  retentionDays: 30,        // Mantieni backup per 30 giorni
  autoCleanup: false,       // Cleanup automatico
  autoCleanupDays: 7,       // Ogni 7 giorni
  createReadme: true,       // Crea README nelle cartelle
  preserveStructure: true,  // Mantieni struttura directory
  notifyOnCleanup: true     // Notifica amministratori
};
```

---

## 5. FUNZIONALITÀ DETTAGLIATE

### 5.1 Sistema Backup

#### 5.1.1 Backup Database
```typescript
// Esegue pg_dump del database PostgreSQL
POST /api/backup/database

// Il backup viene:
1. Compresso con gzip
2. Salvato in /backup-ra/database/
3. Registrato nel database
4. Tracciato nell'audit log
```

#### 5.1.2 Backup Codice
```typescript
// Crea archivio tar.gz del codice sorgente
POST /api/backup/code

// Esclude automaticamente:
- node_modules/
- .git/
- dist/
- build/
```

#### 5.1.3 Backup Uploads
```typescript
// Archivia tutti i file caricati dagli utenti
POST /api/backup/uploads

// Include:
- Immagini profilo
- Documenti
- Allegati richieste
```

### 5.2 Sistema Cleanup

#### 5.2.1 Processo di Cleanup
```typescript
1. Scansione directory progetto
2. Identificazione file che matchano i pattern
3. Verifica esclusioni
4. Creazione cartella CLEANUP-YYYY-MM-DD-HH-mm-ss
5. Spostamento file (preservando struttura)
6. Creazione README.md con dettagli
7. Aggiornamento database
8. Notifica amministratori
```

#### 5.2.2 Manifest File
Ogni cartella cleanup contiene un `manifest.json`:
```json
{
  "createdAt": "2025-09-26T10:30:00Z",
  "filesCount": 42,
  "totalSize": 15728640,
  "patterns": ["*.backup-*", "*.tmp"],
  "excludedDirs": [".git", "node_modules"],
  "sourceProject": "/path/to/project",
  "files": [
    {
      "original": "/src/file.backup-123.tsx",
      "moved": "src/file.backup-123.tsx",
      "size": 1024,
      "modified": "2025-09-25T15:20:00Z"
    }
  ]
}
```

### 5.3 Gestione Cartelle Cleanup

#### 5.3.1 Lista Cartelle
```typescript
GET /api/backup/cleanup-dirs

Response:
[
  {
    "name": "CLEANUP-2025-09-26-10-30-00",
    "path": "/backup-cleanup/CLEANUP-2025-09-26-10-30-00",
    "size": "15.7 MB",
    "fileCount": 42,
    "createdAt": "2025-09-26T10:30:00Z"
  }
]
```

#### 5.3.2 Eliminazione Cartella
```typescript
DELETE /api/backup/cleanup-dirs/:name
Body: { confirm: true }

// Processo:
1. Verifica esistenza
2. Conferma nome valido (CLEANUP-*)
3. Eliminazione ricorsiva
4. Aggiornamento audit log
```

---

## 6. API REFERENCE

### 6.1 Autenticazione
Tutte le API richiedono JWT token:
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### 6.2 Endpoints Backup

#### GET /api/backup
Lista tutti i backup
```typescript
Query Parameters:
- type?: 'DATABASE' | 'CODE' | 'UPLOADS'
- limit?: number
- offset?: number

Response:
{
  success: true,
  data: [
    {
      id: "uuid",
      type: "DATABASE",
      filename: "db-2025-09-26-10-30-00.sql.gz",
      fileSize: "52428800",
      createdAt: "2025-09-26T10:30:00Z"
    }
  ]
}
```

#### POST /api/backup/:type
Crea nuovo backup
```typescript
Parameters:
- type: 'database' | 'code' | 'uploads' | 'all'

Response:
{
  success: true,
  data: {
    id: "uuid",
    type: "DATABASE",
    filename: "db-2025-09-26-10-30-00.sql.gz",
    filePath: "/backup-ra/database/db-2025-09-26-10-30-00.sql.gz",
    fileSize: 52428800
  },
  message: "Backup created successfully"
}
```

### 6.3 Endpoints Cleanup

#### POST /api/backup/cleanup-dev
Esegue cleanup immediato
```typescript
Response:
{
  success: true,
  data: {
    movedCount: 42,
    cleanupDir: "CLEANUP-2025-09-26-10-30-00"
  },
  message: "Cleanup completed successfully"
}
```

### 6.4 Endpoints Configurazione

#### GET /api/cleanup/config
Ottieni configurazione corrente
```typescript
Response:
{
  success: true,
  data: {
    id: "uuid",
    name: "default",
    targetDirectory: "/backup-cleanup",
    directoryFormat: "CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}",
    maxDepth: 3,
    retentionDays: 30,
    // ... altre configurazioni
  }
}
```

#### PUT /api/cleanup/config
Aggiorna configurazione
```typescript
Body:
{
  targetDirectory: "/new/path",
  retentionDays: 60,
  autoCleanup: true
}

Response:
{
  success: true,
  data: { /* configurazione aggiornata */ },
  message: "Configuration updated successfully"
}
```

---

## 7. INTERFACCIA UTENTE

### 7.1 Pagina Principale
URL: `/admin/backup`

#### Tab Disponibili:
1. **Backup** - Gestione backup con azioni rapide
2. **Info** - Statistiche e overview
3. **Cleanup** - Lista cartelle cleanup create
4. **Documentazione** - Guida integrata
5. **Configurazione** - Impostazioni sistema
6. **Audit Log** - Storico operazioni

### 7.2 Tab Backup
Mostra tabella con:
- Nome backup
- Tipo (Database/Code/Uploads)
- Dimensione
- Data creazione
- Azioni (Download/Elimina)

Pulsanti azione rapida:
- 🗄️ Database - Backup immediato DB
- 📁 Codice - Backup codice sorgente
- 📎 Uploads - Backup file utente
- 🧹 Cleanup - Pulizia file temporanei

### 7.3 Tab Configurazione
Form con campi:
- **Percorso Base Completo** - Path progetto (input text)
- **Percorso Destinazione** - Dove salvare cleanup (input text)
- **Formato Nome Cartelle** - Pattern naming (input text)
- **Profondità Scansione** - Livelli sottocartelle (number)
- **Giorni Retention** - Quanto mantenere (number)
- **Opzioni** - Checkbox per features varie

### 7.4 Tab Cleanup
Griglia cartelle con:
- 📁 Nome cartella
- 📊 Numero file
- 💾 Dimensione totale
- 📅 Data creazione
- 🗑️ Azione elimina (con conferma)

---

## 8. DATABASE SCHEMA

### 8.1 Tabella SystemBackup
```prisma
model SystemBackup {
  id            String   @id @default(cuid())
  name          String
  description   String?
  type          String   // DATABASE, CODE, UPLOADS
  filePath      String
  fileSize      BigInt
  status        String   // COMPLETED, FAILED, IN_PROGRESS
  compression   Boolean  @default(true)
  encrypted     Boolean  @default(false)
  retentionDays Int      @default(30)
  
  createdById   String
  createdBy     User     @relation(fields: [createdById], references: [id])
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  completedAt   DateTime?
  
  @@index([type, status])
  @@index([createdAt])
}
```

### 8.2 Tabella CleanupConfig
```prisma
model CleanupConfig {
  id                String   @id @default(cuid())
  name              String   @unique @default("default")
  isActive          Boolean  @default(true)
  
  targetDirectory   String   // Dove salvare cleanup
  directoryFormat   String   // Pattern nome cartelle
  maxDepth          Int      @default(3)
  bufferSize        Int      @default(104857600)
  timeout           Int      @default(60000)
  retentionDays     Int      @default(30)
  
  autoCleanup       Boolean  @default(false)
  autoCleanupDays   Int      @default(7)
  createReadme      Boolean  @default(true)
  preserveStructure Boolean  @default(true)
  notifyOnCleanup   Boolean  @default(true)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 8.3 Tabella CleanupPattern
```prisma
model CleanupPattern {
  id          String   @id @default(cuid())
  pattern     String   @unique
  description String?
  isActive    Boolean  @default(true)
  category    String?  // BACKUP, TEMP, LOG, CACHE
  priority    Int      @default(0)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([isActive, priority])
}
```

### 8.4 Tabella CleanupLog
```prisma
model CleanupLog {
  id              String   @id @default(cuid())
  cleanupDir      String   // Nome cartella creata
  filesProcessed  Int      // Numero file spostati
  totalSize       BigInt   // Dimensione totale
  sourcePath      String   // Da dove
  targetPath      String   // A dove
  patterns        Json     // Pattern usati
  excludedFiles   Json     // File esclusi
  excludedDirs    Json     // Directory escluse
  
  executedBy      String?
  user            User?    @relation(fields: [executedBy], references: [id])
  
  startedAt       DateTime
  completedAt     DateTime
  duration        Int      // millisecondi
  success         Boolean
  errorMessage    String?
  
  createdAt       DateTime @default(now())
  
  @@index([cleanupDir])
  @@index([createdAt])
}
```

---

## 9. SICUREZZA

### 9.1 Autenticazione e Autorizzazione
- Solo utenti autenticati possono accedere
- Ruoli richiesti: ADMIN o SUPER_ADMIN
- JWT con expiry 24 ore
- Refresh token disponibile

### 9.2 Protezioni File System
```typescript
// File e cartelle sempre protetti
const PROTECTED_ITEMS = [
  '.env',
  '.env.local',
  '.env.production',
  '.git',
  'node_modules',
  'prisma/migrations',
  'database-backups',
  'ssl-certificates',
  'private-keys'
];

// Validazione path per evitare path traversal
function validatePath(path: string): boolean {
  return !path.includes('../') && !path.includes('..\\');
}
```

### 9.3 Audit Trail
Ogni operazione viene tracciata:
- Chi (userId)
- Cosa (action)
- Quando (timestamp)
- Dove (IP address)
- Risultato (success/failure)
- Dettagli (metadata)

### 9.4 Rate Limiting
```typescript
// Limiti per endpoint
const rateLimits = {
  '/api/backup/database': '5 per hour',
  '/api/backup/code': '10 per hour',
  '/api/backup/cleanup-dev': '20 per hour',
  '/api/cleanup/config': '30 per minute'
};
```

---

## 10. TROUBLESHOOTING

### 10.1 Problemi Comuni

#### Errore: "Cleanup target directory does not exist"
**Causa**: La directory di destinazione non esiste
**Soluzione**:
```bash
mkdir -p /Users/lucamambelli/Desktop/backup-cleanup
```

#### Errore: "pg_dump: command not found"
**Causa**: PostgreSQL client tools non installati
**Soluzione**:
```bash
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql-client
```

#### Errore: "Insufficient space"
**Causa**: Spazio disco insufficiente
**Soluzione**:
1. Elimina vecchie cartelle cleanup
2. Riduci retention days
3. Libera spazio su disco

### 10.2 Debug

#### Abilitare Log Dettagliati
```typescript
// In .env
LOG_LEVEL=debug
DEBUG=backup:*,cleanup:*
```

#### Verificare Configurazione
```bash
# Check config
curl http://localhost:3200/api/cleanup/config \
  -H "Authorization: Bearer TOKEN" | jq .

# Test cleanup dry-run
curl -X POST http://localhost:3200/api/backup/cleanup-dev?dryRun=true \
  -H "Authorization: Bearer TOKEN"
```

### 10.3 Recovery

#### Ripristinare Database da Backup
```bash
# Decomprimi
gunzip db-2025-09-26-10-30-00.sql.gz

# Ripristina
psql database_name < db-2025-09-26-10-30-00.sql
```

#### Ripristinare File da Cleanup
```bash
# Copia manuale
cp -r /backup-cleanup/CLEANUP-*/path/to/file /original/path/

# O ripristino completo
rsync -av /backup-cleanup/CLEANUP-*/ /project/path/
```

---

## 11. BEST PRACTICES

### 11.1 Configurazione Ottimale
```yaml
Backup Database: Giornaliero alle 2:00 AM
Backup Code: Settimanale domenica
Backup Uploads: Mensile primo del mese
Cleanup: Settimanale venerdì sera
Retention: 30 giorni standard, 90 per database
```

### 11.2 Pattern Consigliati
```typescript
// Pattern sicuri da includere
const SAFE_PATTERNS = [
  '*.backup-*',
  '*.tmp',
  '*.temp',
  '*.cache',
  '*.log',
  '.DS_Store',
  'Thumbs.db',
  '~$*'  // Office temp files
];

// MAI includere
const NEVER_INCLUDE = [
  '*.env*',
  '*.key',
  '*.pem',
  '*.crt',
  'id_rsa*'
];
```

### 11.3 Monitoraggio
- Controlla spazio disco settimanalmente
- Verifica audit log per anomalie
- Testa restore periodicamente
- Monitora durata operazioni

### 11.4 Ottimizzazioni
```typescript
// Per progetti grandi
{
  maxDepth: 2,           // Riduci profondità
  bufferSize: 52428800,  // Riduci buffer (50MB)
  timeout: 120000,       // Aumenta timeout
  chunkSize: 100         // Processa a blocchi
}
```

---

## 12. CHANGELOG

### v2.0.0 (26 Settembre 2025)
- ✨ Sistema completamente rifatto
- ✨ Interfaccia UI completa con 7 tab
- ✨ Configurazione da interfaccia
- ✨ Lista e gestione cartelle cleanup
- ✨ Integrazione audit log
- 🐛 Fix mappatura campi basePath/targetDirectory
- 🐛 Fix notifiche con userId corretto
- 📚 Documentazione completa

### v1.5.0 (20 Settembre 2025)
- ✨ Aggiunto cleanup scheduler
- ✨ Pattern configurabili
- ✨ Esclusioni file e directory
- 🔧 Migliorata performance scansione

### v1.0.0 (15 Settembre 2025)
- 🎉 Prima release
- ✨ Backup database, code, uploads
- ✨ Cleanup base
- ✨ API REST

---

## 📞 SUPPORTO

Per problemi o domande:
- 📧 Email: support@lmtecnologie.it
- 📚 Docs: /admin/backup → Tab Documentazione
- 🐛 Issues: GitHub Issues

---

## 📄 LICENZA

Copyright © 2025 LM Tecnologie. Tutti i diritti riservati.

---

**Ultimo aggiornamento**: 26 Settembre 2025  
**Versione documento**: 2.0.0  
**Autore**: Team Sviluppo LM Tecnologie
