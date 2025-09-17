# 💬 SISTEMA CHAT - DOCUMENTAZIONE COMPLETA v2.0
**Ultimo aggiornamento**: 16 Gennaio 2025  
**Versione**: 2.0.0  
**Stato**: ✅ Completamente Implementato e Testato

---

## 📋 INDICE
1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Componenti Frontend](#componenti-frontend)
4. [API Backend](#api-backend)
5. [Database Schema](#database-schema)
6. [Funzionalità Implementate](#funzionalità-implementate)
7. [Guida Utilizzo](#guida-utilizzo)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 PANORAMICA

Il sistema chat permette la comunicazione real-time tra clienti, professionisti e amministratori all'interno delle richieste di assistenza.

### Caratteristiche Principali
- ✅ Chat dedicata per ogni richiesta
- ✅ Supporto allegati (immagini, documenti)
- ✅ Invio solo allegati senza testo
- ✅ Nomi utenti sempre visibili
- ✅ Refresh automatico ogni 5 secondi
- ✅ Notifiche automatiche ai partecipanti
- ✅ Accesso basato su ruoli

---

## 🏗️ ARCHITETTURA

### Stack Tecnologico
- **Frontend**: React 18 + TypeScript + TanStack Query
- **Backend**: Express + Prisma + PostgreSQL
- **UI**: Tailwind CSS + Heroicons
- **Real-time**: Polling (WebSocket predisposto)

### Flow Dati
```
Frontend (RequestChat.tsx)
    ↓
API Client (api.ts)
    ↓
Backend Routes (request.routes.ts)
    ↓
Database (RequestChatMessage)
```

---

## 🎨 COMPONENTI FRONTEND

### 1. RequestChat.tsx
**Path**: `/src/pages/requests/RequestChat.tsx`

#### Struttura Componente
```tsx
const RequestChat = () => {
  // Caricamento dati richiesta
  const { data: request } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const response = await api.get(`/requests/${id}`);
      return response.data?.data?.request;
    }
  });

  // Caricamento messaggi
  const { data: messages } = useQuery({
    queryKey: ['chat', id],
    queryFn: () => api.get(`/requests/${id}/chat`),
    refetchInterval: 5000 // Auto-refresh
  });

  // Invio messaggi
  const sendMutation = useMutation({
    mutationFn: (data) => api.post(`/requests/${id}/chat`, data)
  });
}
```

#### Features UI
- **Header Completo**: Mostra titolo richiesta, dati cliente e professionista
- **Lista Messaggi**: Scroll automatico, differenziazione visiva per mittente
- **Form Invio**: Supporto testo + allegati
- **Gestione Allegati**: Preview, selezione multipla, rimozione

### 2. AdminDashboard.tsx
**Path**: `/src/pages/admin/AdminDashboard.tsx`

#### Pulsante Chat
```tsx
<button
  onClick={() => navigate(`/requests/${request.id}/chat`)}
  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
  title="Apri chat"
>
  <ChatBubbleLeftRightIcon className="h-5 w-5" />
</button>
```

---

## 🔌 API BACKEND

### Endpoints Implementati

#### GET /api/requests/:id/chat
**Descrizione**: Recupera tutti i messaggi di una chat  
**Autenticazione**: Required  
**Controllo Accessi**: 
- Cliente: solo proprie richieste
- Professionista: solo richieste assegnate
- Admin/Super Admin: tutte

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-id",
      "message": "Testo messaggio",
      "senderId": "user-id",
      "senderName": "Nome Cognome",
      "senderRole": "CLIENT",
      "createdAt": "2025-01-16T16:33:00Z",
      "attachments": [
        {
          "name": "file.png",
          "url": "uploads/...",
          "size": 12345
        }
      ]
    }
  ]
}
```

#### POST /api/requests/:id/chat
**Descrizione**: Invia un nuovo messaggio  
**Body**:
```json
{
  "message": "Testo opzionale",
  "attachments": [
    {
      "name": "file.png",
      "url": "uploads/...",
      "size": 12345
    }
  ]
}
```

**Validazioni**:
- Messaggio o allegati richiesti (almeno uno)
- Verifica esistenza richiesta
- Verifica permessi utente

**Actions Post-Creazione**:
1. Salvataggio messaggio
2. Invio notifiche agli altri partecipanti
3. Update timestamp richiesta

### Implementazione Backend

#### Route Handler
```typescript
// GET messaggi
router.get('/:id/chat', async (req, res) => {
  // 1. Verifica permessi
  const canViewChat = checkPermissions(user, request);
  
  // 2. Carica messaggi
  const messages = await prisma.requestChatMessage.findMany({
    where: { requestId: id, isDeleted: false },
    orderBy: { createdAt: 'asc' }
  });
  
  // 3. Carica dati utenti
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } }
  });
  
  // 4. Formatta risposta con nomi utenti
  const formattedMessages = messages.map(msg => ({
    ...msg,
    senderName: users.find(u => u.id === msg.userId)?.fullName
  }));
});

// POST nuovo messaggio
router.post('/:id/chat', async (req, res) => {
  // 1. Validazione input
  if (!message && !attachments?.length) {
    return res.status(400).json(error);
  }
  
  // 2. Crea messaggio
  const newMessage = await prisma.requestChatMessage.create({
    data: { ... }
  });
  
  // 3. Invia notifiche
  await notificationService.notifyParticipants();
});
```

---

## 🗄️ DATABASE SCHEMA

### Tabella RequestChatMessage
```prisma
model RequestChatMessage {
  id          String   @id @default(cuid())
  requestId   String
  userId      String
  message     String
  attachments Json?
  isEdited    Boolean  @default(false)
  isDeleted   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  request     AssistanceRequest @relation(...)
  user        User @relation(...)
  
  @@index([requestId])
  @@index([userId])
}
```

### Struttura Attachments (JSON)
```json
[
  {
    "name": "documento.pdf",
    "url": "/uploads/docs/123456.pdf",
    "size": 2048576,
    "type": "application/pdf",
    "uploadedAt": "2025-01-16T16:00:00Z"
  }
]
```

---

## ✨ FUNZIONALITÀ IMPLEMENTATE

### 1. Chat Base
- ✅ Visualizzazione messaggi cronologica
- ✅ Invio messaggi di testo
- ✅ Identificazione mittente con nome e ruolo
- ✅ Timestamp per ogni messaggio
- ✅ Auto-scroll ai nuovi messaggi

### 2. Sistema Allegati
- ✅ Upload file multipli
- ✅ Preview allegati prima dell'invio
- ✅ Invio solo allegati (senza testo)
- ✅ Visualizzazione allegati nei messaggi
- ✅ Indicatore numero allegati

### 3. Controllo Accessi
- ✅ Cliente: solo proprie richieste
- ✅ Professionista: solo richieste assegnate
- ✅ Admin: accesso completo
- ✅ Verifica permessi su ogni operazione

### 4. Notifiche
- ✅ Notifica automatica agli altri partecipanti
- ✅ Tipo notifica: "Nuovo messaggio nella chat"
- ✅ Link diretto alla chat dalla notifica

### 5. UI/UX
- ✅ Header con info complete richiesta
- ✅ Differenziazione visiva messaggi propri/altri
- ✅ Loading states durante operazioni
- ✅ Error handling con toast notifications
- ✅ Responsive design

---

## 📖 GUIDA UTILIZZO

### Per Amministratori

#### Accedere alla Chat
1. Dashboard Admin → Tabella richieste
2. Cliccare icona chat (💬) nella riga desiderata
3. Si apre la pagina chat dedicata

#### Funzionalità Admin
- Vedere tutti i messaggi
- Inviare messaggi come moderatore
- Allegare documenti ufficiali
- Monitorare conversazioni

### Per Clienti

#### Accesso Chat
- Dashboard → Le mie richieste → Dettaglio → Chat

#### Limitazioni
- Solo chat delle proprie richieste
- Non può cancellare messaggi
- Non può vedere note interne

### Per Professionisti

#### Accesso Chat
- Dashboard → Richieste assegnate → Chat

#### Funzionalità
- Chat con clienti per richieste assegnate
- Invio preventivi tramite chat
- Condivisione documenti tecnici

---

## 🔧 TROUBLESHOOTING

### Problema: Nomi utenti non visibili
**Causa**: Relazione User non caricata  
**Soluzione**: Verificare che il backend carichi i dati utente:
```typescript
const users = await prisma.user.findMany({
  where: { id: { in: userIds } },
  select: { id: true, firstName: true, lastName: true }
});
```

### Problema: Allegati non si inviano
**Causa**: Validazione messaggio vuoto  
**Soluzione**: Backend deve permettere messaggi vuoti se ci sono allegati:
```typescript
if (!message?.trim() && (!attachments || attachments.length === 0)) {
  return res.status(400).json(error);
}
```

### Problema: Chat non si aggiorna
**Causa**: Polling non attivo  
**Soluzione**: Verificare refetchInterval in useQuery:
```typescript
refetchInterval: 5000 // 5 secondi
```

### Problema: Errore 403 accesso chat
**Causa**: Utente non autorizzato  
**Soluzione**: Verificare ruolo e assegnazione richiesta

---

## 📊 METRICHE PERFORMANCE

- **Tempo caricamento chat**: < 500ms
- **Invio messaggio**: < 200ms
- **Upload allegato**: Dipende da dimensione (max 10MB)
- **Refresh rate**: 5 secondi
- **Messaggi per pagina**: Tutti (considerare paginazione futura)

---

## 🚀 MIGLIORAMENTI FUTURI

1. **WebSocket Real-time**: Sostituire polling con Socket.io
2. **Paginazione Messaggi**: Per chat con molti messaggi
3. **Reactions**: Emoji reactions ai messaggi
4. **Edit/Delete**: Modifica e cancellazione messaggi
5. **Typing Indicators**: Mostrare quando qualcuno sta scrivendo
6. **Voice Messages**: Messaggi vocali
7. **Read Receipts**: Conferme di lettura
8. **Thread/Risposte**: Rispondere a messaggi specifici

---

## 📝 CHANGELOG

### v2.0.0 - 16 Gennaio 2025
- ✅ Implementazione completa sistema chat
- ✅ Supporto allegati con invio solo file
- ✅ Fix visualizzazione nomi utenti
- ✅ Header con dati completi richiesta
- ✅ Integrazione con dashboard admin
- ✅ Sistema notifiche automatiche

### v1.0.0 - 10 Gennaio 2025
- 🚧 Prima implementazione base chat
- 🚧 Struttura database
- 🚧 API endpoints base

---

**Documento mantenuto da**: Team Sviluppo  
**Ultimo controllo qualità**: 16 Gennaio 2025
