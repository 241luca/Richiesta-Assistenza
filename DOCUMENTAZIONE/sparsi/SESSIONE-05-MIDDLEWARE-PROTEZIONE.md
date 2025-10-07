# 🛡️ SESSIONE 5: Middleware Protezione Routes
**Durata Stimata**: 1.5 ore  
**Complessità**: Media  
**Prerequisiti**: Sessioni 1-4 completate

---

## 📋 PROMPT PER CLAUDE

```
Ciao Claude! SESSIONE 5 di 10 - Middleware Protezione.

📚 DOCUMENTI DA LEGGERE:
1. /ISTRUZIONI-PROGETTO.md
2. /backend/src/services/module.service.ts
3. /backend/src/middleware/ (esempi middleware esistenti)

🎯 OBIETTIVO SESSIONE 5:
Creare middleware per proteggere routes in base a stato moduli + cache.

📋 TASK DA COMPLETARE:

**1. CREARE MODULE MIDDLEWARE**
File: `backend/src/middleware/module.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { moduleService } from '../services/module.service';
import { ResponseFormatter } from '../utils/responseFormatter';

// Simple in-memory cache
const moduleStatusCache = new Map<string, { isEnabled: boolean; cachedAt: number }>();
const CACHE_TTL = 60000; // 1 minuto

/**
 * Middleware: richiede modulo abilitato
 */
export const requireModule = (moduleCode: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isEnabled = await moduleService.isModuleEnabled(moduleCode);
      
      if (!isEnabled) {
        return res.status(403).json(
          ResponseFormatter.error(
            'Questa funzionalità non è attualmente disponibile',
            {
              module: moduleCode,
              reason: 'MODULE_DISABLED',
              contact: 'Contatta l\'amministratore per maggiori informazioni'
            }
          )
        );
      }
      
      next();
    } catch (error: any) {
      console.error(`[Module Middleware] Error checking ${moduleCode}:`, error);
      return res.status(500).json(
        ResponseFormatter.error('Errore verifica disponibilità funzionalità')
      );
    }
  };
};

/**
 * Middleware: richiede multiple moduli
 */
export const requireModules = (moduleCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const checks = await Promise.all(
        moduleCodes.map(code => moduleService.isModuleEnabled(code))
      );
      
      const disabled = moduleCodes.filter((_, i) => !checks[i]);
      
      if (disabled.length > 0) {
        return res.status(403).json(
          ResponseFormatter.error(
            'Alcune funzionalità richieste non sono disponibili',
            {
              disabledModules: disabled,
              reason: 'MODULES_DISABLED'
            }
          )
        );
      }
      
      next();
    } catch (error: any) {
      return res.status(500).json(
        ResponseFormatter.error('Errore verifica funzionalità')
      );
    }
  };
};

/**
 * Middleware con cache (performance)
 */
export const requireModuleCached = (moduleCode: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const now = Date.now();
      const cached = moduleStatusCache.get(moduleCode);
      
      // Check cache
      if (cached && (now - cached.cachedAt) < CACHE_TTL) {
        if (!cached.isEnabled) {
          return res.status(403).json(
            ResponseFormatter.error('Funzionalità non disponibile', {
              module: moduleCode,
              reason: 'MODULE_DISABLED'
            })
          );
        }
        return next();
      }
      
      // Query DB
      const isEnabled = await moduleService.isModuleEnabled(moduleCode);
      
      // Update cache
      moduleStatusCache.set(moduleCode, { isEnabled, cachedAt: now });
      
      if (!isEnabled) {
        return res.status(403).json(
          ResponseFormatter.error('Funzionalità non disponibile')
        );
      }
      
      next();
    } catch (error: any) {
      return res.status(500).json(
        ResponseFormatter.error('Errore verifica funzionalità')
      );
    }
  };
};

/**
 * Invalida cache (chiamare dopo enable/disable)
 */
export const invalidateModuleCache = (moduleCode: string) => {
  moduleStatusCache.delete(moduleCode);
  console.log(`[Cache] Invalidated cache for module: ${moduleCode}`);
};

/**
 * Clear tutta la cache
 */
export const clearModuleCache = () => {
  moduleStatusCache.clear();
  console.log('[Cache] Cleared all module cache');
};

/**
 * Warning se disabilitato (non blocca)
 */
export const warnIfModuleDisabled = (moduleCode: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isEnabled = await moduleService.isModuleEnabled(moduleCode);
      if (!isEnabled) {
        console.warn(`⚠️  Module ${moduleCode} is disabled but route was accessed`);
      }
    } catch (error) {
      console.error(`[Module Warning] Error checking ${moduleCode}:`, error);
    }
    next();
  };
};
```

**2. AGGIORNARE MODULE SERVICE**
Apri `backend/src/services/module.service.ts` e aggiungi invalidazione cache:

```typescript
// AGGIUNGI import
import { invalidateModuleCache } from '../middleware/module.middleware';

// MODIFICA enableModule
async enableModule(...) {
  // ... codice esistente ...
  
  // AGGIUNGI prima del return
  invalidateModuleCache(code);
  
  return updated;
}

// MODIFICA disableModule
async disableModule(...) {
  // ... codice esistente ...
  
  // AGGIUNGI prima del return
  invalidateModuleCache(code);
  
  return updated;
}
```

**3. TEST MIDDLEWARE**
File: `backend/tests/manual/test-module-middleware.ts`

```typescript
import express from 'express';
import { requireModule, invalidateModuleCache } from '../../src/middleware/module.middleware';
import { moduleService } from '../../src/services/module.service';

async function testMiddleware() {
  console.log('🧪 Testing Module Middleware...\n');

  const app = express();

  // Mock route protetta
  app.get('/test-protected', requireModule('reviews'), (req, res) => {
    res.json({ message: 'Access granted' });
  });

  // Test 1: Con modulo abilitato
  console.log('1️⃣ Test with enabled module...');
  const isEnabled = await moduleService.isModuleEnabled('reviews');
  console.log(`✅ Reviews enabled: ${isEnabled}`);

  // Test 2: Disabilita modulo
  console.log('\n2️⃣ Disable module...');
  await moduleService.disableModule('reviews', 'test-user-id', 'Test');
  console.log('✅ Module disabled');

  // Test 3: Verifica cache invalidata
  console.log('\n3️⃣ Check cache invalidated...');
  const afterDisable = await moduleService.isModuleEnabled('reviews');
  console.log(`✅ Reviews enabled: ${afterDisable}`);

  // Test 4: Riabilita
  console.log('\n4️⃣ Re-enable module...');
  await moduleService.enableModule('reviews', 'test-user-id', 'Test');
  console.log('✅ Module re-enabled');

  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
}

testMiddleware().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
```

⚠️ REGOLE CRITICHE:
1. ✅ Middleware SEMPRE prima di handler route
2. ✅ Cache per performance (TTL 60s)
3. ✅ Invalidazione cache dopo enable/disable
4. ✅ Error handling robusto
5. ✅ Response 403 per modulo disabilitato
6. ✅ Log per debugging

📝 DOCUMENTAZIONE:

**File**: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-05-middleware.md`

```markdown
# 📋 Report Sessione 5 - Middleware Protezione

**Data**: 05/10/2025
**Status**: ✅ Completato

## ✅ Completato
- [x] module.middleware.ts creato
- [x] requireModule() implementato
- [x] requireModules() per multiple
- [x] requireModuleCached() con cache
- [x] invalidateModuleCache() helper
- [x] Cache integrata in service
- [x] Test middleware funzionanti

## 🛡️ Middleware Disponibili
1. requireModule(code) - Blocca se disabilitato
2. requireModules(codes[]) - Multiple dipendenze
3. requireModuleCached(code) - Con cache 60s
4. warnIfModuleDisabled(code) - Solo warning

## 🚀 Cache System
- TTL: 60 secondi
- Invalidazione: automatica dopo enable/disable
- Performance: riduce query DB

## 🧪 Testing
✅ Middleware blocca accesso se disabilitato
✅ Cache funzionante
✅ Invalidazione automatica OK
```

🧪 TESTING:
```bash
cd backend
npx ts-node tests/manual/test-module-middleware.ts
```

✅ CHECKLIST:
- [ ] module.middleware.ts creato
- [ ] 4 middleware implementati
- [ ] Cache system funzionante
- [ ] Invalidazione in service
- [ ] Test scritti ed eseguiti
- [ ] Report sessione creato
- [ ] File committati

➡️ PROSSIMA SESSIONE:
**SESSIONE 6**: Protezione Routes Esistenti (10+ routes)

Al termine:
➡️ "SESSIONE 5 COMPLETATA - PRONTO PER SESSIONE 6"
```
