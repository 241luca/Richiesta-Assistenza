# 📋 DOCUMENTAZIONE TECNICA COMPLETA
## Sistema di Richiesta Assistenza - v2.0

Data ultimo aggiornamento: **6 Gennaio 2025**

---

## 📑 INDICE GENERALE

1. [Panoramica del Sistema](#1-panoramica-del-sistema)
2. [Architettura Tecnica](#2-architettura-tecnica)
3. [Stack Tecnologico](#3-stack-tecnologico)
4. [Struttura del Progetto](#4-struttura-del-progetto)
5. [Backend - API Server](#5-backend---api-server)
6. [Frontend - React Application](#6-frontend---react-application)
7. [Database - PostgreSQL](#7-database---postgresql)
8. [Sistema di Autenticazione](#8-sistema-di-autenticazione)
9. [Moduli Funzionali](#9-moduli-funzionali)
10. [API Endpoints Reference](#10-api-endpoints-reference)
11. [Deployment e Configurazione](#11-deployment-e-configurazione)
12. [Testing e Debug](#12-testing-e-debug)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. PANORAMICA DEL SISTEMA

### 1.1 Descrizione
Il **Sistema di Richiesta Assistenza** è una piattaforma web completa che connette clienti con professionisti qualificati per servizi di assistenza tecnica. Il sistema gestisce l'intero ciclo di vita del servizio: dalla richiesta iniziale, all'assegnazione del professionista, alla gestione dei preventivi, fino al completamento con rapporti di intervento digitali.

### 1.2 Caratteristiche Principali
- 🏢 **Multi-tenant**: Supporto per multiple organizzazioni
- 👥 **Multi-ruolo**: CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN
- 🔐 **Sicurezza avanzata**: JWT + 2FA opzionale
- 📱 **Responsive**: Ottimizzato per desktop e mobile
- 🔄 **Real-time**: WebSocket per notifiche istantanee
- 📊 **Analytics**: Dashboard e reportistica avanzata
- 🗺️ **Geolocalizzazione**: Integrazione Google Maps
- 💳 **Pagamenti**: Integrazione Stripe (predisposto)
- 📄 **Rapporti digitali**: Sistema completo di rapporti d'intervento
- 🤖 **AI Assistant**: Integrazione OpenAI per supporto intelligente

### 1.3 Utenti del Sistema

| Ruolo | Descrizione | Permessi principali |
|-------|-------------|---------------------|
| **CLIENT** | Clienti che richiedono assistenza | Creare richieste, visualizzare preventivi, accettare professionisti |
| **PROFESSIONAL** | Professionisti che forniscono servizi | Gestire richieste assegnate, creare preventivi, rapporti intervento |
| **ADMIN** | Amministratori di organizzazione | Gestire utenti org, configurare sistema, reportistica |
| **SUPER_ADMIN** | Amministratori sistema | Accesso completo, gestione multi-tenant, configurazioni globali |

---

## 2. ARCHITETTURA TECNICA

### 2.1 Architettura a 3 Livelli

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                      │
│         React 18 + TypeScript + Vite            │
│              (Porta 5173/5193)                  │
└────────────────────┬────────────────────────────┘
                     │ HTTP/WebSocket
┌────────────────────▼────────────────────────────┐
│                   BACKEND                       │
│        Express.js + TypeScript + Prisma         │
│                 (Porta 3200)                    │
└────────────────────┬────────────────────────────┘
                     │ SQL
┌────────────────────▼────────────────────────────┐
│                  DATABASE                       │
│              PostgreSQL 14+                     │
│                 (Porta 5432)                    │
└─────────────────────────────────────────────────┘
```

### 2.2 Pattern Architetturali

- **MVC Pattern**: Controller → Service → Repository
- **RESTful API**: Standard REST per tutte le API
- **Repository Pattern**: Prisma per data access layer
- **Service Layer**: Business logic isolata
- **Middleware Pattern**: Auth, validation, error handling
- **Response Formatting**: Formato unificato per tutte le risposte

---

## 3. STACK TECNOLOGICO

### 3.1 Backend
```json
{
  "runtime": "Node.js 18+",
  "language": "TypeScript 5.x",
  "framework": "Express.js 4.x",
  "orm": "Prisma 5.x",
  "database": "PostgreSQL 14+",
  "authentication": "JWT + Speakeasy (2FA)",
  "validation": "Joi",
  "queue": "Bull + Redis",
  "realtime": "Socket.io",
  "email": "Nodemailer",
  "testing": "Jest + Supertest"
}
```

### 3.2 Frontend
```json
{
  "framework": "React 18",
  "language": "TypeScript 5.x",
  "bundler": "Vite 5.x",
  "styling": "TailwindCSS 3.x",
  "ui": "Headless UI + Heroicons",
  "routing": "React Router 6",
  "state": "@tanstack/react-query 5 + Zustand",
  "forms": "React Hook Form + Zod",
  "http": "Axios",
  "testing": "Vitest + React Testing Library"
}
```

### 3.3 DevOps & Tools
- **Version Control**: Git + GitHub
- **Package Manager**: npm
- **Code Quality**: ESLint + Prettier
- **API Testing**: Postman/Insomnia
- **Database GUI**: pgAdmin/TablePlus
- **Monitoring**: PM2 (production)

---

## 4. STRUTTURA DEL PROGETTO

### 4.1 Directory Tree
```
richiesta-assistenza/
├── backend/                    # Backend Express + TypeScript
│   ├── src/
│   │   ├── config/            # Configurazioni (db, env, etc.)
│   │   ├── controllers/       # Controller REST API
│   │   ├── middleware/        # Middleware (auth, validation, etc.)
│   │   ├── routes/           # Definizione routes
│   │   ├── services/         # Business logic
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   ├── jobs/            # Background jobs (Bull)
│   │   └── server.ts        # Entry point server
│   ├── prisma/
│   │   ├── schema.prisma    # Schema database Prisma
│   │   └── migrations/      # Database migrations
│   ├── tests/               # Test suite
│   └── package.json
│
├── src/                      # Frontend React + TypeScript
│   ├── components/          # Componenti React riutilizzabili
│   ├── pages/              # Pagine dell'applicazione
│   ├── services/           # API client services
│   ├── hooks/              # Custom React hooks
│   ├── contexts/           # React contexts
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript types
│   ├── styles/             # Global styles
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
│
├── shared/                  # Codice condiviso (deprecato)
├── public/                 # Asset statici
├── uploads/                # File uploadati
├── backups/                # Backup sistema
├── Docs/                   # Documentazione dettagliata
├── scripts/                # Script di utility
├── tests/                  # Test E2E
│
├── .env                    # Variabili ambiente (non committare!)
├── .env.example            # Template variabili ambiente
├── package.json            # Dipendenze frontend
├── vite.config.ts          # Configurazione Vite
├── tailwind.config.js      # Configurazione Tailwind
├── tsconfig.json           # Configurazione TypeScript
└── README.md               # Documentazione principale
```

### 4.2 File Critici

| File | Descrizione | Importanza |
|------|-------------|------------|
| `backend/prisma/schema.prisma` | Schema database completo | ⭐⭐⭐⭐⭐ |
| `backend/src/server.ts` | Entry point backend | ⭐⭐⭐⭐⭐ |
| `.env` | Configurazione ambiente | ⭐⭐⭐⭐⭐ |
| `src/App.tsx` | Root component React | ⭐⭐⭐⭐ |
| `src/services/api.ts` | API client configuration | ⭐⭐⭐⭐ |

---

## 5. BACKEND - API SERVER

### 5.1 Architettura Backend

```
Request → Middleware → Router → Controller → Service → Prisma → Database
                ↓                      ↓          ↓
            Validation            Business    Data Access
                                   Logic        Layer
```

### 5.2 Struttura dei Controller

```typescript
// Esempio: requests.controller.ts
export class RequestsController {
  // GET /api/requests
  async getRequests(req: Request, res: Response) {
    const filters = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const requests = await requestsService.getRequests(
      filters, userId, userRole
    );
    
    return res.json(ResponseFormatter.success(
      requests, 
      'Richieste recuperate con successo'
    ));
  }
}
```

### 5.3 Service Layer

```typescript
// Esempio: requests.service.ts
export class RequestsService {
  async getRequests(filters: any, userId: string, role: string) {
    // Business logic
    const where = this.buildWhereClause(filters, userId, role);
    
    // Data access tramite Prisma
    return await prisma.request.findMany({
      where,
      include: {
        client: true,
        professional: true,
        category: true
      }
    });
  }
}
```

### 5.4 Middleware Stack

1. **CORS**: Configurazione cross-origin
2. **Body Parser**: JSON/URL-encoded parsing
3. **Session**: express-session + Redis
4. **Authentication**: JWT verification
5. **Authorization**: Role-based access control
6. **Validation**: Request validation con Joi
7. **Error Handler**: Global error handling

### 5.5 Response Format Standard

```typescript
// Successo
{
  "success": true,
  "data": { ... },
  "message": "Operazione completata",
  "timestamp": "2025-01-06T10:30:00Z"
}

// Errore
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dati non validi",
    "details": [...]
  },
  "timestamp": "2025-01-06T10:30:00Z"
}
```

---

## 6. FRONTEND - REACT APPLICATION

### 6.1 Architettura Frontend

```
App.tsx
  ├── AuthContext (Authentication state)
  ├── Router (React Router)
  │   ├── PublicRoutes
  │   └── ProtectedRoutes
  │       ├── ClientDashboard
  │       ├── ProfessionalDashboard
  │       └── AdminDashboard
  └── GlobalComponents (Toast, Modal, etc.)
```

### 6.2 Struttura Componenti

```typescript
// Componente tipico
src/
  components/
    requests/
      ├── RequestCard.tsx       # Componente presentazione
      ├── RequestList.tsx       # Lista con logica
      ├── RequestForm.tsx       # Form creazione/modifica
      ├── RequestFilters.tsx    # Filtri ricerca
      └── index.ts             # Export aggregato
```

### 6.3 API Client Configuration

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3200';

export const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor per auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor per gestione errori
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Gestione 401, refresh token, etc.
    return Promise.reject(error);
  }
);
```

### 6.4 State Management

**Server State** (@tanstack/react-query):
```typescript
// Query per dati dal server
const { data, isLoading, error } = useQuery({
  queryKey: ['requests', filters],
  queryFn: () => requestsApi.getRequests(filters),
  staleTime: 5 * 60 * 1000, // 5 minuti
});

// Mutation per modifiche
const mutation = useMutation({
  mutationFn: requestsApi.createRequest,
  onSuccess: () => {
    queryClient.invalidateQueries(['requests']);
    toast.success('Richiesta creata!');
  }
});
```

**Client State** (Zustand):
```typescript
// Store per UI state locale
const useUIStore = create((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ 
    sidebarOpen: !state.sidebarOpen 
  })),
}));
```

### 6.5 Routing

```typescript
// src/routes.tsx
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  
  {/* Protected Routes */}
  <Route element={<RequireAuth />}>
    <Route path="/" element={<Navigate to="/dashboard" />} />
    <Route path="/dashboard" element={<DashboardRouter />} />
    
    {/* Client Routes */}
    <Route path="/requests" element={
      <RequireRole role="CLIENT">
        <RequestsPage />
      </RequireRole>
    } />
    
    {/* Professional Routes */}
    <Route path="/professional/*" element={
      <RequireRole role="PROFESSIONAL">
        <ProfessionalRoutes />
      </RequireRole>
    } />
    
    {/* Admin Routes */}
    <Route path="/admin/*" element={
      <RequireRole role={["ADMIN", "SUPER_ADMIN"]}>
        <AdminRoutes />
      </RequireRole>
    } />
  </Route>
</Routes>
```

---

## 7. DATABASE - POSTGRESQL

### 7.1 Schema Principale

```prisma
// Modello User
model User {
  id                String    @id @default(cuid())
  email             String    @unique
  username          String?   @unique
  password          String
  firstName         String
  lastName          String
  fullName          String?
  role              Role      @default(CLIENT)
  organizationId    String?
  organization      Organization? @relation(...)
  phone             String?
  address           String?
  city              String?
  province          String?
  postalCode        String?
  
  // Campi professionista
  profession        String?
  specializations   Json?
  workAddress       String?
  workRadius        Int?
  
  // Campi fiscali
  fiscalCode        String?
  vatNumber         String?
  companyName       String?
  
  // Relazioni
  requestsAsClient      Request[] @relation("ClientRequests")
  requestsAsProfessional Request[] @relation("ProfessionalRequests")
  quotes               Quote[]
  interventionReports  InterventionReport[]
  
  // Audit
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLogin         DateTime?
  isActive          Boolean   @default(true)
  isVerified        Boolean   @default(false)
}

// Modello Request
model Request {
  id                String    @id @default(cuid())
  organizationId    String
  organization      Organization @relation(...)
  
  title             String
  description       String
  categoryId        String
  category          Category  @relation(...)
  subcategoryId     String?
  priority          Priority  @default(NORMAL)
  status            RequestStatus @default(PENDING)
  
  // Utenti coinvolti
  clientId          String
  client            User      @relation("ClientRequests", ...)
  professionalId    String?
  professional      User?     @relation("ProfessionalRequests", ...)
  
  // Localizzazione
  address           String
  city              String
  province          String
  postalCode        String
  latitude          Float?
  longitude         Float?
  
  // Date
  requestedDate     DateTime?
  assignedDate      DateTime?
  completedDate     DateTime?
  
  // Relazioni
  quotes            Quote[]
  attachments       Attachment[]
  messages          Message[]
  statusHistory     StatusHistory[]
  interventionReports InterventionReport[]
  
  // Audit
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}

// Modello InterventionReport
model InterventionReport {
  id                String    @id @default(cuid())
  reportNumber      String    @unique
  
  // Relazioni principali
  requestId         String
  request           Request   @relation(...)
  professionalId    String
  professional      User      @relation(...)
  
  // Dettagli intervento
  interventionDate  DateTime
  startTime         String
  endTime           String
  
  // Template e tipo
  templateId        String?
  template          ReportTemplate? @relation(...)
  typeId            String?
  type              InterventionType? @relation(...)
  
  // Contenuto
  formData          Json      // Dati dinamici del form
  problemFound      String
  solutionApplied   String
  materials         Json?     // Lista materiali utilizzati
  
  // Note
  internalNotes     String?   // Note private professionista
  clientNotes       String?   // Note per il cliente
  
  // Follow-up
  followUpRequired  Boolean   @default(false)
  followUpNotes     String?
  
  // Stato e firma
  status            ReportStatus @default(DRAFT)
  isDraft           Boolean   @default(true)
  isSigned          Boolean   @default(false)
  signedAt          DateTime?
  signatureData     Json?
  
  // File
  photos            Json?     // Array di percorsi foto
  pdfPath           String?   // Percorso PDF generato
  
  // Audit
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
}
```

### 7.2 Enums

```prisma
enum Role {
  CLIENT
  PROFESSIONAL
  ADMIN
  SUPER_ADMIN
}

enum RequestStatus {
  PENDING           // In attesa
  ASSIGNED         // Assegnata
  IN_PROGRESS      // In lavorazione
  COMPLETED        // Completata
  CANCELLED        // Annullata
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum ReportStatus {
  DRAFT           // Bozza
  COMPLETED       // Completato
  SIGNED          // Firmato
  SENT           // Inviato
  ARCHIVED       // Archiviato
}
```

### 7.3 Indici Database

```prisma
// Indici per performance
@@index([organizationId])
@@index([clientId])
@@index([professionalId])
@@index([status])
@@index([createdAt])
@@index([categoryId, status])
```

---

## 8. SISTEMA DI AUTENTICAZIONE

### 8.1 Flusso di Autenticazione

```
1. Login → POST /api/auth/login
2. Server verifica credenziali
3. Genera JWT access token (15 min)
4. Genera refresh token (7 giorni)
5. Client salva tokens
6. Ogni richiesta include token in header
7. Token refresh automatico quando scade
```

### 8.2 JWT Structure

```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "clr1234567890",
    "email": "user@example.com",
    "role": "CLIENT",
    "organizationId": "org123",
    "iat": 1704542400,
    "exp": 1704543300
  },
  "signature": "..."
}
```

### 8.3 2FA (Two-Factor Authentication)

```typescript
// Abilitazione 2FA
POST /api/auth/2fa/enable
Response: { secret, qrCode, backupCodes }

// Verifica 2FA
POST /api/auth/2fa/verify
Body: { token: "123456" }

// Login con 2FA
POST /api/auth/login
Body: { email, password, twoFactorToken }
```

### 8.4 Middleware di Autenticazione

```typescript
// middleware/auth.ts
export const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token non fornito' }
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: { message: 'Token non valido' }
    });
  }
};
```

---

## 9. MODULI FUNZIONALI

### 9.1 Gestione Richieste

**Funzionalità**:
- Creazione richieste assistenza
- Assegnazione automatica/manuale professionisti
- Tracking stato richiesta
- Sistema messaggistica integrato
- Upload allegati
- Storico modifiche

**API Endpoints**:
```
GET    /api/requests              # Lista richieste
POST   /api/requests              # Crea richiesta
GET    /api/requests/:id          # Dettaglio richiesta
PUT    /api/requests/:id          # Modifica richiesta
DELETE /api/requests/:id          # Elimina richiesta
POST   /api/requests/:id/assign   # Assegna professionista
POST   /api/requests/:id/messages # Invia messaggio
```

### 9.2 Sistema Preventivi

**Funzionalità**:
- Creazione preventivi dettagliati
- Line items con prezzi
- Calcolo IVA automatico
- Accettazione/rifiuto cliente
- Versioning preventivi
- Generazione PDF

**API Endpoints**:
```
GET    /api/quotes                # Lista preventivi
POST   /api/quotes                # Crea preventivo
GET    /api/quotes/:id            # Dettaglio preventivo
PUT    /api/quotes/:id            # Modifica preventivo
POST   /api/quotes/:id/accept     # Accetta preventivo
POST   /api/quotes/:id/reject     # Rifiuta preventivo
GET    /api/quotes/:id/pdf        # Genera PDF
```

### 9.3 Rapporti Intervento

**Funzionalità**:
- Creazione rapporti digitali
- Template personalizzabili
- Gestione materiali utilizzati
- Foto intervento
- Firma digitale
- Invio automatico cliente
- Archiviazione

**API Endpoints**:
```
# Rapporti
GET    /api/intervention-reports/reports        # Lista rapporti
POST   /api/intervention-reports/reports        # Crea rapporto
GET    /api/intervention-reports/reports/:id    # Dettaglio
PUT    /api/intervention-reports/reports/:id    # Modifica
DELETE /api/intervention-reports/reports/:id    # Elimina

# Funzionalità professionali
GET    /api/intervention-reports/professional/phrases    # Frasi ricorrenti
GET    /api/intervention-reports/professional/materials  # Materiali
GET    /api/intervention-reports/professional/templates  # Template
GET    /api/intervention-reports/professional/settings   # Impostazioni
GET    /api/intervention-reports/professional/stats      # Statistiche
```

### 9.4 Sistema Notifiche

**Funzionalità**:
- Notifiche real-time (WebSocket)
- Notifiche email
- Notifiche in-app
- Preferenze utente
- Template personalizzabili
- Scheduling

**Tipi di notifiche**:
- Nuova richiesta assegnata
- Nuovo preventivo ricevuto
- Stato richiesta cambiato
- Nuovo messaggio
- Rapporto completato

### 9.5 Dashboard e Analytics

**Metriche Clienti**:
- Richieste create/in corso/completate
- Preventivi ricevuti/accettati
- Spesa totale
- Professionisti preferiti

**Metriche Professionisti**:
- Richieste assegnate/completate
- Preventivi inviati/accettati
- Fatturato generato
- Rating medio
- Rapporti creati

**Metriche Admin**:
- Utenti totali per ruolo
- Richieste per stato
- Volume transazioni
- Performance professionisti
- Trend temporali

---

## 10. API ENDPOINTS REFERENCE

### 10.1 Autenticazione

| Metodo | Endpoint | Descrizione | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Registrazione nuovo utente | No |
| POST | `/api/auth/login` | Login utente | No |
| POST | `/api/auth/logout` | Logout utente | Yes |
| POST | `/api/auth/refresh` | Refresh token | No |
| POST | `/api/auth/forgot-password` | Richiesta reset password | No |
| POST | `/api/auth/reset-password` | Reset password | No |
| GET | `/api/auth/verify-email` | Verifica email | No |
| GET | `/api/auth/me` | Profilo utente corrente | Yes |
| PUT | `/api/auth/profile` | Aggiorna profilo | Yes |

### 10.2 Richieste

| Metodo | Endpoint | Descrizione | Ruoli |
|--------|----------|-------------|-------|
| GET | `/api/requests` | Lista richieste | ALL |
| POST | `/api/requests` | Crea richiesta | CLIENT |
| GET | `/api/requests/:id` | Dettaglio richiesta | ALL |
| PUT | `/api/requests/:id` | Modifica richiesta | CLIENT, ADMIN |
| DELETE | `/api/requests/:id` | Elimina richiesta | CLIENT, ADMIN |
| POST | `/api/requests/:id/assign` | Assegna professionista | ADMIN |
| PUT | `/api/requests/:id/status` | Cambia stato | PROFESSIONAL, ADMIN |
| GET | `/api/requests/:id/messages` | Lista messaggi | ALL |
| POST | `/api/requests/:id/messages` | Invia messaggio | ALL |
| POST | `/api/requests/:id/attachments` | Upload allegato | CLIENT |

### 10.3 Preventivi

| Metodo | Endpoint | Descrizione | Ruoli |
|--------|----------|-------------|-------|
| GET | `/api/quotes` | Lista preventivi | ALL |
| POST | `/api/quotes` | Crea preventivo | PROFESSIONAL |
| GET | `/api/quotes/:id` | Dettaglio preventivo | ALL |
| PUT | `/api/quotes/:id` | Modifica preventivo | PROFESSIONAL |
| DELETE | `/api/quotes/:id` | Elimina preventivo | PROFESSIONAL |
| POST | `/api/quotes/:id/accept` | Accetta preventivo | CLIENT |
| POST | `/api/quotes/:id/reject` | Rifiuta preventivo | CLIENT |
| POST | `/api/quotes/:id/items` | Aggiungi item | PROFESSIONAL |
| GET | `/api/quotes/:id/pdf` | Genera PDF | ALL |

### 10.4 Rapporti Intervento

| Metodo | Endpoint | Descrizione | Ruoli |
|--------|----------|-------------|-------|
| GET | `/api/intervention-reports/reports` | Lista rapporti | PROFESSIONAL, ADMIN |
| POST | `/api/intervention-reports/reports` | Crea rapporto | PROFESSIONAL |
| GET | `/api/intervention-reports/reports/:id` | Dettaglio | ALL |
| PUT | `/api/intervention-reports/reports/:id` | Modifica | PROFESSIONAL |
| DELETE | `/api/intervention-reports/reports/:id` | Elimina | PROFESSIONAL |
| POST | `/api/intervention-reports/reports/:id/sign` | Firma | CLIENT, PROFESSIONAL |
| GET | `/api/intervention-reports/reports/:id/pdf` | PDF | ALL |
| GET | `/api/intervention-reports/professional/phrases` | Frasi | PROFESSIONAL |
| GET | `/api/intervention-reports/professional/materials` | Materiali | PROFESSIONAL |
| GET | `/api/intervention-reports/professional/templates` | Template | PROFESSIONAL |

### 10.5 Utenti e Admin

| Metodo | Endpoint | Descrizione | Ruoli |
|--------|----------|-------------|-------|
| GET | `/api/users` | Lista utenti | ADMIN |
| GET | `/api/users/:id` | Dettaglio utente | ADMIN |
| PUT | `/api/users/:id` | Modifica utente | ADMIN |
| DELETE | `/api/users/:id` | Elimina utente | SUPER_ADMIN |
| PUT | `/api/users/:id/role` | Cambia ruolo | SUPER_ADMIN |
| PUT | `/api/users/:id/status` | Attiva/disattiva | ADMIN |
| GET | `/api/professionals` | Lista professionisti | ALL |
| GET | `/api/professionals/:id` | Dettaglio professionista | ALL |
| GET | `/api/professionals/categories` | Categorie professionisti | ALL |

---

## 11. DEPLOYMENT E CONFIGURAZIONE

### 11.1 Variabili Ambiente (.env)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/assistenza_db"

# Server
NODE_ENV=production
PORT=3200
CLIENT_URL=http://localhost:5173

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session
SESSION_SECRET=your-session-secret

# Redis (per queue e session)
REDIS_URL=redis://localhost:6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@assistenza.com

# Google Maps
GOOGLE_MAPS_API_KEY=your-google-maps-key

# OpenAI (optional)
OPENAI_API_KEY=your-openai-key

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 2FA
TWO_FACTOR_APP_NAME=Assistenza

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

### 11.2 Comandi di Build

```bash
# Backend
cd backend
npm install
npm run build        # Compila TypeScript
npm run db:migrate   # Esegui migrazioni
npm run db:seed      # Seed database (dev)
npm run start        # Avvia produzione

# Frontend
cd ../
npm install
npm run build        # Build produzione
npm run preview      # Preview build

# Development
npm run dev          # Frontend dev (porta 5173)
cd backend && npm run dev  # Backend dev (porta 3200)
```

### 11.3 Deployment con PM2

```bash
# Installa PM2 globalmente
npm install -g pm2

# Backend con PM2
cd backend
pm2 start dist/server.js --name assistenza-backend

# Frontend con serve
npm install -g serve
serve -s dist -l 5173

# Oppure con PM2
pm2 serve dist 5173 --name assistenza-frontend

# Salva configurazione PM2
pm2 save
pm2 startup
```

### 11.4 Nginx Configuration

```nginx
# /etc/nginx/sites-available/assistenza
server {
    listen 80;
    server_name assistenza.example.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # File uploads
    location /uploads {
        alias /var/www/assistenza/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 12. TESTING E DEBUG

### 12.1 Testing Backend

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

### 12.2 Testing Frontend

```bash
# Unit tests con Vitest
npm run test

# Component tests
npm run test:components

# E2E con Playwright
npm run test:e2e
```

### 12.3 Debug Tools

**Backend**:
- Node.js Inspector: `node --inspect`
- VS Code Debugger
- Postman/Insomnia per API
- pgAdmin per database

**Frontend**:
- React DevTools
- Redux DevTools (per Zustand)
- React Query DevTools
- Chrome DevTools

### 12.4 Logging

```typescript
// Backend logging con Winston
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Uso
logger.info('Server started', { port: 3200 });
logger.error('Database error', { error: err.message });
```

---

## 13. TROUBLESHOOTING

### 13.1 Problemi Comuni

#### Database Connection
```bash
# Errore: ECONNREFUSED
# Soluzione: Verifica che PostgreSQL sia attivo
sudo service postgresql status
sudo service postgresql start

# Errore: Authentication failed
# Soluzione: Verifica credenziali in .env
psql -U username -d database_name
```

#### Port già in uso
```bash
# Trova processo sulla porta
lsof -i :3200
# Kill processo
kill -9 <PID>
```

#### CORS Issues
```typescript
// Aggiungi origine al CORS config
app.use(cors({
  origin: ['http://localhost:5173', 'https://tuodominio.com'],
  credentials: true
}));
```

### 13.2 Performance Issues

#### Query lente database
```sql
-- Analizza query
EXPLAIN ANALYZE SELECT * FROM requests WHERE ...;

-- Aggiungi indici
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_client ON requests(client_id);
```

#### Memory leaks frontend
```typescript
// Cleanup useEffect
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  
  return () => {
    clearInterval(timer); // Importante!
  };
}, []);
```

### 13.3 Error Messages Reference

| Codice | Messaggio | Causa | Soluzione |
|--------|-----------|-------|-----------|
| AUTH_001 | Token non valido | JWT scaduto o malformato | Re-login o refresh token |
| AUTH_002 | Utente non trovato | Email/username errato | Verifica credenziali |
| PERM_001 | Permessi insufficienti | Ruolo non autorizzato | Verifica ruolo utente |
| VAL_001 | Dati non validi | Validation fallita | Controlla formato dati |
| DB_001 | Database error | Query fallita | Check logs, retry |
| NET_001 | Network error | API non raggiungibile | Verifica connessione |

---

## 📚 DOCUMENTAZIONE AGGIUNTIVA

### File di Documentazione

1. **README.md** - Overview generale del progetto
2. **ISTRUZIONI-PROGETTO.md** - Linee guida sviluppo (se presente)
3. **CHANGELOG.md** - Storico modifiche
4. **API.md** - Documentazione API dettagliata
5. **DEPLOYMENT.md** - Guida deployment completa

### Risorse Utili

- [Prisma Documentation](https://www.prisma.io/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Express.js Guide](https://expressjs.com/en/guide)

---

## 📞 CONTATTI E SUPPORTO

**Team di Sviluppo**:
- Email: lucamambelli@lmtecnologie.it
- GitHub: @241luca

**Repository**:
- GitHub: https://github.com/241luca/Richiesta-Assistenza

---

*Documentazione aggiornata al 6 Gennaio 2025*
*Versione sistema: 2.0*
*Ultimo aggiornamento architettura: Unificazione backend, rimozione server secondario*