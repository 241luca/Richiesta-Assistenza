/**
 * Test Suite per Module Service
 * Verifica tutte le funzionalità del servizio moduli
 * 
 * @author Sistema Richiesta Assistenza  
 * @version 1.0.0
 * @updated 2025-10-06
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { moduleService } from '../../services/module.service';
import { prisma } from '../../config/database';
import { notificationService } from '../../services/notification.service';

// Mock delle dipendenze principali
vi.mock('../../config/database', () => ({
  prisma: {
    systemModule: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    moduleSetting: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    moduleHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../services/notification.service', () => ({
  notificationService: {
    emitToAdmins: vi.fn(),
  },
}));

vi.mock('../../middleware/module.middleware', () => ({
  invalidateModuleCache: vi.fn(),
}));

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('ModuleService - Unit Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================
  // TEST LETTURA MODULI
  // ============================================
  
  describe('getAllModules', () => {
    it('should return all modules without filters', async () => {
      const mockModules = [
        {
          id: '1',
          code: 'auth',
          name: 'Autenticazione',
          description: 'Sistema autenticazione',
          category: 'CORE',
          isEnabled: true,
          isCore: true,
          order: 1,
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
          order: 2,
          _count: { settings: 3, history: 5 }
        }
      ];

      prisma.systemModule.findMany.mockResolvedValue(mockModules);

      const result = await moduleService.getAllModules();

      expect(prisma.systemModule.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [
          { category: 'asc' },
          { order: 'asc' }
        ],
        include: {
          _count: {
            select: { 
              settings: true,
              history: true
            }
          }
        }
      });
      
      expect(result).toEqual(mockModules);
      expect(result).toHaveLength(2);
    });

    it('should apply filters correctly', async () => {
      const filters = {
        category: 'CORE',
        isEnabled: true,
        isCore: true,
        search: 'auth'
      };

      await moduleService.getAllModules(filters);

      expect(prisma.systemModule.findMany).toHaveBeenCalledWith({
        where: {
          category: 'CORE',
          isEnabled: true,
          isCore: true,
          OR: [
            { name: { contains: 'auth', mode: 'insensitive' } },
            { description: { contains: 'auth', mode: 'insensitive' } },
            { code: { contains: 'auth', mode: 'insensitive' } }
          ]
        },
        orderBy: [
          { category: 'asc' },
          { order: 'asc' }
        ],
        include: {
          _count: {
            select: { 
              settings: true,
              history: true
            }
          }
        }
      });
    });

    it('should handle search filter with OR conditions', async () => {
      await moduleService.getAllModules({ search: 'test' });

      expect(prisma.systemModule.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { name: { contains: 'test', mode: 'insensitive' } },
            { description: { contains: 'test', mode: 'insensitive' } },
            { code: { contains: 'test', mode: 'insensitive' } }
          ]
        },
        orderBy: [
          { category: 'asc' },
          { order: 'asc' }
        ],
        include: {
          _count: {
            select: { 
              settings: true,
              history: true
            }
          }
        }
      });
    });
  });

  describe('getModuleByCode', () => {
    it('should return module with complete data', async () => {
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
            user: { 
              id: 'u1', 
              firstName: 'Admin', 
              lastName: 'User',
              email: 'admin@test.com',
              role: 'ADMIN' 
            }
          }
        ],
        _count: { settings: 1, history: 1 }
      };

      prisma.systemModule.findUnique.mockResolvedValue(mockModule);

      const result = await moduleService.getModuleByCode('reviews');

      expect(prisma.systemModule.findUnique).toHaveBeenCalledWith({
        where: { code: 'reviews' },
        include: {
          settings: {
            orderBy: { key: 'asc' }
          },
          history: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  role: true
                }
              }
            }
          },
          _count: {
            select: { 
              settings: true, 
              history: true 
            }
          }
        }
      });

      expect(result).toEqual(mockModule);
    });

    it('should throw error if module not found', async () => {
      prisma.systemModule.findUnique.mockResolvedValue(null);

      await expect(
        moduleService.getModuleByCode('non-existent')
      ).rejects.toThrow('Modulo non-existent non trovato');
    });
  });

  describe('isModuleEnabled', () => {
    it('should return true for enabled module', async () => {
      prisma.systemModule.findUnique.mockResolvedValue({
        isEnabled: true
      });

      const result = await moduleService.isModuleEnabled('reviews');

      expect(prisma.systemModule.findUnique).toHaveBeenCalledWith({
        where: { code: 'reviews' },
        select: { isEnabled: true }
      });

      expect(result).toBe(true);
    });

    it('should return false for disabled module', async () => {
      prisma.systemModule.findUnique.mockResolvedValue({
        isEnabled: false
      });

      const result = await moduleService.isModuleEnabled('portfolio');

      expect(result).toBe(false);
    });

    it('should throw error for non-existent module', async () => {
      prisma.systemModule.findUnique.mockResolvedValue(null);

      await expect(
        moduleService.isModuleEnabled('non-existent')
      ).rejects.toThrow('Modulo non-existent non trovato');
    });
  });

  // ============================================
  // TEST STATISTICHE
  // ============================================

  describe('getModuleStats', () => {
    it('should return correct module statistics', async () => {
      // Mock delle chiamate Promise.all
      prisma.systemModule.count
        .mockResolvedValueOnce(66) // total
        .mockResolvedValueOnce(65) // enabled
        .mockResolvedValueOnce(12); // core

      prisma.systemModule.groupBy.mockResolvedValue([
        { category: 'CORE', _count: 12 },
        { category: 'FEATURE', _count: 25 },
        { category: 'BUSINESS', _count: 15 },
        { category: 'ADMIN', _count: 8 },
        { category: 'INTEGRATION', _count: 6 }
      ]);

      const result = await moduleService.getModuleStats();

      expect(result).toEqual({
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
      });
    });
  });

  // ============================================
  // TEST ABILITAZIONE/DISABILITAZIONE
  // ============================================

  describe('enableModule', () => {
    it('should enable a disabled module successfully', async () => {
      const mockModule = {
        id: '1',
        code: 'portfolio',
        name: 'Portfolio',
        isEnabled: false,
        isCore: false,
        dependsOn: []
      };

      const updatedModule = {
        ...mockModule,
        isEnabled: true,
        enabledAt: new Date(),
        enabledBy: 'test-user'
      };

      prisma.systemModule.findUnique.mockResolvedValue(mockModule);
      prisma.systemModule.update.mockResolvedValue(updatedModule);
      prisma.moduleHistory.create.mockResolvedValue({});

      const result = await moduleService.enableModule(
        'portfolio',
        'test-user',
        'Test enable'
      );

      expect(prisma.systemModule.update).toHaveBeenCalledWith({
        where: { code: 'portfolio' },
        data: {
          isEnabled: true,
          enabledAt: expect.any(Date),
          enabledBy: 'test-user'
        }
      });

      expect(prisma.moduleHistory.create).toHaveBeenCalledWith({
        data: {
          moduleCode: 'portfolio',
          action: 'ENABLED',
          performedBy: 'test-user',
          reason: 'Test enable',
          newValue: { isEnabled: true }
        }
      });

      expect(result.isEnabled).toBe(true);
    });

    it('should throw error if module already enabled', async () => {
      prisma.systemModule.findUnique.mockResolvedValue({
        code: 'portfolio',
        isEnabled: true
      });

      await expect(
        moduleService.enableModule('portfolio', 'test-user')
      ).rejects.toThrow('Modulo già abilitato');
    });

    it('should throw error if dependencies not enabled', async () => {
      const mockModule = {
        code: 'reviews',
        isEnabled: false,
        dependsOn: ['requests', 'users']
      };

      const missingDeps = [
        { code: 'requests', name: 'Richieste' }
      ];

      prisma.systemModule.findUnique.mockResolvedValue(mockModule);
      prisma.systemModule.findMany.mockResolvedValue(missingDeps);

      await expect(
        moduleService.enableModule('reviews', 'test-user')
      ).rejects.toThrow('Impossibile abilitare. Dipendenze mancanti: Richieste');
    });

    it('should send notification to admins after enabling', async () => {
      const mockModule = {
        code: 'portfolio',
        name: 'Portfolio',
        isEnabled: false,
        dependsOn: []
      };

      prisma.systemModule.findUnique.mockResolvedValue(mockModule);
      prisma.systemModule.update.mockResolvedValue({ ...mockModule, isEnabled: true });
      prisma.moduleHistory.create.mockResolvedValue({});

      await moduleService.enableModule('portfolio', 'test-user');

      expect(notificationService.emitToAdmins).toHaveBeenCalledWith(
        'module:enabled',
        {
          moduleName: 'Portfolio',
          enabledBy: 'test-user',
          timestamp: expect.any(Date)
        }
      );
    });
  });

  describe('disableModule', () => {
    it('should disable a non-core enabled module', async () => {
      const mockModule = {
        code: 'portfolio',
        name: 'Portfolio',
        isEnabled: true,
        isCore: false
      };

      const updatedModule = {
        ...mockModule,
        isEnabled: false,
        disabledAt: new Date(),
        disabledBy: 'test-user'
      };

      prisma.systemModule.findUnique.mockResolvedValue(mockModule);
      prisma.systemModule.findMany.mockResolvedValue([]); // No dependents
      prisma.systemModule.update.mockResolvedValue(updatedModule);
      prisma.moduleHistory.create.mockResolvedValue({});

      const result = await moduleService.disableModule(
        'portfolio',
        'test-user',
        'Test disable'
      );

      expect(prisma.systemModule.update).toHaveBeenCalledWith({
        where: { code: 'portfolio' },
        data: {
          isEnabled: false,
          disabledAt: expect.any(Date),
          disabledBy: 'test-user'
        }
      });

      expect(result.isEnabled).toBe(false);
    });

    it('should fail to disable CORE module', async () => {
      prisma.systemModule.findUnique.mockResolvedValue({
        code: 'auth',
        isCore: true,
        isEnabled: true
      });

      await expect(
        moduleService.disableModule('auth', 'test-user')
      ).rejects.toThrow('Impossibile disabilitare modulo core del sistema');
    });

    it('should fail if module already disabled', async () => {
      prisma.systemModule.findUnique.mockResolvedValue({
        code: 'portfolio',
        isCore: false,
        isEnabled: false
      });

      await expect(
        moduleService.disableModule('portfolio', 'test-user')
      ).rejects.toThrow('Modulo già disabilitato');
    });

    it('should fail if dependents are active', async () => {
      const mockModule = {
        code: 'requests',
        isCore: false,
        isEnabled: true
      };

      const dependents = [
        { name: 'Recensioni' },
        { name: 'Portfolio' }
      ];

      prisma.systemModule.findUnique.mockResolvedValue(mockModule);
      prisma.systemModule.findMany.mockResolvedValue(dependents);

      await expect(
        moduleService.disableModule('requests', 'test-user')
      ).rejects.toThrow('Impossibile disabilitare. Moduli dipendenti attivi: Recensioni, Portfolio');
    });
  });

  // ============================================
  // TEST VALIDAZIONE DIPENDENZE
  // ============================================

  describe('validateDependencies', () => {
    it('should return valid when no dependency errors', async () => {
      const mockModules = [
        {
          code: 'auth',
          name: 'Autenticazione',
          isEnabled: true,
          dependsOn: [],
          requiredFor: ['users']
        },
        {
          code: 'users', 
          name: 'Utenti',
          isEnabled: true,
          dependsOn: ['auth'],
          requiredFor: []
        }
      ];

      prisma.systemModule.findMany.mockResolvedValue(mockModules);

      const result = await moduleService.validateDependencies();

      expect(result).toEqual({
        valid: true,
        errors: [],
        warnings: []
      });
    });

    it('should detect missing dependencies', async () => {
      const mockModules = [
        {
          code: 'reviews',
          name: 'Recensioni',
          isEnabled: true,
          dependsOn: ['requests', 'missing-module'],
          requiredFor: []
        },
        {
          code: 'requests',
          name: 'Richieste', 
          isEnabled: true,
          dependsOn: [],
          requiredFor: []
        }
      ];

      prisma.systemModule.findMany.mockResolvedValue(mockModules);

      const result = await moduleService.validateDependencies();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Modulo reviews dipende da missing-module che non esiste'
      );
    });

    it('should detect disabled dependencies', async () => {
      const mockModules = [
        {
          code: 'reviews',
          name: 'Recensioni',
          isEnabled: true,
          dependsOn: ['requests'],
          requiredFor: []
        },
        {
          code: 'requests',
          name: 'Richieste',
          isEnabled: false,
          dependsOn: [],
          requiredFor: []
        }
      ];

      prisma.systemModule.findMany.mockResolvedValue(mockModules);

      const result = await moduleService.validateDependencies();

      expect(result.valid).toBe(true); // Warning, not error
      expect(result.warnings).toContain(
        'Modulo reviews è abilitato ma dipende da requests che è disabilitato'
      );
    });
  });

  // ============================================
  // TEST SETTINGS
  // ============================================

  describe('getModuleSettings', () => {
    it('should return settings ordered by category and order', async () => {
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

      prisma.moduleSetting.findMany.mockResolvedValue(mockSettings);

      const result = await moduleService.getModuleSettings('whatsapp');

      expect(prisma.moduleSetting.findMany).toHaveBeenCalledWith({
        where: { moduleCode: 'whatsapp' },
        orderBy: [
          { category: 'asc' },
          { order: 'asc' }
        ]
      });

      expect(result).toEqual(mockSettings);
      expect(result).toHaveLength(2);
    });
  });

  describe('updateModuleSetting', () => {
    it('should update setting value successfully', async () => {
      const existingSetting = {
        id: '1',
        moduleCode: 'whatsapp',
        key: 'session_name',
        value: 'development'
      };

      const updatedSetting = {
        ...existingSetting,
        value: 'production'
      };

      prisma.moduleSetting.findUnique.mockResolvedValue(existingSetting);
      prisma.moduleSetting.update.mockResolvedValue(updatedSetting);
      prisma.moduleHistory.create.mockResolvedValue({});

      const result = await moduleService.updateModuleSetting(
        'whatsapp',
        'session_name', 
        'production',
        'test-user'
      );

      expect(prisma.moduleSetting.update).toHaveBeenCalledWith({
        where: {
          moduleCode_key: {
            moduleCode: 'whatsapp',
            key: 'session_name'
          }
        },
        data: { value: 'production' }
      });

      expect(prisma.moduleHistory.create).toHaveBeenCalledWith({
        data: {
          moduleCode: 'whatsapp',
          action: 'SETTING_UPDATED',
          performedBy: 'test-user',
          oldValue: { session_name: 'development' },
          newValue: { session_name: 'production' }
        }
      });

      expect(result.value).toBe('production');
    });

    it('should throw error if setting not found', async () => {
      prisma.moduleSetting.findUnique.mockResolvedValue(null);

      await expect(
        moduleService.updateModuleSetting(
          'whatsapp',
          'non-existent',
          'value',
          'test-user'
        )
      ).rejects.toThrow('Setting non trovato');
    });
  });

  // ============================================
  // TEST HISTORY
  // ============================================

  describe('getModuleHistory', () => {
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
        },
        {
          id: '2',
          moduleCode: 'portfolio', 
          action: 'DISABLED',
          performedBy: 'user2',
          reason: 'Test disable',
          createdAt: new Date(),
          user: {
            id: 'user2',
            firstName: 'Jane',
            lastName: 'Smith', 
            email: 'jane@example.com'
          }
        }
      ];

      prisma.moduleHistory.findMany.mockResolvedValue(mockHistory);

      const result = await moduleService.getModuleHistory('portfolio', 10);

      expect(prisma.moduleHistory.findMany).toHaveBeenCalledWith({
        where: { moduleCode: 'portfolio' },
        orderBy: { createdAt: 'desc' },
        take: 10,
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

      expect(result).toEqual(mockHistory);
      expect(result).toHaveLength(2);
    });

    it('should use default limit of 50', async () => {
      prisma.moduleHistory.findMany.mockResolvedValue([]);

      await moduleService.getModuleHistory('portfolio');

      expect(prisma.moduleHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50
        })
      );
    });
  });

  // ============================================
  // TEST UTILITY METHODS 
  // ============================================

  describe('isModuleCore', () => {
    it('should return true for core module', async () => {
      prisma.systemModule.findUnique.mockResolvedValue({
        isCore: true
      });

      const result = await moduleService.isModuleCore('auth');

      expect(result).toBe(true);
    });

    it('should return false for non-core module', async () => {
      prisma.systemModule.findUnique.mockResolvedValue({
        isCore: false
      });

      const result = await moduleService.isModuleCore('portfolio');

      expect(result).toBe(false);
    });
  });

  describe('getSystemConfig', () => {
    it('should return system configuration with core modules', async () => {
      const mockCoreModules = [
        { code: 'auth', name: 'Autenticazione', category: 'CORE' },
        { code: 'users', name: 'Utenti', category: 'CORE' },
        { code: 'requests', name: 'Richieste', category: 'BUSINESS' }
      ];

      prisma.systemModule.findMany.mockResolvedValue(mockCoreModules);

      const result = await moduleService.getSystemConfig();

      expect(result).toEqual({
        version: '1.0.0',
        coreModulesEnabled: 3,
        modules: {
          auth: true,
          users: true,
          requests: true
        },
        lastChecked: expect.any(String)
      });
    });
  });

  // ============================================
  // TEST ERRORI E EDGE CASES
  // ============================================

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      prisma.systemModule.findMany.mockRejectedValue(dbError);

      await expect(
        moduleService.getAllModules()
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle notification service errors gracefully', async () => {
      const mockModule = {
        code: 'portfolio',
        name: 'Portfolio',
        isEnabled: false,
        dependsOn: []
      };

      prisma.systemModule.findUnique.mockResolvedValue(mockModule);
      prisma.systemModule.update.mockResolvedValue({ ...mockModule, isEnabled: true });
      prisma.moduleHistory.create.mockResolvedValue({});
      
      // Mock notification service error
      notificationService.emitToAdmins.mockRejectedValue(new Error('Notification failed'));

      // Should still complete successfully despite notification error
      const result = await moduleService.enableModule('portfolio', 'test-user');
      
      expect(result.isEnabled).toBe(true);
      expect(notificationService.emitToAdmins).toHaveBeenCalled();
    });
  });
});
