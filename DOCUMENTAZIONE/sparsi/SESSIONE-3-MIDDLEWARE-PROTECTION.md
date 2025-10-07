# 🛡️ SESSIONE 3: Middleware e Protezione Routes
**Durata Stimata**: 2 ore  
**Difficoltà**: Media  
**Cosa faremo**: Creeremo un sistema che blocca automaticamente l'accesso alle funzionalità quando un modulo è spento

---

## 📋 PROMPT DA DARE A CLAUDE

Copia e incolla questo prompt in una nuova chat con Claude:

```
Ciao Claude! Sessione 3 del Sistema Moduli.

📚 LEGGI PRIMA:
1. /ISTRUZIONI-PROGETTO.md
2. /DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-1-database-moduli.md
3. /DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-2-backend-service.md
4. /backend/src/services/module.service.ts (codice creato in sessione 2)

🎯 OBIETTIVO SESSIONE 3:
Creare un "filtro" che controlla automaticamente se un modulo è acceso prima di permettere l'accesso.

**ESEMPIO PRATICO:**
Se un admin spegne il modulo "Recensioni", quando un utente prova ad accedere alla pagina recensioni, il sistema deve dire "Questa funzionalità non è disponibile" invece di mostrare errori strani.

---

## 📝 COSA DEVI FARE

### PASSO 1: CREA IL MIDDLEWARE

Crea il file `backend/src/middleware/module.middleware.ts`:

```typescript
// backend/src/middleware/module.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { moduleService } from '../services/module.service';
import { ResponseFormatter } from '../utils/responseFormatter';

/**
 * Cache per evitare di controllare il database ad ogni richiesta
 * Mantiene lo stato dei moduli in memoria per 1 minuto
 */
const moduleStatusCache = new Map<string, { 
  isEnabled: boolean; 
  cachedAt: number 
}>();

const CACHE_TTL = 60000; // 1 minuto in millisecondi

/**
 * Middleware per verificare che un modulo sia abilitato
 * 
 * ESEMPIO DI USO:
 * router.use(requireModule('reviews')); // Protegge tutte le routes recensioni
 */
export const requireModule = (moduleCode: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Controlla se abbiamo il dato in cache
      const now = Date.now();
      const cached = moduleStatusCache.get(moduleCode);
      
      let isEnabled: boolean;
      
      // Se è in cache e non è scaduta, usa quella
      if (cached && (now - cached.cachedAt) < CACHE_TTL) {
        isEnabled = cached.isEnabled;
      } else {
        // Altrimenti controlla nel database
        isEnabled = await moduleService.isModuleEnabled(moduleCode);
        
        // Salva in cache
        moduleStatusCache.set(moduleCode, { 
          isEnabled, 
          cachedAt: now 
        });
      }
      
      // Se il modulo è spento, blocca l'accesso
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
      
      // Se è acceso, continua normalmente
      next();
    } catch (error: any) {
      console.error(`[Module Middleware] Errore controllo modulo ${moduleCode}:`, error);
      return res.status(500).json(
        ResponseFormatter.error('Errore verifica disponibilità funzionalità')
      );
    }
  };
};

/**
 * Middleware per verificare più moduli contemporaneamente
 * 
 * ESEMPIO DI USO:
 * router.use(requireModules(['reviews', 'analytics']));
 */
export const requireModules = (moduleCodes: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const checks = await Promise.all(
        moduleCodes.map(code => moduleService.isModuleEnabled(code))
      );
      
      const disabledModules = moduleCodes.filter((_, i) => !checks[i]);
      
      if (disabledModules.length > 0) {
        return res.status(403).json(
          ResponseFormatter.error(
            'Alcune funzionalità richieste non sono disponibili',
            {
              disabledModules,
              reason: 'MODULES_DISABLED'
            }
          )
        );
      }
      
      next();
    } catch (error: any) {
      console.error('[Module Middleware] Errore controllo moduli:', error);
      return res.status(500).json(
        ResponseFormatter.error('Errore verifica disponibilità funzionalità')
      );
    }
  };
};

/**
 * Funzione per invalidare la cache quando un modulo viene acceso/spento
 * Viene chiamata dal ModuleService dopo enable/disable
 */
export const invalidateModuleCache = (moduleCode: string) => {
  moduleStatusCache.delete(moduleCode);
  console.log(`[Module Cache] Cache invalidata per modulo: ${moduleCode}`);
};

/**
 * Middleware opzionale: mostra solo un warning senza bloccare
 * Utile per debug
 */
export const warnIfModuleDisabled = (moduleCode: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isEnabled = await moduleService.isModuleEnabled(moduleCode);
      if (!isEnabled) {
        console.warn(`⚠️  Modulo ${moduleCode} disabilitato ma route acceduta`);
      }
    } catch (error: any) {
      console.error(`[Module Warning] Errore controllo ${moduleCode}:`, error);
    }
    next();
  };
};
```

### PASSO 2: AGGIORNA MODULE SERVICE

Modifica `backend/src/services/module.service.ts` per invalidare la cache:

Aggiungi l'import all'inizio:
```typescript
import { invalidateModuleCache } from '../middleware/module.middleware';
```

Poi nei metodi `enableModule` e `disableModule`, aggiungi ALLA FINE (prima del return):

```typescript
// Nel metodo enableModule, prima del return:
    // Invalida cache
    invalidateModuleCache(code);
    
    return updated;

// Nel metodo disableModule, prima del return:
    // Invalida cache
    invalidateModuleCache(code);
    
    return updated;
```

### PASSO 3: PROTEGGI LE ROUTES ESISTENTI

Ora applichiamo il middleware alle routes del sistema. 

**IMPORTANTE**: Il middleware va messo PRIMA di tutte le altre routes nel file.

#### 3.1 Proteggi Reviews Routes

File: `backend/src/routes/reviews.routes.ts`

Aggiungi all'inizio:
```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();

// PROTEGGE TUTTE LE ROUTES RECENSIONI
router.use(requireModule('reviews'));

// ... resto del codice esistente ...
```

#### 3.2 Proteggi Payment Routes

File: `backend/src/routes/payment.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

router.use(requireModule('payments'));
```

#### 3.3 Proteggi WhatsApp Routes

File: `backend/src/routes/whatsapp.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

router.use(requireModule('whatsapp'));
```

#### 3.4 Proteggi AI Routes

File: `backend/src/routes/ai.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

router.use(requireModule('ai-assistant'));
```

#### 3.5 Proteggi Portfolio Routes

File: `backend/src/routes/portfolio.routes.ts`

```typescript
import { requireModule } from '../middleware/module.middleware';

router.use(requireModule('portfolio'));
```

#### 3.6 Proteggi Referral Routes

File: `backend/src/routes/referral.routes.ts` (se esiste)

```typescript
import { requireModule } from '../middleware/module.middleware';

router.use(requireModule('referral'));
```

#### 3.7 Proteggi Calendar Routes

File: `backend/src/routes/calendar.routes.ts` (se esiste)

```typescript
import { requireModule } from '../middleware/module.middleware';

router.use(requireModule('calendar'));
```

### PASSO 4: TESTA IL SISTEMA

1. **Riavvia il backend:**
```bash
cd backend
npm run dev
```

2. **Test 1: Modulo attivo (deve funzionare)**
```bash
# Con il modulo recensioni ATTIVO
curl http://localhost:3200/api/reviews/professional/123
# Dovrebbe funzionare normalmente (o dare 404 se l'ID non esiste)
```

3. **Test 2: Disabilita modulo**
```bash
# Disabilita il modulo recensioni
curl -X POST http://localhost:3200/api/admin/modules/reviews/disable \
  -H "Authorization: Bearer TUO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test middleware"}'
```

4. **Test 3: Prova ad accedere (deve bloccare)**
```bash
# Ora prova di nuovo ad accedere
curl http://localhost:3200/api/reviews/professional/123

# Dovrebbe rispondere:
# {
#   "success": false,
#   "message": "Questa funzionalità non è attualmente disponibile",
#   "error": {
#     "module": "reviews",
#     "reason": "MODULE_DISABLED"
#   }
# }
```

5. **Test 4: Riabilita modulo**
```bash
curl -X POST http://localhost:3200/api/admin/modules/reviews/enable \
  -H "Authorization: Bearer TUO_TOKEN"
```

6. **Test 5: Verifica che funzioni di nuovo**
```bash
curl http://localhost:3200/api/reviews/professional/123
# Dovrebbe funzionare di nuovo
```

---

## 📝 DOCUMENTAZIONE DA CREARE

### 1. Report Sessione

Crea `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-3-middleware.md`:

```markdown
# Report Sessione 3 - Middleware Protezione

**Data**: 05/10/2025
**Durata**: [tempo impiegato]
**Status**: ✅ Completato

## Obiettivo
Creare middleware per bloccare automaticamente accesso a moduli disabilitati.

## Completato
- [x] Middleware module.middleware.ts creato
- [x] requireModule() implementato
- [x] requireModules() implementato
- [x] Cache con TTL 60s implementata
- [x] Invalidazione cache in ModuleService
- [x] 10+ routes protette con middleware

## File Creati/Modificati
- `backend/src/middleware/module.middleware.ts` (nuovo)
- `backend/src/services/module.service.ts` (aggiornato)
- `backend/src/routes/reviews.routes.ts` (protetto)
- `backend/src/routes/payment.routes.ts` (protetto)
- `backend/src/routes/whatsapp.routes.ts` (protetto)
- `backend/src/routes/ai.routes.ts` (protetto)
- `backend/src/routes/portfolio.routes.ts` (protetto)
- `backend/src/routes/referral.routes.ts` (protetto)
- [altri routes protetti]

## Routes Protette
1. /api/reviews → reviews
2. /api/payments → payments
3. /api/whatsapp → whatsapp
4. /api/ai → ai-assistant
5. /api/portfolio → portfolio
6. /api/referral → referral
7. /api/calendar → calendar
[lista completa]

## Test Eseguiti
- ✅ Modulo attivo: accesso OK
- ✅ Modulo disabilitato: blocco 403
- ✅ Cache funziona (60s TTL)
- ✅ Invalidazione cache dopo enable/disable
- ✅ Messaggio errore chiaro per utenti
- ✅ Multiple routes protette contemporaneamente

## Problemi Riscontrati
[Nessuno / Descrizione]

## Prossimi Passi
Sessione 4: Frontend UI completa
```

### 2. Documentazione Tecnica

Crea `DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/MODULE-SYSTEM-MIDDLEWARE.md`:

```markdown
# Sistema Moduli - Middleware Protezione

## Cosa fa il Middleware

Il middleware è come un "guardiano" davanti ad ogni funzionalità.
Prima di permettere l'accesso, controlla se il modulo è acceso o spento.

## Come Usarlo

### Proteggere tutte le routes di un file

```typescript
import { requireModule } from '../middleware/module.middleware';

const router = Router();

// Questa riga protegge TUTTO quello che viene dopo
router.use(requireModule('reviews'));

// Tutte queste routes ora sono protette
router.get('/', ...);
router.post('/', ...);
router.delete('/:id', ...);
```

### Proteggere una singola route

```typescript
router.get(
  '/stats', 
  requireModule('analytics'), // Solo questa route è protetta
  async (req, res) => {
    // ... codice
  }
);
```

### Proteggere con più moduli

```typescript
// Richiede che ENTRAMBI i moduli siano attivi
router.use(requireModules(['reviews', 'analytics']));
```

## Routes Protette nel Sistema

| Route | Modulo Richiesto |
|-------|------------------|
| /api/reviews | reviews |
| /api/payments | payments |
| /api/whatsapp | whatsapp |
| /api/ai | ai-assistant |
| /api/portfolio | portfolio |
| /api/referral | referral |
| /api/calendar | calendar |

## Cache Sistema

Il middleware usa una cache per non controllare il database ad ogni richiesta.

**Durata cache**: 60 secondi
**Invalidazione**: Automatica quando modulo viene acceso/spento

## Messaggio Errore Utente

Quando un modulo è spento, l'utente vede:

```json
{
  "success": false,
  "message": "Questa funzionalità non è attualmente disponibile",
  "error": {
    "module": "reviews",
    "reason": "MODULE_DISABLED",
    "contact": "Contatta l'amministratore per maggiori informazioni"
  }
}
```

**Status HTTP**: 403 Forbidden

## Debug

Per vedere se il middleware funziona:

```bash
# 1. Guarda i log del backend
# 2. Cerca righe come:
# [Module Cache] Cache invalidata per modulo: reviews
# ⚠️  Modulo reviews disabilitato ma route acceduta
```
```

---

## ✅ CHECKLIST COMPLETAMENTO

- [ ] File module.middleware.ts creato
- [ ] requireModule() implementato
- [ ] requireModules() implementato
- [ ] Cache implementata (TTL 60s)
- [ ] invalidateModuleCache() implementato
- [ ] ModuleService aggiornato (invalida cache)
- [ ] Reviews routes protetto
- [ ] Payment routes protetto
- [ ] WhatsApp routes protetto
- [ ] AI routes protetto
- [ ] Portfolio routes protetto
- [ ] Altri routes protetti (lista completa)
- [ ] Backend riavviato
- [ ] Test manuale enable/disable eseguito
- [ ] Test 403 quando modulo off
- [ ] Test 200 quando modulo on
- [ ] Report sessione creato
- [ ] Documentazione middleware creata
- [ ] File committati su Git

## 💾 COMANDI GIT

```bash
git add backend/src/middleware/module.middleware.ts
git add backend/src/services/module.service.ts
git add backend/src/routes/
git add DOCUMENTAZIONE/

git commit -m "feat: add module protection middleware

- Add requireModule and requireModules middleware
- Add cache system with 60s TTL
- Protect 10+ routes with module checks
- Add cache invalidation on enable/disable
- Return clear 403 errors when module disabled"

git push origin main
```

---

🎉 **SESSIONE 3 COMPLETATA! Pronto per Sessione 4.**

Il sistema ora protegge automaticamente tutte le funzionalità!
Quando un admin spegne un modulo, l'accesso viene bloccato immediatamente (dopo max 60 secondi per la cache).
```

Buon lavoro! 🚀
