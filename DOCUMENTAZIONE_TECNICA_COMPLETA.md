# 📚 Documentazione Tecnica Completa - Sistema Richiesta Assistenza v2.0.0

**Ultimo Aggiornamento**: 6 Settembre 2025  
**Versione Sistema**: 2.0.0  
**Status**: Production Ready

## 📑 Indice

1. [Architettura Sistema](#architettura-sistema)
2. [Stack Tecnologico](#stack-tecnologico)
3. [Database Schema](#database-schema)
4. [Security Implementation](#security-implementation)
5. [Performance Optimization](#performance-optimization)
6. [API Reference](#api-reference)
7. [Middleware Stack](#middleware-stack)
8. [Service Layer](#service-layer)
9. [Real-time Features](#real-time-features)
10. [External Integrations](#external-integrations)
11. [Monitoring & Health](#monitoring--health)
12. [Error Handling](#error-handling)
13. [Testing Strategy](#testing-strategy)
14. [Deployment](#deployment)
15. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architettura Sistema

### Overview Architetturale

Il sistema utilizza un'architettura **3-tier** con separazione netta tra presentazione, business logic e data layer:

```
┌─────────────────────────────────────────────────────────────┐
│                      Load Balancer                          │
│                    (Nginx/Cloudflare)                       │
└─────────────────┬───────────────────────┬──────────────────┘
                  │                       │
        ┌─────────▼─────────┐   ┌────────▼────────┐
        │   Frontend React  │   │   Mobile Apps    │
        │   (Port 5193)     │   │   (Future)       │
        └─────────┬─────────┘   └────────┬────────┘
                  │                       │
         ┌────────▼───────────────────────▼────────┐
         │          API Gateway (Express)          │
         │            (Port 3200)                  │
         │  ┌────────────────────────────────┐    │
         │  │    Middleware Pipeline         │    │
         │  │  ┌──────────────────────────┐  │    │
         │  │  │ Security Headers         │  │    │
         │  │  │ Compression              │  │    │
         │  │  │ Rate Limiting            │  │    │
         │  │  │ Request ID Tracking      │  │    │
         │  │  │ Authentication (JWT+2FA) │  │    │
         │  │  │ Authorization (RBAC)     │  │    │
         │  │  └──────────────────────────┘  │    │
         │  └────────────────────────────────┘    │
         └────────┬───────────────┬────────────────┘
                  │               │
    ┌─────────────▼────┐   ┌─────▼──────────────┐
    │  Service Layer   │   │  WebSocket Server  │
    │  (Business Logic)│   │  (Socket.io)       │
    └─────────┬────────┘   └────────────────────┘
              │
    ┌─────────▼────────────────────────────────┐
    │         Data Access Layer                │
    │  ┌─────────────┐  ┌─────────────────┐   │
    │  │ Prisma ORM  │  │  Redis Cache    │   │
    │  └──────┬──────┘  └─────────────────┘   │
    └─────────┼─────────────────────────────────┘
              │
    ┌─────────▼────────────────────────────────┐
    │         PostgreSQL Database              │
    └──────────────────────────────────────────┘
```

### Design Patterns Utilizzati

1. **Repository Pattern**: Data access abstraction via Prisma
2. **Service Pattern**: Business logic isolation
3. **Middleware Pipeline**: Request processing chain
4. **Circuit Breaker**: Fault tolerance per servizi esterni
5. **Retry Pattern**: Exponential backoff per resilienza
6. **Factory Pattern**: Creazione dinamica di services
7. **Singleton Pattern**: Database connection, logger
8. **Observer Pattern**: WebSocket event handling

---

## 💻 Stack Tecnologico

### Backend Stack

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **Node.js** | 18.x LTS | Runtime JavaScript |
| **TypeScript** | 5.x | Type safety |
| **Express.js** | 4.19.x | Web framework |
| **Prisma** | 6.15.0 | ORM & Query builder |
| **PostgreSQL** | 14+ | Database principale |
| **Redis** | 7.x | Cache & Queue |
| **Socket.io** | 4.x | WebSocket real-time |
| **Bull** | 4.x | Job queue processing |
| **JWT** | 9.x | Authentication tokens |
| **Speakeasy** | 2.x | 2FA implementation |
| **Helmet** | 7.x | Security headers |
| **Compression** | 1.x | Response compression |
| **Winston** | 3.x | Logging system |
| **Joi/Zod** | Latest | Schema validation |

### Frontend Stack

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **React** | 18.x | UI Framework |
| **TypeScript** | 5.x | Type safety |
| **Vite** | 5.x | Build tool |
| **TanStack Query** | v5 | Server state management |
| **Zustand** | 4.x | Client state management |
| **React Router** | v6 | Routing |
| **Tailwind CSS** | 3.x | Styling |
| **Shadcn/UI** | Latest | Component library |
| **Heroicons** | 2.x | Icons |
| **React Hook Form** | 7.x | Form handling |
| **Recharts** | 2.x | Charts & graphs |

### External Services

| Servizio | Provider | Utilizzo | Circuit Breaker |
|----------|----------|----------|-----------------|
| **AI/ML** | OpenAI | GPT-4/3.5-turbo | ✅ Enabled |
| **Payments** | Stripe | Payment processing | ✅ Enabled |
| **Maps** | Google Maps | Geocoding | ✅ Enabled |
| **Email** | Brevo | Transactional email | ✅ Enabled |
| **SMS** | Twilio | SMS notifications | ⚠️ Optional |
| **Storage** | AWS S3 | File storage | ⚠️ Optional |

---

## 🗄️ Database Schema

### Schema Overview

Il database utilizza PostgreSQL con Prisma ORM. Schema principale:

```prisma
// User Model - Multi-role support
model User {
  id                String   @id @default(uuid())
  email             String   @unique
  username          String   @unique
  password          String   // Bcrypt hashed
  firstName         String
  lastName          String
  role              Role     @default(CLIENT)
  
  // 2FA Fields
  twoFactorSecret   String?
  twoFactorEnabled  Boolean  @default(false)
  
  // Professional Fields
  profession        String?
  hourlyRate        Decimal? @db.Decimal(10, 2)
  
  // Relations
  clientRequests    AssistanceRequest[] @relation("ClientRequests")
  professionalRequests AssistanceRequest[] @relation("ProfessionalRequests")
  quotes            Quote[]
  notifications     Notification[]
  
  // Tracking
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  lastLoginAt       DateTime?
  
  @@index([email])
  @@index([role])
}

// Assistance Request Model
model AssistanceRequest {
  id              String   @id @default(uuid())
  title           String
  description     String   @db.Text
  category        String
  subcategoryId   String?
  priority        Priority @default(MEDIUM)
  status          RequestStatus @default(PENDING)
  
  // Location
  address         String
  city            String
  province        String
  postalCode      String
  latitude        Float?
  longitude       Float?
  
  // Relations
  clientId        String
  client          User     @relation("ClientRequests", fields: [clientId])
  professionalId  String?
  professional    User?    @relation("ProfessionalRequests", fields: [professionalId])
  
  // Scheduling
  requestedDate   DateTime?
  assignedDate    DateTime?
  completedDate   DateTime?
  
  // Relations
  quotes          Quote[]
  attachments     RequestAttachment[]
  updates         RequestUpdate[]
  scheduledInterventions ScheduledIntervention[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([status])
  @@index([clientId])
  @@index([professionalId])
}
```

### Database Indexes

Indexes ottimizzati per performance:

```sql
-- Performance critical indexes
CREATE INDEX idx_requests_status ON assistance_requests(status);
CREATE INDEX idx_requests_client ON assistance_requests(client_id);
CREATE INDEX idx_requests_professional ON assistance_requests(professional_id);
CREATE INDEX idx_requests_created ON assistance_requests(created_at DESC);
CREATE INDEX idx_quotes_request ON quotes(request_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Composite indexes for common queries
CREATE INDEX idx_requests_status_date ON assistance_requests(status, created_at DESC);
CREATE INDEX idx_quotes_status_request ON quotes(status, request_id);
```

---

## 🔒 Security Implementation

### Security Headers (v2.0.0)

Implementazione completa in `middleware/security.ts`:

#### Content Security Policy (CSP)

```typescript
contentSecurityPolicy: {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: [
      "'self'",
      "'unsafe-inline'", // Solo development
      "https://apis.google.com",
      "https://maps.googleapis.com"
    ],
    styleSrc: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com"
    ],
    imgSrc: ["'self'", "data:", "blob:", "https:"],
    connectSrc: [
      "'self'",
      "wss://localhost:*",
      "https://api.openai.com",
      "https://api.stripe.com"
    ],
    frameAncestors: ["'none'"], // Previene clickjacking
  }
}
```

#### HTTP Security Headers

```typescript
// HSTS - Force HTTPS
hsts: {
  maxAge: 31536000, // 1 anno
  includeSubDomains: true,
  preload: true
}

// Previene MIME sniffing
noSniff: true

// Blocca embedding in iframe
frameguard: { action: 'deny' }

// Protezione XSS legacy
xssFilter: true

// Referrer Policy
referrerPolicy: { policy: 'strict-origin-when-cross-origin' }

// Permissions Policy
permissionsPolicy: {
  camera: ['none'],
  microphone: ['none'],
  geolocation: ['self'],
  payment: ['self']
}
```

### Rate Limiting

```typescript
// General API rate limit
const generalLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // 100 richieste per IP
  standardHeaders: true,
  legacyHeaders: false
});

// Auth endpoints rate limit
const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Solo 5 tentativi login
  skipSuccessfulRequests: true
});

// API key rate limit
const apiKeyLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 60, // 60 richieste/minuto per API key
  keyGenerator: (req) => req.headers['x-api-key']
});
```

### Authentication & Authorization

#### JWT Configuration

```typescript
// JWT Token Structure
interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
  iat: number;
  exp: number;
}

// Token generation
const accessToken = jwt.sign(payload, JWT_SECRET, {
  expiresIn: '15m',
  issuer: 'assistenza-system',
  audience: 'assistenza-api'
});

const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
  expiresIn: '7d'
});
```

#### 2FA Implementation

```typescript
// Generate 2FA secret
const secret = speakeasy.generateSecret({
  name: 'Sistema Assistenza',
  issuer: 'LM Tecnologie',
  length: 32
});

// Verify TOTP token
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: userToken,
  window: 2 // Allow 2 time steps tolerance
});
```

### Security Monitoring

```typescript
// Pattern detection for attacks
const suspiciousPatterns = [
  /(\.\.|\/\/|\\\\)/,              // Path traversal
  /<script|javascript:|onerror=/i,  // XSS attempts
  /union.*select|select.*from/i,    // SQL injection
  /\${|`|\$\(/,                     // Template injection
  /%00|%0d|%0a/,                    // Null byte injection
];

// Log and block suspicious requests
if (detectSuspiciousPattern(req)) {
  logger.warn('Security threat detected', {
    ip: req.ip,
    path: req.path,
    pattern: detectedPattern,
    requestId: req.requestId
  });
  
  if (BLOCK_SUSPICIOUS) {
    return res.status(403).json({
      error: 'Forbidden'
    });
  }
}
```

---

## ⚡ Performance Optimization

### Response Compression (v2.0.0)

#### Brotli Configuration

```typescript
compression({
  brotli: {
    enabled: true,
    zlib: {
      params: {
        [zlib.constants.BROTLI_PARAM_QUALITY]: 6
      }
    }
  },
  level: 6, // Gzip fallback level
  threshold: 1024, // Min 1KB per compressione
  filter: (req, res) => {
    // Comprimi JSON, HTML, CSS, JS
    const contentType = res.getHeader('Content-Type');
    return /json|text|javascript|css/.test(contentType);
  }
})
```

#### Compression Metrics

| Content Type | Original Size | Compressed | Ratio |
|-------------|---------------|------------|-------|
| JSON API | 100 KB | 20 KB | -80% |
| HTML | 50 KB | 12 KB | -76% |
| JavaScript | 200 KB | 60 KB | -70% |
| CSS | 150 KB | 30 KB | -80% |

### Caching Strategy

#### Static Assets

```typescript
// Immutable assets with hash
app.use('/assets', express.static('public', {
  maxAge: '1y',
  immutable: true,
  etag: true
}));

// Dynamic content
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});
```

#### Redis Cache Layer

```typescript
// Cache configuration
const cacheConfig = {
  categories: 3600,      // 1 ora
  subcategories: 3600,   // 1 ora
  userProfile: 300,      // 5 minuti
  requestList: 60,       // 1 minuto
  quotes: 120            // 2 minuti
};

// Cache middleware
async function cacheMiddleware(req, res, next) {
  const key = `cache:${req.path}:${JSON.stringify(req.query)}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return res.json(JSON.parse(cached));
  }
  
  // Store original json method
  const originalJson = res.json;
  res.json = function(data) {
    redis.setex(key, getCacheTTL(req.path), JSON.stringify(data));
    return originalJson.call(this, data);
  };
  
  next();
}
```

### Database Query Optimization

```typescript
// Optimized query with selective loading
const requests = await prisma.assistanceRequest.findMany({
  where: { status: 'PENDING' },
  select: {
    id: true,
    title: true,
    priority: true,
    createdAt: true,
    client: {
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 20 // Pagination
});

// Use database views for complex queries
CREATE VIEW pending_requests_summary AS
SELECT 
  r.id,
  r.title,
  r.priority,
  r.created_at,
  u.full_name as client_name,
  COUNT(q.id) as quote_count
FROM assistance_requests r
JOIN users u ON r.client_id = u.id
LEFT JOIN quotes q ON r.id = q.request_id
WHERE r.status = 'PENDING'
GROUP BY r.id, u.full_name;
```

---

## 🔄 Circuit Breaker & Retry Logic (v2.0.0)

### Circuit Breaker Implementation

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private nextAttempt = 0;
  
  constructor(
    private name: string,
    private config: {
      failureThreshold: number;
      resetTimeout: number;
    }
  ) {}
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker OPEN for ${this.name}`);
      }
      this.state = 'HALF_OPEN';
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Service Configuration

| Service | Failure Threshold | Reset Timeout | Max Retries |
|---------|------------------|---------------|-------------|
| OpenAI | 5 | 60s | 3 |
| Stripe | 3 | 30s | 2 |
| Google Maps | 5 | 30s | 3 |
| Email | 10 | 120s | 5 |

### Retry Strategy

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig
): Promise<T> {
  let delay = config.initialDelay;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!shouldRetry(error) || attempt === config.maxRetries) {
        throw error;
      }
      
      await sleep(delay);
      delay = Math.min(delay * 2, config.maxDelay);
    }
  }
}
```

---

## 📡 Real-time Features

### WebSocket Implementation

```typescript
// Socket.io configuration
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Authentication middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId;
    socket.join(`user:${decoded.userId}`);
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});
```

### Real-time Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `notification` | Server → Client | New notification |
| `request:updated` | Server → Client | Request status change |
| `quote:received` | Server → Client | New quote |
| `chat:message` | Bidirectional | Chat message |
| `typing:start` | Client → Server | User typing |
| `presence:update` | Server → Client | User online status |

---

## 🔍 Monitoring & Health

### Health Check Endpoints

#### Basic Health Check
`GET /api/health`

```json
{
  "status": "healthy",
  "timestamp": "2025-09-06T10:30:00Z",
  "uptime": 86400,
  "version": "2.0.0",
  "checks": {
    "database": { "status": "healthy", "responseTime": "5ms" },
    "redis": { "status": "healthy", "responseTime": "1ms" },
    "circuitBreakers": {
      "openai": { "state": "CLOSED", "failureCount": 0 },
      "stripe": { "state": "CLOSED", "failureCount": 0 }
    }
  }
}
```

#### Detailed Health Check
`GET /api/health/detailed`

Includes:
- Database connection pool stats
- Memory usage details
- CPU utilization
- Request metrics
- Error rates
- Circuit breaker states
- Cache hit rates

### Logging Strategy

```typescript
// Winston configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'assistenza-api' },
  transports: [
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      maxSize: '20m',
      maxFiles: '7d'
    })
  ]
});
```

### Request ID Tracking

Every request gets a unique ID for end-to-end tracking:

```typescript
// Request: abc-123-def
[2025-09-06 10:30:00] [info] Incoming request {requestId: "abc-123-def", path: "/api/users"}
[2025-09-06 10:30:00] [info] Auth check passed {requestId: "abc-123-def", userId: "123"}
[2025-09-06 10:30:00] [info] Database query {requestId: "abc-123-def", query: "SELECT..."}
[2025-09-06 10:30:01] [info] Response sent {requestId: "abc-123-def", status: 200}
```

---

## 🧪 Testing Strategy

### Test Coverage Requirements

| Component | Required Coverage | Current |
|-----------|------------------|---------|
| Services | 80% | ✅ 85% |
| Controllers | 70% | ✅ 75% |
| Utils | 90% | ✅ 92% |
| Middleware | 80% | ✅ 82% |

### Test Types

#### Unit Tests
```typescript
describe('UserService', () => {
  it('should create user with hashed password', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      password: 'plain-password'
    });
    
    expect(user.password).not.toBe('plain-password');
    expect(await bcrypt.compare('plain-password', user.password)).toBe(true);
  });
});
```

#### Integration Tests
```typescript
describe('POST /api/auth/login', () => {
  it('should return JWT token for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.token).toMatch(/^eyJ/); // JWT format
  });
});
```

#### E2E Tests
```typescript
describe('Complete Request Flow', () => {
  it('should handle request from creation to completion', async () => {
    // 1. Create request
    const request = await createRequest(clientId, requestData);
    
    // 2. Assign professional
    await assignProfessional(request.id, professionalId);
    
    // 3. Create quote
    const quote = await createQuote(request.id, quoteData);
    
    // 4. Accept quote
    await acceptQuote(quote.id);
    
    // 5. Complete request
    await completeRequest(request.id);
    
    // Verify final state
    const finalRequest = await getRequest(request.id);
    expect(finalRequest.status).toBe('COMPLETED');
  });
});
```

---

## 🚀 Deployment

### Docker Configuration

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3200
CMD ["node", "dist/server.js"]
```

### Environment Configuration

#### Development
```env
NODE_ENV=development
DATABASE_URL=postgresql://dev:dev@localhost:5432/assistenza_dev
LOG_LEVEL=debug
```

#### Staging
```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging:pass@staging-db:5432/assistenza_staging
LOG_LEVEL=info
```

#### Production
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod:secure@prod-db:5432/assistenza
LOG_LEVEL=warn
SENTRY_DSN=https://...
```

### CI/CD Pipeline

```yaml
# GitHub Actions workflow
name: Deploy
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm test
      - run: npm run test:e2e

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: docker build -t assistenza:${{ github.sha }} .
      - run: docker push assistenza:${{ github.sha }}
      - run: kubectl set image deployment/api api=assistenza:${{ github.sha }}
```

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Check pool status
SELECT count(*) FROM pg_stat_activity WHERE datname = 'assistenza';

# Reset connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'assistenza' AND pid <> pg_backend_pid();
```

#### High Memory Usage
```bash
# Check Node.js memory
node --inspect server.js
# Open chrome://inspect

# Analyze heap dump
kill -USR2 $PID
# Creates heapdump file
```

#### Circuit Breaker Open
```typescript
// Check status
GET /api/health/detailed

// Manual reset
POST /api/admin/circuit-breaker/reset
{
  "service": "openai"
}
```

#### Rate Limiting Issues
```bash
# Check Redis for rate limit keys
redis-cli KEYS "rate:*"

# Clear specific IP
redis-cli DEL "rate:limit:192.168.1.1"

# Clear all rate limits
redis-cli --scan --pattern "rate:*" | xargs redis-cli DEL
```

### Performance Debugging

#### Slow Queries
```sql
-- Find slow queries
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Analyze query
EXPLAIN ANALYZE SELECT * FROM assistance_requests WHERE status = 'PENDING';
```

#### Memory Leaks
```javascript
// Add heap snapshot endpoint
app.get('/debug/heap', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    const v8 = require('v8');
    const snapshot = v8.writeHeapSnapshot();
    res.download(snapshot);
  }
});
```

---

## 📚 Additional Resources

### Documentation
- [API Documentation](./docs/API.md)
- [Database Schema](./prisma/schema.prisma)
- [Security Guidelines](./docs/SECURITY.md)
- [Contributing Guide](./CONTRIBUTING.md)

### External Links
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)

### Support
- **Email**: support@lmtecnologie.it
- **GitHub Issues**: [Report Issue](https://github.com/your-org/richiesta-assistenza/issues)
- **Documentation**: [Full Docs](https://docs.assistenza.lmtecnologie.it)

---

**Sistema Richiesta Assistenza v2.0.0** - Technical Documentation  
Last Updated: 6 Settembre 2025  
© 2025 LM Tecnologie - All Rights Reserved
