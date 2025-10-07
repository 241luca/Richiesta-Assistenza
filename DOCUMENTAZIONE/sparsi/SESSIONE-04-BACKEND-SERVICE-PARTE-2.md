# 🔄 SESSIONE 4: Backend Service Parte 2 + API Routes
**Durata Stimata**: 2 ore  
**Complessità**: Alta  
**Prerequisiti**: Sessioni 1-3 completate

---

## 📋 PROMPT PER CLAUDE

```
Ciao Claude! SESSIONE 4 di 10 - Backend Service Parte 2 + API Routes.

📚 DOCUMENTI DA LEGGERE:
1. /ISTRUZIONI-PROGETTO.md (ResponseFormatter, error handling)
2. /backend/src/services/module.service.ts (codice sessione 3)
3. /backend/src/routes/ (esempi routes esistenti)

📖 RIFERIMENTI:
- Piano: /admin-implementation-plan.md (sezione Backend Service + Routes)
- Report sessioni precedenti

🎯 OBIETTIVO SESSIONE 4:
Completare ModuleService con enable/disable/settings + creare API Routes complete.

📋 TASK DA COMPLETARE:

**1. COMPLETARE MODULE SERVICE**
Apri `backend/src/services/module.service.ts` e aggiungi:

```typescript
// AGGIUNGI questi import
import { notificationService } from './notification.service';

// AGGIUNGI questi metodi alla classe ModuleService:

  /**
   * Abilita modulo con check dipendenze
   */
  async enableModule(
    code: string, 
    userId: string, 
    reason?: string
  ) {
    const module = await prisma.systemModule.findUnique({
      where: { code }
    });

    if (!module) {
      throw new Error('Modulo non trovato');
    }

    if (module.isEnabled) {
      throw new Error('Modulo già abilitato');
    }

    // Verifica dipendenze
    if (module.dependsOn && module.dependsOn.length > 0) {
      const dependencies = await prisma.systemModule.findMany({
        where: {
          code: { in: module.dependsOn },
          isEnabled: false
        }
      });

      if (dependencies.length > 0) {
        throw new Error(
          `Impossibile abilitare. Dipendenze mancanti: ${dependencies.map(d => d.name).join(', ')}`
        );
      }
    }

    // Abilita modulo
    const updated = await prisma.systemModule.update({
      where: { code },
      data: {
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy: userId
      }
    });

    // Log history
    await prisma.moduleHistory.create({
      data: {
        moduleCode: code,
        action: 'ENABLED',
        performedBy: userId,
        reason,
        newValue: { isEnabled: true }
      }
    });

    // Notifica admins
    try {
      await notificationService.emitToAdmins('module:enabled', {
        moduleName: module.name,
        enabledBy: userId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return updated;
  }

  /**
   * Disabilita modulo con check moduli dipendenti
   */
  async disableModule(
    code: string,
    userId: string,
    reason?: string
  ) {
    const module = await prisma.systemModule.findUnique({
      where: { code }
    });

    if (!module) {
      throw new Error('Modulo non trovato');
    }

    if (module.isCore) {
      throw new Error('Impossibile disabilitare modulo core del sistema');
    }

    if (!module.isEnabled) {
      throw new Error('Modulo già disabilitato');
    }

    // Verifica moduli dipendenti
    const dependents = await prisma.systemModule.findMany({
      where: {
        dependsOn: { has: code },
        isEnabled: true
      }
    });

    if (dependents.length > 0) {
      throw new Error(
        `Impossibile disabilitare. Moduli dipendenti attivi: ${dependents.map(d => d.name).join(', ')}`
      );
    }

    // Disabilita
    const updated = await prisma.systemModule.update({
      where: { code },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
        disabledBy: userId
      }
    });

    // Log
    await prisma.moduleHistory.create({
      data: {
        moduleCode: code,
        action: 'DISABLED',
        performedBy: userId,
        reason,
        oldValue: { isEnabled: true },
        newValue: { isEnabled: false }
      }
    });

    // Notifica
    try {
      await notificationService.emitToAdmins('module:disabled', {
        moduleName: module.name,
        disabledBy: userId,
        reason,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }

    return updated;
  }

  /**
   * Aggiorna configurazione modulo
   */
  async updateModuleConfig(
    code: string,
    config: any,
    userId: string
  ) {
    const module = await prisma.systemModule.findUnique({
      where: { code }
    });

    if (!module) {
      throw new Error('Modulo non trovato');
    }

    const oldConfig = module.config;

    const updated = await prisma.systemModule.update({
      where: { code },
      data: { config }
    });

    // Log
    await prisma.moduleHistory.create({
      data: {
        moduleCode: code,
        action: 'CONFIG_CHANGED',
        performedBy: userId,
        oldValue: oldConfig,
        newValue: config
      }
    });

    return updated;
  }

  /**
   * Ottieni settings di un modulo
   */
  async getModuleSettings(code: string) {
    return await prisma.moduleSetting.findMany({
      where: { moduleCode: code },
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ]
    });
  }

  /**
   * Aggiorna singolo setting
   */
  async updateModuleSetting(
    code: string,
    settingKey: string,
    value: string,
    userId: string
  ) {
    const setting = await prisma.moduleSetting.findUnique({
      where: {
        moduleCode_key: {
          moduleCode: code,
          key: settingKey
        }
      }
    });

    if (!setting) {
      throw new Error('Setting non trovato');
    }

    const updated = await prisma.moduleSetting.update({
      where: {
        moduleCode_key: {
          moduleCode: code,
          key: settingKey
        }
      },
      data: { value }
    });

    // Log
    await prisma.moduleHistory.create({
      data: {
        moduleCode: code,
        action: 'SETTING_UPDATED',
        performedBy: userId,
        oldValue: { [settingKey]: setting.value },
        newValue: { [settingKey]: value }
      }
    });

    return updated;
  }

  /**
   * Ottieni storia modifiche modulo
   */
  async getModuleHistory(code: string, limit: number = 50) {
    return await prisma.moduleHistory.findMany({
      where: { moduleCode: code },
      orderBy: { createdAt: 'desc' },
      take: limit,
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
    });
  }
```

**2. CREARE API ROUTES**
File: `backend/src/routes/admin/modules.routes.ts`

```typescript
import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middleware/auth.middleware';
import { moduleService } from '../../services/module.service';
import { ResponseFormatter } from '../../utils/responseFormatter';

const router = Router();

// Tutti richiedono ADMIN o SUPER_ADMIN
router.use(authenticate, authorizeRoles(['ADMIN', 'SUPER_ADMIN']));

/**
 * GET /api/admin/modules
 */
router.get('/', async (req, res) => {
  try {
    const modules = await moduleService.getAllModules();
    return res.json(ResponseFormatter.success(modules));
  } catch (error: any) {
    return res.status(500).json(
      ResponseFormatter.error(error.message)
    );
  }
});

/**
 * GET /api/admin/modules/category/:category
 */
router.get('/category/:category', async (req, res) => {
  try {
    const modules = await moduleService.getModulesByCategory(
      req.params.category as any
    );
    return res.json(ResponseFormatter.success(modules));
  } catch (error: any) {
    return res.status(400).json(
      ResponseFormatter.error(error.message)
    );
  }
});

/**
 * GET /api/admin/modules/:code
 */
router.get('/:code', async (req, res) => {
  try {
    const module = await moduleService.getModuleByCode(req.params.code);
    return res.json(ResponseFormatter.success(module));
  } catch (error: any) {
    return res.status(404).json(
      ResponseFormatter.error(error.message)
    );
  }
});

/**
 * POST /api/admin/modules/:code/enable
 */
router.post('/:code/enable', async (req, res) => {
  try {
    const module = await moduleService.enableModule(
      req.params.code,
      req.user.id,
      req.body.reason
    );
    return res.json(
      ResponseFormatter.success(module, 'Modulo abilitato con successo')
    );
  } catch (error: any) {
    return res.status(400).json(
      ResponseFormatter.error(error.message)
    );
  }
});

/**
 * POST /api/admin/modules/:code/disable
 */
router.post('/:code/disable', async (req, res) => {
  try {
    const module = await moduleService.disableModule(
      req.params.code,
      req.user.id,
      req.body.reason
    );
    return res.json(
      ResponseFormatter.success(module, 'Modulo disabilitato con successo')
    );
  } catch (error: any) {
    return res.status(400).json(
      ResponseFormatter.error(error.message)
    );
  }
});

/**
 * PUT /api/admin/modules/:code/config
 */
router.put('/:code/config', async (req, res) => {
  try {
    const module = await moduleService.updateModuleConfig(
      req.params.code,
      req.body.config,
      req.user.id
    );
    return res.json(
      ResponseFormatter.success(module, 'Configurazione aggiornata')
    );
  } catch (error: any) {
    return res.status(400).json(
      ResponseFormatter.error(error.message)
    );
  }
});

/**
 * GET /api/admin/modules/:code/settings
 */
router.get('/:code/settings', async (req, res) => {
  try {
    const settings = await moduleService.getModuleSettings(req.params.code);
    return res.json(ResponseFormatter.success(settings));
  } catch (error: any) {
    return res.status(400).json(
      ResponseFormatter.error(error.message)
    );
  }
});

/**
 * PUT /api/admin/modules/:code/settings/:key
 */
router.put('/:code/settings/:key', async (req, res) => {
  try {
    const setting = await moduleService.updateModuleSetting(
      req.params.code,
      req.params.key,
      req.body.value,
      req.user.id
    );
    return res.json(
      ResponseFormatter.success(setting, 'Setting aggiornato')
    );
  } catch (error: any) {
    return res.status(400).json(
      ResponseFormatter.error(error.message)
    );
  }
});

/**
 * GET /api/admin/modules/:code/history
 */
router.get('/:code/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await moduleService.getModuleHistory(
      req.params.code,
      limit
    );
    return res.json(ResponseFormatter.success(history));
  } catch (error: any) {
    return res.status(400).json(
      ResponseFormatter.error(error.message)
    );
  }
});

export default router;
```

**3. REGISTRARE ROUTES**
File: `backend/src/app.ts`

Aggiungi dopo le altre admin routes:

```typescript
import moduleRoutes from './routes/admin/modules.routes';

// DOPO routes esistenti
app.use('/api/admin/modules', moduleRoutes);
```

**4. TEST API CON HTTP FILE**
File: `backend/tests/api/modules.test.http`

```http
@baseUrl = http://localhost:3200
@token = {{adminToken}}

### Get all modules
GET {{baseUrl}}/api/admin/modules
Authorization: Bearer {{token}}

### Get CORE modules
GET {{baseUrl}}/api/admin/modules/category/CORE
Authorization: Bearer {{token}}

### Get specific module
GET {{baseUrl}}/api/admin/modules/reviews
Authorization: Bearer {{token}}

### Enable module
POST {{baseUrl}}/api/admin/modules/portfolio/enable
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "reason": "Test enable from API"
}

### Disable module
POST {{baseUrl}}/api/admin/modules/portfolio/disable
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "reason": "Test disable"
}

### Get module settings
GET {{baseUrl}}/api/admin/modules/whatsapp/settings
Authorization: Bearer {{token}}

### Update setting
PUT {{baseUrl}}/api/admin/modules/whatsapp/settings/session_name
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "value": "production"
}

### Get module history
GET {{baseUrl}}/api/admin/modules/reviews/history?limit=10
Authorization: Bearer {{token}}
```

⚠️ REGOLE CRITICHE:
1. ✅ Service MAI ResponseFormatter
2. ✅ Routes SEMPRE ResponseFormatter
3. ✅ Try/catch su TUTTE routes
4. ✅ Status code appropriati (200, 400, 404, 500)
5. ✅ Validazione dipendenze prima enable/disable
6. ✅ History log per TUTTE modifiche
7. ✅ Notifiche admin (con try/catch)

📝 DOCUMENTAZIONE DA CREARE:

**File**: `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-04-backend-api.md`

```markdown
# 📋 Report Sessione 4 - Backend API Complete

**Data**: 05/10/2025
**Status**: ✅ Completato

## ✅ Completato
- [x] ModuleService completato (6 nuovi metodi)
- [x] API Routes create (9 endpoint)
- [x] Routes registrate in app.ts
- [x] Test HTTP file creato
- [x] Tutti endpoint testati

## 🔧 Metodi Aggiunti
1. enableModule() - Con check dipendenze
2. disableModule() - Con check requiredFor
3. updateModuleConfig() - Config JSON
4. getModuleSettings() - Lista settings
5. updateModuleSetting() - Update singolo
6. getModuleHistory() - Log modifiche

## 📡 API Endpoint
- GET /api/admin/modules
- GET /api/admin/modules/category/:category
- GET /api/admin/modules/:code
- POST /api/admin/modules/:code/enable
- POST /api/admin/modules/:code/disable
- PUT /api/admin/modules/:code/config
- GET /api/admin/modules/:code/settings
- PUT /api/admin/modules/:code/settings/:key
- GET /api/admin/modules/:code/history

## 🧪 Testing
✅ Tutti 9 endpoint testati e funzionanti
```

🧪 TESTING:
```bash
# Avvia backend
cd backend
npm run dev

# In altro terminale, test con curl:
curl http://localhost:3200/api/admin/modules \
  -H "Authorization: Bearer TOKEN"

# O usa Thunder Client / Postman con file .http
```

✅ CHECKLIST:
- [ ] Metodi service aggiunti (6)
- [ ] Routes file creato
- [ ] Routes registrate
- [ ] HTTP test file creato
- [ ] Tutti endpoint testati
- [ ] Enable/disable funziona
- [ ] History logging OK
- [ ] Notifiche inviate
- [ ] Report creato
- [ ] Commit su Git

➡️ PROSSIMA SESSIONE:
**SESSIONE 5**: Middleware Protezione Routes

---

Al termine:
1. ✅ Status checklist
2. 📸 Screenshot test API
3. ➡️ "SESSIONE 4 COMPLETATA - PRONTO PER SESSIONE 5"
```
