# 📋 Sistema Rapporti Professionali - Documentazione Completa

## 🎯 Panoramica del Sistema

Il **Sistema Rapporti Professionali** è un modulo avanzato integrato nella piattaforma di Richiesta Assistenza che permette ai professionisti di:

- 📝 **Gestire frasi ricorrenti** per compilare rapidamente i rapporti
- 📦 **Catalogare materiali** utilizzati negli interventi
- 📄 **Creare template personalizzati** per diversi tipi di intervento
- ⚙️ **Configurare impostazioni aziendali** e preferenze operative
- 📊 **Generare rapporti professionali** in formato PDF
- 💼 **Gestire la fatturazione** con numerazione automatica

## 🏗️ Architettura del Sistema

### Stack Tecnologico

#### Backend
- **Runtime**: Node.js con TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 
- **ORM**: Prisma (⚠️ NON Drizzle)
- **Autenticazione**: JWT con middleware `authenticate`
- **File Upload**: Multer
- **Logging**: Winston
- **Response Format**: ResponseFormatter (OBBLIGATORIO in tutte le routes)

#### Frontend
- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **State Management**: React Query v5 (NON Redux)
- **Routing**: React Router v6
- **UI Components**: Tailwind CSS + Shadcn/UI
- **Icons**: Heroicons (NON react-icons)
- **Forms**: React Hook Form con Zod validation

### Struttura Database

```
PostgreSQL Database
├── ProfessionalReportPhrase      # Frasi ricorrenti
├── ProfessionalMaterial          # Materiali personalizzati
├── ProfessionalReportTemplate    # Template rapporti
├── ProfessionalReportSettings    # Impostazioni professionista
├── ProfessionalReportFolder      # Cartelle organizzazione
├── InterventionReport            # Rapporti intervento
├── InterventionReportTemplate    # Template sistema
└── InterventionMaterial          # Database materiali globale
```

## 📁 Struttura del Progetto

```
richiesta-assistenza/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   └── professional/     # 🆕 Route API professionali
│   │   │       ├── index.ts
│   │   │       ├── phrases.routes.ts
│   │   │       ├── materials.routes.ts
│   │   │       ├── templates.routes.ts
│   │   │       └── settings.routes.ts
│   │   ├── services/
│   │   │   └── professional/     # Business logic (se necessaria)
│   │   ├── middleware/
│   │   │   └── auth.ts          # Middleware autenticazione
│   │   └── utils/
│   │       ├── responseFormatter.ts
│   │       └── logger.ts
│   ├── prisma/
│   │   └── schema.prisma        # 🆕 Aggiornato con nuovi modelli
│   └── uploads/
│       ├── logos/               # Logo aziendali
│       └── temp/                # File temporanei CSV
│
├── src/                         # Frontend React
│   ├── components/
│   │   └── professional/
│   │       └── reports/        # 🆕 Componenti rapporti
│   │           ├── PhrasesManager.tsx
│   │           ├── MaterialsManager.tsx
│   │           ├── TemplatesManager.tsx
│   │           └── SettingsManager.tsx
│   ├── pages/
│   │   └── professional/
│   │       └── reports/        # 🆕 Pagine rapporti
│   ├── services/
│   │   └── professional/
│   │       └── reports-api.ts  # 🆕 API client
│   └── hooks/
│       └── professional/
│           └── useReports.ts   # 🆕 React Query hooks
│
└── docs/                        # 🆕 Documentazione
    ├── API-REFERENCE.md
    ├── DATABASE-SCHEMA.md
    ├── SETUP-GUIDE.md
    └── USER-MANUAL.md
```

## 🗄️ Schema Database Dettagliato

### Tabella: ProfessionalReportPhrase

Gestisce le frasi ricorrenti utilizzate dai professionisti nei rapporti.

```prisma
model ProfessionalReportPhrase {
  id                String      @id @default(uuid())
  professionalId    String      // ID del professionista proprietario
  
  category          String      // Categoria: problema, soluzione, raccomandazione, nota
  code              String      // Codice univoco (es: P001, S002)
  title             String      // Titolo breve della frase
  content           String      @db.Text // Contenuto completo
  
  tags              Json?       // Tag per ricerca veloce ["elettrico", "urgente"]
  usageCount        Int         @default(0) // Contatore utilizzi
  lastUsedAt        DateTime?   // Ultimo utilizzo
  
  isActive          Boolean     @default(true)  // Soft delete
  isFavorite        Boolean     @default(false) // Preferito
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  professional      User        @relation(...)
  
  @@unique([professionalId, code])
  @@index([professionalId, category])
  @@index([isFavorite])
}
```

### Tabella: ProfessionalMaterial

Catalogo materiali personalizzato per ogni professionista.

```prisma
model ProfessionalMaterial {
  id                String      @id @default(uuid())
  professionalId    String      // ID del professionista
  baseMaterialId    String?     // Riferimento a materiale globale
  
  code              String      // Codice articolo
  name              String      // Nome materiale
  description       String?     @db.Text
  unit              String      @default("pz") // Unità di misura
  defaultQuantity   Float       @default(1)
  price             Decimal     @db.Decimal(10, 2) // Prezzo in euro
  vatRate           Float       @default(22) // Aliquota IVA %
  
  supplierName      String?     // Nome fornitore
  supplierCode      String?     // Codice fornitore
  notes             String?     @db.Text
  
  category          String?     // Categoria materiale
  isFavorite        Boolean     @default(false)
  usageCount        Int         @default(0)
  lastUsedAt        DateTime?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@unique([professionalId, code])
  @@index([professionalId, category])
  @@index([professionalId, isFavorite])
}
```

### Tabella: ProfessionalReportTemplate

Template personalizzati per la generazione rapporti.

```prisma
model ProfessionalReportTemplate {
  id                String      @id @default(uuid())
  professionalId    String
  baseTemplateId    String?     // Template di base sistema
  
  name              String      // Nome template
  description       String?     @db.Text
  isDefault         Boolean     @default(false)
  
  // Personalizzazioni
  customSettings    Json?       // Override impostazioni
  customFields      Json?       // Campi aggiuntivi
  customLayout      Json?       // Layout personalizzato
  
  isActive          Boolean     @default(true)
  usageCount        Int         @default(0)
  lastUsedAt        DateTime?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([professionalId])
  @@index([isActive])
  @@index([isDefault])
}
```

### Tabella: ProfessionalReportSettings

Impostazioni aziendali e preferenze operative.

```prisma
model ProfessionalReportSettings {
  id                String      @id @default(uuid())
  professionalId    String      @unique
  
  // Dati aziendali
  businessName      String?     // Ragione sociale
  businessLogo      String?     // Path logo
  businessAddress   String?     @db.Text
  businessPhone     String?
  businessEmail     String?
  businessWebsite   String?
  vatNumber         String?     // Partita IVA
  fiscalCode        String?     // Codice Fiscale
  reaNumber         String?     // Numero REA
  
  // Preferenze operative
  defaultTemplateId String?     // Template predefinito
  autoStartTimer    Boolean     @default(false)
  autoGpsLocation   Boolean     @default(false)
  autoWeather       Boolean     @default(false)
  
  // Preferenze compilazione
  quickPhrases      Boolean     @default(true)
  quickMaterials    Boolean     @default(true)
  showLastReports   Boolean     @default(true)
  defaultLanguage   String      @default("it")
  
  // Firma digitale
  signatureImage    String?     @db.Text // Base64 firma
  signatureName     String?     // Nome firmatario
  signatureTitle    String?     // Titolo/Qualifica
  
  // Notifiche
  notifyOnSign      Boolean     @default(true)
  notifyOnView      Boolean     @default(false)
  dailySummary      Boolean     @default(false)
  weeklyReport      Boolean     @default(false)
  
  // PDF
  pdfTemplate       String      @default("professional")
  includeTerms      Boolean     @default(false)
  termsText         String?     @db.Text
  includePrivacy    Boolean     @default(false)
  privacyText       String?     @db.Text
  
  // Fatturazione
  invoicePrefix     String      @default("FT")
  invoiceStartNumber Int        @default(1)
  currentInvoiceNumber Int      @default(0)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

## 🔌 API Reference Completa

### 🔐 Autenticazione

Tutte le API richiedono autenticazione JWT tramite header:
```
Authorization: Bearer <token>
```

Il middleware `authenticate` verifica il token e popola `req.user` con i dati utente.

---

### 📝 API Frasi Ricorrenti

#### GET /api/professional/phrases
Recupera tutte le frasi del professionista.

**Query Parameters:**
- `category` (string, optional): Filtra per categoria (problema|soluzione|raccomandazione|nota)
- `search` (string, optional): Ricerca nel titolo e contenuto
- `isFavorite` (boolean, optional): Filtra solo preferiti

**Response:**
```json
{
  "success": true,
  "message": "Frasi recuperate con successo",
  "data": [
    {
      "id": "uuid",
      "category": "problema",
      "code": "P001",
      "title": "Perdita tubazione",
      "content": "Rilevata perdita nella tubazione principale...",
      "tags": ["idraulico", "urgente"],
      "isFavorite": true,
      "usageCount": 15,
      "lastUsedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### GET /api/professional/phrases/:id
Recupera una singola frase.

**Response:**
```json
{
  "success": true,
  "message": "Frase recuperata con successo",
  "data": {
    "id": "uuid",
    "category": "problema",
    "code": "P001",
    "title": "Perdita tubazione",
    "content": "Rilevata perdita nella tubazione principale..."
  }
}
```

#### POST /api/professional/phrases
Crea una nuova frase.

**Request Body:**
```json
{
  "category": "problema",
  "title": "Cortocircuito impianto",
  "content": "Rilevato cortocircuito nel quadro elettrico principale...",
  "tags": ["elettrico", "sicurezza"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Frase creata con successo",
  "data": {
    "id": "uuid",
    "code": "P002",
    ...
  }
}
```

#### PUT /api/professional/phrases/:id
Aggiorna una frase esistente.

**Request Body:**
```json
{
  "title": "Nuovo titolo",
  "content": "Nuovo contenuto",
  "isFavorite": true
}
```

#### DELETE /api/professional/phrases/:id
Elimina una frase (soft delete).

**Response:**
```json
{
  "success": true,
  "message": "Frase eliminata con successo",
  "data": null
}
```

#### POST /api/professional/phrases/:id/toggle-favorite
Attiva/disattiva preferito.

#### POST /api/professional/phrases/:id/increment-usage
Incrementa il contatore di utilizzo.

---

### 📦 API Materiali

#### GET /api/professional/materials
Recupera tutti i materiali del professionista.

**Query Parameters:**
- `search` (string): Ricerca per nome, codice o descrizione
- `category` (string): Filtra per categoria
- `isFavorite` (boolean): Solo preferiti

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "MAT001",
      "name": "Tubo PVC 32mm",
      "description": "Tubo in PVC rigido diametro 32mm",
      "unit": "mt",
      "defaultQuantity": 1,
      "price": "5.50",
      "vatRate": 22,
      "category": "idraulica",
      "supplierName": "Idraulica Express",
      "isFavorite": true,
      "usageCount": 45
    }
  ]
}
```

#### POST /api/professional/materials
Crea un nuovo materiale.

**Request Body:**
```json
{
  "code": "MAT002",
  "name": "Cavo elettrico 2.5mm",
  "description": "Cavo elettrico sezione 2.5mm",
  "unit": "mt",
  "price": 2.30,
  "vatRate": 22,
  "category": "elettrico",
  "supplierName": "Elettroforniture SRL"
}
```

#### POST /api/professional/materials/import
Importa materiali da file CSV.

**Form Data:**
- `file`: File CSV con colonne: code, name, description, unit, price, vatRate, category, supplier

**CSV Format Example:**
```csv
code,name,description,unit,price,vatRate,category,supplier
MAT001,Tubo PVC,Tubo rigido,mt,5.50,22,idraulica,Fornitore1
MAT002,Cavo 2.5mm,Cavo elettrico,mt,2.30,22,elettrico,Fornitore2
```

**Response:**
```json
{
  "success": true,
  "message": "Importati 25 materiali",
  "data": {
    "imported": 25,
    "errors": []
  }
}
```

---

### 📄 API Template

#### GET /api/professional/templates
Recupera tutti i template del professionista.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Rapporto Intervento Idraulico",
      "description": "Template standard per interventi idraulici",
      "isDefault": true,
      "baseTemplateId": "system-template-id",
      "customSettings": {
        "includePhotos": true,
        "requireSignature": true
      },
      "usageCount": 120,
      "lastUsedAt": "2024-01-20T15:00:00Z"
    }
  ]
}
```

#### POST /api/professional/templates
Crea un nuovo template personalizzato.

**Request Body:**
```json
{
  "name": "Manutenzione Caldaia",
  "description": "Template per manutenzione ordinaria caldaie",
  "baseTemplateId": "uuid-template-base",
  "customSettings": {
    "sections": ["anagrafica", "intervento", "materiali", "note"],
    "requirePhotos": false
  },
  "customFields": [
    {
      "name": "matricola_caldaia",
      "label": "Matricola Caldaia",
      "type": "text",
      "required": true
    }
  ]
}
```

#### POST /api/professional/templates/:id/set-default
Imposta un template come predefinito.

#### POST /api/professional/templates/:id/clone
Clona un template esistente.

**Response:**
```json
{
  "success": true,
  "message": "Template clonato con successo",
  "data": {
    "id": "new-uuid",
    "name": "Manutenzione Caldaia (Copia)",
    ...
  }
}
```

---

### ⚙️ API Impostazioni

#### GET /api/professional/settings
Recupera le impostazioni del professionista.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "professionalId": "user-uuid",
    "businessName": "Mario Rossi Impianti",
    "businessLogo": "/uploads/logos/logo-123456.png",
    "businessAddress": "Via Roma 1, 00100 Roma",
    "businessPhone": "+39 06 1234567",
    "businessEmail": "info@rossiimpianti.it",
    "businessWebsite": "www.rossiimpianti.it",
    "vatNumber": "12345678901",
    "fiscalCode": "RSSMRA80A01H501Z",
    "reaNumber": "RM-123456",
    "autoStartTimer": true,
    "quickPhrases": true,
    "quickMaterials": true,
    "defaultLanguage": "it",
    "pdfTemplate": "professional",
    "notifyOnSign": true,
    "invoicePrefix": "FT",
    "currentInvoiceNumber": 45
  }
}
```

#### PUT /api/professional/settings
Aggiorna le impostazioni.

**Request Body:** (tutti i campi sono opzionali)
```json
{
  "businessName": "Nuovo Nome Azienda",
  "businessPhone": "+39 06 9876543",
  "autoStartTimer": false,
  "notifyOnSign": true
}
```

#### POST /api/professional/settings/logo
Carica il logo aziendale.

**Form Data:**
- `logo`: File immagine (JPEG, PNG, GIF, max 2MB)

**Response:**
```json
{
  "success": true,
  "message": "Logo caricato con successo",
  "data": {
    "url": "/uploads/logos/logo-1642248000000.png",
    "settings": { ... }
  }
}
```

#### DELETE /api/professional/settings/logo
Rimuove il logo aziendale.

#### POST /api/professional/settings/signature
Salva la firma digitale.

**Request Body:**
```json
{
  "signatureImage": "data:image/png;base64,iVBORw0KG...",
  "signatureName": "Mario Rossi",
  "signatureTitle": "Titolare"
}
```

#### GET /api/professional/settings/next-invoice-number
Ottiene il prossimo numero fattura formattato.

**Response:**
```json
{
  "success": true,
  "message": "Numero fattura generato",
  "data": {
    "number": 46,
    "formatted": "FT/2024/00046",
    "prefix": "FT",
    "year": 2024
  }
}
```

## 🚀 Guida all'Installazione

### Prerequisiti
- Node.js 18+
- PostgreSQL 14+
- npm o yarn

### 1. Clona il Repository
```bash
git clone https://github.com/yourusername/richiesta-assistenza.git
cd richiesta-assistenza
```

### 2. Installa le Dipendenze

```bash
# Backend
cd backend
npm install

# Frontend (dalla root)
cd ..
npm install
```

### 3. Configura le Variabili d'Ambiente

Crea un file `.env` nella cartella `backend`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/assistenza_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="30d"

# Server
PORT=3200
NODE_ENV=development

# Upload
UPLOAD_PATH="uploads"
MAX_FILE_SIZE=10485760

# Frontend URL
FRONTEND_URL="http://localhost:5193"
```

### 4. Aggiorna il Database

```bash
cd backend

# Push dello schema al database
npx prisma db push

# Genera il client Prisma
npx prisma generate

# (Opzionale) Seed dati di test
npx prisma db seed
```

### 5. Registra le Route nel Server

Modifica `backend/src/index.ts` o `backend/src/server.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { registerProfessionalReportRoutes } from './routes/professional';
// ... altri import

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5193',
  credentials: true
}));
app.use(express.json());

// ... altre configurazioni

// AGGIUNGI QUESTA RIGA per registrare le route
registerProfessionalReportRoutes(app);

// ... resto del codice
```

### 6. Abilita le API nel Frontend

Nel file `src/services/professional/reports-api.ts`, modifica:

```typescript
// CAMBIA DA:
const USE_REAL_API = false;

// A:
const USE_REAL_API = true;
```

### 7. Avvia l'Applicazione

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

L'applicazione sarà disponibile su:
- Frontend: http://localhost:5193
- Backend API: http://localhost:3200

## 🧪 Testing delle API

### Con cURL

```bash
# Login per ottenere il token
TOKEN=$(curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"professional@test.com","password":"password"}' \
  | jq -r '.data.token')

# Test API Frasi
curl http://localhost:3200/api/professional/phrases \
  -H "Authorization: Bearer $TOKEN"

# Crea nuova frase
curl -X POST http://localhost:3200/api/professional/phrases \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "problema",
    "title": "Test Frase",
    "content": "Contenuto di test"
  }'
```

### Con Postman

1. Importa la collection Postman (se disponibile)
2. Configura la variabile `{{token}}` dopo il login
3. Testa tutti gli endpoint

### Test Automatici

```bash
# Esegui i test
cd backend
npm test

# Con coverage
npm run test:coverage
```

## 📊 Dashboard Monitoraggio

### Metriche Chiave

- **Frasi più utilizzate**: Track `usageCount` e `lastUsedAt`
- **Materiali preferiti**: Filter per `isFavorite = true`
- **Template più usati**: Order by `usageCount`
- **Fatture generate**: Monitor `currentInvoiceNumber`

### Query Utili

```sql
-- Top 10 frasi più usate
SELECT title, category, usage_count 
FROM professional_report_phrase 
WHERE professional_id = ? 
ORDER BY usage_count DESC 
LIMIT 10;

-- Materiali più costosi
SELECT name, price, vat_rate 
FROM professional_material 
WHERE professional_id = ? 
ORDER BY price DESC 
LIMIT 20;

-- Template per categoria
SELECT t.name, COUNT(r.id) as usage
FROM professional_report_template t
LEFT JOIN intervention_report r ON r.template_id = t.id
WHERE t.professional_id = ?
GROUP BY t.id
ORDER BY usage DESC;
```

## 🔒 Sicurezza

### Best Practices Implementate

1. **Autenticazione JWT**: Token con scadenza configurabile
2. **Ownership Verification**: Ogni API verifica che i dati appartengano all'utente
3. **Input Validation**: Validazione di tutti gli input
4. **SQL Injection Prevention**: Uso di Prisma ORM con query parametrizzate
5. **File Upload Security**: 
   - Limite dimensione file (2MB logo, 5MB CSV)
   - Validazione tipo file
   - Nomi file randomizzati
6. **Soft Delete**: I dati non vengono mai eliminati fisicamente
7. **Rate Limiting**: (da implementare se necessario)
8. **CORS Configuration**: Solo origini autorizzate

### Headers di Sicurezza

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
```

## 🐛 Troubleshooting

### Problema: "ResponseFormatter is not defined"

**Soluzione**: Assicurati che il file `responseFormatter.ts` esista:

```typescript
// backend/src/utils/responseFormatter.ts
export class ResponseFormatter {
  static success(data: any, message: string = 'Success') {
    return {
      success: true,
      message,
      data
    };
  }

  static error(message: string, code: string = 'ERROR') {
    return {
      success: false,
      message,
      code,
      data: null
    };
  }
}
```

### Problema: "Cannot find module 'prisma'"

**Soluzione**:
```bash
cd backend
npx prisma generate
```

### Problema: "Authentication failed"

**Soluzione**: Verifica il middleware di autenticazione:

```typescript
// backend/src/middleware/auth.ts
export const authenticate = async (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json(ResponseFormatter.error('Token required', 'NO_TOKEN'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json(ResponseFormatter.error('Invalid token', 'INVALID_TOKEN'));
  }
};
```

### Problema: File upload non funziona

**Soluzione**: Crea le directory necessarie:
```bash
mkdir -p backend/uploads/logos
mkdir -p backend/uploads/temp
chmod 755 backend/uploads
```

## 📈 Roadmap Futura

### Fase 1 - Completamento Core (In Corso)
- ✅ API Frasi Ricorrenti
- ✅ API Materiali
- ✅ API Template
- ✅ API Impostazioni
- ⏳ UI Components React
- ⏳ Integrazione Frontend

### Fase 2 - Generazione Rapporti
- 🔲 Editor rapporti WYSIWYG
- 🔲 Generazione PDF
- 🔲 Firma digitale cliente
- 🔲 Invio email automatico

### Fase 3 - Features Avanzate
- 🔲 OCR per scansione documenti
- 🔲 Riconoscimento vocale
- 🔲 App mobile
- 🔲 Integrazione calendario
- 🔲 Statistiche avanzate

### Fase 4 - Integrazioni
- 🔲 Export verso software contabilità
- 🔲 Integrazione fatturazione elettronica
- 🔲 Backup automatici
- 🔲 Multi-lingua

## 👥 Team di Sviluppo

- **Lead Developer**: Luca Mambelli
- **Email**: lucamambelli@lmtecnologie.it
- **GitHub**: @241luca

## 📄 Licenza

Questo progetto è proprietario e confidenziale. Tutti i diritti riservati.

## 🆘 Supporto

Per supporto tecnico:
1. Consulta prima questa documentazione
2. Verifica la sezione Troubleshooting
3. Contatta il team di sviluppo

---

**Ultimo Aggiornamento**: Gennaio 2025
**Versione**: 1.0.0
**Status**: ✅ Produzione Ready
