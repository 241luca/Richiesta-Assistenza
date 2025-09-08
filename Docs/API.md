# 📖 API Documentation - Sistema Richiesta Assistenza v2.0.0

**Base URL**: `https://api.assistenza.lmtecnologie.it`  
**Version**: 2.0.0  
**Last Updated**: 6 Settembre 2025

## 🔑 Authentication

The API uses **JWT Bearer tokens** for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-token-here>
```

### Token Lifecycle
- **Access Token**: Valid for 15 minutes
- **Refresh Token**: Valid for 7 days
- **2FA Token**: Valid for 30 seconds (when 2FA enabled)

---

## 📊 Response Format

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "metadata": { ... },
  "requestId": "uuid-v4",
  "timestamp": "2025-09-06T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": {
    "code": "ERROR_CODE",
    "details": { ... }
  },
  "requestId": "uuid-v4",
  "timestamp": "2025-09-06T10:30:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  },
  "requestId": "uuid-v4",
  "timestamp": "2025-09-06T10:30:00.000Z"
}
```

---

## 🔐 Authentication Endpoints

### Register New User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+39 123 456 7890",
  "role": "CLIENT",
  "address": "Via Roma 1",
  "city": "Milano",
  "province": "MI",
  "postalCode": "20100"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "CLIENT"
    }
  }
}
```

### Login
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "accessToken": "eyJhbGciOiJ...",
    "refreshToken": "eyJhbGciOiJ...",
    "expiresIn": 900
  }
}
```

### Login with 2FA
```http
POST /api/auth/login/2fa
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "totpCode": "123456"
}
```

### Refresh Token
```http
POST /api/auth/refresh
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJ..."
}
```

### Logout
```http
POST /api/auth/logout
```

**Headers:**
```
Authorization: Bearer <token>
```

### Enable 2FA
```http
POST /api/auth/2fa/enable
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,...",
    "backupCodes": ["code1", "code2", ...]
  }
}
```

### Verify 2FA
```http
POST /api/auth/2fa/verify
```

**Request Body:**
```json
{
  "totpCode": "123456"
}
```

---

## 📋 Assistance Requests

### Get All Requests
```http
GET /api/requests
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `page` | number | Page number | 1 |
| `limit` | number | Items per page | 20 |
| `status` | string | Filter by status | - |
| `category` | string | Filter by category | - |
| `priority` | string | Filter by priority | - |
| `search` | string | Search in title/description | - |
| `sortBy` | string | Sort field | createdAt |
| `sortOrder` | string | asc/desc | desc |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Riparazione impianto elettrico",
      "description": "...",
      "status": "PENDING",
      "priority": "HIGH",
      "category": "Elettricista",
      "client": {
        "id": "uuid",
        "firstName": "John",
        "lastName": "Doe"
      },
      "professional": null,
      "createdAt": "2025-09-06T10:00:00Z",
      "requestedDate": "2025-09-07T14:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### Get Single Request
```http
GET /api/requests/:id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Riparazione impianto elettrico",
    "description": "Detailed description...",
    "status": "ASSIGNED",
    "priority": "HIGH",
    "category": "Elettricista",
    "subcategoryId": "uuid",
    "address": "Via Roma 1",
    "city": "Milano",
    "province": "MI",
    "postalCode": "20100",
    "latitude": 45.4642,
    "longitude": 9.1900,
    "client": { ... },
    "professional": { ... },
    "quotes": [ ... ],
    "attachments": [ ... ],
    "scheduledInterventions": [ ... ],
    "createdAt": "2025-09-06T10:00:00Z"
  }
}
```

### Create Request
```http
POST /api/requests
```

**Request Body:**
```json
{
  "title": "Riparazione rubinetto",
  "description": "Il rubinetto della cucina perde",
  "category": "Idraulico",
  "subcategoryId": "uuid",
  "priority": "MEDIUM",
  "address": "Via Roma 1",
  "city": "Milano",
  "province": "MI",
  "postalCode": "20100",
  "requestedDate": "2025-09-08T10:00:00Z"
}
```

### Update Request
```http
PUT /api/requests/:id
```

**Request Body:**
```json
{
  "status": "IN_PROGRESS",
  "priority": "URGENT",
  "description": "Updated description"
}
```

### Delete Request
```http
DELETE /api/requests/:id
```

### Upload Attachments
```http
POST /api/requests/:id/attachments
```

**Headers:**
```
Content-Type: multipart/form-data
```

**Form Data:**
- `files[]`: Multiple file uploads
- `descriptions[]`: Array of descriptions

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "fileName": "photo1.jpg",
      "originalName": "IMG_001.jpg",
      "fileType": "image/jpeg",
      "fileSize": 102400,
      "description": "Foto del problema",
      "uploadedAt": "2025-09-06T10:30:00Z"
    }
  ]
}
```

---

## 💰 Quotes Management

### Get Quotes for Request
```http
GET /api/quotes?requestId=uuid
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "requestId": "uuid",
      "professionalId": "uuid",
      "title": "Preventivo riparazione",
      "totalAmount": 25000,
      "currency": "EUR",
      "status": "PENDING",
      "validUntil": "2025-09-20T23:59:59Z",
      "items": [
        {
          "description": "Manodopera",
          "quantity": 2,
          "unitPrice": 5000,
          "totalPrice": 10000,
          "taxRate": 0.22
        }
      ],
      "createdAt": "2025-09-06T10:00:00Z"
    }
  ]
}
```

### Create Quote
```http
POST /api/quotes
```

**Request Body:**
```json
{
  "requestId": "uuid",
  "title": "Preventivo riparazione impianto",
  "description": "Dettaglio lavori",
  "validUntil": "2025-09-20T23:59:59Z",
  "items": [
    {
      "description": "Sostituzione interruttore",
      "quantity": 1,
      "unitPrice": 15000,
      "taxRate": 0.22
    },
    {
      "description": "Manodopera (2 ore)",
      "quantity": 2,
      "unitPrice": 5000,
      "taxRate": 0.22
    }
  ],
  "notes": "Garanzia 12 mesi",
  "termsAndConditions": "..."
}
```

### Accept Quote
```http
PUT /api/quotes/:id/accept
```

**Response:**
```json
{
  "success": true,
  "message": "Quote accepted successfully",
  "data": {
    "id": "uuid",
    "status": "ACCEPTED",
    "acceptedAt": "2025-09-06T11:00:00Z"
  }
}
```

### Reject Quote
```http
PUT /api/quotes/:id/reject
```

**Request Body:**
```json
{
  "reason": "Prezzo troppo alto"
}
```

---

## 📅 Scheduled Interventions

### Get Interventions for Request
```http
GET /api/scheduled-interventions/request/:requestId
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "requestId": "uuid",
      "professionalId": "uuid",
      "proposedDate": "2025-09-10T14:00:00Z",
      "confirmedDate": null,
      "status": "PROPOSED",
      "interventionNumber": 1,
      "description": "Prima visita diagnostica",
      "estimatedDuration": 60,
      "professional": {
        "id": "uuid",
        "firstName": "Mario",
        "lastName": "Rossi"
      }
    }
  ]
}
```

### Propose Interventions
```http
POST /api/scheduled-interventions
```

**Request Body:**
```json
{
  "requestId": "uuid",
  "interventions": [
    {
      "proposedDate": "2025-09-10T14:00:00Z",
      "description": "Prima visita",
      "estimatedDuration": 60
    },
    {
      "proposedDate": "2025-09-11T10:00:00Z",
      "description": "Intervento riparazione",
      "estimatedDuration": 120
    }
  ]
}
```

### Accept Intervention
```http
PUT /api/scheduled-interventions/:id/accept
```

### Reject Intervention
```http
PUT /api/scheduled-interventions/:id/reject
```

**Request Body:**
```json
{
  "rejectedReason": "Non disponibile in quella data"
}
```

---

## 🤖 AI Assistant

### Send Message to AI
```http
POST /api/ai/chat
```

**Request Body:**
```json
{
  "message": "Come posso riparare un interruttore?",
  "subcategoryId": "uuid",
  "context": {
    "requestId": "uuid"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Per riparare un interruttore...",
    "model": "gpt-3.5-turbo",
    "tokensUsed": 150,
    "sources": [
      {
        "documentId": "uuid",
        "title": "Manuale riparazioni elettriche",
        "relevance": 0.95
      }
    ]
  }
}
```

### Get AI Settings
```http
GET /api/ai/settings/:subcategoryId
```

### Update AI Settings
```http
PUT /api/ai/settings/:subcategoryId
```

**Request Body:**
```json
{
  "modelName": "gpt-4",
  "temperature": 0.7,
  "maxTokens": 2048,
  "systemPrompt": "...",
  "responseStyle": "technical",
  "detailLevel": "advanced"
}
```

---

## 🏥 Health & Monitoring (v2.0.0)

### Basic Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-09-06T10:30:00.000Z",
    "uptime": 86400,
    "version": "2.0.0",
    "checks": {
      "database": {
        "status": "healthy",
        "responseTime": "5ms"
      },
      "memory": {
        "status": "healthy",
        "usage": {
          "heapUsed": "128MB",
          "heapTotal": "256MB"
        }
      },
      "circuitBreakers": {
        "status": "healthy",
        "services": {
          "openai": { "state": "CLOSED", "failureCount": 0 },
          "stripe": { "state": "CLOSED", "failureCount": 0 },
          "googleMaps": { "state": "CLOSED", "failureCount": 0 },
          "email": { "state": "CLOSED", "failureCount": 0 }
        }
      }
    },
    "responseTime": "10ms"
  }
}
```

### Detailed Health Check
```http
GET /api/health/detailed
```

**Response:**
```json
{
  "success": true,
  "data": {
    "database": {
      "status": "healthy",
      "responseTime": "5ms",
      "connections": {
        "active": 10,
        "idle": 5,
        "total": 15
      }
    },
    "externalServices": {
      "circuitBreakers": { ... },
      "recommendations": {
        "openai": "Healthy",
        "stripe": "Healthy",
        "googleMaps": "Healthy",
        "email": "Healthy"
      }
    },
    "system": {
      "cpu": {
        "user": "15.2s",
        "system": "8.5s"
      },
      "memory": {
        "rss": "256MB",
        "heapUsed": "128MB",
        "heapTotal": "256MB",
        "external": "32MB"
      },
      "uptime": "24.5 hours",
      "nodeVersion": "v18.17.0",
      "platform": "linux"
    },
    "application": {
      "totalRequests": 1500,
      "totalUsers": 250,
      "activeRequests": 45,
      "environment": "production",
      "version": "2.0.0"
    },
    "security": {
      "rateLimiting": "enabled",
      "securityHeaders": "enabled",
      "compression": "enabled",
      "requestIdTracking": "enabled",
      "twoFactorAuth": "available"
    }
  }
}
```

### Readiness Probe
```http
GET /api/health/ready
```

**Response:**
```json
{
  "ready": true,
  "timestamp": "2025-09-06T10:30:00.000Z"
}
```

### Liveness Probe
```http
GET /api/health/live
```

**Response:**
```json
{
  "alive": true,
  "timestamp": "2025-09-06T10:30:00.000Z",
  "pid": 1234
}
```

---

## 🔔 Notifications

### Get User Notifications
```http
GET /api/notifications
```

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `unread` | boolean | Only unread | false |
| `type` | string | Filter by type | - |
| `limit` | number | Items to return | 20 |

### Mark as Read
```http
PUT /api/notifications/:id/read
```

### Mark All as Read
```http
PUT /api/notifications/read-all
```

### Delete Notification
```http
DELETE /api/notifications/:id
```

---

## 👤 User Management

### Get Current User
```http
GET /api/users/me
```

### Update Profile
```http
PUT /api/users/me
```

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+39 123 456 7890",
  "address": "Via Roma 1",
  "city": "Milano"
}
```

### Change Password
```http
PUT /api/users/me/password
```

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

### Upload Avatar
```http
POST /api/users/me/avatar
```

**Headers:**
```
Content-Type: multipart/form-data
```

---

## 📊 Admin Endpoints

### Get System Stats
```http
GET /api/admin/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 250,
      "clients": 200,
      "professionals": 45,
      "staff": 5
    },
    "requests": {
      "total": 1500,
      "pending": 45,
      "inProgress": 30,
      "completed": 1400
    },
    "revenue": {
      "total": 125000,
      "thisMonth": 15000,
      "lastMonth": 18000
    }
  }
}
```

### Get All Users
```http
GET /api/admin/users
```

### Update User Role
```http
PUT /api/admin/users/:id/role
```

**Request Body:**
```json
{
  "role": "PROFESSIONAL"
}
```

### Reset Circuit Breaker
```http
POST /api/admin/circuit-breaker/reset
```

**Request Body:**
```json
{
  "service": "openai"
}
```

---

## 🔒 Security Headers

All API responses include these security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(self)
X-Request-ID: uuid-v4
```

---

## ⚠️ Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `UNAUTHORIZED` | Missing or invalid token | 401 |
| `FORBIDDEN` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `VALIDATION_ERROR` | Invalid request data | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `CIRCUIT_BREAKER_OPEN` | Service temporarily unavailable | 503 |
| `INTERNAL_ERROR` | Server error | 500 |
| `SERVICE_UNAVAILABLE` | Service down | 503 |

---

## 📈 Rate Limiting

### Limits by Endpoint

| Endpoint Pattern | Limit | Window |
|-----------------|-------|--------|
| `/api/auth/*` | 5 requests | 15 minutes |
| `/api/*` | 100 requests | 15 minutes |
| `/api/ai/*` | 20 requests | 1 minute |
| `/api/admin/*` | 50 requests | 1 minute |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693996800
Retry-After: 900
```

---

## 🔄 WebSocket Events

### Connection
```javascript
const socket = io('wss://api.assistenza.lmtecnologie.it', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `notification` | Server → Client | New notification |
| `request:updated` | Server → Client | Request status changed |
| `quote:received` | Server → Client | New quote received |
| `chat:message` | Bidirectional | Chat message |
| `typing:start` | Client → Server | User started typing |
| `typing:stop` | Client → Server | User stopped typing |
| `presence:online` | Server → Client | User came online |
| `presence:offline` | Server → Client | User went offline |

### Example Usage
```javascript
// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Send chat message
socket.emit('chat:message', {
  requestId: 'uuid',
  message: 'Hello!'
});
```

---

## 📚 Additional Resources

- [Postman Collection](https://www.postman.com/assistenza-api)
- [OpenAPI Specification](./openapi.yaml)
- [GraphQL Schema](./schema.graphql) *(coming soon)*
- [SDK Documentation](./sdk/README.md)

---

**API Documentation v2.0.0**  
Last Updated: 6 Settembre 2025  
© 2025 LM Tecnologie - All Rights Reserved
