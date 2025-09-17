# 📬 SISTEMA NOTIFICHE - DOCUMENTAZIONE TECNICA COMPLETA v2.0

## 📋 INDICE GENERALE
1. [Overview Architetturale](#1-overview-architetturale)
2. [Installazione e Configurazione](#2-installazione-e-configurazione)
3. [Architettura del Sistema](#3-architettura-del-sistema)
4. [Backend - Implementazione](#4-backend---implementazione)
5. [Frontend - Dashboard Admin](#5-frontend---dashboard-admin)
6. [API Reference Completa](#6-api-reference-completa)
7. [Database Schema](#7-database-schema)
8. [WebSocket Integration](#8-websocket-integration)
9. [Testing e Quality Assurance](#9-testing-e-quality-assurance)
10. [Deployment e Production](#10-deployment-e-production)
11. [Monitoring e Maintenance](#11-monitoring-e-maintenance)
12. [Troubleshooting Guide](#12-troubleshooting-guide)
13. [Best Practices](#13-best-practices)
14. [Security Considerations](#14-security-considerations)
15. [Performance Optimization](#15-performance-optimization)

---

## 1. OVERVIEW ARCHITETTURALE

### 1.1 Introduzione
Il Sistema di Notifiche è un servizio enterprise-grade per la gestione unificata di tutte le comunicazioni dell'applicazione Richiesta Assistenza. Progettato per scalabilità, affidabilità e facilità di manutenzione.

### 1.2 Caratteristiche Principali

#### Core Features
- **🔄 Multi-canale**: WebSocket (real-time), Email (SMTP), SMS (ready), Push (ready)
- **📊 Priorità Dinamiche**: 4 livelli (low, normal, high, urgent) con queue management
- **📝 Template System**: 30+ template predefiniti con variabili dinamiche
- **👤 Preferenze Utente**: Configurazione personalizzata per utente
- **⚡ Real-time**: WebSocket con Socket.io per notifiche istantanee
- **📈 Analytics**: Dashboard completa con metriche e KPI
- **🔍 Audit Trail**: Log completo di tutte le operazioni
- **🔄 Retry Logic**: Reinvio automatico con exponential backoff
- **🛡️ Rate Limiting**: Protezione contro spam e abuse
- **🌍 Multi-lingua**: Support per IT, EN, ES, FR (ready)

### 1.3 Architettura High-Level

```
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  Services | Routes | Controllers | WebSocket Handlers    │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│              NOTIFICATION SERVICE (Core)                 │
│    notification.service.ts - Singleton Pattern           │
│    • Send Logic • Template Processing • Queue Management │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                   DELIVERY CHANNELS                      │
├─────────────┬─────────────┬──────────────┬──────────────┤
│  WebSocket  │    Email    │     SMS      │    Push      │
│ (Socket.io) │(Nodemailer) │  (Twilio)    │    (FCM)     │
│   ACTIVE    │   ACTIVE    │    READY     │    READY     │
└─────────────┴─────────────┴──────────────┴──────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                          │
├─────────────┬─────────────┬──────────────┬──────────────┤
│ PostgreSQL  │    Redis    │  File Store  │   Backup     │
│  (Primary)  │   (Cache)   │   (Media)    │    (S3)      │
└─────────────┴─────────────┴──────────────┴──────────────┘
```

### 1.4 Tech Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Runtime** | Node.js | 18+ LTS | Server runtime |
| **Framework** | Express.js | 4.x | HTTP server |
| **Language** | TypeScript | 5.9+ | Type safety |
| **Database** | PostgreSQL | 14+ | Primary storage |
| **ORM** | Prisma | 6.15+ | Database access |
| **Cache** | Redis | 7+ | Session & queue |
| **WebSocket** | Socket.io | 4.x | Real-time |
| **Queue** | Bull | 4.x | Job processing |
| **Email** | Nodemailer | 6.x | Email delivery |
| **Frontend** | React | 18.3+ | UI framework |
| **State** | TanStack Query | 5.x | Server state |
| **UI** | TailwindCSS | 3.4+ | Styling |

---

## 2. INSTALLAZIONE E CONFIGURAZIONE

### 2.1 Prerequisiti

```bash
# Versioni richieste
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
psql --version  # >= 14.0
redis-cli ping  # PONG
```

### 2.2 Installazione

```bash
# 1. Clone repository
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd richiesta-assistenza

# 2. Installa dipendenze backend
cd backend
npm install

# 3. Installa dipendenze frontend
cd ..
npm install

# 4. Setup database
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma db seed

# 5. Copia e configura .env
cp .env.example .env
# Modifica .env con le tue configurazioni
```

### 2.3 Configurazione Environment

```env
# ===== DATABASE =====
DATABASE_URL="postgresql://user:password@localhost:5432/richiesta_assistenza"

# ===== REDIS =====
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# ===== JWT =====
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="30d"

# ===== FRONTEND =====
FRONTEND_URL="http://localhost:5193"

# ===== EMAIL CONFIGURATION =====
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="Richiesta Assistenza <noreply@assistenza.com>"
EMAIL_REPLY_TO="support@assistenza.com"

# ===== SMS CONFIGURATION (Optional) =====
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="xxxxxxxxxxxxxxxxx"
TWILIO_PHONE_NUMBER="+1234567890"
SMS_ENABLED=false

# ===== PUSH NOTIFICATIONS (Optional) =====
FCM_SERVER_KEY="AAAAxxxxxxxxx"
FCM_SENDER_ID="123456789"
PUSH_ENABLED=false

# ===== RATE LIMITING =====
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_EMAIL_PER_HOUR=20
RATE_LIMIT_SMS_PER_DAY=10

# ===== MONITORING =====
LOG_LEVEL="info"  # debug, info, warn, error
LOG_TO_FILE=true
LOG_DIR="./logs"

# ===== FEATURES FLAGS =====
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=false
ENABLE_PUSH_NOTIFICATIONS=false
ENABLE_NOTIFICATION_DIGEST=true
ENABLE_NOTIFICATION_BATCHING=false
```

### 2.4 Avvio del Sistema

```bash
# Terminal 1 - Redis
redis-server

# Terminal 2 - Backend (porta 3200)
cd backend
npm run dev

# Terminal 3 - Frontend (porta 5193)
npm run dev

# Verifica sistema
curl http://localhost:3200/health
# Browser: http://localhost:5193
```

---

## 3. ARCHITETTURA DEL SISTEMA

### 3.1 Struttura Directory

```
richiesta-assistenza/
├── 📁 backend/
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   ├── database.ts
│   │   │   ├── redis.ts
│   │   │   └── notificationTypes.ts    # ⭐ Tipi notifiche
│   │   ├── 📁 services/
│   │   │   ├── notification.service.ts # ⭐ Core service
│   │   │   ├── email.service.ts
│   │   │   └── websocket.service.ts
│   │   ├── 📁 routes/
│   │   │   ├── notification.routes.ts
│   │   │   ├── notificationAdmin.routes.ts # ⭐ Admin API
│   │   │   └── notificationTemplate.routes.ts
│   │   ├── 📁 websocket/
│   │   │   └── handlers/
│   │   │       └── notification.handler.ts # ⭐ WebSocket
│   │   ├── 📁 utils/
│   │   │   ├── errors.ts
│   │   │   ├── logger.ts
│   │   │   └── responseFormatter.ts
│   │   └── server.ts
│   ├── 📁 prisma/
│   │   └── schema.prisma
│   └── README-NOTIFICHE.md
│
├── 📁 src/ (Frontend)
│   ├── 📁 components/
│   │   └── 📁 notifications/
│   │       ├── NotificationDashboard.tsx # ⭐ Dashboard
│   │       ├── NotificationStats.tsx
│   │       ├── EventManager.tsx
│   │       ├── TemplateEditor.tsx
│   │       └── NotificationBadge.tsx
│   └── 📁 pages/
│       └── 📁 admin/
│           └── (dashboard su /admin/notifications)
│
├── 📁 scripts/
│   ├── test-notification-system.sh
│   └── test-admin-dashboard.sh
│
└── 📁 docs/
    └── SISTEMA-NOTIFICHE.md
```

### 3.2 Flow Architetturale

```mermaid
sequenceDiagram
    participant APP as Application
    participant NS as NotificationService
    participant DB as Database
    participant QUEUE as Queue (Redis)
    participant WS as WebSocket
    participant EMAIL as Email Service
    participant USER as User

    APP->>NS: sendToUser(data)
    NS->>NS: Validate & Format
    NS->>DB: Save Notification
    NS->>QUEUE: Queue for delivery
    
    par WebSocket Delivery
        QUEUE->>WS: Process WebSocket
        WS->>USER: Real-time notification
    and Email Delivery
        QUEUE->>EMAIL: Process Email
        EMAIL->>USER: Send email
    end
    
    USER->>APP: Mark as read
    APP->>DB: Update status
```

### 3.3 Design Patterns Utilizzati

| Pattern | Implementazione | Scopo |
|---------|----------------|-------|
| **Singleton** | NotificationService | Istanza unica del servizio |
| **Repository** | Database access | Astrazione accesso dati |
| **Observer** | WebSocket events | Eventi real-time |
| **Factory** | Template creation | Creazione template dinamici |
| **Strategy** | Delivery channels | Strategia di invio |
| **Circuit Breaker** | External services | Gestione fallimenti |
| **Retry** | Failed notifications | Resilienza |
| **Queue** | Bull/Redis | Processing asincrono |

---

## 4. BACKEND - IMPLEMENTAZIONE

### 4.1 NotificationService (Core)

#### File: `/backend/src/services/notification.service.ts`

```typescript
class NotificationService {
  private io: Server | null = null;
  private prisma = new PrismaClient();
  
  // Singleton pattern
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Invia notifica a utente specifico
   * @param data - Dati notifica
   * @returns Notification creata
   */
  async sendToUser(data: NotificationData): Promise<Notification> {
    try {
      // 1. Validazione
      this.validateNotificationData(data);
      
      // 2. Salva nel database
      const notification = await this.saveToDatabase(data);
      
      // 3. Invia tramite canali
      await this.deliverToChannels(notification, data.channels);
      
      // 4. Log audit
      await this.logNotification(notification);
      
      return notification;
    } catch (error) {
      logger.error('Notification send failed:', error);
      throw error;
    }
  }

  /**
   * Invia a ruolo specifico
   */
  async sendToRole(role: string, data: NotificationData) {
    const users = await this.prisma.user.findMany({
      where: { role, emailVerified: true }
    });
    
    return Promise.allSettled(
      users.map(user => this.sendToUser({
        ...data,
        userId: user.id
      }))
    );
  }

  /**
   * Broadcast a tutti
   */
  async broadcastToAll(data: NotificationData) {
    return this.sendToRole('ALL', data);
  }
}
```

### 4.2 Tipi di Notifiche

#### File: `/backend/src/config/notificationTypes.ts`

```typescript
export enum NotificationType {
  // === RICHIESTE (10 tipi) ===
  NEW_REQUEST = 'NEW_REQUEST',
  REQUEST_CREATED = 'REQUEST_CREATED',
  REQUEST_ASSIGNED = 'REQUEST_ASSIGNED',
  REQUEST_STATUS_CHANGED = 'REQUEST_STATUS_CHANGED',
  REQUEST_UPDATED = 'REQUEST_UPDATED',
  REQUEST_CANCELLED = 'REQUEST_CANCELLED',
  REQUEST_COMPLETED = 'REQUEST_COMPLETED',
  REQUEST_REOPENED = 'REQUEST_REOPENED',
  REQUEST_URGENT = 'REQUEST_URGENT',
  PROFESSIONAL_ASSIGNED = 'PROFESSIONAL_ASSIGNED',
  
  // === INTERVENTI (8 tipi) ===
  INTERVENTIONS_PROPOSED = 'INTERVENTIONS_PROPOSED',
  INTERVENTION_ACCEPTED = 'INTERVENTION_ACCEPTED',
  INTERVENTION_REJECTED = 'INTERVENTION_REJECTED',
  INTERVENTION_RESCHEDULED = 'INTERVENTION_RESCHEDULED',
  INTERVENTION_REMINDER = 'INTERVENTION_REMINDER',
  INTERVENTION_STARTED = 'INTERVENTION_STARTED',
  INTERVENTION_COMPLETED = 'INTERVENTION_COMPLETED',
  INTERVENTION_CANCELLED = 'INTERVENTION_CANCELLED',
  
  // === PREVENTIVI (8 tipi) ===
  NEW_QUOTE = 'NEW_QUOTE',
  QUOTE_UPDATED = 'QUOTE_UPDATED',
  QUOTE_ACCEPTED = 'QUOTE_ACCEPTED',
  QUOTE_REJECTED = 'QUOTE_REJECTED',
  QUOTE_EXPIRED = 'QUOTE_EXPIRED',
  QUOTE_REMINDER = 'QUOTE_REMINDER',
  QUOTE_NEGOTIATION = 'QUOTE_NEGOTIATION',
  QUOTE_WITHDRAWN = 'QUOTE_WITHDRAWN',
  
  // === PAGAMENTI (10 tipi) ===
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  DEPOSIT_REQUIRED = 'DEPOSIT_REQUIRED',
  DEPOSIT_RECEIVED = 'DEPOSIT_RECEIVED',
  INVOICE_GENERATED = 'INVOICE_GENERATED',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_OVERDUE = 'PAYMENT_OVERDUE',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  
  // === UTENTI (12 tipi) ===
  WELCOME = 'WELCOME',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  EMAIL_VERIFICATION_REQUIRED = 'EMAIL_VERIFICATION_REQUIRED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED',
  ACCOUNT_REACTIVATED = 'ACCOUNT_REACTIVATED',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  LOGIN_SUSPICIOUS = 'LOGIN_SUSPICIOUS',
  
  // === CHAT/MESSAGGI (6 tipi) ===
  NEW_MESSAGE = 'NEW_MESSAGE',
  MESSAGE_READ = 'MESSAGE_READ',
  USER_TYPING = 'USER_TYPING',
  MESSAGE_DELETED = 'MESSAGE_DELETED',
  CHAT_ARCHIVED = 'CHAT_ARCHIVED',
  MENTION_IN_CHAT = 'MENTION_IN_CHAT',
  
  // === SISTEMA (8 tipi) ===
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_UPDATE = 'SYSTEM_UPDATE',
  DATA_EXPORT_READY = 'DATA_EXPORT_READY',
  BACKUP_COMPLETED = 'BACKUP_COMPLETED',
  SECURITY_ALERT = 'SECURITY_ALERT',
  API_LIMIT_WARNING = 'API_LIMIT_WARNING',
  SUBSCRIPTION_EXPIRING = 'SUBSCRIPTION_EXPIRING',
  NEW_FEATURE = 'NEW_FEATURE',
  
  // === PROFESSIONISTI (10 tipi) ===
  NEW_SKILL_ADDED = 'NEW_SKILL_ADDED',
  SKILL_APPROVED = 'SKILL_APPROVED',
  SKILL_REJECTED = 'SKILL_REJECTED',
  CERTIFICATION_EXPIRING = 'CERTIFICATION_EXPIRING',
  CERTIFICATION_EXPIRED = 'CERTIFICATION_EXPIRED',
  RATING_RECEIVED = 'RATING_RECEIVED',
  REVIEW_RECEIVED = 'REVIEW_RECEIVED',
  AVAILABILITY_REMINDER = 'AVAILABILITY_REMINDER',
  DOCUMENTS_REQUIRED = 'DOCUMENTS_REQUIRED',
  PROFILE_INCOMPLETE = 'PROFILE_INCOMPLETE'
}
```

### 4.3 Routes e Endpoints

#### File: `/backend/src/routes/notificationAdmin.routes.ts`

```typescript
// ===== ADMIN ENDPOINTS =====

// GET /api/notifications/stats
router.get('/stats', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  // Restituisce statistiche complete
  // - Totali per stato
  // - Breakdown per tipo
  // - Trend temporali
  // - Metriche di performance
});

// GET /api/notifications/logs
router.get('/logs', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  // Log completo con filtri
  // - Paginazione
  // - Filtri multipli
  // - Ordinamento
  // - Export CSV ready
});

// POST /api/notifications/test
router.post('/test', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  // Invio notifica di test
  // - Validazione Zod
  // - Multi-canale
  // - Preview mode
});

// POST /api/notifications/:id/resend
router.post('/:id/resend', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), async (req, res) => {
  // Reinvio notifica fallita
  // - Retry logic
  // - Audit trail
});

// POST /api/notifications/broadcast
router.post('/broadcast', authenticate, requireRole(['SUPER_ADMIN']), async (req, res) => {
  // Broadcast massivo
  // - Target per ruolo
  // - Batch processing
  // - Progress tracking
});
```

---

## 5. FRONTEND - DASHBOARD ADMIN

### 5.1 Dashboard Overview

#### URL: `http://localhost:5193/admin/notifications`
#### File: `/src/components/notifications/NotificationDashboard.tsx`

### 5.2 Componenti Dashboard

#### 5.2.1 Overview Tab
```typescript
const OverviewTab = () => {
  // Mostra:
  // - 4 card statistiche principali
  // - 2 grafici (tipo e canale)
  // - Trend 7 giorni
  // - Metriche real-time
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatsCard title="Totale" value={stats.total} icon={PaperAirplaneIcon} />
      <StatsCard title="Consegnate" value={stats.delivered} color="green" />
      <StatsCard title="Lette" value={stats.read} color="blue" />
      <StatsCard title="Fallite" value={stats.failed} color="red" />
    </div>
  );
};
```

#### 5.2.2 Logs Tab
```typescript
const LogsTab = () => {
  // Features:
  // - Tabella paginata
  // - 6 filtri (tipo, priorità, stato, ricerca, date)
  // - Azioni per riga (dettagli, reinvio)
  // - Export CSV
  // - Real-time updates
  
  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />
      <DataTable 
        data={logs}
        columns={columns}
        actions={['view', 'resend', 'delete']}
      />
      <Pagination total={total} page={page} onPageChange={setPage} />
    </div>
  );
};
```

#### 5.2.3 Test Tab
```typescript
const TestTab = () => {
  // Permette:
  // - Selezione destinatario
  // - Scelta tipo notifica
  // - Personalizzazione messaggio
  // - Selezione canali
  // - Preview prima dell'invio
  // - Broadcast a gruppi
  
  return (
    <TestNotificationForm 
      onSubmit={sendTestNotification}
      templates={templates}
      channels={['websocket', 'email', 'sms', 'push']}
    />
  );
};
```

### 5.3 State Management

```typescript
// React Query per server state
const { data: stats } = useQuery({
  queryKey: ['notification-stats'],
  queryFn: fetchStats,
  refetchInterval: 30000 // Aggiorna ogni 30 secondi
});

// Zustand per UI state
const useNotificationStore = create((set) => ({
  filters: {},
  selectedNotification: null,
  setFilters: (filters) => set({ filters }),
  setSelectedNotification: (n) => set({ selectedNotification: n })
}));
```

---

## 6. API REFERENCE COMPLETA

### 6.1 Autenticazione
Tutti gli endpoint richiedono JWT Bearer token:
```http
Authorization: Bearer <token>
```

### 6.2 Endpoints Pubblici (Autenticati)

#### GET /api/notifications
Recupera notifiche dell'utente corrente.

**Query Parameters:**
- `limit` (number): Max risultati (default: 20)
- `offset` (number): Skip iniziale
- `unread` (boolean): Solo non lette
- `type` (string): Filtra per tipo

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxx...",
      "type": "NEW_REQUEST",
      "title": "Nuova richiesta",
      "content": "Hai ricevuto una nuova richiesta",
      "priority": "NORMAL",
      "isRead": false,
      "createdAt": "2025-09-06T10:00:00Z",
      "metadata": {}
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0
  }
}
```

#### POST /api/notifications/:id/read
Marca notifica come letta.

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### POST /api/notifications/read-all
Marca tutte come lette.

#### GET /api/notifications/count
Conteggio non lette.

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

### 6.3 Endpoints Admin

#### GET /api/notifications/stats
**Richiede:** ADMIN o SUPER_ADMIN

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 10000,
    "sent": 9500,
    "delivered": 9200,
    "read": 7800,
    "failed": 300,
    "deliveryRate": 92.0,
    "readRate": 84.78,
    "failureRate": 3.0,
    "byType": [
      {"type": "NEW_REQUEST", "count": 3000},
      {"type": "NEW_QUOTE", "count": 2500}
    ],
    "byPriority": [
      {"priority": "HIGH", "count": 1500},
      {"priority": "NORMAL", "count": 7000}
    ],
    "byChannel": [
      {"channel": "websocket", "count": 8000},
      {"channel": "email", "count": 2000}
    ],
    "last7Days": [
      {"date": "2025-09-01", "count": 1200},
      {"date": "2025-09-02", "count": 1350}
    ]
  }
}
```

#### GET /api/notifications/logs
**Richiede:** ADMIN o SUPER_ADMIN

**Query Parameters:**
- `type` (string): Tipo notifica
- `priority` (string): Priorità
- `status` (string): Stato
- `search` (string): Ricerca testo
- `dateFrom` (date): Data inizio
- `dateTo` (date): Data fine
- `limit` (number): Limite risultati
- `offset` (number): Offset paginazione

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [...],
    "total": 5000,
    "limit": 100,
    "offset": 0
  }
}
```

#### POST /api/notifications/test
**Richiede:** ADMIN o SUPER_ADMIN

**Body:**
```json
{
  "email": "user@example.com",
  "type": "TEST_NOTIFICATION",
  "title": "Test Notification",
  "message": "This is a test",
  "priority": "normal",
  "channels": ["websocket", "email"]
}
```

#### POST /api/notifications/:id/resend
**Richiede:** ADMIN o SUPER_ADMIN

Reinvia una notifica fallita.

#### POST /api/notifications/broadcast
**Richiede:** SUPER_ADMIN

**Body:**
```json
{
  "role": "CLIENT",
  "type": "SYSTEM_UPDATE",
  "title": "Aggiornamento Sistema",
  "message": "Il sistema sarà aggiornato",
  "priority": "high",
  "channels": ["websocket", "email"]
}
```

---

## 7. DATABASE SCHEMA

### 7.1 Tabella Notification

```sql
CREATE TABLE "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "recipientId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "readAt" TIMESTAMP,
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL,
  
  FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Indici per performance
CREATE INDEX "idx_notification_recipient" ON "Notification"("recipientId");
CREATE INDEX "idx_notification_type" ON "Notification"("type");
CREATE INDEX "idx_notification_created" ON "Notification"("createdAt" DESC);
CREATE INDEX "idx_notification_unread" ON "Notification"("recipientId", "isRead") 
  WHERE "isRead" = false;
```

### 7.2 Tabella NotificationTemplate

```sql
CREATE TABLE "NotificationTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "subject" TEXT,
  "bodyHtml" TEXT,
  "bodyText" TEXT NOT NULL,
  "variables" JSONB,
  "channels" TEXT[],
  "priority" TEXT NOT NULL DEFAULT 'NORMAL',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

CREATE INDEX "idx_template_code" ON "NotificationTemplate"("code");
CREATE INDEX "idx_template_category" ON "NotificationTemplate"("category");
```

### 7.3 Tabella NotificationLog

```sql
CREATE TABLE "NotificationLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "notificationId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "attemptCount" INTEGER NOT NULL DEFAULT 1,
  "sentAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  "failureReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_log_notification" ON "NotificationLog"("notificationId");
CREATE INDEX "idx_log_status" ON "NotificationLog"("status");
```

---

## 8. WEBSOCKET INTEGRATION

### 8.1 Server Configuration

```typescript
// server.ts
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Autenticazione WebSocket
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Authentication failed'));
  }
});
```

### 8.2 Event Handling

```typescript
// notification.handler.ts
export function handleNotificationEvents(socket: Socket) {
  // Join user room
  socket.join(`user:${socket.data.userId}`);
  
  // Listen for events
  socket.on('notification:markRead', async (notificationId) => {
    await notificationService.markAsRead(notificationId, socket.data.userId);
    socket.emit('notification:updated', { id: notificationId, isRead: true });
  });
  
  socket.on('notification:markAllRead', async () => {
    await notificationService.markAllAsRead(socket.data.userId);
    socket.emit('notification:allRead');
  });
}
```

### 8.3 Client Integration

```typescript
// Frontend hook
export function useNotificationSocket() {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      auth: { token: getToken() }
    });
    
    socket.on('notification', (data) => {
      // Show toast
      toast.info(data.title);
      
      // Update query cache
      queryClient.invalidateQueries(['notifications']);
      
      // Update badge count
      updateBadgeCount();
    });
    
    return () => socket.disconnect();
  }, []);
}
```

---

## 9. TESTING E QUALITY ASSURANCE

### 9.1 Test Automatici

#### Unit Tests
```bash
# Backend
cd backend
npm test                 # Run all tests
npm test:unit           # Unit tests only
npm test:integration    # Integration tests
npm test:coverage       # Coverage report

# Frontend
npm test               # Run all tests
npm test:watch        # Watch mode
```

#### Test Coverage Requirements
- **Overall**: ≥ 80%
- **Critical paths**: ≥ 95%
- **New code**: ≥ 90%

### 9.2 Test Scripts

#### Test Sistema Completo
```bash
./scripts/test-notification-system.sh
```

Output atteso:
```
🔍 TEST COMPLETO SISTEMA NOTIFICHE
==================================
📁 VERIFICA FILE SISTEMA NOTIFICHE
✓ notification.service.ts exists
✓ notification.handler.ts exists
✓ errors.ts created

🔧 VERIFICA INTEGRAZIONI MODULI
✓ scheduledInterventionService imports notificationService
✓ user.service imports notificationService
...

📊 RISULTATI TEST
✅ Test Passati: 45
❌ Test Falliti: 0
Success Rate: 100%
🎉 SISTEMA NOTIFICHE COMPLETAMENTE FUNZIONANTE!
```

#### Test Dashboard Admin
```bash
./scripts/test-admin-dashboard.sh
```

### 9.3 Test Manuali

#### Checklist Test Manuale
- [ ] Login come SUPER_ADMIN
- [ ] Accedi a /admin/notifications
- [ ] Verifica statistiche in Overview
- [ ] Applica filtri in Logs
- [ ] Invia notifica di test
- [ ] Verifica ricezione WebSocket (F12)
- [ ] Verifica email (se configurata)
- [ ] Testa reinvio notifica fallita
- [ ] Verifica template editor
- [ ] Testa broadcast (con cautela)

---

## 10. DEPLOYMENT E PRODUCTION

### 10.1 Build Production

```bash
# Backend
cd backend
npm run build
# Output in dist/

# Frontend
npm run build
# Output in dist/

# Docker build
docker build -t richiesta-assistenza .
```

### 10.2 Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3200
CMD ["node", "dist/server.js"]
```

### 10.3 Docker Compose

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3200:3200"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build: .
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:14
    environment:
      - POSTGRES_DB=richiesta_assistenza
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 10.4 Nginx Configuration

```nginx
server {
    listen 80;
    server_name assistenza.example.com;

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend:3200;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 11. MONITORING E MAINTENANCE

### 11.1 Metriche da Monitorare

#### Business Metrics
- **Delivery Rate**: Target > 95%
- **Read Rate**: Target > 80%
- **Response Time**: Target < 100ms (p95)
- **Queue Length**: Alert if > 1000
- **Failed Notifications**: Alert if > 5%

#### System Metrics
- **CPU Usage**: Alert if > 80%
- **Memory Usage**: Alert if > 85%
- **Database Connections**: Alert if > 80% pool
- **Redis Memory**: Alert if > 75%
- **Disk Space**: Alert if < 20% free

### 11.2 Logging Strategy

```typescript
// Winston configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 10485760,
      maxFiles: 10
    }),
    // Console (development)
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});
```

### 11.3 Maintenance Tasks

#### Daily
```sql
-- Pulizia notifiche vecchie (> 90 giorni)
DELETE FROM "Notification" 
WHERE "createdAt" < NOW() - INTERVAL '90 days'
AND "isRead" = true;

-- Vacuum database
VACUUM ANALYZE "Notification";
```

#### Weekly
```bash
# Backup database
pg_dump -U postgres richiesta_assistenza > backup_$(date +%Y%m%d).sql

# Analisi performance
SELECT 
  type,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM ("readAt" - "createdAt"))) as avg_read_time_seconds
FROM "Notification"
WHERE "createdAt" > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY count DESC;
```

#### Monthly
```bash
# Report mensile
./scripts/generate-monthly-report.sh

# Pulizia logs
find ./logs -name "*.log" -mtime +30 -delete

# Update dependencies
npm audit
npm update --save
```

---

## 12. TROUBLESHOOTING GUIDE

### 12.1 Problemi Comuni

#### ❌ Notifiche non inviate

**Sintomi:** Notifiche create ma non ricevute

**Diagnosi:**
```bash
# Check Redis
redis-cli ping

# Check queue
redis-cli llen bull:notifications:wait

# Check logs
tail -f backend/logs/error.log | grep notification
```

**Soluzioni:**
1. Verifica Redis sia attivo
2. Controlla configurazione SMTP
3. Verifica WebSocket connection
4. Check rate limiting

#### ❌ Dashboard non carica dati

**Sintomi:** Spinner infinito o errori

**Diagnosi:**
```javascript
// Browser console
fetch('/api/notifications/stats', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
}).then(r => r.json()).then(console.log)
```

**Soluzioni:**
1. Verifica token JWT valido
2. Check permessi utente (ADMIN/SUPER_ADMIN)
3. Verifica backend attivo
4. Check CORS configuration

#### ❌ WebSocket disconnesso

**Sintomi:** Notifiche non real-time

**Diagnosi:**
```javascript
// Browser console
const socket = io('http://localhost:3200');
socket.on('connect', () => console.log('Connected'));
socket.on('error', console.error);
```

**Soluzioni:**
1. Verifica firewall/proxy
2. Check WebSocket transport
3. Verifica autenticazione
4. Restart Socket.io server

### 12.2 Debug Mode

```env
# Abilita debug completo
DEBUG=notification:*
LOG_LEVEL=debug
NODE_ENV=development
```

### 12.3 Performance Issues

#### Query lente
```sql
-- Analizza query
EXPLAIN ANALYZE 
SELECT * FROM "Notification" 
WHERE "recipientId" = '...' 
AND "isRead" = false 
ORDER BY "createdAt" DESC 
LIMIT 20;

-- Se lento, aggiungi indice
CREATE INDEX CONCURRENTLY idx_notification_user_unread 
ON "Notification"("recipientId", "createdAt" DESC) 
WHERE "isRead" = false;
```

#### Memory leaks
```bash
# Monitor memory
node --inspect backend/dist/server.js

# Chrome DevTools
chrome://inspect

# Heap snapshot
```

---

## 13. BEST PRACTICES

### 13.1 Coding Standards

#### Naming Conventions
```typescript
// Tipi notifiche: UPPER_SNAKE_CASE
NEW_REQUEST, PAYMENT_SUCCESS

// Priorità: lowercase
'low', 'normal', 'high', 'urgent'

// Canali: lowercase
'websocket', 'email', 'sms', 'push'

// Functions: camelCase
sendToUser(), markAsRead()

// Classes: PascalCase
NotificationService, TemplateManager
```

#### Error Handling
```typescript
// ✅ SEMPRE con try/catch non-blocking
try {
  await notificationService.sendToUser(data);
} catch (error) {
  logger.error('Notification failed:', error);
  // NON interrompere il flusso principale
}

// ✅ Error specifici
if (!user) {
  throw new NotFoundError('User not found');
}

// ✅ Logging dettagliato
logger.error('Notification send failed', {
  userId: data.userId,
  type: data.type,
  error: error.message,
  stack: error.stack
});
```

### 13.2 Template Best Practices

```typescript
// ✅ Usa variabili per contenuto dinamico
const template = {
  subject: 'Nuovo preventivo da {{professionalName}}',
  body: 'Hai ricevuto un preventivo di €{{amount}} per "{{requestTitle}}"'
};

// ✅ Fallback per variabili mancanti
const formatted = template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
  return variables[key] || `[${key}]`;
});

// ✅ Versioning template
const newVersion = {
  ...oldTemplate,
  version: oldTemplate.version + 1,
  updatedAt: new Date()
};
```

### 13.3 Performance Guidelines

```typescript
// ✅ Batch operations
const notifications = users.map(user => ({
  userId: user.id,
  type: 'ANNOUNCEMENT',
  // ...
}));
await prisma.notification.createMany({ data: notifications });

// ✅ Use select per ridurre payload
const notifications = await prisma.notification.findMany({
  select: {
    id: true,
    title: true,
    createdAt: true
  }
});

// ✅ Pagination sempre
const PAGE_SIZE = 20;
const notifications = await prisma.notification.findMany({
  take: PAGE_SIZE,
  skip: (page - 1) * PAGE_SIZE
});
```

---

## 14. SECURITY CONSIDERATIONS

### 14.1 Authentication & Authorization

```typescript
// Middleware chain
app.use('/api/notifications', 
  authenticate,           // Verifica JWT
  requireRole(['USER']),  // Verifica ruolo minimo
  rateLimit,             // Rate limiting
  notificationRoutes     // Routes
);

// Role-based access
const PERMISSIONS = {
  'USER': ['read:own', 'update:own'],
  'PROFESSIONAL': ['read:own', 'update:own', 'create:quote'],
  'ADMIN': ['read:all', 'update:all', 'send:test'],
  'SUPER_ADMIN': ['*']
};
```

### 14.2 Data Protection

```typescript
// Sanitizzazione input
const sanitized = DOMPurify.sanitize(userInput);

// Escape HTML in notifiche
const escaped = he.encode(notification.content);

// Validazione con Zod
const schema = z.object({
  type: z.enum(Object.values(NotificationType)),
  title: z.string().max(200),
  message: z.string().max(1000),
  priority: z.enum(['low', 'normal', 'high', 'urgent'])
});

// Encryption per dati sensibili
const encrypted = crypto.AES.encrypt(
  sensitiveData, 
  process.env.ENCRYPTION_KEY
).toString();
```

### 14.3 Rate Limiting

```typescript
// Per endpoint
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // max richieste
  message: 'Too many requests'
});

// Per user
const userLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:notification',
  points: 100, // requests
  duration: 3600, // per hour
  blockDuration: 600 // block for 10 min
});
```

---

## 15. PERFORMANCE OPTIMIZATION

### 15.1 Database Optimization

```sql
-- Partitioning per date (PostgreSQL 12+)
CREATE TABLE notification_2025_01 PARTITION OF notification
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Materialized view per stats
CREATE MATERIALIZED VIEW notification_stats AS
SELECT 
  DATE(created_at) as date,
  type,
  COUNT(*) as count,
  COUNT(CASE WHEN is_read THEN 1 END) as read_count
FROM notification
GROUP BY DATE(created_at), type
WITH DATA;

-- Refresh periodicamente
REFRESH MATERIALIZED VIEW CONCURRENTLY notification_stats;
```

### 15.2 Caching Strategy

```typescript
// Redis caching layer
class NotificationCache {
  private redis: Redis;
  private TTL = 300; // 5 minuti
  
  async getStats(userId: string) {
    const cached = await this.redis.get(`stats:${userId}`);
    if (cached) return JSON.parse(cached);
    
    const stats = await this.calculateStats(userId);
    await this.redis.setex(
      `stats:${userId}`, 
      this.TTL, 
      JSON.stringify(stats)
    );
    
    return stats;
  }
  
  invalidate(userId: string) {
    return this.redis.del(`stats:${userId}`);
  }
}
```

### 15.3 Frontend Optimization

```typescript
// React Query optimization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minuti
      cacheTime: 10 * 60 * 1000, // 10 minuti
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  }
});

// Lazy loading
const NotificationDashboard = lazy(() => 
  import('./components/notifications/NotificationDashboard')
);

// Virtual scrolling per liste lunghe
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={notifications.length}
  itemSize={80}
>
  {({ index, style }) => (
    <NotificationRow 
      style={style} 
      notification={notifications[index]} 
    />
  )}
</FixedSizeList>
```

---

## 📚 APPENDICI

### A. Codici Errore

| Codice | Significato | Azione |
|--------|-------------|--------|
| `NOTIFICATION_NOT_FOUND` | Notifica non trovata | Verifica ID |
| `INVALID_RECIPIENT` | Destinatario non valido | Check user exists |
| `TEMPLATE_NOT_FOUND` | Template mancante | Verifica codice template |
| `CHANNEL_UNAVAILABLE` | Canale non disponibile | Fallback ad altro canale |
| `RATE_LIMIT_EXCEEDED` | Troppi invii | Attendere prima di riprovare |
| `DELIVERY_FAILED` | Invio fallito | Retry automatico |
| `INVALID_PRIORITY` | Priorità non valida | Usa: low/normal/high/urgent |

### B. Metriche KPI

| Metrica | Formula | Target | Alert |
|---------|---------|--------|-------|
| **Delivery Rate** | (Delivered / Sent) × 100 | > 95% | < 90% |
| **Read Rate** | (Read / Delivered) × 100 | > 80% | < 60% |
| **Response Time** | p95 latency | < 100ms | > 500ms |
| **Queue Depth** | Pending notifications | < 1000 | > 5000 |
| **Error Rate** | (Failed / Total) × 100 | < 1% | > 5% |

### C. Glossario

| Termine | Definizione |
|---------|-------------|
| **Notification** | Messaggio inviato a un utente |
| **Template** | Modello riutilizzabile per notifiche |
| **Channel** | Mezzo di invio (websocket, email, etc.) |
| **Priority** | Livello di urgenza (low-urgent) |
| **Broadcast** | Invio massivo a gruppo di utenti |
| **Digest** | Raggruppamento notifiche |
| **Delivery** | Consegna effettiva al destinatario |
| **Read Receipt** | Conferma di lettura |

---

## 📝 CHANGELOG

### v2.0.0 - 6 Settembre 2025
- ✨ Dashboard admin completa
- ✨ 70+ tipi di notifiche
- ✨ Sistema template avanzato
- ✨ Analytics e reporting
- ✨ Test suite completa
- 📚 Documentazione completa

### v1.0.0 - 30 Agosto 2025
- 🎉 Prima versione stabile
- ✨ Sistema notifiche base
- ✨ WebSocket integration
- ✨ Email support

---

## 📞 SUPPORTO

**Lead Developer**: Luca Mambelli  
**Email**: lucamambelli@lmtecnologie.it  
**Repository**: https://github.com/241luca/Richiesta-Assistenza  

Per problemi urgenti:
1. Controlla Troubleshooting (Sezione 12)
2. Verifica logs: `tail -f backend/logs/error.log`
3. Esegui test: `./scripts/test-notification-system.sh`
4. Contatta supporto con log dettagliati

---

**Fine Documentazione Sistema Notifiche v2.0**  
*Ultimo aggiornamento: 6 Settembre 2025*  
*© 2025 LM Tecnologie - Tutti i diritti riservati*
