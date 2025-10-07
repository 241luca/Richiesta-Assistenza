# 🗄️ Sistema Moduli - Database Schema v1.0

**Versione**: 1.0.0  
**Data**: 06 Ottobre 2025  
**Autore**: Sessione Claude v1  
**Sistema**: Richiesta Assistenza v5.2

## 📊 Panoramica

Schema database per gestione centralizzata on/off moduli sistema. Permette attivazione/disattivazione granulare delle funzionalità con tracking completo delle modifiche e configurazioni personalizzabili.

## 🎯 Obiettivi Sistema

- **🔧 Gestione Moduli**: On/off centralizzato di funzionalità
- **⚙️ Configurazione Granulare**: Settings specifici per ogni modulo
- **📊 Audit Trail**: Log completo di tutte le modifiche
- **🔗 Gestione Dipendenze**: Controllo moduli interconnessi
- **📱 UI Dinamica**: Interfaccia che si adatta ai moduli attivi

## 🏗️ Architettura Database

### Modello ER Relazioni

```
SystemModule (1) -----> (N) ModuleSetting
      |
      v
SystemModule (1) -----> (N) ModuleHistory
      ^
      |
User (1) -------------> (N) ModuleHistory
```

### Schema Completo

```prisma
// ============================================
// SISTEMA GESTIONE MODULI v5.2
// ============================================

model SystemModule {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?  @db.Text
  category    ModuleCategory
  
  // Stato
  isEnabled   Boolean  @default(true)
  isCore      Boolean  @default(false) // Se true, non disabilitabile
  
  // Dipendenze
  dependsOn   String[] // Array codici moduli richiesti
  requiredFor String[] // Array codici moduli che lo richiedono
  
  // Configurazioni modulo
  config      Json?    // Settings specifici del modulo
  
  // Feature flags
  features    Json?    // {"premium": true, "beta": false}
  
  // Tracking modifiche
  enabledAt   DateTime?
  enabledBy   String?
  disabledAt  DateTime?
  disabledBy  String?
  
  // Metadata
  icon        String?
  color       String?
  order       Int      @default(100)
  version     String   @default("1.0.0")
  
  // Relazioni
  settings    ModuleSetting[]
  history     ModuleHistory[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([code])
  @@index([category])
  @@index([isEnabled])
  @@map("system_modules")
}

model ModuleSetting {
  id          String       @id @default(cuid())
  moduleCode  String
  module      SystemModule @relation(fields: [moduleCode], references: [code], onDelete: Cascade)
  
  key         String
  value       String       @db.Text
  type        SettingType  
  
  label       String
  description String?
  category    String?      // Per raggruppare settings nel UI
  
  // Validazione
  isRequired  Boolean      @default(false)
  isSecret    Boolean      @default(false)
  validation  Json?        // {min: 0, max: 100, pattern: "..."}
  
  // UI hints
  placeholder String?
  helpText    String?
  order       Int          @default(100)
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@unique([moduleCode, key])
  @@index([moduleCode])
  @@map("module_settings")
}

model ModuleHistory {
  id          String       @id @default(cuid())
  moduleCode  String
  module      SystemModule @relation(fields: [moduleCode], references: [code], onDelete: Cascade)
  
  action      ModuleAction
  oldValue    Json?
  newValue    Json?
  
  performedBy String
  user        User         @relation("ModuleHistoryPerformedBy", fields: [performedBy], references: [id])
  
  ipAddress   String?
  userAgent   String?
  reason      String?      @db.Text
  
  createdAt   DateTime     @default(now())
  
  @@index([moduleCode])
  @@index([action])
  @@index([createdAt])
  @@map("module_history")
}
```

## 📋 Tabelle Dettaglio

### 1. system_modules (Tabella Principale)

Tabella principale per configurazione moduli sistema.

#### 🔑 Campi Chiave

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `code` | String (unique) | Codice univoco modulo | "reviews", "payments", "whatsapp" |
| `name` | String | Nome visualizzato nell'UI | "Sistema Recensioni" |
| `description` | Text | Descrizione funzionalità | "Recensioni 1-5 stelle con commenti" |
| `category` | ModuleCategory | Categoria appartenenza | "ADVANCED" |
| `isEnabled` | Boolean | Stato attivo/disattivo | true |
| `isCore` | Boolean | Se true, modulo non disabilitabile | false |

#### 🔗 Dipendenze

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `dependsOn` | String[] | Array codici moduli richiesti | ["requests", "users"] |
| `requiredFor` | String[] | Array codici moduli che richiedono questo | ["analytics"] |

#### ⚙️ Configurazioni

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `config` | Json | Settings specifici modulo | {"maxRetries": 3, "timeout": 30} |
| `features` | Json | Feature flags | {"premium": true, "beta": false} |

#### 📱 UI Metadata

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `icon` | String | Emoji icona per UI | "⭐" |
| `color` | String | Colore hex categoria | "#F59E0B" |
| `order` | Int | Ordinamento visualizzazione | 40 |
| `version` | String | Versione modulo | "2.1.0" |

#### 📊 Tracking

| Campo | Tipo | Descrizione |
|-------|------|-------------|
| `enabledAt` | DateTime | Quando abilitato |
| `enabledBy` | String | Chi ha abilitato |
| `disabledAt` | DateTime | Quando disabilitato |
| `disabledBy` | String | Chi ha disabilitato |

#### 🔍 Index

- `code` - Lookup veloce per codice
- `category` - Filtro per categoria  
- `isEnabled` - Query moduli attivi

#### 💾 Esempio Record

```json
{
  "id": "cm123abc",
  "code": "reviews",
  "name": "Sistema Recensioni",
  "description": "Gestione recensioni 1-5 stelle con commenti dettagliati",
  "category": "ADVANCED",
  "isEnabled": true,
  "isCore": false,
  "dependsOn": ["requests"],
  "requiredFor": ["analytics"],
  "config": {
    "maxStars": 5,
    "requireComment": true,
    "autoModeration": false
  },
  "features": {
    "premium": true,
    "beta": false,
    "photoUpload": true
  },
  "icon": "⭐",
  "color": "#F59E0B",
  "order": 40,
  "version": "1.0.0",
  "enabledAt": "2025-10-06T10:00:00Z",
  "enabledBy": "cm456def"
}
```

### 2. module_settings (Configurazioni Granulari)

Settings specifici per ogni modulo con validazione e UI metadata.

#### 🔑 Campi Principali

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `moduleCode` | String (FK) | Riferimento a SystemModule | "whatsapp" |
| `key` | String | Chiave setting | "session_name" |
| `value` | Text | Valore setting | "production" |
| `type` | SettingType | Tipo dato | "STRING" |
| `label` | String | Label per UI | "Nome Sessione" |
| `description` | String | Descrizione setting | "Nome univoco sessione WhatsApp" |

#### ✅ Validazione

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `isRequired` | Boolean | Campo obbligatorio | true |
| `isSecret` | Boolean | Campo sensibile (password, API key) | false |
| `validation` | Json | Regole validazione | {"min": 3, "max": 50, "pattern": "^[a-z0-9_]+$"} |

#### 📱 UI Hints

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `placeholder` | String | Placeholder input UI | "es: produzione_whatsapp" |
| `helpText` | String | Testo aiuto | "Usare solo lettere minuscole e underscore" |
| `category` | String | Raggruppamento UI | "Configurazione Base" |
| `order` | Int | Ordinamento UI | 1 |

#### 🚨 Unique Constraint

- `(moduleCode, key)` - Un setting per chiave per modulo

#### 💾 Esempio Record

```json
{
  "id": "cm789ghi", 
  "moduleCode": "whatsapp",
  "key": "session_name",
  "value": "production",
  "type": "STRING",
  "label": "Nome Sessione",
  "description": "Nome univoco per la sessione WhatsApp Business",
  "category": "Configurazione Base",
  "isRequired": true,
  "isSecret": false,
  "validation": {
    "min": 3,
    "max": 50,
    "pattern": "^[a-z0-9_]+$"
  },
  "placeholder": "es: produzione_whatsapp",
  "helpText": "Usare solo lettere minuscole, numeri e underscore",
  "order": 1
}
```

### 3. module_history (Audit Trail)

Log storico completo di tutte le modifiche ai moduli per compliance e troubleshooting.

#### 🔑 Campi Principali

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `moduleCode` | String (FK) | Riferimento a SystemModule | "reviews" |
| `action` | ModuleAction | Tipo azione eseguita | "DISABLED" |
| `oldValue` | Json | Valore precedente | {"isEnabled": true} |
| `newValue` | Json | Nuovo valore | {"isEnabled": false} |
| `performedBy` | String (FK) | ID utente che ha fatto modifica | "cm123abc" |

#### 🕵️ Audit Fields

| Campo | Tipo | Descrizione | Esempio |
|-------|------|-------------|---------|
| `ipAddress` | String | IP della richiesta | "192.168.1.100" |
| `userAgent` | String | Browser utilizzato | "Mozilla/5.0 Chrome/..." |
| `reason` | Text | Motivazione modifica | "Manutenzione sistema recensioni" |
| `createdAt` | DateTime | Timestamp modifica | "2025-10-06T14:30:00Z" |

#### 🔍 Index

- `moduleCode` - Storia per modulo
- `action` - Filtra per tipo azione
- `createdAt` - Ordine cronologico

#### 💾 Esempio Record

```json
{
  "id": "cm456jkl",
  "moduleCode": "reviews", 
  "action": "DISABLED",
  "oldValue": {
    "isEnabled": true,
    "config": {"maxStars": 5}
  },
  "newValue": {
    "isEnabled": false,
    "disabledAt": "2025-10-06T14:30:00Z",
    "disabledBy": "cm123abc"
  },
  "performedBy": "cm123abc",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
  "reason": "Disabilitazione temporanea per manutenzione sistema recensioni",
  "createdAt": "2025-10-06T14:30:00Z"
}
```

## 🏷️ Enum Definiti

### ModuleCategory (8 categorie)

Organizzazione logica dei moduli per tipologia di funzionalità.

```prisma
enum ModuleCategory {
  CORE           // Funzioni essenziali (auth, users, security)
  BUSINESS       // Logica business (requests, quotes, payments) 
  COMMUNICATION  // Comunicazione (chat, email, WhatsApp, notifiche)
  ADVANCED       // Funzionalità avanzate (AI, reviews, portfolio)
  REPORTING      // Reportistica (rapporti, analytics)
  AUTOMATION     // Automazione (backup, cleanup, scheduler)
  INTEGRATIONS   // Integrazioni esterne (Google, Stripe, OpenAI)
  ADMIN          // Amministrazione (dashboard, settings, audit)
}
```

#### 📋 Mapping Funzionalità per Categoria

| Categoria | Moduli Esempio | Descrizione |
|-----------|----------------|-------------|
| **CORE** | auth, users, security, session | Sistema base necessario |
| **BUSINESS** | requests, quotes, payments, contracts | Logica di business principale |
| **COMMUNICATION** | chat, email, whatsapp, notifications | Tutti i canali comunicazione |
| **ADVANCED** | ai, reviews, portfolio, gamification | Funzionalità premium/avanzate |
| **REPORTING** | analytics, reports, dashboard | Business intelligence |
| **AUTOMATION** | backup, cleanup, scheduler | Processi automatizzati |
| **INTEGRATIONS** | google_maps, stripe, openai | Servizi esterni |
| **ADMIN** | admin_dashboard, audit, scripts | Strumenti amministrazione |

### SettingType (8 tipi)

Tipizzazione forte per i settings con validazione automatica.

```prisma
enum SettingType {
  STRING    // Testo generico
  NUMBER    // Numero intero o decimale
  BOOLEAN   // true/false
  JSON      // Oggetto JSON
  PASSWORD  // Campo sensibile
  URL       // URL validato
  EMAIL     // Email validata
  PHONE     // Telefono validato
}
```

#### 🔧 Comportamento per Tipo

| Tipo | Validazione | UI Component | Esempio |
|------|-------------|--------------|---------|
| **STRING** | Length, pattern | Text input | "session_name" |
| **NUMBER** | Min/max, integer | Number input | 30 |
| **BOOLEAN** | true/false | Toggle switch | true |
| **JSON** | Valid JSON | Code editor | {"retry": 3} |
| **PASSWORD** | Complexity | Password input (masked) | "••••••••" |
| **URL** | Valid URL format | URL input | "https://api.example.com" |
| **EMAIL** | Valid email format | Email input | "admin@example.com" |
| **PHONE** | Phone format | Phone input | "+39 123 456 7890" |

### ModuleAction (7 azioni)

Tracking completo di tutte le operazioni sui moduli.

```prisma
enum ModuleAction {
  ENABLED            // Modulo abilitato
  DISABLED           // Modulo disabilitato
  CONFIG_CHANGED     // Config Json modificata
  SETTING_UPDATED    // Singolo setting aggiornato
  DEPENDENCY_ADDED   // Dipendenza aggiunta
  DEPENDENCY_REMOVED // Dipendenza rimossa
  MIGRATED           // Modulo migrato da versione precedente
}
```

#### 📊 Esempi di Utilizzo

| Azione | Quando | oldValue | newValue |
|--------|---------|----------|----------|
| **ENABLED** | Admin abilita modulo | `{"isEnabled": false}` | `{"isEnabled": true, "enabledAt": "...", "enabledBy": "..."}` |
| **DISABLED** | Admin disabilita modulo | `{"isEnabled": true}` | `{"isEnabled": false, "disabledAt": "...", "disabledBy": "..."}` |
| **CONFIG_CHANGED** | Modifica config generale | `{"config": {"retry": 3}}` | `{"config": {"retry": 5, "timeout": 30}}` |
| **SETTING_UPDATED** | Singolo setting cambiato | `{"key": "api_url", "value": "v1"}` | `{"key": "api_url", "value": "v2"}` |
| **DEPENDENCY_ADDED** | Nuova dipendenza | `{"dependsOn": ["users"]}` | `{"dependsOn": ["users", "auth"]}` |
| **DEPENDENCY_REMOVED** | Dipendenza rimossa | `{"dependsOn": ["users", "auth"]}` | `{"dependsOn": ["users"]}` |
| **MIGRATED** | Aggiornamento versione | `{"version": "1.0.0"}` | `{"version": "1.1.0", "migrated": true}` |

## 🔗 Relazioni Database

### SystemModule → ModuleSetting (1:N)

Un modulo può avere 0+ settings personalizzabili.

```prisma
// Nel modello SystemModule
settings ModuleSetting[]

// Nel modello ModuleSetting 
module SystemModule @relation(fields: [moduleCode], references: [code], onDelete: Cascade)
```

**Caratteristiche**:
- **Cascade Delete**: Se cancelli modulo, cancelli automaticamente tutti i suoi settings
- **Unique Constraint**: (moduleCode, key) - Un setting per chiave per modulo
- **FK Reference**: moduleCode → SystemModule.code

### SystemModule → ModuleHistory (1:N)

Un modulo può avere 0+ record storici di modifiche.

```prisma
// Nel modello SystemModule
history ModuleHistory[]

// Nel modello ModuleHistory
module SystemModule @relation(fields: [moduleCode], references: [code], onDelete: Cascade)
```

**Caratteristiche**:
- **Cascade Delete**: Se cancelli modulo, cancelli tutto lo storico
- **Audit Trail**: Record immutabili per compliance
- **FK Reference**: moduleCode → SystemModule.code

### User → ModuleHistory (1:N)

Un utente può aver fatto 0+ modifiche sui moduli.

```prisma
// Nel modello User (da aggiungere)
moduleHistoryActions ModuleHistory[] @relation("ModuleHistoryPerformedBy")

// Nel modello ModuleHistory
user User @relation("ModuleHistoryPerformedBy", fields: [performedBy], references: [id])
```

**Caratteristiche**:
- **Named Relation**: "ModuleHistoryPerformedBy" per stabilità
- **Audit Trail**: Chi ha fatto cosa e quando
- **FK Reference**: performedBy → User.id

## 📝 Query Comuni

### Ottieni tutti moduli attivi

```typescript
const activeModules = await prisma.systemModule.findMany({
  where: { isEnabled: true },
  orderBy: [
    { category: 'asc' },
    { order: 'asc' }
  ],
  include: {
    settings: true
  }
});
```

### Ottieni settings di un modulo

```typescript
const whatsappSettings = await prisma.moduleSetting.findMany({
  where: { moduleCode: 'whatsapp' },
  orderBy: { order: 'asc' }
});
```

### Verifica dipendenze prima di disabilitare

```typescript
async function canDisableModule(moduleCode: string): Promise<boolean> {
  // Cerca moduli che dipendono da questo
  const dependentModules = await prisma.systemModule.findMany({
    where: {
      dependsOn: {
        has: moduleCode
      },
      isEnabled: true
    }
  });
  
  return dependentModules.length === 0;
}
```

### Log modifiche recenti

```typescript
const recentChanges = await prisma.moduleHistory.findMany({
  where: { 
    moduleCode: 'payments',
    createdAt: {
      gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Ultimi 7 giorni
    }
  },
  orderBy: { createdAt: 'desc' },
  take: 10,
  include: {
    user: {
      select: {
        firstName: true,
        lastName: true,
        email: true
      }
    }
  }
});
```

### Moduli per categoria con conteggio settings

```typescript
const modulesByCategory = await prisma.systemModule.findMany({
  where: { category: 'ADVANCED' },
  include: {
    _count: {
      select: { 
        settings: true,
        history: true
      }
    }
  }
});
```

### Update setting con audit log

```typescript
async function updateModuleSetting(
  moduleCode: string, 
  key: string, 
  newValue: string, 
  userId: string,
  reason?: string
) {
  return await prisma.$transaction(async (tx) => {
    // Ottieni valore precedente
    const oldSetting = await tx.moduleSetting.findUnique({
      where: { moduleCode_key: { moduleCode, key } }
    });
    
    // Aggiorna setting
    const updatedSetting = await tx.moduleSetting.update({
      where: { moduleCode_key: { moduleCode, key } },
      data: { value: newValue }
    });
    
    // Crea audit log
    await tx.moduleHistory.create({
      data: {
        moduleCode,
        action: 'SETTING_UPDATED',
        oldValue: { key, value: oldSetting?.value },
        newValue: { key, value: newValue },
        performedBy: userId,
        reason
      }
    });
    
    return updatedSetting;
  });
}
```

## 🔒 Sicurezza e Validazione

### Cascade Delete

Configurazione sicura per evitare dati orfani:

- **ModuleSetting**: `onDelete: Cascade` - Se elimini modulo, elimini settings
- **ModuleHistory**: `onDelete: Cascade` - Se elimini modulo, elimini history

### Unique Constraints

Prevenzione duplicati e consistenza dati:

- **SystemModule.code**: Previene moduli duplicati
- **(ModuleSetting.moduleCode, key)**: Un setting per chiave per modulo

### Index Performance

Tutti i campi frequently queried hanno index ottimizzati:

- **SystemModule**: code, category, isEnabled
- **ModuleSetting**: moduleCode
- **ModuleHistory**: moduleCode, action, createdAt

### Data Integrity

- **Enum constraints**: Valori controllati per category, type, action
- **Required fields**: Campi obbligatori per integrità
- **FK constraints**: Relazioni garantite dal database

## 📊 Capacità e Limiti

### Capacità Sistema

- **Moduli supportati**: Illimitati (target: 66 moduli iniziali)
- **Settings per modulo**: Illimitati
- **History records**: Illimitati (retention policy da implementare)
- **Dipendenze per modulo**: Illimitate (attenzione ai cicli)
- **Categorie**: 8 predefinite (estendibili)

### Limiti Tecnici

- **Circular dependencies**: Da controllare a livello applicativo
- **History retention**: Implementare cleanup per performance
- **Config JSON size**: PostgreSQL limit (~1GB, praticamente illimitato)
- **Concurrent updates**: Gestire race conditions

## 🔄 Migration Info

### File Migration

**Creata**: `XXXXXXXX_add-module-system.sql`

**Comandi**:
```bash
# Generata con
npx prisma migrate dev --name add-module-system

# Deploy in produzione
npx prisma migrate deploy
```

### Schema Changes

- **3 nuove tabelle**: system_modules, module_settings, module_history
- **3 nuovi enum**: ModuleCategory, SettingType, ModuleAction
- **6 nuovi index**: per performance query
- **4 relazioni FK**: con cascade delete

## 🧪 Testing e Validazione

### Verifica Schema

```bash
# Valida schema senza errori
npx prisma validate

# Genera client aggiornato
npx prisma generate

# Apri database GUI
npx prisma studio
```

### Test Query Base

```typescript
// Test connessione e tabelle
const moduleCount = await prisma.systemModule.count();
console.log(`SystemModule table exists, count: ${moduleCount}`);

const settingCount = await prisma.moduleSetting.count();
console.log(`ModuleSetting table exists, count: ${settingCount}`);

const historyCount = await prisma.moduleHistory.count();
console.log(`ModuleHistory table exists, count: ${historyCount}`);
```

### Verifica Relazioni

```typescript
// Test relazioni funzionanti
const moduleWithSettings = await prisma.systemModule.findFirst({
  include: {
    settings: true,
    history: {
      include: {
        user: true
      }
    }
  }
});
```

## 📚 Riferimenti e Standards

### Prisma Documentation

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Relations](https://www.prisma.io/docs/concepts/components/prisma-schema/relations)
- [Indexes](https://www.prisma.io/docs/concepts/components/prisma-schema/indexes)

### Convenzioni Progetto

- **ISTRUZIONI-PROGETTO.md**: Regole database vincolanti
- **ARCHITETTURA-SISTEMA-COMPLETA.md**: Contesto architetturale
- **ResponseFormatter Pattern**: Per API responses

### Database Standards

- **Naming**: snake_case per tabelle (@@map), camelCase per campi
- **Relations**: Sempre nominare con @relation("StableName")
- **Indexes**: Su tutti i campi di ricerca frequente
- **Audit**: Log completo per compliance

## 🎯 Next Steps

### SESSIONE 2: Seed Database

Preparazione automatica per popolare le tabelle:

1. **66 Moduli SystemModule**: Tutti i moduli del sistema mappati
2. **Settings Base**: Configurazioni default per ogni modulo
3. **Dependency Graph**: Relazioni between moduli configurate
4. **Test Completo**: Verifica funzionamento sistema

### SESSIONE 3+: Backend Services

1. **ModuleService**: Business logic gestione moduli
2. **API Routes**: Endpoint CRUD per moduli
3. **Dependency Resolver**: Logic controllo dipendenze
4. **Middleware**: Protezione basata su moduli attivi

---

## ⚡ Quick Reference

### Comandi Utili

```bash
# Database
npx prisma studio              # GUI database
npx prisma validate           # Verifica schema
npx prisma generate           # Rigenera client
npx prisma migrate dev        # Nuova migration

# Query
npx ts-node -e "..."          # Test query rapide
```

### Tabelle Created

| Tabella | Record | Scopo |
|---------|--------|--------|
| `system_modules` | 0 | Configurazione moduli |
| `module_settings` | 0 | Settings granulari |
| `module_history` | 0 | Audit trail |

### Files Importanti

- **Schema**: `backend/prisma/schema.prisma`
- **Migration**: `backend/prisma/migrations/*/migration.sql`
- **Docs**: `DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/MODULE-SYSTEM-DATABASE-SCHEMA.md`

---

**Fine Documentazione Schema v1.0**  
**Status**: ✅ Database Ready per SESSIONE 2  
**Next**: Seed 66 moduli + settings iniziali