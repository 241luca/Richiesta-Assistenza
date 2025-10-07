# 🧪 GUIDA UTILIZZO SUITE TEST - Sistema Moduli

**Autore**: Sistema Richiesta Assistenza  
**Versione**: 1.0.0  
**Data**: 06/10/2025  
**Per**: Sviluppatori, QA, DevOps

---

## 📋 OVERVIEW SUITE TEST

La suite test per il sistema moduli include **63 test totali**:
- **35 Unit Tests** - ModuleService business logic
- **18 Integration Tests** - API endpoints completi  
- **10 E2E Tests** - Interfaccia utente

**Target Coverage**: 80%+  
**Tempo Esecuzione**: < 60 secondi

---

## 🚀 QUICK START

### 1. Verifica Setup
```bash
# Esegui verifica rapida
./scripts/verify-test-suite.sh
```

### 2. Setup Dependencies
```bash
# Backend dependencies
cd backend
npm install --save-dev @types/supertest

# Frontend dependencies (se necessario)
cd ..
npm install @playwright/test
npx playwright install
```

### 3. Avvia Servizi
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
npm run dev

# Terminal 3 - Redis (opzionale)
redis-server
```

### 4. Esegui Tutti i Test
```bash
# Suite completa (automatica)
./scripts/run-all-tests-modules.sh

# O step by step manuale...
```

---

## 🧪 ESECUZIONE TEST INDIVIDUALE

### Unit Tests
```bash
cd backend

# Tutti i unit test
npm test src/__tests__/services/module.service.test.ts

# Con coverage
npm run test:coverage src/__tests__/services/module.service.test.ts

# Watch mode (sviluppo)
npm run test:watch src/__tests__/services/module.service.test.ts

# Con UI (browser)
npm run test:ui src/__tests__/services/module.service.test.ts
```

### Integration Tests
```bash
cd backend

# Tutti i test API
npm test src/__tests__/integration/modules.api.test.ts

# Singolo endpoint
npm test -- --grep "GET /api/admin/modules"

# Con output verbose
npm test src/__tests__/integration/modules.api.test.ts -- --reporter=verbose
```

### E2E Tests
```bash
# Tutti i test E2E
npx playwright test tests/modules.spec.ts

# Con browser visibile
npx playwright test tests/modules.spec.ts --headed

# Debug mode
npx playwright test tests/modules.spec.ts --debug

# Solo Chrome
npx playwright test tests/modules.spec.ts --browser=chromium

# Con video recording
npx playwright test tests/modules.spec.ts --video=on
```

---

## 📊 INTERPRETARE I RISULTATI

### ✅ Output di Successo
```bash
🧪 TESTING SUITE COMPLETA - SISTEMA MODULI

=== 1️⃣ BACKEND UNIT TESTS ===
✅ Unit Tests (ModuleService) PASSED

=== 2️⃣ BACKEND INTEGRATION TESTS ===  
✅ Integration Tests (API Modules) PASSED

=== 3️⃣ FRONTEND E2E TESTS ===
✅ E2E Tests (Playwright) PASSED

📊 RISULTATI FINALI
Test totali eseguiti: 3
Test passati: 3  
Test falliti: 0

🎉 TUTTI I TEST SONO PASSATI!
✅ Il sistema moduli è pronto per il deploy
```

### ❌ Output di Errore
```bash
=== 1️⃣ BACKEND UNIT TESTS ===
❌ Unit Tests (ModuleService) FAILED

Error Details:
FAIL src/__tests__/services/module.service.test.ts
  ✓ should return all modules (5ms)
  ✗ should enable module (12ms)
    Expected: true
    Received: false

📊 RISULTATI FINALI  
Test totali eseguiti: 3
Test passati: 2
Test falliti: 1

❌ 1 test falliti
🚨 Correggi gli errori prima del deploy
```

---

## 🔧 TROUBLESHOOTING COMUNI

### Unit Tests Falliscono

**Problema**: Mock non configurati correttamente
```bash
# Errore tipico
TypeError: Cannot read property 'findMany' of undefined
```

**Soluzione**: Verifica mock Prisma
```typescript
// Assicurati che il mock sia corretto
vi.mock('../../config/database', () => ({
  prisma: {
    systemModule: {
      findMany: vi.fn(),
      // ... altri metodi
    }
  }
}));
```

### Integration Tests Falliscono

**Problema**: Middleware auth non mockato
```bash
# Errore tipico  
TypeError: req.user is undefined
```

**Soluzione**: Verifica mock middleware
```typescript
vi.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user', role: 'ADMIN' };
    next();
  }
}));
```

### E2E Tests Falliscono

**Problema**: Servizi non in running
```bash
# Errore tipico
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5193
```

**Soluzione**: Avvia frontend e backend
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
npm run dev
```

**Problema**: Selettori non trovati
```bash
# Errore tipico
TimeoutError: locator('[data-testid="modules-list"]') not found
```

**Soluzione**: Verifica implementazione frontend
```typescript
// Assicurati che il frontend abbia i data-testid
<div data-testid="modules-list">
  {/* contenuto */}
</div>
```

---

## 🎨 PERSONALIZZAZIONE TEST

### Aggiungere Nuovi Unit Test
```typescript
// backend/src/__tests__/services/module.service.test.ts

describe('NewFeature', () => {
  it('should handle new scenario', async () => {
    // Arrange
    const mockData = { /* test data */ };
    prisma.systemModule.findMany.mockResolvedValue(mockData);

    // Act  
    const result = await moduleService.newMethod();

    // Assert
    expect(result).toEqual(expectedResult);
    expect(prisma.systemModule.findMany).toHaveBeenCalledWith(expectedParams);
  });
});
```

### Aggiungere Nuovi Integration Test
```typescript
// backend/src/__tests__/integration/modules.api.test.ts

describe('POST /api/admin/modules/:code/new-action', () => {
  it('should perform new action successfully', async () => {
    moduleService.newAction.mockResolvedValue(mockResult);

    const response = await request(app)
      .post('/api/admin/modules/test-module/new-action')
      .send({ param: 'value' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(moduleService.newAction).toHaveBeenCalledWith('test-module', 'value');
  });
});
```

### Aggiungere Nuovi E2E Test
```typescript
// tests/modules.spec.ts

test('should perform new user interaction', async ({ page }) => {
  await page.goto('/admin/modules');
  
  // Interazione utente
  await page.click('[data-testid="new-button"]');
  await page.fill('[data-testid="new-input"]', 'test value');
  await page.click('[data-testid="submit-button"]');
  
  // Verifica risultato
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
});
```

---

## 📈 MONITORING COVERAGE

### Visualizzare Coverage Report
```bash
cd backend

# Genera report HTML
npm run test:coverage

# Apri report nel browser
open coverage/index.html
```

### Target Coverage per Modulo
- **ModuleService**: 90%+
- **API Routes**: 85%+  
- **Frontend Components**: 75%+
- **Overall**: 80%+

### Identificare Righe Non Coperte
```bash
# Coverage dettagliato per file
npm run test:coverage -- --reporter=lcov

# O visualizza nel browser il report HTML
```

---

## 🔄 INTEGRAZIONE CI/CD

### GitHub Actions Example
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        npm ci
        cd backend && npm ci
        
    - name: Setup database
      run: |
        cd backend
        npx prisma generate
        npx prisma db push
        
    - name: Run all tests
      run: ./scripts/run-all-tests-modules.sh
```

### Exit Codes
- **0**: Tutti i test passati
- **1**: Alcuni test falliti  
- **2**: Errore di configurazione
- **3**: Dependencies mancanti

---

## 📝 BEST PRACTICES

### Scrivere Test Maintainer
1. **Nomi descrittivi**: `should enable module when dependencies are met`
2. **Test isolati**: Ogni test indipendente
3. **Mock strategy**: Mock solo external dependencies
4. **Data realistici**: Usa dati simili alla produzione
5. **Error cases**: Testa sempre scenari negativi

### Performance Test
1. **Keep tests fast**: Unit < 5s, Integration < 10s, E2E < 45s
2. **Parallel execution**: Vitest e Playwright supportano parallelismo
3. **Selective testing**: Esegui solo test modificati durante sviluppo
4. **Mock database**: Non usare database reale per unit test

### Debugging Test
```bash
# Debug unit test con breakpoint
npm run test:ui src/__tests__/services/module.service.test.ts

# Debug E2E con browser visibile
npx playwright test tests/modules.spec.ts --headed --debug

# Output verbose per troubleshooting
npm test -- --reporter=verbose
```

---

## 📞 SUPPORTO

### Se i Test Falliscono
1. **Leggi l'output completo** - Gli errori sono dettagliati
2. **Verifica prerequisites** - Backend/frontend in running?
3. **Check dependencies** - Tutte le npm packages installate?
4. **Consulta troubleshooting** - Errori comuni sopra
5. **Verifica configurazione** - File di config corretti?

### Se Serve Aiuto
- **Documentation**: Questo file + inline comments nei test
- **Examples**: I test esistenti sono ottimi esempi
- **Community**: Stack Overflow, Vitest docs, Playwright docs

---

## 🎯 CHECKLIST RAPIDA

Prima di committare codice:
- [ ] `./scripts/verify-test-suite.sh` ✅ 
- [ ] `./scripts/run-all-tests-modules.sh` ✅
- [ ] Coverage > 80% ✅
- [ ] Nessun errore TypeScript ✅
- [ ] Backend e frontend avviabili ✅

**RESULT**: 🎉 Sistema pronto per deploy!

---

**Fine Documentazione**  
**Happy Testing! 🧪✨**
