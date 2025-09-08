# 🔧 PIANO RIMOZIONE MULTI-TENANCY - Sistema Richiesta Assistenza

## 📅 Data: 25 Gennaio 2025

## 🎯 OBIETTIVO
Rimuovere completamente il sistema multi-tenancy (organizationId) che non ha senso per questo progetto e allineare il sistema alla documentazione originale.

## 📊 ANALISI IMPATTO

### Tabelle Database da Modificare:
1. ❌ **Rimuovere completamente**: tabella `Organization`
2. ✏️ **Rimuovere organizationId da**:
   - User
   - Category
   - AssistanceRequest
   - Quote
   - Payment
   - Notification
   - Message
   - ApiKey

### File Backend da Modificare:
1. `backend/prisma/schema.prisma` - rimuovere Organization e tutti i riferimenti
2. `backend/src/middleware/organization.middleware.ts` - ELIMINARE
3. `backend/src/services/*.ts` - rimuovere tutti i filtri organizationId
4. `backend/src/routes/*.ts` - rimuovere controlli organization
5. `backend/src/types/index.ts` - rimuovere tipi organization

### File Frontend da Modificare:
1. `src/contexts/AuthContext.tsx` - rimuovere organizationId
2. `src/services/api.ts` - rimuovere header organization
3. Tutti i componenti che filtrano per organization

## 📝 MODIFICHE DETTAGLIATE

### 1. SCHEMA PRISMA - NUOVO SEMPLIFICATO

```prisma
// RIMUOVERE:
model Organization { ... } // ELIMINARE COMPLETAMENTE

// User - RIMUOVERE:
organizationId    String  // RIMUOVERE
organization      Organization @relation(...) // RIMUOVERE

// Category - RIMUOVERE:
organizationId    String  // RIMUOVERE
organization      Organization @relation(...) // RIMUOVERE
@@unique([organizationId, slug]) // CAMBIARE in @@unique([slug])

// AssistanceRequest - RIMUOVERE:
organizationId    String  // RIMUOVERE
organization      Organization @relation(...) // RIMUOVERE

// Quote - RIMUOVERE:
organizationId    String  // RIMUOVERE
organization      Organization @relation(...) // RIMUOVERE

// Payment - RIMUOVERE:
organizationId    String  // RIMUOVERE
organization      Organization @relation(...) // RIMUOVERE

// Notification - RIMUOVERE:
organizationId    String  // RIMUOVERE
organization      Organization @relation(...) // RIMUOVERE

// Message - RIMUOVERE:
organizationId    String  // RIMUOVERE
organization      Organization @relation(...) // RIMUOVERE

// ApiKey - MODIFICARE:
// Da: @@unique([service, organizationId])
// A: @@unique([service])
organizationId    String  // RIMUOVERE
organization      Organization @relation(...) // RIMUOVERE
```

### 2. MIGRATION DATI

```sql
-- Backup prima di tutto
CREATE TABLE users_backup AS SELECT * FROM "User";
CREATE TABLE categories_backup AS SELECT * FROM "Category";
CREATE TABLE assistance_requests_backup AS SELECT * FROM "AssistanceRequest";

-- Rimuovere constraint foreign key
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_organizationId_fkey";
ALTER TABLE "AssistanceRequest" DROP CONSTRAINT IF EXISTS "AssistanceRequest_organizationId_fkey";
ALTER TABLE "Quote" DROP CONSTRAINT IF EXISTS "Quote_organizationId_fkey";
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_organizationId_fkey";
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_organizationId_fkey";
ALTER TABLE "Message" DROP CONSTRAINT IF EXISTS "Message_organizationId_fkey";
ALTER TABLE "ApiKey" DROP CONSTRAINT IF EXISTS "ApiKey_organizationId_fkey";

-- Rimuovere colonne
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "AssistanceRequest" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Quote" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Payment" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Notification" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Message" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "ApiKey" DROP COLUMN IF EXISTS "organizationId";

-- Eliminare tabella Organization
DROP TABLE IF EXISTS "Organization";
```

### 3. CODICE BACKEND - SEMPLIFICAZIONI

#### Esempio Service (request.service.ts):
```typescript
// PRIMA (con organization):
async getRequests(organizationId: string, filters?: any) {
  return await prisma.assistanceRequest.findMany({
    where: {
      organizationId, // RIMUOVERE
      ...filters
    }
  });
}

// DOPO (semplificato):
async getRequests(filters?: any) {
  return await prisma.assistanceRequest.findMany({
    where: filters
  });
}
```

#### Middleware da ELIMINARE:
- `organization.middleware.ts` - ELIMINARE COMPLETAMENTE
- Rimuovere da tutti i route files

### 4. FRONTEND - SEMPLIFICAZIONI

#### AuthContext:
```typescript
// PRIMA:
interface User {
  organizationId: string; // RIMUOVERE
  organization?: Organization; // RIMUOVERE
}

// DOPO:
interface User {
  id: string;
  email: string;
  role: Role;
  // ... altri campi utente
}
```

## 🚨 RISCHI E MITIGAZIONI

### Rischi:
1. **Perdita dati**: Backup completo database prima di iniziare
2. **Breaking changes API**: Testare tutti gli endpoint
3. **Frontend crash**: Verificare tutti i componenti

### Mitigazioni:
1. ✅ Backup completo database
2. ✅ Test su ambiente development
3. ✅ Modifiche incrementali con test ad ogni step
4. ✅ Rollback plan pronto

## 📋 CHECKLIST ESECUZIONE

### Pre-Modifiche:
- [ ] Backup database completo
- [ ] Backup schema.prisma
- [ ] Backup tutti i services
- [ ] Stop del sistema

### Modifiche Database:
- [ ] Modificare schema.prisma
- [ ] Generare migration: `npx prisma migrate dev --name remove-multitenancy`
- [ ] Applicare migration
- [ ] Verificare database

### Modifiche Backend:
- [ ] Aggiornare tutti i services
- [ ] Rimuovere organization middleware
- [ ] Aggiornare routes
- [ ] Aggiornare types

### Modifiche Frontend:
- [ ] Aggiornare AuthContext
- [ ] Aggiornare API calls
- [ ] Verificare componenti

### Test:
- [ ] Test login/register
- [ ] Test creazione richiesta
- [ ] Test creazione preventivo
- [ ] Test notifiche
- [ ] Test completo end-to-end

### Post-Modifiche:
- [ ] Aggiornare documentazione
- [ ] Commit changes
- [ ] Report sessione

## 🎯 RISULTATO ATTESO

Sistema semplificato senza multi-tenancy dove:
- **Clienti**: creano richieste di assistenza
- **Professionisti**: rispondono con preventivi
- **Admin**: gestiscono il sistema
- **Nessuna Organization**: tutto in un unico sistema condiviso

## ⏱️ TEMPO STIMATO

- Preparazione e backup: 30 minuti
- Modifiche database: 1 ora
- Modifiche backend: 2 ore
- Modifiche frontend: 1 ora
- Test completi: 1 ora
- **TOTALE: ~5-6 ore**

## 🔄 ROLLBACK PLAN

In caso di problemi:
1. Ripristinare backup database
2. Ripristinare schema.prisma originale
3. Ripristinare codice da git
4. Restart sistema

---

**NOTA**: Questo è un cambiamento MAJOR che richiede attenzione e test approfonditi.
