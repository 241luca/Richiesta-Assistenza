# 🔧 Sistema Moduli - Service Backend

## ModuleService

Service principale per gestione moduli sistema di richiesta assistenza.

### 📋 Overview

Il ModuleService gestisce tutti i moduli del sistema, permettendo:
- ✅ Lettura configurazioni moduli
- ✅ Verifica stati abilitazione  
- ✅ Controllo dipendenze
- ✅ Statistiche utilizzo
- ✅ Validazione integrità sistema

### 🔧 Metodi Disponibili

#### 📖 Metodi Lettura

##### getAllModules(filters?)
```typescript
const modules = await moduleService.getAllModules();
const coreOnly = await moduleService.getAllModules({ isCore: true });
const enabledOnly = await moduleService.getAllModules({ isEnabled: true });

// Con filtri completi
const filtered = await moduleService.getAllModules({
  category: 'FEATURES',
  isEnabled: true,
  search: 'payment'
});

// Ritorna: Array<Module> con _count.settings e _count.history
```

##### getModuleByCode(code)
```typescript
const module = await moduleService.getModuleByCode('reviews');

// Ritorna: Module completo con:
// - settings: ModuleSettings[]
// - history: ModuleHistory[] (ultimi 10)
// - _count: { settings: number, history: number }
// Throw: Error se non trovato
```

##### getModulesByCategory(category)
```typescript
const coreModules = await moduleService.getModulesByCategory('CORE');
const featureModules = await moduleService.getModulesByCategory('FEATURES');

// Ritorna: Array<Module> filtrati per categoria
```

##### getEnabledModulesByCategory(category)
```typescript
const enabledCore = await moduleService.getEnabledModulesByCategory('CORE');

// Ritorna: Array<Module> solo abilitati per categoria
// Ottimizzato per performance (cache-friendly)
```

#### 🔍 Metodi Controllo

##### isModuleEnabled(code) - CRITICO
```typescript
const isEnabled = await moduleService.isModuleEnabled('reviews');

// Ritorna: boolean
// Throw: Error se modulo non esiste
// USO: Middleware protezione routes
```

##### isModuleCore(code)
```typescript
const isCore = await moduleService.isModuleCore('users');

// Ritorna: boolean  
// Throw: Error se modulo non esiste
// USO: Prevenire disabilitazione moduli critici
```

#### 📊 Metodi Statistiche

##### getModuleStats()
```typescript
const stats = await moduleService.getModuleStats();

/*
Ritorna: {
  total: number,           // Totale moduli
  enabled: number,         // Moduli abilitati
  disabled: number,        // Moduli disabilitati  
  core: number,           // Moduli core
  byCategory: Array<{     // Distribuzione per categoria
    category: ModuleCategory,
    count: number
  }>
}
*/
```

##### getSystemConfig()
```typescript
const config = await moduleService.getSystemConfig();

/*
Ritorna: {
  version: string,                    // Versione sistema
  coreModulesEnabled: number,         // Count core attivi
  modules: Record<string, boolean>,   // Mappa moduli core
  lastChecked: string                 // Timestamp ISO
}
*/
```

#### 🔗 Metodi Dipendenze

##### getModulesWithDependencies()
```typescript
const modulesWithDeps = await moduleService.getModulesWithDependencies();

// Ritorna: Array<Module> con dependsOn o requiredFor configurati
// Include: code, name, isEnabled, dependsOn, requiredFor, category
```

##### validateDependencies()
```typescript
const validation = await moduleService.validateDependencies();

/*
Ritorna: {
  valid: boolean,        // True se tutte le dipendenze OK
  errors: string[],      // Errori critici (dipendenze mancanti)
  warnings?: string[]    // Warning (dipendenze disabilitate)
}
*/
```

### 🎯 Pattern di Utilizzo

#### Nel Service (CORRETTO)
```typescript
// ✅ Service ritorna solo dati
class ModuleService {
  async getAllModules() {
    return await prisma.systemModule.findMany(); // Solo dati
  }
}
```

#### Nelle Routes (CORRETTO)
```typescript
// ✅ Route usa ResponseFormatter
router.get('/modules', async (req, res) => {
  try {
    const modules = await moduleService.getAllModules();
    res.json(ResponseFormatter.success(modules, 'Moduli recuperati'));
  } catch (error) {
    logger.error('Error fetching modules:', error);
    res.status(500).json(
      ResponseFormatter.error('Errore recupero moduli', 'FETCH_ERROR')
    );
  }
});
```

#### Nel Middleware (CRITICO)
```typescript
// ✅ Middleware protezione moduli
export const requireModule = (moduleCode: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const isEnabled = await moduleService.isModuleEnabled(moduleCode);
      
      if (!isEnabled) {
        return res.status(403).json(
          ResponseFormatter.error(
            `Modulo ${moduleCode} disabilitato`, 
            'MODULE_DISABLED'
          )
        );
      }
      
      next();
    } catch (error) {
      logger.error(`Error checking module ${moduleCode}:`, error);
      return res.status(500).json(
        ResponseFormatter.error('Errore verifica modulo', 'MODULE_CHECK_ERROR')
      );
    }
  };
};

// Uso nelle routes
router.get('/reviews', requireModule('reviews'), getReviews);
```

### 🔍 Esempi Avanzati

#### Filtri Complessi
```typescript
// Ricerca moduli con filtri multipli
const searchResults = await moduleService.getAllModules({
  search: 'payment',       // Cerca in nome, descrizione, codice
  category: 'FEATURES',    // Solo categoria FEATURES
  isEnabled: true          // Solo abilitati
});

// Moduli core critici
const criticalModules = await moduleService.getAllModules({
  isCore: true,
  isEnabled: false         // Core disabilitati (problematico!)
});
```

#### Health Check Sistema
```typescript
// Verifica salute sistema moduli
async function checkSystemHealth() {
  const [stats, validation, systemConfig] = await Promise.all([
    moduleService.getModuleStats(),
    moduleService.validateDependencies(),
    moduleService.getSystemConfig()
  ]);
  
  const health = {
    moduleStats: stats,
    dependenciesValid: validation.valid,
    dependencyErrors: validation.errors,
    coreModulesActive: systemConfig.coreModulesEnabled,
    healthScore: calculateHealthScore(stats, validation)
  };
  
  return health;
}
```

#### Bulk Checks
```typescript
// Verifica multipli moduli contemporaneamente
async function checkModules(codes: string[]) {
  const results = await Promise.allSettled(
    codes.map(code => moduleService.isModuleEnabled(code))
  );
  
  return codes.reduce((acc, code, index) => {
    const result = results[index];
    acc[code] = result.status === 'fulfilled' ? result.value : false;
    return acc;
  }, {} as Record<string, boolean>);
}

// Uso
const moduleStatus = await checkModules(['reviews', 'payments', 'notifications']);
// { reviews: true, payments: true, notifications: false }
```

### 🚫 Anti-Patterns (NON FARE)

#### Service con ResponseFormatter (SBAGLIATO)
```typescript
// ❌ ERRORE GRAVISSIMO
class ModuleService {
  async getAllModules() {
    const modules = await prisma.systemModule.findMany();
    return ResponseFormatter.success(modules); // NO!
  }
}
```

#### Route senza ResponseFormatter (SBAGLIATO)
```typescript
// ❌ ERRORE COMUNE
router.get('/modules', async (req, res) => {
  const modules = await moduleService.getAllModules();
  res.json({ data: modules }); // NO! Usa ResponseFormatter
});
```

#### Check moduli senza error handling (PERICOLOSO)
```typescript
// ❌ PERICOLOSO - Può crashare il middleware
export const badModuleCheck = (moduleCode: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const isEnabled = await moduleService.isModuleEnabled(moduleCode);
    // Se moduleCode non esiste → CRASH!
    if (isEnabled) next();
  };
};
```

### 📈 Performance Tips

#### Caching Strategico
```typescript
// Cache per moduli frequentemente controllati
const moduleCache = new Map<string, { enabled: boolean, timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

async function isModuleEnabledCached(code: string): Promise<boolean> {
  const cached = moduleCache.get(code);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.enabled;
  }
  
  const enabled = await moduleService.isModuleEnabled(code);
  moduleCache.set(code, { enabled, timestamp: Date.now() });
  
  return enabled;
}
```

#### Batch Loading
```typescript
// Carica tutti i moduli una volta, filtra in memoria
async function getModulesByMultipleCategories(categories: ModuleCategory[]) {
  const allModules = await moduleService.getAllModules();
  
  return categories.reduce((acc, category) => {
    acc[category] = allModules.filter(m => m.category === category);
    return acc;
  }, {} as Record<ModuleCategory, Array<any>>);
}
```

### 🧪 Testing

#### Test Unitari
```typescript
describe('ModuleService', () => {
  it('should return all modules', async () => {
    const modules = await moduleService.getAllModules();
    expect(Array.isArray(modules)).toBe(true);
    expect(modules.length).toBeGreaterThan(0);
  });
  
  it('should validate module enabled check', async () => {
    const enabled = await moduleService.isModuleEnabled('reviews');
    expect(typeof enabled).toBe('boolean');
  });
  
  it('should throw for non-existent module', async () => {
    await expect(
      moduleService.isModuleEnabled('non-existent')
    ).rejects.toThrow('non trovato');
  });
});
```

#### Test Manuali
```bash
# Esegui test completo
cd backend
npx ts-node tests/manual/test-module-service.ts
```

### 🔗 Relazioni Database

#### SystemModule
```typescript
model SystemModule {
  id          String @id @default(cuid())
  code        String @unique           // Codice univoco modulo
  name        String                   // Nome visualizzato
  description String?                  // Descrizione funzionalità
  category    ModuleCategory           // CORE, FEATURES, INTEGRATIONS, etc
  isEnabled   Boolean @default(true)   // Stato abilitazione
  isCore      Boolean @default(false)  // Se core (non disabilitabile)
  dependsOn   String[]                 // Dipendenze (array codici)
  requiredFor String[]                 // Richiesto da (array codici)
  settings    ModuleSettings[]         // Configurazioni
  history     ModuleHistory[]          // Storia modifiche
}
```

### 🎯 Risultati Attesi

#### Statistiche Tipiche
```javascript
{
  total: 66,        // Totale moduli sistema
  enabled: 65,      // 98.5% attivo
  disabled: 1,      // 1.5% disabilitato 
  core: 12,         // 18% core
  byCategory: [
    { category: 'CORE', count: 12 },
    { category: 'FEATURES', count: 35 },
    { category: 'INTEGRATIONS', count: 15 },
    { category: 'ADMIN', count: 4 }
  ]
}
```

---

**Versione**: 1.0.0  
**Ultima modifica**: 06/10/2025  
**Compatibilità**: Sistema Richiesta Assistenza v5.0+  
**Dependencies**: Prisma, Logger Utils
