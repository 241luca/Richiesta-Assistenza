# ⚙️ SESSIONE 3: Backend Service - Metodi Base
**Durata Stimata**: 2 ore  
**Complessità**: Media-Alta  
**Prerequisiti**: Sessione 1 e 2 completate

---

## 📋 PROMPT PER CLAUDE

```
Ciao Claude! SESSIONE 3 di 10 - Backend Service Parte 1.

📚 DOCUMENTI DA LEGGERE:
1. /ISTRUZIONI-PROGETTO.md (pattern services)
2. /backend/src/services/ (esempi services esistenti)
3. Report Sessioni 1 e 2

📖 RIFERIMENTI:
- Piano: /admin-implementation-plan.md (sezione Backend Service)
- Convenzioni: ISTRUZIONI-PROGETTO.md (ResponseFormatter, error handling)

🎯 OBIETTIVO SESSIONE 3:
Creare ModuleService con metodi base (get, check status).

📋 TASK DA COMPLETARE:

**1. CREARE MODULE SERVICE**
File: `backend/src/services/module.service.ts`

```typescript
import { prisma } from '../config/database';
import { ModuleCategory } from '@prisma/client';

class ModuleService {
  
  /**
   * Ottieni tutti i moduli con conteggio settings
   */
  async getAllModules() {
    return await prisma.systemModule.findMany({
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ],
      include: {
        _count: {
          select: { settings: true }
        }
      }
    });
  }

  /**
   * Ottieni modulo per codice
   */
  async getModuleByCode(code: string) {
    const module = await prisma.systemModule.findUnique({
      where: { code },
      include: {
        settings: true,
        history: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        _count: {
          select: { settings: true, history: true }
        }
      }
    });

    if (!module) {
      throw new Error(`Modulo ${code} non trovato`);
    }

    return module;
  }

  /**
   * Ottieni moduli per categoria
   */
  async getModulesByCategory(category: ModuleCategory) {
    return await prisma.systemModule.findMany({
      where: { category },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { settings: true }
        }
      }
    });
  }

  /**
   * Verifica se un modulo è abilitato
   * METODO CRITICO - usato da middleware
   */
  async isModuleEnabled(code: string): Promise<boolean> {
    const module = await prisma.systemModule.findUnique({
      where: { code },
      select: { isEnabled: true }
    });
    
    if (!module) {
      throw new Error(`Modulo ${code} non trovato`);
    }
    
    return module.isEnabled;
  }

  /**
   * Ottieni statistiche moduli
   */
  async getModuleStats() {
    const total = await prisma.systemModule.count();
    
    const enabled = await prisma.systemModule.count({
      where: { isEnabled: true }
    });
    
    const core = await prisma.systemModule.count({
      where: { isCore: true }
    });

    const byCategory = await prisma.systemModule.groupBy({
      by: ['category'],
      _count: true
    });

    return {
      total,
      enabled,
      disabled: total - enabled,
      core,
      byCategory: byCategory.map(item => ({
        category: item.category,
        count: item._count
      }))
    };
  }

  /**
   * Ottieni moduli con dipendenze
   */
  async getModulesWithDependencies() {
    return await prisma.systemModule.findMany({
      where: {
        OR: [
          { dependsOn: { isEmpty: false } },
          { requiredFor: { isEmpty: false } }
        ]
      },
      select: {
        code: true,
        name: true,
        isEnabled: true,
        dependsOn: true,
        requiredFor: true
      }
    });
  }

  /**
   * Verifica integrità dipendenze
   */
  async validateDependencies(): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const modules = await prisma.systemModule.findMany();

    for (const module of modules) {
      // Check dependsOn esistono
      if (module.dependsOn && module.dependsOn.length > 0) {
        for (const dep of module.dependsOn) {
          const depModule = modules.find(m => m.code === dep);
          if (!depModule) {
            errors.push(
              `Modulo ${module.code} dipende da ${dep} che non esiste`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export const moduleService = new ModuleService();
```

**2. ESPORTARE SERVICE**
File: `backend/src/services/index.ts`

```typescript
// Se il file esiste, aggiungi:
export { moduleService } from './module.service';

// Se non esiste, crea con:
export { moduleService } from './module.service';
```

**3. TEST MANUALE SERVICE**
File: `backend/tests/manual/test-module-service.ts`

```typescript
import { moduleService } from '../../src/services/module.service';

async function testModuleService() {
  console.log('🧪 Testing ModuleService...\n');

  try {
    // Test 1: Get all modules
    console.log('1️⃣ Get all modules...');
    const all = await moduleService.getAllModules();
    console.log(`✅ Found ${all.length} modules`);

    // Test 2: Get by category
    console.log('\n2️⃣ Get CORE modules...');
    const core = await moduleService.getModulesByCategory('CORE');
    console.log(`✅ Found ${core.length} CORE modules`);

    // Test 3: Get module by code
    console.log('\n3️⃣ Get reviews module...');
    const reviews = await moduleService.getModuleByCode('reviews');
    console.log(`✅ Found: ${reviews.name}`);
    console.log(`   Enabled: ${reviews.isEnabled}`);
    console.log(`   Settings: ${reviews._count.settings}`);

    // Test 4: Check if enabled
    console.log('\n4️⃣ Check if reviews enabled...');
    const isEnabled = await moduleService.isModuleEnabled('reviews');
    console.log(`✅ Reviews enabled: ${isEnabled}`);

    // Test 5: Get stats
    console.log('\n5️⃣ Get module stats...');
    const stats = await moduleService.getModuleStats();
    console.log('✅ Stats:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Enabled: ${stats.enabled}`);
    console.log(`   Disabled: ${stats.disabled}`);
    console.log(`   Core: ${stats.core}`);

    // Test 6: Validate dependencies
    console.log('\n6️⃣ Validate dependencies...');
    const validation = await moduleService.validateDependencies();
    if (validation.valid) {
      console.log('✅ All dependencies valid');
    } else {
      console.log('❌ Dependency errors:');
      validation.errors.forEach(err => console.log(`   - ${err}`));
    }

    console.log('\n✅ ALL TESTS PASSED');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testModuleService().finally(() => process.exit(0));
```

**4. ESEGUIRE TEST**
```bash
cd backend
npx ts-node tests/manual/test-module-service.ts
```

Output atteso:
```
🧪 Testing ModuleService...

1️⃣ Get all modules...
✅ Found 66 modules

2️⃣ Get CORE modules...
✅ Found 6 CORE modules

3️⃣ Get reviews module...
✅ Found: Sistema Recensioni
   Enabled: true
   Settings: 2

4️⃣ Check if reviews enabled...
✅ Reviews enabled: true

5️⃣ Get module stats...
✅ Stats:
   Total: 66
   Enabled: 65
   Disabled: 1
   Core: 12

6️⃣ Validate dependencies...
✅ All dependencies valid

✅ ALL TESTS PASSED
```

⚠️ REGOLE CRITICHE:
1. ✅ Service ritorna SOLO dati, MAI ResponseFormatter
2. ✅ Throw Error per casi eccezionali
3. ✅ Usare include per relazioni necessarie
4. ✅ Select solo campi necessari per performance
5. ✅ OrderBy per risultati ordinati
6. ✅ _count per conteggi efficienti

📝 DOCUMENTAZIONE DA CREARE:

**File 1**: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-03-backend-service-parte-1.md`

```markdown
# 📋 Report Sessione 3 - Backend Service Parte 1

**Data**: 05/10/2025  
**Durata**: [ore]  
**Status**: ✅ Completato

## 🎯 Obiettivo
Creare ModuleService con metodi base per gestione moduli.

## ✅ Completato
- [x] ModuleService creato
- [x] 8 metodi base implementati
- [x] Service esportato da index
- [x] Test manuale scritto ed eseguito
- [x] Tutti test passati

## 📦 File Creati
- `backend/src/services/module.service.ts` (nuovo)
- `backend/src/services/index.ts` (aggiornato)
- `backend/tests/manual/test-module-service.ts` (nuovo)

## 🔧 Metodi Implementati

### Lettura
1. `getAllModules()` - Lista completa con conteggi
2. `getModuleByCode(code)` - Dettaglio singolo modulo
3. `getModulesByCategory(category)` - Filtra per categoria
4. `isModuleEnabled(code)` - Check status (CRITICO per middleware)
5. `getModuleStats()` - Statistiche aggregate
6. `getModulesWithDependencies()` - Moduli con dipendenze
7. `validateDependencies()` - Verifica integrità

## 🧪 Testing
- ✅ Test get all: 66 moduli
- ✅ Test by category: 6 CORE
- ✅ Test by code: reviews trovato
- ✅ Test is enabled: true
- ✅ Test stats: corretti
- ✅ Test dependencies: validi

## ⚠️ Problemi
[Nessuno / Descrizione]

## ➡️ Prossimi Passi
**SESSIONE 4**: Backend Service Parte 2 (enable, disable, settings)
```

**File 2**: `DOCUMENTAZIONE/ATTUALE/02-FUNZIONALITA/MODULE-SYSTEM-SERVICE.md`

```markdown
# 🔧 Sistema Moduli - Service Backend

## ModuleService

Service principale per gestione moduli sistema.

### Metodi Lettura

#### getAllModules()
```typescript
const modules = await moduleService.getAllModules();
// Ritorna: Array<Module> con _count.settings
```

#### getModuleByCode(code)
```typescript
const module = await moduleService.getModuleByCode('reviews');
// Ritorna: Module con settings e history
// Throw: Error se non trovato
```

#### getModulesByCategory(category)
```typescript
const coreModules = await moduleService.getModulesByCategory('CORE');
// Ritorna: Array<Module> filtrati
```

#### isModuleEnabled(code)
```typescript
const isEnabled = await moduleService.isModuleEnabled('reviews');
// Ritorna: boolean
// Throw: Error se modulo non esiste
// USO: Middleware protezione routes
```

#### getModuleStats()
```typescript
const stats = await moduleService.getModuleStats();
/*
Ritorna: {
  total: number,
  enabled: number,
  disabled: number,
  core: number,
  byCategory: Array<{category, count}>
}
*/
```

### Best Practices

**Nel Service:**
- ❌ NO ResponseFormatter
- ❌ NO res.json()
- ✅ Ritorna dati puri
- ✅ Throw Error per eccezioni

**Nelle Routes:**
- ✅ Cattura errori con try/catch
- ✅ Usa ResponseFormatter
- ✅ Status code appropriati

### Esempio Uso

```typescript
// ❌ SBAGLIATO
class ModuleService {
  async getAll() {
    const modules = await prisma.systemModule.findMany();
    return ResponseFormatter.success(modules); // NO!
  }
}

// ✅ CORRETTO
class ModuleService {
  async getAll() {
    return await prisma.systemModule.findMany(); // Solo dati
  }
}

// Route usa ResponseFormatter
router.get('/', async (req, res) => {
  const modules = await moduleService.getAll();
  res.json(ResponseFormatter.success(modules)); // Qui sì!
});
```
```

🧪 TESTING:
```bash
cd backend

# Test manuale
npx ts-node tests/manual/test-module-service.ts

# Output atteso: tutti ✅
```

✅ CHECKLIST COMPLETAMENTO:

- [ ] module.service.ts creato
- [ ] 8 metodi base implementati
- [ ] Service esportato da index.ts
- [ ] Test manuale creato
- [ ] Test eseguito con successo
- [ ] Tutti test passano
- [ ] NO ResponseFormatter nel service
- [ ] Error handling con throw
- [ ] Report sessione creato
- [ ] Documentazione service creata
- [ ] File committati su Git

📊 METRICHE SUCCESSO:
- ✅ 8 metodi funzionanti
- ✅ 66 moduli recuperabili
- ✅ Stats corrette
- ✅ Dependencies validate
- ✅ Zero errori runtime

➡️ PROSSIMA SESSIONE:
**SESSIONE 4**: Backend Service Parte 2 - Enable/Disable/Settings

---

Al termine:
1. ✅ Status checklist
2. 📸 Screenshot output test
3. 📝 Path documentazione
4. ⚠️ Problemi
5. ➡️ Conferma: "SESSIONE 3 COMPLETATA - PRONTO PER SESSIONE 4"
```
