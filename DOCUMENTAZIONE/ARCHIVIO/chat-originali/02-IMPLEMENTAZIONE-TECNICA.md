# Guida Implementazione Tecnica - Sistema Chat

## Struttura File Sistema Chat

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

## Backend Implementation

### 1. Database Schema (Prisma)

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

### 2. Chat Service (chat.service.ts)

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

### 3. API Routes (chat.routes.ts)

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

## Frontend Implementation

### 1. Componente Principale (RequestChat.tsx)

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

### 2. Componente Messaggio (MessageItem.tsx)

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

## Comandi Database

```bash
# Applicare modifiche schema
cd backend
npx prisma db push --accept-data-loss

# Generare client Prisma
npx prisma generate

# Verificare schema
npx prisma studio
```

## Testing

### Test Manuali
1. Login come CLIENT → Aprire richiesta → Verificare accesso chat
2. Login come PROFESSIONAL → Verificare accesso solo se assegnato
3. Login come ADMIN → Verificare accesso a tutte le chat
4. Cambiare stato richiesta a COMPLETED → Verificare chat chiusa
5. Inviare messaggio → Verificare visualizzazione immediata
6. Verificare badge ruoli colorati corretti

### Casi d'Uso
- ✅ Cliente può chattare con professionista assegnato
- ✅ Professionista può rispondere al cliente
- ✅ Admin può intervenire in qualsiasi chat
- ✅ Chat si chiude automaticamente quando richiesta completata
- ✅ Notifiche create per nuovi messaggi
- ✅ Controllo accessi per ruolo funzionante
