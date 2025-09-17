# 📋 FASE 1 - IMPLEMENTAZIONE DATABASE

## OBIETTIVO
Creare e configurare tutte le tabelle necessarie per il Sistema Rapporti di Intervento nel database PostgreSQL usando Prisma.

## DURATA STIMATA
2 giorni (16 ore lavorative)

---

## 📝 STEP DI IMPLEMENTAZIONE

### STEP 1.1 - BACKUP E PREPARAZIONE (30 minuti)

#### Azioni:
```bash
# 1. Backup schema esistente
cp backend/prisma/schema.prisma backend/prisma/schema.backup-$(date +%Y%m%d-%H%M%S).prisma

# 2. Backup database
pg_dump $DATABASE_URL > database-backup-$(date +%Y%m%d-%H%M%S).sql

# 3. Creare branch git
git checkout -b feature/intervention-reports
```

#### Checklist:
- [ ] Schema backup creato
- [ ] Database backup creato
- [ ] Branch git creato
- [ ] Ambiente test configurato

---

### STEP 1.2 - AGGIUNTA TABELLE CONFIGURAZIONE (2 ore)

#### Codice da aggiungere in `schema.prisma`:

```prisma
// ========== SISTEMA RAPPORTI INTERVENTO ==========
// Aggiungere DOPO le tabelle esistenti, PRIMA degli enum

// Configurazione Globale Rapporti
model InterventionReportConfig {
  id                String      @id @default(uuid())
  name              String      @default("Configurazione Rapporti")
  
  // Numerazione automatica
  numberingPrefix   String      @default("RI")
  numberingFormat   String      @default("RI-{YEAR}-{NUMBER:5}")
  currentNumber     Int         @default(0)
  resetYearly       Boolean     @default(true)
  lastResetYear     Int?
  
  // Configurazioni generali
  requireSignatures Boolean     @default(false)
  allowDraftSave    Boolean     @default(true)
  autoSendToClient  Boolean     @default(false)
  enableGPS         Boolean     @default(false)
  enableTimer       Boolean     @default(true)
  enableMaterials   Boolean     @default(true)
  enablePhotos      Boolean     @default(false)
  maxPhotosPerType  Int         @default(5)
  photoTypes        Json?       @default("[\"prima\",\"durante\",\"dopo\"]")
  photoCompressionQuality Int   @default(80)
  
  // PDF Settings
  pdfLogo           String?
  pdfHeader         String?     @db.Text
  pdfFooter         String?     @db.Text
  pdfWatermark      String?
  pdfOrientation    String      @default("portrait")
  pdfFormat         String      @default("A4")
  
  // Notifiche
  notifyProfessionalOnSign Boolean @default(true)
  notifyClientOnCreate      Boolean @default(true)
  notifyAdminOnIssue       Boolean @default(false)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([name])
}

// Tipi di Campo Dinamici
model InterventionFieldType {
  id                String      @id @default(uuid())
  code              String      @unique
  name              String
  description       String?
  icon              String?
  component         String      // Nome componente React da usare
  validationRules   Json?
  defaultConfig     Json?       // Configurazione default per questo tipo
  isActive          Boolean     @default(true)
  isSystem          Boolean     @default(false)
  displayOrder      Int         @default(0)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  fields            InterventionTemplateField[]
  
  @@index([code])
  @@index([isActive])
}

// Sezioni Template
model InterventionTemplateSection {
  id                String      @id @default(uuid())
  code              String      @unique
  name              String
  description       String?
  icon              String?
  isSystem          Boolean     @default(false)
  isActive          Boolean     @default(true)
  isCollapsible     Boolean     @default(true)
  defaultExpanded   Boolean     @default(true)
  defaultOrder      Int         @default(100)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([code])
  @@index([isActive])
}

// Stati Rapporto
model InterventionReportStatus {
  id                String      @id @default(uuid())
  code              String      @unique
  name              String
  description       String?
  color             String      @default("#808080")
  bgColor           String      @default("#F3F4F6")
  icon              String?
  allowEdit         Boolean     @default(true)
  allowDelete       Boolean     @default(true)
  requireSignature  Boolean     @default(false)
  notifyClient      Boolean     @default(false)
  isFinal           Boolean     @default(false)
  isDefault         Boolean     @default(false)
  nextStatuses      Json?       // Array di code degli stati successivi permessi
  permissions       Json?       // Ruoli che possono impostare questo stato
  
  isActive          Boolean     @default(true)
  displayOrder      Int         @default(0)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  reports           InterventionReport[]
  
  @@index([code])
  @@index([isActive])
  @@index([isDefault])
}

// Tipi Intervento
model InterventionType {
  id                String      @id @default(uuid())
  code              String      @unique
  name              String
  description       String?
  icon              String?
  color             String      @default("#3B82F6")
  requiresQuote     Boolean     @default(false)
  requiresPhotos    Boolean     @default(false)
  requiresMaterials Boolean     @default(false)
  averageDuration   Float?      // Durata media in ore
  
  isActive          Boolean     @default(true)
  displayOrder      Int         @default(0)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  reports           InterventionReport[]
  
  @@index([code])
  @@index([isActive])
}
```

#### Test da eseguire:
```bash
# Verificare sintassi Prisma
cd backend
npx prisma validate

# Se OK, generare client
npx prisma generate
```

---

### STEP 1.3 - AGGIUNTA TABELLE TEMPLATE (2 ore)

#### Codice da aggiungere in `schema.prisma`:

```prisma
// Template Rapporti
model InterventionReportTemplate {
  id                String      @id @default(uuid())
  name              String      
  description       String?     @db.Text
  code              String?     @unique // Codice univoco template
  
  // Associazioni
  subcategoryId     String?     
  categoryId        String?     
  isGeneric         Boolean     @default(false) // Template generico per tutti
  
  // Stato e visibilità
  isActive          Boolean     @default(true)
  isDefault         Boolean     @default(false)
  isPublic          Boolean     @default(true)
  createdBy         String?     
  approvedBy        String?     
  approvedAt        DateTime?
  version           Int         @default(1)
  
  // Configurazioni template specifiche
  settings          Json?       // Override configurazioni globali
  requiredSections  Json?       // Sezioni obbligatorie
  layout            Json?       // Layout personalizzato
  
  // Metadati
  usageCount        Int         @default(0)
  lastUsedAt        DateTime?
  rating            Float?      // Valutazione media del template
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relazioni
  subcategory       Subcategory? @relation(fields: [subcategoryId], references: [id])
  category          Category?    @relation(fields: [categoryId], references: [id])
  creator           User?        @relation("TemplateCreator", fields: [createdBy], references: [id])
  approver          User?        @relation("TemplateApprover", fields: [approvedBy], references: [id])
  fields            InterventionTemplateField[]
  reports           InterventionReport[]
  professionalTemplates ProfessionalReportTemplate[]
  
  @@index([subcategoryId])
  @@index([categoryId])
  @@index([isActive])
  @@index([isDefault])
  @@index([code])
}

// Campi del Template
model InterventionTemplateField {
  id                String      @id @default(uuid())
  templateId        String
  
  // Informazioni campo
  code              String      // Codice univoco nel template
  label             String      
  placeholder       String?     
  helpText          String?     @db.Text
  tooltip           String?
  
  // Tipo e configurazione
  fieldTypeId       String      
  sectionCode       String?     
  
  // Posizionamento
  displayOrder      Int         @default(100)
  columnSpan        Int         @default(12) // 1-12 grid
  rowNumber         Int         @default(1)
  groupName         String?     // Per raggruppare campi correlati
  
  // Validazione e comportamento
  isRequired        Boolean     @default(false)
  isReadonly        Boolean     @default(false)
  isHidden          Boolean     @default(false)
  showOnPDF         Boolean     @default(true)
  showOnClient      Boolean     @default(true)
  showOnMobile      Boolean     @default(true)
  
  // Configurazione specifica
  config            Json?       // Configurazione specifica per tipo campo
  dependencies      Json?       // Dipendenze da altri campi
  calculations      Json?       // Formule calcolo
  validationRules   Json?       // Regole validazione custom
  
  // Valori
  defaultValue      String?     @db.Text
  possibleValues    Json?       // Per select, radio, checkbox
  
  // Conditional logic
  showIf            Json?       // Condizioni per mostrare campo
  requiredIf        Json?       // Condizioni per rendere obbligatorio
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relazioni
  template          InterventionReportTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)
  fieldType         InterventionFieldType @relation(fields: [fieldTypeId], references: [id])
  
  @@unique([templateId, code])
  @@index([templateId])
  @@index([displayOrder])
  @@index([sectionCode])
}
```

---

### STEP 1.4 - AGGIUNTA TABELLE RAPPORTI (2 ore)

#### Codice da aggiungere in `schema.prisma`:

```prisma
// Rapporti di Intervento
model InterventionReport {
  id                String      @id @default(uuid())
  reportNumber      String      @unique // Numero progressivo
  
  // Riferimenti
  requestId         String      
  professionalId    String
  clientId          String      // Denormalizzato per query veloci
  templateId        String?     
  statusId          String      
  typeId            String      
  
  // Tempistiche
  interventionDate  DateTime    
  startTime         DateTime    
  endTime           DateTime?
  totalHours        Float?      
  travelTime        Float?      // Tempo viaggio in ore
  
  // Dati compilati
  formData          Json        // Tutti i dati del form
  
  // Materiali
  materials         Json?       // Array materiali utilizzati
  materialsTotal    Decimal?    @db.Decimal(10, 2) // Totale costo materiali
  
  // Foto
  photos            Json?       // Array URL/path foto
  
  // Firme
  signatures        Json?       // Oggetto con firme digitali
  professionalSignedAt DateTime?
  clientSignedAt    DateTime?
  
  // GPS e meteo
  gpsData           Json?       // Coordinate GPS
  weatherData       Json?       // Condizioni meteo
  
  // Note e comunicazioni
  internalNotes     String?     @db.Text // Note private
  clientNotes       String?     @db.Text // Note per cliente
  followUpRequired  Boolean     @default(false)
  followUpNotes     String?     @db.Text
  
  // PDF
  pdfUrl            String?     // URL PDF generato
  pdfGeneratedAt    DateTime?
  
  // Tracking
  isDraft           Boolean     @default(true)
  sentToClientAt    DateTime?   
  viewedByClientAt  DateTime?
  clientIp          String?     // IP cliente quando visualizza
  clientUserAgent   String?     // Browser cliente
  
  // Metadati
  metadata          Json?       // Altri dati custom
  version           Int         @default(1) // Versione rapporto
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relazioni
  request           AssistanceRequest @relation(fields: [requestId], references: [id])
  professional      User @relation("ReportProfessional", fields: [professionalId], references: [id])
  client            User @relation("ReportClient", fields: [clientId], references: [id])
  template          InterventionReportTemplate? @relation(fields: [templateId], references: [id])
  status            InterventionReportStatus @relation(fields: [statusId], references: [id])
  type              InterventionType @relation(fields: [typeId], references: [id])
  
  @@index([requestId])
  @@index([professionalId])
  @@index([clientId])
  @@index([statusId])
  @@index([reportNumber])
  @@index([interventionDate])
  @@index([isDraft])
}

// Database Materiali
model InterventionMaterial {
  id                String      @id @default(uuid())
  code              String      @unique
  name              String
  description       String?     @db.Text
  category          String?     
  subcategory       String?
  brand             String?     // Marca
  model             String?     // Modello
  unit              String      @default("pz")
  defaultPrice      Decimal?    @db.Decimal(10, 2)
  vatRate           Float       @default(22) // Aliquota IVA
  supplierCode      String?     
  supplierName      String?
  barcode           String?     @unique
  qrcode            String?     
  imageUrl          String?
  technicalSheet    String?     // URL scheda tecnica
  
  // Stock (opzionale)
  stockQuantity     Float?      
  stockMin          Float?      
  stockMax          Float?      
  
  isActive          Boolean     @default(true)
  isService         Boolean     @default(false) // È un servizio, non materiale
  usageCount        Int         @default(0)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  @@index([category])
  @@index([name])
  @@index([code])
  @@index([barcode])
}
```

---

### STEP 1.5 - AGGIUNTA TABELLE PROFESSIONISTA (2 ore)

#### Codice da aggiungere in `schema.prisma`:

```prisma
// Template Personalizzati Professionista
model ProfessionalReportTemplate {
  id                String      @id @default(uuid())
  professionalId    String
  baseTemplateId    String?     
  
  name              String      
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
  
  professional      User        @relation(fields: [professionalId], references: [id])
  baseTemplate      InterventionReportTemplate? @relation(fields: [baseTemplateId], references: [id])
  
  @@index([professionalId])
  @@index([isActive])
  @@index([isDefault])
}

// Frasi Ricorrenti Professionista
model ProfessionalReportPhrase {
  id                String      @id @default(uuid())
  professionalId    String
  
  category          String      // problema, soluzione, raccomandazione
  code              String      
  title             String      
  content           String      @db.Text
  
  tags              Json?       // Tag per ricerca veloce
  usageCount        Int         @default(0)
  lastUsedAt        DateTime?
  
  isActive          Boolean     @default(true)
  isFavorite        Boolean     @default(false)
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  professional      User        @relation(fields: [professionalId], references: [id])
  
  @@unique([professionalId, code])
  @@index([professionalId, category])
  @@index([isFavorite])
}

// Materiali Personalizzati Professionista
model ProfessionalMaterial {
  id                String      @id @default(uuid())
  professionalId    String
  baseMaterialId    String?     // Riferimento a InterventionMaterial
  
  code              String      
  name              String
  description       String?     @db.Text
  unit              String      @default("pz")
  defaultQuantity   Float       @default(1)
  price             Decimal     @db.Decimal(10, 2)
  vatRate           Float       @default(22)
  
  supplierName      String?     
  supplierCode      String?
  notes             String?     @db.Text
  
  category          String?     
  isFavorite        Boolean     @default(false)
  usageCount        Int         @default(0)
  lastUsedAt        DateTime?
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  professional      User        @relation(fields: [professionalId], references: [id])
  
  @@unique([professionalId, code])
  @@index([professionalId, category])
  @@index([professionalId, isFavorite])
}

// Impostazioni Rapporti Professionista
model ProfessionalReportSettings {
  id                String      @id @default(uuid())
  professionalId    String      @unique
  
  // Dati aziendali
  businessName      String?     
  businessLogo      String?     // URL logo
  businessAddress   String?     @db.Text
  businessPhone     String?
  businessEmail     String?
  businessWebsite   String?
  vatNumber         String?     
  fiscalCode        String?     
  reaNumber         String?     // Numero REA
  
  // Preferenze operative
  defaultTemplateId String?     
  autoStartTimer    Boolean     @default(false)
  autoGpsLocation   Boolean     @default(false)
  autoWeather       Boolean     @default(false)
  
  // Preferenze compilazione
  quickPhrases      Boolean     @default(true)
  quickMaterials    Boolean     @default(true)
  showLastReports   Boolean     @default(true)
  defaultLanguage   String      @default("it")
  
  // Firma
  signatureImage    String?     @db.Text // Base64 firma
  signatureName     String?     
  signatureTitle    String?     
  
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
  
  professional      User        @relation(fields: [professionalId], references: [id])
}

// Cartelle Organizzazione Rapporti
model ProfessionalReportFolder {
  id                String      @id @default(uuid())
  professionalId    String
  
  name              String      
  description       String?
  color             String      @default("#808080")
  icon              String?
  
  isDefault         Boolean     @default(false)
  isArchive         Boolean     @default(false)
  displayOrder      Int         @default(0)
  
  reportCount       Int         @default(0) // Contatore rapporti
  
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  professional      User        @relation(fields: [professionalId], references: [id])
  
  @@unique([professionalId, name])
  @@index([professionalId])
  @@index([displayOrder])
}
```

---

### STEP 1.6 - AGGIORNAMENTO RELAZIONI USER (1 ora)

#### Modifiche al modello User esistente:

```prisma
model User {
  // ... campi esistenti ...
  
  // Aggiungere queste relazioni:
  
  // Rapporti Intervento - Creator
  createdReportTemplates    InterventionReportTemplate[] @relation("TemplateCreator")
  approvedReportTemplates   InterventionReportTemplate[] @relation("TemplateApprover")
  
  // Rapporti Intervento - Professional
  interventionReports       InterventionReport[] @relation("ReportProfessional")
  clientInterventionReports InterventionReport[] @relation("ReportClient")
  professionalTemplates     ProfessionalReportTemplate[]
  professionalPhrases       ProfessionalReportPhrase[]
  professionalMaterials     ProfessionalMaterial[]
  professionalReportSettings ProfessionalReportSettings?
  professionalReportFolders ProfessionalReportFolder[]
  
  // ... altre relazioni esistenti ...
}
```

#### Modifiche al modello AssistanceRequest:

```prisma
model AssistanceRequest {
  // ... campi esistenti ...
  
  // Aggiungere questa relazione:
  interventionReports InterventionReport[]
  
  // ... altre relazioni esistenti ...
}
```

#### Modifiche al modello Category:

```prisma
model Category {
  // ... campi esistenti ...
  
  // Aggiungere questa relazione:
  interventionTemplates InterventionReportTemplate[]
  
  // ... altre relazioni esistenti ...
}
```

#### Modifiche al modello Subcategory:

```prisma
model Subcategory {
  // ... campi esistenti ...
  
  // Aggiungere questa relazione:
  interventionTemplates InterventionReportTemplate[]
  
  // ... altre relazioni esistenti ...
}
```

---

### STEP 1.7 - MIGRATION E TEST (1 ora)

#### Comandi da eseguire:

```bash
# 1. Validare schema
cd backend
npx prisma validate

# 2. Generare migration
npx prisma migrate dev --name add_intervention_reports_system

# 3. Verificare migration
npx prisma studio
# Controllare che tutte le tabelle siano create

# 4. Generare client
npx prisma generate

# 5. Test TypeScript
npx tsc --noEmit
```

#### Checklist verifica:
- [ ] Migration completata senza errori
- [ ] Tutte le tabelle create nel DB
- [ ] Relazioni corrette in Prisma Studio
- [ ] Nessun errore TypeScript
- [ ] Client Prisma generato

---

### STEP 1.8 - SEED DATI INIZIALI (2 ore)

#### Creare file `backend/prisma/seed-intervention-reports.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedInterventionReports() {
  console.log('🌱 Seeding Intervention Reports System...');

  // 1. Configurazione Globale
  const config = await prisma.interventionReportConfig.upsert({
    where: { name: 'Configurazione Rapporti' },
    update: {},
    create: {
      name: 'Configurazione Rapporti',
      numberingPrefix: 'RI',
      numberingFormat: 'RI-{YEAR}-{NUMBER:5}',
      currentNumber: 0,
      resetYearly: true,
      requireSignatures: false,
      allowDraftSave: true,
      autoSendToClient: false,
      enableGPS: false,
      enableTimer: true,
      enableMaterials: true,
      enablePhotos: false,
      maxPhotosPerType: 5,
      photoTypes: ['prima', 'durante', 'dopo']
    }
  });

  // 2. Tipi di Campo
  const fieldTypes = [
    { code: 'text', name: 'Testo Semplice', component: 'TextInput' },
    { code: 'textarea', name: 'Testo Multiriga', component: 'TextArea' },
    { code: 'number', name: 'Numero', component: 'NumberInput' },
    { code: 'date', name: 'Data', component: 'DatePicker' },
    { code: 'time', name: 'Ora', component: 'TimePicker' },
    { code: 'datetime', name: 'Data e Ora', component: 'DateTimePicker' },
    { code: 'select', name: 'Selezione Singola', component: 'SelectInput' },
    { code: 'multiselect', name: 'Selezione Multipla', component: 'MultiSelect' },
    { code: 'checkbox', name: 'Checkbox', component: 'CheckboxInput' },
    { code: 'radio', name: 'Radio Button', component: 'RadioGroup' },
    { code: 'file', name: 'Upload File', component: 'FileUpload' },
    { code: 'signature', name: 'Firma Digitale', component: 'SignaturePad' },
    { code: 'photo', name: 'Foto', component: 'PhotoCapture' },
    { code: 'gps', name: 'Coordinate GPS', component: 'GPSInput' },
    { code: 'materials', name: 'Lista Materiali', component: 'MaterialsList' }
  ];

  for (const fieldType of fieldTypes) {
    await prisma.interventionFieldType.upsert({
      where: { code: fieldType.code },
      update: {},
      create: {
        ...fieldType,
        isActive: true,
        isSystem: true
      }
    });
  }

  // 3. Sezioni Template Standard
  const sections = [
    { code: 'info_base', name: 'Informazioni Base', displayOrder: 1 },
    { code: 'diagnostica', name: 'Diagnostica', displayOrder: 2 },
    { code: 'intervento', name: 'Intervento Eseguito', displayOrder: 3 },
    { code: 'materiali', name: 'Materiali Utilizzati', displayOrder: 4 },
    { code: 'foto', name: 'Documentazione Fotografica', displayOrder: 5 },
    { code: 'raccomandazioni', name: 'Raccomandazioni', displayOrder: 6 },
    { code: 'firme', name: 'Firme', displayOrder: 7 }
  ];

  for (const section of sections) {
    await prisma.interventionTemplateSection.upsert({
      where: { code: section.code },
      update: {},
      create: {
        ...section,
        isSystem: true,
        isActive: true
      }
    });
  }

  // 4. Stati Rapporto
  const statuses = [
    { 
      code: 'draft', 
      name: 'Bozza', 
      color: '#6B7280',
      bgColor: '#F3F4F6',
      allowEdit: true,
      allowDelete: true,
      isDefault: true
    },
    { 
      code: 'completed', 
      name: 'Completato', 
      color: '#10B981',
      bgColor: '#D1FAE5',
      allowEdit: true,
      allowDelete: false
    },
    { 
      code: 'signed', 
      name: 'Firmato', 
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      allowEdit: false,
      allowDelete: false,
      requireSignature: true
    },
    { 
      code: 'sent', 
      name: 'Inviato al Cliente', 
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      allowEdit: false,
      allowDelete: false,
      notifyClient: true
    },
    { 
      code: 'archived', 
      name: 'Archiviato', 
      color: '#6B7280',
      bgColor: '#F9FAFB',
      allowEdit: false,
      allowDelete: false,
      isFinal: true
    }
  ];

  for (const status of statuses) {
    await prisma.interventionReportStatus.upsert({
      where: { code: status.code },
      update: {},
      create: {
        ...status,
        isActive: true
      }
    });
  }

  // 5. Tipi Intervento
  const types = [
    { 
      code: 'maintenance', 
      name: 'Manutenzione Ordinaria',
      icon: '🔧',
      color: '#10B981'
    },
    { 
      code: 'repair', 
      name: 'Riparazione',
      icon: '🔨',
      color: '#EF4444'
    },
    { 
      code: 'installation', 
      name: 'Installazione',
      icon: '📦',
      color: '#3B82F6'
    },
    { 
      code: 'inspection', 
      name: 'Ispezione/Controllo',
      icon: '🔍',
      color: '#F59E0B'
    },
    { 
      code: 'emergency', 
      name: 'Intervento Emergenza',
      icon: '🚨',
      color: '#DC2626',
      requiresPhotos: true
    },
    { 
      code: 'consultation', 
      name: 'Consulenza Tecnica',
      icon: '💬',
      color: '#8B5CF6'
    }
  ];

  for (const type of types) {
    await prisma.interventionType.upsert({
      where: { code: type.code },
      update: {},
      create: {
        ...type,
        isActive: true
      }
    });
  }

  // 6. Materiali di Base
  const materials = [
    // Elettrico
    { code: 'INT_DIFF_16A', name: 'Interruttore Differenziale 16A', category: 'Elettrico', unit: 'pz', defaultPrice: 45.00 },
    { code: 'INT_DIFF_25A', name: 'Interruttore Differenziale 25A', category: 'Elettrico', unit: 'pz', defaultPrice: 52.00 },
    { code: 'CAVO_2_5MM', name: 'Cavo elettrico 2.5mm²', category: 'Elettrico', unit: 'metri', defaultPrice: 2.50 },
    { code: 'CAVO_4MM', name: 'Cavo elettrico 4mm²', category: 'Elettrico', unit: 'metri', defaultPrice: 3.80 },
    
    // Idraulico
    { code: 'TUBO_RAME_14', name: 'Tubo rame 14mm', category: 'Idraulico', unit: 'metri', defaultPrice: 8.50 },
    { code: 'RACCORDO_14', name: 'Raccordo 14mm', category: 'Idraulico', unit: 'pz', defaultPrice: 3.20 },
    { code: 'VALVOLA_SFERA', name: 'Valvola a sfera 1/2"', category: 'Idraulico', unit: 'pz', defaultPrice: 12.00 },
    
    // Generico
    { code: 'MANODOPERA', name: 'Manodopera', category: 'Servizi', unit: 'ore', defaultPrice: 35.00, isService: true },
    { code: 'TRASFERTA', name: 'Diritto di chiamata', category: 'Servizi', unit: 'pz', defaultPrice: 30.00, isService: true }
  ];

  for (const material of materials) {
    await prisma.interventionMaterial.upsert({
      where: { code: material.code },
      update: {},
      create: {
        ...material,
        isActive: true
      }
    });
  }

  console.log('✅ Intervention Reports System seeded successfully!');
}

// Esegui se chiamato direttamente
if (require.main === module) {
  seedInterventionReports()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error('❌ Seed failed:', e);
      prisma.$disconnect();
      process.exit(1);
    });
}
```

#### Aggiornare `backend/prisma/seed.ts` principale:

```typescript
// Aggiungere in seed.ts esistente:
import { seedInterventionReports } from './seed-intervention-reports';

async function main() {
  // ... seed esistenti ...
  
  // Aggiungere:
  await seedInterventionReports();
}
```

#### Eseguire seed:

```bash
cd backend
npx prisma db seed
```

---

## ✅ CHECKLIST COMPLETAMENTO FASE 1

### Database Schema
- [ ] Backup creati (schema + database)
- [ ] Branch git creato
- [ ] Tabelle configurazione aggiunte
- [ ] Tabelle template aggiunte
- [ ] Tabelle rapporti aggiunte
- [ ] Tabelle professionista aggiunte
- [ ] Relazioni User aggiornate
- [ ] Relazioni altri modelli aggiornate

### Migration
- [ ] Schema validato senza errori
- [ ] Migration creata con successo
- [ ] Database migrato
- [ ] Client Prisma generato
- [ ] TypeScript compila senza errori

### Seed Data
- [ ] File seed creato
- [ ] Configurazione globale inserita
- [ ] Tipi campo inseriti
- [ ] Sezioni template inserite
- [ ] Stati rapporto inseriti
- [ ] Tipi intervento inseriti
- [ ] Materiali base inseriti
- [ ] Seed eseguito senza errori

### Testing
- [ ] Prisma Studio apre tutte le tabelle
- [ ] Relazioni visibili correttamente
- [ ] Dati seed presenti
- [ ] Query di test funzionanti

### Documentazione
- [ ] Progress tracker aggiornato
- [ ] Note su problemi riscontrati
- [ ] Schema documentato
- [ ] README aggiornato se necessario

---

## 🚨 TROUBLESHOOTING

### Errore: "relation already exists"
```bash
# Soluzione: Droppare e ricreare migration
npx prisma migrate reset
# Poi ricreare migration
```

### Errore: TypeScript types
```bash
# Rigenerare client
npx prisma generate
# Restart TypeScript server in VS Code
```

### Errore: Seed fallisce
```bash
# Verificare ordine dipendenze
# Controllare unique constraints
# Usare upsert invece di create
```

---

## 📝 NOTE PER FASE SUCCESSIVA

La Fase 2 (API Base) potrà iniziare con:
- Schema database pronto
- TypeScript types generati
- Dati di test disponibili
- Relazioni funzionanti

Passare a: `02-API-BASE-IMPLEMENTATION.md`
