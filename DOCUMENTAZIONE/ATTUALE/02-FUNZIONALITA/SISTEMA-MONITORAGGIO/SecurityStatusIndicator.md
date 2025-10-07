# 🛡️ SecurityStatusIndicator - Centro Sicurezza

**Componente**: `SecurityStatusIndicator.tsx`  
**Path**: `/src/components/admin/SecurityStatusIndicator.tsx`  
**Versione**: 1.0.0  
**Data**: 28 Settembre 2025

## 📝 DESCRIZIONE

Indicatore di sicurezza nell'header che monitora eventi critici, login falliti, attività sospette e fornisce una dashboard real-time degli eventi di sicurezza. Disponibile per ADMIN e SUPER_ADMIN.

## 🎯 FUNZIONALITÀ PRINCIPALI

- Monitoraggio login falliti (1h e 24h)
- Rilevamento attività sospette
- Tracking eventi critici
- Analisi nuovi dispositivi
- Identificazione IP sospetti
- Alert rate limiting
- Dashboard eventi con dettagli

## 💻 IMPLEMENTAZIONE FRONTEND

```typescript
const SecurityStatusIndicator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Polling ogni 60 secondi
  const { data: securityData, isLoading } = useQuery<SecurityStats>({
    queryKey: ['security-status'],
    queryFn: async () => {
      const response = await api.get('/security/status');
      return response.data.data;
    },
    refetchInterval: 60000,
    retry: 1,
  });
```

## 🔌 BACKEND IMPLEMENTATION

### Endpoint Principal: `/api/security/status`

```typescript
router.get('/status', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), 
  async (req: any, res: any) => {
    // Statistiche login falliti
    const [failedLoginsLastHour, failedLogins24h] = await Promise.all([
      prisma.auditLog.count({
        where: {
          action: AuditAction.LOGIN_FAILED,
          timestamp: { gte: oneHourAgo }
        }
      }),
      prisma.auditLog.count({
        where: {
          action: AuditAction.LOGIN_FAILED,
          timestamp: { gte: oneDayAgo }
        }
      })
    ]);

    // Eventi critici e sospetti
    const [criticalEvents, suspiciousActivities] = await Promise.all([
      prisma.auditLog.count({
        where: {
          severity: LogSeverity.CRITICAL,
          timestamp: { gte: oneWeekAgo }
        }
      }),
      prisma.auditLog.count({
        where: {
          severity: { in: [LogSeverity.WARNING, LogSeverity.ERROR] },
          timestamp: { gte: oneDayAgo }
        }
      })
    ]);
});
```

## 📊 EVENTI MONITORATI

### Tipi di Eventi

| Tipo | Descrizione | Severity | Azione |
|------|-------------|----------|--------|
| `login_failed` | Tentativo login fallito | HIGH | Monitor IP |
| `suspicious_activity` | Attività anomala | MEDIUM | Alert admin |
| `rate_limit` | Limite richieste superato | LOW | Throttle |
| `new_device` | Nuovo dispositivo | LOW | Notifica user |
| `unusual_location` | Location insolita | MEDIUM | Verifica |
| `permission_denied` | Accesso negato | HIGH | Log audit |
| `critical_action` | Azione critica | CRITICAL | Alert immediato |

### Severity Levels

- **🔴 CRITICAL**: Richiede azione immediata
- **🟠 HIGH**: Problema di sicurezza importante
- **🟡 MEDIUM**: Attenzione richiesta
- **🟢 LOW**: Informativo

## 🎨 STATI VISIVI

### Overall Security Status
- **🟢 Secure**: Nessun problema rilevato
- **🟡 Warning**: Alcuni eventi sospetti (5+ suspicious, 5+ failed logins/h)
- **🔴 Critical**: Eventi critici attivi o 10+ failed logins/h

### Indicatori Dashboard

```typescript
// Statistiche visualizzate
{
  failedLoginsLastHour: number,    // Login falliti ultima ora
  failedLogins24h: number,          // Login falliti 24h
  suspiciousActivities: number,     // Attività sospette
  criticalEvents: number,           // Eventi critici
  newDevices: number,               // Nuovi dispositivi
  blockedIps: number,               // IP bloccati
  rateLimitHits: number,            // Rate limit hits
  lastIncident?: string             // Timestamp ultimo incidente
}
```

## 🔧 CONFIGURAZIONE DATABASE

### Schema AuditLog

```prisma
model AuditLog {
  id          String       @id @default(uuid())
  action      AuditAction
  userId      String?
  userEmail   String?
  userRole    String?
  ipAddress   String
  userAgent   String
  sessionId   String?
  entityType  String
  entityId    String?
  timestamp   DateTime     @default(now())
  details     String?
  severity    LogSeverity
  category    LogCategory
  success     Boolean      @default(true)
  metadata    Json?
  
  user        User?        @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([action])
  @@index([timestamp])
  @@index([severity])
}

enum AuditAction {
  LOGIN_SUCCESS
  LOGIN_FAILED
  LOGOUT
  UNAUTHORIZED_ACCESS
  PERMISSION_DENIED
  RATE_LIMIT_EXCEEDED
  SUSPICIOUS_ACTIVITY
  // ... altri
}

enum LogSeverity {
  DEBUG
  INFO
  WARNING
  ERROR
  CRITICAL
}
```

## 📈 METRICHE E SOGLIE

### Soglie di Alert

| Metrica | Warning | Critical |
|---------|---------|----------|
| Login falliti/ora | 5 | 10 |
| Login falliti/24h | 20 | 50 |
| Attività sospette | 5 | 15 |
| Eventi critici | 1 | 5 |
| Rate limit hits/ora | 10 | 50 |

### Performance
- Query time: < 200ms
- Update interval: 60s
- Memory usage: < 10MB
- Cache TTL: 30s

## 🚨 GESTIONE EVENTI

### Workflow Evento Critico

1. **Rilevamento**: AuditLog registra evento
2. **Classificazione**: Assegnazione severity
3. **Notifica**: Alert a admin via WebSocket
4. **Visualizzazione**: Appare nel SecurityIndicator
5. **Azione**: Admin può risolvere evento
6. **Tracking**: Log risoluzione

### API Risoluzione Eventi

```typescript
POST /api/security/resolve-event/:id
{
  "notes": "Azione intrapresa per risolvere"
}
```

## 🔐 SICUREZZA

### Protezioni Implementate

- **Authentication**: JWT required
- **Authorization**: ADMIN/SUPER_ADMIN only
- **Rate Limiting**: 100 req/min
- **Input Validation**: Zod schemas
- **Audit Logging**: Tutte le azioni
- **Data Sanitization**: XSS prevention

### Privacy

- No password in logs
- IP anonimizzazione dopo 30 giorni
- GDPR compliance per dati utente
- Encryption at rest per metadata

## 🧪 TESTING

### Test Scenari

```javascript
// Simula login falliti multipli
for(let i = 0; i < 10; i++) {
  await api.post('/auth/login', { 
    email: 'test@test.com', 
    password: 'wrong' 
  });
}

// Verifica che SecurityIndicator mostri warning
expect(indicator.status).toBe('warning');
```

### Test Rate Limiting

```bash
# Genera molte richieste
for i in {1..150}; do
  curl -X GET http://localhost:3200/api/test
done

# Verifica rate limit nel SecurityIndicator
```

## 🚨 TROUBLESHOOTING

### Problema: "0 IP bloccati" sempre

**Causa**: Tabella `blockedIp` non esiste nel database

**Soluzione**: 
- Attualmente restituisce sempre 0
- Future: implementare tabella blockedIp

### Problema: Eventi non aggiornati

**Possibili cause**:
1. WebSocket disconnesso
2. Query timeout su database
3. Cache non invalidata

**Soluzioni**:
1. Verificare connessione WebSocket
2. Ottimizzare query con indici
3. Forzare refresh con pulsante

### Problema: Troppi falsi positivi

**Tuning consigliato**:
```javascript
// Aumenta soglie in config
const WARNING_THRESHOLD = {
  failedLogins: 10,  // invece di 5
  suspicious: 10,    // invece di 5
};
```

## 📊 ESEMPIO RESPONSE

```json
{
  "success": true,
  "data": {
    "overall": "warning",
    "failedLogins24h": 25,
    "failedLoginsLastHour": 6,
    "suspiciousActivities": 8,
    "criticalEvents": 0,
    "newDevices": 3,
    "blockedIps": 0,
    "rateLimitHits": 12,
    "lastIncident": "2025-09-28T17:45:00Z",
    "events": [
      {
        "id": "evt_123",
        "type": "login_failed",
        "severity": "high",
        "message": "Tentativo di login fallito",
        "userEmail": "john@example.com",
        "ipAddress": "192.168.1.100",
        "location": "Milano, IT",
        "timestamp": "2025-09-28T18:30:00Z",
        "resolved": false
      }
    ]
  }
}
```

## 🎯 BEST PRACTICES

1. **Non mostrare IP completi** - Anonimizza ultimi ottetti
2. **Aggregare eventi simili** - Evita spam nel pannello
3. **Prioritizzare eventi critici** - Mostra prima i più importanti
4. **Implementare auto-remediation** - Blocco automatico IP sospetti
5. **Mantenere history limitata** - Max 100 eventi nel pannello

## 📚 DIPENDENZE

- `@tanstack/react-query`: Data fetching
- `date-fns`: Formatting date/time
- `@heroicons/react`: Icone UI
- `@prisma/client`: Database queries

## 🔄 INTEGRAZIONE CON ALTRI SISTEMI

- **AuditLog Service**: Fonte eventi
- **NotificationService**: Alert real-time
- **EmailService**: Notifiche critiche
- **LoginHistory**: Tracking dispositivi

---

**Autore**: Security Team  
**Ultimo aggiornamento**: 28 Settembre 2025  
**Review**: DevOps Team