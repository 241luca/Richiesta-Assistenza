# 📡 API DOCUMENTATION - NOTIFICATION SYSTEM

## OpenAPI 3.0 Specification

```yaml
openapi: 3.0.0
info:
  title: Notification System API
  version: 2.0.0
  description: Complete API documentation for the Richiesta Assistenza Notification System
  contact:
    name: LM Tecnologie
    email: support@lmtecnologie.it

servers:
  - url: http://localhost:3200/api
    description: Development server
  - url: https://api.assistenza.com/api
    description: Production server

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Notification:
      type: object
      properties:
        id:
          type: string
          format: uuid
        recipientId:
          type: string
          format: uuid
        type:
          type: string
          enum: [NEW_REQUEST, REQUEST_ASSIGNED, NEW_QUOTE, PAYMENT_SUCCESS, etc]
        title:
          type: string
          maxLength: 200
        content:
          type: string
          maxLength: 1000
        priority:
          type: string
          enum: [LOW, NORMAL, HIGH, URGENT]
        isRead:
          type: boolean
          default: false
        readAt:
          type: string
          format: date-time
        metadata:
          type: object
        createdAt:
          type: string
          format: date-time

    NotificationStats:
      type: object
      properties:
        total:
          type: integer
        sent:
          type: integer
        delivered:
          type: integer
        read:
          type: integer
        failed:
          type: integer
        deliveryRate:
          type: number
          format: float
        readRate:
          type: number
          format: float
        byType:
          type: array
          items:
            type: object
            properties:
              type:
                type: string
              count:
                type: integer
        byChannel:
          type: array
          items:
            type: object
            properties:
              channel:
                type: string
              count:
                type: integer

    Error:
      type: object
      properties:
        success:
          type: boolean
          default: false
        message:
          type: string
        code:
          type: string
        details:
          type: object

security:
  - bearerAuth: []

paths:
  /notifications:
    get:
      summary: Get user notifications
      tags:
        - User Notifications
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
        - in: query
          name: offset
          schema:
            type: integer
            default: 0
        - in: query
          name: unread
          schema:
            type: boolean
        - in: query
          name: type
          schema:
            type: string
      responses:
        '200':
          description: List of notifications
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Notification'
                  pagination:
                    type: object

  /notifications/unread:
    get:
      summary: Get unread notifications
      tags:
        - User Notifications
      responses:
        '200':
          description: Unread notifications

  /notifications/count:
    get:
      summary: Get unread count
      tags:
        - User Notifications
      responses:
        '200':
          description: Count of unread notifications
          content:
            application/json:
              example:
                success: true
                data:
                  count: 5

  /notifications/{id}/read:
    post:
      summary: Mark notification as read
      tags:
        - User Notifications
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Notification marked as read

  /notifications/read-all:
    post:
      summary: Mark all notifications as read
      tags:
        - User Notifications
      responses:
        '200':
          description: All notifications marked as read

  /notifications/stats:
    get:
      summary: Get notification statistics (Admin)
      tags:
        - Admin
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Notification statistics
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NotificationStats'

  /notifications/logs:
    get:
      summary: Get notification logs (Admin)
      tags:
        - Admin
      parameters:
        - in: query
          name: type
          schema:
            type: string
        - in: query
          name: priority
          schema:
            type: string
        - in: query
          name: status
          schema:
            type: string
        - in: query
          name: search
          schema:
            type: string
        - in: query
          name: dateFrom
          schema:
            type: string
            format: date
        - in: query
          name: dateTo
          schema:
            type: string
            format: date
        - in: query
          name: limit
          schema:
            type: integer
            default: 100
        - in: query
          name: offset
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Notification logs

  /notifications/test:
    post:
      summary: Send test notification (Admin)
      tags:
        - Admin
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                type:
                  type: string
                title:
                  type: string
                message:
                  type: string
                priority:
                  type: string
                  enum: [low, normal, high, urgent]
                channels:
                  type: array
                  items:
                    type: string
                    enum: [websocket, email, sms, push]
      responses:
        '200':
          description: Test notification sent

  /notifications/{id}/resend:
    post:
      summary: Resend failed notification (Admin)
      tags:
        - Admin
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Notification resent

  /notifications/broadcast:
    post:
      summary: Send broadcast notification (Super Admin)
      tags:
        - Super Admin
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                role:
                  type: string
                  enum: [ALL, CLIENT, PROFESSIONAL, ADMIN]
                type:
                  type: string
                title:
                  type: string
                message:
                  type: string
                priority:
                  type: string
                channels:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Broadcast sent
```

## 🔍 DETAILED ENDPOINT DOCUMENTATION

### 1. USER ENDPOINTS

#### GET /api/notifications
Recupera le notifiche dell'utente autenticato.

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | integer | 20 | Numero massimo di risultati |
| `offset` | integer | 0 | Offset per paginazione |
| `unread` | boolean | false | Solo notifiche non lette |
| `type` | string | null | Filtra per tipo notifica |
| `priority` | string | null | Filtra per priorità |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxx123abc",
      "recipientId": "user123",
      "type": "NEW_REQUEST",
      "title": "Nuova richiesta di assistenza",
      "content": "È stata creata una nuova richiesta #1234",
      "priority": "NORMAL",
      "isRead": false,
      "readAt": null,
      "metadata": {
        "requestId": "req123",
        "requestTitle": "Riparazione caldaia",
        "actionUrl": "/requests/req123"
      },
      "createdAt": "2025-09-06T10:30:00Z",
      "updatedAt": "2025-09-06T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "pages": 8
  },
  "message": "Notifications retrieved successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Unauthorized",
  "code": "AUTH_ERROR"
}
```

---

#### POST /api/notifications/{id}/read
Marca una notifica specifica come letta.

**Path Parameters:**
- `id` (string, required): ID della notifica

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "clxx123abc",
    "readAt": "2025-09-06T11:00:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Notification not found",
  "code": "NOT_FOUND"
}
```

---

#### POST /api/notifications/read-all
Marca tutte le notifiche dell'utente come lette.

**Success Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updated": 23
  }
}
```

---

#### GET /api/notifications/unread
Recupera solo le notifiche non lette.

**Query Parameters:**
- `limit` (integer): Default 20

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxx456def",
      "type": "NEW_QUOTE",
      "title": "Nuovo preventivo ricevuto",
      "content": "Hai ricevuto un preventivo di €250",
      "priority": "HIGH",
      "isRead": false,
      "createdAt": "2025-09-06T09:00:00Z"
    }
  ],
  "message": "Unread notifications retrieved"
}
```

---

#### GET /api/notifications/count
Ottiene il conteggio delle notifiche non lette.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "byType": {
      "NEW_REQUEST": 2,
      "NEW_QUOTE": 1,
      "NEW_MESSAGE": 2
    }
  }
}
```

---

### 2. ADMIN ENDPOINTS

#### GET /api/notifications/stats
Statistiche complete del sistema notifiche.

**Required Role:** ADMIN or SUPER_ADMIN

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 15234,
    "sent": 14890,
    "delivered": 14560,
    "read": 12340,
    "failed": 344,
    "deliveryRate": 97.78,
    "readRate": 84.75,
    "failureRate": 2.31,
    "byType": [
      {
        "type": "NEW_REQUEST",
        "count": 4500,
        "percentage": 29.54
      },
      {
        "type": "NEW_QUOTE",
        "count": 3200,
        "percentage": 21.01
      }
    ],
    "byPriority": [
      {
        "priority": "NORMAL",
        "count": 8000,
        "percentage": 52.52
      },
      {
        "priority": "HIGH",
        "count": 4500,
        "percentage": 29.54
      }
    ],
    "byChannel": [
      {
        "channel": "websocket",
        "count": 12000,
        "percentage": 78.76
      },
      {
        "channel": "email",
        "count": 3234,
        "percentage": 21.24
      }
    ],
    "last7Days": [
      {
        "date": "2025-09-01",
        "count": 1234
      },
      {
        "date": "2025-09-02",
        "count": 1456
      }
    ],
    "averageReadTime": 3600,
    "peakHours": [
      {
        "hour": 9,
        "count": 1200
      },
      {
        "hour": 14,
        "count": 1100
      }
    ]
  },
  "message": "Statistics retrieved"
}
```

---

#### GET /api/notifications/logs
Log completo di tutte le notifiche con filtri avanzati.

**Required Role:** ADMIN or SUPER_ADMIN

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | No | Filtra per tipo notifica |
| `priority` | string | No | Filtra per priorità (low, normal, high, urgent) |
| `status` | string | No | Filtra per stato (pending, sent, delivered, read, failed) |
| `search` | string | No | Ricerca nel titolo o contenuto |
| `dateFrom` | date | No | Data inizio (YYYY-MM-DD) |
| `dateTo` | date | No | Data fine (YYYY-MM-DD) |
| `recipientId` | string | No | Filtra per destinatario |
| `limit` | integer | No | Limite risultati (default: 100, max: 500) |
| `offset` | integer | No | Offset per paginazione |
| `sortBy` | string | No | Campo ordinamento (createdAt, priority, type) |
| `sortOrder` | string | No | Direzione (asc, desc) |

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "clxx789ghi",
        "recipientId": "user456",
        "recipient": {
          "id": "user456",
          "fullName": "Mario Rossi",
          "email": "mario.rossi@example.com",
          "role": "CLIENT"
        },
        "type": "NEW_REQUEST",
        "title": "Nuova richiesta #1234",
        "content": "È stata creata una nuova richiesta di assistenza",
        "priority": "HIGH",
        "isRead": true,
        "readAt": "2025-09-06T10:45:00Z",
        "channels": ["websocket", "email"],
        "status": "delivered",
        "metadata": {
          "requestId": "req789",
          "categoryId": "cat123",
          "professionalId": "prof456",
          "emailSentAt": "2025-09-06T10:30:15Z",
          "emailDeliveredAt": "2025-09-06T10:30:45Z"
        },
        "createdAt": "2025-09-06T10:30:00Z",
        "updatedAt": "2025-09-06T10:45:00Z"
      }
    ],
    "total": 5432,
    "limit": 100,
    "offset": 0,
    "filters": {
      "type": "NEW_REQUEST",
      "priority": "HIGH",
      "dateFrom": "2025-09-01",
      "dateTo": "2025-09-06"
    }
  },
  "message": "Logs retrieved"
}
```

---

#### POST /api/notifications/test
Invia una notifica di test per verificare il sistema.

**Required Role:** ADMIN or SUPER_ADMIN

**Request Body:**
```json
{
  "email": "test@example.com",
  "userId": "user123",
  "type": "TEST_NOTIFICATION",
  "title": "Test Notifica Dashboard",
  "message": "Questa è una notifica di test inviata dalla dashboard admin",
  "priority": "normal",
  "channels": ["websocket", "email"],
  "metadata": {
    "testId": "test123",
    "testMode": true
  }
}
```

**Validation Rules:**
- `email` OR `userId` required (not both)
- `type` required, must be valid NotificationType
- `title` required, max 200 chars
- `message` required, max 1000 chars
- `priority` must be: low, normal, high, urgent
- `channels` array, at least one channel

**Success Response (200):**
```json
{
  "success": true,
  "message": "Test notification sent",
  "data": {
    "notificationId": "clxx999xyz",
    "sentTo": "user123",
    "channels": ["websocket", "email"],
    "timestamp": "2025-09-06T11:30:00Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Validation error",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

#### POST /api/notifications/{id}/resend
Reinvia una notifica fallita.

**Required Role:** ADMIN or SUPER_ADMIN

**Path Parameters:**
- `id` (string, required): ID della notifica da reinviare

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification resent",
  "data": {
    "originalId": "clxx123abc",
    "newId": "clxx456def",
    "resentAt": "2025-09-06T12:00:00Z",
    "resentBy": "admin123"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Notification not found",
  "code": "NOT_FOUND"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot resend: notification already delivered",
  "code": "INVALID_STATE"
}
```

---

#### POST /api/notifications/broadcast
Invia una notifica broadcast a un gruppo di utenti.

**Required Role:** SUPER_ADMIN only

**Request Body:**
```json
{
  "role": "CLIENT",
  "type": "SYSTEM_MAINTENANCE",
  "title": "Manutenzione programmata",
  "message": "Il sistema sarà in manutenzione dalle 02:00 alle 04:00",
  "priority": "high",
  "channels": ["websocket", "email"],
  "filters": {
    "emailVerified": true,
    "isActive": true,
    "region": "IT"
  },
  "scheduling": {
    "sendAt": "2025-09-07T01:00:00Z",
    "timezone": "Europe/Rome"
  }
}
```

**Validation:**
- `role`: ALL, CLIENT, PROFESSIONAL, ADMIN (optional, default: ALL)
- `type`: Valid NotificationType
- `scheduling`: Optional, for scheduled broadcasts

**Success Response (200):**
```json
{
  "success": true,
  "message": "Broadcast sent",
  "data": {
    "broadcastId": "bcast123",
    "targetRole": "CLIENT",
    "totalUsers": 1234,
    "succeeded": 1200,
    "failed": 34,
    "successRate": 97.24,
    "scheduledFor": null,
    "sentBy": "superadmin123",
    "sentAt": "2025-09-06T13:00:00Z"
  }
}
```

**Error Response (403):**
```json
{
  "success": false,
  "message": "Insufficient permissions",
  "code": "FORBIDDEN"
}
```

---

#### DELETE /api/notifications/{id}
Elimina una notifica dal sistema.

**Required Role:** ADMIN or SUPER_ADMIN

**Path Parameters:**
- `id` (string, required): ID della notifica

**Success Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted",
  "data": {
    "deletedId": "clxx123abc",
    "deletedAt": "2025-09-06T14:00:00Z",
    "deletedBy": "admin123"
  }
}
```

---

### 3. WEBHOOK ENDPOINTS

#### POST /api/notifications/webhook/email
Webhook per aggiornamenti stato email (Brevo/SendGrid).

**No Authentication Required** (verified by webhook signature)

**Request Body:**
```json
{
  "event": "delivered",
  "messageId": "msg123",
  "email": "user@example.com",
  "timestamp": "2025-09-06T10:30:45Z",
  "metadata": {
    "notificationId": "clxx123abc"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Webhook processed"
}
```

---

### 4. WEBSOCKET EVENTS

#### Connection
```javascript
const socket = io('http://localhost:3200', {
  auth: {
    token: localStorage.getItem('token')
  }
});
```

#### Events

**Server → Client:**

| Event | Description | Payload |
|-------|-------------|---------|
| `notification` | Nuova notifica | `{ id, type, title, content, priority }` |
| `notification:updated` | Notifica aggiornata | `{ id, changes }` |
| `notification:deleted` | Notifica eliminata | `{ id }` |
| `notification:allRead` | Tutte lette | `{}` |
| `notification:count` | Aggiornamento conteggio | `{ count }` |

**Client → Server:**

| Event | Description | Payload |
|-------|-------------|---------|
| `notification:markRead` | Marca come letta | `notificationId` |
| `notification:markAllRead` | Marca tutte come lette | `{}` |
| `notification:subscribe` | Iscriviti a canale | `{ channel }` |
| `notification:unsubscribe` | Disiscrivi da canale | `{ channel }` |

**Example:**
```javascript
// Client
socket.on('notification', (data) => {
  console.log('New notification:', data);
  showToast(data.title);
});

socket.emit('notification:markRead', 'clxx123abc');

// Server acknowledgment
socket.on('notification:updated', (data) => {
  console.log('Notification updated:', data);
});
```

---

## 📊 RESPONSE CODES

| Code | Description | Action |
|------|-------------|--------|
| **200** | Success | Process response |
| **201** | Created | New resource created |
| **400** | Bad Request | Check request format |
| **401** | Unauthorized | Check authentication |
| **403** | Forbidden | Insufficient permissions |
| **404** | Not Found | Resource doesn't exist |
| **409** | Conflict | Resource already exists |
| **429** | Too Many Requests | Rate limit exceeded |
| **500** | Internal Server Error | Retry or contact support |
| **503** | Service Unavailable | Service temporarily down |

---

## 🔒 AUTHENTICATION

All endpoints (except webhooks) require JWT authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token structure:
```json
{
  "userId": "user123",
  "email": "user@example.com",
  "role": "CLIENT",
  "iat": 1693900000,
  "exp": 1696492000
}
```

---

## 📈 RATE LIMITING

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| User endpoints | 100 requests | 15 minutes |
| Admin endpoints | 200 requests | 15 minutes |
| Test notifications | 10 requests | 1 hour |
| Broadcast | 1 request | 1 hour |
| Webhooks | 1000 requests | 1 minute |

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693900900
```

---

## 🧪 TESTING

### Postman Collection
Download: [Notification System API.postman_collection.json]

### cURL Examples

**Get notifications:**
```bash
curl -X GET "http://localhost:3200/api/notifications?limit=10&unread=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Send test notification:**
```bash
curl -X POST "http://localhost:3200/api/notifications/test" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "type": "TEST_NOTIFICATION",
    "title": "Test",
    "message": "Test message",
    "priority": "normal",
    "channels": ["websocket", "email"]
  }'
```

**Mark as read:**
```bash
curl -X POST "http://localhost:3200/api/notifications/clxx123abc/read" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📝 CHANGELOG

### v2.0.0 (2025-09-06)
- Added admin dashboard endpoints
- Added broadcast functionality
- Added webhook support
- Enhanced filtering and search
- Added WebSocket events

### v1.0.0 (2025-08-30)
- Initial API release
- Basic CRUD operations
- WebSocket support
- Email integration

---

**API Documentation v2.0.0**  
*Last updated: September 6, 2025*  
*© 2025 LM Tecnologie*
