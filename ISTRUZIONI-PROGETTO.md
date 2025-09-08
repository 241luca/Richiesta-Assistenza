# 📋 ISTRUZIONI-PROGETTO - Sistema Richiesta Assistenza v3.0

> ⚠️ **LEGGERE PRIMA DI INIZIARE QUALSIASI LAVORO**
> 
> Ultimo aggiornamento: 6 Settembre 2025
> 
> Questo documento contiene TUTTE le regole tecniche VINCOLANTI per lo sviluppo del progetto.

---

## 🚀 QUICK START (5 MINUTI)

### Setup Nuovo Developer
```bash
# 1. Clone e setup iniziale
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd richiesta-assistenza

# 2. Installa dipendenze
npm install
cd backend && npm install && cd ..

# 3. Setup database
cd backend
npx prisma generate
npx prisma db push
cd ..

# 4. Avvia il sistema
# Terminal 1
cd backend && npm run dev  # Backend su :3200

# Terminal 2
npm run dev                # Frontend su :5193

# 5. Verifica funzionamento
curl http://localhost:3200/api/health
# Browser: http://localhost:5193
```

### Comandi Essenziali
```bash
# Prima di iniziare a lavorare
./scripts/check-system.sh       # Verifica stato sistema

# Dopo modifiche
./scripts/validate-work.sh       # Valida il tuo lavoro

# Prima del commit
./scripts/pre-commit-check.sh    # Controlli obbligatori
```

---

## 📖 INDICE

1. [**🔴 LE 5 REGOLE D'ORO**](#-le-5-regole-doro) - MEMORIZZARE!
2. [**📋 Quick Reference Card**](#-quick-reference-card)
3. [**🏗️ Architettura Sistema**](#-architettura-sistema)
4. [**💻 Sviluppo**](#-sviluppo)
5. [**🗄️ Database Best Practices**](#-database-best-practices)
6. [**🔒 Security Checklist**](#-security-checklist) 
7. [**🧪 Testing Requirements**](#-testing-requirements)
8. [**⚡ Performance Guidelines**](#-performance-guidelines)
9. [**📦 Deployment**](#-deployment)
10. [**🔧 Troubleshooting**](#-troubleshooting)
11. [**📝 Templates**](#-templates)
12. [**🤖 Script Automazione**](#-script-automazione)
13. [**✅ Checklist Finale**](#-checklist-finale)

---

## 🔴 LE 5 REGOLE D'ORO

### 1️⃣ ResponseFormatter SEMPRE nelle Routes
```typescript
// ✅ SEMPRE
return res.json(ResponseFormatter.success(data, 'Success'));
return res.status(400).json(ResponseFormatter.error('Error', 'CODE'));

// ❌ MAI
res.json({ data });
```

### 2️⃣ React Query per TUTTE le API
```typescript
// ✅ SEMPRE
const { data } = useQuery({
  queryKey: ['items'],
  queryFn: () => api.get('/items')
});

// ❌ MAI
const data = await fetch('/api/items');
```

### 3️⃣ Relazioni Prisma con @relation
```prisma
// ✅ SEMPRE
client User @relation("ClientRequests", fields: [clientId], references: [id])

// ❌ MAI (nomi auto-generati)
User_AssistanceRequest_clientIdToUser User
```

### 4️⃣ Backup PRIMA di modifiche critiche
```bash
cp file.tsx file.backup-$(date +%Y%m%d-%H%M%S).tsx
```

### 5️⃣ Test PRIMA del commit
```bash
./scripts/pre-commit-check.sh  # OBBLIGATORIO!
```

---

## 📋 QUICK REFERENCE CARD

### Porte Sistema
- **Backend**: http://localhost:3200
- **Frontend**: http://localhost:5193
- **Database**: PostgreSQL (vedi .env)
- **Redis**: localhost:6379

### Comandi Frequenti
```bash
# Database
cd backend
npx prisma generate         # Rigenera client
npx prisma db push         # Applica schema
npx prisma studio          # GUI database

# TypeScript
npx tsc --noEmit          # Check errori

# Test
npm test                  # Run tests
npm run test:coverage     # Coverage report

# Build
npm run build            # Build production
```

### File Critici
```
/ISTRUZIONI-PROGETTO.md         # Questo file (regole)
/backend/prisma/schema.prisma   # Schema database
/backend/src/utils/responseFormatter.ts  # ResponseFormatter
/src/services/api.ts            # API client
/.env                          # Configurazioni
```

---

## 🏗️ ARCHITETTURA SISTEMA

### Stack Tecnologico Consolidato

#### Frontend
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "tailwindcss": "^3.4.0",  // ⚠️ NON v4!
  "@tanstack/react-query": "^5.x",
  "@heroicons/react": "^2.x",
  "vite": "^7.x",
  "typescript": "^5.x"
}
```

#### Backend
```json
{
  "express": "^4.x",
  "prisma": "@latest",
  "@prisma/client": "@latest",
  "jsonwebtoken": "^9.x",
  "bcrypt": "^5.x",
  "socket.io": "^4.x",
  "bull": "^4.x",
  "redis": "^4.x"
}
```

### Struttura Directory
```
richiesta-assistenza/
├── src/                      # Frontend React (⚠️ NON /frontend!)
│   ├── components/          # Componenti React
│   ├── pages/              # Pagine route
│   ├── contexts/           # React Contexts
│   ├── hooks/              # Custom hooks
│   ├── services/           # API services
│   └── types/              # TypeScript types
├── backend/                 # Backend Express
│   ├── src/
│   │   ├── routes/         # API endpoints (USANO ResponseFormatter)
│   │   ├── services/       # Business logic (NON usano ResponseFormatter)
│   │   ├── middleware/     # Express middleware
│   │   └── utils/          # Utilities
│   └── prisma/
│       └── schema.prisma   # Database schema
├── scripts/                # Script automazione
├── REPORT-SESSIONI-CLAUDE/ # Report obbligatori
└── uploads/                # File uploads
```

---

## 💻 SVILUPPO

### Pattern ResponseFormatter (CRITICO!)

#### ✅ CORRETTO - Nelle Routes
```typescript
// routes/users.routes.ts
router.get('/users', authenticate, async (req: any, res) => {
  try {
    const users = await userService.getAllUsers();
    return res.json(ResponseFormatter.success(users, 'Users retrieved'));
  } catch (error) {
    logger.error('Error:', error);
    return res.status(500).json(ResponseFormatter.error('Failed', 'FETCH_ERROR'));
  }
});
```

#### ❌ SBAGLIATO - Nei Services
```typescript
// services/user.service.ts
export async function getAllUsers() {
  return await prisma.user.findMany(); // ✅ Ritorna dati diretti
  // ❌ MAI: return ResponseFormatter.success(users)
}
```

### Pattern React Query

#### Query Pattern
```typescript
// ✅ CORRETTO
const { data, isLoading, error } = useQuery({
  queryKey: ['users', filters],
  queryFn: () => api.get('/users', { params: filters }),
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  retry: 3
});
```

#### Mutation Pattern
```typescript
// ✅ CORRETTO
const mutation = useMutation({
  mutationFn: (data) => api.post('/users', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    toast.success('User created!');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

### Pattern Prisma Relazioni

#### Schema con @relation
```prisma
model AssistanceRequest {
  id              String   @id @default(cuid())
  clientId        String
  professionalId  String?
  categoryId      String
  
  // ✅ Relazioni con nomi stabili
  client          User     @relation("ClientRequests", fields: [clientId], references: [id])
  professional    User?    @relation("ProfessionalRequests", fields: [professionalId], references: [id])
  category        Category @relation(fields: [categoryId], references: [id])
}

model User {
  id                   String @id @default(cuid())
  clientRequests       AssistanceRequest[] @relation("ClientRequests")
  professionalRequests AssistanceRequest[] @relation("ProfessionalRequests")
}
```

#### Query con Relazioni
```typescript
// ✅ CORRETTO - camelCase nelle query
const request = await prisma.assistanceRequest.findUnique({
  where: { id },
  include: {
    client: true,       // minuscolo
    professional: true, // minuscolo
    category: true,     // minuscolo
    _count: {          // ⚠️ ECCEZIONE: maiuscolo in _count
      select: {
        Quote: true     // Maiuscolo!
      }
    }
  }
});
```

### Error Handling Pattern

```typescript
// ✅ Pattern completo per routes
router.post('/endpoint', authenticate, validateRequest(schema), async (req, res) => {
  try {
    // Input validation con Zod
    const validatedData = schema.parse(req.body);
    
    // Business logic nel service
    const result = await service.process(validatedData);
    
    // Response con ResponseFormatter
    return res.json(ResponseFormatter.success(result, 'Operation successful'));
    
  } catch (error) {
    // Logging
    logger.error('Operation failed:', error);
    
    // Error response
    if (error instanceof z.ZodError) {
      return res.status(400).json(ResponseFormatter.error('Validation failed', 'VALIDATION_ERROR', error.errors));
    }
    
    if (error instanceof BusinessError) {
      return res.status(400).json(ResponseFormatter.error(error.message, error.code));
    }
    
    return res.status(500).json(ResponseFormatter.error('Internal server error', 'INTERNAL_ERROR'));
  }
});
```

---

## 🗄️ DATABASE BEST PRACTICES

### Query Optimization

#### ✅ DO: Specificare campi necessari
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    fullName: true
  }
});
```

#### ❌ DON'T: Caricare tutto
```typescript
const users = await prisma.user.findMany({
  include: {
    requests: true,
    quotes: true,
    messages: true,
    notifications: true
  }
});
```

### Pagination Pattern
```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 20;
const skip = (page - 1) * limit;

const [items, total] = await Promise.all([
  prisma.item.findMany({
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.item.count()
]);

return {
  data: items,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

### Transaction Pattern
```typescript
const result = await prisma.$transaction(async (tx) => {
  // 1. Create request
  const request = await tx.assistanceRequest.create({ data: requestData });
  
  // 2. Create notification
  await tx.notification.create({
    data: {
      userId: request.professionalId,
      title: 'New request',
      requestId: request.id
    }
  });
  
  // 3. Update user stats
  await tx.user.update({
    where: { id: request.clientId },
    data: { requestCount: { increment: 1 } }
  });
  
  return request;
});
```

### Migration Best Practices
```bash
# Sviluppo
npx prisma migrate dev --name descriptive_name

# Produzione
npx prisma migrate deploy

# Reset (SOLO sviluppo!)
npx prisma migrate reset
```

---

## 🔒 SECURITY CHECKLIST

### Pre-Deploy Security Checks

#### Authentication & Authorization
- [ ] JWT secret forte (min 32 caratteri)
- [ ] Refresh token implementato
- [ ] Rate limiting su login
- [ ] Account lockout dopo tentativi falliti
- [ ] Password policy (min 8 char, complessità)
- [ ] 2FA disponibile per admin

#### Input Validation
- [ ] Zod validation su TUTTI gli endpoint
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] XSS prevention (sanitizzazione input)
- [ ] File upload validation (tipo, dimensione)
- [ ] Path traversal prevention

#### Headers & CORS
- [ ] Helmet.js configurato
- [ ] CORS whitelist configurata
- [ ] CSP headers impostati
- [ ] HTTPS only cookies
- [ ] SameSite cookies

#### Environment & Config
- [ ] .env NON in repository
- [ ] Secrets in environment variables
- [ ] Production mode enabled
- [ ] Debug mode disabled
- [ ] Error messages generici in produzione

#### Data Protection
- [ ] Password hashing (bcrypt rounds >= 10)
- [ ] PII encryption at rest
- [ ] Secure session management
- [ ] Audit logging implementato
- [ ] GDPR compliance

### Security Headers Configuration
```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 🧪 TESTING REQUIREMENTS

### Coverage Minimo
- **Unit Tests**: 80% coverage
- **Integration Tests**: Tutti gli endpoint critici
- **E2E Tests**: Flow principali utente

### Test Structure
```typescript
// __tests__/services/user.service.test.ts
describe('UserService', () => {
  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const userData = {
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123'
      };

      const user = await userService.createUser(userData);

      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Hashed
    });

    it('should throw error for duplicate email', async () => {
      const userData = { email: 'test@example.com', ... };
      await userService.createUser(userData);

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Email already exists');
    });
  });
});
```

### API Testing Pattern
```typescript
// __tests__/routes/users.routes.test.ts
describe('GET /api/users', () => {
  it('should return users with ResponseFormatter', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('message');
  });
});
```

---

## ⚡ PERFORMANCE GUIDELINES

### Target Metrics
- **Page Load**: < 2 secondi
- **API Response**: < 200ms (p95)
- **Database Query**: < 50ms
- **Frontend Bundle**: < 500KB gzipped

### Optimization Checklist

#### Frontend
- [ ] Code splitting implementato
- [ ] Lazy loading per routes
- [ ] Images ottimizzate (WebP)
- [ ] Bundle analyzer eseguito
- [ ] React.memo per componenti pesanti
- [ ] Virtual scrolling per liste lunghe

#### Backend
- [ ] Database indexes ottimizzati
- [ ] Query N+1 risolte
- [ ] Redis caching implementato
- [ ] Pagination su liste
- [ ] Rate limiting configurato
- [ ] Compression abilitata

#### Database
- [ ] Indexes su campi di ricerca
- [ ] Composite indexes per query complesse
- [ ] Query EXPLAIN analizzate
- [ ] Connection pooling configurato
- [ ] Slow query log attivo

### Caching Strategy
```typescript
// Redis caching pattern
const CACHE_TTL = 300; // 5 minuti

async function getUserWithCache(userId: string) {
  const cacheKey = `user:${userId}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from DB
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  // Save to cache
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(user));
  
  return user;
}
```

---

## 📦 DEPLOYMENT

### Pre-Deployment Checklist

#### Code Quality
- [ ] TypeScript: 0 errori (`npx tsc --noEmit`)
- [ ] ESLint: 0 warnings
- [ ] Tests: 100% passing
- [ ] Coverage: > 80%
- [ ] Build: Successful

#### Configuration
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Redis configured
- [ ] SSL certificates valid
- [ ] Monitoring configured

#### Security
- [ ] Security checklist completed
- [ ] Penetration testing done
- [ ] OWASP top 10 reviewed
- [ ] Dependencies updated
- [ ] Secrets rotated

### Deployment Commands
```bash
# Build
npm run build
cd backend && npm run build

# Database
cd backend
npx prisma migrate deploy

# Start production
NODE_ENV=production npm start
```

---

## 🔧 TROUBLESHOOTING

### Problemi Comuni e Soluzioni

#### ResponseFormatter non usato
```bash
# Identificare routes senza ResponseFormatter
grep -L "ResponseFormatter" backend/src/routes/*.ts

# Verificare services che lo usano (errore)
grep -l "ResponseFormatter" backend/src/services/*.ts

# Soluzione: Aggiungere ResponseFormatter alle routes identificate
```

#### Errori TypeScript dopo modifica schema
```bash
# Soluzione
cd backend
npx prisma generate
npx tsc --noEmit
```

#### Relazioni Prisma non trovate
```bash
# Verificare schema
npx prisma db pull
git diff prisma/schema.prisma

# Rigenerare client
npx prisma generate

# Verificare query
grep -r "include:" backend/src/
```

#### Query Parameters Opzionali
```typescript
// ❌ PROBLEMA COMUNE
const filters = {
  isActive: req.query.isActive === 'true'  // Se undefined diventa false!
};

// ✅ SOLUZIONE
const filters: any = {};
if (req.query.isActive !== undefined) {
  filters.isActive = req.query.isActive === 'true';
}
```

#### Porta già in uso
```bash
# Trova processo
lsof -i :3200

# Kill processo
kill -9 [PID]

# O cambia porta in .env
PORT=3201
```

#### Database connection errors
```bash
# Verifica connessione
cd backend
npx prisma db pull

# Reset connessioni
npx prisma generate --force

# Verifica DATABASE_URL in .env
```

---

## 📝 TEMPLATES

### Template Nuovo Endpoint API
```typescript
// routes/[resource].routes.ts
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { [resource]Schema } from '../schemas/[resource].schema';
import * as [resource]Service from '../services/[resource].service';
import { ResponseFormatter } from '../utils/responseFormatter';
import logger from '../utils/logger';

const router = Router();

// GET /api/[resources]
router.get('/', authenticate, async (req, res) => {
  try {
    const filters = {
      // Parse query params
    };
    
    const result = await [resource]Service.getAll(filters);
    
    return res.json(ResponseFormatter.success(
      result,
      '[Resources] retrieved successfully'
    ));
  } catch (error) {
    logger.error('Error fetching [resources]:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to fetch [resources]',
      'FETCH_ERROR'
    ));
  }
});

// POST /api/[resources]
router.post('/', authenticate, validateRequest([resource]Schema), async (req, res) => {
  try {
    const result = await [resource]Service.create(req.body);
    
    return res.status(201).json(ResponseFormatter.success(
      result,
      '[Resource] created successfully'
    ));
  } catch (error) {
    logger.error('Error creating [resource]:', error);
    return res.status(500).json(ResponseFormatter.error(
      'Failed to create [resource]',
      'CREATE_ERROR'
    ));
  }
});

export default router;
```

### Template Nuovo Service
```typescript
// services/[resource].service.ts
import { prisma } from '../lib/prisma';
import { [Resource]CreateInput, [Resource]UpdateInput } from '../types';

export async function getAll(filters: any) {
  return await prisma.[resource].findMany({
    where: filters,
    orderBy: { createdAt: 'desc' }
  });
}

export async function getById(id: string) {
  const [resource] = await prisma.[resource].findUnique({
    where: { id }
  });
  
  if (![resource]) {
    throw new Error('[Resource] not found');
  }
  
  return [resource];
}

export async function create(data: [Resource]CreateInput) {
  return await prisma.[resource].create({ data });
}

export async function update(id: string, data: [Resource]UpdateInput) {
  return await prisma.[resource].update({
    where: { id },
    data
  });
}

export async function remove(id: string) {
  return await prisma.[resource].delete({
    where: { id }
  });
}
```

### Template React Component con Query
```tsx
// components/[Resource]List.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export function [Resource]List() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['[resources]'],
    queryFn: () => api.get('/[resources]'),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid gap-4">
      {data?.map((item) => (
        <div key={item.id} className="p-4 bg-white rounded-lg shadow">
          {/* Render item */}
        </div>
      ))}
    </div>
  );
}
```

---

## 🤖 SCRIPT AUTOMAZIONE

### pre-commit-check.sh
```bash
#!/bin/bash
# scripts/pre-commit-check.sh

echo "🔍 Pre-commit checks..."

# 1. TypeScript check
echo "📝 Checking TypeScript..."
cd backend && npx tsc --noEmit
if [ $? -ne 0 ]; then
  echo "❌ TypeScript errors found!"
  exit 1
fi
cd ..

# 2. ResponseFormatter check
echo "📝 Checking ResponseFormatter..."
SERVICES_WITH_RF=$(grep -r "ResponseFormatter" backend/src/services/ 2>/dev/null | wc -l)
if [ $SERVICES_WITH_RF -gt 0 ]; then
  echo "❌ ResponseFormatter found in services!"
  exit 1
fi

ROUTES_WITHOUT_RF=$(grep -r "res.json\|res.status" backend/src/routes/ 2>/dev/null | grep -v "ResponseFormatter" | wc -l)
if [ $ROUTES_WITHOUT_RF -gt 0 ]; then
  echo "❌ Routes without ResponseFormatter found!"
  exit 1
fi

# 3. Console.log check
echo "📝 Checking for console.log..."
CONSOLE_LOGS=$(grep -r "console.log" src/ backend/src/ --exclude-dir=node_modules 2>/dev/null | wc -l)
if [ $CONSOLE_LOGS -gt 0 ]; then
  echo "⚠️  Warning: console.log statements found"
fi

# 4. Tests
echo "📝 Running tests..."
npm test
if [ $? -ne 0 ]; then
  echo "❌ Tests failed!"
  exit 1
fi

# 5. Build check
echo "📝 Checking build..."
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ All checks passed! Ready to commit."
```

### check-system.sh
```bash
#!/bin/bash
# scripts/check-system.sh

echo "🔍 System check..."

# Check Node version
NODE_VERSION=$(node -v)
echo "Node: $NODE_VERSION"

# Check database
cd backend
npx prisma db pull > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database: Connected"
else
  echo "❌ Database: Not connected"
fi

# Check Redis
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Redis: Running"
else
  echo "⚠️  Redis: Not running"
fi

# Check ports
lsof -i :3200 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "⚠️  Port 3200: In use"
else
  echo "✅ Port 3200: Available"
fi

lsof -i :5193 > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "⚠️  Port 5193: In use"
else
  echo "✅ Port 5193: Available"
fi

echo "✅ System check complete"
```

---

## ✅ CHECKLIST FINALE

### Prima di OGNI Commit

#### Controlli Tecnici
- [ ] `npx tsc --noEmit` = 0 errori
- [ ] ResponseFormatter in TUTTE le routes
- [ ] ResponseFormatter NON nei services
- [ ] React Query per tutte le API calls
- [ ] Relazioni Prisma con @relation
- [ ] No console.log in produzione
- [ ] Tests passano tutti

#### Controlli Qualità
- [ ] Code review effettuata
- [ ] Documentazione aggiornata
- [ ] CHANGELOG.md aggiornato
- [ ] Comments per codice complesso
- [ ] Error handling appropriato

#### Controlli Performance
- [ ] Query database ottimizzate
- [ ] Nessun N+1 problem
- [ ] Pagination implementata
- [ ] Caching dove necessario

#### Controlli Security
- [ ] Input validation con Zod
- [ ] Authentication verificata
- [ ] Authorization controllata
- [ ] No sensitive data in logs
- [ ] Environment variables usate

#### Controlli Finali
- [ ] Build production successful
- [ ] No file .backup-* nel commit
- [ ] Git commit message descrittivo
- [ ] PR description completa
- [ ] Tests coverage > 80%

---

## 📞 CONTATTI

**Lead Developer**: Luca Mambelli
- Email: lucamambelli@lmtecnologie.it
- GitHub: @241luca

---

## 📅 CHANGELOG

### v3.0 - 6 Settembre 2025
- ✨ Aggiunto Quick Start section
- ✨ Aggiunto Quick Reference Card
- ✨ Aggiunte Database Best Practices
- ✨ Aggiunta Security Checklist
- ✨ Aggiunti Testing Requirements
- ✨ Aggiunte Performance Guidelines
- ✨ Aggiunti Templates pronti all'uso
- ✨ Aggiunti Script di automazione
- ✨ Riorganizzazione completa struttura
- 📝 Miglioramento troubleshooting section
- 🐛 Fix esempi codice

### v2.0 - 30 Agosto 2025
- Aggiunta enfasi su ResponseFormatter
- Aggiunti controlli automatici pre-commit
- Aggiunta funzionalità sottocategorie

### v1.0 - 28 Agosto 2025
- Prima versione completa

---

**REMINDER**: Questo documento è VINCOLANTE. Ogni deviazione deve essere approvata e documentata.

> 💡 **Pro Tip**: Salva questo file nei bookmark del browser per accesso rapido!
