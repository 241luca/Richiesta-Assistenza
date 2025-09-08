# Troubleshooting - Sistema Chat

## Problemi Comuni e Soluzioni

### 1. Errore: "The table RequestChatMessage does not exist"

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

---

### 2. Errore: "Argument 'id' is missing" per Notification

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

---

### 3. Errore: "Cannot find module '../middleware/auth.middleware'"

**Problema**: Import path errato nel file delle routes.

**Soluzione**:
Correggere l'import in `chat.routes.ts`:
```typescript
// ERRATO
import { authenticate } from '../middleware/auth.middleware';

// CORRETTO
import { authenticate } from '../middleware/auth';
```

---

### 4. Errore: "Identifier 'handleSendMessage' has already been declared"

**Problema**: Funzione duplicata nel componente React.

**Soluzione**:
1. Cercare tutte le occorrenze della funzione
2. Rimuovere la duplicata
3. Mantenere solo una definizione

---

### 5. Chat non si apre

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

---

### 6. Messaggi non vengono salvati

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

---

### 7. Nome utente non viene visualizzato

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

---

### 8. Badge ruoli non colorati

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

---

### 9. WebSocket non si connette

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

---

### 10. Chat rimane aperta per richieste completate

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

---

## Comandi Utili per Debug

### Database
```bash
# Visualizza schema database
npx prisma studio

# Reset database (ATTENZIONE: cancella tutti i dati!)
npx prisma migrate reset

# Verifica connessione database
npx prisma db pull
```

### Backend
```bash
# Logs dettagliati
DEBUG=* npm run dev

# Test endpoint manualmente
curl -X GET http://localhost:3200/api/chat/REQUEST_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend
```javascript
// Console browser per debug
localStorage.getItem('token'); // Verifica token
console.log(import.meta.env.VITE_API_URL); // Verifica URL backend
```

---

## Logs Importanti da Controllare

### Backend Logs
Cercare nel terminale del backend:
- `✅ Database connected successfully`
- `Server running on port 3200`
- Errori Prisma che iniziano con `Invalid invocation`
- Errori di autenticazione `401 Unauthorized`

### Frontend Console
Cercare nella console del browser:
- Errori di rete `Failed to fetch`
- Errori CORS
- Errori React Query
- WebSocket connection errors

---

## Contatti Supporto

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

---

## Checklist Pre-Produzione

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

*Troubleshooting Guide v1.0 - Ultimo aggiornamento: 31 Agosto 2025*
