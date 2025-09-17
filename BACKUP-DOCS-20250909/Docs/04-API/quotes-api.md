# API Preventivi (Quotes)

## Panoramica
Il sistema di gestione preventivi permette ai professionisti di creare, modificare e gestire preventivi per le richieste di assistenza. Include funzionalità di versionamento, tracciamento modifiche e gestione del ciclo di vita completo del preventivo.

## Endpoints

### 1. GET /api/quotes
Ottieni la lista dei preventivi filtrata per ruolo utente.

**Autorizzazione**: Richiede autenticazione

**Query Parameters**:
- `requestId` (string, optional): UUID della richiesta
- `status` (string, optional): DRAFT | PENDING | ACCEPTED | REJECTED | EXPIRED
- `professionalId` (string, optional): UUID del professionista (solo ADMIN/SUPER_ADMIN)
- `page` (number, optional): Numero pagina (default: 1)
- `limit` (number, optional): Elementi per pagina (default: 20, max: 100)

**Response**: 
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "uuid",
        "requestId": "uuid",
        "professionalId": "uuid",
        "title": "Preventivo riparazione impianto",
        "description": "Descrizione dettagliata",
        "status": "PENDING",
        "totalAmount": 25000,
        "currency": "EUR",
        "validUntil": "2024-02-01T00:00:00Z",
        "version": 1,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "items": [...],
        "request": {...},
        "professional": {...}
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### 2. POST /api/quotes
Crea un nuovo preventivo.

**Autorizzazione**: PROFESSIONAL, ADMIN, SUPER_ADMIN

**Request Body**:
```json
{
  "requestId": "uuid",
  "title": "Preventivo riparazione",
  "description": "Descrizione opzionale",
  "validUntil": "2024-02-01T00:00:00Z",
  "notes": "Note aggiuntive",
  "termsConditions": "Termini e condizioni",
  "items": [
    {
      "description": "Manodopera",
      "quantity": 2,
      "unitPrice": 50.00,
      "taxRate": 0.22
    }
  ]
}
```

**Response**: 201 Created
```json
{
  "success": true,
  "message": "Preventivo creato con successo",
  "data": {
    "id": "uuid",
    "version": 1,
    ...
  }
}
```

### 3. GET /api/quotes/:id
Ottieni i dettagli di un preventivo specifico.

**Autorizzazione**: 
- CLIENT: Solo preventivi non DRAFT per le proprie richieste
- PROFESSIONAL: Solo i propri preventivi
- ADMIN/SUPER_ADMIN: Tutti i preventivi

**Response**: 
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Preventivo riparazione",
    "description": "Descrizione dettagliata",
    "totalAmount": 25000,
    "items": [
      {
        "id": "uuid",
        "description": "Manodopera",
        "quantity": 2,
        "unitPrice": 5000,
        "totalPrice": 10000,
        "taxRate": 0.22,
        "taxAmount": 2200,
        "order": 1
      }
    ],
    "request": {...},
    "professional": {...}
  }
}
```

### 4. PUT /api/quotes/:id ✨ NUOVO
Modifica un preventivo esistente creando una nuova versione.

**Autorizzazione**: 
- PROFESSIONAL: Solo i propri preventivi
- ADMIN/SUPER_ADMIN: Tutti i preventivi

**Limitazioni**:
- Solo preventivi in stato DRAFT o PENDING possono essere modificati
- Ogni modifica incrementa il numero di versione
- Le modifiche vengono tracciate nella tabella QuoteRevision

**Request Body**:
```json
{
  "title": "Preventivo aggiornato",
  "description": "Nuova descrizione",
  "validUntil": "2024-02-15T00:00:00Z",
  "notes": "Note aggiornate",
  "termsConditions": "Nuovi termini",
  "items": [
    {
      "description": "Manodopera aggiornata",
      "quantity": 3,
      "unitPrice": 55.00,
      "taxRate": 0.22
    }
  ],
  "updateReason": "Aggiornamento prezzi materiali"
}
```

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Preventivo aggiornato con successo",
  "data": {
    "id": "uuid",
    "version": 2,
    "updatedAt": "2024-01-02T00:00:00Z",
    ...
  }
}
```

### 5. DELETE /api/quotes/:id ✨ NUOVO
Cancella un preventivo.

**Autorizzazione**: 
- PROFESSIONAL: Solo i propri preventivi
- ADMIN/SUPER_ADMIN: Tutti i preventivi
- CLIENT: Non autorizzato

**Limitazioni**:
- Non è possibile cancellare preventivi in stato ACCEPTED
- La cancellazione viene tracciata nei log di sistema con tutti i dettagli

**Request Body** (opzionale):
```json
{
  "reason": "Motivo della cancellazione"
}
```

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Preventivo cancellato con successo",
  "data": {
    "id": "uuid",
    "deleted": true
  }
}
```

**Tracciamento**: Ogni cancellazione registra nei log:
- ID e ruolo dell'utente che ha cancellato
- Dettagli completi del preventivo (titolo, importo, stato, versione)
- Motivo della cancellazione (se fornito)
- Timestamp e indirizzo IP
- Numero di items e valore totale

### 6. GET /api/quotes/:id/revisions ✨ NUOVO
Ottieni la cronologia delle revisioni di un preventivo.

**Autorizzazione**: 
- CLIENT: Solo per preventivi delle proprie richieste
- PROFESSIONAL: Solo per i propri preventivi
- ADMIN/SUPER_ADMIN: Tutti i preventivi

**Response**: 
```json
{
  "success": true,
  "message": "Cronologia revisioni recuperata con successo",
  "data": [
    {
      "id": "uuid",
      "quoteId": "uuid",
      "version": 2,
      "reason": "Aggiornamento prezzi",
      "changes": {...},
      "userId": "uuid",
      "User": {
        "id": "uuid",
        "fullName": "Mario Rossi"
      },
      "createdAt": "2024-01-02T00:00:00Z"
    },
    {
      "id": "uuid",
      "quoteId": "uuid",
      "version": 1,
      "reason": "Creazione iniziale",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### 7. POST /api/quotes/:id/accept
Accetta un preventivo (solo CLIENT).

**Autorizzazione**: CLIENT (solo per preventivi delle proprie richieste)

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Preventivo accettato con successo",
  "data": {
    "id": "uuid",
    "status": "ACCEPTED",
    "isSelected": true
  }
}
```

### 8. POST /api/quotes/:id/reject
Rifiuta un preventivo (solo CLIENT).

**Autorizzazione**: CLIENT (solo per preventivi delle proprie richieste)

**Request Body**:
```json
{
  "reason": "Motivo del rifiuto (opzionale)"
}
```

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Preventivo rifiutato",
  "data": {
    "id": "uuid",
    "status": "REJECTED"
  }
}
```

### 9. GET /api/quotes/:id/pdf
Scarica il PDF di un preventivo.

**Autorizzazione**: 
- CLIENT: Solo per preventivi delle proprie richieste
- PROFESSIONAL: Solo per i propri preventivi
- ADMIN/SUPER_ADMIN: Tutti i preventivi

**Response**: File PDF binario con headers appropriati

## Stati del Preventivo

- **DRAFT**: Bozza, visibile solo al professionista
- **PENDING**: In attesa di risposta dal cliente
- **ACCEPTED**: Accettato dal cliente
- **REJECTED**: Rifiutato dal cliente
- **EXPIRED**: Scaduto (validUntil superato)

## Gestione Versioni

Il sistema implementa un controllo versioni completo:

1. **Creazione**: Ogni nuovo preventivo parte dalla versione 1
2. **Modifica**: Ogni modifica incrementa la versione e crea un record in QuoteRevision
3. **Tracciamento**: Ogni revisione salva:
   - Numero versione
   - Motivo della modifica
   - Snapshot completo dei dati precedenti
   - Utente che ha effettuato la modifica
   - Timestamp

## Gestione Items

Ogni preventivo può contenere multiple voci (items):

```json
{
  "description": "Descrizione voce",
  "quantity": 1,
  "unitPrice": 100.00,
  "taxRate": 0.22,
  "discount": 0,
  "notes": "Note opzionali",
  "order": 1
}
```

**Calcoli automatici**:
- `totalPrice` = quantity × unitPrice
- `taxAmount` = totalPrice × taxRate
- `finalPrice` = totalPrice + taxAmount - discount

## Note di Sicurezza

1. **Autorizzazioni**: Ogni endpoint verifica i permessi dell'utente
2. **Validazione**: Tutti gli input sono validati con express-validator
3. **Audit Trail**: Modifiche e cancellazioni sono tracciate
4. **Transazioni**: Operazioni critiche usano transazioni database
5. **Rate Limiting**: Implementato per prevenire abusi

## Codici di Errore

- `400 Bad Request`: Dati di input non validi
- `401 Unauthorized`: Non autenticato
- `403 Forbidden`: Non autorizzato per l'operazione
- `404 Not Found`: Preventivo non trovato
- `409 Conflict`: Conflitto di stato (es. modifica preventivo accettato)
- `500 Internal Server Error`: Errore del server

## Best Practices

1. **Versionamento**: Sempre tracciare le modifiche con un motivo
2. **Validità**: Impostare sempre una data di validità ragionevole
3. **Dettaglio Items**: Fornire descrizioni chiare per ogni voce
4. **Note**: Utilizzare le note per comunicazioni importanti
5. **Cancellazioni**: Fornire sempre un motivo quando si cancella
