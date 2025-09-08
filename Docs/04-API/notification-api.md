# API Sistema Notifiche

## Endpoints Template Notifiche

### GET /api/notification-templates/templates
Recupera tutti i template di notifica con filtri opzionali.

**Query Parameters:**
- `category` (string, optional): Filtra per categoria (auth, request, quote, payment, chat, professional)
- `isActive` (boolean, optional): Filtra per stato attivo/inattivo
- `search` (string, optional): Ricerca nel codice, nome o descrizione

**Headers:**
- `Authorization: Bearer {token}` (required)

**Response:**
```json
{
  "success": true,
  "message": "Templates retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "code": "welcome_user",
      "name": "Benvenuto Nuovo Utente",
      "category": "auth",
      "subject": "Benvenuto in {{appName}}!",
      "htmlContent": "<html>...</html>",
      "variables": [...],
      "channels": ["email"],
      "isActive": true
    }
  ],
  "metadata": {
    "count": 19
  }
}
```

### GET /api/notification-templates/events
Recupera tutti gli eventi configurati per le notifiche automatiche.

### POST /api/notification-templates/send
Invia una notifica utilizzando un template.

**Body:**
```json
{
  "templateCode": "welcome_user",
  "recipientId": "user-uuid",
  "variables": {
    "firstName": "Mario",
    "email": "mario@example.com",
    "appName": "Sistema Assistenza"
  }
}
```

## Note Importanti

### Gestione Parametri Opzionali
Quando si implementano filtri opzionali nelle API, è fondamentale gestire correttamente i parametri undefined:

```typescript
// CORRETTO
const filters = {
  isActive: req.query.isActive ? req.query.isActive === 'true' : undefined
};

// SBAGLIATO (bug del 31/08/2025, ora risolto)
const filters = {
  isActive: req.query.isActive === 'true' // Diventa false se undefined!
};
```

---
Documentazione aggiornata: 31/08/2025

