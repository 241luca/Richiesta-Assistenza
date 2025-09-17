# 📘 FASE 2: BACKEND REFACTORING
## Rimozione Multi-tenancy - Backend Services

---

## 📋 PROMPT PER CLAUDE - FASE 2

```
Sono un assistente che deve completare la FASE 2 della rimozione del multi-tenancy dal sistema Richiesta Assistenza.

CONTESTO:
- La FASE 1 è stata completata: il database non ha più organizationId
- Lo schema Prisma è stato aggiornato e sincronizzato
- Ora il backend TypeScript deve essere aggiornato per rimuovere tutti i riferimenti a organizationId

OBIETTIVO FASE 2:
Refactoring completo del backend per rimuovere ogni riferimento a organization e organizationId.

DEVO:
1. Identificare tutti i file che contengono "organizationId"
2. Rimuovere il middleware organization.middleware.ts
3. Aggiornare tutti i services per rimuovere filtri organizationId
4. Aggiornare tutti i routes per rimuovere controlli organization
5. Aggiornare types e interfaces
6. Testare che il backend compili e funzioni
7. Aggiornare la documentazione
8. Aggiornare il PIANO-MASTER con lo stato di completamento

FILE PRINCIPALI DA MODIFICARE:
- /backend/src/middleware/organization.middleware.ts (ELIMINARE)
- /backend/src/services/*.service.ts (tutti)
- /backend/src/routes/*.routes.ts (tutti)
- /backend/src/types/index.ts
- /backend/src/utils/validators.ts (se presente)

IMPORTANTE:
- Fare backup di ogni file prima di modificarlo
- Testare la compilazione dopo ogni gruppo di modifiche
- Documentare tutti i cambiamenti
- Non modificare la logica business, solo rimuovere organizationId
```

---

## 🔧 ISTRUZIONI DETTAGLIATE FASE 2

### STEP 2.1: IDENTIFICAZIONE FILE DA MODIFICARE
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Crea backup della directory src
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# Identifica tutti i file con organizationId
grep -r "organizationId" src/ --include="*.ts" > files_with_organizationId.txt

# Identifica tutti i file con Organization (tipo/interface)
grep -r "Organization" src/ --include="*.ts" | grep -v "organizationId" > files_with_organization_type.txt

# Lista dei file da modificare
echo "File da modificare:"
cat files_with_organizationId.txt | cut -d: -f1 | sort | uniq
```

### STEP 2.2: ELIMINAZIONE ORGANIZATION MIDDLEWARE
```bash
# Elimina il middleware organization
rm -f src/middleware/organization.middleware.ts

# Rimuovi import del middleware da tutti i routes
find src/routes -name "*.ts" -exec sed -i.bak "/organization\.middleware/d" {} \;
find src/routes -name "*.ts" -exec sed -i.bak "/organizationMiddleware/d" {} \;
```

### STEP 2.3: AGGIORNAMENTO SERVICES

#### Pattern di modifica per i services:
```typescript
// PRIMA:
async getAll(organizationId: string, filters?: any) {
  return await prisma.model.findMany({
    where: {
      organizationId,
      ...filters
    }
  });
}

// DOPO:
async getAll(filters?: any) {
  return await prisma.model.findMany({
    where: filters
  });
}
```

#### Lista services da modificare:
1. `src/services/request.service.ts`
2. `src/services/quote.service.ts`
3. `src/services/category.service.ts`
4. `src/services/subcategory.service.ts`
5. `src/services/notification.service.ts`
6. `src/services/apiKey.service.ts`
7. `src/services/payment.service.ts` (se presente)

### STEP 2.4: AGGIORNAMENTO ROUTES

#### Pattern di modifica per i routes:
```typescript
// PRIMA:
router.get('/requests', authenticate, organizationMiddleware, async (req, res) => {
  const { organizationId } = req;
  const requests = await requestService.getAll(organizationId);
});

// DOPO:
router.get('/requests', authenticate, async (req, res) => {
  const requests = await requestService.getAll();
});
```

### STEP 2.5: AGGIORNAMENTO TYPES
```typescript
// File: src/types/index.ts o src/types/express.d.ts

// RIMUOVERE:
declare global {
  namespace Express {
    interface Request {
      organizationId?: string;
      organization?: any;
    }
  }
}

// RIMUOVERE da User interface:
interface User {
  // organizationId: string; // RIMUOVERE
  // organization?: Organization; // RIMUOVERE
}
```

### STEP 2.6: TEST COMPILAZIONE
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Pulisci e ricompila
rm -rf dist
npm run build

# Se ci sono errori di compilazione, risolverli uno alla volta
# Gli errori più comuni saranno:
# - "Property 'organizationId' does not exist"
# - "Expected X arguments, but got Y"

# Test con TypeScript compiler
npx tsc --noEmit
```

### STEP 2.7: TEST FUNZIONALE
```bash
# Avvia il backend in modalità development
npm run dev

# In un altro terminale, testa gli endpoint principali
curl http://localhost:3200/api/health

# Test login
curl -X POST http://localhost:3200/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test get categories (senza organizationId)
curl http://localhost:3200/api/categories \
  -H "Authorization: Bearer [TOKEN]"
```

### STEP 2.8: DOCUMENTAZIONE
Creare/aggiornare:
1. `/backend/README.md` - Rimuovere riferimenti a multi-tenancy
2. `/REPORT-SESSIONI-CLAUDE/2025-01-GENNAIO/fase2-backend-refactoring.md`
3. `/PIANO-MASTER-RIMOZIONE-MULTITENANCY.md` - Segnare FASE 2 come ✅

---

## 📝 CHECKLIST MODIFICHE PER FILE

### Services Checklist:
- [ ] `request.service.ts` - Rimuovere organizationId da tutte le query
- [ ] `quote.service.ts` - Rimuovere organizationId da tutte le query
- [ ] `category.service.ts` - Rimuovere organizationId da tutte le query
- [ ] `subcategory.service.ts` - Verificare non usi organizationId
- [ ] `notification.service.ts` - Rimuovere organizationId da create/query
- [ ] `apiKey.service.ts` - Rimuovere organizationId, ora è globale
- [ ] `user.service.ts` - Rimuovere join con Organization

### Routes Checklist:
- [ ] `auth.routes.ts` - Rimuovere organization da response login
- [ ] `request.routes.ts` - Rimuovere middleware e parametri
- [ ] `quote.routes.ts` - Rimuovere middleware e parametri
- [ ] `category.routes.ts` - Rimuovere middleware e parametri
- [ ] `admin.routes.ts` - Rimuovere gestione organizations

### Altri File:
- [ ] `src/types/index.ts` - Rimuovere Organization type
- [ ] `src/middleware/` - Eliminare organization.middleware.ts
- [ ] `src/server.ts` - Rimuovere import organization middleware

---

## 🔄 ROLLBACK FASE 2 (SE NECESSARIO)

```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Ripristina backup del codice
rm -rf src
cp -r src.backup.[TIMESTAMP] src

# Ricompila
npm run build
```

---

## ✅ CRITERI DI COMPLETAMENTO FASE 2

La FASE 2 è considerata COMPLETA quando:
- ✅ Nessun file contiene "organizationId"
- ✅ organization.middleware.ts eliminato
- ✅ Tutti i services aggiornati
- ✅ Tutti i routes aggiornati
- ✅ TypeScript compila senza errori
- ✅ Backend avviabile con npm run dev
- ✅ Test API di base funzionanti
- ✅ Documentazione aggiornata

---

## 📊 TEST DI VALIDAZIONE FINALE

```bash
# Script di validazione
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

echo "=== VALIDAZIONE FASE 2 ==="

# 1. Verifica assenza organizationId
echo "Checking for organizationId references..."
grep -r "organizationId" src/ --include="*.ts" | grep -v "backup"
# Dovrebbe essere vuoto

# 2. Verifica compilazione
echo "Testing TypeScript compilation..."
npx tsc --noEmit

# 3. Test avvio backend
echo "Starting backend..."
timeout 10 npm run dev

echo "FASE 2 COMPLETATA ✅"
```

---

**NOTA PER L'ESECUTORE**: 
- Tempo stimato: 3 ore
- Modificare un service alla volta
- Testare dopo ogni modifica importante
- Committare frequentemente su Git
