# 📦 Sistema di Backup - Documentazione Completa

## Indice
1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Tipi di Backup](#tipi-di-backup)
4. [Interfaccia Utente](#interfaccia-utente)
5. [API Endpoints](#api-endpoints)
6. [Gestione Cartelle Cleanup](#gestione-cartelle-cleanup)
7. [Procedure di Ripristino](#procedure-di-ripristino)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Note di Sicurezza](#note-di-sicurezza)

---

## 🎯 Panoramica

Il Sistema di Backup fornisce una soluzione completa per la protezione dei dati dell'applicazione, permettendo di creare backup di:
- **Database**: Tutti i dati PostgreSQL
- **Codice**: Codice sorgente dell'applicazione
- **Uploads**: File caricati dagli utenti

### Caratteristiche Principali
- ✅ Backup manuali on-demand
- ✅ Compressione automatica dei backup
- ✅ Download diretto dei backup
- ✅ Gestione cartelle cleanup
- ✅ Statistiche in tempo reale
- ✅ Interfaccia user-friendly

### Percorsi Principali
```
richiesta-assistenza/
└── backend/
    └── backups/
        ├── database/    # Backup database (.sql.gz)
        ├── code/        # Backup codice (.tar.gz)
        └── uploads/     # Backup allegati (.tar.gz)
```

---

## 🏗️ Architettura

### Componenti del Sistema

#### Backend
- **Service**: `simple-backup.service.ts` - Logica di business
- **Routes**: `simple-backup.routes.ts` - Endpoint API
- **Model**: `backup.model.ts` - Schema database

#### Frontend
- **Pagina Admin**: `SimpleBackupPage.tsx` - Interfaccia amministrativa
- **3 Tab**:
  - Gestione Backup - Creazione e gestione backup
  - Informazioni Sistema - Dettagli tecnici
  - Gestione Cleanup - Gestione cartelle temporanee

### Schema Database

```typescript
// Tabella backups
{
  id: number,
  type: 'DATABASE' | 'CODE' | 'UPLOADS',
  filename: string,
  filepath: string,
  file_size: bigint,
  status: 'COMPLETED' | 'FAILED',
  metadata: jsonb,
  created_by: number,
  created_at: timestamp
}
```

---

## 💾 Tipi di Backup

### 1. Database Backup
**Contenuto**:
- Tutti i dati utenti
- Richieste di assistenza
- Preventivi e pagamenti
- Configurazioni sistema
- Notifiche e messaggi

**Formato**: SQL compresso (`.sql.gz`)  
**Comando ripristino**:
```bash
gunzip -c db-backup-*.sql.gz | psql DATABASE_URL
```

### 2. Code Backup
**Contenuto**:
- Codice sorgente completo
- Configurazioni applicazione
- Script e utilità
- File di migrazione
- Documentazione

**Esclusioni**:
- node_modules
- .git
- File .env
- Build e dist
- Cartelle CLEANUP-*

**Formato**: TAR compresso (`.tar.gz`)  
**Comando estrazione**:
```bash
tar -xzf code-backup-*.tar.gz
```

### 3. Uploads Backup
**Contenuto**:
- Foto e immagini caricate
- Documenti PDF
- File Excel/Word
- Avatar utenti
- Allegati richieste

**Formato**: TAR compresso (`.tar.gz`)  
**Comando ripristino**:
```bash
tar -xzf uploads-backup-*.tar.gz -C /
```

### 4. Backup Completo
Crea tutti e tre i backup in sequenza:
1. Database
2. Codice
3. Uploads

---

## 🖥️ Interfaccia Utente

### Accesso
- **URL**: `/admin/backup`
- **Permessi**: Solo ADMIN e SUPER_ADMIN

### Tab Gestione Backup

#### Statistiche
- Backup totali validi
- Numero backup per tipo
- Spazio totale utilizzato

#### Azioni Disponibili
- **Backup Database**: Crea backup del database
- **Backup Codice**: Crea backup del codice sorgente
- **Backup Allegati**: Crea backup dei file caricati
- **Backup Completo**: Crea tutti i backup

#### Lista Backup
- Visualizzazione per tipo
- Badge "NUOVO" per backup recenti (< 5 minuti)
- Download diretto
- Eliminazione con conferma

### Tab Informazioni Sistema
- Dettagli su cosa include ogni tipo di backup
- Formati dei file
- Ubicazione dei backup
- Struttura directory
- Best practices

### Tab Gestione Cleanup
- Lista cartelle CLEANUP-* esistenti
- Numero file per cartella
- Dimensione totale
- Età della cartella
- Eliminazione definitiva con conferma

---

## 🔌 API Endpoints

### Autenticazione
Tutti gli endpoint richiedono autenticazione admin.

### Endpoint Disponibili

#### GET /api/backup
Lista tutti i backup o filtra per tipo.

**Query params**:
- `type`: 'DATABASE' | 'CODE' | 'UPLOADS'

**Response**:
```json
{
  "success": true,
  "data": [{
    "id": "1",
    "type": "DATABASE",
    "filename": "db-backup-2025-09-05-10-30-00.sql.gz",
    "fileSize": "1048576",
    "createdAt": "2025-09-05T10:30:00Z"
  }]
}
```

#### GET /api/backup/stats
Ottiene statistiche sui backup.

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 15,
    "valid": 15,
    "byType": {
      "database": 5,
      "code": 5,
      "uploads": 5
    },
    "totalSize": "2.5 GB"
  }
}
```

#### POST /api/backup/:type
Crea un nuovo backup.

**Params**:
- `:type`: `database` | `code` | `uploads` | `all`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "1",
    "filename": "db-backup-2025-09-05-10-30-00.sql.gz",
    "fileSize": "1048576"
  }
}
```

#### DELETE /api/backup/:id
Elimina un backup.

**Response**:
```json
{
  "success": true,
  "message": "Backup deleted successfully"
}
```

#### GET /api/backup/:id/download
Scarica un backup.

**Response**: File binario

#### GET /api/backup/cleanup-dirs
Lista le cartelle di cleanup.

**Response**:
```json
{
  "success": true,
  "data": [{
    "name": "CLEANUP-2025-09-05-08-57-46",
    "path": "/path/to/cleanup",
    "size": "15.3 MB",
    "fileCount": 42,
    "createdAt": "2025-09-05T08:57:46Z"
  }]
}
```

#### DELETE /api/backup/cleanup-dirs/:name
Elimina definitivamente una cartella cleanup.

**Body**:
```json
{
  "confirm": true
}
```

---

## 🗂️ Gestione Cartelle Cleanup

### Cosa sono le Cartelle Cleanup?

Le cartelle `CLEANUP-*` contengono file temporanei di sviluppo che sono stati spostati durante sessioni di pulizia precedenti.

### Contenuto Tipico
- File `.backup-*` (backup automatici prima delle modifiche)
- Script `.sh` temporanei (`fix-*.sh`, `test-*.sh`)
- File `.fixed.ts` e `.fixed.tsx`
- Altri file temporanei di sviluppo

### Gestione
1. **Visualizzazione**: Tab "Gestione Cleanup" mostra tutte le cartelle
2. **Informazioni**: Numero file, dimensione, data creazione
3. **Badge "Vecchia"**: Per cartelle > 7 giorni
4. **Eliminazione**: Pulsante cestino con conferma

### ⚠️ NOTA IMPORTANTE
La funzione "Pulizia File Sviluppo" è stata **RIMOSSA** per sicurezza. Le cartelle cleanup esistenti possono solo essere gestite/eliminate, non create nuove.

---

## 🔄 Procedure di Ripristino

### Ripristino Database

1. **Scarica il backup** dalla UI o dal server
2. **Decomprimi** (se necessario):
   ```bash
   gunzip db-backup-*.sql.gz
   ```
3. **Ripristina** nel database:
   ```bash
   psql DATABASE_URL < db-backup-*.sql
   ```

### Ripristino Codice

1. **Scarica il backup**
2. **Estrai** in una directory temporanea:
   ```bash
   mkdir temp-restore
   tar -xzf code-backup-*.tar.gz -C temp-restore
   ```
3. **Confronta** e copia i file necessari

### Ripristino Uploads

1. **Scarica il backup**
2. **Estrai** nella root del progetto:
   ```bash
   tar -xzf uploads-backup-*.tar.gz -C /path/to/project
   ```

---

## 📋 Best Practices

### Frequenza Consigliata
- **Database**: Giornaliero (automatizzabile in produzione)
- **Codice**: Prima di ogni deploy o modifica importante
- **Allegati**: Settimanale o dopo upload massivi

### Storage e Retention
- Mantieni almeno **7 giorni** di backup giornalieri
- Conserva backup settimanali per **1 mese**
- Archivia backup mensili per **1 anno**
- Scarica backup importanti su **storage esterno**

### Sicurezza
- I backup contengono **dati sensibili** - conservali in modo sicuro
- **Cripta** i backup prima di trasferirli su cloud pubblici
- **Testa periodicamente** il ripristino dei backup
- **Documenta** le procedure di ripristino

### Pulizia
- Elimina cartelle CLEANUP-* **più vecchie di 30 giorni**
- Verifica lo spazio disponibile **settimanalmente**
- Mantieni un **log** delle eliminazioni

---

## 🔧 Troubleshooting

### Errore: "pg_dump: command not found"
**Causa**: PostgreSQL client tools non installati  
**Soluzione**:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
apt-get install postgresql-client

# CentOS/RHEL
yum install postgresql
```

### Errore: "tar: command not found"
**Causa**: tar non installato (raro)  
**Soluzione**:
```bash
# Ubuntu/Debian
apt-get install tar

# CentOS/RHEL
yum install tar
```

### Backup Database Fallisce
**Possibili cause**:
1. Credenziali database errate in `.env`
2. Database non raggiungibile
3. Spazio disco insufficiente

**Debug**:
```bash
# Test connessione
psql $DATABASE_URL -c "SELECT 1"

# Verifica spazio
df -h
```

### Download Backup Non Funziona
**Possibili cause**:
1. Token di autenticazione mancante/scaduto
2. File backup eliminato dal filesystem
3. Permessi file incorretti

**Soluzione**:
1. Rifare login
2. Verificare esistenza file su server
3. Controllare permessi directory backups

---

## 🔒 Note di Sicurezza

### Permessi
- Solo utenti **ADMIN** e **SUPER_ADMIN** possono accedere
- Autenticazione richiesta per tutti gli endpoint
- Token JWT necessario per download

### Dati Sensibili
I backup contengono:
- Password hashate degli utenti
- Dati personali (email, telefoni, indirizzi)
- Informazioni fiscali (P.IVA, codice fiscale)
- Documenti caricati

### Raccomandazioni
1. **NON** conservare backup in repository Git
2. **NON** trasferire backup non criptati via email
3. **USARE** sempre connessioni sicure (HTTPS/SSH)
4. **LIMITARE** l'accesso ai backup al personale autorizzato
5. **CRIPTARE** i backup prima dello storage cloud
6. **ELIMINARE** backup obsoleti secondo policy GDPR

### Compliance GDPR
- I backup contengono dati personali
- Applicare le stesse policy di retention dei dati originali
- Documentare accessi e utilizzi dei backup
- Garantire diritto all'oblio anche nei backup

---

## 📝 Changelog

### v2.0.0 - 05/09/2025
- ✅ Implementato sistema backup completo
- ✅ Aggiunta interfaccia admin con 3 tab
- ✅ Gestione cartelle cleanup
- ❌ **RIMOSSA** funzione "Pulizia File Sviluppo" per sicurezza
- ✅ Corretti pattern di pulizia troppo aggressivi
- ✅ Aggiunto sistema di statistiche
- ✅ Implementato download diretto backup

### v1.0.0 - 03/09/2025
- Prima versione del sistema backup
- Backup base database e codice

---

## 👨‍💻 Supporto

Per problemi o domande sul sistema di backup:
1. Controllare questa documentazione
2. Verificare i log in `backend/logs/`
3. Contattare il team di sviluppo

**File principali da controllare**:
- `backend/src/services/simple-backup.service.ts`
- `backend/src/routes/simple-backup.routes.ts`
- `src/pages/admin/SimpleBackupPage.tsx`

---

*Ultima revisione: 05/09/2025*
