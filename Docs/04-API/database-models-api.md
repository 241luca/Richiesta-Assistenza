# 📊 Database Models & API Authorization

## 🗂️ Panoramica Modelli Database

Il sistema utilizza Prisma ORM con PostgreSQL e implementa un'architettura multi-tenant completa. Tutti i modelli principali hanno relazione con `Organization` per garantire l'isolamento dei dati.

---

## 📋 TABELLE AUTORIZZAZIONI PER RUOLO

### Legenda Permessi:
- ✅ **Full Access**: Accesso completo (CRUD)
- 📖 **Read Only**: Solo lettura
- 🚫 **No Access**: Nessun accesso
- 🔒 **Own Only**: Solo propri dati
- ⚙️ **Conditional**: Accesso condizionale

---

## 1️⃣ **ORGANIZATION**

### Schema
```prisma
model Organization {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  plan        String   @default("FREE")
  isActive    Boolean  @default(true)
  settings    Json?
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /organizations | ✅ | 📖 Own | 📖 Own | 📖 Own |
| GET /organizations/:id | ✅ | 📖 Own | 📖 Own | 📖 Own |
| POST /organizations | ✅ | 🚫 | 🚫 | 🚫 |
| PUT /organizations/:id | ✅ | ⚙️ Settings | 🚫 | 🚫 |
| DELETE /organizations/:id | ✅ | 🚫 | 🚫 | 🚫 |

---

## 2️⃣ **USER**

### Schema
```prisma
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  username          String?  @unique
  password          String
  role              Role     @default(CLIENT)
  firstName         String
  lastName          String
  phone             String?
  organizationId    String
  twoFactorEnabled  Boolean  @default(false)
  twoFactorSecret   String?
  isActive          Boolean  @default(true)
  emailVerified     Boolean  @default(false)
  lastLoginAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /users | ✅ | ✅ | 📖 List | 🚫 |
| GET /users/:id | ✅ | ✅ | 🔒 Own | 🔒 Own |
| GET /users/profile | ✅ | ✅ | ✅ | ✅ |
| POST /users | ✅ | ✅ | 🚫 | 🚫 |
| PUT /users/:id | ✅ | ✅ | 🔒 Own | 🔒 Own |
| DELETE /users/:id | ✅ | ✅ | 🚫 | 🚫 |
| POST /users/:id/2fa/setup | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |
| POST /users/:id/2fa/verify | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |

---

## 3️⃣ **ASSISTANCE REQUEST**

### Schema
```prisma
model AssistanceRequest {
  id                String   @id @default(uuid())
  title             String
  description       String
  status            RequestStatus @default(PENDING)
  priority          RequestPriority @default(MEDIUM)
  
  // Addresses
  address           String
  city              String
  province          String
  postalCode        String
  latitude          Float?
  longitude         Float?
  
  // Relations
  clientId          String
  professionalId    String?
  categoryId        String
  subcategoryId     String?
  organizationId    String
  
  // Dates
  requestedDate     DateTime?
  assignedDate      DateTime?
  completedDate     DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /requests | ✅ | ✅ | ⚙️ Assigned | 🔒 Own |
| GET /requests/:id | ✅ | ✅ | ⚙️ Assigned | 🔒 Own |
| POST /requests | ✅ | ✅ | 🚫 | ✅ |
| PUT /requests/:id | ✅ | ✅ | ⚙️ Status | 🔒 Pending |
| DELETE /requests/:id | ✅ | ✅ | 🚫 | 🔒 Pending |
| POST /requests/:id/assign | ✅ | ✅ | 🚫 | 🚫 |
| POST /requests/:id/complete | ✅ | ✅ | ⚙️ Assigned | 🚫 |
| POST /requests/:id/cancel | ✅ | ✅ | ⚙️ Assigned | 🔒 Own |

### Note:
- **PROFESSIONAL**: Può vedere/modificare solo richieste assegnate a lui
- **CLIENT**: Può modificare/cancellare solo richieste in stato PENDING

---

## 4️⃣ **QUOTE**

### Schema
```prisma
model Quote {
  id                String   @id @default(uuid())
  title             String
  description       String?
  totalAmount       Decimal  @db.Decimal(10, 2)
  status            QuoteStatus @default(DRAFT)
  validUntil        DateTime?
  
  // Relations
  requestId         String
  professionalId    String
  organizationId    String
  
  // Versioning
  version           Int      @default(1)
  parentQuoteId     String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /quotes | ✅ | ✅ | 🔒 Own | ⚙️ Not Draft |
| GET /quotes/:id | ✅ | ✅ | 🔒 Own | ⚙️ Not Draft |
| POST /quotes | ✅ | ✅ | ✅ | 🚫 |
| PUT /quotes/:id | ✅ | ✅ | 🔒 Own Draft | 🚫 |
| DELETE /quotes/:id | ✅ | ✅ | 🔒 Own Draft | 🚫 |
| POST /quotes/:id/accept | ✅ | ✅ | 🚫 | 🔒 Request Owner |
| POST /quotes/:id/reject | ✅ | ✅ | 🚫 | 🔒 Request Owner |
| POST /quotes/:id/send | ✅ | ✅ | 🔒 Own | 🚫 |
| GET /quotes/:id/pdf | ✅ | ✅ | 🔒 Own | ⚙️ Not Draft |

### Note:
- **CLIENT**: Non può vedere preventivi in stato DRAFT
- **PROFESSIONAL**: Può modificare solo propri preventivi in DRAFT

---

## 5️⃣ **CATEGORY & SUBCATEGORY**

### Schema
```prisma
model Category {
  id                String   @id @default(uuid())
  name              String
  slug              String   @unique
  description       String?
  icon              String?
  color             String   @default("#3B82F6")
  isActive          Boolean  @default(true)
  displayOrder      Int      @default(0)
  organizationId    String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Subcategory {
  id                String   @id @default(uuid())
  name              String
  slug              String
  description       String?
  categoryId        String
  requirements      String?
  isActive          Boolean  @default(true)
  displayOrder      Int      @default(0)
  organizationId    String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /categories | ✅ | ✅ | ✅ | ✅ |
| GET /categories/:id | ✅ | ✅ | ✅ | ✅ |
| POST /categories | ✅ | ✅ | 🚫 | 🚫 |
| PUT /categories/:id | ✅ | ✅ | 🚫 | 🚫 |
| DELETE /categories/:id | ✅ | ✅ | 🚫 | 🚫 |
| GET /subcategories | ✅ | ✅ | ✅ | ✅ |
| GET /subcategories/:id | ✅ | ✅ | ✅ | ✅ |
| POST /subcategories | ✅ | ✅ | 🚫 | 🚫 |
| PUT /subcategories/:id | ✅ | ✅ | 🚫 | 🚫 |
| DELETE /subcategories/:id | ✅ | ✅ | 🚫 | 🚫 |

---

## 6️⃣ **PAYMENT**

### Schema
```prisma
model Payment {
  id                String   @id @default(uuid())
  amount            Decimal  @db.Decimal(10, 2)
  currency          String   @default("EUR")
  status            PaymentStatus @default(PENDING)
  type              PaymentType
  method            String?
  
  // Stripe
  stripePaymentIntentId String? @unique
  stripeSessionId       String? @unique
  
  // Relations
  requestId         String?
  quoteId           String?
  userId            String
  organizationId    String
  
  metadata          Json?
  processedAt       DateTime?
  failedAt          DateTime?
  failureReason     String?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /payments | ✅ | ✅ | 🔒 Own | 🔒 Own |
| GET /payments/:id | ✅ | ✅ | 🔒 Own | 🔒 Own |
| POST /payments/intent | ✅ | ✅ | ✅ | ✅ |
| POST /payments/confirm | ✅ | ✅ | 🔒 Own | 🔒 Own |
| POST /payments/refund | ✅ | ✅ | 🚫 | 🚫 |
| GET /payments/invoice/:id | ✅ | ✅ | 🔒 Own | 🔒 Own |

---

## 7️⃣ **NOTIFICATION**

### Schema
```prisma
model Notification {
  id                String   @id @default(uuid())
  type              String
  title             String
  message           String
  isRead            Boolean  @default(false)
  priority          NotificationPriority @default(NORMAL)
  
  // Relations
  userId            String
  senderId          String?
  organizationId    String
  
  metadata          Json?
  readAt            DateTime?
  createdAt         DateTime @default(now())
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /notifications | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |
| GET /notifications/:id | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |
| POST /notifications | ✅ | ✅ | 🚫 | 🚫 |
| PUT /notifications/:id/read | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |
| DELETE /notifications/:id | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |
| POST /notifications/mark-all-read | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |

---

## 8️⃣ **MESSAGE**

### Schema
```prisma
model Message {
  id                String   @id @default(uuid())
  content           String
  isRead            Boolean  @default(false)
  
  // Relations
  senderId          String
  recipientId       String
  requestId         String?
  organizationId    String
  
  attachments       Json?
  readAt            DateTime?
  deletedAt         DateTime?
  createdAt         DateTime @default(now())
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /messages | ✅ | ✅ | 🔒 Own | 🔒 Own |
| GET /messages/:id | ✅ | ✅ | 🔒 Own | 🔒 Own |
| POST /messages | ✅ | ✅ | ✅ | ✅ |
| PUT /messages/:id | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |
| DELETE /messages/:id | ✅ | 🔒 Own | 🔒 Own | 🔒 Own |
| GET /messages/conversation/:userId | ✅ | ✅ | 🔒 Own | 🔒 Own |

---

## 9️⃣ **REQUEST ATTACHMENT**

### Schema
```prisma
model RequestAttachment {
  id                String   @id @default(uuid())
  fileName          String
  originalName      String
  filePath          String
  fileType          String
  fileSize          Int
  
  // Relations
  requestId         String
  uploadedById      String
  
  thumbnailPath     String?
  description       String?
  metadata          Json?
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /attachments/:id | ✅ | ✅ | ⚙️ Request | ⚙️ Request |
| POST /requests/:id/attachments | ✅ | ✅ | ⚙️ Assigned | 🔒 Own |
| DELETE /attachments/:id | ✅ | ✅ | 🔒 Uploader | 🔒 Uploader |
| GET /attachments/:id/download | ✅ | ✅ | ⚙️ Request | ⚙️ Request |

---

## 🔟 **DEPOSIT RULE**

### Schema
```prisma
model DepositRule {
  id                String   @id @default(uuid())
  name              String
  description       String?
  type              DepositType
  amount            Decimal? @db.Decimal(10, 2)
  percentage        Float?
  minQuoteAmount    Decimal? @db.Decimal(10, 2)
  maxQuoteAmount    Decimal? @db.Decimal(10, 2)
  
  // Relations
  categoryId        String?
  subcategoryId     String?
  
  isActive          Boolean  @default(true)
  isDefault         Boolean  @default(false)
  priority          Int      @default(0)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /deposit-rules | ✅ | ✅ | 📖 | 📖 |
| GET /deposit-rules/:id | ✅ | ✅ | 📖 | 📖 |
| POST /deposit-rules | ✅ | ✅ | 🚫 | 🚫 |
| PUT /deposit-rules/:id | ✅ | ✅ | 🚫 | 🚫 |
| DELETE /deposit-rules/:id | ✅ | ✅ | 🚫 | 🚫 |
| GET /deposit-rules/calculate | ✅ | ✅ | ✅ | ✅ |

---

## 1️⃣1️⃣ **SYSTEM SETTINGS**

### Schema
```prisma
model SystemSettings {
  id                String   @id @default(uuid())
  key               String   @unique
  value             Json
  description       String?
  category          String?
  isPublic          Boolean  @default(false)
  isEditable        Boolean  @default(true)
  
  updatedById       String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### 🔐 Autorizzazioni API

| Endpoint | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|----------|-------------|--------|--------------|--------|
| GET /settings | ✅ | ⚙️ Public | ⚙️ Public | ⚙️ Public |
| GET /settings/:key | ✅ | ⚙️ Public | ⚙️ Public | ⚙️ Public |
| PUT /settings/:key | ✅ | ⚙️ Editable | 🚫 | 🚫 |
| POST /settings | ✅ | 🚫 | 🚫 | 🚫 |
| DELETE /settings/:key | ✅ | 🚫 | 🚫 | 🚫 |

---

## 🔒 SICUREZZA E BEST PRACTICES

### Multi-Tenancy
- **Ogni query** deve includere `organizationId` nel WHERE clause
- **Nessuna eccezione** per endpoint pubblici (usare organization slug)
- **Validazione** organizationId su ogni richiesta

### Rate Limiting
```javascript
// Limiti per ruolo
const rateLimits = {
  SUPER_ADMIN: 1000,  // richieste/minuto
  ADMIN: 500,
  PROFESSIONAL: 200,
  CLIENT: 100
};
```

### Validazione Input
- **Zod** per validazione schema su tutti gli endpoint
- **Sanitizzazione** HTML per campi di testo
- **File upload** limitato a tipi specifici e dimensioni

### Audit Trail
Tutti gli endpoint critici loggano:
- User ID
- Organization ID
- Action performed
- IP Address
- User Agent
- Timestamp

### Error Handling
```javascript
// Struttura standard errori
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Quote not found",
    "details": {
      "quoteId": "uuid-here"
    }
  },
  "timestamp": "2025-08-24T10:00:00Z",
  "path": "/api/quotes/uuid-here"
}
```

---

## 📚 RISORSE AGGIUNTIVE

### Documentazione Correlata
- [Authentication Flow](./auth-api.md)
- [WebSocket Events](./websocket-events.md)
- [Error Codes Reference](./error-codes.md)
- [Rate Limiting Guide](./rate-limiting.md)

### Testing Endpoints
Utilizzare i seguenti tools per testing:
- **Postman Collection**: `/tests/postman/`
- **Thunder Client**: `/tests/thunder/`
- **Jest Tests**: `/backend/tests/api/`

### Monitoring
- **Health Check**: `GET /health`
- **Metrics**: `GET /metrics` (Prometheus format)
- **Status Page**: `GET /status`

---

*Documentazione generata il 24/08/2025*  
*Versione API: v2.0*  
*Ultimo aggiornamento: Sistema Preventivi con sicurezza DRAFT*
