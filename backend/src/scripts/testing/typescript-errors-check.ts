/**
 * Script: TypeScript Errors Check
 * Controlla errori TypeScript nel backend e frontend, ordinati per numero di errori
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs';
import { logger } from '../../utils/logger';

const execAsync = promisify(exec);

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

interface FileErrorGroup {
  file: string;
  errors: TypeScriptError[];
  count: number;
}

interface CheckTypeScriptParams {
  area?: 'all' | 'backend' | 'frontend';
  showDetails?: boolean;
  limit?: number;
}

async function checkTypeScript(projectPath: string, area: string): Promise<TypeScriptError[]> {
  const errors: TypeScriptError[] = [];
  
  try {
    logger.info(`🔍 Checking TypeScript errors in ${area}...`);
    
    // Esegui tsc --noEmit per ottenere errori
    const { stdout, stderr } = await execAsync(
      'npx tsc --noEmit --pretty false',
      { 
        cwd: projectPath,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }
    );
    
    const output = stdout || stderr;
    
    if (!output) {
      logger.info(`✅ No TypeScript errors found in ${area}`);
      return [];
    }
    
    // Parse degli errori TypeScript
    const lines = output.split('\n');
    
    for (const line of lines) {
      // Pattern: file.ts(line,col): error TS1234: message
      const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
      
      if (match) {
        errors.push({
          file: match[1],
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
          code: match[4],
          message: match[5]
        });
      }
    }
    
  } catch (error: any) {
    // tsc restituisce exit code 1 quando ci sono errori, quindi questo è normale
    if (error.stdout || error.stderr) {
      const output = error.stdout || error.stderr;
      const lines = output.split('\n');
      
      for (const line of lines) {
        const match = line.match(/^(.+\.tsx?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/);
        
        if (match) {
          errors.push({
            file: match[1],
            line: parseInt(match[2], 10),
            column: parseInt(match[3], 10),
            code: match[4],
            message: match[5]
          });
        }
      }
    } else {
      logger.error(`❌ Error checking ${area}:`, error.message);
    }
  }
  
  return errors;
}

function groupErrorsByFile(errors: TypeScriptError[]): FileErrorGroup[] {
  const grouped = new Map<string, TypeScriptError[]>();
  
  for (const error of errors) {
    const existing = grouped.get(error.file) || [];
    existing.push(error);
    grouped.set(error.file, existing);
  }
  
  const result: FileErrorGroup[] = [];
  
  for (const [file, fileErrors] of grouped.entries()) {
    result.push({
      file,
      errors: fileErrors,
      count: fileErrors.length
    });
  }
  
  // Ordina per numero di errori (decrescente)
  result.sort((a, b) => b.count - a.count);
  
  return result;
}

export async function execute(params: CheckTypeScriptParams = {}) {
  const { 
    area = 'all', 
    showDetails = true,
    limit = 20 
  } = params;
  
  const rootPath = path.resolve(__dirname, '../../../../..');
  const backendPath = path.join(rootPath, 'backend');
  const frontendPath = rootPath; // Il frontend è nella root, non in una sottocartella
  
  try {
    logger.info('🚀 Starting TypeScript errors check...');
    logger.info(`📋 Parameters: area=${area}, showDetails=${showDetails}, limit=${limit}`);
    
    let allErrors: TypeScriptError[] = [];
    const results: any = {
      backend: { total: 0, files: 0, groups: [] },
      frontend: { total: 0, files: 0, groups: [] }
    };
    
    // Check Backend
    if (area === 'all' || area === 'backend') {
      logger.info('\n📦 Checking Backend (/backend)...');
      const backendErrors = await checkTypeScript(backendPath, 'backend');
      const backendGroups = groupErrorsByFile(backendErrors);
      
      results.backend = {
        total: backendErrors.length,
        files: backendGroups.length,
        groups: backendGroups.slice(0, limit)
      };
      
      allErrors = [...allErrors, ...backendErrors];
      
      logger.info(`📊 Backend: ${backendErrors.length} errors in ${backendGroups.length} files`);
    }
    
    // Check Frontend
    if (area === 'all' || area === 'frontend') {
      logger.info('\n🎨 Checking Frontend (/src)...');
      
      // Per il frontend, dobbiamo filtrare solo i file in /src
      const frontendErrors = await checkTypeScript(frontendPath, 'frontend');
      const srcErrors = frontendErrors.filter(e => e.file.includes('/src/') || e.file.startsWith('src/'));
      const frontendGroups = groupErrorsByFile(srcErrors);
      
      results.frontend = {
        total: srcErrors.length,
        files: frontendGroups.length,
        groups: frontendGroups.slice(0, limit)
      };
      
      allErrors = [...allErrors, ...srcErrors];
      
      logger.info(`📊 Frontend: ${srcErrors.length} errors in ${frontendGroups.length} files`);
    }
    
    // Mostra risultati dettagliati
    logger.info('\n' + '='.repeat(80));
    logger.info('📈 RISULTATI ORDINATI (file con più errori prima)');
    logger.info('='.repeat(80));
    
    // Backend results
    if (results.backend.groups.length > 0) {
      logger.info('\n🔧 BACKEND - Top files con errori:');
      logger.info('-'.repeat(40));
      
      results.backend.groups.forEach((group: FileErrorGroup, index: number) => {
        logger.info(`\n${index + 1}. ${group.file}`);
        logger.info(`   📍 Errori: ${group.count}`);
        
        if (showDetails && group.errors.length > 0) {
          // Mostra primi 3 errori per file
          const errorsToShow = group.errors.slice(0, 3);
          errorsToShow.forEach(err => {
            logger.info(`   • Riga ${err.line}:${err.column} - ${err.code}: ${err.message.substring(0, 80)}...`);
          });
          if (group.errors.length > 3) {
            logger.info(`   • ... e altri ${group.errors.length - 3} errori`);
          }
        }
      });
    }
    
    // Frontend results
    if (results.frontend.groups.length > 0) {
      logger.info('\n🎨 FRONTEND - Top files con errori:');
      logger.info('-'.repeat(40));
      
      results.frontend.groups.forEach((group: FileErrorGroup, index: number) => {
        logger.info(`\n${index + 1}. ${group.file}`);
        logger.info(`   📍 Errori: ${group.count}`);
        
        if (showDetails && group.errors.length > 0) {
          // Mostra primi 3 errori per file
          const errorsToShow = group.errors.slice(0, 3);
          errorsToShow.forEach(err => {
            logger.info(`   • Riga ${err.line}:${err.column} - ${err.code}: ${err.message.substring(0, 80)}...`);
          });
          if (group.errors.length > 3) {
            logger.info(`   • ... e altri ${group.errors.length - 3} errori`);
          }
        }
      });
    }
    
    // Riepilogo finale
    logger.info('\n' + '='.repeat(80));
    logger.info('📊 RIEPILOGO TOTALE');
    logger.info('='.repeat(80));
    logger.info(`🔧 Backend:  ${results.backend.total} errori in ${results.backend.files} file`);
    logger.info(`🎨 Frontend: ${results.frontend.total} errori in ${results.frontend.files} file`);
    logger.info(`📈 Totale:   ${results.backend.total + results.frontend.total} errori in ${results.backend.files + results.frontend.files} file`);
    logger.info('='.repeat(80));
    
    // Suggerimenti
    if (allErrors.length > 0) {
      logger.info('\n💡 SUGGERIMENTI:');
      logger.info('1. Inizia correggendo i file con più errori');
      logger.info('2. Molti errori potrebbero essere correlati (fix uno risolve altri)');
      logger.info('3. Controlla se ci sono import mancanti o tipi non definiti');
      logger.info('4. Usa "npx tsc --noEmit" nella cartella specifica per dettagli');
    } else {
      logger.info('\n✅ Ottimo! Nessun errore TypeScript trovato!');
    }
    
    return {
      success: true,
      backend: results.backend,
      frontend: results.frontend,
      totalErrors: results.backend.total + results.frontend.total,
      totalFiles: results.backend.files + results.frontend.files,
      message: `Trovati ${results.backend.total + results.frontend.total} errori TypeScript in ${results.backend.files + results.frontend.files} file`
    };
    
  } catch (error) {
    logger.error('❌ Script execution failed:', error);
    throw error;
  }
}

// Metadata for Script Manager
export const metadata = {
  id: 'typescript-errors-check',
  name: 'TypeScript Errors Check',
  description: 'Controlla errori TypeScript in backend e frontend, ordinati per numero di errori',
  category: 'testing',
  risk: 'low',
  parameters: [
    {
      name: 'area',
      type: 'select',
      options: ['all', 'backend', 'frontend'],
      default: 'all',
      description: 'Area da controllare'
    },
    {
      name: 'showDetails',
      type: 'boolean',
      default: true,
      description: 'Mostra dettagli degli errori'
    },
    {
      name: 'limit',
      type: 'number',
      default: 20,
      description: 'Numero massimo di file da mostrare per area'
    }
  ],
  requireConfirmation: false,
  minRole: 'ADMIN',
  timeout: 120000
};