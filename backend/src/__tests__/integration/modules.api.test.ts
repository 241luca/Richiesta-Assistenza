/**
 * Integration Tests per Modules API Routes
 * Testa tutti gli endpoint API del sistema moduli
 * 
 * @author Sistema Richiesta Assistenza
 * @version 1.0.0
 * @updated 2025-10-06
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { moduleService } from '../../services/module.service';
import { ResponseFormatter } from '../../utils/responseFormatter';

// Mock del moduleService
vi.mock('../../services/module.service', () => ({
  moduleService: {
    getAllModules: vi.fn(),
    getModuleByCode: vi.fn(),
    getModulesByCategory: vi.fn(),
    enableModule: vi.fn(),
    disableModule: vi.fn(),
    updateModuleConfig: vi.fn(),
    getModuleSettings: vi.fn(),
    updateModuleSetting: vi.fn(),
    getModuleHistory: vi.fn(),
    getModuleStats: vi.fn(),
    validateDependencies: vi.fn(),
    getModulesWithDependencies: vi.fn(),
  },
}));

// Mock middleware auth
vi.mock('../../middleware/auth', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { 
      id: 'admin-user-123', 
      role: 'ADMIN',
      email: 'admin@test.com' 
    };
    next();
  },
}));

vi.mock('../../middleware/authorize', () => ({
  authorize: (...roles: string[]) => (req: any, res: any, next: any) => {
    if (roles.includes(req.user?.role)) {
      next();
    } else {
      res.status(403).json(ResponseFormatter.error('Access denied', 'FORBIDDEN'));
    }
  },
}));

// Crea app test
import express from 'express';
import modulesRoutes from '../../routes/admin/modules.routes';

const app = express();
app.use(express.json());
app.use('/api/admin/modules', modulesRoutes);

describe('Modules API - Integration Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // TEST ENDPOINT LETTURA MODULI
  // ============================================

  describe('GET /api/admin/modules', () => {
    it('should return all modules successfully', async () => {
      const mockModules = [
        {
          id: '1',
          code: 'auth',
          name: 'Autenticazione',
          description: 'Sistema autenticazione',
          category: 'CORE',
          isEnabled: true,
          isCore: true,
          _count: { settings: 5, history: 10 }
        },
        {
          id: '2',
          code: 'reviews', 
          name: 'Recensioni',
          description: 'Sistema recensioni',
          category: 'FEATURE',
          isEnabled: true,
          isCore: false,
          _count: { settings: 3, history: 5 }
        }
      ];

      moduleService.getAllModules.mockResolvedValue(mockModules);

      const response = await request(app)
        .get('/api/admin/modules')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockModules);
      expect(response.body.message).toBe('Moduli recuperati con successo');
      expect(response.body.data).toHaveLength(2);
    });

    it('should apply query filters correctly', async () => {
      moduleService.getAllModules.mockResolvedValue([]);

      await request(app)
        .get('/api/admin/modules')
        .query({
          category: 'CORE',
          isEnabled: 'true',
          isCore: 'true', 
          search: 'auth'
        })
        .expect(200);

      expect(moduleService.getAllModules).toHaveBeenCalledWith({
        category: 'CORE',
        isEnabled: true,
        isCore: true,
        search: 'auth'
      });
    });

    it('should handle service errors gracefully', async () => {
      moduleService.getAllModules.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/modules')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FETCH_ERROR');
      expect(response.body.message).toBe('Errore nel recupero moduli');
    });
  });

  describe('GET /api/admin/modules/category/:category', () => {
    it('should return modules by category', async () => {
      const mockCoreModules = [
        {
          id: '1',
          code: 'auth',
          name: 'Autenticazione',
          category: 'CORE',
          isEnabled: true,
          isCore: true,
          _count: { settings: 5 }
        }
      ];

      moduleService.getModulesByCategory.mockResolvedValue(mockCoreModules);

      const response = await request(app)
        .get('/api/admin/modules/category/CORE')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCoreModules);
      expect(response.body.message).toBe('Moduli categoria CORE recuperati con successo');
      
      expect(moduleService.getModulesByCategory).toHaveBeenCalledWith('CORE');
    });

    it('should handle invalid category', async () => {
      moduleService.getModulesByCategory.mockRejectedValue(new Error('Invalid category'));

      const response = await request(app)
        .get('/api/admin/modules/category/INVALID')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CATEGORY_ERROR');
    });
  });

  describe('GET /api/admin/modules/:code', () => {
    it('should return specific module with complete data', async () => {
      const mockModule = {
        id: '1',
        code: 'reviews',
        name: 'Recensioni',
        description: 'Sistema recensioni clienti',
        category: 'FEATURE',
        isEnabled: true,
        isCore: false,
        settings: [
          { key: 'max_reviews', value: '100' }
        ],
        history: [
          { 
            id: '1', 
            action: 'ENABLED',
            createdAt: new Date(),
            user: { firstName: 'Admin', lastName: 'User' }
          }
        ],
        _count: { settings: 1, history: 1 }
      };

      moduleService.getModuleByCode.mockResolvedValue(mockModule);

      const response = await request(app)
        .get('/api/admin/modules/reviews')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockModule);
      expect(response.body.message).toBe('Modulo recuperato con successo');
      
      expect(moduleService.getModuleByCode).toHaveBeenCalledWith('reviews');
    });

    it('should handle module not found', async () => {
      moduleService.getModuleByCode.mockRejectedValue(new Error('Modulo non trovato'));

      const response = await request(app)
        .get('/api/admin/modules/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MODULE_NOT_FOUND');
      expect(response.body.message).toBe('Modulo non trovato');
    });
  });

  // ============================================
  // TEST ENDPOINT ABILITAZIONE/DISABILITAZIONE
  // ============================================

  describe('POST /api/admin/modules/:code/enable', () => {
    it('should enable module successfully', async () => {
      const updatedModule = {
        id: '1',
        code: 'portfolio',
        name: 'Portfolio',
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy: 'admin-user-123'
      };

      moduleService.enableModule.mockResolvedValue(updatedModule);

      const response = await request(app)
        .post('/api/admin/modules/portfolio/enable')
        .send({ reason: 'Test enable from API' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedModule);
      expect(response.body.message).toBe('Modulo abilitato con successo');
      
      expect(moduleService.enableModule).toHaveBeenCalledWith(
        'portfolio',
        'admin-user-123', 
        'Test enable from API'
      );
    });

    it('should handle enable errors', async () => {
      moduleService.enableModule.mockRejectedValue(
        new Error('Dipendenze mancanti: Richieste')
      );

      const response = await request(app)
        .post('/api/admin/modules/reviews/enable')
        .send({ reason: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ENABLE_ERROR');
      expect(response.body.message).toBe('Dipendenze mancanti: Richieste');
    });

    it('should handle module already enabled', async () => {
      moduleService.enableModule.mockRejectedValue(
        new Error('Modulo già abilitato')
      );

      const response = await request(app)
        .post('/api/admin/modules/auth/enable')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Modulo già abilitato');
    });
  });

  describe('POST /api/admin/modules/:code/disable', () => {
    it('should disable non-core module successfully', async () => {
      const updatedModule = {
        id: '1',
        code: 'portfolio',
        name: 'Portfolio',
        isEnabled: false,
        disabledAt: new Date(),
        disabledBy: 'admin-user-123'
      };

      moduleService.disableModule.mockResolvedValue(updatedModule);

      const response = await request(app)
        .post('/api/admin/modules/portfolio/disable')
        .send({ reason: 'Test disable' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedModule);
      expect(response.body.message).toBe('Modulo disabilitato con successo');
      
      expect(moduleService.disableModule).toHaveBeenCalledWith(
        'portfolio',
        'admin-user-123',
        'Test disable'
      );
    });

    it('should fail to disable core module', async () => {
      moduleService.disableModule.mockRejectedValue(
        new Error('Impossibile disabilitare modulo core del sistema')
      );

      const response = await request(app)
        .post('/api/admin/modules/auth/disable')
        .send({ reason: 'Test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('modulo core');
    });

    it('should fail if dependents are active', async () => {
      moduleService.disableModule.mockRejectedValue(
        new Error('Impossibile disabilitare. Moduli dipendenti attivi: Recensioni')
      );

      const response = await request(app)
        .post('/api/admin/modules/requests/disable')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('dipendenti attivi');
    });
  });

  // ============================================
  // TEST ENDPOINT CONFIGURAZIONE
  // ============================================

  describe('PUT /api/admin/modules/:code/config', () => {
    it('should update module configuration', async () => {
      const updatedModule = {
        id: '1',
        code: 'whatsapp',
        name: 'WhatsApp',
        config: { timeout: 5000, retries: 3 }
      };

      moduleService.updateModuleConfig.mockResolvedValue(updatedModule);

      const response = await request(app)
        .put('/api/admin/modules/whatsapp/config')
        .send({ 
          config: { timeout: 5000, retries: 3 }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedModule);
      expect(response.body.message).toBe('Configurazione aggiornata con successo');
      
      expect(moduleService.updateModuleConfig).toHaveBeenCalledWith(
        'whatsapp',
        { timeout: 5000, retries: 3 },
        'admin-user-123'
      );
    });

    it('should handle config update errors', async () => {
      moduleService.updateModuleConfig.mockRejectedValue(
        new Error('Configurazione non valida')
      );

      const response = await request(app)
        .put('/api/admin/modules/whatsapp/config')
        .send({ config: { invalid: 'config' } })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFIG_UPDATE_ERROR');
    });
  });

  // ============================================
  // TEST ENDPOINT SETTINGS
  // ============================================

  describe('GET /api/admin/modules/:code/settings', () => {
    it('should return module settings', async () => {
      const mockSettings = [
        {
          id: '1',
          moduleCode: 'whatsapp',
          key: 'session_name',
          value: 'production',
          category: 'connection',
          order: 1
        },
        {
          id: '2',
          moduleCode: 'whatsapp',
          key: 'timeout', 
          value: '5000',
          category: 'connection',
          order: 2
        }
      ];

      moduleService.getModuleSettings.mockResolvedValue(mockSettings);

      const response = await request(app)
        .get('/api/admin/modules/whatsapp/settings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSettings);
      expect(response.body.message).toBe('Settings recuperati con successo');
      
      expect(moduleService.getModuleSettings).toHaveBeenCalledWith('whatsapp');
    });
  });

  describe('PUT /api/admin/modules/:code/settings/:key', () => {
    it('should update module setting successfully', async () => {
      const updatedSetting = {
        id: '1',
        moduleCode: 'whatsapp',
        key: 'session_name',
        value: 'production'
      };

      moduleService.updateModuleSetting.mockResolvedValue(updatedSetting);

      const response = await request(app)
        .put('/api/admin/modules/whatsapp/settings/session_name')
        .send({ value: 'production' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(updatedSetting);
      expect(response.body.message).toBe('Setting aggiornato con successo');
      
      expect(moduleService.updateModuleSetting).toHaveBeenCalledWith(
        'whatsapp',
        'session_name',
        'production',
        'admin-user-123'
      );
    });

    it('should handle setting not found error', async () => {
      moduleService.updateModuleSetting.mockRejectedValue(
        new Error('Setting non trovato')
      );

      const response = await request(app)
        .put('/api/admin/modules/whatsapp/settings/non-existent')
        .send({ value: 'test' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Setting non trovato');
    });
  });

  // ============================================
  // TEST ENDPOINT HISTORY
  // ============================================

  describe('GET /api/admin/modules/:code/history', () => {
    it('should return module history with user data', async () => {
      const mockHistory = [
        {
          id: '1',
          moduleCode: 'portfolio',
          action: 'ENABLED',
          performedBy: 'user1',
          reason: 'Test enable',
          createdAt: new Date(),
          user: {
            id: 'user1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
          }
        }
      ];

      moduleService.getModuleHistory.mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/admin/modules/portfolio/history')
        .query({ limit: '10' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockHistory);
      expect(response.body.message).toBe('Storico recuperato con successo');
      
      expect(moduleService.getModuleHistory).toHaveBeenCalledWith('portfolio', 10);
    });

    it('should use default limit when not specified', async () => {
      moduleService.getModuleHistory.mockResolvedValue([]);

      await request(app)
        .get('/api/admin/modules/portfolio/history')
        .expect(200);

      expect(moduleService.getModuleHistory).toHaveBeenCalledWith('portfolio', 50);
    });
  });

  // ============================================
  // TEST ENDPOINT STATISTICS
  // ============================================

  describe('GET /api/admin/modules/stats', () => {
    it('should return module statistics', async () => {
      const mockStats = {
        total: 66,
        enabled: 65,
        disabled: 1,
        core: 12,
        byCategory: [
          { category: 'CORE', count: 12 },
          { category: 'FEATURE', count: 25 },
          { category: 'BUSINESS', count: 15 },
          { category: 'ADMIN', count: 8 },
          { category: 'INTEGRATION', count: 6 }
        ]
      };

      moduleService.getModuleStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/admin/modules/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockStats);
      expect(response.body.message).toBe('Statistiche recuperate con successo');
      
      expect(moduleService.getModuleStats).toHaveBeenCalled();
    });

    it('should handle stats fetch errors', async () => {
      moduleService.getModuleStats.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/admin/modules/stats')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('STATS_ERROR');
    });
  });

  // ============================================
  // TEST ENDPOINT DIPENDENZE
  // ============================================

  describe('GET /api/admin/modules/dependencies/validate', () => {
    it('should validate dependencies successfully', async () => {
      const mockValidation = {
        valid: true,
        errors: [],
        warnings: []
      };

      moduleService.validateDependencies.mockResolvedValue(mockValidation);

      const response = await request(app)
        .get('/api/admin/modules/dependencies/validate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockValidation);
      expect(response.body.message).toBe('Validazione completata: nessun errore');
      
      expect(moduleService.validateDependencies).toHaveBeenCalled();
    });

    it('should report validation errors', async () => {
      const mockValidation = {
        valid: false,
        errors: ['Modulo reviews dipende da requests che non esiste'],
        warnings: ['Modulo auth è disabilitato ma richiesto da users']
      };

      moduleService.validateDependencies.mockResolvedValue(mockValidation);

      const response = await request(app)
        .get('/api/admin/modules/dependencies/validate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockValidation);
      expect(response.body.message).toBe('Validazione completata: errori trovati');
    });
  });

  describe('GET /api/admin/modules/dependencies/list', () => {
    it('should return modules with dependencies', async () => {
      const mockModulesWithDeps = [
        {
          code: 'reviews',
          name: 'Recensioni',
          isEnabled: true,
          dependsOn: ['requests', 'users'],
          requiredFor: [],
          category: 'FEATURE'
        },
        {
          code: 'portfolio',
          name: 'Portfolio',
          isEnabled: true,
          dependsOn: ['users'],
          requiredFor: ['reviews'],
          category: 'FEATURE'
        }
      ];

      moduleService.getModulesWithDependencies.mockResolvedValue(mockModulesWithDeps);

      const response = await request(app)
        .get('/api/admin/modules/dependencies/list')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockModulesWithDeps);
      expect(response.body.message).toBe('Moduli con dipendenze recuperati con successo');
      
      expect(moduleService.getModulesWithDependencies).toHaveBeenCalled();
    });
  });

  // ============================================
  // TEST AUTORIZZAZIONE
  // ============================================

  describe('Authorization Tests', () => {
    it('should require ADMIN or SUPER_ADMIN role', async () => {
      // Temporarily override auth mock to simulate unauthorized user
      const unauthorizedApp = express();
      unauthorizedApp.use(express.json());
      
      // Mock unauthorized user
      unauthorizedApp.use('/api/admin/modules', (req: any, res: any, next: any) => {
        req.user = { id: 'client-123', role: 'CLIENT' };
        next();
      }, modulesRoutes);

      const response = await request(unauthorizedApp)
        .get('/api/admin/modules')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  // ============================================
  // TEST ERROR HANDLING
  // ============================================

  describe('Error Handling', () => {
    it('should handle unexpected service errors', async () => {
      moduleService.getAllModules.mockRejectedValue(new Error('Unexpected error'));

      const response = await request(app)
        .get('/api/admin/modules')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FETCH_ERROR');
    });

    it('should handle malformed request bodies gracefully', async () => {
      const response = await request(app)
        .post('/api/admin/modules/portfolio/enable')
        .send('invalid json')
        .type('json')
        .expect(400);

      // Express should handle JSON parsing errors
    });
  });
});
