# WebSocket Events Documentation

## Connection Events

### `connect`
Emesso quando il client si connette con successo.
```javascript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

### `connected`
Emesso dopo autenticazione riuscita con dati utente.
```javascript
socket.on('connected', (data) => {
  // data: { userId, organizationId, role, timestamp }
});
```

### `disconnect`
Emesso quando il client si disconnette.
```javascript
socket.on('disconnect', (reason) => {
  // reason: 'io server disconnect' | 'transport close' | etc.
});
```

### `error`
Emesso in caso di errore.
```javascript
socket.on('error', (error) => {
  // error: { message: string }
});
```

## Notification Events

### Client → Server

#### `notification:getUnread`
Richiede le notifiche non lette.
```javascript
socket.emit('notification:getUnread');
```

#### `notification:markAsRead`
Segna una notifica come letta.
```javascript
socket.emit('notification:markAsRead', notificationId);
```

#### `notification:markAllAsRead`
Segna tutte le notifiche come lette.
```javascript
socket.emit('notification:markAllAsRead');
```

#### `notification:delete`
Elimina una notifica.
```javascript
socket.emit('notification:delete', notificationId);
```

#### `notification:getPreferences`
Recupera le preferenze notifiche.
```javascript
socket.emit('notification:getPreferences');
```

#### `notification:updatePreferences`
Aggiorna le preferenze notifiche.
```javascript
socket.emit('notification:updatePreferences', {
  email: true,
  push: false,
  sms: false,
  inApp: true
});
```

### Server → Client

#### `notification:new`
Nuova notifica ricevuta.
```javascript
socket.on('notification:new', (notification) => {
  // notification: {
  //   id: string,
  //   type: string,
  //   title: string,
  //   message: string,
  //   priority: 'low' | 'normal' | 'high' | 'urgent',
  //   data: any,
  //   timestamp: Date
  // }
});
```

#### `notification:unreadList`
Lista notifiche non lette.
```javascript
socket.on('notification:unreadList', (data) => {
  // data: { notifications: Notification[], count: number }
});
```

#### `notification:unreadCount`
Contatore notifiche non lette.
```javascript
socket.on('notification:unreadCount', (data) => {
  // data: { count: number }
});
```

#### `notification:marked`
Conferma notifica segnata come letta.
```javascript
socket.on('notification:marked', (data) => {
  // data: { id: string, isRead: true }
});
```

#### `notification:deleted`
Conferma notifica eliminata.
```javascript
socket.on('notification:deleted', (data) => {
  // data: { id: string }
});
```

## Request Events

### Client → Server

#### `request:subscribe`
Sottoscrivi a una richiesta.
```javascript
socket.emit('request:subscribe', requestId);
```

#### `request:unsubscribe`
Annulla sottoscrizione.
```javascript
socket.emit('request:unsubscribe', requestId);
```

#### `request:updateStatus`
Aggiorna stato richiesta.
```javascript
socket.emit('request:updateStatus', {
  requestId: string,
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled'
});
```

#### `request:sendUpdate`
Invia aggiornamento richiesta.
```javascript
socket.emit('request:sendUpdate', {
  requestId: string,
  message: string,
  attachments?: string[]
});
```

### Server → Client

#### `request:assigned`
Richiesta assegnata.
```javascript
socket.on('request:assigned', (data) => {
  // data: { requestId, title, timestamp }
});
```

#### `request:statusUpdated`
Stato richiesta aggiornato.
```javascript
socket.on('request:statusUpdated', (data) => {
  // data: { requestId, status, updatedBy, timestamp }
});
```

#### `request:newUpdate`
Nuovo aggiornamento richiesta.
```javascript
socket.on('request:newUpdate', (update) => {
  // update: { id, requestId, userId, message, attachments, timestamp }
});
```

#### `request:completed`
Richiesta completata.
```javascript
socket.on('request:completed', (data) => {
  // data: { requestId, timestamp }
});
```

## Quote Events

### Client → Server

#### `quote:subscribe`
Sottoscrivi a un preventivo.
```javascript
socket.emit('quote:subscribe', quoteId);
```

#### `quote:updateStatus`
Aggiorna stato preventivo.
```javascript
socket.emit('quote:updateStatus', {
  quoteId: string,
  status: 'draft' | 'pending' | 'accepted' | 'rejected' | 'expired'
});
```

#### `quote:requestRevision`
Richiedi revisione preventivo.
```javascript
socket.emit('quote:requestRevision', {
  quoteId: string,
  message: string
});
```

### Server → Client

#### `quote:new`
Nuovo preventivo ricevuto.
```javascript
socket.on('quote:new', (data) => {
  // data: { quoteId, requestId, professionalName, timestamp }
});
```

#### `quote:statusUpdated`
Stato preventivo aggiornato.
```javascript
socket.on('quote:statusUpdated', (data) => {
  // data: { quoteId, status, updatedBy, timestamp }
});
```

#### `quote:revisionRequested`
Richiesta revisione preventivo.
```javascript
socket.on('quote:revisionRequested', (data) => {
  // data: { quoteId, revisionId, message, timestamp }
});
```

#### `quote:depositPaid`
Deposito pagato.
```javascript
socket.on('quote:depositPaid', (data) => {
  // data: { quoteId, amount, timestamp }
});
```

## Message Events

### Client → Server

#### `message:send`
Invia messaggio.
```javascript
socket.emit('message:send', {
  recipientId: string,
  content: string,
  requestId?: string,
  attachments?: string[]
});
```

#### `message:markAsRead`
Segna messaggi come letti.
```javascript
socket.emit('message:markAsRead', messageIds);
```

#### `message:getHistory`
Recupera cronologia messaggi.
```javascript
socket.emit('message:getHistory', {
  otherUserId: string,
  requestId?: string,
  limit?: number,
  before?: string
});
```

#### `message:delete`
Elimina messaggio.
```javascript
socket.emit('message:delete', messageId);
```

#### `typing:start`
Inizia indicatore digitazione.
```javascript
socket.emit('typing:start', {
  recipientId: string,
  requestId?: string
});
```

#### `typing:stop`
Ferma indicatore digitazione.
```javascript
socket.emit('typing:stop', {
  recipientId: string,
  requestId?: string
});
```

### Server → Client

#### `message:new`
Nuovo messaggio ricevuto.
```javascript
socket.on('message:new', (message) => {
  // message: {
  //   id: string,
  //   content: string,
  //   senderId: string,
  //   sender: { firstName, lastName, avatar },
  //   attachments: string[],
  //   timestamp: Date
  // }
});
```

#### `message:sent`
Conferma messaggio inviato.
```javascript
socket.on('message:sent', (message) => {
  // message: Message object with id
});
```

#### `message:history`
Cronologia messaggi.
```javascript
socket.on('message:history', (data) => {
  // data: { messages: Message[], hasMore: boolean }
});
```

#### `message:read`
Messaggi letti dal destinatario.
```javascript
socket.on('message:read', (data) => {
  // data: { messageIds: string[], readBy: string, timestamp: Date }
});
```

#### `message:deleted`
Messaggio eliminato.
```javascript
socket.on('message:deleted', (data) => {
  // data: { messageId, deletedBy, timestamp }
});
```

#### `typing:update`
Stato digitazione.
```javascript
socket.on('typing:update', (data) => {
  // data: { userId, requestId?, isTyping, timestamp }
});
```

## User Events

### Client → Server

#### `user:status`
Aggiorna stato utente.
```javascript
socket.emit('user:status', 'online' | 'away' | 'busy' | 'offline');
```

#### `subscribe`
Sottoscrivi a canali specifici.
```javascript
socket.emit('subscribe', ['channel1', 'channel2']);
```

#### `ping`
Ping per test latenza.
```javascript
socket.emit('ping');
```

### Server → Client

#### `user:status:changed`
Stato utente cambiato.
```javascript
socket.on('user:status:changed', (data) => {
  // data: { userId, status, timestamp }
});
```

#### `user:offline`
Utente offline.
```javascript
socket.on('user:offline', (data) => {
  // data: { userId, timestamp }
});
```

#### `pong`
Risposta al ping.
```javascript
socket.on('pong', (data) => {
  // data: { timestamp: number }
});
```

## Error Handling

Tutti gli eventi possono ritornare un errore:
```javascript
socket.on('error', (error) => {
  // error: { message: string, code?: string }
});
```

## Rate Limiting

- Max 100 eventi al minuto per socket
- Typing indicators: max 1 ogni 300ms
- File uploads: max 5 file per messaggio

## Best Practices

1. **Always handle errors**
```javascript
socket.emit('event', data);
socket.once('event:response', handleSuccess);
socket.once('event:error', handleError);
```

2. **Cleanup listeners**
```javascript
useEffect(() => {
  const handler = (data) => { /* ... */ };
  socket.on('event', handler);
  return () => socket.off('event', handler);
}, []);
```

3. **Check connection state**
```javascript
if (socket.connected) {
  socket.emit('event', data);
} else {
  toast.error('Not connected');
}
```

4. **Use typed events**
```typescript
interface NotificationPayload {
  type: string;
  title: string;
  message: string;
}

socket.on('notification:new', (data: NotificationPayload) => {
  // Type-safe handling
});
```
