# 📖 GUIDA SISTEMA NOTIFICHE
**Versione**: 3.1.0  
**Ultimo aggiornamento**: 6 Gennaio 2025

---

## 📋 INDICE
1. [Introduzione](#introduzione)
2. [Architettura](#architettura)
3. [Tipi di Notifiche](#tipi-di-notifiche)
4. [Implementazione](#implementazione)
5. [API Reference](#api-reference)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 INTRODUZIONE

Il Sistema di Notifiche è il componente centrale per tutte le comunicazioni dell'applicazione. Gestisce l'invio di notifiche attraverso multipli canali garantendo delivery affidabile e tracking completo.

### Caratteristiche Principali
- ✅ **Multi-canale**: WebSocket, Email, SMS, Push
- ✅ **Tracking completo**: Ogni notifica registrata
- ✅ **Template dinamici**: Personalizzazione contenuti
- ✅ **Priority system**: Gestione urgenze
- ✅ **Retry logic**: Reinvio automatico
- ✅ **Dashboard admin**: Monitoraggio real-time

---

## 🏗️ ARCHITETTURA

### Componenti Principali

```
┌─────────────────────────────────────────┐
│           NOTIFICATION SERVICE           │
│                (Core)                    │
├─────────────────────────────────────────┤
│  • Gestione invio                       │
│  • Routing canali                       │
│  • Template processing                  │
│  • Error handling                       │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┬─────────┬──────────┐
    ▼             ▼         ▼          ▼
┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
│WebSocket│  │ Email  │  │  SMS   │  │  Push  │
│Socket.io│  │ Brevo  │  │ Twilio │  │  FCM   │
└────────┘  └────────┘  └────────┘  └────────┘
```

### Database Schema

```prisma
// Notifica principale
model Notification {
  id           String    @id @default(cuid())
  type         String    // Tipo notifica
  title        String    // Titolo
  content      String    // Contenuto (NON message!)
  recipientId  String    // Destinatario
  priority     NotificationPriority
  isRead       Boolean  @default(false)
  readAt       DateTime?
  metadata     Json?     // Dati extra
  
  // Relazioni
  recipient    User      @relation(...)
  senderId     String?
  entityType   String?   // REQUEST, QUOTE, etc
  entityId     String?   // ID entità correlata
  
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}

// Log di tracking
model NotificationLog {
  id              String    @id @default(cuid())
  recipientId     String?
  recipientEmail  String?
  recipientPhone  String?
  channel         String    // Canale utilizzato
  status          String    // sent, failed, pending
  subject         String?
  content         String?
  variables       Json?
  sentAt          DateTime?
  failedAt        DateTime?
  failureReason   String?
  createdAt       DateTime  @default(now())
}

// Preferenze utente
model NotificationPreference {
  id                  String   @id @default(cuid())
  userId              String   @unique
  emailNotifications  Boolean  @default(true)
  pushNotifications   Boolean  @default(true)
  smsNotifications    Boolean  @default(false)
  
  // Per tipo
  requestUpdates      Boolean  @default(true)
  quoteUpdates        Boolean  @default(true)
  paymentUpdates      Boolean  @default(true)
  chatMessages        Boolean  @default(true)
  
  User                User     @relation(...)
}
```

---

## 📬 TIPI DI NOTIFICHE

### Sistema Richieste
| Tipo | Descrizione | Canali | Priority |
|------|-------------|--------|----------|
| `NEW_REQUEST` | Nuova richiesta creata | WebSocket, Email | NORMAL |
| `REQUEST_ASSIGNED` | Professionista assegnato | WebSocket, Email | HIGH |
| `REQUEST_STATUS_CHANGED` | Cambio stato | WebSocket | NORMAL |
| `REQUEST_COMPLETED` | Richiesta completata | WebSocket, Email | NORMAL |
| `REQUEST_CANCELLED` | Richiesta cancellata | WebSocket, Email | HIGH |

### Sistema Preventivi
| Tipo | Descrizione | Canali | Priority |
|------|-------------|--------|----------|
| `NEW_QUOTE` | Nuovo preventivo | WebSocket, Email | HIGH |
| `QUOTE_ACCEPTED` | Preventivo accettato | WebSocket, Email | HIGH |
| `QUOTE_REJECTED` | Preventivo rifiutato | WebSocket | NORMAL |
| `QUOTE_EXPIRED` | Preventivo scaduto | Email | LOW |

### Sistema Interventi
| Tipo | Descrizione | Canali | Priority |
|------|-------------|--------|----------|
| `INTERVENTION_PROPOSED` | Date proposte | WebSocket, Email | HIGH |
| `INTERVENTION_CONFIRMED` | Data confermata | WebSocket, Email | HIGH |
| `INTERVENTION_DECLINED` | Data rifiutata | WebSocket | NORMAL |
| `INTERVENTION_REMINDER` | Promemoria 24h | WebSocket, Email | NORMAL |
| `INTERVENTION_COMPLETED` | Intervento completato | WebSocket, Email | HIGH |

### Sistema Rapporti
| Tipo | Descrizione | Canali | Priority |
|------|-------------|--------|----------|
| `REPORT_CREATED` | Rapporto creato | WebSocket, Email | NORMAL |
| `REPORT_FINALIZED` | Rapporto finalizzato | WebSocket, Email | HIGH |
| `REPORT_SIGNED_BY_PROFESSIONAL` | Firma professionista | WebSocket, Email | HIGH |
| `REPORT_SIGNED_BY_CLIENT` | Firma cliente | WebSocket, Email | NORMAL |
| `REPORT_SENT` | Rapporto inviato | WebSocket, Email | HIGH |

### Sistema Pagamenti
| Tipo | Descrizione | Canali | Priority |
|------|-------------|--------|----------|
| `PAYMENT_RECEIVED` | Pagamento ricevuto | WebSocket, Email | NORMAL |
| `PAYMENT_CONFIRMED` | Pagamento confermato | WebSocket, Email | HIGH |
| `PAYMENT_FAILED` | Pagamento fallito | WebSocket, Email | URGENT |
| `PAYMENT_REFUNDED` | Rimborso elaborato | WebSocket, Email | HIGH |

### Sistema Chat
| Tipo | Descrizione | Canali | Priority |
|------|-------------|--------|----------|
| `CHAT_MESSAGE` | Nuovo messaggio | WebSocket | NORMAL |
| `CHAT_STARTED` | Chat iniziata | WebSocket | LOW |

---

## 💻 IMPLEMENTAZIONE

### Invio Notifica Base

```typescript
import { notificationService } from '../services/notification.service';

// Esempio base
await notificationService.sendToUser({
  userId: 'user-id-123',
  type: 'NEW_QUOTE',
  title: 'Nuovo preventivo ricevuto',
  message: 'Hai ricevuto un nuovo preventivo di €500',
  priority: 'high',
  channels: ['websocket', 'email']
});
```

### Invio con Metadata

```typescript
// Con dati aggiuntivi
await notificationService.sendToUser({
  userId: recipientId,
  type: 'PAYMENT_CONFIRMED',
  title: 'Pagamento confermato',
  message: `Il tuo pagamento di €${amount} è stato confermato`,
  priority: 'high',
  data: {
    paymentId: payment.id,
    amount: amount,
    transactionId: 'stripe_xxx',
    receiptUrl: 'https://...',
    actionUrl: `${process.env.FRONTEND_URL}/payments/${payment.id}`
  },
  channels: ['websocket', 'email']
});
```

### Broadcast a Ruolo

```typescript
// Invia a tutti i professionisti
await notificationService.sendToRole('PROFESSIONAL', {
  type: 'SYSTEM_ANNOUNCEMENT',
  title: 'Manutenzione programmata',
  message: 'Il sistema sarà in manutenzione domani dalle 2:00 alle 4:00',
  priority: 'normal',
  channels: ['websocket', 'email']
});
```

### Notifica a Gruppo

```typescript
// Invia a utenti specifici
const userIds = ['user1', 'user2', 'user3'];

for (const userId of userIds) {
  await notificationService.sendToUser({
    userId,
    type: 'GROUP_UPDATE',
    title: 'Aggiornamento gruppo',
    message: 'Ci sono novità nel tuo gruppo',
    priority: 'normal',
    channels: ['websocket']
  });
}
```

### Gestione Errori

```typescript
try {
  await notificationService.sendToUser({
    userId: recipientId,
    type: 'CRITICAL_UPDATE',
    title: 'Aggiornamento critico',
    message: 'Azione richiesta urgentemente',
    priority: 'urgent',
    channels: ['websocket', 'email', 'sms']
  });
} catch (error) {
  logger.error('Failed to send notification:', error);
  // Fallback logic
  await sendAlternativeNotification(recipientId);
}
```

---

## 🔌 API REFERENCE

### REST Endpoints

#### Get Notifications
```http
GET /api/notifications
Authorization: Bearer {token}

Query Parameters:
- isRead: boolean
- type: string
- priority: string
- limit: number
- offset: number

Response:
{
  "success": true,
  "data": [
    {
      "id": "notif-123",
      "type": "NEW_QUOTE",
      "title": "Nuovo preventivo",
      "content": "...",
      "priority": "HIGH",
      "isRead": false,
      "createdAt": "2025-01-06T10:00:00Z"
    }
  ],
  "total": 25
}
```

#### Mark as Read
```http
PUT /api/notifications/:id/read
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### Mark All as Read
```http
PUT /api/notifications/read-all
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "All notifications marked as read"
}
```

### WebSocket Events

#### Client → Server
```javascript
// Sottoscrivi a notifiche
socket.emit('notification:subscribe', { userId });

// Richiedi non lette
socket.emit('notification:getUnread');

// Marca come letta
socket.emit('notification:markAsRead', notificationId);

// Marca tutte come lette
socket.emit('notification:markAllAsRead');
```

#### Server → Client
```javascript
// Nuova notifica
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});

// Lista non lette
socket.on('notification:unreadList', ({ notifications, count }) => {
  console.log(`You have ${count} unread notifications`);
});

// Contatore aggiornato
socket.on('notification:unreadCount', ({ count }) => {
  updateBadge(count);
});
```

### Admin Endpoints

#### Get Stats
```http
GET /api/notifications/stats
Authorization: Bearer {admin-token}

Response:
{
  "total": 1543,
  "sent": 1420,
  "failed": 123,
  "byType": {...},
  "byChannel": {...},
  "last7Days": [...]
}
```

#### Get Logs
```http
GET /api/notifications/logs
Authorization: Bearer {admin-token}

Query Parameters:
- channel: email|sms|websocket|push
- status: sent|failed|pending
- dateFrom: ISO date
- dateTo: ISO date
- search: string

Response:
{
  "data": [...],
  "total": 500,
  "page": 1,
  "pages": 10
}
```

---

## 🔧 TROUBLESHOOTING

### Problema: Notifiche non salvate
```
Error: Field 'id' doesn't have a default value
```
**Soluzione**: Assicurarsi di generare UUID
```typescript
id: uuidv4() // SEMPRE!
```

### Problema: Campo non trovato
```
Error: Unknown column 'message' in field list
```
**Soluzione**: Usare `content` non `message`
```typescript
content: data.message // NON message: data.message
```

### Problema: Enum non valido
```
Error: Invalid enum value 'urgent'
```
**Soluzione**: Priority deve essere MAIUSCOLO
```typescript
priority: 'URGENT' // NON 'urgent'
```

### Problema: Email non inviate
**Checklist**:
1. ✅ Verificare `BREVO_API_KEY` in .env
2. ✅ Controllare preferenze utente
3. ✅ Verificare email valida destinatario
4. ✅ Controllare logs in `NotificationLog`

### Problema: WebSocket non riceve
**Checklist**:
1. ✅ Verificare connessione Socket.io
2. ✅ Controllare autenticazione JWT
3. ✅ Verificare subscription a room corretta
4. ✅ Controllare console browser per errori

---

## 📊 MONITORAGGIO

### Dashboard Admin
**URL**: http://localhost:5193/admin/notifications

**Requisiti**: Account SUPER_ADMIN

**Funzionalità**:
- Statistiche real-time
- Log completi con filtri
- Gestione template
- Test invio
- Export dati

### Metriche Chiave
- **Delivery Rate**: % notifiche consegnate
- **Read Rate**: % notifiche lette
- **Failure Rate**: % notifiche fallite
- **Response Time**: Tempo medio invio
- **Channel Distribution**: Uso per canale

### Query Utili Database

```sql
-- Notifiche non lette per utente
SELECT recipientId, COUNT(*) as unread
FROM "Notification"
WHERE isRead = false
GROUP BY recipientId;

-- Statistiche per tipo
SELECT type, COUNT(*) as count
FROM "Notification"
WHERE createdAt > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY count DESC;

-- Log errori email
SELECT * FROM "NotificationLog"
WHERE channel = 'email' 
AND status = 'failed'
ORDER BY createdAt DESC
LIMIT 10;
```

---

## 🚀 BEST PRACTICES

### 1. Usa sempre il servizio centrale
```typescript
// ✅ CORRETTO
await notificationService.sendToUser({...});

// ❌ SBAGLIATO
await prisma.notification.create({...});
```

### 2. Specifica canali appropriati
```typescript
// Urgente: tutti i canali
channels: ['websocket', 'email', 'sms']

// Normale: solo essenziali
channels: ['websocket', 'email']

// Info: solo in-app
channels: ['websocket']
```

### 3. Includi action URL
```typescript
data: {
  actionUrl: `${process.env.FRONTEND_URL}/requests/${id}`
}
```

### 4. Gestisci sempre gli errori
```typescript
try {
  await notificationService.sendToUser({...});
} catch (error) {
  logger.error('Notification failed:', error);
}
```

### 5. Usa priority appropriate
- `URGENT`: Richiede azione immediata
- `HIGH`: Importante, da vedere presto
- `NORMAL`: Notifica standard
- `LOW`: Informativa, può attendere

---

## 📝 TEMPLATE EMAIL

### Struttura Standard
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #3B82F6; color: white; padding: 20px; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { 
      display: inline-block;
      padding: 12px 24px;
      background: #3B82F6;
      color: white;
      text-decoration: none;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>{{title}}</h2>
    </div>
    <div class="content">
      <p>Ciao {{firstName}},</p>
      <p>{{message}}</p>
      <a href="{{actionUrl}}" class="button">Visualizza</a>
    </div>
  </div>
</body>
</html>
```

---

## 📞 SUPPORTO

Per assistenza contattare:
- **Email**: lucamambelli@lmtecnologie.it
- **GitHub**: @241luca

---

**Fine Documentazione**  
v3.1.0 - 6 Gennaio 2025
