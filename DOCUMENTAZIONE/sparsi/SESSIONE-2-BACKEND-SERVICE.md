# ⚙️ SESSIONE 2: Backend Service e API
**Durata Stimata**: 3 ore  
**Difficoltà**: Media-Alta  
**Cosa faremo**: Creeremo il codice che gestisce i moduli (accenderli/spegnerli) e le API per controllarlo

---

## 📋 PROMPT DA DARE A CLAUDE

Copia e incolla questo prompt in una nuova chat con Claude:

```
Ciao Claude! Continuiamo con la Sessione 2 del Sistema Moduli.

📚 LEGGI PRIMA QUESTI FILE:
1. /ISTRUZIONI-PROGETTO.md
2. /DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-1-database-moduli.md (quello creato nella sessione 1)
3. /backend/prisma/schema.prisma (per vedere le tabelle create)

🎯 OBIETTIVO SESSIONE 2:
Creare il codice backend che gestisce i moduli:
- Service per accendere/spegnere moduli
- API per controllare i moduli da interfaccia web
- Controlli di sicurezza (es: non spegnere moduli core)

---

## 📝 COSA DEVI FARE

### PASSO 1: BACKUP (se esistono file)

```bash
cd backend/src
# Se il file esiste già, fai backup
[ -f services/module.service.ts ] && cp services/module.service.ts services/module.service.ts.backup-$(date +%Y%m%d-%H%M%S)
```

### PASSO 2: CREA IL MODULE SERVICE

Crea il file `backend/src/services/module.service.ts`:

```typescript
// backend/src/services/module.service.ts
import { prisma } from '../config/database';
import { notificationService } from './notification.service';

class ModuleService {
  
  /**
   * Ottieni tutti i moduli del sistema
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
   * Ottieni moduli di una categoria specifica
   */
  async getModulesByCategory(category: string) {
    return await prisma.systemModule.findMany({
      where: { category: category as any },
      orderBy: { order: 'asc' }
    });
  }

  /**
   * Ottieni un modulo specifico
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
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!module) {
      throw new Error('Modulo non trovato');
    }

    return module;
  }

  /**
   * Verifica se un modulo è abilitato
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
   * Abilita un modulo
   */
  async enableModule(code: string, userId: string, reason?: string) {
    // 1. Trova il modulo
    const module = await prisma.systemModule.findUnique({
      where: { code }
    });

    if (!module) {
      throw new Error('Modulo non trovato');
    }

    if (module.isEnabled) {
      throw new Error('Modulo già abilitato');
    }

    // 2. Verifica dipendenze
    if (module.dependsOn && module.dependsOn.length > 0) {
      const dependencies = await prisma.systemModule.findMany({
        where: {
          code: { in: module.dependsOn },
          isEnabled: false
        }
      });

      if (dependencies.length > 0) {
        const names = dependencies.map(d => d.name).join(', ');
        throw new Error(`Impossibile abilitare. Dipendenze mancanti: ${names}`);
      }
    }

    // 3. Abilita il modulo
    const updated = await prisma.systemModule.update({
      where: { code },
      data: {
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy: userId
      }
    });

    // 4. Crea log nella history
    await prisma.moduleHistory.create({
      data: {
        moduleCode: code,
        action: 'ENABLED',
        performedBy: userId,
        reason,
        newValue: { isEnabled: true }
      }
    });

    // 5. Notifica gli admin
    await notificationService.emitToAdmins('module:enabled', {
      moduleName: module.name,
      enabledBy: userId
    });

    return updated;
  }

  /**
   * Disabilita un modulo
   */
  async disableModule(code: string, userId: string, reason?: string) {
    // 1. Trova il modulo
    const module = await prisma.systemModule.findUnique({
      where: { code }
    });

    if (!module) {
      throw new Error('Modulo non trovato');
    }

    // 2. Controlla se è un modulo core
    if (module.isCore) {
      throw new Error('Impossibile disabilitare un modulo core del sistema');
    }

    if (!module.isEnabled) {
      throw new Error('Modulo già disabilitato');
    }

    // 3. Verifica che nessun altro modulo attivo dipenda da questo
    const dependents = await prisma.systemModule.findMany({
      where: {
        dependsOn: { has: code },
        isEnabled: true
      }
    });

    if (dependents.length > 0) {
      const names = dependents.map(d => d.name).join(', ');
      throw new Error(`Impossibile disabilitare. Moduli dipendenti attivi: ${names}`);
    }

    // 4. Disabilita il modulo
    const updated = await prisma.systemModule.update({
      where: { code },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
        disabledBy: userId
      }
    });

    // 5. Crea log
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

    // 6. Notifica admin
    await notificationService.emitToAdmins('module:disabled', {
      moduleName: module.name,
      disabledBy: userId,
      reason
    });

    return updated;
  }

  /**
   * Aggiorna configurazione modulo
   */
  async updateModuleConfig(code: string, config: any, userId: string) {
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
   * Aggiorna un setting specifico
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
}

export const moduleService = new ModuleService();
```

### PASSO 3: CREA LE API ROUTES

Crea il file `backend/src/routes/admin/modules.routes.ts`:

```typescript
// backend/src/routes/admin/modules.routes.ts
import { Router } from 'express';
import { authenticate, authorizeRoles } from '../../middleware/auth.middleware';
import { moduleService } from '../../services/module.service';
import { ResponseFormatter } from '../../utils/responseFormatter';

const router = Router();

// Tutti gli endpoint richiedono autenticazione come ADMIN o SUPER_ADMIN
router.use(authenticate, authorizeRoles(['ADMIN', 'SUPER_ADMIN']));

/**
 * GET /api/admin/modules
 * Lista tutti i moduli
 */
router.get('/', async (req, res) => {
  try {
    const modules = await moduleService.getAllModules();
    return res.json(ResponseFormatter.success(modules));
  } catch (error: any) {
    return res.status(500).json(ResponseFormatter.error(error.message));
  }
});

/**
 * GET /api/admin/modules/category/:category
 * Moduli per categoria specifica
 */
router.get('/category/:category', async (req, res) => {
  try {
    const modules = await moduleService.getModulesByCategory(req.params.category);
    return res.json(ResponseFormatter.success(modules));
  } catch (error: any) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});

/**
 * GET /api/admin/modules/:code
 * Dettaglio modulo specifico
 */
router.get('/:code', async (req, res) => {
  try {
    const module = await moduleService.getModuleByCode(req.params.code);
    return res.json(ResponseFormatter.success(module));
  } catch (error: any) {
    const status = error.message === 'Modulo non trovato' ? 404 : 500;
    return res.status(status).json(ResponseFormatter.error(error.message));
  }
});

/**
 * POST /api/admin/modules/:code/enable
 * Abilita un modulo
 */
router.post('/:code/enable', async (req, res) => {
  try {
    const module = await moduleService.enableModule(
      req.params.code,
      req.user!.id,
      req.body.reason
    );
    return res.json(ResponseFormatter.success(module, 'Modulo abilitato con successo'));
  } catch (error: any) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});

/**
 * POST /api/admin/modules/:code/disable
 * Disabilita un modulo
 */
router.post('/:code/disable', async (req, res) => {
  try {
    const module = await moduleService.disableModule(
      req.params.code,
      req.user!.id,
      req.body.reason
    );
    return res.json(ResponseFormatter.success(module, 'Modulo disabilitato con successo'));
  } catch (error: any) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});

/**
 * PUT /api/admin/modules/:code/config
 * Aggiorna configurazione modulo
 */
router.put('/:code/config', async (req, res) => {
  try {
    const module = await moduleService.updateModuleConfig(
      req.params.code,
      req.body.config,
      req.user!.id
    );
    return res.json(ResponseFormatter.success(module, 'Configurazione aggiornata'));
  } catch (error: any) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});

/**
 * GET /api/admin/modules/:code/settings
 * Ottieni settings del modulo
 */
router.get('/:code/settings', async (req, res) => {
  try {
    const settings = await moduleService.getModuleSettings(req.params.code);
    return res.json(ResponseFormatter.success(settings));
  } catch (error: any) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});

/**
 * PUT /api/admin/modules/:code/settings/:key
 * Aggiorna un setting specifico
 */
router.put('/:code/settings/:key', async (req, res) => {
  try {
    const setting = await moduleService.updateModuleSetting(
      req.params.code,
      req.params.key,
      req.body.value,
      req.user!.id
    );
    return res.json(ResponseFormatter.success(setting, 'Setting aggiornato'));
  } catch (error: any) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});

/**
 * GET /api/admin/modules/:code/history
 * Storia modifiche modulo
 */
router.get('/:code/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await moduleService.getModuleHistory(req.params.code, limit);
    return res.json(ResponseFormatter.success(history));
  } catch (error: any) {
    return res.status(400).json(ResponseFormatter.error(error.message));
  }
});

export default router;
```

### PASSO 4: REGISTRA LE ROUTES

Modifica il file `backend/src/app.ts` e aggiungi:

```typescript
// Cerca le altre import admin routes e aggiungi
import moduleRoutes from './routes/admin/modules.routes';

// Cerca dove sono registrate le altre admin routes e aggiungi
app.use('/api/admin/modules', moduleRoutes);
```

### PASSO 5: ESPORTA IL SERVICE

Crea o modifica `backend/src/services/index.ts`:

```typescript
// Aggiungi questa riga
export { moduleService } from './module.service';
```

### PASSO 6: TESTA LE API

Riavvia il backend:
```bash
cd backend
npm run dev
```

Testa con curl o Postman:

```bash
# 1. Login come admin per ottenere token
# (usa le tue credenziali admin)

# 2. Lista tutti i moduli
curl http://localhost:3200/api/admin/modules \
  -H "Authorization: Bearer TUO_TOKEN"

# 3. Dettaglio modulo recensioni
curl http://localhost:3200/api/admin/modules/reviews \
  -H "Authorization: Bearer TUO_TOKEN"

# 4. Abilita modulo
curl -X POST http://localhost:3200/api/admin/modules/reviews/enable \
  -H "Authorization: Bearer TUO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Test abilitazione"}'

# 5. Disabilita modulo
curl -X POST http://localhost:3200/api/admin/modules/portfolio/disable \
  -H "Authorization: Bearer TUO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Manutenzione"}'
```

---

## 📝 DOCUMENTAZIONE DA CREARE

### 1. Report Sessione

Crea `DOCUMENTAZIONE/REPORT-SESSIONI/2025-10-05-sessione-2-backend-service.md`:

```markdown
# Report Sessione 2 - Backend Service + API

**Data**: 05/10/2025
**Durata**: [scrivi quanto tempo]
**Status**: ✅ Completato

## Obiettivo
Implementare business logic e API REST per gestione moduli.

## Completato
- [x] ModuleService creato (12 metodi)
- [x] API Routes create (9 endpoint)
- [x] Routes registrate in app.ts
- [x] Service esportato da index.ts
- [x] Validazione dipendenze implementata
- [x] History tracking funzionante
- [x] Notifiche admin integrate

## File Creati/Modificati
- `backend/src/services/module.service.ts` (nuovo)
- `backend/src/routes/admin/modules.routes.ts` (nuovo)
- `backend/src/app.ts` (aggiornato)
- `backend/src/services/index.ts` (aggiornato)

## API Endpoint Implementati
1. GET /api/admin/modules - Lista tutti
2. GET /api/admin/modules/category/:category - Per categoria
3. GET /api/admin/modules/:code - Dettaglio
4. POST /api/admin/modules/:code/enable - Abilita
5. POST /api/admin/modules/:code/disable - Disabilita
6. PUT /api/admin/modules/:code/config - Config
7. GET /api/admin/modules/:code/settings - Settings
8. PUT /api/admin/modules/:code/settings/:key - Update setting
9. GET /api/admin/modules/:code/history - Storia

## Testing Eseguito
- ✅ Lista moduli (66 ritornati)
- ✅ Enable modulo (con check dipendenze)
- ✅ Disable modulo (con check moduli dipendenti)
- ✅ Disable modulo core (bloccato correttamente)
- ✅ Update config
- ✅ History tracking OK
- ✅ Notifiche admin ricevute

## Problemi Riscontrati
[Nessuno / Descrivi qui]

## Prossimi Passi
Sessione 3: Middleware + Protezione Routes
```

### 2. Documentazione API

Crea `DOCUMENTAZIONE/ATTUALE/03-API/API-MODULES.md`:

```markdown
# API Gestione Moduli

## Base URL
`/api/admin/modules`

## Autenticazione
Tutti gli endpoint richiedono:
- Header: `Authorization: Bearer {token}`
- Ruolo: `ADMIN` o `SUPER_ADMIN`

## Endpoint

### GET /
Lista tutti i moduli del sistema.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "code": "reviews",
      "name": "Sistema Recensioni",
      "category": "ADVANCED",
      "isEnabled": true,
      "isCore": false,
      "dependsOn": ["requests"],
      "_count": {
        "settings": 3
      }
    }
  ]
}
```

### POST /:code/enable
Abilita un modulo.

**Body:**
```json
{
  "reason": "Attivazione feature recensioni" // opzionale
}
```

**Response:**
```json
{
  "success": true,
  "message": "Modulo abilitato con successo",
  "data": {
    "code": "reviews",
    "isEnabled": true,
    "enabledAt": "2025-10-05T10:30:00Z"
  }
}
```

**Errori:**
- 400: "Dipendenze mancanti: Sistema Richieste"
- 400: "Modulo già abilitato"
- 404: "Modulo non trovato"

### POST /:code/disable
Disabilita un modulo.

**Body:**
```json
{
  "reason": "Manutenzione programmata" // opzionale
}
```

**Errori:**
- 400: "Impossibile disabilitare un modulo core"
- 400: "Moduli dipendenti attivi: Portfolio, Analytics"
- 404: "Modulo non trovato"

[Documenta gli altri endpoint...]
```

---

## ✅ CHECKLIST COMPLETAMENTO

- [ ] ModuleService creato con 12 metodi
- [ ] Routes API create (9 endpoint)
- [ ] Routes registrate in app.ts
- [ ] Service esportato da index.ts
- [ ] Backend riavviato senza errori
- [ ] Test GET /api/admin/modules (ritorna 66 moduli)
- [ ] Test enable modulo (funziona)
- [ ] Test disable modulo (funziona)
- [ ] Test disable modulo core (bloccato)
- [ ] Test dipendenze (valida correttamente)
- [ ] Report sessione creato
- [ ] Documentazione API creata
- [ ] File committati su Git

## 💾 COMANDI GIT

```bash
git add backend/src/services/module.service.ts
git add backend/src/routes/admin/modules.routes.ts
git add backend/src/app.ts
git add backend/src/services/index.ts
git add DOCUMENTAZIONE/

git commit -m "feat: add module management service and API

- Add ModuleService with enable/disable logic
- Add 9 API endpoints for module management
- Add dependency validation
- Add history tracking
- Add admin notifications"

git push origin main
```

---

🎉 **SESSIONE 2 COMPLETATA! Pronto per Sessione 3.**
```

Buon lavoro! 🚀
