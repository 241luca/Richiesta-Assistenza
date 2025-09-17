# API Reference - Sistema Chat

## Endpoints Disponibili

### 1. Recupera Messaggi Chat
**GET** `/api/chat/:requestId/messages`

Recupera tutti i messaggi di una chat specifica.

**Headers**
```javascript
{
  "Authorization": "Bearer [token]",
  "Content-Type": "application/json"
}
```

**Parametri URL**
- `requestId` (string, required): ID della richiesta

**Query Parameters**
- `limit` (number, optional): Numero massimo di messaggi (default: 50)
- `offset` (number, optional): Offset per paginazione (default: 0)

**Response 200 OK**
```json
{
  "success": true,
  "message": "Messaggi recuperati con successo",
  "data": [
    {
      "id": "msg_123",
      "requestId": "req_456",
      "userId": "user_789",
      "message": "Ciao, ho un problema con il lavandino",
      "messageType": "TEXT",
      "attachments": null,
      "isEdited": false,
      "isDeleted": false,
      "createdAt": "2025-08-31T15:30:00Z",
      "updatedAt": "2025-08-31T15:30:00Z",
      "User": {
        "id": "user_789",
        "firstName": "Mario",
        "lastName": "Rossi",
        "fullName": "Mario Rossi",
        "avatar": null,
        "role": "CLIENT"
      }
    }
  ]
}
```

**Errori Possibili**
- `401 Unauthorized`: Token mancante o invalido
- `403 Forbidden`: Utente non autorizzato ad accedere alla chat
- `404 Not Found`: Richiesta non trovata
- `500 Internal Server Error`: Errore server

---

### 2. Invia Messaggio
**POST** `/api/chat/:requestId/messages`

Invia un nuovo messaggio nella chat.

**Headers**
```javascript
{
  "Authorization": "Bearer [token]",
  "Content-Type": "multipart/form-data"
}
```

**Body (FormData)**
```javascript
{
  "message": "string, required - Testo del messaggio",
  "messageType": "TEXT | IMAGE | DOCUMENT (optional, default: TEXT)",
  "attachments": "File[] (optional) - Array di file da allegare"
}
```

**Response 200 OK**
```json
{
  "success": true,
  "message": "Messaggio inviato con successo",
  "data": {
    "id": "msg_124",
    "requestId": "req_456",
    "userId": "user_789",
    "message": "Grazie per la risposta!",
    "messageType": "TEXT",
    "attachments": null,
    "createdAt": "2025-08-31T15:35:00Z",
    "User": {
      "id": "user_789",
      "fullName": "Mario Rossi",
      "role": "CLIENT"
    }
  }
}
```

**Errori Possibili**
- `400 Bad Request`: Dati mancanti o non validi
- `401 Unauthorized`: Token mancante o invalido
- `403 Forbidden`: Chat chiusa o utente non autorizzato
- `413 Payload Too Large`: File troppo grande
- `500 Internal Server Error`: Errore server

---

### 3. Verifica Accesso Chat
**GET** `/api/chat/:requestId/access`

Verifica se l'utente può accedere alla chat e se è attiva.

**Headers**
```javascript
{
  "Authorization": "Bearer [token]"
}
```

**Response 200 OK**
```json
{
  "success": true,
  "data": {
    "canAccess": true,
    "isActive": true,
    "userId": "user_789"
  }
}
```

**Response Fields**
- `canAccess` (boolean): Se l'utente può accedere alla chat
- `isActive` (boolean): Se la chat è attiva (richiesta non completata/cancellata)
- `userId` (string): ID dell'utente corrente

---

### 4. Modifica Messaggio
**PUT** `/api/chat/messages/:messageId`

Modifica un messaggio esistente (solo proprio messaggio).

**Headers**
```javascript
{
  "Authorization": "Bearer [token]",
  "Content-Type": "application/json"
}
```

**Body**
```json
{
  "message": "Testo messaggio modificato"
}
```

**Response 200 OK**
```json
{
  "success": true,
  "message": "Messaggio modificato con successo",
  "data": {
    "id": "msg_123",
    "message": "Testo modificato",
    "isEdited": true,
    "editedAt": "2025-08-31T15:40:00Z"
  }
}
```

---

### 5. Elimina Messaggio
**DELETE** `/api/chat/messages/:messageId`

Elimina un messaggio (soft delete, solo proprio messaggio).

**Headers**
```javascript
{
  "Authorization": "Bearer [token]"
}
```

**Response 200 OK**
```json
{
  "success": true,
  "message": "Messaggio eliminato con successo"
}
```

---

### 6. Segna Messaggi Come Letti
**POST** `/api/chat/:requestId/mark-read`

Segna tutti i messaggi della chat come letti dall'utente corrente.

**Headers**
```javascript
{
  "Authorization": "Bearer [token]"
}
```

**Response 200 OK**
```json
{
  "success": true,
  "message": "Messaggi segnati come letti",
  "data": {
    "messagesUpdated": 5
  }
}
```

---

### 7. Conta Messaggi Non Letti
**GET** `/api/chat/:requestId/unread-count`

Restituisce il numero di messaggi non letti nella chat.

**Headers**
```javascript
{
  "Authorization": "Bearer [token]"
}
```

**Response 200 OK**
```json
{
  "success": true,
  "data": {
    "unreadCount": 3,
    "requestId": "req_456"
  }
}
```

---

## WebSocket Events (Da Implementare)

### Eventi Client → Server

#### `chat:join-request`
Unisciti alla room della chat
```javascript
socket.emit('chat:join-request', requestId);
```

#### `chat:send-message`
Invia messaggio via WebSocket
```javascript
socket.emit('chat:send-message', {
  requestId: 'req_456',
  message: 'Testo del messaggio',
  messageType: 'TEXT'
});
```

#### `chat:typing`
Notifica che l'utente sta scrivendo
```javascript
socket.emit('chat:typing', {
  requestId: 'req_456',
  isTyping: true
});
```

#### `chat:leave-request`
Lascia la room della chat
```javascript
socket.emit('chat:leave-request', requestId);
```

### Eventi Server → Client

#### `chat:new-message`
Nuovo messaggio ricevuto
```javascript
socket.on('chat:new-message', (message) => {
  console.log('Nuovo messaggio:', message);
});
```

#### `chat:user-typing`
Un utente sta scrivendo
```javascript
socket.on('chat:user-typing', ({ userId, isTyping }) => {
  console.log(`${userId} sta scrivendo:`, isTyping);
});
```

#### `chat:message-edited`
Messaggio modificato
```javascript
socket.on('chat:message-edited', (editedMessage) => {
  console.log('Messaggio modificato:', editedMessage);
});
```

#### `chat:message-deleted`
Messaggio eliminato
```javascript
socket.on('chat:message-deleted', ({ messageId }) => {
  console.log('Messaggio eliminato:', messageId);
});
```

---

## Codici di Errore

| Codice | Significato | Descrizione |
|--------|-------------|-------------|
| 200 | OK | Richiesta completata con successo |
| 400 | Bad Request | Dati inviati non validi o mancanti |
| 401 | Unauthorized | Token mancante o non valido |
| 403 | Forbidden | Accesso negato alla risorsa |
| 404 | Not Found | Risorsa non trovata |
| 413 | Payload Too Large | File o dati troppo grandi |
| 429 | Too Many Requests | Troppe richieste, riprovare più tardi |
| 500 | Internal Server Error | Errore interno del server |

---

## Limiti e Restrizioni

### Limiti Messaggi
- **Lunghezza massima messaggio**: 5000 caratteri
- **Messaggi per minuto**: 30 per utente
- **Recupero storico**: Massimo 100 messaggi per richiesta

### Limiti File (Da Implementare)
- **Dimensione massima file**: 10 MB
- **Formati supportati**: JPG, PNG, GIF, PDF, DOC, DOCX
- **File per messaggio**: Massimo 5
- **Storage totale per richiesta**: 50 MB

### Rate Limiting
- **Richieste per minuto**: 60
- **Richieste per ora**: 1000
- **Burst limit**: 10 richieste in 1 secondo

---

## Esempi di Integrazione

### JavaScript/TypeScript
```typescript
// Recupera messaggi
const getMessages = async (requestId: string) => {
  const response = await fetch(`/api/chat/${requestId}/messages`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};

// Invia messaggio
const sendMessage = async (requestId: string, message: string) => {
  const formData = new FormData();
  formData.append('message', message);
  formData.append('messageType', 'TEXT');
  
  const response = await fetch(`/api/chat/${requestId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return response.json();
};
```

### React con TanStack Query
```typescript
// Hook per messaggi
const useMessages = (requestId: string) => {
  return useQuery({
    queryKey: ['chat-messages', requestId],
    queryFn: () => getMessages(requestId),
    refetchInterval: false
  });
};

// Hook per inviare messaggio
const useSendMessage = (requestId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (message: string) => sendMessage(requestId, message),
    onSuccess: (newMessage) => {
      queryClient.setQueryData(
        ['chat-messages', requestId],
        (old: any[]) => [...old, newMessage]
      );
    }
  });
};
```

---

*API Version: 1.0.0 | Last Updated: 31 Agosto 2025*
