# 🧪 SESSIONE 9: Testing Suite Completa
**Durata Stimata**: 2 ore  
**Complessità**: Media-Alta  
**Prerequisiti**: Tutte le sessioni 1-8 completate

---

## 📋 PROMPT PER CLAUDE

```
Ciao Claude! SESSIONE 9 di 10 - Testing Suite.

📚 DOCUMENTI DA LEGGERE:
1. /ISTRUZIONI-PROGETTO.md (pattern testing)
2. Tutto il codice creato nelle sessioni 1-8
3. /backend/tests/ (esempi test esistenti)

🎯 OBIETTIVO SESSIONE 9:
Creare suite completa test: unit, integration, E2E per sistema moduli.

📋 TASK DA COMPLETARE:

**1. TEST UNIT - MODULE SERVICE**
File: `backend/tests/unit/module.service.test.ts`

```typescript
import { moduleService } from '../../src/services/module.service';
import { prisma } from '../../src/config/database';

describe('ModuleService - Unit Tests', () => {
  
  describe('getAllModules', () => {
    it('should return all 66 modules', async () => {
      const modules = await moduleService.getAllModules();
      expect(modules).toHaveLength(66);
    });

    it('should include _count.settings', async () => {
      const modules = await moduleService.getAllModules();
      expect(modules[0]).toHaveProperty('_count');
      expect(modules[0]._count).toHaveProperty('settings');
    });
  });

  describe('isModuleEnabled', () => {
    it('should return true for enabled module', async () => {
      const isEnabled = await moduleService.isModuleEnabled('reviews');
      expect(isEnabled).toBe(true);
    });

    it('should throw error for non-existent module', async () => {
      await expect(
        moduleService.isModuleEnabled('non-existent')
      ).rejects.toThrow('non trovato');
    });
  });

  describe('enableModule', () => {
    it('should enable disabled module', async () => {
      // First disable
      await moduleService.disableModule('portfolio', 'test-user', 'Test');
      
      // Then enable
      const result = await moduleService.enableModule(
        'portfolio',
        'test-user',
        'Test enable'
      );
      
      expect(result.isEnabled).toBe(true);
      expect(result.enabledBy).toBe('test-user');
    });

    it('should fail if dependencies not enabled', async () => {
      // Disable dependency
      await moduleService.disableModule('requests', 'test-user');
      
      await expect(
        moduleService.enableModule('reviews', 'test-user')
      ).rejects.toThrow('dipendenze mancanti');
      
      // Cleanup: re-enable
      await moduleService.enableModule('requests', 'test-user');
    });

    it('should create history entry', async () => {
      await moduleService.disableModule('portfolio', 'test-user');
      await moduleService.enableModule('portfolio', 'test-user');
      
      const history = await prisma.moduleHistory.findFirst({
        where: {
          moduleCode: 'portfolio',
          action: 'ENABLED'
        }
      });
      
      expect(history).toBeTruthy();
    });
  });

  describe('disableModule', () => {
    it('should fail to disable CORE module', async () => {
      await expect(
        moduleService.disableModule('auth', 'test-user')
      ).rejects.toThrow('modulo core');
    });

    it('should fail if dependents are active', async () => {
      // reviews depends on requests
      await expect(
        moduleService.disableModule('requests', 'test-user')
      ).rejects.toThrow('dipendenti attivi');
    });

    it('should disable non-core module', async () => {
      const result = await moduleService.disableModule(
        'portfolio',
        'test-user',
        'Test'
      );
      
      expect(result.isEnabled).toBe(false);
      
      // Cleanup
      await moduleService.enableModule('portfolio', 'test-user');
    });
  });

  describe('getModuleStats', () => {
    it('should return correct stats', async () => {
      const stats = await moduleService.getModuleStats();
      
      expect(stats.total).toBe(66);
      expect(stats.enabled).toBeGreaterThan(0);
      expect(stats.core).toBeGreaterThan(0);
      expect(stats.byCategory).toHaveLength(8);
    });
  });
});
```

**2. TEST INTEGRATION - API ENDPOINTS**
File: `backend/tests/integration/modules.api.test.ts`

```typescript
import request from 'supertest';
import { app } from '../../src/app';

describe('Modules API - Integration Tests', () => {
  let adminToken: string;

  beforeAll(async () => {
    // Get admin token (implementa la tua logica auth)
    adminToken = 'your-admin-token';
  });

  describe('GET /api/admin/modules', () => {
    it('should return all modules', async () => {
      const res = await request(app)
        .get('/api/admin/modules')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(66);
    });

    it('should fail without auth', async () => {
      const res = await request(app)
        .get('/api/admin/modules');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/admin/modules/:code/enable', () => {
    it('should enable module', async () => {
      // First disable
      await request(app)
        .post('/api/admin/modules/portfolio/disable')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      // Then enable
      const res = await request(app)
        .post('/api/admin/modules/portfolio/enable')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test enable' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isEnabled).toBe(true);
    });
  });

  describe('POST /api/admin/modules/:code/disable', () => {
    it('should disable non-core module', async () => {
      const res = await request(app)
        .post('/api/admin/modules/portfolio/disable')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test' });

      expect(res.status).toBe(200);
      expect(res.body.data.isEnabled).toBe(false);
    });

    it('should fail to disable core module', async () => {
      const res = await request(app)
        .post('/api/admin/modules/auth/disable')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('core');
    });
  });

  describe('GET /api/admin/modules/:code/history', () => {
    it('should return module history', async () => {
      const res = await request(app)
        .get('/api/admin/modules/portfolio/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
```

**3. TEST E2E - PLAYWRIGHT**
File: `tests/e2e/modules.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Module Management E2E', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name=email]', 'admin@test.com');
    await page.fill('[name=password]', 'password');
    await page.click('button[type=submit]');
    await page.waitForURL('/admin');
  });

  test('should display all 66 modules', async ({ page }) => {
    await page.goto('/admin/modules');

    // Check page loaded
    await expect(page.locator('h1')).toContainText('Gestione Moduli');

    // Check stats
    const totalCard = page.locator('text=Totali').locator('..');
    await expect(totalCard.locator('text=66')).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    await page.goto('/admin/modules');

    // Click ADVANCED category
    await page.click('button:has-text("Avanzate")');

    // Check URL updated or cards filtered
    // Adjust based on your implementation
  });

  test('should enable/disable module', async ({ page }) => {
    await page.goto('/admin/modules');

    // Find portfolio module (non-core)
    const portfolioCard = page.locator('text=Portfolio Lavori').locator('..');

    // Get current state
    const isEnabled = await portfolioCard
      .locator('.bg-green-600, .bg-gray-300')
      .evaluate(el => el.classList.contains('bg-green-600'));

    // Click toggle
    await portfolioCard.locator('button[role=switch]').click();

    // Fill reason in modal
    await page.fill('textarea', 'Test E2E');
    await page.click('button:has-text("Conferma")');

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify state changed
    const newState = await portfolioCard
      .locator('.bg-green-600, .bg-gray-300')
      .evaluate(el => el.classList.contains('bg-green-600'));

    expect(newState).not.toBe(isEnabled);
  });

  test('should not allow disabling CORE module', async ({ page }) => {
    await page.goto('/admin/modules');

    const coreModule = page.locator('text=CORE').first().locator('..');
    const toggle = coreModule.locator('button[role=switch]');

    // Toggle should be disabled
    await expect(toggle).toBeDisabled();
  });

  test('dashboard widget should show stats', async ({ page }) => {
    await page.goto('/admin');

    // Check widget exists
    const widget = page.locator('text=Stato Moduli').locator('..');
    await expect(widget).toBeVisible();

    // Check has stats
    await expect(widget.locator('text=Attivi')).toBeVisible();
    await expect(widget.locator('text=Disattivi')).toBeVisible();

    // Click "Gestisci" link
    await widget.locator('text=Gestisci').click();
    await expect(page).toHaveURL('/admin/modules');
  });
});
```

**4. SCRIPT RUN ALL TESTS**
File: `scripts/run-all-tests.sh`

```bash
#!/bin/bash

echo "🧪 Running All Tests for Module System..."
echo ""

# Backend Unit Tests
echo "1️⃣ Backend Unit Tests..."
cd backend
npm run test -- module.service.test.ts
if [ $? -ne 0 ]; then
  echo "❌ Unit tests failed"
  exit 1
fi
echo "✅ Unit tests passed"
echo ""

# Backend Integration Tests
echo "2️⃣ Backend Integration Tests..."
npm run test:integration -- modules.api.test.ts
if [ $? -ne 0 ]; then
  echo "❌ Integration tests failed"
  exit 1
fi
echo "✅ Integration tests passed"
echo ""

# Frontend E2E Tests
echo "3️⃣ Frontend E2E Tests..."
cd ..
npm run test:e2e -- tests/e2e/modules.spec.ts
if [ $? -ne 0 ]; then
  echo "❌ E2E tests failed"
  exit 1
fi
echo "✅ E2E tests passed"
echo ""

echo "🎉 ALL TESTS PASSED!"
```

⚠️ REGOLE CRITICHE:
1. ✅ Test isolati (no side effects)
2. ✅ Cleanup dopo ogni test
3. ✅ Mock solo external services
4. ✅ Assertions chiare
5. ✅ Coverage > 80%

📝 DOCUMENTAZIONE:

**File**: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-09-testing.md`

```markdown
# 📋 Report Sessione 9 - Testing Suite

**Data**: 05/10/2025
**Status**: ✅ Completato

## ✅ Completato
- [x] Unit tests (30+ test)
- [x] Integration tests (15+ test)
- [x] E2E tests (5+ test)
- [x] Script run-all-tests.sh
- [x] Tutti test passati

## 🧪 Test Coverage
- ModuleService: 90%
- API Routes: 85%
- Frontend Pages: 75%
- **Overall: 80%+**

## 📊 Test Results
- Unit: 30 passed
- Integration: 15 passed
- E2E: 5 passed
- **Total: 50 passed, 0 failed**

## 🚀 Performance
- Unit tests: < 5s
- Integration: < 10s
- E2E: < 30s
- **Total: < 45s**
```

🧪 TESTING:
```bash
chmod +x scripts/run-all-tests.sh
./scripts/run-all-tests.sh
```

✅ CHECKLIST:
- [ ] Unit tests scritti (30+)
- [ ] Integration tests scritti (15+)
- [ ] E2E tests scritti (5+)
- [ ] Script run-all creato
- [ ] Tutti test passano
- [ ] Coverage > 80%
- [ ] Report creato
- [ ] Commit su Git

➡️ ULTIMA SESSIONE:
**SESSIONE 10**: Deploy, Documentazione Finale, Checklist

Al termine:
➡️ "SESSIONE 9 COMPLETATA - PRONTO PER SESSIONE 10 FINALE"
```
