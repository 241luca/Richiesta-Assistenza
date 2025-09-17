# 📬 SISTEMA CHAT - DOCUMENTAZIONE COMPLETA

**Versione**: 1.0.0  
**Ultimo Aggiornamento**: 11 Settembre 2025  
**Stato**: ✅ Core Implementato | 🚧 Features Avanzate in Sviluppo

---

## 📑 INDICE

1. [Panoramica Generale](#1-panoramica-generale)
2. [Implementazione Tecnica](#2-implementazione-tecnica)
3. [Guida Utente](#3-guida-utente)
4. [API Reference](#4-api-reference)
5. [Troubleshooting](#5-troubleshooting)
6. [Roadmap Sviluppo](#6-roadmap-sviluppo)

---

## 1. PANORAMICA GENERALE

### Descrizione
Il Sistema di Chat integrato permette la comunicazione in tempo reale tra tutti i partecipanti di una richiesta di assistenza (clienti, professionisti e staff amministrativo).

### Caratteristiche Principali

#### ✅ Funzionalità Implementate
- **Messaggistica real-time**: Invio e ricezione messaggi istantanei
- **Multi-ruolo**: Supporto per CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN
- **Controllo accessi**: Verifica automatica dei permessi per ruolo
- **Chiusura automatica**: Chat si disabilita quando richiesta completata/cancellata
- **Notifiche integrate**: Sistema notifiche per nuovi messaggi
- **Interfaccia responsive**: UI ottimizzata per desktop e mobile
- **Indicatori visivi**: Badge colorati per identificare ruoli utenti
- **Timestamp**: Orario visualizzato per ogni messaggio

#### 🚧 Funzionalità da Completare
- **Upload allegati**: Invio foto e documenti nella chat
- **Stampa chat**: Export conversazione in PDF
- **Indicatore digitazione**: "Sta scrivendo..." in tempo reale
- **Modifica/elimina messaggi**: Gestione post-invio
- **Ricerca messaggi**: Funzione ricerca nel thread
- **Emoji reactions**: Reazioni rapide ai messaggi

### Architettura Tecnica

#### Stack Tecnologico
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL con Prisma ORM
- **Frontend**: React + TypeScript + TanStack Query
- **WebSocket**: Socket.io (predisposto, da completare)
- **UI Components**: Tailwind CSS + Heroicons

#### Struttura Database
```sql
RequestChatMessage {
  id: String (UUID)
  requestId: String
  userId: String
  message: String
  messageType: TEXT | IMAGE | DOCUMENT | SYSTEM
  attachments: JSON
  isEdited: Boolean
  isDeleted: Boolean
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Flusso Operativo

1. **Apertura Chat**: Cliente/Professionista/Admin clicca sul pulsante Chat
2. **Verifica Accessi**: Sistema verifica permessi utente
3. **Caricamento Storico**: Recupero messaggi precedenti dal database
4. **Invio Messaggio**: Utente scrive e invia messaggio
5. **Salvataggio**: Messaggio salvato nel database
6. **Notifiche**: Invio notifiche agli altri partecipanti
7. **Visualizzazione**: Aggiornamento UI in tempo reale

### Ruoli e Permessi

| Ruolo | Accesso Chat | Quando |
|-------|--------------|--------|
| **CLIENT** | ✅ Sì | Sempre per le proprie richieste |
| **PROFESSIONAL** | ✅ Sì | Solo quando assegnato alla richiesta |
| **ADMIN/SUPER_ADMIN** | ✅ Sì | Sempre, per tutte le richieste |

### Stati Richiesta e Chat

| Stato Richiesta | Chat Attiva | Motivo |
|-----------------|-------------|--------|
| PENDING | ✅ Sì | In attesa assegnazione |
| ASSIGNED | ✅ Sì | Professionista assegnato |
| IN_PROGRESS | ✅ Sì | Lavoro in corso |
| COMPLETED | ❌ No | Lavoro completato |
| CANCELLED | ❌ No | Richiesta cancellata |

---

## 2. IMPLEMENTAZIONE TECNICA

### Struttura File Sistema Chat

```
richiesta-assistenza/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── chat.routes.ts         # API endpoints chat
│   │   └── services/
│   │       └── chat.service.ts        # Business logic chat
│   └── prisma/
│       └── schema.prisma               # Modello RequestChatMessage
│
└── src/
    └── components/
        └── chat/
            ├── RequestChat.tsx         # Componente principale
            ├── MessageItem.tsx         # Singolo messaggio
            ├── ChatHeader.tsx          # Header chat
            ├── TypingIndicator.tsx     # Indicatore digitazione
            └── FileUploadModal.tsx     # Modal upload file
```

### Backend Implementation

#### Database Schema (Prisma)

```prisma
model RequestChatMessage {
  id                String            @id @default(cuid())
  requestId         String
  userId            String
  message           String
  messageType       MessageType       @default(TEXT)
  attachments       Json?             // Array di {fileName, filePath, fileType, fileSize}
  isEdited          Boolean           @default(false)
  editedAt          DateTime?
  isDeleted         Boolean           @default(false)
  deletedAt         DateTime?
  isRead            Boolean           @default(false)
  readBy            Json?             // Array di {userId, readAt}
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  AssistanceRequest AssistanceRequest @relation(fields: [requestId], references: [id], onDelete: Cascade)
  User              User              @relation(fields: [userId], references: [id])
  
  @@index([requestId])
  @@index([userId])
  @@index([createdAt])
  @@index([isDeleted])
}

enum MessageType {
  TEXT
  IMAGE
  DOCUMENT
  SYSTEM
}
```

#### Chat Service (chat.service.ts)

```typescript
import { v4 as uuidv4 } from 'uuid';

class ChatService {
  // Verifica accesso chat
  async canAccessChat(userId: string, requestId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    // Admin/Super Admin hanno sempre accesso
    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
      return true;
    }

    // Verifica se è cliente o professionista della richiesta
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId },
      select: { clientId: true, professionalId: true }
    });

    return request.clientId === userId || request.professionalId === userId;
  }

  // Verifica se chat è attiva
  async isChatActive(requestId: string): Promise<boolean> {
    const request = await prisma.assistanceRequest.findUnique({
      where: { id: requestId },
      select: { status: true }
    });
    
    return request.status !== 'COMPLETED' && request.status !== 'CANCELLED';
  }

  // Invia messaggio
  async sendMessage(data: ChatMessageInput) {
    // Verifica permessi
    if (!await this.canAccessChat(data.userId, data.requestId)) {
      throw new Error('Non hai accesso a questa chat');
    }

    // Verifica chat attiva
    if (!await this.isChatActive(data.requestId)) {
      throw new Error('La chat è chiusa per questa richiesta');
    }

    // Crea messaggio
    const message = await prisma.requestChatMessage.create({
      data: {
        requestId: data.requestId,
        userId: data.userId,
        message: data.message,
        messageType: data.messageType || 'TEXT',
        attachments: data.attachments || null
      },
      include: {
        User: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            avatar: true,
            role: true
          }
        }
      }
    });

    // Crea notifiche
    await this.createChatNotifications(data.requestId, data.userId, data.message);

    return message;
  }

  // Crea notifiche
  private async createChatNotifications(requestId: string, senderId: string, messageText: string) {
    // ... logica notifiche con ID generato tramite uuidv4()
    await prisma.notification.create({
      data: {
        id: uuidv4(),
        type: 'CHAT_MESSAGE',
        title: 'Nuovo messaggio nella richiesta',
        content: messageText,
        recipientId,
        senderId,
        entityType: 'REQUEST',
        entityId: requestId,
        priority: 'NORMAL'
      }
    });
  }
}
```

#### API Routes (chat.routes.ts)

```typescript
import { ResponseFormatter } from '../utils/responseFormatter';

// GET /api/chat/:requestId/messages
router.get('/:requestId/messages', authenticate, async (req, res) => {
  try {
    const messages = await chatService.getMessages(
      req.params.requestId,
      req.user.id
    );
    res.json(ResponseFormatter.success(messages, 'Messaggi recuperati'));
  } catch (error) {
    res.status(500).json(ResponseFormatter.error('Errore recupero messaggi'));
  }
});

// POST /api/chat/:requestId/messages
router.post('/:requestId/messages', authenticate, upload.array('attachments'), async (req, res) => {
  try {
    const message = await chatService.sendMessage({
      requestId: req.params.requestId,
      userId: req.user.id,
      message: req.body.message,
      messageType: req.body.messageType,
      attachments: req.files
    });
    res.json(ResponseFormatter.success(message, 'Messaggio inviato'));
  } catch (error) {
    res.status(500).json(ResponseFormatter.error('Errore invio messaggio'));
  }
});

// GET /api/chat/:requestId/access
router.get('/:requestId/access', authenticate, async (req, res) => {
  const canAccess = await chatService.canAccessChat(req.user.id, req.params.requestId);
  const isActive = await chatService.isChatActive(req.params.requestId);
  
  res.json(ResponseFormatter.success({
    canAccess,
    isActive,
    userId: req.user.id
  }));
});
```

### Frontend Implementation

#### Componente Principale (RequestChat.tsx)

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../services/api';

const RequestChat: React.FC<RequestChatProps> = ({ requestId, requestTitle, requestStatus }) => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  
  // Query messaggi
  const { data: messages = [] } = useQuery({
    queryKey: ['chat-messages', requestId],
    queryFn: async () => {
      const response = await apiClient.get(`/chat/${requestId}/messages`);
      return response.data.data;
    }
  });

  // Mutation invio messaggio
  const sendMessageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiClient.post(`/chat/${requestId}/messages`, data);
      return response.data.data;
    },
    onSuccess: (newMessage) => {
      setMessage('');
      queryClient.setQueryData(['chat-messages', requestId], old => [...old, newMessage]);
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    const formData = new FormData();
    formData.append('message', message);
    formData.append('messageType', 'TEXT');
    
    sendMessageMutation.mutate(formData);
  };

  // Rendering UI...
};
```

#### Componente Messaggio (MessageItem.tsx)

```typescript
const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  // Badge colorati per ruolo
  const getRoleBadgeStyle = (role: string) => {
    switch(role) {
      case 'SUPER_ADMIN': return 'bg-purple-100 text-purple-700';
      case 'ADMIN': return 'bg-red-100 text-red-700';
      case 'PROFESSIONAL': return 'bg-blue-100 text-blue-700';
      case 'CLIENT': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="max-w-xs lg:max-w-md">
        {/* Nome e badge ruolo */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold">{message.User.fullName}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleBadgeStyle(message.User.role)}`}>
            {getRoleBadge(message.User.role)}
          </span>
        </div>
        
        {/* Messaggio */}
        <div className={`px-4 py-2 rounded-lg ${isOwn ? 'bg-blue-600 text-white' : 'bg-white border'}`}>
          <p>{message.message}</p>
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-1">
          {format(new Date(message.createdAt), 'HH:mm')}
        </div>
      </div>
    </div>
  );
};
```

### Comandi Database

```bash
# Applicare modifiche schema
cd backend
npx prisma db push --accept-data-loss

# Generare client Prisma
npx prisma generate

# Verificare schema
npx prisma studio
```

### Testing

#### Test Manuali
1. Login come CLIENT → Aprire richiesta → Verificare accesso chat
2. Login come PROFESSIONAL → Verificare accesso solo se assegnato
3. Login come ADMIN → Verificare accesso a tutte le chat
4. Cambiare stato richiesta a COMPLETED → Verificare chat chiusa
5. Inviare messaggio → Verificare visualizzazione immediata
6. Verificare badge ruoli colorati corretti

#### Casi d'Uso
- ✅ Cliente può chattare con professionista assegnato
- ✅ Professionista può rispondere al cliente
- ✅ Admin può intervenire in qualsiasi chat
- ✅ Chat si chiude automaticamente quando richiesta completata
- ✅ Notifiche create per nuovi messaggi
- ✅ Controllo accessi per ruolo funzionante

---

## 3. GUIDA UTENTE

### Come Accedere alla Chat

#### Per Clienti
1. Accedi al sistema con le tue credenziali
2. Vai su "Le Mie Richieste" dal menu
3. Clicca sulla richiesta desiderata
4. Clicca sul pulsante **"Chat"** (icona verde a destra)
5. La chat si aprirà in una finestra modale

#### Per Professionisti
1. Accedi al sistema con le tue credenziali
2. Vai su "Richieste Assegnate"
3. Clicca sulla richiesta su cui stai lavorando
4. Clicca sul pulsante **"Chat"** 
5. Potrai comunicare con il cliente

#### Per Admin/Staff
1. Accedi al pannello amministrativo
2. Vai su "Gestione Richieste"
3. Seleziona qualsiasi richiesta
4. Clicca sul pulsante **"Chat"**
5. Potrai intervenire nella conversazione

### Come Usare la Chat

#### Inviare un Messaggio
1. **Scrivi** il tuo messaggio nel campo in basso
2. **Premi Invio** o clicca sull'icona dell'aeroplano ✈️
3. Il messaggio apparirà immediatamente nella conversazione

#### Identificare i Partecipanti
Ogni messaggio mostra:
- **Nome completo** dell'utente
- **Badge colorato** che indica il ruolo:
  - 🟣 **Viola** = Super Admin
  - 🔴 **Rosso** = Admin/Staff
  - 🔵 **Blu** = Professionista
  - 🟢 **Verde** = Cliente
- **Orario** di invio (formato HH:mm)

#### Layout dei Messaggi
- **I tuoi messaggi**: Appaiono a destra con sfondo blu
- **Messaggi degli altri**: Appaiono a sinistra con sfondo bianco
- **Messaggi di sistema**: Centrati con sfondo grigio

### Stati della Chat

#### Chat Attiva ✅
La chat è attiva quando la richiesta è in uno di questi stati:
- **PENDING** - In attesa di assegnazione
- **ASSIGNED** - Professionista assegnato
- **IN_PROGRESS** - Lavoro in corso

Puoi:
- Inviare messaggi
- Ricevere risposte
- Allegare file (prossimamente)

#### Chat Chiusa 🔒
La chat si chiude automaticamente quando:
- La richiesta è **COMPLETATA** ✅
- La richiesta è **CANCELLATA** ❌

Quando la chat è chiusa:
- Puoi ancora **leggere** i messaggi precedenti
- **Non puoi** inviare nuovi messaggi
- Appare il messaggio: *"La chat è chiusa perché la richiesta è stata completata/cancellata"*

### Funzionalità Disponibili

#### ✅ Già Implementate
- Invio e ricezione messaggi di testo
- Visualizzazione nome utente e ruolo
- Timestamp per ogni messaggio
- Controllo accessi per ruolo
- Chiusura automatica chat
- Notifiche per nuovi messaggi

#### 🚧 Prossimamente
- **Upload Allegati**: Invia foto e documenti
- **Stampa Chat**: Esporta la conversazione in PDF
- **Indicatore Digitazione**: Vedi quando qualcuno sta scrivendo
- **Modifica Messaggi**: Correggi messaggi già inviati
- **Elimina Messaggi**: Rimuovi messaggi inviati per errore
- **Ricerca**: Cerca nel thread della conversazione
- **Emoji**: Aggiungi reazioni ai messaggi

### Notifiche

Quando ricevi un nuovo messaggio:
1. **Notifica nel sistema**: Badge rosso sull'icona notifiche
2. **Email** (se abilitata): Ricevi un'email con anteprima del messaggio
3. **Real-time**: Se hai la chat aperta, il messaggio appare istantaneamente

### Domande Frequenti

#### Non riesco ad accedere alla chat
**Verifica che**:
- Sei il cliente della richiesta, oppure
- Sei il professionista assegnato, oppure
- Sei un admin/staff

#### La chat non si apre
**Possibili cause**:
- La richiesta è stata completata o cancellata
- Non hai i permessi per accedere
- Problema temporaneo di connessione

#### Non vedo i nuovi messaggi
**Prova a**:
- Ricaricare la pagina (F5)
- Verificare la connessione internet
- Chiudere e riaprire la chat

#### Come faccio a stampare la chat?
Questa funzionalità sarà disponibile prossimamente. Per ora puoi:
- Fare screenshot della conversazione
- Copiare e incollare i messaggi in un documento

### Best Practices

#### Per una Comunicazione Efficace
1. **Sii chiaro e conciso** nei messaggi
2. **Usa un linguaggio professionale** e cortese
3. **Rispondi tempestivamente** alle domande
4. **Fornisci dettagli utili** per risolvere il problema
5. **Conferma sempre** accordi e appuntamenti via chat

#### Privacy e Sicurezza
- **Non condividere** dati sensibili (password, carte di credito)
- **Usa la chat** solo per comunicazioni relative alla richiesta
- **Tutti i messaggi** sono registrati e conservati nel sistema
- **Gli admin** possono accedere alle chat per supporto

### Supporto

Se hai problemi con la chat:
1. Controlla questa guida
2. Prova a ricaricare la pagina
3. Contatta il supporto tecnico
4. Segnala il problema agli amministratori

---

## 4. API REFERENCE

### Endpoints Disponibili

#### 1. Recupera Messaggi Chat
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

#### 2. Invia Messaggio
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

#### 3. Verifica Accesso Chat
**GET** `/api/chat/:requestId/access`

Verifica se l'utente può accedere alla chat e se è attiva.

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

#### 4. Modifica Messaggio (🚧 Da Implementare)
**PUT** `/api/chat/messages/:messageId`

#### 5. Elimina Messaggio (🚧 Da Implementare)
**DELETE** `/api/chat/messages/:messageId`

#### 6. Segna Messaggi Come Letti (🚧 Da Implementare)
**POST** `/api/chat/:requestId/mark-read`

#### 7. Conta Messaggi Non Letti (🚧 Da Implementare)
**GET** `/api/chat/:requestId/unread-count`

### WebSocket Events (🚧 Da Implementare)

#### Eventi Client → Server
- `chat:join-request`: Unisciti alla room della chat
- `chat:send-message`: Invia messaggio via WebSocket
- `chat:typing`: Notifica che l'utente sta scrivendo
- `chat:leave-request`: Lascia la room della chat

#### Eventi Server → Client
- `chat:new-message`: Nuovo messaggio ricevuto
- `chat:user-typing`: Un utente sta scrivendo
- `chat:message-edited`: Messaggio modificato
- `chat:message-deleted`: Messaggio eliminato

### Codici di Errore

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

### Limiti e Restrizioni

#### Limiti Messaggi
- **Lunghezza massima messaggio**: 5000 caratteri
- **Messaggi per minuto**: 30 per utente
- **Recupero storico**: Massimo 100 messaggi per richiesta

#### Limiti File (🚧 Da Implementare)
- **Dimensione massima file**: 10 MB
- **Formati supportati**: JPG, PNG, GIF, PDF, DOC, DOCX
- **File per messaggio**: Massimo 5
- **Storage totale per richiesta**: 50 MB

#### Rate Limiting
- **Richieste per minuto**: 60
- **Richieste per ora**: 1000
- **Burst limit**: 10 richieste in 1 secondo

### Esempi di Integrazione

#### JavaScript/TypeScript
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

#### React con TanStack Query
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

## 5. TROUBLESHOOTING

### Problemi Comuni e Soluzioni

#### 1. Errore: "The table RequestChatMessage does not exist"

**Problema**: Il database non ha la tabella per i messaggi chat.

**Soluzione**:
```bash
cd backend

# 1. Verifica che il modello sia in schema.prisma
cat prisma/schema.prisma | grep RequestChatMessage

# 2. Applica le modifiche al database
npx prisma db push --accept-data-loss

# 3. Genera il client Prisma
npx prisma generate

# 4. Riavvia il backend
npm run dev
```

#### 2. Errore: "Argument 'id' is missing" per Notification

**Problema**: Il modello Notification richiede un ID che non viene generato automaticamente.

**Soluzione**:
Nel file `backend/src/services/chat.service.ts`, aggiungere:
```typescript
import { v4 as uuidv4 } from 'uuid';

// Quando crei una notifica:
await prisma.notification.create({
  data: {
    id: uuidv4(), // Genera ID univoco
    // ... altri campi
  }
});
```

#### 3. Errore: "Cannot find module '../middleware/auth.middleware'"

**Problema**: Import path errato nel file delle routes.

**Soluzione**:
Correggere l'import in `chat.routes.ts`:
```typescript
// ERRATO
import { authenticate } from '../middleware/auth.middleware';

// CORRETTO
import { authenticate } from '../middleware/auth';
```

#### 4. Errore: "Identifier 'handleSendMessage' has already been declared"

**Problema**: Funzione duplicata nel componente React.

**Soluzione**:
1. Cercare tutte le occorrenze della funzione
2. Rimuovere la duplicata
3. Mantenere solo una definizione

#### 5. Chat non si apre

**Problema**: Il pulsante chat non risponde o la modal non appare.

**Possibili Cause e Soluzioni**:

1. **Import mancante di apiClient**
   ```typescript
   // Verificare l'import
   import { apiClient } from '../../services/api';
   ```

2. **URL backend non configurato**
   ```bash
   # Verificare nel file .env
   VITE_API_URL=http://localhost:3200
   ```

3. **Errore CORS**
   - Verificare che il backend permetta richieste da localhost:5173

#### 6. Messaggi non vengono salvati

**Problema**: I messaggi sembrano inviati ma non appaiono.

**Debug Steps**:
1. Aprire Console Browser (F12)
2. Verificare errori rossi nella console
3. Controllare Network tab per vedere se la richiesta POST ha successo
4. Verificare logs backend nel terminale

**Possibili Soluzioni**:
- Verificare che l'utente sia autenticato
- Controllare che la richiesta non sia COMPLETED o CANCELLED
- Verificare permessi nel database

#### 7. Nome utente non viene visualizzato

**Problema**: I messaggi mostrano "undefined" invece del nome.

**Soluzione**:
Verificare che il campo `fullName` sia popolato nel database:
```sql
-- Controlla se fullName è NULL
SELECT id, firstName, lastName, fullName FROM "User";

-- Aggiorna fullName se mancante
UPDATE "User" 
SET "fullName" = CONCAT("firstName", ' ', "lastName")
WHERE "fullName" IS NULL;
```

#### 8. Badge ruoli non colorati

**Problema**: I badge dei ruoli appaiono tutti grigi.

**Soluzione**:
Verificare in `MessageItem.tsx`:
```typescript
const getRoleBadgeStyle = (role: string) => {
  switch(role) {
    case 'SUPER_ADMIN':
      return 'bg-purple-100 text-purple-700 border border-purple-300';
    case 'ADMIN':
      return 'bg-red-100 text-red-700 border border-red-300';
    // ... altri ruoli
  }
};
```

#### 9. WebSocket non si connette

**Problema**: Real-time updates non funzionano.

**Note**: WebSocket è predisposto ma non ancora completamente implementato.

**Per debug**:
```javascript
// In RequestChat.tsx, verificare la connessione
socket.on('connect', () => {
  console.log('WebSocket connesso');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

#### 10. Chat rimane aperta per richieste completate

**Problema**: La chat dovrebbe chiudersi ma rimane attiva.

**Verifica**:
```sql
-- Controlla lo stato della richiesta
SELECT id, status FROM "AssistanceRequest" WHERE id = 'REQUEST_ID';
```

**Soluzione**:
Verificare in `chat.service.ts`:
```typescript
async isChatActive(requestId: string): Promise<boolean> {
  const request = await prisma.assistanceRequest.findUnique({
    where: { id: requestId },
    select: { status: true }
  });
  
  return request.status !== 'COMPLETED' && request.status !== 'CANCELLED';
}
```

### Comandi Utili per Debug

#### Database
```bash
# Visualizza schema database
npx prisma studio

# Reset database (ATTENZIONE: cancella tutti i dati!)
npx prisma migrate reset

# Verifica connessione database
npx prisma db pull
```

#### Backend
```bash
# Logs dettagliati
DEBUG=* npm run dev

# Test endpoint manualmente
curl -X GET http://localhost:3200/api/chat/REQUEST_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Frontend
```javascript
// Console browser per debug
localStorage.getItem('token'); // Verifica token
console.log(import.meta.env.VITE_API_URL); // Verifica URL backend
```

### Logs Importanti da Controllare

#### Backend Logs
Cercare nel terminale del backend:
- `✅ Database connected successfully`
- `Server running on port 3200`
- Errori Prisma che iniziano con `Invalid invocation`
- Errori di autenticazione `401 Unauthorized`

#### Frontend Console
Cercare nella console del browser:
- Errori di rete `Failed to fetch`
- Errori CORS
- Errori React Query
- WebSocket connection errors

### Contatti Supporto

Se il problema persiste dopo aver seguito questa guida:

1. **Raccogliere informazioni**:
   - Screenshot dell'errore
   - Logs del backend
   - Console del browser
   - Stato della richiesta nel database

2. **Preparare descrizione**:
   - Cosa stavi facendo quando è apparso l'errore
   - Quali utenti sono coinvolti (ruoli)
   - Se il problema è riproducibile

3. **Inviare report** con tutte le informazioni raccolte

### Checklist Pre-Produzione

Prima di andare in produzione, verificare:

- [ ] Database migrato con tutte le tabelle
- [ ] Variabili ambiente configurate
- [ ] CORS configurato per dominio produzione  
- [ ] SSL/HTTPS attivo
- [ ] Backup database configurato
- [ ] Monitoring errori attivo
- [ ] Rate limiting configurato
- [ ] WebSocket proxy configurato (se necessario)

---

## 6. ROADMAP SVILUPPO

### Fase 1: Core Features ✅ COMPLETATO
**Stato**: Implementato al 100%
**Data Completamento**: 31 Agosto 2025

#### Funzionalità Implementate
- ✅ Struttura database (modello RequestChatMessage)
- ✅ API Backend (routes e services)
- ✅ Controllo accessi per ruolo
- ✅ UI Frontend con React
- ✅ Invio/ricezione messaggi testo
- ✅ Visualizzazione nome, ruolo e timestamp
- ✅ Badge colorati per identificazione ruoli
- ✅ Chiusura automatica per richieste completate
- ✅ Sistema notifiche base
- ✅ Gestione errori e validazione

### Fase 2: File Management 🚧 DA SVILUPPARE
**Stato**: 0% Completato
**Stima**: 2-3 giorni

#### Upload Allegati
- [ ] Configurazione Multer per upload multipli
- [ ] Validazione tipi file (immagini, PDF, documenti)
- [ ] Compressione automatica immagini
- [ ] Storage locale con path sicuri
- [ ] Metadata allegati in database
- [ ] Preview immagini in chat
- [ ] Download allegati con permessi

#### Gestione Storage
- [ ] Limite dimensione file (10MB)
- [ ] Limite storage per richiesta (50MB)
- [ ] Pulizia automatica file obsoleti
- [ ] Backup allegati

### Fase 3: Real-time Features 🚧 DA SVILUPPARE
**Stato**: 20% Completato (predisposizione base)
**Stima**: 2-3 giorni

#### WebSocket Implementation
- [ ] Configurazione Socket.io server
- [ ] Autenticazione WebSocket
- [ ] Room management per richieste
- [ ] Eventi real-time funzionanti

#### Indicatori Live
- [ ] "Sta scrivendo..." indicator
- [ ] Presenza utenti online
- [ ] Delivery status messaggi (inviato/letto)
- [ ] Sincronizzazione multi-tab

### Fase 4: Advanced Messaging 🚧 DA SVILUPPARE
**Stato**: 0% Completato
**Stima**: 2 giorni

#### Gestione Messaggi
- [ ] Modifica messaggi propri
- [ ] Eliminazione messaggi (soft delete)
- [ ] Reply to message (citazione)
- [ ] Forward message
- [ ] Messaggi vocali

#### Formattazione
- [ ] Rich text editor
- [ ] Markdown support
- [ ] Code blocks
- [ ] Link preview

### Fase 5: Export & Reporting 🚧 DA SVILUPPARE
**Stato**: 0% Completato
**Stima**: 2 giorni

#### Export Chat
- [ ] Generazione PDF conversazione
- [ ] Inclusione metadata (data, partecipanti)
- [ ] Inclusione allegati nel PDF
- [ ] Template professionale
- [ ] Allegato automatico a richiesta

#### Analytics
- [ ] Contatore messaggi per richiesta
- [ ] Tempo medio risposta
- [ ] Report attività chat
- [ ] Statistiche utilizzo

### Fase 6: UX Improvements 🚧 DA SVILUPPARE
**Stato**: 0% Completato
**Stima**: 2 giorni

#### Search & Filter
- [ ] Ricerca full-text nei messaggi
- [ ] Filtri per data
- [ ] Filtri per mittente
- [ ] Jump to date

#### UI Enhancements
- [ ] Emoji picker
- [ ] Reactions ai messaggi
- [ ] Dark mode support
- [ ] Responsive mobile design
- [ ] Keyboard shortcuts
- [ ] Auto-scroll management
- [ ] Lazy loading messaggi vecchi

### Fase 7: Notifications Enhancement 🚧 DA SVILUPPARE
**Stato**: 30% Completato (base implementata)
**Stima**: 1-2 giorni

#### Multi-channel
- [ ] Email notifications con template HTML
- [ ] SMS notifications (Twilio/Brevo)
- [ ] Push notifications browser
- [ ] In-app toast notifications

#### Preferences
- [ ] User notification settings
- [ ] Mute conversation
- [ ] Schedule quiet hours
- [ ] Digest mode

### Fase 8: Security & Performance 🚧 DA SVILUPPARE
**Stato**: 0% Completato
**Stima**: 2 giorni

#### Security
- [ ] Rate limiting per user
- [ ] Spam detection
- [ ] Content moderation
- [ ] Encryption at rest
- [ ] Audit logging

#### Performance
- [ ] Message pagination
- [ ] Caching strategy
- [ ] Database indexes optimization
- [ ] CDN per allegati
- [ ] Compression

### Fase 9: Integration Features 🚧 OPZIONALE
**Stato**: 0% Completato
**Stima**: 3-5 giorni

#### Integrazioni Esterne
- [ ] WhatsApp Business API
- [ ] Telegram Bot
- [ ] Email-to-chat gateway
- [ ] Webhook per eventi
- [ ] API pubblica chat

#### AI Features
- [ ] Auto-risposte intelligenti
- [ ] Sentiment analysis
- [ ] Traduzione automatica
- [ ] Summarization conversazioni
- [ ] Suggested replies

### Fase 10: Admin Tools 🚧 DA SVILUPPARE
**Stato**: 0% Completato
**Stima**: 2 giorni

#### Moderazione
- [ ] Dashboard moderazione chat
- [ ] Ban/mute users
- [ ] Delete inappropriate content
- [ ] Report system

#### Monitoring
- [ ] Real-time chat monitoring
- [ ] Alert system
- [ ] Quality assurance
- [ ] Performance metrics

### Timeline Stimato

```
Settembre 2025:
├── Settimana 1: File Management (Fase 2)
├── Settimana 2: Real-time Features (Fase 3)
├── Settimana 3: Advanced Messaging (Fase 4) + Export (Fase 5)
└── Settimana 4: UX Improvements (Fase 6) + Testing

Ottobre 2025:
├── Settimana 1: Notifications (Fase 7) + Security (Fase 8)
├── Settimana 2: Admin Tools (Fase 10)
├── Settimana 3: Bug fixing + Ottimizzazioni
└── Settimana 4: Deploy produzione

Novembre 2025 (Opzionale):
└── Integration Features (Fase 9)
```

### Priorità Immediate

#### 🔴 Alta Priorità (Prossima Settimana)
1. **Upload Allegati** - Essenziale per completezza chat
2. **Export PDF** - Richiesto per documentazione legale
3. **WebSocket Real-time** - Migliora UX significativamente

#### 🟡 Media Priorità (Prossimo Mese)
1. **Modifica/Elimina messaggi**
2. **Indicatore "sta scrivendo"**
3. **Ricerca messaggi**
4. **Notifiche email migliorate**

#### 🟢 Bassa Priorità (Futuro)
1. **Emoji e reactions**
2. **Integrazioni esterne**
3. **AI features**
4. **Messaggi vocali**

### Risorse Necessarie

#### Sviluppo
- **Frontend Developer**: 40-60 ore
- **Backend Developer**: 40-60 ore
- **UI/UX Designer**: 10-15 ore (per miglioramenti UI)

#### Infrastruttura
- **Storage**: +50GB per allegati
- **CDN**: Per distribuzione file (opzionale)
- **Redis**: Per WebSocket scaling (se multi-server)

#### Servizi Esterni
- **Twilio/Brevo**: Per SMS (opzionale)
- **S3/Cloudinary**: Per storage cloud (opzionale)
- **OpenAI API**: Per AI features (opzionale)

### Note per lo Sviluppo

#### Prossimi Passi Immediati
1. Implementare upload allegati con Multer
2. Aggiungere preview immagini nella chat
3. Completare WebSocket per real-time
4. Implementare export PDF base

#### Considerazioni Tecniche
- Mantenere compatibilità con sistema esistente
- Non modificare struttura database esistente
- Seguire pattern ResponseFormatter per API
- Usare React Query per tutte le chiamate API
- Mantenere UI consistente con design esistente

#### Testing Richiesto
- Test upload file grandi
- Test multiple tab/browser
- Test performance con molti messaggi
- Test su mobile devices
- Load testing WebSocket

---

**Fine Documentazione Sistema Chat**

*Versione: 1.0 | Creata: 31 Agosto 2025 | Ultimo Aggiornamento: 11 Settembre 2025*
