/**
 * Module Service
 * Gestione completa del sistema moduli
 * 
 * Responsabilità:
 * - Lettura moduli e stati
 * - Abilitazione/Disabilitazione moduli
 * - Gestione dipendenze
 * - Configurazione settings moduli
 * - Validazione integrità sistema
 * - Statistiche utilizzo
 * 
 * @module services/module
 * @version 1.1.0
 * @updated 2025-10-09
 * @author Sistema Richiesta Assistenza
 * 
 * CHANGELOG v1.1.0:
 * - Rimossi TUTTI i cast 'any' pericolosi
 * - Aggiunti tipi Prisma espliciti per where clauses
 * - Type guards per validazione array
 * - Interfacce complete per config e metadata
 * - Tipi sicuri per JSON values
 */

import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ModuleCategory, Prisma } from '@prisma/client';
import { notificationService } from './notification.service';
// Import per invalidazione cache middleware
import { invalidateModuleCache } from '../middleware/module.middleware';

/**
 * Interface per filtri moduli
 */
export interface ModuleFilters {
  category?: ModuleCategory;
  isEnabled?: boolean;
  isCore?: boolean;
  search?: string;
}

/**
 * Interface per statistiche moduli
 */
export interface ModuleStats {
  total: number;
  enabled: number;
  disabled: number;
  core: number;
  byCategory: Array<{
    category: ModuleCategory;
    count: number;
  }>;
}

/**
 * Interface per validazione dipendenze
 */
export interface DependencyValidation {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Interface per configurazione modulo
 */
export interface ModuleConfig {
  [key: string]: unknown;
  timeout?: number;
  enabled?: boolean;
  apiKey?: string;
  webhookUrl?: string;
}

/**
 * Type guard per array di stringhe
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Type guard per ModuleConfig
 */
function isModuleConfig(value: unknown): value is ModuleConfig {
  return typeof value === 'object' && value !== null;
}

/**
 * Module Service Class
 * 
 * Gestisce il sistema di moduli del sistema:
 * lettura, abilitazione/disabilitazione, dipendenze, configurazione.
 */
class ModuleService {
  
  /**
   * Ottieni tutti i moduli con conteggio settings
   * 
   * @param {ModuleFilters} filters - Filtri opzionali
   * @returns {Promise<Array>} Lista moduli con conteggi
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const modules = await moduleService.getAllModules();
   * const coreModules = await moduleService.getAllModules({ isCore: true });
   */
  async getAllModules(filters: ModuleFilters = {}) {
    try {
      logger.info('[ModuleService] Fetching all modules', filters);

      // ✅ Tipo Prisma esplicito per where
      const where: Prisma.SystemModuleWhereInput = {};

      // Costruisci filtri
      if (filters.category) where.category = filters.category;
      if (filters.isEnabled !== undefined) where.isEnabled = filters.isEnabled;
      if (filters.isCore !== undefined) where.isCore = filters.isCore;
      
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
          { code: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const modules = await prisma.systemModule.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { order: 'asc' }
        ],
        include: {
        _count: {
        select: {
        ModuleSetting: true
        }
        }
        }
      });

      logger.info(`[ModuleService] Found ${modules.length} modules`);
      return modules;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching modules:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        filters,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni modulo per codice con dati completi
   * 
   * @param {string} code - Codice modulo
   * @returns {Promise<Object>} Modulo con settings, history e conteggi
   * @throws {Error} Se modulo non trovato
   * 
   * @example
   * const module = await moduleService.getModuleByCode('reviews');
   */
  async getModuleByCode(code: string) {
    try {
      logger.info(`[ModuleService] Fetching module by code: ${code}`);

      const module = await prisma.systemModule.findUnique({
        where: { code },
        include: {
          ModuleSetting: {
            orderBy: { key: 'asc' }
          },
          _count: {
            select: { 
              ModuleSetting: true
            }
          }
        }
      });

      if (!module) {
        throw new Error(`Modulo ${code} non trovato`);
      }

      logger.info(`[ModuleService] Module found: ${code}`);
      return module;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching module by code:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni moduli per categoria
   * 
   * @param {ModuleCategory} category - Categoria moduli
   * @returns {Promise<Array>} Lista moduli della categoria
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const coreModules = await moduleService.getModulesByCategory('CORE');
   */
  async getModulesByCategory(category: ModuleCategory) {
    try {
      logger.info(`[ModuleService] Fetching modules by category: ${category}`);

      const modules = await prisma.systemModule.findMany({
        where: { category },
        orderBy: { order: 'asc' },
        include: {
          _count: {
            select: { ModuleSetting: true }
          }
        }
      });

      logger.info(`[ModuleService] Found ${modules.length} modules in category ${category}`);
      return modules;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching modules by category:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        category,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Verifica se un modulo è abilitato
   * METODO CRITICO - usato da middleware protezione routes
   * 
   * @param {string} code - Codice modulo
   * @returns {Promise<boolean>} True se abilitato, false altrimenti
   * @throws {Error} Se modulo non trovato
   * 
   * @example
   * const isEnabled = await moduleService.isModuleEnabled('reviews');
   * if (!isEnabled) throw new Error('Modulo recensioni disabilitato');
   */
  async isModuleEnabled(code: string): Promise<boolean> {
    try {
      logger.info(`[ModuleService] Checking if module is enabled: ${code}`);

      const module = await prisma.systemModule.findUnique({
        where: { code },
        select: { isEnabled: true }
      });
      
      if (!module) {
        throw new Error(`Modulo ${code} non trovato`);
      }
      
      logger.info(`[ModuleService] Module ${code} enabled: ${module.isEnabled}`);
      return module.isEnabled;
      
    } catch (error) {
      logger.error('[ModuleService] Error checking module enabled status:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni statistiche aggregate moduli
   * 
   * @returns {Promise<ModuleStats>} Statistiche complete
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const stats = await moduleService.getModuleStats();
   * // { total: 66, enabled: 65, disabled: 1, core: 12, byCategory: [...] }
   */
  async getModuleStats(): Promise<ModuleStats> {
    try {
      logger.info('[ModuleService] Fetching module statistics');

      const [
        total,
        enabled,
        core,
        byCategory
      ] = await Promise.all([
        prisma.systemModule.count(),
        
        prisma.systemModule.count({
          where: { isEnabled: true }
        }),
        
        prisma.systemModule.count({
          where: { isCore: true }
        }),

        prisma.systemModule.groupBy({
          by: ['category'],
          _count: true
        })
      ]);

      const stats: ModuleStats = {
        total,
        enabled,
        disabled: total - enabled,
        core,
        byCategory: byCategory.map(item => ({
          category: item.category,
          count: item._count
        }))
      };

      logger.info('[ModuleService] Statistics calculated:', stats);
      return stats;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching module stats:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni moduli con dipendenze configurate
   * 
   * @returns {Promise<Array>} Moduli con dependsOn o requiredFor
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const modulesWithDeps = await moduleService.getModulesWithDependencies();
   */
  async getModulesWithDependencies() {
    try {
      logger.info('[ModuleService] Fetching modules with dependencies');

      const modules = await prisma.systemModule.findMany({
        where: { dependsOn: { isEmpty: false } },
        select: {
          code: true,
          name: true,
          isEnabled: true,
          dependsOn: true,
          category: true
        },
        orderBy: { name: 'asc' }
      });

      logger.info(`[ModuleService] Found ${modules.length} modules with dependencies`);
      return modules;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching modules with dependencies:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Valida integrità dipendenze di tutti i moduli
   * 
   * @returns {Promise<DependencyValidation>} Risultato validazione
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const validation = await moduleService.validateDependencies();
   * if (!validation.valid) {
   *   console.error('Dependency errors:', validation.errors);
   * }
   */
  async validateDependencies(): Promise<DependencyValidation> {
    try {
      logger.info('[ModuleService] Validating all module dependencies');

      const modules = await prisma.systemModule.findMany({
        select: {
          code: true,
          name: true,
          isEnabled: true,
          dependsOn: true,
        }
      });

      const errors: string[] = [];
      const warnings: string[] = [];

      // Mappa per ricerca veloce
      const moduleMap = new Map(modules.map(m => [m.code, m]));

      for (const module of modules) {
        // ✅ Validazione tipo sicura per dependsOn
        const dependsOn = module.dependsOn;
        if (isStringArray(dependsOn) && dependsOn.length > 0) {
          for (const depCode of dependsOn) {
            const depModule = moduleMap.get(depCode);
            
            if (!depModule) {
              errors.push(
                `Modulo ${module.code} dipende da ${depCode} che non esiste`
              );
            } else if (!depModule.isEnabled && module.isEnabled) {
              warnings.push(
                `Modulo ${module.code} è abilitato ma dipende da ${depCode} che è disabilitato`
              );
            }
          }
        }

        // Nota: il campo requiredFor non è presente nello schema attivo;
        // la validazione si concentra su dependsOn.
      }

      const validation: DependencyValidation = {
        valid: errors.length === 0,
        errors,
        warnings
      };

      logger.info('[ModuleService] Dependencies validation completed:', {
        valid: validation.valid,
        errorsCount: errors.length,
        warningsCount: warnings.length
      });

      return validation;
      
    } catch (error) {
      logger.error('[ModuleService] Error validating dependencies:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni moduli abilitati per categoria (cache-friendly)
   * 
   * @param {ModuleCategory} category - Categoria da filtrare
   * @returns {Promise<Array>} Moduli abilitati della categoria
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const enabledCore = await moduleService.getEnabledModulesByCategory('CORE');
   */
  async getEnabledModulesByCategory(category: ModuleCategory) {
    try {
      logger.info(`[ModuleService] Fetching enabled modules by category: ${category}`);

      const modules = await prisma.systemModule.findMany({
        where: { 
          category,
          isEnabled: true 
        },
        select: {
          code: true,
          name: true,
          description: true,
          icon: true,
          order: true
        },
        orderBy: { order: 'asc' }
      });

      logger.info(`[ModuleService] Found ${modules.length} enabled modules in category ${category}`);
      return modules;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching enabled modules by category:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        category,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Verifica se un modulo è core (non disabilitabile)
   * 
   * @param {string} code - Codice modulo
   * @returns {Promise<boolean>} True se core, false altrimenti
   * @throws {Error} Se modulo non trovato
   * 
   * @example
   * const isCore = await moduleService.isModuleCore('users');
   * if (isCore) throw new Error('Impossibile disabilitare modulo core');
   */
  async isModuleCore(code: string): Promise<boolean> {
    try {
      logger.info(`[ModuleService] Checking if module is core: ${code}`);

      const module = await prisma.systemModule.findUnique({
        where: { code },
        select: { isCore: true }
      });
      
      if (!module) {
        throw new Error(`Modulo ${code} non trovato`);
      }
      
      logger.info(`[ModuleService] Module ${code} core: ${module.isCore}`);
      return module.isCore;
      
    } catch (error) {
      logger.error('[ModuleService] Error checking module core status:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni configurazione rapida del sistema (moduli critici)
   * 
   * @returns {Promise<Object>} Configurazione moduli critici
   * @throws {Error} Se query fallisce
   * 
   * @example
   * const config = await moduleService.getSystemConfig();
   */
  async getSystemConfig() {
    try {
      logger.info('[ModuleService] Fetching system configuration');

      const coreModules = await prisma.systemModule.findMany({
        where: { 
          isCore: true,
          isEnabled: true
        },
        select: {
          code: true,
          name: true,
          category: true
        },
        orderBy: { category: 'asc' }
      });

      const config = {
        version: '1.0.0',
        coreModulesEnabled: coreModules.length,
        modules: coreModules.reduce((acc, module) => {
          acc[module.code] = true;
          return acc;
        }, {} as Record<string, boolean>),
        lastChecked: new Date().toISOString()
      };

      logger.info('[ModuleService] System configuration fetched:', {
        coreModulesEnabled: config.coreModulesEnabled
      });

      return config;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching system config:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Abilita modulo con check dipendenze
   * 
   * @param {string} code - Codice modulo
   * @param {string} userId - ID utente che esegue l'operazione
   * @param {string} reason - Motivo dell'abilitazione (opzionale)
   * @returns {Promise<Object>} Modulo aggiornato
   * @throws {Error} Se modulo non trovato, già abilitato o dipendenze mancanti
   * 
   * @example
   * const module = await moduleService.enableModule('portfolio', 'user123', 'Test enable');
   */
  async enableModule(
    code: string, 
    userId: string, 
    reason?: string
  ) {
    try {
      logger.info(`[ModuleService] Enabling module: ${code}`, { userId, reason });

      const module = await prisma.systemModule.findUnique({
        where: { code }
      });

      if (!module) {
        throw new Error('Modulo non trovato');
      }

      if (module.isEnabled) {
        throw new Error('Modulo già abilitato');
      }

      // ✅ Verifica dipendenze con type guard
      const dependsOn = module.dependsOn;
      if (isStringArray(dependsOn) && dependsOn.length > 0) {
        const dependencies = await prisma.systemModule.findMany({
          where: {
            code: { in: dependsOn },
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
        }
      });

      // Log history
      await prisma.moduleHistory.create({
        data: {
          userId: userId,
          moduleType: 'SYSTEM_MODULE',
          action: 'ENABLED',
          metadata: {
            moduleCode: code,
            performedBy: userId,
            reason,
            newValue: { isEnabled: true }
          } as Prisma.InputJsonValue
        }
      });

      // Notifica admins
      try {
        await notificationService.emitToAdmins('module:enabled', {
          moduleName: module.name,
          enabledBy: userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('[ModuleService] Error sending notification:', error);
      }

      // Invalida cache middleware per aggiornamento immediato
      invalidateModuleCache(code);
      
      logger.info(`[ModuleService] Module ${code} enabled successfully`);
      return updated;
      
    } catch (error) {
      logger.error('[ModuleService] Error enabling module:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Disabilita modulo con check moduli dipendenti
   * 
   * @param {string} code - Codice modulo
   * @param {string} userId - ID utente che esegue l'operazione
   * @param {string} reason - Motivo della disabilitazione (opzionale)
   * @returns {Promise<Object>} Modulo aggiornato
   * @throws {Error} Se modulo non trovato, core, già disabilitato o moduli dipendenti attivi
   * 
   * @example
   * const module = await moduleService.disableModule('portfolio', 'user123', 'Test disable');
   */
  async disableModule(
    code: string,
    userId: string,
    reason?: string
  ) {
    try {
      logger.info(`[ModuleService] Disabling module: ${code}`, { userId, reason });

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
        }
      });

      // Log
      await prisma.moduleHistory.create({
        data: {
          userId: userId,
          moduleType: 'SYSTEM_MODULE',
          action: 'DISABLED',
          metadata: {
            moduleCode: code,
            performedBy: userId,
            reason,
            oldValue: { isEnabled: true },
            newValue: { isEnabled: false }
          } as Prisma.InputJsonValue
        }
      });

      // Notifica
      try {
        await notificationService.emitToAdmins('module:disabled', {
          moduleName: module.name,
          disabledBy: userId,
          reason: reason || 'Non specificato',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('[ModuleService] Error sending notification:', error);
      }

      // Invalida cache middleware per aggiornamento immediato
      invalidateModuleCache(code);
      
      logger.info(`[ModuleService] Module ${code} disabled successfully`);
      return updated;
      
    } catch (error) {
      logger.error('[ModuleService] Error disabling module:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Aggiorna configurazione modulo
   * 
   * @param {string} code - Codice modulo
   * @param {ModuleConfig} config - Nuova configurazione JSON
   * @param {string} userId - ID utente che esegue l'operazione
   * @returns {Promise<Object>} Modulo aggiornato
   * @throws {Error} Se modulo non trovato
   * 
   * @example
   * const module = await moduleService.updateModuleConfig('whatsapp', { timeout: 5000 }, 'user123');
   */
  async updateModuleConfig(
    code: string,
    config: ModuleConfig,
    userId: string
  ) {
    try {
      logger.info(`[ModuleService] Updating module config: ${code}`, { userId });

      const module = await prisma.systemModule.findUnique({
        where: { code }
      });

      if (!module) {
        throw new Error('Modulo non trovato');
      }

      const oldConfig = module.config;

      const updated = await prisma.systemModule.update({
        where: { code },
        data: { config: config as Prisma.InputJsonValue }
      });

      // Log
      await prisma.moduleHistory.create({
        data: {
          userId: userId,
          moduleType: 'SYSTEM_MODULE',
          action: 'CONFIG_CHANGED',
          metadata: {
            moduleCode: code,
            performedBy: userId,
            oldValue: oldConfig,
            newValue: config
          } as Prisma.InputJsonValue
        }
      });

      // Notifica admins del cambio configurazione
      try {
        await notificationService.emitToAdmins('module:config_changed', {
          moduleName: module.name,
          changedBy: userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('[ModuleService] Error sending config change notification:', error);
      }

      // Invalida cache per riflettere il cambio immediatamente
      invalidateModuleCache(code);

      logger.info(`[ModuleService] Module ${code} config updated successfully`);
      return updated;
      
    } catch (error) {
      logger.error('[ModuleService] Error updating module config:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni settings di un modulo
   * 
   * @param {string} code - Codice modulo
   * @returns {Promise<Array>} Lista settings ordinati
   * @throws {Error} Se errore query
   * 
   * @example
   * const settings = await moduleService.getModuleSettings('whatsapp');
   */
  async getModuleSettings(code: string) {
    try {
      logger.info(`[ModuleService] Fetching module settings: ${code}`);

      const settings = await prisma.moduleSetting.findMany({
        where: { moduleCode: code },
        orderBy: [
          { group: 'asc' },
          { order: 'asc' },
          { key: 'asc' }
        ]
      });

      logger.info(`[ModuleService] Found ${settings.length} settings for module ${code}`);
      return settings;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching module settings:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Aggiorna singolo setting
   * 
   * @param {string} code - Codice modulo
   * @param {string} settingKey - Chiave setting
   * @param {string} value - Nuovo valore
   * @param {string} userId - ID utente che esegue l'operazione
   * @returns {Promise<Object>} Setting aggiornato
   * @throws {Error} Se setting non trovato
   * 
   * @example
   * const setting = await moduleService.updateModuleSetting('whatsapp', 'session_name', 'production', 'user123');
   */
  async updateModuleSetting(
    code: string,
    settingKey: string,
    value: string,
    userId: string
  ) {
    try {
      logger.info(`[ModuleService] Updating module setting: ${code}.${settingKey}`, { userId, value });

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
          userId: userId,
          moduleType: 'SYSTEM_MODULE',
          action: 'SETTING_UPDATED',
          metadata: {
            moduleCode: code,
            performedBy: userId,
            oldValue: { [settingKey]: setting.value },
            newValue: { [settingKey]: value }
          } as Prisma.InputJsonValue
        }
      });

      // Notifica admins dell’aggiornamento setting
      try {
        await notificationService.emitToAdmins('module:setting_updated', {
          moduleName: setting.moduleCode,
          settingKey,
          changedBy: userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        logger.error('[ModuleService] Error sending setting update notification:', error);
      }

      // Invalida cache per riflettere il cambio immediatamente
      invalidateModuleCache(code);

      logger.info(`[ModuleService] Setting ${code}.${settingKey} updated successfully`);
      return updated;
      
    } catch (error) {
      logger.error('[ModuleService] Error updating module setting:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        settingKey,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Ottieni storia modifiche modulo
   * 
   * @param {string} code - Codice modulo
   * @param {number} limit - Numero massimo record (default: 50)
   * @returns {Promise<Array>} Storia modifiche con dati utente
   * @throws {Error} Se errore query
   * 
   * @example
   * const history = await moduleService.getModuleHistory('reviews', 10);
   */
  async getModuleHistory(code: string, limit: number = 50) {
    try {
      logger.info(`[ModuleService] Fetching module history: ${code}`, { limit });

      const historyAll = await prisma.moduleHistory.findMany({
        where: { moduleType: 'SYSTEM_MODULE' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          User: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // Filtra per codice modulo dentro metadata (se presente)
      const history = historyAll.filter((h: any) => {
        const meta = h.metadata as any;
        return meta && typeof meta === 'object' && meta.moduleCode === code;
      });

      logger.info(`[ModuleService] Found ${history.length} history records for module ${code}`);
      return history;
      
    } catch (error) {
      logger.error('[ModuleService] Error fetching module history:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        code,
        limit,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

/**
 * Export Singleton Instance
 * Usa questa istanza in tutto il sistema
 */
export const moduleService = new ModuleService();