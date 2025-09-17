# API Categorie e Sottocategorie

## Endpoints Sottocategorie

### GET /api/subcategories
Recupera tutte le sottocategorie con filtri opzionali.

**Query Parameters:**
- `categoryId` (string, optional): Filtra per categoria
- `isActive` (boolean, optional): Filtra per stato attivo/inattivo
- `includeAiSettings` (boolean, optional): Include le impostazioni AI

**Response:**
```json
{
  "subcategories": [
    {
      "id": "uuid",
      "name": "Riparazione perdite",
      "slug": "riparazione-perdite",
      "description": "Riparazione perdite rubinetti, tubi e impianti",
      "color": "#DBEAFE",
      "textColor": "#1E40AF",
      "isActive": true,
      "displayOrder": 0,
      "category": {
        "id": "uuid",
        "name": "Idraulica",
        "slug": "idraulica",
        "color": "#3B82F6"
      },
      "_count": {
        "professionals": 5,
        "assistanceRequests": 12
      },
      "aiSettings": {
        "modelName": "gpt-3.5-turbo",
        "temperature": 0.7,
        "responseStyle": "FORMAL",
        "detailLevel": "INTERMEDIATE"
      }
    }
  ]
}
```

### GET /api/subcategories/:id
Recupera una sottocategoria specifica.

**Response:**
```json
{
  "subcategory": {
    "id": "uuid",
    "name": "Riparazione perdite",
    "slug": "riparazione-perdite",
    "description": "Riparazione perdite rubinetti, tubi e impianti",
    "requirements": "Esperienza comprovata nel settore",
    "color": "#DBEAFE",
    "textColor": "#1E40AF",
    "isActive": true,
    "displayOrder": 0,
    "category": { ... },
    "aiSettings": { ... }
  }
}
```

### POST /api/subcategories
Crea una nuova sottocategoria (solo admin).

**Request Body:**
```json
{
  "name": "Riparazione perdite",
  "slug": "riparazione-perdite",
  "description": "Riparazione perdite rubinetti, tubi e impianti",
  "categoryId": "uuid",
  "requirements": "Esperienza comprovata nel settore",
  "color": "#DBEAFE",
  "textColor": "#1E40AF",
  "isActive": true,
  "displayOrder": 0
}
```

### PUT /api/subcategories/:id
Aggiorna una sottocategoria esistente (solo admin).

**Request Body:**
```json
{
  "name": "Nuovo nome",
  "description": "Nuova descrizione",
  "isActive": false
}
```

### DELETE /api/subcategories/:id
Elimina una sottocategoria (solo admin).

**Note:** Non è possibile eliminare sottocategorie con richieste attive.

### GET /api/subcategories/:id/professionals
Recupera i professionisti associati a una sottocategoria.

**Response:**
```json
{
  "professionals": [
    {
      "id": "uuid",
      "userId": "uuid",
      "subcategoryId": "uuid",
      "experienceYears": 10,
      "skillLevel": "expert",
      "certifications": ["Certificazione Impianti", "Patentino Gas"],
      "isActive": true,
      "user": {
        "id": "uuid",
        "firstName": "Giuseppe",
        "lastName": "Verdi",
        "fullName": "Giuseppe Verdi",
        "email": "giuseppe.verdi@professionisti.it",
        "phone": "3357654321",
        "profession": "Idraulico",
        "hourlyRate": 45.00,
        "city": "Napoli",
        "province": "NA"
      }
    }
  ]
}
```

### POST /api/subcategories/:id/ai-settings
Aggiorna le impostazioni AI per una sottocategoria (solo admin).

**Request Body:**
```json
{
  "modelName": "gpt-4",
  "temperature": 0.8,
  "maxTokens": 3000,
  "topP": 1,
  "frequencyPenalty": 0,
  "presencePenalty": 0,
  "systemPrompt": "Sei un assistente esperto specializzato in riparazioni idrauliche...",
  "responseStyle": "TECHNICAL",
  "detailLevel": "ADVANCED",
  "includeDiagrams": true,
  "includeReferences": true,
  "useKnowledgeBase": true,
  "isActive": true
}
```

## Modelli Database

### ProfessionalUserSubcategory
Relazione many-to-many tra professionisti e sottocategorie.

```prisma
model ProfessionalUserSubcategory {
  id                String   @id @default(uuid())
  userId            String
  subcategoryId     String
  experienceYears   Int      @default(0)
  skillLevel        String   @default("intermediate")
  certifications    Json?
  portfolio         Json?
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

### SubcategoryAiSettings
Configurazioni AI per ogni sottocategoria.

```prisma
model SubcategoryAiSettings {
  id                String   @id @default(uuid())
  subcategoryId     String   @unique
  modelName         String   @default("gpt-3.5-turbo")
  temperature       Float    @default(0.7)
  maxTokens         Int      @default(2048)
  topP              Float    @default(1)
  frequencyPenalty  Float    @default(0)
  presencePenalty   Float    @default(0)
  systemPrompt      String
  knowledgeBasePrompt String?
  responseStyle     ResponseStyle @default(FORMAL)
  detailLevel       DetailLevel @default(INTERMEDIATE)
  includeDiagrams   Boolean  @default(false)
  includeReferences Boolean  @default(false)
  useKnowledgeBase  Boolean  @default(false)
  knowledgeBaseIds  Json?
  isActive          Boolean  @default(true)
  metadata          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
```

## Enums

```prisma
enum ResponseStyle {
  FORMAL
  INFORMAL
  TECHNICAL
  EDUCATIONAL
}

enum DetailLevel {
  BASIC
  INTERMEDIATE
  ADVANCED
}
```

## Autorizzazioni

- **GET** endpoints: Tutti gli utenti autenticati
- **POST/PUT/DELETE**: Solo ADMIN e SUPER_ADMIN
- **AI Settings**: Solo ADMIN e SUPER_ADMIN

## Validazione

Tutti gli input sono validati con Zod schemas prima del processing.

## Multi-tenancy

Tutte le operazioni sono filtrate per `organizationId` tramite il middleware `tenantMiddleware`.
