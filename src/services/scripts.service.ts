/**
 * Script Manager Service
 * Gestisce l'esecuzione sicura degli script amministrativi
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs/promises';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

interface ScriptRegistry {
  scripts: ScriptDefinition[];
  categories: Category[];
  version: string;
}

interface ScriptDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  path: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  parameters: Parameter[];
  requireConfirmation: boolean;
  minRole: 'ADMIN' | 'SUPER_ADMIN';
  timeout?: number;
  enabled: boolean;
}

interface Parameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'array';
  required?: boolean;
  default?: any;
  description: string;
  options?: string[];
}

interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface ExecutionResult {
  runId: string;
  scriptId: string;
  status: 'running' | 'success' | 'error' | 'timeout';
  startedAt: Date;
  completedAt?: Date;
  output: string[];
  error?: string;
  result?: any;
}

class ScriptManagerService {
  private registry: ScriptRegistry | null = null;
  private executions: Map<string, ExecutionResult> = new Map();
  private scriptsPath: string;

  constructor() {
    this.scriptsPath = path.join(__dirname, '../scripts');
    this.loadRegistry();
  }

  /**
   * Carica il registry degli script
   */
  private async loadRegistry(): Promise<void> {
    try {
      const registryPath = path.join(this.scriptsPath, 'registry.json');
      const registryContent = await fs.readFile(registryPath, 'utf-8');
      this.registry = JSON.parse(registryContent);
      logger.info(`✅ Script registry loaded: ${this.registry?.scripts.length} scripts`);
    } catch (error) {
      logger.error('❌ Failed to load script registry:', error);
      // Usa un registry vuoto se il file non esiste
      this.registry = {
        scripts: [],
        categories: [],
        version: '1.0.0'
      };
    }
  }

  /**
   * Ottiene la lista degli script disponibili
   */
  public async getScripts(userId: string, userRole: string): Promise<ScriptDefinition[]> {
    if (!this.registry) {
      await this.loadRegistry();
    }

    // Filtra script in base al ruolo
    return this.registry!.scripts.filter(script => {
      if (!script.enabled) return false;
      if (script.minRole === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') return false;
      return true;
    });
  }

  /**
   * Ottiene i dettagli di uno script
   */
  public async getScript(scriptId: string): Promise<ScriptDefinition | null> {
    if (!this.registry) {
      await this.loadRegistry();
    }

    return this.registry!.scripts.find(s => s.id === scriptId) || null;
  }

  /**
   * Esegue uno script
   */
  public async executeScript(
    scriptId: string,
    parameters: any,
    userId: string,
    userRole: string
  ): Promise<ExecutionResult> {
    const script = await this.getScript(scriptId);
    
    if (!script) {
      throw new Error(`Script ${scriptId} not found`);
    }

    // Verifica permessi
    if (script.minRole === 'SUPER_ADMIN' && userRole !== 'SUPER_ADMIN') {
      throw new Error('Insufficient permissions');
    }

    // Valida parametri
    this.validateParameters(script, parameters);

    // Crea execution record
    const runId = uuidv4();
    const execution: ExecutionResult = {
      runId,
      scriptId,
      status: 'running',
      startedAt: new Date(),
      output: []
    };

    this.executions.set(runId, execution);

    // Log audit
    await this.logExecution(userId, scriptId, parameters, runId);

    // Esegui script in background
    this.runScript(script, parameters, execution);

    return execution;
  }

  /**
   * Valida i parametri dello script
   */
  private validateParameters(script: ScriptDefinition, parameters: any): void {
    for (const param of script.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }

      const value = parameters[param.name];
      
      if (value !== undefined) {
        // Type validation
        switch (param.type) {
          case 'number':
            if (typeof value !== 'number') {
              throw new Error(`Parameter '${param.name}' must be a number`);
            }
            break;
          case 'boolean':
            if (typeof value !== 'boolean') {
              throw new Error(`Parameter '${param.name}' must be a boolean`);
            }
            break;
          case 'select':
            if (param.options && !param.options.includes(value)) {
              throw new Error(`Parameter '${param.name}' must be one of: ${param.options.join(', ')}`);
            }
            break;
          case 'array':
            if (!Array.isArray(value)) {
              throw new Error(`Parameter '${param.name}' must be an array`);
            }
            break;
        }
      }
    }
  }

  /**
   * Esegue lo script
   */
  private async runScript(
    script: ScriptDefinition,
    parameters: any,
    execution: ExecutionResult
  ): Promise<void> {
    try {
      // Import dinamico del modulo script
      const scriptPath = path.join(this.scriptsPath, script.path);
      const scriptModule = await import(scriptPath);

      // Esegui la funzione execute
      if (typeof scriptModule.execute !== 'function') {
        throw new Error('Script does not export an execute function');
      }

      // Setup timeout se configurato
      let timeoutHandle: NodeJS.Timeout | null = null;
      if (script.timeout) {
        timeoutHandle = setTimeout(() => {
          execution.status = 'timeout';
          execution.error = `Script execution timed out after ${script.timeout}ms`;
          execution.completedAt = new Date();
        }, script.timeout);
      }

      // Esegui script
      const result = await scriptModule.execute(parameters);

      // Clear timeout
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }

      // Aggiorna execution
      execution.status = 'success';
      execution.result = result;
      execution.completedAt = new Date();

    } catch (error: any) {
      logger.error(`Script execution failed for ${script.id}:`, error);
      execution.status = 'error';
      execution.error = error.message;
      execution.completedAt = new Date();
    }
  }

  /**
   * Ottiene lo stato di un'esecuzione
   */
  public getExecution(runId: string): ExecutionResult | null {
    return this.executions.get(runId) || null;
  }

  /**
   * Ottiene lo storico delle esecuzioni di uno script
   */
  public async getScriptHistory(scriptId: string, limit = 10): Promise<any[]> {
    try {
      // In produzione, questo dovrebbe essere salvato nel database
      const history = Array.from(this.executions.values())
        .filter(e => e.scriptId === scriptId)
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
        .slice(0, limit);
      
      return history;
    } catch (error) {
      logger.error('Error fetching script history:', error);
      return [];
    }
  }

  /**
   * Ottiene l'output di un'esecuzione
   */
  public getExecutionOutput(runId: string): string[] {
    const execution = this.executions.get(runId);
    return execution?.output || [];
  }

  /**
   * Log dell'esecuzione per audit
   */
  private async logExecution(
    userId: string,
    scriptId: string,
    parameters: any,
    runId: string
  ): Promise<void> {
    try {
      // Log in audit table (se esiste)
      logger.info(`📝 Script execution logged:`, {
        userId,
        scriptId,
        runId,
        parameters: JSON.stringify(parameters),
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to log script execution:', error);
    }
  }

  /**
   * Pulisce le esecuzioni vecchie dalla memoria
   */
  public cleanupOldExecutions(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [runId, execution] of this.executions.entries()) {
      if (execution.completedAt && execution.completedAt.getTime() < oneHourAgo) {
        this.executions.delete(runId);
      }
    }
  }

  /**
   * Ottiene le categorie disponibili
   */
  public getCategories(): Category[] {
    return this.registry?.categories || [];
  }

  /**
   * Ricarica il registry
   */
  public async reloadRegistry(): Promise<void> {
    await this.loadRegistry();
    logger.info('✅ Script registry reloaded');
  }
}

// Export singleton instance
export const scriptManager = new ScriptManagerService();

// Cleanup job ogni ora
setInterval(() => {
  scriptManager.cleanupOldExecutions();
}, 60 * 60 * 1000);