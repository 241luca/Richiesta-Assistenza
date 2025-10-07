# 📡 API Reference - Sistema Branding

**Data**: 18 Gennaio 2025  
**Versione API**: 1.0.0  
**Base URL**: `http://localhost:3200/api`

---

## 🔌 Endpoints Footer

### GET /footer/public
Recupera configurazione footer pubblica (no auth required).

**Response:**
```json
{
  "success": true,
  "data": {
    "sections": [
      {
        "key": "company",
        "title": "Azienda",
        "order": 1,
        "links": [
          {
            "id": "clxxx",
            "label": "Dashboard",
            "url": "/dashboard",
            "isExternal": false,
            "order": 1
          }
        ]
      }
    ]
  }
}
```

### GET /footer/sections
Lista tutte le sezioni footer (Admin only).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "key": "company",
      "title": "Azienda",
      "order": 1,
      "isVisible": true,
      "links": [...]
    }
  ]
}
```

### POST /footer/link
Crea nuovo link footer (Admin only).

**Request Body:**
```json
{
  "section": "company",
  "label": "Chi Siamo",
  "url": "/about",
  "order": 5,
  "isExternal": false,
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "section": "company",
    "label": "Chi Siamo",
    "url": "/about",
    "order": 5,
    "isExternal": false,
    "isActive": true,
    "createdAt": "2025-01-18T10:00:00Z"
  }
}
```

### PUT /footer/link/:id
Aggiorna link esistente (Admin only).

**URL Parameters:**
- `id` - ID del link da aggiornare

**Request Body:**
```json
{
  "label": "Chi Siamo - Aggiornato",
  "url": "/about-us",
  "order": 6
}
```

### DELETE /footer/link/:id
Elimina link footer (Admin only).

**URL Parameters:**
- `id` - ID del link da eliminare

**Response:**
```json
{
  "success": true,
  "message": "Link eliminato con successo"
}
```

### POST /footer/section
Crea o aggiorna sezione footer (Admin only).

**Request Body:**
```json
{
  "key": "social",
  "title": "Social Media",
  "order": 5,
  "isVisible": true
}
```

### POST /footer/initialize
Inizializza dati footer predefiniti (Admin only).

**Response:**
```json
{
  "success": true,
  "message": "Footer inizializzato con successo",
  "data": {
    "sections": 4,
    "links": 15
  }
}
```

---

## 🔧 System Settings Endpoints

### GET /public/system-settings/basic
Recupera settings pubbliche base (no auth required).

**Response:**
```json
{
  "success": true,
  "data": {
    "site_name": "Richiesta Assistenza",
    "site_logo_url": "https://example.com/logo.png",
    "site_claim": "Il tuo problema, la nostra soluzione",
    "site_version": "5.2.0",
    "company_name": "LM Tecnologie",
    "company_email": "info@lmtecnologie.it",
    "company_phone": "+39 02 1234567",
    "company_address": "Via Example 123, Milano"
  }
}
```

### GET /admin/system-settings
Lista tutte le settings (Admin only).

**Query Parameters:**
- `category` - Filtra per categoria (optional)
- `isPublic` - Solo settings pubbliche (optional)

### PUT /admin/system-settings/:key
Aggiorna singola setting (Admin only).

**URL Parameters:**
- `key` - Chiave della setting

**Request Body:**
```json
{
  "value": "Nuovo Valore",
  "dataType": "STRING"
}
```

---

## 🔐 Authentication

Per gli endpoint protetti è necessario includere il JWT token nell'header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## ⚠️ Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token non valido o mancante",
  "error": "UNAUTHORIZED"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Permessi insufficienti",
  "error": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Risorsa non trovata",
  "error": "NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Errore interno del server",
  "error": "INTERNAL_ERROR"
}
```

---

## 📊 Rate Limiting

- **Public endpoints**: 100 richieste/minuto per IP
- **Authenticated endpoints**: 200 richieste/minuto per utente
- **Upload endpoints**: 10 richieste/minuto per utente

Headers di risposta:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705574400
```

---

## 🧪 Testing con cURL

### Test public footer
```bash
curl http://localhost:3200/api/footer/public
```

### Test con autenticazione
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3200/api/footer/sections
```

### Crea nuovo link
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"section":"company","label":"Test","url":"/test"}' \
  http://localhost:3200/api/footer/link
```

---

**Fine API Documentation**
