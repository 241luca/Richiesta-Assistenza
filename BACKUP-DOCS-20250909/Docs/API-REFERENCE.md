# 📖 API REFERENCE
## Sistema di Richiesta Assistenza - API v2.0

Ultimo aggiornamento: **6 Gennaio 2025**

---

## 📋 INDICE

1. [Informazioni Generali](#informazioni-generali)
2. [Autenticazione](#autenticazione-auth)
3. [Gestione Utenti](#gestione-utenti-users)
4. [Richieste Assistenza](#richieste-assistenza-requests)
5. [Preventivi](#preventivi-quotes)
6. [Rapporti Intervento](#rapporti-intervento-intervention-reports)
7. [Categorie e Servizi](#categorie-e-servizi)
8. [Notifiche](#notifiche-notifications)
9. [File e Allegati](#file-e-allegati)
10. [WebSocket Events](#websocket-events)
11. [Error Codes](#error-codes)

---

## INFORMAZIONI GENERALI

### Base URL
```
Development: http://localhost:3200/api
Production: https://api.assistenza.com/api
```

### Headers Standard
```http
Content-Type: application/json
Authorization: Bearer {token}
X-Organization-Id: {orgId}  # Per multi-tenancy
```

### Response Format
```json
// Success Response
{
  "success": true,
  "data": { },
  "message": "Operation successful",
  "timestamp": "2025-01-06T10:00:00.000Z"
}

// Error Response
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  },
  "timestamp": "2025-01-06T10:00:00.000Z"
}

// Paginated Response
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

## AUTENTICAZIONE (`/auth`)

### 🔓 POST `/auth/register`
Registrazione nuovo utente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "firstName": "Mario",
  "lastName": "Rossi",
  "phone": "+39 333 1234567",
  "role": "CLIENT",  // CLIENT | PROFESSIONAL
  "address": "Via Roma 1",
  "city": "Milano",
  "province": "MI",
  "postalCode": "20100",
  
  // Per professionisti
  "profession": "Idraulico",
  "specializations": ["Riparazioni", "Installazioni"],
  "workRadius": 20,
  
  // Dati fiscali (opzionale)
  "fiscalCode": "RSSMRA80A01H501Z",
  "vatNumber": "12345678901",
  "companyName": "Mario Rossi SRL"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clr1234567890",
      "email": "user@example.com",
      "firstName": "Mario",
      "lastName": "Rossi",
      "role": "CLIENT"
    },
    "message": "Registrazione completata. Controlla email per verifica."
  }
}
```

### 🔐 POST `/auth/login`
Login utente.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "twoFactorCode": "123456"  // Se 2FA abilitato
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clr1234567890",
      "email": "user@example.com",
      "firstName": "Mario",
      "lastName": "Rossi",
      "role": "CLIENT"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 900  // 15 minuti
  }
}
```

---

## RICHIESTE ASSISTENZA (`/requests`)

### 📋 GET `/requests`
Lista richieste.

**Headers Required:** `Authorization: Bearer {token}`

**Query Parameters:**
- `page`: Numero pagina
- `limit`: Items per pagina
- `status`: PENDING|ASSIGNED|IN_PROGRESS|COMPLETED|CANCELLED
- `priority`: LOW|NORMAL|HIGH|URGENT
- `categoryId`: ID categoria
- `clientId`: ID cliente (admin only)
- `professionalId`: ID professionista
- `dateFrom`: Data inizio (ISO 8601)
- `dateTo`: Data fine (ISO 8601)
- `search`: Cerca nel titolo/descrizione

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "req123",
        "title": "Riparazione rubinetto",
        "description": "Il rubinetto della cucina perde",
        "status": "PENDING",
        "priority": "NORMAL",
        "category": {
          "id": "cat1",
          "name": "Idraulica"
        },
        "client": {
          "id": "user123",
          "fullName": "Mario Rossi",
          "email": "mario@example.com"
        },
        "professional": null,
        "address": "Via Roma 1, Milano",
        "requestedDate": "2025-01-10T10:00:00.000Z",
        "createdAt": "2025-01-06T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### ➕ POST `/requests`
Crea nuova richiesta (CLIENT only).

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "title": "Riparazione rubinetto",
  "description": "Il rubinetto della cucina perde acqua continuamente",
  "categoryId": "cat1",
  "subcategoryId": "subcat1",
  "priority": "HIGH",
  "address": "Via Roma 1",
  "city": "Milano",
  "province": "MI",
  "postalCode": "20100",
  "requestedDate": "2025-01-10T10:00:00.000Z",
  "attachments": ["file1.jpg", "file2.pdf"]  // File IDs da upload precedente
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "req124",
    "title": "Riparazione rubinetto",
    "status": "PENDING",
    "createdAt": "2025-01-06T10:00:00.000Z"
  },
  "message": "Richiesta creata con successo"
}
```

### 📄 GET `/requests/:id`
Dettaglio richiesta.

**Headers Required:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "req123",
    "title": "Riparazione rubinetto",
    "description": "Descrizione completa del problema...",
    "status": "ASSIGNED",
    "priority": "HIGH",
    "category": {
      "id": "cat1",
      "name": "Idraulica",
      "color": "#0066CC"
    },
    "subcategory": {
      "id": "subcat1",
      "name": "Riparazioni bagno"
    },
    "client": {
      "id": "user123",
      "fullName": "Mario Rossi",
      "email": "mario@example.com",
      "phone": "+39 333 1234567"
    },
    "professional": {
      "id": "prof123",
      "fullName": "Luigi Bianchi",
      "profession": "Idraulico",
      "rating": 4.5
    },
    "address": "Via Roma 1",
    "city": "Milano",
    "province": "MI",
    "postalCode": "20100",
    "latitude": 45.464203,
    "longitude": 9.189982,
    "requestedDate": "2025-01-10T10:00:00.000Z",
    "assignedDate": "2025-01-07T14:00:00.000Z",
    "quotes": [
      {
        "id": "quote1",
        "amount": 15000,
        "status": "PENDING"
      }
    ],
    "attachments": [
      {
        "id": "att1",
        "fileName": "rubinetto.jpg",
        "fileSize": 1024000,
        "url": "/uploads/attachments/rubinetto.jpg"
      }
    ],
    "messages": [
      {
        "id": "msg1",
        "content": "Posso venire domani mattina",
        "sender": "prof123",
        "createdAt": "2025-01-07T15:00:00.000Z"
      }
    ],
    "createdAt": "2025-01-06T10:00:00.000Z",
    "updatedAt": "2025-01-07T14:00:00.000Z"
  }
}
```

### ✏️ PUT `/requests/:id`
Modifica richiesta.

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "title": "Riparazione rubinetto urgente",
  "description": "Aggiornamento: il problema è peggiorato",
  "priority": "URGENT",
  "requestedDate": "2025-01-09T10:00:00.000Z"
}
```

### 🗑️ DELETE `/requests/:id`
Elimina richiesta.

**Headers Required:** `Authorization: Bearer {token}`

**Note:** Solo se status = PENDING o CANCELLED

### 👤 POST `/requests/:id/assign`
Assegna professionista (ADMIN only).

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "professionalId": "prof123",
  "notes": "Professionista esperto in questo tipo di intervento"
}
```

### 🔄 PUT `/requests/:id/status`
Cambia stato richiesta.

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "notes": "Lavoro iniziato"
}
```

### 💬 GET `/requests/:id/messages`
Lista messaggi richiesta.

**Headers Required:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "msg1",
      "content": "Quando posso venire?",
      "senderId": "prof123",
      "senderName": "Luigi Bianchi",
      "senderRole": "PROFESSIONAL",
      "createdAt": "2025-01-07T15:00:00.000Z",
      "isRead": true
    }
  ]
}
```

### 📨 POST `/requests/:id/messages`
Invia messaggio.

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "content": "Domani mattina alle 10 va bene"
}
```

---

## PREVENTIVI (`/quotes`)

### 📋 GET `/quotes`
Lista preventivi.

**Headers Required:** `Authorization: Bearer {token}`

**Query Parameters:**
- `requestId`: ID richiesta
- `status`: DRAFT|PENDING|ACCEPTED|REJECTED|EXPIRED
- `professionalId`: ID professionista

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "quote1",
      "requestId": "req123",
      "request": {
        "title": "Riparazione rubinetto"
      },
      "professional": {
        "id": "prof123",
        "fullName": "Luigi Bianchi"
      },
      "totalAmount": 15000,  // in centesimi (150.00 EUR)
      "status": "PENDING",
      "validUntil": "2025-01-20T23:59:59.000Z",
      "createdAt": "2025-01-07T10:00:00.000Z"
    }
  ]
}
```

### ➕ POST `/quotes`
Crea preventivo (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "requestId": "req123",
  "title": "Preventivo riparazione rubinetto",
  "description": "Riparazione completa con sostituzione guarnizioni",
  "validUntil": "2025-01-20T23:59:59.000Z",
  "items": [
    {
      "description": "Manodopera (2 ore)",
      "quantity": 2,
      "unitPrice": 5000,  // 50.00 EUR
      "totalPrice": 10000
    },
    {
      "description": "Guarnizioni e materiali",
      "quantity": 1,
      "unitPrice": 3000,
      "totalPrice": 3000
    },
    {
      "description": "Trasferta",
      "quantity": 1,
      "unitPrice": 2000,
      "totalPrice": 2000
    }
  ],
  "taxRate": 22,
  "notes": "Garanzia 12 mesi sul lavoro svolto",
  "termsAndConditions": "Pagamento alla fine del lavoro"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "quote2",
    "totalAmount": 18300,  // 15000 + IVA 22%
    "status": "PENDING",
    "createdAt": "2025-01-07T11:00:00.000Z"
  }
}
```

### 📄 GET `/quotes/:id`
Dettaglio preventivo.

**Headers Required:** `Authorization: Bearer {token}`

### ✏️ PUT `/quotes/:id`
Modifica preventivo (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Note:** Solo se status = DRAFT o PENDING

### 🗑️ DELETE `/quotes/:id`
Elimina preventivo (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Note:** Solo se status = DRAFT

### ✅ POST `/quotes/:id/accept`
Accetta preventivo (CLIENT only).

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "notes": "Accetto il preventivo, procedere con il lavoro"
}
```

### ❌ POST `/quotes/:id/reject`
Rifiuta preventivo (CLIENT only).

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "reason": "Prezzo troppo alto"
}
```

### 📄 GET `/quotes/:id/pdf`
Genera PDF preventivo.

**Headers Required:** `Authorization: Bearer {token}`

**Response:** Binary PDF file

---

## RAPPORTI INTERVENTO (`/intervention-reports`)

### 📋 GET `/intervention-reports/reports`
Lista rapporti.

**Headers Required:** `Authorization: Bearer {token}`

**Query Parameters:**
- `requestId`: ID richiesta associata
- `status`: DRAFT|COMPLETED|SIGNED|SENT|ARCHIVED
- `dateFrom`: Data inizio intervento
- `dateTo`: Data fine intervento
- `search`: Cerca nel numero rapporto o contenuto

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "report1",
      "reportNumber": "RA-2025-0001",
      "request": {
        "id": "req123",
        "title": "Riparazione rubinetto"
      },
      "professional": {
        "id": "prof123",
        "fullName": "Luigi Bianchi"
      },
      "client": {
        "id": "user123",
        "fullName": "Mario Rossi"
      },
      "interventionDate": "2025-01-10T10:00:00.000Z",
      "status": "COMPLETED",
      "isSigned": false,
      "createdAt": "2025-01-10T16:00:00.000Z"
    }
  ]
}
```

### ➕ POST `/intervention-reports/reports`
Crea rapporto intervento (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "requestId": "req123",
  "interventionDate": "2025-01-10T10:00:00.000Z",
  "startTime": "10:00",
  "endTime": "12:00",
  "templateId": "template1",
  "typeId": "type1",
  "formData": {
    "description": "Riparato rubinetto cucina",
    "problemFound": "Guarnizione usurata causava perdita",
    "solutionApplied": "Sostituita guarnizione e testato funzionamento"
  },
  "materials": [
    {
      "code": "GUAR001",
      "name": "Guarnizione rubinetto",
      "quantity": 1,
      "price": 500
    }
  ],
  "internalNotes": "Cliente molto soddisfatto",
  "clientNotes": "Fare attenzione a non forzare la manopola",
  "followUpRequired": false,
  "photos": ["photo1.jpg", "photo2.jpg"],
  "isDraft": false
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "report2",
    "reportNumber": "RA-2025-0002",
    "status": "COMPLETED",
    "createdAt": "2025-01-10T16:30:00.000Z"
  }
}
```

### 📄 GET `/intervention-reports/reports/:id`
Dettaglio rapporto.

**Headers Required:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "report1",
    "reportNumber": "RA-2025-0001",
    "request": { /* full request object */ },
    "professional": { /* full professional object */ },
    "client": { /* full client object */ },
    "interventionDate": "2025-01-10T10:00:00.000Z",
    "startTime": "10:00",
    "endTime": "12:00",
    "template": {
      "id": "template1",
      "name": "Rapporto Standard"
    },
    "type": {
      "id": "type1",
      "name": "Riparazione"
    },
    "formData": {
      "description": "Dettagli intervento...",
      "problemFound": "Problema riscontrato...",
      "solutionApplied": "Soluzione applicata..."
    },
    "materials": [ /* array materiali */ ],
    "internalNotes": "Note private",
    "clientNotes": "Note per cliente",
    "followUpRequired": false,
    "status": "COMPLETED",
    "isDraft": false,
    "isSigned": false,
    "photos": [ /* array foto */ ],
    "pdfPath": "/reports/RA-2025-0001.pdf",
    "createdAt": "2025-01-10T16:00:00.000Z",
    "updatedAt": "2025-01-10T16:00:00.000Z"
  }
}
```

### ✏️ PUT `/intervention-reports/reports/:id`
Modifica rapporto (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Note:** Solo se isDraft = true

### 🗑️ DELETE `/intervention-reports/reports/:id`
Elimina rapporto (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Note:** Solo se isDraft = true

### ✍️ POST `/intervention-reports/reports/:id/sign`
Firma rapporto.

**Headers Required:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "signature": "base64_signature_data",
  "signerRole": "CLIENT",  // CLIENT o PROFESSIONAL
  "signerName": "Mario Rossi"
}
```

### 📄 GET `/intervention-reports/reports/:id/pdf`
Scarica PDF rapporto.

**Headers Required:** `Authorization: Bearer {token}`

**Response:** Binary PDF file

### 🗂️ GET `/intervention-reports/professional/templates`
Lista template rapporti (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "template1",
      "name": "Rapporto Standard",
      "description": "Template base per tutti gli interventi",
      "sections": ["Descrizione", "Problema", "Soluzione", "Materiali"],
      "isDefault": true
    }
  ]
}
```

### 📦 GET `/intervention-reports/professional/materials`
Lista materiali (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "mat1",
      "code": "GUAR001",
      "name": "Guarnizione rubinetto",
      "description": "Guarnizione universale per rubinetti",
      "unit": "PZ",
      "price": 500,  // 5.00 EUR
      "vatRate": 22,
      "category": "Idraulica"
    }
  ]
}
```

### 💬 GET `/intervention-reports/professional/phrases`
Frasi ricorrenti (PROFESSIONAL only).

**Headers Required:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "phrase1",
      "category": "problem",
      "code": "P001",
      "title": "Perdita acqua",
      "content": "Rilevata perdita d'acqua causata da guarnizione usurata",
      "isFavorite": true
    }
  ]
}
```

### ⚙️ GET `/intervention-reports/professional/settings`
Impostazioni professionista.

**Headers Required:** `Authorization: Bearer {token}`

### 📊 GET `/intervention-reports/professional/stats`
Statistiche rapporti.

**Headers Required:** `Authorization: Bearer {token}`

**Query Parameters:**
- `range`: month|quarter|year

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "totalReports": 45,
    "draftReports": 3,
    "completedReports": 40,
    "signedReports": 35,
    "todayReports": 2,
    "averageCompletionTime": "2.5 hours",
    "topCategories": [
      { "name": "Idraulica", "count": 20 },
      { "name": "Elettricista", "count": 15 }
    ]
  }
}
```

---

## CATEGORIE E SERVIZI

### 📂 GET `/categories`
Lista categorie servizi.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "cat1",
      "name": "Idraulica",
      "description": "Servizi idraulici",
      "color": "#0066CC",
      "icon": "water",
      "isActive": true,
      "subcategories": [
        {
          "id": "subcat1",
          "name": "Riparazioni bagno",
          "description": "Riparazioni sanitari e rubinetteria"
        }
      ]
    }
  ]
}
```

### 🔧 GET `/professionals/categories`
Categorie con professionisti disponibili.

**Query Parameters:**
- `city`: Città
- `province`: Provincia

---

## NOTIFICHE (`/notifications`)

### 🔔 GET `/notifications`
Lista notifiche utente.

**Headers Required:** `Authorization: Bearer {token}`

**Query Parameters:**
- `isRead`: true|false
- `type`: Tipo notifica
- `limit`: Numero massimo

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "notif1",
        "type": "NEW_QUOTE",
        "title": "Nuovo preventivo ricevuto",
        "content": "Hai ricevuto un nuovo preventivo per la tua richiesta",
        "isRead": false,
        "metadata": {
          "requestId": "req123",
          "quoteId": "quote1"
        },
        "createdAt": "2025-01-07T10:00:00.000Z"
      }
    ],
    "unreadCount": 5
  }
}
```

### ✅ PUT `/notifications/:id/read`
Segna notifica come letta.

**Headers Required:** `Authorization: Bearer {token}`

### ✅ POST `/notifications/read-all`
Segna tutte come lette.

**Headers Required:** `Authorization: Bearer {token}`

---

## FILE E ALLEGATI

### 📤 POST `/uploads`
Upload file.

**Headers Required:** 
- `Authorization: Bearer {token}`
- `Content-Type: multipart/form-data`

**Form Data:**
- `file`: Binary file
- `type`: ATTACHMENT|PHOTO|DOCUMENT
- `requestId`: (opzionale) ID richiesta associata

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": "file1",
    "fileName": "document.pdf",
    "originalName": "Documento.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "url": "/uploads/documents/file1.pdf"
  }
}
```

### 📥 GET `/uploads/:id`
Download file.

**Headers Required:** `Authorization: Bearer {token}`

**Response:** Binary file

### 🗑️ DELETE `/uploads/:id`
Elimina file.

**Headers Required:** `Authorization: Bearer {token}`

---

## WEBSOCKET EVENTS

### Connection
```javascript
const socket = io('ws://localhost:3200', {
  auth: {
    token: 'Bearer {token}'
  }
});
```

### Events

#### 📨 Server → Client

**notification**
```json
{
  "type": "notification",
  "data": {
    "id": "notif1",
    "type": "NEW_MESSAGE",
    "title": "Nuovo messaggio",
    "content": "Hai ricevuto un messaggio"
  }
}
```

**request-updated**
```json
{
  "type": "request-updated",
  "data": {
    "requestId": "req123",
    "status": "IN_PROGRESS",
    "updatedBy": "prof123"
  }
}
```

**quote-received**
```json
{
  "type": "quote-received",
  "data": {
    "quoteId": "quote1",
    "requestId": "req123",
    "amount": 15000
  }
}
```

#### 📤 Client → Server

**join-request**
```json
{
  "type": "join-request",
  "requestId": "req123"
}
```

**typing**
```json
{
  "type": "typing",
  "requestId": "req123",
  "isTyping": true
}
```

---

## ERROR CODES

### Authentication Errors (AUTH_)
| Code | Message | HTTP Status |
|------|---------|------------|
| AUTH_001 | Invalid credentials | 401 |
| AUTH_002 | Token expired | 401 |
| AUTH_003 | Token invalid | 401 |
| AUTH_004 | User not found | 404 |
| AUTH_005 | Email not verified | 403 |
| AUTH_006 | Account locked | 403 |
| AUTH_007 | 2FA required | 428 |
| AUTH_008 | Invalid 2FA code | 401 |

### Permission Errors (PERM_)
| Code | Message | HTTP Status |
|------|---------|------------|
| PERM_001 | Insufficient permissions | 403 |
| PERM_002 | Resource access denied | 403 |
| PERM_003 | Organization access denied | 403 |

### Validation Errors (VAL_)
| Code | Message | HTTP Status |
|------|---------|------------|
| VAL_001 | Invalid input data | 400 |
| VAL_002 | Required field missing | 400 |
| VAL_003 | Invalid email format | 400 |
| VAL_004 | Password too weak | 400 |
| VAL_005 | File size exceeded | 413 |
| VAL_006 | Invalid file type | 415 |

### Business Logic Errors (BIZ_)
| Code | Message | HTTP Status |
|------|---------|------------|
| BIZ_001 | Request already assigned | 409 |
| BIZ_002 | Quote already accepted | 409 |
| BIZ_003 | Cannot modify completed request | 409 |
| BIZ_004 | Professional not available | 409 |
| BIZ_005 | Duplicate entry | 409 |

### Database Errors (DB_)
| Code | Message | HTTP Status |
|------|---------|------------|
| DB_001 | Database connection error | 500 |
| DB_002 | Query failed | 500 |
| DB_003 | Transaction failed | 500 |
| DB_004 | Record not found | 404 |

### External Service Errors (EXT_)
| Code | Message | HTTP Status |
|------|---------|------------|
| EXT_001 | Email service error | 503 |
| EXT_002 | Payment service error | 503 |
| EXT_003 | Maps service error | 503 |
| EXT_004 | AI service error | 503 |

---

## RATE LIMITING

### Limiti per endpoint

| Endpoint | Limite | Finestra |
|----------|--------|----------|
| `/auth/login` | 5 richieste | 15 minuti |
| `/auth/register` | 3 richieste | 1 ora |
| `/auth/forgot-password` | 3 richieste | 1 ora |
| Altri endpoints autenticati | 100 richieste | 15 minuti |
| Upload files | 10 files | 1 ora |

### Headers di risposta
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704543300
```

---

## ESEMPI DI INTEGRAZIONE

### JavaScript/TypeScript
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3200/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Login
const login = async (email: string, password: string) => {
  const response = await api.post('/auth/login', { email, password });
  const { accessToken } = response.data.data;
  
  // Set token for future requests
  api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  
  return response.data;
};

// Get requests
const getRequests = async () => {
  const response = await api.get('/requests');
  return response.data.data;
};
```

### cURL
```bash
# Login
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get requests with token
curl -X GET http://localhost:3200/api/requests \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Python
```python
import requests

base_url = "http://localhost:3200/api"
token = None

def login(email, password):
    global token
    response = requests.post(f"{base_url}/auth/login", json={
        "email": email,
        "password": password
    })
    data = response.json()
    token = data["data"]["accessToken"]
    return data

def get_requests():
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{base_url}/requests", headers=headers)
    return response.json()
```

---

**API Reference v2.0** - Sistema Richiesta Assistenza
*Ultimo aggiornamento: 6 Gennaio 2025*