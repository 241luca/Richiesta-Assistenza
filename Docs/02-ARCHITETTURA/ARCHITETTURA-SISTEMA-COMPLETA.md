# 📐 ARCHITETTURA COMPLETA - SISTEMA RICHIESTA ASSISTENZA
**Versione**: 3.0.0  
**Data**: 6 Settembre 2025  
**Stato**: Production Ready

---

## 📋 INDICE COMPLETO

1. [Executive Summary](#1-executive-summary)
2. [Architettura High-Level](#2-architettura-high-level)
3. [Stack Tecnologico Dettagliato](#3-stack-tecnologico-dettagliato)
4. [Architettura Backend](#4-architettura-backend)
5. [Architettura Frontend](#5-architettura-frontend)
6. [Database Architecture](#6-database-architecture)
7. [Sistemi Core](#7-sistemi-core)
8. [Integrazioni Esterne](#8-integrazioni-esterne)
9. [Security Architecture](#9-security-architecture)
10. [Performance & Scalability](#10-performance--scalability)
11. [Deployment & DevOps](#11-deployment--devops)
12. [Monitoring & Logging](#12-monitoring--logging)
13. [Testing Strategy](#13-testing-strategy)
14. [Disaster Recovery](#14-disaster-recovery)
15. [Roadmap & Evolution](#15-roadmap--evolution)

---

## 1. EXECUTIVE SUMMARY

### 🎯 Scopo del Sistema
Il **Sistema di Richiesta Assistenza** è una piattaforma enterprise B2B2C che collega clienti finali con professionisti qualificati per servizi di assistenza tecnica (idraulica, elettricista, condizionamento, etc.).

### 🏗️ Architettura Generale
- **Tipo**: Monolitica modulare con servizi esterni
- **Pattern**: MVC con Service Layer
- **Database**: Single-tenant PostgreSQL
- **Deployment**: Container-ready (Docker/K8s)
- **Scalabilità**: Orizzontale per backend, verticale per DB

### 📊 Numeri Chiave
- **Utenti Supportati**: 100k+ concorrenti
- **Request/sec**: 1000+ RPS
- **Uptime Target**: 99.9%
- **Response Time**: <100ms (p95)
- **Database Size**: 100GB+ supportati

---

## 2. ARCHITETTURA HIGH-LEVEL

### 🏛️ Architettura a 3 Livelli

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │  React SPA  │  │ Mobile Web   │  │  Admin Panel    │   │
│  │  (Vite)     │  │  (Responsive)│  │  (React)        │   │
│  └─────────────┘  └──────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                        │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Express.js + TypeScript Server           │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  Routes → Middleware → Services → Repositories     │    │
│  ├────────────────────────────────────────────────────┤    │
│  │  Auth │ Requests │ Quotes │ AI │ Payments │ Maps  │    │
│  └────────────────────────────────────────────────────┘    │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐     │
│  │  WebSocket  │  │  Bull Queue  │  │  Cron Jobs    │     │
│  │  (Socket.io)│  │  (Redis)     │  │  (Scheduler)  │     │
│  └─────────────┘  └──────────────┘  └───────────────┘     │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐   │
│  │  PostgreSQL  │  │    Redis     │  │  File Storage  │   │
│  │  (Primary)   │  │  (Cache)     │  │  (Local/S3)    │   │
│  └──────────────┘  └──────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                         │
│  ┌─────────┐ ┌────────┐ ┌───────────┐ ┌──────────────┐   │
│  │ OpenAI  │ │ Stripe │ │Google Maps│ │Brevo (Email) │   │
│  └─────────┘ └────────┘ └───────────┘ └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Request Flow Completo

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant B as Backend
    participant D as Database
    participant E as External Services
    
    U->>F: Azione Utente
    F->>A: HTTP Request + JWT
    A->>A: Rate Limiting
    A->>A: Security Headers
    A->>B: Authenticated Request
    B->>B: Validation
    B->>D: Query/Update
    D-->>B: Result
    B->>E: External Call (if needed)
    E-->>B: Response
    B->>B: Format Response
    B-->>A: ResponseFormatter
    A-->>F: JSON Response
    F-->>U: UI Update
```

---

## 3. STACK TECNOLOGICO DETTAGLIATO

### 🎨 Frontend Stack

#### Core Technologies
```yaml
Framework: React 18.3.1
Build Tool: Vite 7.x (NOT Webpack/CRA)
Language: TypeScript 5.9.2
Routing: React Router v7
State Management:
  - Server State: TanStack Query v5 (NOT Redux)
  - Client State: Zustand v5 (NOT Redux)
  - Form State: React Hook Form v7
```

#### UI & Styling
```yaml
CSS Framework: TailwindCSS 3.4.x (NOT v4!)
Component Library: Custom + Shadcn/UI patterns
Icons: 
  - Primary: @heroicons/react v2
  - Secondary: lucide-react
  - NOT: react-icons, font-awesome
Animations: Framer Motion (optional)
Charts: Recharts
Maps: @react-google-maps/api
```

#### Development Tools
```yaml
Linting: ESLint v9
Formatting: Prettier v3
Testing: 
  - Unit: Vitest
  - E2E: Playwright
  - Component: React Testing Library
DevTools: React Query DevTools
```

### ⚙️ Backend Stack

#### Core Technologies
```yaml
Runtime: Node.js 18+ LTS
Framework: Express.js v5
Language: TypeScript 5.9.2
ORM: Prisma v6.15.0
Database: PostgreSQL 14+
```

#### Middleware & Security
```yaml
Authentication: JWT + Speakeasy 2FA
Authorization: Role-based (RBAC)
Security:
  - Helmet v8 (Headers)
  - CORS v2
  - Rate Limiting v8
  - Compression (Brotli/Gzip)
Session: Redis + connect-redis
File Upload: Multer v2
Validation: Zod v3 + express-validator v7
```

#### Services & Integrations
```yaml
Queue: Bull v4 + Redis
WebSocket: Socket.io v4
Scheduler: node-cron v4
Email: Nodemailer v7 + Brevo API
PDF: PDFKit v0.17
Images: Sharp v0.34
Payments: Stripe v18
AI: OpenAI v5
Maps: Google Maps Services JS
Logging: Winston v3
Monitoring: Custom health checks
```

### 🗄️ Data Layer

#### Primary Database
```yaml
Type: PostgreSQL 14+
ORM: Prisma
Migrations: Prisma Migrate
Seeding: Prisma Seed
Admin: Prisma Studio
Connection Pool: pg-pool (20 connections)
```

#### Cache Layer
```yaml
Type: Redis 7+
Client: ioredis v5
Use Cases:
  - Session storage
  - Queue management
  - Rate limiting
  - Temporary data
  - Circuit breaker state
```

#### File Storage
```yaml
Local: uploads/ directory
Cloud: S3-compatible (optional)
CDN: CloudFront (optional)
Image Processing: Sharp
Max File Size: 10MB
Supported Types: Images, PDFs, Documents
```

---

## 4. ARCHITETTURA BACKEND

### 📂 Struttura Directory Backend

```
backend/
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── migrations/           # Database migrations
│   └── seed.ts              # Seed data
│
├── src/
│   ├── server.ts            # Entry point
│   │
│   ├── config/              # Configuration
│   │   ├── database.ts      # DB config
│   │   ├── redis.ts         # Redis config
│   │   └── env.ts           # Environment vars
│   │
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # JWT authentication
│   │   ├── security.ts      # Security headers
│   │   ├── compression.ts   # Response compression
│   │   ├── requestId.ts     # Request tracking
│   │   ├── rateLimit.ts     # Rate limiting
│   │   └── errorHandler.ts  # Global error handler
│   │
│   ├── routes/              # API routes (Controllers)
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── request.routes.ts
│   │   ├── quote.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── ai.routes.ts
│   │   └── health.routes.ts
│   │
│   ├── services/            # Business logic
│   │   ├── auth.service.ts
│   │   ├── request.service.ts
│   │   ├── quote.service.ts
│   │   ├── notification.service.ts
│   │   ├── ai.service.ts
│   │   └── email.service.ts
│   │
│   ├── repositories/        # Data access layer
│   │   ├── user.repository.ts
│   │   ├── request.repository.ts
│   │   └── base.repository.ts
│   │
│   ├── utils/              # Utilities
│   │   ├── ResponseFormatter.ts  # CRITICAL!
│   │   ├── retryLogic.ts
│   │   ├── circuitBreaker.ts
│   │   └── logger.ts
│   │
│   ├── queues/             # Background jobs
│   │   ├── email.queue.ts
│   │   ├── notification.queue.ts
│   │   └── processor.ts
│   │
│   ├── websocket/          # Real-time
│   │   ├── server.ts
│   │   └── handlers.ts
│   │
│   └── types/              # TypeScript definitions
│       ├── express.d.ts
│       └── global.d.ts
```

### 🔧 Service Layer Architecture

#### Pattern: Repository + Service + Controller

```typescript
// Repository Layer - Data Access
class RequestRepository {
  async findById(id: string) {
    return prisma.assistanceRequest.findUnique({
      where: { id },
      include: { client: true, professional: true }
    });
  }
}

// Service Layer - Business Logic
class RequestService {
  constructor(private repo: RequestRepository) {}
  
  async getRequest(id: string) {
    const request = await this.repo.findById(id);
    if (!request) throw new NotFoundError();
    // Business logic here
    return request;
  }
}

// Controller Layer - HTTP Handling
router.get('/requests/:id', async (req, res) => {
  try {
    const data = await requestService.getRequest(req.params.id);
    // ALWAYS use ResponseFormatter in routes!
    return res.json(ResponseFormatter.success(data));
  } catch (error) {
    return res.status(500).json(
      ResponseFormatter.error('Failed', 'ERROR_CODE')
    );
  }
});
```

### 🚦 Middleware Pipeline

```typescript
// Order matters! Security → Auth → Business
app.use(helmet());              // 1. Security headers
app.use(compression());          // 2. Response compression
app.use(requestId());           // 3. Request tracking
app.use(cors());                // 4. CORS
app.use(rateLimit());           // 5. Rate limiting
app.use(express.json());        // 6. Body parsing
app.use(authenticate());        // 7. JWT verification
app.use(routes);                // 8. Business routes
app.use(errorHandler());        // 9. Error handling
```

---

## 5. ARCHITETTURA FRONTEND

### 📂 Struttura Directory Frontend

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Root component
│
├── components/              # Reusable components
│   ├── common/             # Shared components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── LoadingSpinner.tsx
│   │
│   ├── layout/             # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   │
│   └── features/           # Feature-specific
│       ├── requests/
│       ├── quotes/
│       └── dashboard/
│
├── pages/                  # Route pages
│   ├── Dashboard.tsx
│   ├── RequestList.tsx
│   ├── RequestDetail.tsx
│   └── Settings.tsx
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts
│   ├── useRequest.ts
│   └── useWebSocket.ts
│
├── services/               # API services
│   ├── api.ts             # Axios config
│   ├── auth.service.ts
│   └── request.service.ts
│
├── stores/                 # Zustand stores
│   ├── auth.store.ts
│   └── ui.store.ts
│
├── utils/                  # Utilities
│   ├── constants.ts
│   ├── formatters.ts
│   └── validators.ts
│
├── types/                  # TypeScript types
│   ├── user.types.ts
│   └── request.types.ts
│
└── styles/                 # Global styles
    └── globals.css         # Tailwind imports
```

### 🔄 Data Flow con React Query

```typescript
// API Service
const requestService = {
  getAll: (filters) => api.get('/requests', { params: filters }),
  getById: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data)
};

// React Query Hook
export function useRequests(filters) {
  return useQuery({
    queryKey: ['requests', filters],
    queryFn: () => requestService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
}

// Component Usage
function RequestList() {
  const { data, isLoading, error } = useRequests(filters);
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage />;
  
  return <RequestTable data={data} />;
}
```

### 🎨 Component Architecture

#### Atomic Design Pattern
```
Atoms → Molecules → Organisms → Templates → Pages

Atoms: Button, Input, Label
Molecules: FormField, Card, MenuItem
Organisms: Header, RequestForm, QuoteList
Templates: DashboardLayout, AuthLayout
Pages: Dashboard, RequestDetail, Settings
```

---

## 6. DATABASE ARCHITECTURE

### 🗄️ Schema Overview

#### Core Entities
```
User ←→ AssistanceRequest ←→ Quote
  ↓           ↓                ↓
Role      Category         Payment
  ↓           ↓                ↓
Permission Subcategory    Transaction
```

### 📊 Tabelle Principali

#### User Table
```sql
CREATE TABLE "User" (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  role ENUM('CLIENT','PROFESSIONAL','ADMIN','SUPER_ADMIN'),
  -- Professional fields
  profession VARCHAR,
  hourlyRate INTEGER,
  workRadius INTEGER,
  pricingData JSONB, -- Tariffe e scaglioni
  -- Audit
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP,
  lastLogin TIMESTAMP,
  isActive BOOLEAN DEFAULT true
);
```

#### AssistanceRequest Table
```sql
CREATE TABLE "AssistanceRequest" (
  id VARCHAR PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT NOT NULL,
  status ENUM('PENDING','ASSIGNED','IN_PROGRESS','COMPLETED','CANCELLED'),
  priority ENUM('LOW','MEDIUM','HIGH','URGENT'),
  clientId VARCHAR REFERENCES "User"(id),
  professionalId VARCHAR REFERENCES "User"(id),
  categoryId VARCHAR REFERENCES "Category"(id),
  -- Location
  address VARCHAR,
  latitude FLOAT,
  longitude FLOAT,
  -- Assignment tracking
  assignmentType ENUM('MANUAL','AUTOMATIC','SELF'),
  assignedBy VARCHAR,
  assignedAt TIMESTAMP,
  -- Dates
  requestedDate TIMESTAMP,
  scheduledDate TIMESTAMP,
  completedDate TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW()
);
```

#### Quote Table
```sql
CREATE TABLE "Quote" (
  id VARCHAR PRIMARY KEY,
  requestId VARCHAR REFERENCES "AssistanceRequest"(id),
  professionalId VARCHAR REFERENCES "User"(id),
  -- Pricing
  laborCost INTEGER NOT NULL, -- in cents
  materialCost INTEGER,
  travelCost INTEGER,
  totalAmount INTEGER NOT NULL,
  -- Details
  description TEXT,
  estimatedHours FLOAT,
  validUntil TIMESTAMP,
  -- Status
  status ENUM('DRAFT','SENT','VIEWED','ACCEPTED','REJECTED','EXPIRED'),
  isSelected BOOLEAN DEFAULT false,
  -- Versioning
  version INTEGER DEFAULT 1,
  parentQuoteId VARCHAR REFERENCES "Quote"(id),
  createdAt TIMESTAMP DEFAULT NOW()
);
```

### 🔐 Indici e Performance

```sql
-- Performance indexes
CREATE INDEX idx_request_status ON "AssistanceRequest"(status);
CREATE INDEX idx_request_client ON "AssistanceRequest"(clientId);
CREATE INDEX idx_request_professional ON "AssistanceRequest"(professionalId);
CREATE INDEX idx_quote_request ON "Quote"(requestId);
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_role ON "User"(role);

-- Composite indexes
CREATE INDEX idx_request_status_date ON "AssistanceRequest"(status, createdAt);
CREATE INDEX idx_quote_status_professional ON "Quote"(status, professionalId);
```

---

## 7. SISTEMI CORE

### 🔐 Sistema Autenticazione

#### JWT + 2FA Implementation
```typescript
// Login flow
1. Email/Password validation
2. Check 2FA enabled
3. If 2FA: Request TOTP code
4. Generate JWT token
5. Store refresh token
6. Return access + refresh tokens

// Token structure
{
  userId: string,
  email: string,
  role: string,
  iat: number,
  exp: number
}
```

#### Session Management
```yaml
Storage: Redis
TTL: 30 days (rolling)
Refresh: Automatic on activity
Concurrent Sessions: Allowed
Device Tracking: Implemented
```

### 📋 Sistema Richieste

#### Lifecycle States
```
PENDING → ASSIGNED → IN_PROGRESS → COMPLETED
           ↓            ↓            ↓
        CANCELLED   CANCELLED    CANCELLED
```

#### Assignment Logic
```typescript
// Auto-assignment algorithm
1. Find professionals in category
2. Filter by work radius
3. Sort by:
   - Distance (nearest first)
   - Rating (highest first)
   - Availability
   - Price (optional)
4. Notify top 3 professionals
5. First to accept gets assigned
```

### 💰 Sistema Preventivi

#### Quote Workflow
```
Create Draft → Send to Client → Client Views
     ↓              ↓               ↓
   Edit         Expire          Accept/Reject
     ↓                              ↓
  Version++                    Create Payment
```

#### Pricing Components
```typescript
interface QuotePrice {
  laborCost: number;      // Manodopera
  materialCost: number;   // Materiali
  travelCost: number;     // Trasferta (con scaglioni)
  supplements: {          // Supplementi
    weekend?: number;
    night?: number;
    urgent?: number;
  };
  discount?: number;      // Sconto
  tax: number;           // IVA
  total: number;         // Totale
}
```

### 🤖 Sistema AI

#### OpenAI Integration
```yaml
Models:
  - GPT-4: Complex queries, professional advice
  - GPT-3.5-turbo: General assistance, FAQs
Features:
  - Context-aware responses
  - Category-specific knowledge
  - Multi-language support
  - Token optimization
Rate Limiting:
  - 100 requests/user/day
  - 10 requests/minute
  - Circuit breaker protection
```

#### Knowledge Base
```typescript
// Document processing pipeline
1. Upload document (PDF, TXT, DOCX)
2. Extract text content
3. Split into chunks (500 tokens)
4. Generate embeddings
5. Store in vector DB
6. Enable semantic search
```

### 🔔 Sistema Notifiche

#### Multi-channel Delivery
```yaml
Channels:
  - WebSocket: Real-time in-app
  - Email: Transactional via Brevo
  - SMS: Optional via Twilio
  - Push: Mobile web notifications

Templates:
  - Welcome email
  - New request assigned
  - Quote received
  - Payment confirmed
  - Service completed
```

### 💳 Sistema Pagamenti

#### Stripe Integration
```yaml
Payment Methods:
  - Credit/Debit cards
  - SEPA Direct Debit
  - Bank transfers
  - Digital wallets

Features:
  - Deposit management
  - Split payments
  - Refunds
  - Invoicing
  - PCI compliance
```

---

## 8. INTEGRAZIONI ESTERNE

### 🤖 OpenAI API

```typescript
// Configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: {
    'X-Request-ID': requestId
  }
});

// Usage with retry logic
async function askAI(prompt: string) {
  return withRetry(
    () => openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    }),
    { maxAttempts: 3, backoff: 'exponential' }
  );
}
```

### 💳 Stripe API

```typescript
// Payment processing
async function processPayment(amount: number, customerId: string) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Convert to cents
    currency: 'eur',
    customer: customerId,
    metadata: { requestId, quoteId }
  });
  
  return paymentIntent.client_secret;
}
```

### 🗺️ Google Maps API

```typescript
// Distance calculation
async function calculateDistance(origin: string, destination: string) {
  const response = await googleMaps.distanceMatrix({
    origins: [origin],
    destinations: [destination],
    mode: 'driving',
    language: 'it',
    units: 'metric'
  });
  
  return {
    distance: response.data.rows[0].elements[0].distance,
    duration: response.data.rows[0].elements[0].duration
  };
}
```

### 📧 Brevo (SendinBlue) API

```typescript
// Email sending
async function sendEmail(to: string, templateId: number, params: any) {
  const email = {
    to: [{ email: to }],
    templateId: templateId,
    params: params,
    headers: {
      'X-Mailin-custom': requestId
    }
  };
  
  return await brevoApi.sendTransacEmail(email);
}
```

---

## 9. SECURITY ARCHITECTURE

### 🛡️ Security Layers

#### 1. Network Security
```yaml
WAF: CloudFlare (optional)
DDoS Protection: Rate limiting + CloudFlare
SSL/TLS: Let's Encrypt certificates
Firewall: iptables rules
Ports: Only 80/443 exposed
```

#### 2. Application Security
```yaml
Headers:
  - CSP: Content Security Policy
  - HSTS: HTTP Strict Transport Security
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block

Authentication:
  - JWT with RS256
  - 2FA with TOTP
  - Password: bcrypt (12 rounds)
  - Session timeout: 30 days

Authorization:
  - RBAC with permissions
  - Resource-based checks
  - API key for services
```

#### 3. Data Security
```yaml
Encryption:
  - At rest: PostgreSQL TDE
  - In transit: TLS 1.3
  - Passwords: bcrypt
  - Sensitive data: AES-256

PII Protection:
  - GDPR compliance
  - Data minimization
  - Right to deletion
  - Audit logging
```

### 🚨 Threat Mitigation

#### Common Attacks Prevention
```typescript
// SQL Injection - Prisma parameterized queries
const user = await prisma.user.findUnique({
  where: { email: sanitizedEmail } // Automatic escaping
});

// XSS - React automatic escaping + CSP
<div>{userInput}</div> // Automatically escaped

// CSRF - SameSite cookies + tokens
cookie: {
  sameSite: 'strict',
  secure: true,
  httpOnly: true
}

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP
  message: 'Too many requests'
});
```

---

## 10. PERFORMANCE & SCALABILITY

### ⚡ Performance Optimizations

#### Backend Optimizations
```yaml
Database:
  - Connection pooling (20 connections)
  - Query optimization with indexes
  - Prepared statements
  - Read replicas (future)

Caching:
  - Redis for sessions
  - Query result caching
  - Static asset caching
  - CDN for media files

Compression:
  - Brotli (primary)
  - Gzip (fallback)
  - 70-80% size reduction

Async Processing:
  - Bull queues for heavy tasks
  - Background job processing
  - Event-driven architecture
```

#### Frontend Optimizations
```yaml
Bundle:
  - Code splitting
  - Lazy loading
  - Tree shaking
  - Minification

React:
  - Virtual DOM
  - Memoization
  - Suspense boundaries
  - React Query caching

Assets:
  - Image optimization (WebP)
  - Font subsetting
  - CSS purging
  - Service workers
```

### 📈 Scalability Strategy

#### Horizontal Scaling
```yaml
Load Balancer: Nginx/HAProxy
Backend Instances: 2-10 nodes
WebSocket: Sticky sessions
Queue Workers: 1-5 instances
Database: Read replicas
```

#### Vertical Scaling
```yaml
Database: Up to 64 cores, 512GB RAM
Redis: Up to 16GB RAM
Backend: Up to 8 cores, 32GB RAM per instance
```

---

## 11. DEPLOYMENT & DEVOPS

### 🐳 Containerization

#### Docker Configuration
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 3200
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3200:3200"
    environment:
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - postgres
      - redis
  
  frontend:
    build: ./client
    ports:
      - "5193:80"
  
  postgres:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
```

### ☸️ Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: registry/backend:latest
        ports:
        - containerPort: 3200
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
```

### 🚀 CI/CD Pipeline

```yaml
# GitHub Actions
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: docker build -t app .
      - run: docker push registry/app
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: kubectl apply -f k8s/
```

---

## 12. MONITORING & LOGGING

### 📊 Monitoring Stack

#### Metrics Collection
```yaml
Application Metrics:
  - Response times
  - Error rates
  - Request volumes
  - Queue lengths
  - WebSocket connections

System Metrics:
  - CPU usage
  - Memory usage
  - Disk I/O
  - Network traffic
  - Database connections

Business Metrics:
  - User registrations
  - Requests created
  - Quotes accepted
  - Revenue generated
  - User engagement
```

#### Health Checks
```typescript
// Health check endpoints
GET /api/health          // Basic health
GET /api/health/ready    // Readiness probe
GET /api/health/live     // Liveness probe
GET /api/health/detailed // Full system status

// Response format
{
  status: 'healthy',
  uptime: 86400,
  version: '3.0.0',
  services: {
    database: 'connected',
    redis: 'connected',
    openai: 'operational',
    stripe: 'operational'
  }
}
```

### 📝 Logging Architecture

#### Winston Configuration
```typescript
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});
```

---

## 13. TESTING STRATEGY

### 🧪 Testing Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /    \ - Critical user flows
      /      \ - Payment processing
     /--------\ Integration Tests (30%)
    /          \ - API endpoints
   /            \ - Database operations
  /--------------\ Unit Tests (60%)
 /                \ - Business logic
/                  \ - Utilities
```

### Test Coverage Requirements
```yaml
Overall: > 80%
Critical Paths: > 95%
New Code: > 90%
```

### Testing Tools
```yaml
Backend:
  - Unit: Vitest
  - Integration: Supertest
  - E2E: Playwright
  - Load: K6

Frontend:
  - Unit: Vitest
  - Component: React Testing Library
  - E2E: Playwright
  - Visual: Chromatic (optional)
```

---

## 14. DISASTER RECOVERY

### 🔄 Backup Strategy

#### Database Backups
```yaml
Frequency:
  - Full: Daily at 2 AM
  - Incremental: Every 6 hours
  - Transaction logs: Continuous

Retention:
  - Daily: 7 days
  - Weekly: 4 weeks
  - Monthly: 12 months

Storage:
  - Primary: Same region
  - Secondary: Different region
  - Archive: Cold storage
```

#### Recovery Procedures
```yaml
RTO (Recovery Time Objective): 4 hours
RPO (Recovery Point Objective): 1 hour

Procedures:
  1. Database restore from backup
  2. Redis cache rebuild
  3. File storage sync
  4. DNS failover
  5. Health check validation
```

---

## 15. ROADMAP & EVOLUTION

### 📅 Q4 2025 - Current
- ✅ Single-tenant architecture
- ✅ Core functionality complete
- ✅ Security hardening
- ✅ Performance optimization

### 📅 Q1 2026 - Planned
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] API v2 with GraphQL
- [ ] Multi-language support (EN, ES, FR)

### 📅 Q2 2026 - Future
- [ ] Microservices migration
- [ ] Machine learning for matching
- [ ] Voice assistant integration
- [ ] Blockchain for contracts

### 📅 Q3 2026 - Vision
- [ ] International expansion
- [ ] B2B marketplace
- [ ] IoT integration
- [ ] Predictive maintenance

---

## 📚 APPENDICI

### A. Convenzioni di Codice

```typescript
// File naming
components: PascalCase.tsx
utilities: camelCase.ts
constants: UPPER_SNAKE_CASE.ts

// Variable naming
const userName: string
let isActive: boolean
const MAX_RETRIES = 3

// Function naming
function calculatePrice(): number
async function fetchUserData(): Promise<User>
const handleClick = () => void
```

### B. Comandi Utili

```bash
# Development
npm run dev           # Start development
npm run build        # Build production
npm test            # Run tests

# Database
npx prisma migrate dev    # Run migrations
npx prisma studio        # Open DB GUI
npx prisma db seed      # Seed data

# Docker
docker-compose up       # Start services
docker-compose down     # Stop services
docker logs -f backend  # View logs

# Production
pm2 start ecosystem.config.js  # Start with PM2
pm2 reload all               # Reload workers
pm2 monit                   # Monitor
```

### C. Environment Variables

```env
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/db
JWT_SECRET=minimum-32-characters
SESSION_SECRET=minimum-32-characters

# External Services
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_test_...
GOOGLE_MAPS_API_KEY=AIza...
BREVO_API_KEY=xkeysib-...

# Optional
REDIS_URL=redis://localhost:6379
SENTRY_DSN=https://...
```

---

**FINE DOCUMENTO**

Questo documento rappresenta l'architettura completa del Sistema di Richiesta Assistenza v3.0.0
Ultimo aggiornamento: 6 Settembre 2025
Mantenuto da: Team Sviluppo LM Tecnologie