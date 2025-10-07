# 📬 SISTEMA NOTIFICHE - DOCUMENTAZIONE COMPLETA v2.0

**Versione**: 2.0.0  
**Data Ultimo Aggiornamento**: 6 Settembre 2025  
**Stato**: ✅ Production Ready  
**Dashboard Admin**: http://localhost:5193/admin/notifications

## 📋 Indice
1. [Overview](#overview)
2. [Architettura](#architettura)
3. [Installazione](#installazione)
4. [Utilizzo](#utilizzo)
5. [Tipi di Notifiche](#tipi-di-notifiche)
6. [API Reference](#api-reference)
7. [Dashboard Admin](#dashboard-admin)
8. [Testing](#testing)
9. [Monitoring](#monitoring)
10. [Troubleshooting](#troubleshooting)
11. [Best Practices](#best-practices)
12. [Roadmap](#roadmap)

---

## Overview

Il Sistema di Notifiche è un servizio unificato per gestire tutte le comunicazioni dell'applicazione Richiesta Assistenza. Supporta multiple modalità di invio (WebSocket, Email, SMS, Push) e garantisce che ogni utente riceva le informazioni importanti nel modo più appropriato.

### Caratteristiche Principali
- ✅ **Multi-canale**: WebSocket, Email, SMS (ready), Push (ready)
- ✅ **Priorità**: Gestione urgenza notifiche (low, normal, high, urgent)
- ✅ **Template System**: Template predefiniti e personalizzabili
- ✅ **Preferenze Utente**: Ogni utente può configurare come ricevere notifiche
- ✅ **Real-time**: WebSocket per notifiche istantanee in-app
- ✅ **Audit Trail**: Log completo di tutte le notifiche inviate
- ✅ **Retry Logic**: Reinvio automatico in caso di fallimento
- ✅ **Rate Limiting**: Protezione contro spam

---

## Architettura

```
┌─────────────────────────────────────────────┐
│            APPLICATION LAYER                 │
│  (Services, Routes, Handlers)               │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         NOTIFICATION SERVICE                 │
│  (notification.service.ts - Singleton)       │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│           DELIVERY CHANNELS                  │
├──────────────┬──────────────┬───────────────┤
│  WebSocket   │    Email     │   SMS/Push    │
│  (Socket.io) │  (Nodemailer)│   (Ready)     │
└──────────────┴──────────────┴───────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              DATABASE                        │
│  - Notification (stored messages)            │
│  - NotificationPreference (user settings)    │
│  - NotificationLog (audit trail)            │
└─────────────────────────────────────────────┘
```

### File Struttura

```
backend/
├── src/
│   ├── config/
│   │   └── notificationTypes.ts    # Tipi e template notifiche
│   ├── services/
│   │   └── notification.service.ts  # Servizio principale
│   ├── websocket/
│   │   └── handlers/
│   │       └── notification.handler.ts  # WebSocket handler
│   └── utils/
│       └── errors.ts               # Classi errori custom
```

---

## Installazione

### Prerequisiti
- Node.js 18+
- PostgreSQL 14+
- Redis (per code)

### Setup

1. **Installare dipendenze**
```bash
cd backend
npm install
```

2. **Configurare variabili ambiente**
```env
# .env file
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:5193

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password

# SMS (opzionale)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...

# Push (opzionale)
FCM_SERVER_KEY=...
```

3. **Eseguire migrazioni database**
```bash
npx prisma migrate dev
npx prisma generate
```

4. **Avviare servizi**
```bash
# Terminal 1 - Redis
redis-server

# Terminal 2 - Backend
npm run dev
```

---

## Utilizzo

### Invio Notifica Base

```typescript
import { notificationService } from './services/notification.service';

// Esempio semplice
await notificationService.sendToUser({
  userId: 'user-uuid',
  type: 'NEW_REQUEST',
  title: 'Nuova richiesta',
  message: 'Hai una nuova richiesta di assistenza',
  priority: 'normal',
  channels: ['websocket', 'email']
});
```

### Invio con Dati Contestuali

```typescript
await notificationService.sendToUser({
  userId: clientId,
  type: 'NEW_QUOTE',
  title: 'Nuovo Preventivo',
  message: `Preventivo di €${amount} ricevuto`,
  priority: 'high',
  data: {
    quoteId: quote.id,
    requestId: request.id,
    amount: amount,
    professionalName: professional.name,
    actionUrl: `${process.env.FRONTEND_URL}/quotes/${quote.id}`
  },
  channels: ['websocket', 'email']
});
```

### Gestione Errori

```typescript
// Non bloccare il flusso principale
try {
  await notificationService.sendToUser({...});
} catch (error) {
  logger.error('Notification failed:', error);
  // Continua comunque l'esecuzione
}
```

### Invio a Ruolo

```typescript
// Invia a tutti gli admin
await notificationService.sendToRole('ADMIN', {
  type: 'SYSTEM_MAINTENANCE',
  title: 'Manutenzione programmata',
  message: 'Il sistema sarà in manutenzione dalle 2:00 alle 4:00',
  priority: 'high'
});
```

### Broadcasting

```typescript
// Invia a tutti gli utenti
await notificationService.broadcastToAll({
  type: 'SYSTEM_UPDATE',
  title: 'Aggiornamento sistema',
  message: 'Nuove funzionalità disponibili!',
  channels: ['websocket']
});
```

---

## Tipi di Notifiche

### Richieste
- `NEW_REQUEST` - Nuova richiesta creata
- `REQUEST_ASSIGNED` - Richiesta assegnata a professionista
- `REQUEST_STATUS_CHANGED` - Cambio stato richiesta
- `PROFESSIONAL_ASSIGNED` - Professionista assegnato (cliente)

### Interventi
- `INTERVENTIONS_PROPOSED` - Date proposte dal professionista
- `INTERVENTION_ACCEPTED` - Data accettata dal cliente
- `INTERVENTION_REJECTED` - Data rifiutata dal cliente
- `INTERVENTION_REMINDER` - Promemoria intervento

### Preventivi
- `NEW_QUOTE` - Nuovo preventivo ricevuto
- `QUOTE_ACCEPTED` - Preventivo accettato
- `QUOTE_REJECTED` - Preventivo rifiutato
- `QUOTE_EXPIRED` - Preventivo scaduto

### Pagamenti
- `PAYMENT_SUCCESS` - Pagamento completato
- `PAYMENT_FAILED` - Pagamento fallito
- `DEPOSIT_REQUIRED` - Richiesta deposito
- `DEPOSIT_RECEIVED` - Deposito ricevuto

### Utenti
- `WELCOME` - Benvenuto nuovo utente
- `EMAIL_VERIFIED` - Email verificata
- `PASSWORD_RESET` - Reset password richiesto
- `PASSWORD_CHANGED` - Password modificata

### Chat
- `NEW_MESSAGE` - Nuovo messaggio ricevuto

---

## API Reference

### NotificationService

#### sendToUser(data: NotificationData)
Invia notifica a un utente specifico.

**Parametri:**
- `userId` (string): ID destinatario
- `type` (string): Tipo notifica
- `title` (string): Titolo
- `message` (string): Messaggio
- `priority` (string): low|normal|high|urgent
- `data` (object): Dati aggiuntivi
- `channels` (array): Canali di invio

**Esempio:**
```typescript
await notificationService.sendToUser({
  userId: 'user-123',
  type: 'NEW_MESSAGE',
  title: 'Nuovo messaggio',
  message: 'Hai ricevuto un messaggio',
  priority: 'normal',
  channels: ['websocket']
});
```

#### sendToRole(role: string, data: NotificationData)
Invia notifica a tutti gli utenti con un ruolo.

#### broadcastToAll(data: NotificationData)
Invia notifica a tutti gli utenti.

#### markAsRead(notificationId: string, userId: string)
Segna notifica come letta.

#### markAllAsRead(userId: string)
Segna tutte le notifiche come lette.

#### getUnread(userId: string, limit?: number)
Recupera notifiche non lette.

#### countUnread(userId: string)
Conta notifiche non lette.

---

## Dashboard Admin

### Accesso
- **URL**: http://localhost:5193/admin/notifications
- **Ruoli Autorizzati**: ADMIN, SUPER_ADMIN
- **Login Test**: admin@test.com / Admin123!

### Funzionalità Dashboard

#### 📊 Tab Overview
- **Statistiche Real-time**: Totali, consegnate, lette, fallite
- **Grafici Interattivi**: 
  - Breakdown per tipo notifica
  - Distribuzione per canale
  - Trend ultimi 7 giorni
- **Metriche Performance**: Delivery rate, Read rate, Failure rate
- **KPI Dashboard**: Response time, Queue depth, Error rate

#### 📝 Tab Log Notifiche
- **Tabella Completa**: Tutte le notifiche con dettagli
- **Filtri Avanzati**:
  - Per tipo (NEW_REQUEST, NEW_QUOTE, etc.)
  - Per priorità (low, normal, high, urgent)
  - Per stato (pending, sent, delivered, read, failed)
  - Ricerca testuale
  - Range date
- **Azioni Rapide**:
  - Visualizza dettagli notifica
  - Reinvia notifiche fallite
  - Elimina notifiche (SUPER_ADMIN)
- **Export**: CSV download ready
- **Paginazione**: 100 risultati per pagina

#### 🧪 Tab Test
- **Invio Test Notifiche**:
  - Selezione destinatario per email
  - Scelta tipo notifica
  - Personalizzazione titolo e messaggio
  - Selezione priorità
  - Multi-canale (WebSocket, Email, SMS, Push)
- **Preview**: Anteprima prima dell'invio
- **Broadcast** (SUPER_ADMIN only):
  - Invio massivo per ruolo
  - Target: ALL, CLIENT, PROFESSIONAL, ADMIN
  - Scheduling opzionale

#### 📄 Tab Templates
- **Gestione Template**:
  - Lista template con categorie
  - Editor con preview
  - Variabili dinamiche
  - Attivazione/disattivazione
  - Versionamento automatico
- **Template Predefiniti**: 30+ template pronti all'uso
- **Categorie**: auth, request, quote, payment, chat, professional

#### ⚡ Tab Eventi
- **Configurazione Trigger Automatici**:
  - Eventi sistema
  - Condizioni e filtri
  - Delay configurabile
  - Test eventi

### Screenshot Dashboard

```
┌────────────────────────────────────────────────────────┐
│  🔔 Sistema Notifiche                    [Test] [+New] │
├────────────────────────────────────────────────────────┤
│ [Overview] [Logs] [Templates] [Events] [Test]          │
├────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ Totale   │ │Consegnate│ │  Lette   │ │ Fallite  │  │
│  │  15,234  │ │  14,560  │ │  12,340  │ │   344    │  │
│  │          │ │  95.6%   │ │  84.7%   │ │  2.3%    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  📊 Notifiche per Tipo        📊 Notifiche per Canale │
│  ████████████ NEW_REQUEST     ████████ WebSocket      │
│  ██████ NEW_QUOTE             ██ Email                │
│  ████ PAYMENT_SUCCESS                                  │
│                                                         │
│  📈 Trend Ultimi 7 Giorni                             │
│  [1200][1350][1100][1450][1300][1400][1550]          │
└────────────────────────────────────────────────────────┘
```

### API Endpoints Admin

| Endpoint | Method | Ruolo | Descrizione |
|----------|--------|-------|-------------|
| `/api/notifications/stats` | GET | ADMIN+ | Statistiche complete |
| `/api/notifications/logs` | GET | ADMIN+ | Log con filtri |
| `/api/notifications/test` | POST | ADMIN+ | Invio test |
| `/api/notifications/:id/resend` | POST | ADMIN+ | Reinvio notifica |
| `/api/notifications/broadcast` | POST | SUPER_ADMIN | Broadcast massivo |
| `/api/notifications/:id` | DELETE | ADMIN+ | Elimina notifica |

### Configurazione Dashboard

```typescript
// Frontend: src/components/notifications/NotificationDashboard.tsx
// Backend: backend/src/routes/notificationAdmin.routes.ts

// Permessi
const DASHBOARD_PERMISSIONS = {
  ADMIN: ['view', 'test', 'resend'],
  SUPER_ADMIN: ['view', 'test', 'resend', 'broadcast', 'delete']
};

// Rate Limiting Dashboard
const DASHBOARD_LIMITS = {
  test: '10 per hour',
  broadcast: '1 per hour',
  api_calls: '200 per 15 minutes'
};
```

---

## Testing

### Test Automatici

```bash
# Esegui test suite completa
cd /Users/lucamambelli/Desktop/richiesta-assistenza
./scripts/test-notification-system.sh
```

### Test Manuali

1. **Test Creazione Richiesta**
```bash
# 1. Login come cliente
# 2. Crea nuova richiesta
# 3. Verifica notifica admin in bell icon
# 4. Verifica email admin
```

2. **Test Preventivo**
```bash
# 1. Login come professionista
# 2. Invia preventivo
# 3. Verifica notifica cliente
# 4. Accetta preventivo
# 5. Verifica notifica professionista
```

3. **Test Chat Offline**
```bash
# 1. Utente A online, Utente B offline
# 2. A invia messaggio a B
# 3. B riceve notifica email
# 4. B si logga e vede notifica
```

### Monitoring

```bash
# Prisma Studio - Visualizza database
cd backend && npx prisma studio
# Vai a tabella Notification

# Logs real-time
tail -f backend/logs/combined.log | grep notification

# Redis monitoring
redis-cli monitor | grep notification
```

---

## Troubleshooting

### Problema: Notifiche non inviate

**Verifica:**
1. Controlla logs: `tail -f backend/logs/error.log`
2. Verifica Redis: `redis-cli ping`
3. Controlla database: `npx prisma studio`

**Soluzioni:**
- Verificare configurazione SMTP per email
- Controllare che Redis sia avviato
- Verificare preferenze utente

### Problema: WebSocket non funziona

**Verifica:**
```javascript
// Nel browser console
const socket = io('http://localhost:3200');
socket.on('connect', () => console.log('Connected'));
```

**Soluzioni:**
- Verificare CORS configuration
- Controllare firewall/proxy
- Verificare Socket.io initialization

### Problema: Email non ricevute

**Verifica:**
- Controllare spam folder
- Verificare SMTP credentials
- Check rate limiting

**Soluzioni:**
```bash
# Test SMTP
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'test@gmail.com', pass: 'password' }
});
transporter.verify((err, success) => {
  console.log(err || 'SMTP OK');
});
"
```

### Problema: Notifiche duplicate

**Cause comuni:**
- Multiple server instances
- Retry logic troppo aggressiva
- Event handlers duplicati

**Soluzioni:**
- Implementare idempotency keys
- Verificare singleton pattern
- Check event listener registration

---

## Best Practices

### 1. Priorità Appropriate
```typescript
// ✅ CORRETTO
urgent: Account security, payments failed
high: Quote accepted, intervention scheduled
normal: New message, status update
low: Marketing, suggestions
```

### 2. Canali Appropriati
```typescript
// ✅ CORRETTO
Password reset: ['email'] // Solo email per sicurezza
Payment success: ['websocket', 'email'] // Importante
New message: ['websocket'] // Real-time only
System maintenance: ['websocket', 'email', 'sms'] // Critico
```

### 3. Error Handling
```typescript
// ✅ SEMPRE con try/catch non bloccante
try {
  await notificationService.sendToUser({...});
} catch (error) {
  logger.error('Notification failed:', error);
  // NON interrompere il flusso principale
}
```

### 4. Dati Contestuali
```typescript
// ✅ SEMPRE includere actionUrl
data: {
  entityId: quote.id,
  actionUrl: `${FRONTEND_URL}/quotes/${quote.id}`,
  // Altri dati utili per il frontend
}
```

---

## Manutenzione

### Pulizia Notifiche Vecchie
```typescript
// Schedulare giornalmente
await notificationService.cleanupOldNotifications(30); // Mantieni 30 giorni
```

### Backup
```bash
# Backup tabella notifiche
pg_dump -t notification -t notification_preference > notifications_backup.sql
```

### Monitoring Metriche
```sql
-- Notifiche per tipo (ultimi 7 giorni)
SELECT type, COUNT(*) as count
FROM notification
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY type
ORDER BY count DESC;

-- Tasso lettura
SELECT 
  COUNT(CASE WHEN is_read THEN 1 END)::float / COUNT(*) * 100 as read_rate
FROM notification
WHERE created_at > NOW() - INTERVAL '30 days';
```

---

## Roadmap

### Fase 3 - In Programma
- [ ] NotificationManager unificato
- [ ] Template engine avanzato (Handlebars)
- [ ] Dashboard analytics
- [ ] A/B testing template
- [ ] Scheduling avanzato
- [ ] Webhook support
- [ ] Rate limiting per-user
- [ ] Notification grouping
- [ ] Do Not Disturb mode

---

## Supporto

Per problemi o domande:
- 📧 Email: lucamambelli@lmtecnologie.it
- 📚 Docs: `/Docs/03-SVILUPPO/sistema-notifiche.md`
- 🐛 Issues: GitHub Issues

---

*Ultimo aggiornamento: 6 Settembre 2025*  
*Versione: 2.0.0 - Fase 2 Completata*
