# WebSocket Architecture

## Overview
Il sistema di notifiche real-time utilizza WebSocket tramite Socket.io per fornire comunicazioni bidirezionali tra client e server.

## Stack Tecnologico
- **Backend**: Socket.io Server v4.x
- **Frontend**: Socket.io Client v4.x
- **Autenticazione**: JWT
- **Multi-tenancy**: Rooms basate su organizationId

## Architettura Backend

### Socket Server (`backend/src/websocket/socket.server.ts`)
Il server WebSocket principale gestisce:
- Autenticazione JWT per ogni connessione
- Room management per multi-tenancy
- Event routing agli handler specifici
- Connection lifecycle management

### Event Handlers
Il sistema è organizzato in handler modulari:

#### 1. Notification Handler (`notification.handler.ts`)
- `notification:getUnread` - Recupera notifiche non lette
- `notification:markAsRead` - Segna notifica come letta
- `notification:markAllAsRead` - Segna tutte come lette
- `notification:delete` - Elimina notifica
- `notification:getPreferences` - Recupera preferenze
- `notification:updatePreferences` - Aggiorna preferenze

#### 2. Request Handler (`request.handler.ts`)
- `request:subscribe` - Sottoscrivi a una richiesta
- `request:unsubscribe` - Annulla sottoscrizione
- `request:updateStatus` - Aggiorna stato richiesta
- `request:sendUpdate` - Invia aggiornamento

#### 3. Quote Handler (`quote.handler.ts`)
- `quote:subscribe` - Sottoscrivi a un preventivo
- `quote:updateStatus` - Aggiorna stato preventivo
- `quote:requestRevision` - Richiedi revisione

#### 4. Message Handler (`message.handler.ts`)
- `message:send` - Invia messaggio
- `message:markAsRead` - Segna come letto
- `message:getHistory` - Recupera cronologia
- `message:delete` - Elimina messaggio
- `typing:start` - Inizia digitazione
- `typing:stop` - Ferma digitazione

## Architettura Frontend

### Socket Context (`src/contexts/SocketContext.tsx`)
Provider React che gestisce:
- Connessione automatica al login
- Reconnection con exponential backoff
- Event handling centralizzato
- State management della connessione

### Components

#### NotificationCenter (`src/components/notifications/NotificationCenter.tsx`)
Centro notifiche completo con:
- Dropdown con lista notifiche
- Badge contatore non lette
- Mark as read automatico
- Eliminazione notifiche
- Sound alerts per priorità alta

#### NotificationBadge (`src/components/notifications/NotificationBadge.tsx`)
Badge semplice per mostrare il contatore notifiche.

### Hooks

#### useNotifications (`src/hooks/useNotifications.ts`)
Hook per gestire le notifiche:
```typescript
const {
  notifications,
  unreadNotifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updatePreferences
} = useNotifications();
```

#### useSocket (`src/hooks/useSocket.ts`)
Hook per interagire con WebSocket:
```typescript
const {
  socket,
  isConnected,
  emit,
  on,
  off,
  emitWithResponse,
  subscribe,
  ping
} = useSocket();
```

## Flow Autenticazione

1. **Client Login**
   - User effettua login via REST API
   - Riceve JWT token
   - Token salvato in localStorage

2. **WebSocket Connection**
   - SocketProvider legge token da localStorage
   - Invia token nell'handshake Socket.io
   - Server verifica JWT

3. **Server Authentication**
   ```typescript
   // Middleware autenticazione
   async function authenticateSocket(socket, next) {
     const token = socket.handshake.auth.token;
     const decoded = jwt.verify(token, JWT_SECRET);
     const user = await prisma.user.findUnique({
       where: { id: decoded.userId }
     });
     socket.userId = user.id;
     socket.organizationId = user.organizationId;
     next();
   }
   ```

4. **Room Assignment**
   - `user:${userId}` - Room personale
   - `org:${organizationId}` - Room organizzazione
   - `role:${userRole}` - Room per ruolo

## Multi-Tenancy

Il sistema garantisce isolamento dati tramite:

1. **Organization Rooms**
   - Ogni organizzazione ha una room dedicata
   - Broadcast limitati alla propria organizzazione

2. **Validation**
   ```typescript
   // Validazione cross-organization
   if (data.organizationId !== socket.organizationId) {
     throw new Error('Unauthorized: cross-organization access');
   }
   ```

3. **Query Filtering**
   - Tutte le query filtrate per organizationId
   - Nessun dato cross-tenant

## Eventi Real-Time

### Notifiche
```typescript
// Server invia notifica
io.to(`user:${userId}`).emit('notification:new', {
  type: 'request_assigned',
  title: 'Nuova Richiesta',
  message: 'Ti è stata assegnata una richiesta',
  priority: 'high',
  data: { requestId: '123' }
});

// Client riceve
socket.on('notification:new', (notification) => {
  // Mostra toast
  // Aggiorna contatore
  // Play sound se high priority
});
```

### Messaggi Chat
```typescript
// Invio messaggio
socket.emit('message:send', {
  recipientId: 'user123',
  content: 'Ciao!',
  requestId: 'req456'
});

// Ricezione
socket.on('message:new', (message) => {
  // Aggiungi a chat
  // Mostra notifica se non in chat
});
```

### Typing Indicators
```typescript
// Start typing
socket.emit('typing:start', { recipientId: 'user123' });

// Receive typing status
socket.on('typing:update', ({ userId, isTyping }) => {
  // Mostra/nascondi indicatore
});
```

## Reconnection Strategy

1. **Automatic Reconnection**
   - Max 5 tentativi
   - Exponential backoff (1s, 2s, 4s, 5s, 5s)

2. **State Recovery**
   - Al reconnect, richiede notifiche non lette
   - Risubscribe a rooms precedenti

3. **Offline Handling**
   - Messaggi buffered localmente
   - Sync al reconnect

## Performance Optimization

1. **Event Debouncing**
   - Typing indicators debounced 300ms
   - Scroll events throttled

2. **Lazy Loading**
   - Notifiche caricate a batch di 50
   - Infinite scroll per history

3. **Caching**
   - React Query cache 5 minuti
   - WebSocket event deduplication

## Security

1. **JWT Validation**
   - Token verificato ad ogni connessione
   - Expiry check

2. **Rate Limiting**
   - Max 100 eventi/minuto per socket
   - Throttling su typing indicators

3. **Input Validation**
   - Zod schemas per validazione
   - XSS prevention

## Testing

### Backend Testing
```bash
# Test WebSocket endpoint
curl http://localhost:3200/ws-test
```

### Frontend Testing
```javascript
// Test connection
const { ping } = useSocket();
const latency = await ping();
console.log(`Latency: ${latency}ms`);
```

## Monitoring

### Metriche da monitorare:
- Connessioni attive
- Eventi al secondo
- Latenza media
- Errori di autenticazione
- Reconnection rate

### Logging
```typescript
// Backend
logger.info(`Client connected: ${socket.id}`);
logger.error(`Socket error: ${error.message}`);

// Frontend
console.log(`🔌 Connected: ${socket.id}`);
console.error(`🔴 Connection error: ${error}`);
```

## Troubleshooting

### Problemi comuni:

1. **"Authentication failed"**
   - Verificare token JWT valido
   - Check expiry date

2. **"Cannot connect to WebSocket"**
   - Verificare CORS settings
   - Check firewall/proxy

3. **"Messages not received"**
   - Verificare room subscription
   - Check organizationId match

4. **"High latency"**
   - Verificare network
   - Check server load
   - Consider scaling

## Future Improvements

1. **Horizontal Scaling**
   - Redis adapter per multiple server
   - Sticky sessions

2. **Push Notifications**
   - FCM integration
   - Service Workers

3. **Message Queue**
   - RabbitMQ/Kafka per reliability
   - Event sourcing

4. **Analytics**
   - Event tracking
   - User behavior analysis
