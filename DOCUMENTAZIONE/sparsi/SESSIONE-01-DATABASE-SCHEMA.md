# 🗄️ SESSIONE 1: Database Schema + Migration
**Durata Stimata**: 2 ore  
**Complessità**: Media  
**Prerequisiti**: Nessuno

---

## 📋 PROMPT PER CLAUDE

```
Ciao Claude! Iniziamo l'implementazione del Sistema Gestione Moduli - SESSIONE 1 di 10.

📚 DOCUMENTI DA LEGGERE OBBLIGATORIAMENTE:
1. /ISTRUZIONI-PROGETTO.md (regole tecniche VINCOLANTI del progetto)
2. /LEGGIMI-DOCUMENTAZIONE.md (struttura documentazione)
3. /DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/CHECKLIST-FUNZIONALITA-SISTEMA.md (stato sistema)
4. /DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/ARCHITETTURA-SISTEMA-COMPLETA.md (architettura DB)

📖 RIFERIMENTI PIANO:
- Piano completo: /admin-implementation-plan.md
- Sessioni complete: /module-system-sessions.md
- Questo è STEP 1 del piano (Database Schema)

🎯 OBIETTIVO SESSIONE 1:
Creare schema Prisma per il sistema moduli e applicare migration al database.

📋 TASK DA COMPLETARE:

**1. LEGGERE DOCUMENTAZIONE PROGETTO**
Prima di iniziare, leggi ATTENTAMENTE:
- ISTRUZIONI-PROGETTO.md per capire le convenzioni
- Schema Prisma esistente in backend/prisma/schema.prisma
- Struttura database attuale (86+ tabelle)

**2. BACKUP SCHEMA ESISTENTE** ⚠️ CRITICO
```bash
cd backend
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)
```

**3. AGGIUNGERE MODELLI AL SCHEMA**
Apri `backend/prisma/schema.prisma` e aggiungi alla FINE del file:

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

// Enum per categorie moduli
enum ModuleCategory {
  CORE           // Autenticazione, utenti
  BUSINESS       // Richieste, preventivi, pagamenti
  COMMUNICATION  // Chat, notifiche, email, WhatsApp
  ADVANCED       // AI, portfolio, recensioni
  REPORTING      // Rapporti intervento, analytics
  AUTOMATION     // Cleanup, backup, scheduler
  INTEGRATIONS   // Google Maps, Stripe, WppConnect
  ADMIN          // Admin tools, script manager
}

// Enum per tipi di setting
enum SettingType {
  STRING
  NUMBER
  BOOLEAN
  JSON
  PASSWORD
  URL
  EMAIL
  PHONE
}

// Enum per azioni modulo
enum ModuleAction {
  ENABLED
  DISABLED
  CONFIG_CHANGED
  SETTING_UPDATED
  DEPENDENCY_ADDED
  DEPENDENCY_REMOVED
  MIGRATED
}
```

**4. AGGIORNARE MODEL USER**
Cerca il model `User` esistente e aggiungi questa relazione:

```prisma
model User {
  // ... campi esistenti ...
  
  // AGGIUNGI questa relazione
  moduleHistoryActions ModuleHistory[] @relation("ModuleHistoryPerformedBy")
  
  // ... resto del modello ...
}
```

**5. VALIDARE SCHEMA**
```bash
cd backend
npx prisma validate
```

Se ci sono errori, correggili prima di procedere.

**6. GENERARE CLIENT PRISMA**
```bash
npx prisma generate
```

**7. CREARE MIGRATION**
```bash
npx prisma migrate dev --name add-module-system
```

Questo creerà una migration con timestamp.

**8. VERIFICARE DATABASE**
```bash
npx prisma studio
```

Controlla che le 3 nuove tabelle siano presenti:
- system_modules
- module_settings  
- module_history

⚠️ REGOLE CRITICHE:
1. ✅ SEMPRE fare backup schema prima di modificare
2. ✅ Usare @relation nominata per TUTTE le relazioni
3. ✅ Seguire convenzioni snake_case per @@map
4. ✅ Index su campi ricercati frequentemente (code, category, isEnabled)
5. ✅ Enum in PascalCase, valori in UPPER_CASE
6. ✅ onDelete: Cascade per ModuleSetting e ModuleHistory
7. ✅ NON modificare modelli esistenti se non strettamente necessario
8. ✅ Testare migration prima di committare

📝 DOCUMENTAZIONE DA CREARE:

**File 1**: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-01-database-schema.md`

```markdown
# 📋 Report Sessione 1 - Database Schema Sistema Moduli

**Data**: 05/10/2025  
**Durata**: [inserisci ore effettive]  
**Status**: ✅ Completato / ⚠️ Parziale / ❌ Fallito

## 🎯 Obiettivo
Creare schema Prisma per sistema gestione moduli (3 tabelle, 3 enum).

## ✅ Completato
- [x] Backup schema esistente creato
- [x] Modello SystemModule aggiunto
- [x] Modello ModuleSetting aggiunto
- [x] Modello ModuleHistory aggiunto
- [x] Enum ModuleCategory, SettingType, ModuleAction
- [x] Relazioni configurate correttamente
- [x] Schema validato senza errori
- [x] Migration creata e applicata
- [x] Tabelle verificate in Prisma Studio

## 📦 File Creati/Modificati
- `backend/prisma/schema.prisma` (3 modelli + 3 enum aggiunti)
- `backend/prisma/schema.prisma.backup-YYYYMMDD-HHMMSS` (backup)
- `backend/prisma/migrations/XXXXXXXX_add-module-system/` (migration)

## 🗄️ Struttura Database Creata

### Tabelle
1. **system_modules** (tabella principale)
   - 20+ campi
   - 3 index (code, category, isEnabled)
   - Relazioni: 1:N ModuleSetting, 1:N ModuleHistory

2. **module_settings** (configurazioni)
   - 15+ campi
   - Unique constraint (moduleCode, key)
   - Cascade delete

3. **module_history** (audit log)
   - 10+ campi
   - 3 index (moduleCode, action, createdAt)
   - FK a User per tracking

### Enum
- ModuleCategory (8 valori)
- SettingType (8 valori)
- ModuleAction (7 valori)

## ✔️ Verifiche Effettuate
- ✅ Prisma validate OK
- ✅ Prisma generate OK
- ✅ Migration applicata senza errori
- ✅ Tabelle visibili in Prisma Studio
- ✅ Relazioni corrette
- ✅ Index creati

## ⚠️ Problemi Riscontrati
[Nessuno / Descrivi eventuali problemi e come sono stati risolti]

## 📊 Metriche
- Tempo impiegato: [X ore]
- Linee codice aggiunte: ~200
- Tabelle create: 3
- Enum creati: 3
- Relazioni: 4

## ➡️ Prossimi Passi
**SESSIONE 2**: Seed completo 66 moduli nel database

## 📸 Screenshot
[Aggiungi screenshot di Prisma Studio mostrando le 3 nuove tabelle]
```

**File 2**: `DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/MODULE-SYSTEM-DATABASE-SCHEMA.md`

```markdown
# 🗄️ Sistema Moduli - Database Schema

**Versione**: 1.0.0  
**Data**: 05/10/2025

## 📊 Panoramica
Schema database per gestione centralizzata on/off moduli sistema.

## 🏗️ Architettura

### Modello ER
```
SystemModule (1) -----> (N) ModuleSetting
SystemModule (1) -----> (N) ModuleHistory
User (1) -------------> (N) ModuleHistory
```

## 📋 Tabelle

### system_modules
Tabella principale per configurazione moduli.

**Campi Principali:**
- `code` (String, unique) - Codice univoco modulo (es: "reviews", "payments")
- `name` (String) - Nome visualizzato nell'UI
- `description` (Text) - Descrizione funzionalità
- `category` (ModuleCategory) - Categoria appartenenza
- `isEnabled` (Boolean) - Stato attivo/disattivo
- `isCore` (Boolean) - Se true, modulo non disabilitabile
- `dependsOn` (String[]) - Array codici moduli richiesti
- `requiredFor` (String[]) - Array codici moduli che richiedono questo
- `config` (Json) - Configurazioni specifiche modulo
- `features` (Json) - Feature flags {"premium": true, "beta": false}
- `icon` (String) - Emoji icona per UI
- `color` (String) - Colore hex categoria
- `order` (Int) - Ordinamento visualizzazione

**Index:**
- `code` - Lookup veloce per codice
- `category` - Filtro per categoria
- `isEnabled` - Query moduli attivi

**Esempio Record:**
```json
{
  "code": "reviews",
  "name": "Sistema Recensioni",
  "description": "Recensioni 1-5 stelle con commenti",
  "category": "ADVANCED",
  "isEnabled": true,
  "isCore": false,
  "dependsOn": ["requests"],
  "icon": "⭐",
  "color": "#F59E0B",
  "order": 40
}
```

### module_settings
Configurazioni granulari per ogni modulo.

**Campi Principali:**
- `moduleCode` (String, FK) - Riferimento a SystemModule
- `key` (String) - Chiave setting (es: "api_key", "max_retries")
- `value` (Text) - Valore setting
- `type` (SettingType) - Tipo dato
- `label` (String) - Label per UI
- `description` (String) - Descrizione setting
- `isRequired` (Boolean) - Campo obbligatorio
- `isSecret` (Boolean) - Campo sensibile (password, API key)
- `validation` (Json) - Regole validazione {min, max, pattern}
- `placeholder` (String) - Placeholder input UI
- `helpText` (String) - Testo aiuto
- `order` (Int) - Ordinamento UI

**Unique Constraint:**
- (moduleCode, key) - Un setting per chiave per modulo

**Esempio Record:**
```json
{
  "moduleCode": "whatsapp",
  "key": "session_name",
  "value": "production",
  "type": "STRING",
  "label": "Nome Sessione",
  "description": "Nome univoco sessione WhatsApp",
  "isRequired": true,
  "isSecret": false,
  "order": 1
}
```

### module_history
Log storico modifiche moduli (audit trail).

**Campi Principali:**
- `moduleCode` (String, FK) - Riferimento a SystemModule
- `action` (ModuleAction) - Tipo azione eseguita
- `oldValue` (Json) - Valore precedente
- `newValue` (Json) - Nuovo valore
- `performedBy` (String, FK) - ID utente che ha fatto modifica
- `ipAddress` (String) - IP richiesta
- `userAgent` (String) - Browser utilizzato
- `reason` (Text) - Motivazione modifica
- `createdAt` (DateTime) - Timestamp

**Index:**
- `moduleCode` - Storia per modulo
- `action` - Filtra per tipo azione
- `createdAt` - Ordine cronologico

**Esempio Record:**
```json
{
  "moduleCode": "reviews",
  "action": "DISABLED",
  "oldValue": {"isEnabled": true},
  "newValue": {"isEnabled": false},
  "performedBy": "cm123abc",
  "reason": "Manutenzione sistema recensioni",
  "createdAt": "2025-10-05T14:30:00Z"
}
```

## 🏷️ Enum

### ModuleCategory
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

### SettingType
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

### ModuleAction
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

## 🔗 Relazioni

### SystemModule → ModuleSetting (1:N)
Un modulo può avere 0+ settings.

```prisma
settings ModuleSetting[]
```

### SystemModule → ModuleHistory (1:N)
Un modulo può avere 0+ record storici.

```prisma
history ModuleHistory[]
```

### User → ModuleHistory (1:N)
Un utente può aver fatto 0+ modifiche moduli.

```prisma
moduleHistoryActions ModuleHistory[] @relation("ModuleHistoryPerformedBy")
```

## 📝 Query Comuni

### Ottieni tutti moduli attivi
```typescript
const activeModules = await prisma.systemModule.findMany({
  where: { isEnabled: true },
  orderBy: [
    { category: 'asc' },
    { order: 'asc' }
  ]
});
```

### Ottieni settings di un modulo
```typescript
const settings = await prisma.moduleSetting.findMany({
  where: { moduleCode: 'whatsapp' },
  orderBy: { order: 'asc' }
});
```

### Log modifiche recenti
```typescript
const recentChanges = await prisma.moduleHistory.findMany({
  where: { moduleCode: 'payments' },
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

### Moduli per categoria
```typescript
const advancedModules = await prisma.systemModule.findMany({
  where: { category: 'ADVANCED' },
  include: {
    _count: {
      select: { settings: true }
    }
  }
});
```

## 🔒 Sicurezza

### Cascade Delete
- ModuleSetting: `onDelete: Cascade` - Se elimini modulo, elimini settings
- ModuleHistory: `onDelete: Cascade` - Se elimini modulo, elimini history

### Unique Constraints
- `SystemModule.code` - Previene duplicati
- `(ModuleSetting.moduleCode, key)` - Un setting per chiave

### Index Performance
Tutti i campi frequently queried hanno index per performance.

## 📊 Capacità

- **Moduli supportati**: Illimitati (attualmente 66)
- **Settings per modulo**: Illimitati
- **History record**: Illimitati (con retention policy)
- **Dipendenze per modulo**: Illimitate

## 🔄 Migration

**File**: `XXXXXXXX_add-module-system.sql`

Creata con:
```bash
npx prisma migrate dev --name add-module-system
```

## 🧪 Testing

Verifica schema:
```bash
npx prisma validate
npx prisma generate
npx prisma studio
```

## 📚 Riferimenti
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- ISTRUZIONI-PROGETTO.md (regole database)
- ARCHITETTURA-SISTEMA-COMPLETA.md (contesto generale)
```

🧪 TESTING:

```bash
# 1. Valida schema
cd backend
npx prisma validate

# 2. Genera client
npx prisma generate

# 3. Applica migration
npx prisma migrate dev --name add-module-system

# 4. Verifica database
npx prisma studio
# Controlla che system_modules, module_settings, module_history esistano

# 5. Test query base
npx ts-node -e "
import { prisma } from './src/config/database';
async function test() {
  const count = await prisma.systemModule.count();
  console.log('SystemModule table exists, count:', count);
}
test().finally(() => prisma.$disconnect());
"
```

✅ CHECKLIST COMPLETAMENTO:

- [ ] Documenti progetto letti e compresi
- [ ] Backup schema creato
- [ ] Model SystemModule aggiunto
- [ ] Model ModuleSetting aggiunto  
- [ ] Model ModuleHistory aggiunto
- [ ] Enum ModuleCategory, SettingType, ModuleAction aggiunti
- [ ] Relazione User → ModuleHistory aggiunta
- [ ] Prisma validate OK (no errori)
- [ ] Prisma generate OK
- [ ] Migration creata e applicata
- [ ] Tabelle verificate in Prisma Studio
- [ ] Test query base funziona
- [ ] Report sessione creato
- [ ] Documentazione schema creata
- [ ] Screenshot Prisma Studio salvati
- [ ] File committati su Git (escluso backup)

📊 METRICHE SUCCESSO:
- ✅ Schema valida senza errori
- ✅ 3 tabelle create nel database
- ✅ 3 enum definiti
- ✅ 4 relazioni configurate
- ✅ Migration applicata senza errori
- ✅ Prisma Studio mostra nuove tabelle

🎯 RISULTATO ATTESO:
Al termine di questa sessione avrai:
- Schema Prisma completo per sistema moduli
- Database con 3 nuove tabelle vuote ma pronte
- Foundation per sessione 2 (seed 66 moduli)

➡️ PROSSIMA SESSIONE:
**SESSIONE 2**: Seed Completo 66 Moduli + Settings Predefiniti

---

Al termine, rispondi con:
1. ✅ Status di ogni task della checklist
2. 📸 Screenshot Prisma Studio con le 3 nuove tabelle
3. 📝 Path completo dei 2 file documentazione creati
4. ⚠️ Eventuali problemi riscontrati e come risolti
5. ➡️ Conferma: "SESSIONE 1 COMPLETATA - PRONTO PER SESSIONE 2"
```

---

## 📊 TRACKING AVANZAMENTO

Aggiorna il file `MODULE-SYSTEM-PROGRESS.md`:

```markdown
# Avanzamento Sistema Moduli

## Sessioni
- [x] **SESSIONE 1**: Database Schema ✅ Completata il __/__/____
- [ ] SESSIONE 2: Seed Moduli
- [ ] SESSIONE 3: Backend Service - Parte 1
- [ ] SESSIONE 4: Backend Service - Parte 2
- [ ] SESSIONE 5: Middleware Protezione
- [ ] SESSIONE 6: Protezione Routes
- [ ] SESSIONE 7: Frontend Components
- [ ] SESSIONE 8: Frontend Pages
- [ ] SESSIONE 9: Testing Suite
- [ ] SESSIONE 10: Deploy

## Note Sessione 1
- Durata effettiva: ____ ore
- Problemi: ____
- Output: Schema Prisma, 3 tabelle, migration
```
