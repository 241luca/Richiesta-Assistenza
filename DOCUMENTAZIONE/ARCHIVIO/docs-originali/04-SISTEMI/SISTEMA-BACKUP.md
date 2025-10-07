# 📦 SISTEMA BACKUP COMPLETO
**Versione**: 2.0.0  
**Data Aggiornamento**: 09 Settembre 2025  
**Stato**: ✅ Production Ready

---

## 📋 INDICE
1. [Overview](#overview)
2. [Architettura](#architettura)
3. [Funzionalità](#funzionalità)
4. [Tipi di Backup](#tipi-di-backup)
5. [API Endpoints](#api-endpoints)
6. [Interfaccia Utente](#interfaccia-utente)
7. [Configurazione](#configurazione)
8. [Sicurezza](#sicurezza)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 OVERVIEW

Il Sistema di Backup fornisce una soluzione completa per la protezione dei dati dell'applicazione, con supporto per:
- Database PostgreSQL
- Codice sorgente
- File allegati caricati dagli utenti

### Caratteristiche Principali
- ✅ **Backup manuali** on-demand per admin
- ✅ **Download sicuro** con autenticazione JWT
- ✅ **Gestione spazio** con cleanup automatico
- ✅ **Interfaccia intuitiva** con statistiche real-time
- ✅ **Multi-formato**: SQL, TAR.GZ per diversi tipi di dati
- ✅ **Tracking completo** nel database

---

## 🏗️ ARCHITETTURA

### Stack Tecnologico
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL con Prisma ORM
- **Storage**: File system locale (espandibile a S3)
- **Frontend**: React + TanStack Query + Tailwind CSS
- **Compressione**: GZIP per tutti i backup

### Struttura Directory
```
richiesta-assistenza/
└── backend/
    └── backups/
        ├── database/       # Backup database PostgreSQL
        │   └── db-*.sql.gz
        ├── code/          # Backup codice sorgente
        │   └── code-*.tar.gz
        └── uploads/       # Backup file allegati
            └── uploads-*.tar.gz
```

### Database Schema
```prisma
model SystemBackup {
  id              String   @id @default(cuid())
  name            String
  description     String?
  type            BackupType
  filePath        String
  fileSize        BigInt
  downloadUrl     String?
  status          BackupStatus @default(PENDING)
  compression     Boolean @default(true)
  encrypted       Boolean @default(false)
  retentionDays   Int @default(30)
  createdById     String
  createdBy       User @relation(fields: [createdById], references: [id])
  createdAt       DateTime @default(now())
  completedAt     DateTime?
}

enum BackupType {
  DATABASE
  CODE
  FILES     // Mostrato come UPLOADS nel frontend
  FULL
}
```

---

## 🚀 FUNZIONALITÀ

### 1. Creazione Backup

#### Database Backup
- **Comando**: `pg_dump DATABASE_URL | gzip > backup.sql.gz`
- **Include**: 
  - Tutte le 30+ tabelle del sistema
  - Dati utenti, richieste, preventivi
  - Notifiche, audit log, configurazioni
  - Relazioni e indici
- **Formato**: SQL compresso con GZIP

#### Code Backup
- **Comando**: `tar -czf backup.tar.gz --exclude=node_modules ...`
- **Include**:
  - `/src` - Frontend React
  - `/backend/src` - Backend Express
  - `/backend/prisma` - Schema database
  - `/public` - Assets pubblici
  - `/scripts` - Script automazione
  - `/Docs` - Documentazione
  - File configurazione (package.json, tsconfig, etc.)
- **Esclude**:
  - `node_modules` - Dipendenze npm
  - `.git` - Repository git
  - `.env` - Variabili ambiente
  - `dist`, `build` - File compilati
  - `uploads` - File utenti
  - `*.backup*` - Backup temporanei
  - `*.log` - File di log

#### Uploads Backup
- **Comando**: `tar -czf backup.tar.gz uploads/`
- **Include**:
  - Foto e immagini caricate
  - Documenti PDF
  - File Excel/Word
  - Avatar utenti
  - Allegati richieste
- **Formato**: TAR compresso con GZIP

### 2. Download Backup
- Autenticazione JWT richiesta
- Download diretto tramite browser
- Supporto file di grandi dimensioni
- Progress tracking nel frontend

### 3. Eliminazione Backup
- Conferma richiesta
- Eliminazione fisica del file
- Aggiornamento record database
- Audit log dell'operazione

### 4. Statistiche
- Numero backup per tipo
- Spazio totale utilizzato
- Backup più recenti
- Trend utilizzo spazio

---

## 🔌 API ENDPOINTS

### Endpoints Principali

```typescript
// Lista backup
GET /api/backup
Response: {
  success: true,
  data: Backup[],
  message: string
}

// Statistiche
GET /api/backup/stats
Response: {
  total: number,
  valid: number,
  byType: {
    database: number,
    code: number,
    uploads: number
  },
  totalSize: string
}

// Crea backup
POST /api/backup/:type
Params: type = 'database' | 'code' | 'uploads' | 'all'
Response: {
  success: true,
  data: Backup | { successful: Backup[], failed: Error[] }
}

// Download backup
GET /api/backup/:id/download
Headers: Authorization: Bearer [token]
Response: File stream

// Elimina backup
DELETE /api/backup/:id
Response: {
  success: true,
  message: string
}

// Cleanup directories
GET /api/backup/cleanup-dirs
DELETE /api/backup/cleanup-dirs/:name
```

---

## 🖥️ INTERFACCIA UTENTE

### Componente Principale
`src/pages/admin/SimpleBackupPage.tsx`

### Funzionalità UI

#### Tab 1: Gestione Backup
- **Statistiche**: Card con contatori real-time
- **Azioni rapide**: Bottoni per creare backup
- **Lista backup**: Raggruppati per tipo con azioni
- **Download**: Click sull'icona per scaricare
- **Eliminazione**: Con conferma modale

#### Tab 2: Informazioni Sistema
- **Dettagli tecnici** per ogni tipo di backup
- **Directory incluse/escluse**
- **Comandi utilizzati**
- **Best practices** e consigli
- **Struttura directory** visualizzata

#### Tab 3: Gestione Cleanup
- **Lista cartelle** temporanee
- **Informazioni spazio** occupato
- **Eliminazione definitiva** con conferma
- **Indicatori età** cartelle

### React Query Integration
```typescript
// Query per lista backup
const { data: backups } = useQuery({
  queryKey: ['backups'],
  queryFn: () => apiClient.get('/backup'),
  refetchInterval: 30000
});

// Mutation per creare backup
const createBackupMutation = useMutation({
  mutationFn: (type) => apiClient.post(`/backup/${type}`),
  onSuccess: () => {
    toast.success('Backup completato!');
    queryClient.invalidateQueries(['backups']);
  }
});
```

---

## ⚙️ CONFIGURAZIONE

### Variabili Ambiente
```env
# Database per backup
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# JWT per autenticazione
JWT_SECRET=your-secret-key

# Path backup (opzionale, default: ./backups)
BACKUP_DIR=./backups

# Retention days (opzionale, default: 30)
BACKUP_RETENTION_DAYS=30
```

### Permessi Richiesti
- **Database**: Accesso `pg_dump`
- **File system**: Scrittura in `./backups`
- **Utenti**: Solo ADMIN e SUPER_ADMIN

---

## 🔒 SICUREZZA

### Autenticazione
- JWT token richiesto per tutte le operazioni
- Verifica ruolo admin per accesso
- Token passato via header o query param per download

### Protezione Dati
- Backup contengono dati sensibili
- File .env esclusi dai backup codice
- Possibilità di cifratura (da implementare)
- Audit log di tutte le operazioni

### Best Practices
1. **Download backup** su storage sicuro esterno
2. **Test periodici** di ripristino
3. **Rotazione backup** vecchi
4. **Cifratura** prima di upload su cloud pubblici
5. **Documentazione** procedure di ripristino

---

## 🔧 TROUBLESHOOTING

### Problemi Comuni

#### Errore "429 Too Many Requests"
**Causa**: Refresh troppo frequente delle query
**Soluzione**: Aumentato `refetchInterval` a 30 secondi

#### Errore "No token provided" al download
**Causa**: Token JWT non inviato correttamente
**Soluzione**: Implementato download via Axios con blob response

#### Backup uploads vuoto o piccolo
**Causa**: Directory uploads non esiste o vuota
**Soluzione**: Sistema crea automaticamente placeholder se vuota

#### Campo downloadUrl vuoto
**Causa**: Backup creati prima dell'aggiornamento
**Soluzione**: Script di migrazione aggiorna i record esistenti

### Comandi Utili

```bash
# Test backup database manuale
pg_dump $DATABASE_URL | gzip > test-backup.sql.gz

# Verifica dimensione backup
du -sh backend/backups/*

# Ripristino database da backup
gunzip -c backup.sql.gz | psql $DATABASE_URL

# Estrazione backup codice
tar -xzf code-backup.tar.gz

# Pulizia backup vecchi
find backend/backups -name "*.gz" -mtime +30 -delete
```

---

## 📊 METRICHE E MONITORAGGIO

### KPI Consigliati
- **Frequenza backup**: Giornaliero (database), Settimanale (code/uploads)
- **Retention**: 7 giorni (giornalieri), 30 giorni (settimanali)
- **Spazio massimo**: Monitora quando supera 10GB totali
- **Success rate**: Target 100% backup completati

### Alert Suggeriti
- Backup database fallito
- Spazio disco < 1GB disponibile
- Nessun backup da > 24h
- File backup corrotto

---

## 🚀 ROADMAP FUTURI MIGLIORAMENTI

### Fase 1 - Automation (Q1 2026)
- [ ] Backup automatici schedulati con cron
- [ ] Notifiche email su completamento
- [ ] Retention policy automatica

### Fase 2 - Cloud Integration (Q2 2026)
- [ ] Upload automatico su AWS S3
- [ ] Google Cloud Storage support
- [ ] Multi-region backup

### Fase 3 - Advanced Features (Q3 2026)
- [ ] Cifratura end-to-end
- [ ] Backup incrementali
- [ ] Point-in-time recovery
- [ ] Disaster recovery automation

---

## 📝 CHANGELOG

### v2.0.0 - 09/09/2025
- ✅ Sistema backup completo implementato
- ✅ UI con 3 tab (Backup, Info, Cleanup)
- ✅ Download sicuro con JWT
- ✅ Gestione cleanup directories
- ✅ Documentazione completa

### v1.0.0 - 08/09/2025
- Prima implementazione base
- Backup manuale database
- Interfaccia semplificata

---

## 📞 SUPPORTO

Per problemi o domande:
- **Email**: support@richiesta-assistenza.it
- **Documentazione**: `/Docs`
- **Logs**: `backend/logs/error.log`

---

**Documento mantenuto da**: Team Sviluppo  
**Ultimo aggiornamento**: 09 Settembre 2025
