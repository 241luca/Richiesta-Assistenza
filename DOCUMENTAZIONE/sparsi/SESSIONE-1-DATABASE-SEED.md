# 🗄️ SESSIONE 1: Database e Configurazione Iniziale Moduli
**Durata Stimata**: 3 ore  
**Difficoltà**: Media  
**Cosa faremo**: Creeremo le tabelle nel database per gestire i moduli e inseriremo tutti i 66 moduli del sistema

---

## 📋 PROMPT DA DARE A CLAUDE

Copia e incolla questo prompt in una nuova chat con Claude:

```
Ciao Claude! Iniziamo l'implementazione del Sistema Gestione Moduli - Sessione 1.

📚 PRIMA DI INIZIARE, LEGGI QUESTI FILE (IMPORTANTE!):
1. /ISTRUZIONI-PROGETTO.md (contiene TUTTE le regole del progetto)
2. /DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/CHECKLIST-FUNZIONALITA-SISTEMA.md
3. /DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/ARCHITETTURA-SISTEMA-COMPLETA.md

🎯 OBIETTIVO SESSIONE 1:
Creare nel database le tabelle necessarie per gestire i moduli del sistema e inserire tutti i 66 moduli esistenti.

📝 COSA DEVI FARE (segui questi passi in ordine):

**PASSO 1: BACKUP DEL DATABASE SCHEMA**
MOLTO IMPORTANTE - Prima di modificare qualsiasi cosa:
```bash
cd backend
cp prisma/schema.prisma prisma/schema.prisma.backup-$(date +%Y%m%d-%H%M%S)
```

**PASSO 2: AGGIUNGI LE NUOVE TABELLE**
Apri il file `backend/prisma/schema.prisma` e aggiungi alla fine questi 3 modelli:

```prisma
// ============================================
// SISTEMA GESTIONE MODULI
// ============================================

model SystemModule {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?  @db.Text
  category    ModuleCategory
  
  // Stato del modulo
  isEnabled   Boolean  @default(true)
  isCore      Boolean  @default(false)  // Se true, non può essere disabilitato
  
  // Dipendenze tra moduli
  dependsOn   String[]  // Moduli richiesti per funzionare
  requiredFor String[]  // Moduli che dipendono da questo
  
  // Configurazioni
  config      Json?     // Impostazioni specifiche del modulo
  features    Json?     // Feature flags
  
  // Tracking modifiche
  enabledAt   DateTime?
  enabledBy   String?
  disabledAt  DateTime?
  disabledBy  String?
  
  // UI
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
  category    String?
  
  isRequired  Boolean      @default(false)
  isSecret    Boolean      @default(false)
  validation  Json?
  
  placeholder String?
  helpText    String?
  order       Int          @default(100)
  
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
  
  @@unique([moduleCode, key])
  @@index([moduleCode])
}

model ModuleHistory {
  id          String       @id @default(cuid())
  moduleCode  String
  module      SystemModule @relation(fields: [moduleCode], references: [code])
  
  action      ModuleAction
  oldValue    Json?
  newValue    Json?
  
  performedBy String
  user        User         @relation(fields: [performedBy], references: [id])
  
  ipAddress   String?
  userAgent   String?
  reason      String?
  
  createdAt   DateTime     @default(now())
  
  @@index([moduleCode])
  @@index([action])
  @@index([createdAt])
}

// Enum per categorie moduli
enum ModuleCategory {
  CORE           // Autenticazione, utenti base
  BUSINESS       // Richieste, preventivi, pagamenti
  COMMUNICATION  // Chat, notifiche, email, WhatsApp
  ADVANCED       // AI, portfolio, recensioni
  AUTOMATION     // Backup, cleanup, scheduler
  INTEGRATIONS   // Google Maps, Stripe, OpenAI
  REPORTING      // Rapporti intervento, analytics
  ADMIN          // Strumenti amministrazione
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

// Enum per azioni sui moduli
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

**IMPORTANTE**: Nel modello `User` devi aggiungere questa relazione:
```prisma
model User {
  // ... campi esistenti ...
  
  // Aggiungi questa riga
  moduleHistory ModuleHistory[]
}
```

**PASSO 3: ESEGUI LA MIGRATION**
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name add-module-system
```

Se vedi errori, fermati e dimmelo!

**PASSO 4: CREA IL FILE SEED**
Crea il file `backend/prisma/seeds/modules.seed.ts` con questo contenuto:

[IL FILE È MOLTO LUNGO - Vedi il documento module-system-sessions.md per il contenuto completo del seed]

Il seed deve contenere TUTTI i 66 moduli divisi in queste categorie:
- CORE (6 moduli): auth, auth-2fa, users, profiles, security, session-management
- BUSINESS (8 moduli): requests, request-workflow, quotes, quote-templates, quotes-advanced, categories, calendar, scheduled-interventions
- PAYMENTS (5 moduli): payments, invoices, payouts, payment-splits, refunds
- COMMUNICATION (9 moduli): notifications, notification-templates, notification-queue, chat, chat-advanced, email-system, whatsapp, whatsapp-groups, whatsapp-media
- ADVANCED (10 moduli): reviews, portfolio, certifications, verified-badge, ai-assistant, ai-categorization, ai-knowledge-base, referral, loyalty-points, price-range
- REPORTING (7 moduli): intervention-reports, report-templates, report-materials, report-signatures, report-export, analytics, reports-scheduled
- AUTOMATION (6 moduli): backup-system, backup-scheduling, cleanup-system, cleanup-scheduling, scheduler, queue-system
- INTEGRATIONS (5 moduli): google-maps, google-calendar, stripe, brevo-email, openai
- ADMIN (10 moduli): admin-dashboard, user-management, system-settings, script-manager, health-monitor, audit-log, api-keys, legal-documents, enum-manager, test-history

**PASSO 5: AGGIORNA IL FILE SEED PRINCIPALE**
Modifica `backend/prisma/seed.ts` e aggiungi:

```typescript
import { seedModules, seedModuleSettings } from './seeds/modules.seed';

async function main() {
  // ... codice esistente per seed altri dati ...
  
  // Aggiungi queste righe
  console.log('🔧 Seeding module system...');
  await seedModules();
  await seedModuleSettings();
}
```

**PASSO 6: ESEGUI IL SEED**
```bash
cd backend
npx prisma db seed
```

Dovresti vedere un output simile a:
```
🔧 Seeding module system...
📦 Seeding 66 moduli...
✅ Seed completato!
   📦 Totale moduli: 66
   ✨ Nuovi: 66
📊 Breakdown per categoria:
   🔴 CORE: 6
   🟢 BUSINESS: 8
   ... ecc
```

**PASSO 7: VERIFICA NEL DATABASE**
```bash
npx prisma studio
```

Controlla che:
- Tabella `SystemModule` esista e contenga 66 record
- Tabella `ModuleSetting` esista
- Tabella `ModuleHistory` esista

**PASSO 8: TEST RAPIDO**
Esegui questo test per verificare che tutto funzioni:

```bash
cd backend
npx ts-node -e "
import { prisma } from './src/config/database';
async function test() {
  const count = await prisma.systemModule.count();
  console.log('✅ Moduli totali:', count);
  
  const enabled = await prisma.systemModule.count({
    where: { isEnabled: true }
  });
  console.log('✅ Moduli attivi:', enabled);
  
  const core = await prisma.systemModule.count({
    where: { isCore: true }
  });
  console.log('✅ Moduli core:', core);
}
test();
"
```

Dovresti vedere:
```
✅ Moduli totali: 66
✅ Moduli attivi: 66
✅ Moduli core: 15 (circa)
```

---

## 📝 DOCUMENTAZIONE DA CREARE

Alla fine crea questi 2 documenti:

**1. Report Sessione**
Crea `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-1-database-moduli.md`:

```markdown
# Report Sessione 1 - Database Sistema Moduli

**Data**: 05/10/2025
**Durata**: [scrivi quanto ci hai messo]
**Status**: ✅ Completato

## Obiettivo
Implementare database schema per sistema gestione moduli.

## Completato
- [x] Schema Prisma (3 modelli: SystemModule, ModuleSetting, ModuleHistory)
- [x] 3 Enum (ModuleCategory, SettingType, ModuleAction)
- [x] Migration eseguita
- [x] Seed 66 moduli creato
- [x] Seed settings predefiniti
- [x] Database popolato e verificato

## File Creati/Modificati
- `backend/prisma/schema.prisma` (aggiunti 3 modelli + 3 enum)
- `backend/prisma/seeds/modules.seed.ts` (nuovo)
- `backend/prisma/seed.ts` (aggiornato)

## Backup Creati
- `schema.prisma.backup-[DATA-ORA]`

## Verifica Finale
- ✅ Migration applicata senza errori
- ✅ 66 moduli inseriti nel database
- ✅ Settings predefiniti presenti
- ✅ Prisma Studio mostra tabelle correttamente
- ✅ Test count moduli funzionante

## Problemi Riscontrati
[Scrivi qui se hai avuto problemi, altrimenti "Nessuno"]

## Prossimi Passi
Sessione 2: Backend Service + Routes API
```

**2. Documentazione Tecnica**
Crea `DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/MODULE-SYSTEM-DATABASE.md`:

```markdown
# Sistema Moduli - Database Schema

## Panoramica
Schema database per gestione on/off moduli sistema.

## Tabelle Create

### SystemModule
Tabella principale per configurazione moduli.

**Campi principali:**
- `code` - Codice univoco modulo (es: "reviews", "whatsapp")
- `name` - Nome visualizzato (es: "Sistema Recensioni")
- `category` - Categoria di appartenenza
- `isEnabled` - Se true, modulo attivo
- `isCore` - Se true, non può essere disabilitato
- `dependsOn` - Array moduli richiesti
- `icon` - Emoji per UI
- `color` - Colore categoria

### ModuleSetting
Configurazioni granulari per ogni modulo.

**Esempio**: Per WhatsApp abbiamo settings come:
- session_name
- qr_refresh_interval
- auto_reconnect

### ModuleHistory
Log storico di tutte le modifiche ai moduli.

Traccia chi ha fatto cosa e quando.

## Categorie Moduli

- **CORE** - Funzioni essenziali (auth, users, security)
- **BUSINESS** - Logica business (richieste, preventivi, pagamenti)
- **COMMUNICATION** - Comunicazione (chat, email, WhatsApp)
- **ADVANCED** - Funzionalità avanzate (AI, recensioni, portfolio)
- **AUTOMATION** - Automazione (backup, cleanup)
- **INTEGRATIONS** - Integrazioni esterne (Stripe, Google Maps)
- **REPORTING** - Reportistica (rapporti, analytics)
- **ADMIN** - Amministrazione (dashboard, settings)

## Moduli Inseriti

Totale: 66 moduli
- CORE: 6
- BUSINESS: 8
- PAYMENTS: 5
- COMMUNICATION: 9
- ADVANCED: 10
- REPORTING: 7
- AUTOMATION: 6
- INTEGRATIONS: 5
- ADMIN: 10

## Query Utili

**Contare moduli attivi:**
```prisma
prisma.systemModule.count({
  where: { isEnabled: true }
})
```

**Ottenere moduli per categoria:**
```prisma
prisma.systemModule.findMany({
  where: { category: 'BUSINESS' }
})
```

**Verificare se modulo abilitato:**
```prisma
prisma.systemModule.findUnique({
  where: { code: 'reviews' }
})
```
```

---

## ✅ CHECKLIST COMPLETAMENTO

Spunta ogni voce man mano che la completi:

- [ ] Backup schema.prisma creato
- [ ] 3 modelli aggiunti a schema.prisma (SystemModule, ModuleSetting, ModuleHistory)
- [ ] 3 enum aggiunti (ModuleCategory, SettingType, ModuleAction)
- [ ] Relazione aggiunta al modello User
- [ ] Migration eseguita con successo
- [ ] File modules.seed.ts creato
- [ ] Seed principale aggiornato
- [ ] Seed eseguito (66 moduli inseriti)
- [ ] Verifica con Prisma Studio OK
- [ ] Test count moduli eseguito
- [ ] Report sessione creato
- [ ] Documentazione database creata
- [ ] File committati su Git (SENZA i backup!)

## 🎯 RISULTATO ATTESO

Alla fine dovresti avere:
- ✅ 3 nuove tabelle nel database
- ✅ 66 moduli configurati
- ✅ Seed funzionante
- ✅ Tutto documentato

## 💾 COMANDI GIT

Quando hai finito tutto:

```bash
# Verifica cosa hai modificato
git status

# Aggiungi i file (NON i backup!)
git add backend/prisma/schema.prisma
git add backend/prisma/seeds/modules.seed.ts
git add backend/prisma/seed.ts
git add DOCUMENTAZIONE/

# Commit
git commit -m "feat: add module system database schema and seed

- Add SystemModule, ModuleSetting, ModuleHistory tables
- Add 3 enums: ModuleCategory, SettingType, ModuleAction
- Seed 66 modules across 8 categories
- Add module system documentation"

# Push
git push origin main
```

---

## ❓ SE HAI PROBLEMI

**Errore durante migration:**
- Controlla che PostgreSQL sia avviato
- Verifica il file .env abbia DATABASE_URL corretto
- Prova a fare reset: `npx prisma migrate reset` (ATTENZIONE: cancella tutti i dati!)

**Seed non funziona:**
- Verifica che il file modules.seed.ts sia nella cartella giusta
- Controlla che sia esportato correttamente
- Verifica import in seed.ts

**Prisma Studio non mostra tabelle:**
- Riavvia Prisma Studio
- Verifica che migration sia stata eseguita

---

🎉 **QUANDO HAI FINITO, SEI PRONTO PER LA SESSIONE 2!**

Segna completato nel file AVANZAMENTO-MODULI.md e passa alla Sessione 2.
```

---

## 📌 NOTE IMPORTANTI

1. **SEMPRE FARE BACKUP** prima di modificare il database
2. **VERIFICARE** che ogni comando completi senza errori
3. **DOCUMENTARE** tutto quello che fai
4. **NON COMMITTARE** file di backup su Git

Buon lavoro! 🚀
