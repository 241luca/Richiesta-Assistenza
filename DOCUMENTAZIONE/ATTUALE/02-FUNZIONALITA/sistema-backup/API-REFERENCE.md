# 🔌 API REFERENCE - SISTEMA BACKUP & CLEANUP

**Versione API**: 2.0  
**Base URL**: `http://localhost:3200/api`  
**Autenticazione**: JWT Bearer Token

---

## 📋 INDICE ENDPOINTS

### Backup
- [GET /backup](#get-backup)
- [GET /backup/stats](#get-backupstats)
- [POST /backup/database](#post-backupdatabase)
- [POST /backup/code](#post-backupcode)
- [POST /backup/uploads](#post-backupuploads)
- [POST /backup/all](#post-backupall)
- [DELETE /backup/:id](#delete-backupid)
- [GET /backup/:id/download](#get-backupiddownload)

### Cleanup
- [POST /backup/cleanup-dev](#post-backupcleanup-dev)
- [GET /backup/cleanup-dirs](#get-backupcleanup-dirs)
- [DELETE /backup/cleanup-dirs/:name](#delete-backupcleanup-dirsname)

### Configurazione
- [GET /cleanup/config](#get-cleanupconfig)
- [PUT /cleanup/config](#put-cleanupconfig)
- [GET /cleanup/patterns](#get-cleanuppatterns)
- [POST /cleanup/patterns](#post-cleanuppatterns)
- [DELETE /cleanup/patterns/:id](#delete-cleanuppatternsid)

---

## 🔐 AUTENTICAZIONE

Tutti gli endpoint richiedono autenticazione JWT:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

Ruoli richiesti: `ADMIN` o `SUPER_ADMIN`

---

## 📦 BACKUP ENDPOINTS

### GET /backup
Lista tutti i backup disponibili

#### Request
```http
GET /api/backup?type=DATABASE&limit=10&offset=0
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| type | string | No | Filtra per tipo: DATABASE, CODE, UPLOADS |
| limit | number | No | Numero risultati (default: 20) |
| offset | number | No | Offset per paginazione (default: 0) |

#### Response 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "cm2xyz123",
      "name": "Database Backup - 2025-09-26-10-30-00",
      "type": "DATABASE",
      "filename": "db-2025-09-26-10-30-00.sql.gz",
      "fileSize": "52428800",
      "status": "COMPLETED",
      "createdAt": "2025-09-26T10:30:00Z",
      "createdBy": {
        "id": "user123",
        "fullName": "Admin User"
      }
    }
  ],
  "message": "Backups retrieved successfully"
}
```

---

### GET /backup/stats
Ottieni statistiche sui backup

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "total": 42,
    "valid": 40,
    "byType": {
      "database": 15,
      "code": 12,
      "uploads": 13
    },
    "totalSize": "5.2 GB",
    "oldestBackup": "2025-01-15T10:30:00Z",
    "newestBackup": "2025-09-26T10:30:00Z"
  },
  "message": "Statistics retrieved successfully"
}
```

---

### POST /backup/database
Crea un nuovo backup del database

#### Request
```http
POST /api/backup/database
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "compression": true,
  "encrypted": false,
  "description": "Backup pre-aggiornamento"
}
```

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "id": "cm2xyz456",
    "type": "DATABASE",
    "filename": "db-2025-09-26-10-30-00.sql.gz",
    "filePath": "/backup-ra/database/db-2025-09-26-10-30-00.sql.gz",
    "fileSize": 52428800,
    "createdAt": "2025-09-26T10:30:00Z"
  },
  "message": "Database backup created successfully"
}
```

#### Response 500 Error
```json
{
  "success": false,
  "error": "Failed to create database backup",
  "code": "BACKUP_ERROR",
  "details": "pg_dump: connection to database failed"
}
```

---

### POST /backup/code
Crea backup del codice sorgente

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "id": "cm2xyz789",
    "type": "CODE",
    "filename": "code-2025-09-26-10-30-00.tar.gz",
    "filePath": "/backup-ra/code/code-2025-09-26-10-30-00.tar.gz",
    "fileSize": 15728640,
    "excludedPaths": ["node_modules", ".git", "dist"],
    "createdAt": "2025-09-26T10:30:00Z"
  },
  "message": "Code backup created successfully"
}
```

---

### POST /backup/all
Crea tutti i backup contemporaneamente

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "successful": [
      { "type": "DATABASE", "id": "cm2xyz111" },
      { "type": "CODE", "id": "cm2xyz222" },
      { "type": "UPLOADS", "id": "cm2xyz333" }
    ],
    "failed": [],
    "totalSize": 125829120,
    "duration": 45000
  },
  "message": "All backups created successfully"
}
```

---

### DELETE /backup/:id
Elimina un backup

#### Request
```http
DELETE /api/backup/cm2xyz123
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Response 200 OK
```json
{
  "success": true,
  "data": null,
  "message": "Backup deleted successfully"
}
```

---

### GET /backup/:id/download
Scarica un file di backup

#### Request
```http
GET /api/backup/cm2xyz123/download
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Response 200 OK
```
Content-Type: application/gzip
Content-Disposition: attachment; filename="db-2025-09-26-10-30-00.sql.gz"
Content-Length: 52428800

[Binary data]
```

---

## 🧹 CLEANUP ENDPOINTS

### POST /backup/cleanup-dev
Esegue il cleanup dei file temporanei

#### Request
```http
POST /api/backup/cleanup-dev
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "dryRun": false,
  "force": false
}
```

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "movedCount": 42,
    "cleanupDir": "CLEANUP-2025-09-26-10-30-00",
    "totalSize": 15728640,
    "patterns": ["*.backup-*", "*.tmp", "*.log"],
    "duration": 2500,
    "details": {
      "scannedFiles": 150,
      "matchedFiles": 42,
      "excludedFiles": 5,
      "errors": []
    }
  },
  "message": "Cleanup completed successfully"
}
```

---

### GET /backup/cleanup-dirs
Lista tutte le cartelle di cleanup create

#### Response 200 OK
```json
{
  "success": true,
  "data": [
    {
      "name": "CLEANUP-2025-09-26-10-30-00",
      "path": "/backup-cleanup/CLEANUP-2025-09-26-10-30-00",
      "size": "15.7 MB",
      "fileCount": 42,
      "createdAt": "2025-09-26T10:30:00Z"
    },
    {
      "name": "CLEANUP-2025-09-25-14-20-00",
      "path": "/backup-cleanup/CLEANUP-2025-09-25-14-20-00",
      "size": "8.3 MB",
      "fileCount": 23,
      "createdAt": "2025-09-25T14:20:00Z"
    }
  ],
  "message": "Cleanup directories retrieved successfully"
}
```

---

### DELETE /backup/cleanup-dirs/:name
Elimina definitivamente una cartella di cleanup

#### Request
```http
DELETE /api/backup/cleanup-dirs/CLEANUP-2025-09-26-10-30-00
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "confirm": true
}
```

#### Response 200 OK
```json
{
  "success": true,
  "data": null,
  "message": "Cartella CLEANUP-2025-09-26-10-30-00 eliminata definitivamente"
}
```

#### Response 400 Bad Request
```json
{
  "success": false,
  "error": "Conferma richiesta per eliminare la cartella",
  "code": "CONFIRMATION_REQUIRED"
}
```

---

## ⚙️ CONFIGURAZIONE ENDPOINTS

### GET /cleanup/config
Ottieni la configurazione corrente

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "id": "config123",
    "name": "default",
    "isActive": true,
    "targetDirectory": "/Users/lucamambelli/Desktop/backup-cleanup",
    "projectPath": "/Users/lucamambelli/Desktop/Richiesta-Assistenza",
    "directoryFormat": "CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}",
    "maxDepth": 3,
    "bufferSize": 104857600,
    "timeout": 60000,
    "retentionDays": 30,
    "autoCleanup": false,
    "autoCleanupDays": 7,
    "createReadme": true,
    "preserveStructure": true,
    "notifyOnCleanup": true,
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-09-26T10:30:00Z"
  },
  "message": "Configuration retrieved successfully"
}
```

---

### PUT /cleanup/config
Aggiorna la configurazione

#### Request
```http
PUT /api/cleanup/config
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "targetDirectory": "/new/backup/path",
  "retentionDays": 60,
  "autoCleanup": true,
  "autoCleanupDays": 3,
  "notifyOnCleanup": false
}
```

#### Response 200 OK
```json
{
  "success": true,
  "data": {
    "id": "config123",
    "name": "default",
    "targetDirectory": "/new/backup/path",
    "retentionDays": 60,
    "autoCleanup": true,
    "autoCleanupDays": 3,
    "notifyOnCleanup": false,
    "updatedAt": "2025-09-26T11:00:00Z"
  },
  "message": "Configuration updated successfully"
}
```

---

### GET /cleanup/patterns
Lista tutti i pattern configurati

#### Response 200 OK
```json
{
  "success": true,
  "data": [
    {
      "id": "pattern1",
      "pattern": "*.backup-*",
      "description": "File di backup temporanei",
      "isActive": true,
      "category": "BACKUP",
      "priority": 10
    },
    {
      "id": "pattern2",
      "pattern": "*.tmp",
      "description": "File temporanei",
      "isActive": true,
      "category": "TEMP",
      "priority": 5
    }
  ],
  "message": "Patterns retrieved successfully"
}
```

---

### POST /cleanup/patterns
Aggiungi un nuovo pattern

#### Request
```http
POST /api/cleanup/patterns
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "pattern": "*.cache",
  "description": "File di cache",
  "category": "CACHE",
  "priority": 3,
  "isActive": true
}
```

#### Response 201 Created
```json
{
  "success": true,
  "data": {
    "id": "pattern3",
    "pattern": "*.cache",
    "description": "File di cache",
    "category": "CACHE",
    "priority": 3,
    "isActive": true,
    "createdAt": "2025-09-26T11:00:00Z"
  },
  "message": "Pattern added successfully"
}
```

---

### DELETE /cleanup/patterns/:id
Elimina un pattern

#### Request
```http
DELETE /api/cleanup/patterns/pattern3
Authorization: Bearer YOUR_JWT_TOKEN
```

#### Response 200 OK
```json
{
  "success": true,
  "data": null,
  "message": "Pattern deleted successfully"
}
```

---

## 🔄 RESPONSE CODES

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## 📝 ERROR RESPONSE FORMAT

Tutti gli errori seguono questo formato:

```json
{
  "success": false,
  "error": "Messaggio di errore leggibile",
  "code": "ERROR_CODE",
  "details": "Dettagli tecnici opzionali",
  "timestamp": "2025-09-26T11:00:00Z"
}
```

### Codici di Errore Comuni

| Code | Description |
|------|-------------|
| AUTH_REQUIRED | Autenticazione richiesta |
| INSUFFICIENT_PERMISSIONS | Permessi insufficienti |
| VALIDATION_ERROR | Dati non validi |
| BACKUP_ERROR | Errore creazione backup |
| CLEANUP_ERROR | Errore durante cleanup |
| FILE_NOT_FOUND | File non trovato |
| DISK_FULL | Spazio insufficiente |
| TIMEOUT | Operazione timeout |
| RATE_LIMIT | Limite richieste superato |

---

## 🚀 ESEMPI DI UTILIZZO

### Esempio: Backup completo con cleanup

```javascript
// 1. Crea backup di tutto
const backupResponse = await fetch('/api/backup/all', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// 2. Esegui cleanup
const cleanupResponse = await fetch('/api/backup/cleanup-dev', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

// 3. Verifica risultati
const dirsResponse = await fetch('/api/backup/cleanup-dirs', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const dirs = await dirsResponse.json();
console.log(`Creata cartella: ${dirs.data[0].name}`);
```

### Esempio: Configurazione pattern personalizzati

```javascript
// 1. Ottieni configurazione attuale
const config = await fetch('/api/cleanup/config', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Aggiungi nuovo pattern
await fetch('/api/cleanup/patterns', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    pattern: '*.old',
    description: 'File vecchi',
    category: 'OLD',
    priority: 1
  })
});

// 3. Aggiorna configurazione
await fetch('/api/cleanup/config', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    autoCleanup: true,
    autoCleanupDays: 7
  })
});
```

---

## 📚 LINK CORRELATI

- [Documentazione Completa](./DOCUMENTAZIONE-COMPLETA.md)
- [Configurazione](./CONFIGURAZIONE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

---

**Versione API**: 2.0  
**Ultimo aggiornamento**: 26 Settembre 2025
