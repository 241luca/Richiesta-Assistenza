# 📊 SISTEMA AUDIT LOG - DOCUMENTAZIONE COMPLETA
**Versione**: 1.0.0  
**Data**: 7 Settembre 2025  
**Autore**: Team Sviluppo

---

## 📋 INDICE

1. [Introduzione](#1-introduzione)
2. [Architettura del Sistema](#2-architettura-del-sistema)
3. [Funzionalità Implementate](#3-funzionalità-implementate)
4. [Interfaccia Utente](#4-interfaccia-utente)
5. [API Endpoints](#5-api-endpoints)
6. [Database Schema](#6-database-schema)
7. [Configurazione](#7-configurazione)
8. [Guida per gli Sviluppatori](#8-guida-per-gli-sviluppatori)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. INTRODUZIONE

### 🎯 Scopo
Il Sistema di Audit Log è un componente fondamentale per la sicurezza e la conformità dell'applicazione. Registra automaticamente tutte le attività che avvengono nel sistema, fornendo una traccia completa e immutabile delle operazioni.

### ✨ Caratteristiche Principali
- **Logging Automatico**: Ogni operazione API viene registrata automaticamente
- **Tracciabilità Completa**: Chi, Cosa, Quando, Dove, Come e Perché
- **Conformità GDPR**: Rispetta tutti i requisiti di audit trail
- **Performance Ottimizzata**: Non impatta le prestazioni del sistema
- **Interfaccia Intuitiva**: Dashboard completa con filtri e statistiche

### 📊 Numeri Chiave
- **Operazioni Tracciate**: 100% delle API calls
- **Retention Period**: Da 7 giorni a 2 anni (configurabile)
- **Performance Impact**: < 5ms per operazione
- **Storage**: ~500 bytes per record

---

## 2. ARCHITETTURA DEL SISTEMA

### 🏗️ Componenti Principali

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Dashboard │  │   Filters  │  │  Detail Modal    │  │
│  │  Component │  │  Component │  │   Component      │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Express.js)                   │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │ Middleware │  │   Routes   │  │    Service       │  │
│  │ auditLogger│→ │ /api/audit │→ │ auditLogService  │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────┐
│                  DATABASE (PostgreSQL)                   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              AuditLog Table                      │   │
│  │  id, timestamp, action, entityType, userId...   │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 📁 Struttura File

```
richiesta-assistenza/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auditLogger.ts         # Middleware di logging
│   │   ├── services/
│   │   │   └── auditLog.service.ts    # Business logic
│   │   ├── routes/
│   │   │   └── audit.routes.ts        # API endpoints
│   │   └── utils/
│   │       └── safeAuditLog.ts        # Wrapper sicuro
│   └── prisma/
│       └── schema.prisma               # Schema DB con AuditLog
│
└── src/
    └── components/
        └── admin/
            └── audit/
                ├── AuditDashboard.tsx  # Component principale
                ├── AuditLogTable.tsx   # Tabella logs
                ├── AuditLogDetail.tsx  # Modal dettaglio
                ├── AuditFilters.tsx    # Filtri ricerca
                ├── AuditStatistics.tsx # Grafici statistiche
                ├── AuditAlerts.tsx     # Sistema alert
                └── AuditInfo.tsx       # Tab informazioni
```

---

## 3. FUNZIONALITÀ IMPLEMENTATE

### ✅ Funzionalità Core

#### 1. **Logging Automatico**
```typescript
// Ogni chiamata API viene automaticamente loggata
app.use('/api', auditLogger({
  captureBody: req.method !== 'GET',
  category: 'API'
}));
```

#### 2. **Tracciamento Completo**
Ogni log registra:
- **Chi**: User ID, Email, Role, IP Address
- **Cosa**: Action, Entity Type, Entity ID
- **Quando**: Timestamp preciso al millisecondo
- **Dove**: Endpoint, Method, User Agent
- **Come**: Status Code, Response Time
- **Perché**: Metadata, Old/New Values

#### 3. **Categorizzazione Intelligente**
```typescript
// Il sistema identifica automaticamente il tipo di entità
'auth/login' → 'Authentication'
'users/profile' → 'User'
'requests/create' → 'AssistanceRequest'
'quotes/update' → 'Quote'
// ... e molti altri
```

#### 4. **Livelli di Severità**
- **DEBUG**: Informazioni di sviluppo
- **INFO**: Operazioni normali
- **WARNING**: Eventi che richiedono attenzione
- **ERROR**: Errori recuperabili
- **CRITICAL**: Errori che richiedono intervento immediato

### 🎨 Funzionalità UI

#### 1. **Dashboard Principale**
- Vista tabellare con paginazione
- Ordinamento per colonna
- Ricerca e filtri avanzati
- Export in CSV

#### 2. **Modal Dettaglio** (NUOVO!)
Cliccando su una riga si apre un modal con:
- Informazioni principali dell'operazione
- Dettagli utente completi
- Informazioni tecniche (endpoint, response time)
- Errori e stack trace (se presenti)
- Valori modificati (before/after)
- Metadata aggiuntivi in JSON

#### 3. **Tab Informazioni** (NUOVO!)
Documentazione integrata che spiega:
- Cosa viene tracciato
- Come usare i filtri
- Livelli di severità
- Politiche di retention
- Conformità GDPR

#### 4. **Statistiche Real-time**
- Operazioni totali
- Tasso di successo
- Utenti attivi
- Operazioni fallite

---

## 4. INTERFACCIA UTENTE

### 🖥️ Dashboard Overview

```
┌──────────────────────────────────────────────────────┐
│  Sistema Audit Log                                   │
│  ┌─────┬──────────┬────────┬──────────────┐        │
│  │Logs │Statistics│ Alerts │ Informazioni  │ ← TABS │
│  └─────┴──────────┴────────┴──────────────┘        │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📊 128 Totali | ❌ 15 Fallite | 88% Success │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │         FILTRI DI RICERCA                    │   │
│  │  [Azione ▼] [Entità ▼] [Data] [Utente]     │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │  TIMESTAMP │ UTENTE │ AZIONE │ ENTITÀ │ ... │   │
│  ├──────────────────────────────────────────────┤   │
│  │  07/09 20:33│ admin  │ LOGIN  │ User   │ ✓   │← Click per dettagli
│  │  07/09 20:32│ sistema│ READ   │ Audit  │ ✓   │   │
│  │  ...       │ ...    │ ...    │ ...    │ ... │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  [← Precedente] Pagina 1 di 3 [Successiva →]       │
└──────────────────────────────────────────────────────┘
```

### 📝 Modal Dettaglio

```
┌─────────────────────────────────────────────────────┐
│  Dettaglio Log di Audit                        [X] │
│  ID: abc123-def456-789                             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📋 INFORMAZIONI PRINCIPALI                        │
│  ┌─────────────────────────────────────────────┐   │
│  │ Timestamp: 07/09/2025 20:33:06              │   │
│  │ Azione: LOGIN_SUCCESS                       │   │
│  │ Entità: User (id: 525304b0...)             │   │
│  │ Risultato: ✅ Successo (HTTP 200)          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  👤 INFORMAZIONI UTENTE                            │
│  ┌─────────────────────────────────────────────┐   │
│  │ Nome: Super Admin                           │   │
│  │ Email: admin@assistenza.it                  │   │
│  │ Ruolo: SUPER_ADMIN                          │   │
│  │ IP: 127.0.0.1                               │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  🔧 DETTAGLI TECNICI                               │
│  ┌─────────────────────────────────────────────┐   │
│  │ Endpoint: POST /api/auth/login              │   │
│  │ Response Time: 234ms                        │   │
│  │ Request ID: abc-123-def                     │   │
│  │ User Agent: Mozilla/5.0 ...                 │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│                              [Chiudi]               │
└─────────────────────────────────────────────────────┘
```

---

## 5. API ENDPOINTS

### 🔌 Endpoints Disponibili

#### GET /api/audit/logs
Recupera i log con filtri opzionali.

**Query Parameters:**
```typescript
{
  action?: string;        // LOGIN, CREATE, UPDATE, DELETE
  entityType?: string;    // User, Request, Quote
  category?: string;      // SECURITY, BUSINESS, SYSTEM
  severity?: string;      // INFO, WARNING, ERROR
  success?: boolean;      // true/false
  userId?: string;        // UUID dell'utente
  entityId?: string;      // ID dell'entità
  fromDate?: string;      // Data inizio (ISO)
  toDate?: string;        // Data fine (ISO)
  limit?: number;         // Default: 50
  offset?: number;        // Per paginazione
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "cm0w3x4nh0001vw7k5czd8fak",
        "timestamp": "2025-09-07T18:33:06.000Z",
        "action": "LOGIN_SUCCESS",
        "entityType": "User",
        "entityId": "525304b0-88b7-4c57-8fee",
        "userId": "525304b0-88b7-4c57-8fee",
        "userEmail": "admin@assistenza.it",
        "userRole": "SUPER_ADMIN",
        "ipAddress": "127.0.0.1",
        "userAgent": "Mozilla/5.0...",
        "success": true,
        "statusCode": 200,
        "responseTime": 234,
        "severity": "INFO",
        "category": "SECURITY"
      }
    ],
    "total": 128,
    "page": 1,
    "totalPages": 3
  }
}
```

#### GET /api/audit/statistics
Ottiene statistiche aggregate.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLogs": 128,
    "failedOperations": 15,
    "uniqueUsers": 3,
    "successRate": 88.28,
    "logsByAction": {
      "LOGIN_SUCCESS": 45,
      "CREATE": 30,
      "UPDATE": 25,
      "DELETE": 10
    },
    "logsByCategory": {
      "SECURITY": 50,
      "BUSINESS": 60,
      "SYSTEM": 18
    }
  }
}
```

#### GET /api/audit/export
Esporta i log in formato CSV.

#### GET /api/audit/user/:userId
Recupera tutti i log di un utente specifico.

#### POST /api/audit/search
Ricerca avanzata con query complesse.

---

## 6. DATABASE SCHEMA

### 📊 Tabella AuditLog

```prisma
model AuditLog {
  id            String    @id @default(cuid())
  timestamp     DateTime  @default(now())
  
  // User Information
  userId        String?
  userEmail     String?
  userRole      String?
  user          User?     @relation(fields: [userId], references: [id])
  
  // Action Information
  action        AuditAction
  entityType    String
  entityId      String?
  
  // Request Information
  ipAddress     String
  userAgent     String
  endpoint      String?
  method        String?
  
  // Response Information
  success       Boolean   @default(true)
  statusCode    Int?
  responseTime  Int?      // in milliseconds
  errorMessage  String?
  
  // Classification
  severity      LogSeverity
  category      LogCategory
  
  // Additional Data
  oldValues     Json?
  newValues     Json?
  changes       Json?
  metadata      Json?
  
  // Tracking
  sessionId     String?
  requestId     String?
  
  @@index([userId])
  @@index([timestamp])
  @@index([action])
  @@index([entityType])
  @@index([category])
  @@index([severity])
}

enum AuditAction {
  // Authentication
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  REGISTER
  PASSWORD_CHANGE
  PASSWORD_RESET
  TWO_FA_ENABLED
  TWO_FA_DISABLED
  
  // CRUD Operations
  CREATE
  READ
  UPDATE
  DELETE
  
  // Business Operations
  REQUEST_CREATED
  REQUEST_ASSIGNED
  REQUEST_COMPLETED
  QUOTE_SENT
  QUOTE_ACCEPTED
  PAYMENT_PROCESSED
  
  // System Operations
  BACKUP_CREATED
  SYSTEM_CONFIG_CHANGED
  API_KEY_CREATED
  PERMISSION_CHANGED
}

enum LogSeverity {
  DEBUG
  INFO
  WARNING
  ERROR
  CRITICAL
}

enum LogCategory {
  SECURITY
  BUSINESS
  SYSTEM
  API
  PERFORMANCE
  COMPLIANCE
}
```

### 🔍 Indici Database

```sql
-- Performance indexes
CREATE INDEX idx_audit_timestamp ON "AuditLog"(timestamp DESC);
CREATE INDEX idx_audit_user ON "AuditLog"(userId);
CREATE INDEX idx_audit_action ON "AuditLog"(action);
CREATE INDEX idx_audit_entity ON "AuditLog"(entityType, entityId);
CREATE INDEX idx_audit_category ON "AuditLog"(category);
CREATE INDEX idx_audit_severity ON "AuditLog"(severity);

-- Composite indexes for common queries
CREATE INDEX idx_audit_user_time ON "AuditLog"(userId, timestamp DESC);
CREATE INDEX idx_audit_entity_time ON "AuditLog"(entityType, timestamp DESC);
```

---

## 7. CONFIGURAZIONE

### ⚙️ Variabili d'Ambiente

```env
# Audit Log Configuration
AUDIT_LOG_ENABLED=true
AUDIT_LOG_LEVEL=INFO              # DEBUG|INFO|WARNING|ERROR|CRITICAL
AUDIT_CAPTURE_BODY=true           # Cattura request body
AUDIT_CAPTURE_RESPONSE=false      # Cattura response (attenzione performance)
AUDIT_RETENTION_DAYS=90           # Giorni di retention default
AUDIT_MAX_RECORDS=1000000         # Max records prima di cleanup
```

### 🔧 Configurazione Middleware

```typescript
// backend/src/server.ts

// Configurazione globale
app.use('/api', auditLogger({
  captureBody: process.env.AUDIT_CAPTURE_BODY === 'true',
  captureResponse: process.env.AUDIT_CAPTURE_RESPONSE === 'true',
  category: LogCategory.API
}));

// Configurazione specifica per auth
app.use('/api/auth', auditAuth(AuditAction.LOGIN_SUCCESS));

// Configurazione per operazioni critiche
app.use('/api/admin', auditCritical('Admin', AuditAction.UPDATE));
```

### 📅 Politiche di Retention

```typescript
// backend/src/jobs/auditCleanup.job.ts
const retentionPolicies = {
  [LogCategory.SECURITY]: 730,    // 2 anni
  [LogCategory.BUSINESS]: 365,    // 1 anno
  [LogCategory.SYSTEM]: 180,      // 6 mesi
  [LogCategory.API]: 90,          // 3 mesi
  [LogCategory.PERFORMANCE]: 30,  // 1 mese
  [LogCategory.COMPLIANCE]: 2555  // 7 anni (requisiti legali)
};
```

---

## 8. GUIDA PER GLI SVILUPPATORI

### 🚀 Come Aggiungere Logging a un Nuovo Endpoint

#### Metodo 1: Automatico (Raccomandato)
Il logging è già attivo per tutti gli endpoint `/api/*`. Non serve fare nulla!

#### Metodo 2: Logging Specifico
```typescript
// routes/myRoute.ts
import { auditLogger } from '../middleware/auditLogger';

router.post('/critical-operation',
  authenticate,
  auditLogger({
    action: AuditAction.CRITICAL_OPERATION,
    category: LogCategory.BUSINESS,
    captureBody: true
  }),
  async (req, res) => {
    // Your logic here
  }
);
```

#### Metodo 3: Logging Manuale nel Service
```typescript
// services/myService.ts
import { safeAuditLog } from '../utils/safeAuditLog';

async function criticalOperation(data: any) {
  try {
    // Operation logic
    const result = await doSomething(data);
    
    // Log success
    await safeAuditLog({
      action: AuditAction.CREATE,
      entityType: 'MyEntity',
      entityId: result.id,
      success: true,
      severity: LogSeverity.INFO,
      category: LogCategory.BUSINESS,
      metadata: { customData: 'value' }
    });
    
    return result;
  } catch (error) {
    // Log failure
    await safeAuditLog({
      action: AuditAction.CREATE,
      entityType: 'MyEntity',
      success: false,
      severity: LogSeverity.ERROR,
      category: LogCategory.BUSINESS,
      errorMessage: error.message
    });
    throw error;
  }
}
```

### 🎨 Come Aggiungere una Nuova Entità

1. **Aggiungi il mapping nel middleware:**
```typescript
// middleware/auditLogger.ts
const entityMap: Record<string, string> = {
  // ... existing mappings
  'my-new-endpoint': 'MyNewEntity',
  'my-new-endpoint/subresource': 'MyNewSubEntity'
};
```

2. **Aggiungi l'enum se necessario:**
```prisma
// schema.prisma
enum AuditAction {
  // ... existing actions
  MY_NEW_ACTION
}
```

3. **Rigenera Prisma Client:**
```bash
cd backend
npx prisma generate
```

### 🔍 Query Utili per Analisi

```typescript
// Trova tutti i login falliti nelle ultime 24 ore
const failedLogins = await prisma.auditLog.findMany({
  where: {
    action: 'LOGIN_FAILED',
    timestamp: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
    }
  },
  orderBy: { timestamp: 'desc' }
});

// Trova operazioni lente (>1000ms)
const slowOperations = await prisma.auditLog.findMany({
  where: {
    responseTime: { gt: 1000 }
  },
  orderBy: { responseTime: 'desc' },
  take: 10
});

// Statistiche per utente
const userStats = await prisma.auditLog.groupBy({
  by: ['userId', 'action'],
  _count: true,
  where: {
    userId: 'user-id-here'
  }
});
```

---

## 9. TROUBLESHOOTING

### 🐛 Problemi Comuni e Soluzioni

#### Problema: "Unknown" come EntityType
**Causa**: Il path dell'endpoint non è mappato.
**Soluzione**: Aggiungi il mapping in `entityMap` nel file `auditLogger.ts`.

#### Problema: Log non vengono creati
**Causa**: Il middleware potrebbe non essere attivo.
**Soluzione**: 
1. Verifica che `AUDIT_LOG_ENABLED=true` in `.env`
2. Controlla che il middleware sia prima delle routes in `server.ts`
3. Verifica i log del server per errori

#### Problema: Performance degradata
**Causa**: Troppi log o query non ottimizzate.
**Soluzione**:
1. Attiva la compressione: `AUDIT_CAPTURE_BODY=false`
2. Riduci il livello di log: `AUDIT_LOG_LEVEL=WARNING`
3. Aggiungi indici mancanti al database
4. Implementa cleanup job per vecchi log

#### Problema: Modal dettaglio non si apre
**Causa**: Potrebbe mancare l'handler onClick.
**Soluzione**: Verifica che `AuditLogTable.tsx` abbia `onClick={() => handleRowClick(log)}`.

### 📝 Log di Debug

Per abilitare log di debug dettagliati:

```typescript
// backend/.env
AUDIT_LOG_LEVEL=DEBUG
DEBUG=audit:*

// Frontend: Apri console browser (F12)
localStorage.setItem('debug', 'audit:*');
```

### 🔧 Script di Manutenzione

```bash
# Verifica numero di log
cd backend
npx ts-node src/scripts/check-audit-stats.ts

# Pulizia manuale log vecchi
npx ts-node src/scripts/cleanup-old-logs.ts

# Export backup log
npx ts-node src/scripts/export-audit-logs.ts

# Test sistema audit
npx ts-node src/scripts/test-audit-complete.ts
```

---

## 📚 APPENDICI

### A. Esempi di Filtri Avanzati

```javascript
// Trova tutte le operazioni di un utente in un giorno
filters = {
  userId: "user-123",
  fromDate: "2025-09-07T00:00:00Z",
  toDate: "2025-09-07T23:59:59Z"
}

// Trova tutti gli errori critici
filters = {
  severity: "CRITICAL",
  success: false
}

// Trova modifiche a entità specifiche
filters = {
  entityType: "AssistanceRequest",
  action: "UPDATE"
}
```

### B. Metriche e KPI

**Metriche monitorate:**
- Operazioni per secondo (OPS)
- Tempo medio di risposta
- Tasso di errore per endpoint
- Utenti attivi per ora/giorno
- Pattern di accesso anomali

### C. Compliance e Normative

**GDPR Compliance:**
- ✅ Right to Access: Export dei propri log
- ✅ Right to Rectification: Log delle modifiche
- ✅ Right to Erasure: Anonimizzazione dopo retention
- ✅ Data Portability: Export in CSV/JSON
- ✅ Audit Trail: Tracciabilità completa

---

**FINE DOCUMENTAZIONE**

Ultimo aggiornamento: 7 Settembre 2025
Mantenuto da: Team Sviluppo LM Tecnologie
