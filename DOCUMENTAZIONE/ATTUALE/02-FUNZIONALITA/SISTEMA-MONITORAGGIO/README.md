# 📊 Sistema Monitoraggio Completo - Documentazione v1.0

**Data creazione**: 02 Ottobre 2025  
**Versione sistema**: 5.2.0  
**Autore**: Sistema Richiesta Assistenza  
**Stato**: ✅ Produzione

---

## 📋 Indice

1. [Panoramica Sistema](#panoramica-sistema)
2. [Architettura](#architettura)
3. [Componenti Frontend](#componenti-frontend)
4. [API Backend](#api-backend)
5. [Funzionalità](#funzionalità)
6. [Configurazione](#configurazione)
7. [Utilizzo](#utilizzo)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Panoramica Sistema

Il Sistema di Monitoraggio è una suite completa di strumenti per monitorare in tempo reale:
- **Stato dei servizi** (Database, Redis, WebSocket, Email, WhatsApp, AI, Pagamenti, Maps)
- **Sicurezza del sistema** (Login falliti, IP bloccati, attività sospette)
- **Notifiche utente** (Centro notifiche avanzato con filtri e azioni)
- **Performance sistema** (CPU, Memoria, Uptime)

### Componenti Principali

| Componente | Tipo | Visibilità | Funzione |
|------------|------|-----------|----------|
| **ServiceStatusIndicator** | Indicatore Header | SUPER_ADMIN | Pallino colorato con stato servizi |
| **SecurityStatusIndicator** | Indicatore Header | ADMIN, SUPER_ADMIN | Scudo con eventi sicurezza |
| **EnhancedNotificationCenter** | Indicatore Header | Tutti | Campanella notifiche avanzate |
| **SystemStatusPage** | Pagina Completa | ADMIN, SUPER_ADMIN | Dashboard dettagliata servizi |

---

## 🏗️ Architettura

### Stack Tecnologico

```
Frontend:
├── React 19.1.1
├── TypeScript 5.9.2
├── TanStack Query v5.86.0 (React Query)
├── Tailwind CSS 3.4.17
└── Heroicons 2.x

Backend:
├── Express 5.1.0
├── Prisma 6.16.2
├── PostgreSQL (Database principale)
├── Redis (Cache e sessioni)
└── Socket.io 4.8.1 (Real-time)
```

### Flusso Dati

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. Query ogni 30-60s
       ▼
┌─────────────────┐
│  React Query    │
│  (Cache Layer)  │
└──────┬──────────┘
       │ 2. API Request
       ▼
┌─────────────────┐
│  API Endpoint   │
│  /health-check  │
│  /security      │
│  /notifications │
└──────┬──────────┘
       │ 3. Service Layer
       ▼
┌─────────────────────────┐
│  Database + Redis       │
│  + External Services    │
└─────────────────────────┘
```

### Auto-Refresh

- **ServiceStatusIndicator**: 30 secondi
- **SecurityStatusIndicator**: 60 secondi
- **EnhancedNotificationCenter**: 30 secondi
- **SystemStatusPage**: 30 secondi (configurabile)

---

## 🎨 Componenti Frontend

### 1. ServiceStatusIndicator

**File**: `/src/components/admin/ServiceStatusIndicator.tsx`

#### Caratteristiche

- **Pallino colorato** che indica stato generale sistema:
  - 🟢 Verde: Tutti i servizi online (healthy)
  - 🟡 Giallo: Alcuni servizi degradati (degraded)
  - 🔴 Rosso: Servizi critici offline (critical)
  
- **Badge numerico**: Mostra numero servizi offline
- **Pannello dropdown**: Lista completa servizi con dettagli
- **Auto-refresh**: Polling ogni 30 secondi

#### Stati dei Servizi

```typescript
interface ServiceStatus {
  name: string;                          // Nome servizio
  status: 'online' | 'offline' | 'warning'; // Stato
  message?: string;                      // Messaggio descrittivo
  latency?: number;                      // Latenza in ms
  details?: any;                         // Dettagli aggiuntivi
}
```

#### Servizi Monitorati

1. **PostgreSQL** - Database principale
2. **Redis** - Cache e sessioni
3. **Socket.io** - WebSocket real-time
4. **Email (Brevo)** - Sistema email
5. **WhatsApp (WppConnect)** - Messaggistica business
6. **OpenAI** - Intelligenza artificiale
7. **Stripe** - Gateway pagamenti
8. **Google Maps** - Geocoding e mappe
9. **Google Calendar** - Sincronizzazione calendario

#### Uso nel Codice

```typescript
import ServiceStatusIndicator from './admin/ServiceStatusIndicator';

// Nel Layout (solo SUPER_ADMIN)
{user?.role === 'SUPER_ADMIN' && (
  <ServiceStatusIndicator />
)}
```

---

### 2. SecurityStatusIndicator

**File**: `/src/components/admin/SecurityStatusIndicator.tsx`

#### Caratteristiche

- **Icona scudo** che cambia in base allo stato di sicurezza:
  - 🛡️ Verde: Sistema sicuro
  - ⚠️ Giallo: Attenzione richiesta
  - 🚨 Rosso: Stato critico
  
- **Badge numerico**: Eventi critici in sospeso
- **Pannello dropdown**: 
  - Statistiche rapide (login falliti 1h, 24h, IP bloccati)
  - Ultimi 10 eventi di sicurezza
  - Link diretto all'Audit Log

#### Statistiche Monitorate

```typescript
interface SecurityStats {
  overall: 'secure' | 'warning' | 'critical';
  failedLogins24h: number;           // Login falliti ultimi 24h
  failedLoginsLastHour: number;      // Login falliti ultima ora
  suspiciousActivities: number;      // Attività sospette
  criticalEvents: number;            // Eventi critici
  newDevices: number;                // Nuovi device rilevati
  blockedIps: number;                // IP bloccati
  rateLimitHits: number;             // Rate limit superati
  events: SecurityEvent[];           // Lista eventi
}
```

#### Tipi di Eventi

1. **login_failed** 🔒 - Tentativo login fallito
2. **suspicious_activity** ⚠️ - Attività sospetta
3. **rate_limit** 🚫 - Rate limit superato
4. **new_device** 📱 - Nuovo device rilevato
5. **unusual_location** 🌍 - Location insolita
6. **permission_denied** 🛑 - Permesso negato
7. **critical_action** 🔴 - Azione critica eseguita

#### Uso nel Codice

```typescript
import SecurityStatusIndicator from './admin/SecurityStatusIndicator';

// Nel Layout (ADMIN e SUPER_ADMIN)
{(user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN') && (
  <SecurityStatusIndicator />
)}
```

---

### 3. EnhancedNotificationCenter

**File**: `/src/components/NotificationCenter/EnhancedNotificationCenter.tsx`

#### Caratteristiche

- **Campanella animata**: Solid quando ci sono notifiche non lette
- **Badge contatore**: Numero notifiche non lette (max 99+)
- **Pannello dropdown avanzato**:
  - Statistiche (non lette, oggi, questa settimana)
  - Filtri rapidi (Tutte, Non lette, Oggi)
  - Azioni per notifica (Leggi, Archivia, Elimina)
  - "Segna tutte come lette" (batch action)

#### Filtri Disponibili

```typescript
type FilterType = 'all' | 'unread' | 'today';

const filters = [
  { value: 'all', label: 'Tutte' },
  { value: 'unread', label: 'Non lette' },
  { value: 'today', label: 'Oggi' }
];
```

#### Categorie Notifiche

| Categoria | Colore | Icona |
|-----------|--------|-------|
| PAYMENT | Verde | 💳 |
| REQUEST | Blu | 📋 |
| QUOTE | Viola | 💰 |
| SYSTEM | Grigio | ⚙️ |
| SECURITY | Rosso | 🛡️ |
| USER | Indigo | 👤 |

#### Azioni Disponibili

1. **Segna come letta** ✓ - Singola notifica
2. **Archivia** 📦 - Sposta in archivio
3. **Elimina** 🗑️ - Cancella definitivamente
4. **Segna tutte come lette** ✓✓ - Batch action

#### Uso nel Codice

```typescript
import EnhancedNotificationCenter from './NotificationCenter/EnhancedNotificationCenter';

// Nel Layout (Tutti gli utenti)
<EnhancedNotificationCenter />
```

---

### 4. SystemStatusPage

**File**: `/src/pages/admin/SystemStatusPage.tsx`  
**Route**: `/admin/system-status`

#### Sezioni della Pagina

##### 1. Header con Controlli

- **Titolo**: "Stato Sistema"
- **Auto-refresh toggle**: Checkbox per attivare/disattivare
- **Pulsante refresh**: Icona rotante durante caricamento

##### 2. Banner Stato Generale

```typescript
┌────────────────────────────────────┐
│ 🟢 Sistema Operativo               │
│ 8 di 9 servizi online              │
└────────────────────────────────────┘
```

Colori:
- 🟢 Verde: healthy (tutti i servizi OK)
- 🟡 Giallo: degraded (alcuni servizi con warning)
- 🔴 Rosso: critical (servizi critici offline)

##### 3. Card Statistiche Sistema

**CPU Card**:
```
┌─────────────────┐
│ CPU         🔧  │
├─────────────────┤
│ Modello: ...    │
│ Core: 8         │
│ Utilizzo: 45%   │
│ [████████░░] 45%│
└─────────────────┘
```

**Memoria Card**:
```
┌─────────────────┐
│ Memoria     📊  │
├─────────────────┤
│ Totale: 16 GB   │
│ Usata: 8 GB     │
│ Libera: 8 GB    │
│ [████████░░] 50%│
└─────────────────┘
```

**Sistema Card**:
```
┌─────────────────┐
│ Sistema     💻  │
├─────────────────┤
│ OS: Darwin      │
│ Versione: 23.x  │
│ Hostname: ...   │
│ Uptime: 5g 3h   │
└─────────────────┘
```

##### 4. Lista Servizi Dettagliata

Per ogni servizio:

```
┌──────────────────────────────────────────────────┐
│ 🗄️  PostgreSQL                    [45ms] Online │
│                                                   │
│ Database relazionale principale...                │
│                                                   │
│ ┌──────┬──────┬──────┬──────┐                   │
│ │ Tipo │ Pool │ Perf │ Stato│                   │
│ ├──────┼──────┼──────┼──────┤                   │
│ │ Post │ 2-20 │ Ecc. │Attivo│                   │
│ └──────┴──────┴──────┴──────┘                   │
│                                                   │
│ ℹ️ Database relazionale principale che          │
│    memorizza tutti i dati dell'applicazione...   │
└──────────────────────────────────────────────────┘
```

#### Dettagli per Servizio

**PostgreSQL**:
- Tipo: PostgreSQL
- Pool: 2-20 connessioni
- Performance: Eccellente/Buona/Lenta (basato su latency)
- Stato: Attivo/Offline

**Redis**:
- Tipo: Cache Redis
- Versione: ioredis
- Uso: Session + Cache
- TTL Default: 5 minuti

**WebSocket (Socket.io)**:
- Tipo: Socket.io
- Versione: v4.8+
- Client: Numero connessi
- Clustering: Attivo

**Email (Brevo)**:
- Provider: Brevo
- Tipo: SMTP + API
- Rate Limit: 300/giorno
- Templates: 20+

**WhatsApp (WppConnect)**:
- Tipo: WppConnect
- Versione: v1.37+
- Multidevice: Supportato
- QR Refresh: 30s

**OpenAI**:
- Modello: GPT-4/3.5
- Dual Config: Pro + Client
- Embeddings: text-embed-3
- Rate Limit: 100 req/day

**Stripe**:
- Tipo: Payment Gateway
- Webhook: Configurato
- API Version: Latest
- SCA: 3D Secure

**Google Maps**:
- API: Maps Platform
- Servizi: Places + Geocoding
- Cache: 24h Redis
- Quota: $200/mese

**Google Calendar**:
- API: Calendar v3
- OAuth: Configurato
- Sync: Bidirezionale
- Events: Illimitati

#### Badge Latency

- 🟢 Verde: < 50ms (Eccellente)
- 🟡 Giallo: 50-200ms (Buona)
- 🔴 Rosso: > 200ms (Lenta)

---

## 🔌 API Backend

### 1. Health Check Status

**Endpoint**: `GET /api/admin/health-check/status`  
**Auth**: Richiede ADMIN o SUPER_ADMIN

#### Request

```http
GET /api/admin/health-check/status HTTP/1.1
Authorization: Bearer {token}
```

#### Response

```json
{
  "success": true,
  "data": {
    "overall": "healthy",
    "services": [
      {
        "name": "PostgreSQL",
        "status": "online",
        "message": "Connected successfully",
        "latency": 45
      },
      {
        "name": "Redis",
        "status": "online",
        "message": "Cache operational",
        "latency": 12
      }
    ],
    "systemStats": {
      "cpu": {
        "model": "Intel Core i7",
        "cores": 8,
        "usage": 45,
        "loadAvg": [1.5, 1.2, 1.0]
      },
      "memory": {
        "total": 17179869184,
        "used": 8589934592,
        "free": 8589934592,
        "percentage": 50
      },
      "os": {
        "platform": "darwin",
        "type": "Darwin",
        "release": "23.5.0",
        "hostname": "macbook-pro",
        "uptime": 432000
      }
    },
    "timestamp": "2025-10-02T14:30:00.000Z"
  }
}
```

---

### 2. Security Status

**Endpoint**: `GET /api/security/status`  
**Auth**: Richiede ADMIN o SUPER_ADMIN

#### Request

```http
GET /api/security/status HTTP/1.1
Authorization: Bearer {token}
```

#### Response

```json
{
  "success": true,
  "data": {
    "overall": "secure",
    "failedLogins24h": 3,
    "failedLoginsLastHour": 0,
    "suspiciousActivities": 1,
    "criticalEvents": 0,
    "newDevices": 2,
    "blockedIps": 5,
    "rateLimitHits": 12,
    "lastIncident": "2025-10-02T10:15:00.000Z",
    "events": [
      {
        "id": "evt_123",
        "type": "login_failed",
        "severity": "medium",
        "message": "Login fallito per user@example.com",
        "userEmail": "user@example.com",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "location": "Milano, IT",
        "timestamp": "2025-10-02T14:25:00.000Z",
        "resolved": false
      }
    ]
  }
}
```

---

### 3. Notifications

**Endpoint**: `GET /api/notifications`  
**Auth**: Richiede autenticazione

#### Query Parameters

```typescript
{
  unread?: boolean;      // Filtra solo non lette
  type?: string;         // Filtra per categoria
  after?: string;        // ISO date - dopo questa data
  limit?: number;        // Massimo risultati (default 50)
}
```

#### Request

```http
GET /api/notifications?unread=true&limit=20 HTTP/1.1
Authorization: Bearer {token}
```

#### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "REQUEST",
      "title": "Nuova richiesta ricevuta",
      "content": "Hai ricevuto una nuova richiesta di assistenza",
      "priority": "HIGH",
      "isRead": false,
      "metadata": {
        "severity": "info",
        "requestId": "req_456"
      },
      "createdAt": "2025-10-02T14:20:00.000Z"
    }
  ],
  "stats": {
    "total": 150,
    "unread": 12,
    "today": 8,
    "thisWeek": 45
  }
}
```

---

### 4. Notification Stats

**Endpoint**: `GET /api/notifications/stats`  
**Auth**: Richiede autenticazione

#### Response

```json
{
  "success": true,
  "data": {
    "total": 150,
    "unread": 12,
    "today": 8,
    "thisWeek": 45,
    "byCategory": {
      "PAYMENT": 20,
      "REQUEST": 50,
      "QUOTE": 30,
      "SYSTEM": 25,
      "SECURITY": 15,
      "USER": 10
    },
    "bySeverity": {
      "info": 100,
      "success": 30,
      "warning": 15,
      "error": 5
    }
  }
}
```

---

## ⚙️ Configurazione

### Frontend Environment

```env
# .env
VITE_API_URL=http://localhost:3200/api
VITE_WS_URL=http://localhost:3200
```

### Backend Environment

```env
# backend/.env

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/richiesta_assistenza

# Redis
REDIS_URL=redis://localhost:6379
REDIS_TTL=300

# Health Check
HEALTH_CHECK_INTERVAL=30000        # 30 secondi
HEALTH_CHECK_TIMEOUT=5000          # 5 secondi timeout

# Security Monitoring
SECURITY_CHECK_INTERVAL=60000      # 60 secondi
MAX_FAILED_LOGINS_PER_HOUR=5
IP_BLOCK_DURATION=1800000          # 30 minuti

# Notifications
NOTIFICATION_CLEANUP_DAYS=30       # Giorni retention
NOTIFICATION_BATCH_SIZE=50
```

### React Query Configuration

```typescript
// src/main.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000,     // 5 minuti
    },
  },
});
```

---

## 🎮 Utilizzo

### Per SUPER_ADMIN

#### 1. Visualizzare Stato Servizi

**Dall'Header**:
1. Clicca sul pallino colorato (🟢/🟡/🔴)
2. Visualizza lista servizi nel dropdown
3. Clicca "Dettagli completi" per pagina completa

**Dal Menu**:
1. Sidebar → Tools e Utility → System Status
2. Visualizza dashboard completa con:
   - Banner stato generale
   - Statistiche sistema (CPU, Memoria, OS)
   - Lista dettagliata servizi

#### 2. Monitorare Sicurezza

**Dall'Header**:
1. Clicca sull'icona scudo (🛡️)
2. Visualizza statistiche rapide
3. Controlla ultimi eventi
4. Clicca "Vedi tutti" → Vai all'Audit Log

#### 3. Gestire Notifiche

**Dall'Header**:
1. Clicca sulla campanella (🔔)
2. Filtra per: Tutte, Non lette, Oggi
3. Azioni disponibili:
   - ✓ Segna come letta
   - 📦 Archivia
   - 🗑️ Elimina
4. "Segna tutte come lette" per batch action

### Per ADMIN

Gli ADMIN hanno accesso a:
- ✅ System Status Page
- ✅ Security Status Indicator
- ✅ Enhanced Notification Center
- ❌ Service Status Indicator (solo SUPER_ADMIN)

### Per CLIENT/PROFESSIONAL

Gli utenti standard hanno accesso a:
- ✅ Enhanced Notification Center
- ❌ System Status (non visibile)
- ❌ Security Status (non visibile)

---

## 🔧 Manutenzione

### Auto-Refresh

Tutti i componenti hanno auto-refresh automatico:

```typescript
// ServiceStatusIndicator
refetchInterval: 30000  // 30 secondi

// SecurityStatusIndicator
refetchInterval: 60000  // 60 secondi

// EnhancedNotificationCenter
refetchInterval: 30000  // 30 secondi

// SystemStatusPage (configurabile)
refetchInterval: autoRefresh ? 30000 : false
```

### Cache Management

React Query gestisce automaticamente la cache:

```typescript
// Cache invalidation dopo azioni
queryClient.invalidateQueries({ queryKey: ['system-health'] });
queryClient.invalidateQueries({ queryKey: ['security-status'] });
queryClient.invalidateQueries({ queryKey: ['notifications'] });
```

### Cleanup

Le notifiche vecchie vengono rimosse automaticamente:
- **Retention**: 30 giorni (configurabile)
- **Job schedulato**: Ogni notte alle 02:00
- **Batch size**: 1000 notifiche per volta

---

## 🐛 Troubleshooting

### Problema: Pallino rosso costante

**Causa**: Uno o più servizi critici offline

**Soluzione**:
1. Clicca sul pallino per vedere quale servizio
2. Controlla i log del servizio specifico:
   ```bash
   # PostgreSQL
   pg_isready -h localhost -p 5432
   
   # Redis
   redis-cli ping
   
   # Backend
   pm2 logs backend
   ```
3. Riavvia il servizio problematico

### Problema: Notifiche non si aggiornano

**Causa**: WebSocket disconnesso o React Query cache

**Soluzione**:
1. Verifica connessione WebSocket (pallino verde in basso a destra)
2. Forza refresh (pulsante 🔄)
3. Svuota cache browser (Cmd+Shift+R)
4. Controlla backend logs:
   ```bash
   pm2 logs backend | grep socket
   ```

### Problema: Latency alta (> 200ms)

**Causa**: Database sovraccarico o rete lenta

**Soluzione**:
1. Controlla System Status Page → CPU e Memoria
2. Verifica query lente:
   ```sql
   SELECT * FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```
3. Aumenta pool connessioni se necessario
4. Verifica Redis funzioni correttamente

### Problema: Eventi sicurezza troppi

**Causa**: Attacco in corso o configurazione sbagliata

**Soluzione**:
1. Vai all'Audit Log (dal Security Indicator)
2. Analizza pattern eventi
3. Blocca IP sospetti:
   ```bash
   # Tramite firewall
   sudo ufw deny from 192.168.1.100
   ```
4. Aumenta rate limit se falso positivo

### Problema: Sistema si blocca su redirect

**Causa**: Route non presente nel menu di navigazione

**Soluzione**:
1. Verifica che la route esista in `routes.tsx`
2. Aggiungi voce nel menu `Layout.tsx`:
   ```typescript
   { name: 'Nome Pagina', href: '/path', icon: Icon }
   ```
3. Hard refresh browser (Cmd+Shift+R)

---

## 📊 Performance Metrics

### Target Performance

| Metrica | Target | Attuale |
|---------|--------|---------|
| API Response Time | < 100ms | ~50ms |
| Health Check | < 50ms | ~30ms |
| Frontend Load | < 2s | ~1.2s |
| Memory Usage | < 500MB | ~350MB |
| CPU Usage | < 60% | ~45% |

### Monitoring Best Practices

1. **Controllare daily**:
   - Stato generale servizi (🟢)
   - Eventi sicurezza critici (🔴)
   - Notifiche sistema importanti

2. **Controllare weekly**:
   - Statistiche CPU/Memoria trend
   - Performance query database
   - Utilizzo storage

3. **Controllare monthly**:
   - Cleanup notifiche vecchie
   - Review Audit Log eventi
   - Aggiornamento dipendenze

---

## 🔐 Security Considerations

### Accesso Limitato

- ✅ Service Status: Solo SUPER_ADMIN
- ✅ Security Status: ADMIN e SUPER_ADMIN
- ✅ System Status Page: ADMIN e SUPER_ADMIN
- ✅ Notifications: Tutti (ma solo proprie)

### Rate Limiting

Tutti gli endpoint sono protetti da rate limiting:

```typescript
// 100 richieste per minuto per IP
rateLimit({
  windowMs: 60 * 1000,
  max: 100
})
```

### Audit Trail

Tutte le azioni vengono registrate:

```typescript
// Azioni tracciate
- Visualizzazione System Status
- Accesso Security Events
- Modifica notifiche (letta/archiviata/eliminata)
- Login/Logout
- Operazioni critiche sistema
```

---

## 📝 Note di Versione

### v1.0 - 02 Ottobre 2025

**Componenti Iniziali**:
- ✅ ServiceStatusIndicator
- ✅ SecurityStatusIndicator
- ✅ EnhancedNotificationCenter
- ✅ SystemStatusPage

**Features**:
- ✅ Auto-refresh configurabile
- ✅ 9 servizi monitorati
- ✅ Statistiche sistema complete
- ✅ Eventi sicurezza categorizzati
- ✅ Notifiche con filtri e azioni

**Miglioramenti Futuri**:
- [ ] Grafici storici performance
- [ ] Alert personalizzabili
- [ ] Export report PDF
- [ ] Dashboard mobile
- [ ] Integrazione Slack/Teams per alert

---

## 🔗 Link Utili

- [API Documentation](../03-API/)
- [Audit Log System](../AUDIT-LOG/)
- [Security Best Practices](../../04-GUIDE/SECURITY-BEST-PRACTICES.md)
- [Health Check Configuration](./HEALTH-CHECK-CONFIG.md)

---

**Documento creato**: 02 Ottobre 2025  
**Prossima revisione**: 02 Novembre 2025  
**Autore**: Sistema Documentazione Automatica  
**Versione documento**: 1.0
