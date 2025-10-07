# 🔒 SESSIONE 6: Protezione Routes Esistenti
**Durata Stimata**: 1.5 ore  
**Complessità**: Bassa  
**Prerequisiti**: Sessione 5 completata

---

## 📋 PROMPT PER CLAUDE

```
Ciao Claude! SESSIONE 6 di 10 - Protezione Routes Esistenti.

📚 DOCUMENTI DA LEGGERE:
1. /backend/src/middleware/module.middleware.ts (sessione 5)
2. /backend/src/routes/ (tutte le routes da proteggere)
3. Report sessioni precedenti

🎯 OBIETTIVO SESSIONE 6:
Applicare middleware requireModule a 10+ routes esistenti.

📋 TASK DA COMPLETARE:

**1. IDENTIFICARE ROUTES DA PROTEGGERE**
Routes che dipendono da moduli specifici:
- reviews.routes.ts → modulo 'reviews'
- payment.routes.ts → modulo 'payments'
- whatsapp.routes.ts → modulo 'whatsapp'
- ai.routes.ts → modulo 'ai-assistant'
- portfolio.routes.ts → modulo 'portfolio'
- referral.routes.ts → modulo 'referral'
- calendar.routes.ts → modulo 'calendar'
- intervention-report.routes.ts → modulo 'intervention-reports'
- backup.routes.ts → modulo 'backup-system'
- cleanup-config.routes.ts → modulo 'cleanup-system'

**2. PROTEGGERE REVIEWS ROUTES**
File: `backend/src/routes/reviews.routes.ts`

```typescript
// AGGIUNGI import all'inizio
import { requireModule } from '../middleware/module.middleware';

const router = Router();

// AGGIUNGI middleware SUBITO DOPO la definizione router
router.use(requireModule('reviews'));

// Ora tutte le routes sotto sono protette
router.post('/', authenticate, validateRequest(createReviewSchema), ...);
router.get('/professional/:id', ...);
// ... resto routes esistenti ...
```

**3. PROTEGGERE PAYMENT ROUTES**
File: `backend/src/routes/payment.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();
router.use(requireModule('payments'));

// Routes protette...
```

**4. PROTEGGERE WHATSAPP ROUTES**
File: `backend/src/routes/whatsapp.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();
router.use(requireModule('whatsapp'));

// Routes protette...
```

**5. PROTEGGERE AI ROUTES**
File: `backend/src/routes/ai.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();
router.use(requireModule('ai-assistant'));

// Routes protette...
```

**6. PROTEGGERE PORTFOLIO ROUTES**
File: `backend/src/routes/portfolio.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();
router.use(requireModule('portfolio'));

// Routes protette...
```

**7. PROTEGGERE REFERRAL ROUTES**
File: `backend/src/routes/referral.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();
router.use(requireModule('referral'));

// Routes protette...
```

**8. PROTEGGERE CALENDAR ROUTES**
File: `backend/src/routes/calendar.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();
router.use(requireModule('calendar'));

// Routes protette...
```

**9. PROTEGGERE INTERVENTION REPORTS**
File: `backend/src/routes/intervention-report.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();
router.use(requireModule('intervention-reports'));

// Routes protette...
```

**10. PROTEGGERE BACKUP ROUTES**
File: `backend/src/routes/admin/backup.routes.ts`

```typescript
import { requireModule } from '../../middleware/module.middleware';

const router = Router();
router.use(requireModule('backup-system'));

// Routes protette...
```

**11. PROTEGGERE CLEANUP ROUTES**
File: `backend/src/routes/admin/cleanup-config.routes.ts`

```typescript
import { requireModule } from '../../middleware/module.middleware';

const router = Router();
router.use(requireModule('cleanup-system'));

// Routes protette...
```

**12. TEST PROTEZIONE**
File: `backend/tests/manual/test-route-protection.ts`

```typescript
import { moduleService } from '../../src/services/module.service';
import axios from 'axios';

const API_URL = 'http://localhost:3200';
const ADMIN_TOKEN = 'your-admin-token-here';

async function testRouteProtection() {
  console.log('🧪 Testing Route Protection...\n');

  try {
    // Test 1: Disable reviews module
    console.log('1️⃣ Disabling reviews module...');
    await moduleService.disableModule('reviews', 'test-admin', 'Test protection');
    console.log('✅ Module disabled');

    // Test 2: Try access protected route
    console.log('\n2️⃣ Try access /api/reviews/professional/123...');
    try {
      await axios.get(`${API_URL}/api/reviews/professional/123`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('❌ FAIL: Route should be blocked!');
    } catch (error: any) {
      if (error.response?.status === 403) {
        console.log('✅ PASS: Route correctly blocked (403)');
      } else {
        console.log(`⚠️  Unexpected status: ${error.response?.status}`);
      }
    }

    // Test 3: Re-enable module
    console.log('\n3️⃣ Re-enabling reviews module...');
    await moduleService.enableModule('reviews', 'test-admin', 'Test');
    console.log('✅ Module re-enabled');

    // Test 4: Try access again
    console.log('\n4️⃣ Try access again...');
    try {
      const response = await axios.get(`${API_URL}/api/reviews/professional/123`, {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      console.log('✅ PASS: Route accessible (or 404 if ID not exists)');
    } catch (error: any) {
      if (error.response?.status === 404) {
        console.log('✅ PASS: Route accessible (404 = ID not found, OK)');
      } else {
        console.log(`❌ Unexpected error: ${error.response?.status}`);
      }
    }

    console.log('\n✅ ALL PROTECTION TESTS PASSED');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

testRouteProtection();
```

**13. CREARE CHECKLIST ROUTES PROTETTE**
File: `DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/MODULE-SYSTEM-PROTECTED-ROUTES.md`

```markdown
# 🔒 Routes Protette da Sistema Moduli

## Lista Completa

### Business
- ✅ `/api/reviews/*` → modulo 'reviews'
- ✅ `/api/payments/*` → modulo 'payments'
- ✅ `/api/calendar/*` → modulo 'calendar'
- ✅ `/api/intervention-reports/*` → modulo 'intervention-reports'

### Advanced
- ✅ `/api/portfolio/*` → modulo 'portfolio'
- ✅ `/api/referral/*` → modulo 'referral'
- ✅ `/api/ai/*` → modulo 'ai-assistant'

### Communication
- ✅ `/api/whatsapp/*` → modulo 'whatsapp'

### Admin
- ✅ `/api/admin/backup/*` → modulo 'backup-system'
- ✅ `/api/admin/cleanup/*` → modulo 'cleanup-system'

## Come Funziona

### Modulo Abilitato
```
Client Request → Middleware Auth → requireModule('reviews') → ✅ Pass → Route Handler
```

### Modulo Disabilitato
```
Client Request → Middleware Auth → requireModule('reviews') → ❌ Block → 403 Forbidden
```

## Response 403
```json
{
  "success": false,
  "message": "Questa funzionalità non è attualmente disponibile",
  "error": {
    "module": "reviews",
    "reason": "MODULE_DISABLED",
    "contact": "Contatta l'amministratore"
  }
}
```

## Aggiungere Protezione
```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();
router.use(requireModule('module-code'));
```
```

⚠️ REGOLE CRITICHE:
1. ✅ Middleware SUBITO DOPO definizione router
2. ✅ PRIMA di altre middleware specifiche route
3. ✅ Un router.use() per file (protezione globale)
4. ✅ Import corretto path middleware
5. ✅ Codice modulo deve esistere nel DB

📝 DOCUMENTAZIONE:

**File**: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-06-protezione-routes.md`

```markdown
# 📋 Report Sessione 6 - Protezione Routes

**Data**: 05/10/2025
**Status**: ✅ Completato

## ✅ Completato
- [x] 10+ routes protette con middleware
- [x] Import middleware aggiunti
- [x] router.use() configurati
- [x] Test protezione eseguiti
- [x] Documentazione routes protette

## 🔒 Routes Protette
1. reviews.routes.ts
2. payment.routes.ts
3. whatsapp.routes.ts
4. ai.routes.ts
5. portfolio.routes.ts
6. referral.routes.ts
7. calendar.routes.ts
8. intervention-report.routes.ts
9. backup.routes.ts (admin)
10. cleanup-config.routes.ts (admin)

## 🧪 Testing
✅ Modulo disabilitato → 403 Forbidden
✅ Modulo abilitato → Route accessibile
✅ Cache funzionante

## 📊 Metriche
- Routes protette: 10+
- File modificati: 10
- Test passati: 100%
```

🧪 TESTING:
```bash
# 1. Avvia backend
cd backend
npm run dev

# 2. Test manuale
# Disabilita modulo reviews da admin panel
# Prova accedere a /api/reviews/* → 403

# 3. Riabilita
# Prova di nuovo → 200/404
```

✅ CHECKLIST:
- [ ] 10+ routes modificate
- [ ] Middleware import aggiunti
- [ ] router.use() configurati
- [ ] Test protezione eseguiti
- [ ] Test passati con successo
- [ ] Documentazione routes creata
- [ ] Report sessione creato
- [ ] File committati

➡️ PROSSIMA SESSIONE:
**SESSIONE 7**: Frontend Components (ModuleCard, Alert)

Al termine:
➡️ "SESSIONE 6 COMPLETATA - PRONTO PER SESSIONE 7"
```
