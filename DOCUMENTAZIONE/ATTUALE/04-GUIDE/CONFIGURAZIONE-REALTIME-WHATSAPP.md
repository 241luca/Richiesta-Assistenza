# 📡 CONFIGURAZIONE REAL-TIME SERVER PER WHATSAPP

**Data**: 24 Settembre 2025  
**Sistema**: Richiesta Assistenza v4.2.1

## 🎯 COS'È IL REAL-TIME SERVER?

Il Real-time Server è un sistema che permette di ricevere **notifiche istantanee** quando arrivano messaggi WhatsApp, senza dover aggiornare manualmente la pagina.

### Come funziona in parole semplici:
1. **Senza Real-time**: Devi cliccare "Aggiorna" per vedere nuovi messaggi
2. **Con Real-time**: I messaggi appaiono automaticamente appena arrivano (come WhatsApp sul telefono!)

## 🔌 DOVE AGGIUNGERE IL CODICE

### 1. Nel file `server.ts` principale del backend

Trova il punto dove inizializzi Socket.io e aggiungi:

```typescript
// File: backend/src/server.ts

import { Server as SocketServer } from 'socket.io';
import { whatsAppRealtimeService } from './services/whatsapp-realtime.service';

// ... altro codice ...

// Dopo aver creato il server Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: "http://localhost:5193",
    credentials: true
  }
});

// AGGIUNGI QUESTA RIGA per attivare le notifiche real-time WhatsApp
whatsAppRealtimeService.initialize(io);

// ... resto del codice ...
```

### 2. Nel file `wppconnect.service.ts`

Trova il punto dove gestisci i messaggi in arrivo e aggiungi:

```typescript
// File: backend/src/services/wppconnect.service.ts

import { whatsAppRealtimeService } from './whatsapp-realtime.service';

// Trova questa funzione:
private async setupEventHandlers(): Promise<void> {
  if (!this.client) return;
  
  // Handler messaggi in arrivo
  this.client.onMessage(async (message: Message) => {
    try {
      // ... codice esistente per salvare il messaggio ...
      
      // AGGIUNGI QUESTA RIGA per notifiche real-time
      await whatsAppRealtimeService.handleIncomingMessage(message);
      
    } catch (error: any) {
      logger.error('Errore gestione messaggio:', error);
    }
  });
  
  // ... resto degli handler ...
}
```

## 🚀 COSA FA IL REAL-TIME SERVER

### 1. **Notifiche Immediate** 📨
Quando arriva un messaggio WhatsApp:
- Notifica subito tutti gli admin connessi
- Mostra un popup con il messaggio
- Aggiorna il contatore messaggi non letti
- Suona una notifica (opzionale)

### 2. **Creazione Automatica Ticket** 🎫
Se il messaggio è da un cliente:
- Riconosce automaticamente il cliente dal numero
- Se sembra una richiesta di aiuto, crea un ticket
- Collega il messaggio al ticket esistente se c'è

### 3. **Indicatori di Stato** 💬
- Mostra quando qualcuno sta scrivendo
- Conferme di lettura (quando un messaggio è letto)
- Stato invio (inviato/consegnato/letto)

### 4. **Sincronizzazione Multi-Utente** 👥
- Se più admin sono connessi, tutti vedono gli stessi aggiornamenti
- Quando uno legge un messaggio, gli altri lo vedono come letto

## 📱 COME SI USA NEL FRONTEND

Nel frontend React, gli admin possono connettersi così:

```javascript
// Connessione al WebSocket WhatsApp
import io from 'socket.io-client';

const socket = io('http://localhost:3200/whatsapp');

// Autenticazione
socket.emit('authenticate', { userId: currentUser.id });

// Ricevi nuovi messaggi
socket.on('newMessage', (data) => {
  console.log('Nuovo messaggio:', data);
  // Mostra notifica
  // Aggiorna lista messaggi
  // Suona notifica
});

// Vedi quando qualcuno sta scrivendo
socket.on('userTyping', (data) => {
  console.log(`${data.from} sta scrivendo...`);
});

// Marca messaggio come letto
socket.emit('markAsRead', { 
  messageId: 'id-del-messaggio',
  userId: currentUser.id 
});
```

## 🎯 VANTAGGI DEL REAL-TIME

### Per gli Amministratori:
1. **Non perdono messaggi** - Notifiche immediate
2. **Risposte più veloci** - Vedono subito quando arriva un messaggio
3. **Collaborazione** - Più admin possono gestire insieme

### Per i Clienti:
1. **Risposte più rapide** - Admin notificati subito
2. **Ticket automatici** - Non devono ripetere la richiesta
3. **Tracking migliore** - Vedono quando il messaggio è letto

## 🔧 CONFIGURAZIONE OPZIONALE

### Personalizzare le Notifiche
Nel file `whatsapp-realtime.service.ts` puoi modificare:

```typescript
// Cambia il suono delle notifiche
notification: {
  sound: true,  // true per suono, false per silenzioso
  vibrate: true, // vibrazione su mobile
  icon: 'whatsapp' // icona da mostrare
}

// Cambia quando creare ticket automatici
private looksLikeAssistanceRequest(message: string): boolean {
  const keywords = [
    'aiuto', 'problema', 'guasto', // aggiungi parole chiave
  ];
  // ...
}

// Cambia la priorità automatica
private detectPriority(message: string): string {
  if (message.includes('urgente')) return 'URGENT';
  // aggiungi altre regole
}
```

## 🚨 COSA SUCCEDE SE NON LO CONFIGURI?

Se NON configuri il real-time server:
- ❌ Nessuna notifica automatica per nuovi messaggi
- ❌ Devi aggiornare manualmente per vedere nuovi messaggi
- ❌ Nessun indicatore "sta scrivendo"
- ❌ Nessuna creazione automatica ticket

**MA il sistema funziona comunque!** Solo che sarà meno "reattivo" e dovrai controllare manualmente.

## ✅ CHECKLIST CONFIGURAZIONE

- [ ] Aggiunto `whatsAppRealtimeService.initialize(io)` in server.ts
- [ ] Aggiunto `handleIncomingMessage` nel handler messaggi
- [ ] Verificato che Socket.io sia configurato correttamente
- [ ] Testato che le notifiche arrivino nel browser
- [ ] Configurato i parametri opzionali se necessario

## 📞 SUPPORTO

Se hai problemi con la configurazione:
1. Verifica che Socket.io sia installato: `npm list socket.io`
2. Controlla che la porta 3200 sia aperta per WebSocket
3. Guarda i log del server per errori
4. Verifica nel browser: F12 → Network → WS (WebSocket)

Il real-time è **opzionale ma consigliato** per una migliore esperienza utente!
