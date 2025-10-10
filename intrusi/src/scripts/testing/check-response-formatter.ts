/**
 * Script: Check ResponseFormatter Usage
 * Verifica che tutte le routes usino ResponseFormatter
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { logger } from '../../utils/logger';

const readFile = promisify(fs.readFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

interface RouteViolation {
  file: string;
  line: number;
  code: string;
  issue: string;
}

interface CheckResponseFormatterParams {
  showCode?: boolean;
  checkServices?: boolean;
}

async function findAllRouteFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await readdir(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const fileStat = await stat(fullPath);
      
      if (fileStat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        await walk(fullPath);
      } else if (fileStat.isFile() && entry.endsWith('.routes.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function findAllServiceFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await readdir(currentDir);
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry);
      const fileStat = await stat(fullPath);
      
      if (fileStat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        await walk(fullPath);
      } else if (fileStat.isFile() && entry.endsWith('.service.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function checkFileForViolations(filePath: string, isService: boolean = false): Promise<RouteViolation[]> {
  const violations: RouteViolation[] = [];
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    
    if (isService) {
      // Check per services - NON dovrebbero usare ResponseFormatter
      if (line.includes('ResponseFormatter')) {
        violations.push({
          file: filePath,
          line: lineNum,
          code: line.trim(),
          issue: '❌ Service usa ResponseFormatter (dovrebbe ritornare solo dati)'
        });
      }
    } else {
      // Check per routes - DEVONO usare ResponseFormatter
      
      // Pattern per res.json o res.status senza ResponseFormatter
      const hasResJson = line.includes('res.json(') || line.includes('res.status(');
      const hasResponseFormatter = line.includes('ResponseFormatter');
      
      if (hasResJson && !hasResponseFormatter) {
        // Verifica che non sia un commento
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('*')) {
          // Verifica se ResponseFormatter è nella riga successiva (multilinea)
          let foundInNextLines = false;
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            if (lines[j].includes('ResponseFormatter')) {
              foundInNextLines = true;
              break;
            }
            if (lines[j].includes(');')) {
              break; // Fine statement
            }
          }
          
          if (!foundInNextLines) {
            violations.push({
              file: filePath,
              line: lineNum,
              code: line.trim(),
              issue: '⚠️ Route non usa ResponseFormatter'
            });
          }
        }
      }
      
      // Check per return diretto di dati senza res.json
      if (line.includes('return {') && !line.includes('return res') && !line.includes('ResponseFormatter')) {
        const trimmedLine = line.trim();
        if (!trimmedLine.startsWith('//') && !trimmedLine.startsWith('*')) {
          violations.push({
            file: filePath,
            line: lineNum,
            code: line.trim(),
            issue: '⚠️ Route ritorna dati direttamente senza res.json'
          });
        }
      }
    }
  }
  
  return violations;
}

export async function execute(params: CheckResponseFormatterParams = {}) {
  const { 
    showCode = true,
    checkServices = true 
  } = params;
  
  const rootPath = path.resolve(__dirname, '../../../..');
  const backendPath = path.join(rootPath, 'backend');
  const routesPath = path.join(backendPath, 'src', 'routes');
  const servicesPath = path.join(backendPath, 'src', 'services');
  
  try {
    logger.info('🚀 Starting ResponseFormatter usage check...');
    logger.info(`📋 Parameters: showCode=${showCode}, checkServices=${checkServices}`);
    
    const allViolations: RouteViolation[] = [];
    
    // Check Routes
    logger.info('\n📂 Scanning route files...');
    const routeFiles = await findAllRouteFiles(routesPath);
    logger.info(`Found ${routeFiles.length} route files`);
    
    for (const file of routeFiles) {
      const violations = await checkFileForViolations(file, false);
      allViolations.push(...violations);
    }
    
    // Check Services (opzionale)
    if (checkServices) {
      logger.info('\n📂 Scanning service files...');
      const serviceFiles = await findAllServiceFiles(servicesPath);
      logger.info(`Found ${serviceFiles.length} service files`);
      
      for (const file of serviceFiles) {
        const violations = await checkFileForViolations(file, true);
        allViolations.push(...violations);
      }
    }
    
    // Raggruppa violazioni per file
    const violationsByFile = new Map<string, RouteViolation[]>();
    for (const violation of allViolations) {
      const existing = violationsByFile.get(violation.file) || [];
      existing.push(violation);
      violationsByFile.set(violation.file, existing);
    }
    
    // Ordina per numero di violazioni
    const sortedFiles = Array.from(violationsByFile.entries())
      .sort((a, b) => b[1].length - a[1].length);
    
    // Mostra risultati
    logger.info('\n' + '='.repeat(80));
    logger.info('📊 RISULTATI CONTROLLO RESPONSEFORMATTER');
    logger.info('='.repeat(80));
    
    if (sortedFiles.length === 0) {
      logger.info('\n✅ Perfetto! Tutte le routes usano correttamente ResponseFormatter!');
      if (checkServices) {
        logger.info('✅ Nessun service usa ResponseFormatter (corretto)!');
      }
    } else {
      logger.info(`\n⚠️ Trovate ${allViolations.length} violazioni in ${sortedFiles.length} file:\n`);
      
      // Separa routes e services
      const routeViolations = sortedFiles.filter(([file]) => file.includes('.routes.'));
      const serviceViolations = sortedFiles.filter(([file]) => file.includes('.service.'));
      
      // Mostra violazioni nelle routes
      if (routeViolations.length > 0) {
        logger.info('🔴 ROUTES CHE NON USANO RESPONSEFORMATTER:');
        logger.info('-'.repeat(40));
        
        routeViolations.forEach(([file, violations], index) => {
          const relativePath = file.replace(backendPath, '');
          logger.info(`\n${index + 1}. ${relativePath}`);
          logger.info(`   📍 Violazioni: ${violations.length}`);
          
          if (showCode) {
            violations.slice(0, 5).forEach(v => {
              logger.info(`   • Riga ${v.line}: ${v.issue}`);
              logger.info(`     ${v.code.substring(0, 80)}${v.code.length > 80 ? '...' : ''}`);
            });
            
            if (violations.length > 5) {
              logger.info(`   • ... e altre ${violations.length - 5} violazioni`);
            }
          }
        });
      }
      
      // Mostra violazioni nei services
      if (serviceViolations.length > 0) {
        logger.info('\n🔴 SERVICES CHE USANO RESPONSEFORMATTER (ERRORE):');
        logger.info('-'.repeat(40));
        
        serviceViolations.forEach(([file, violations], index) => {
          const relativePath = file.replace(backendPath, '');
          logger.info(`\n${index + 1}. ${relativePath}`);
          logger.info(`   📍 Violazioni: ${violations.length}`);
          
          if (showCode) {
            violations.slice(0, 5).forEach(v => {
              logger.info(`   • Riga ${v.line}: ${v.issue}`);
              logger.info(`     ${v.code.substring(0, 80)}${v.code.length > 80 ? '...' : ''}`);
            });
            
            if (violations.length > 5) {
              logger.info(`   • ... e altre ${violations.length - 5} violazioni`);
            }
          }
        });
      }
    }
    
    // Riepilogo
    logger.info('\n' + '='.repeat(80));
    logger.info('📈 RIEPILOGO');
    logger.info('='.repeat(80));
    
    const routeFilesChecked = routeFiles.length;
    const serviceFilesChecked = checkServices ? (await findAllServiceFiles(servicesPath)).length : 0;
    const totalFilesChecked = routeFilesChecked + serviceFilesChecked;
    
    logger.info(`📂 File controllati: ${totalFilesChecked}`);
    logger.info(`   • Route files: ${routeFilesChecked}`);
    if (checkServices) {
      logger.info(`   • Service files: ${serviceFilesChecked}`);
    }
    logger.info(`⚠️ Violazioni trovate: ${allViolations.length}`);
    logger.info(`📁 File con violazioni: ${sortedFiles.length}`);
    
    // Suggerimenti per fix
    if (allViolations.length > 0) {
      logger.info('\n💡 COME CORREGGERE:');
      logger.info('Per le ROUTES:');
      logger.info('  ❌ SBAGLIATO: res.json({ data })');
      logger.info('  ✅ CORRETTO:  res.json(ResponseFormatter.success(data, "Success"))');
      logger.info('');
      logger.info('Per i SERVICES:');
      logger.info('  ❌ SBAGLIATO: return ResponseFormatter.success(data)');
      logger.info('  ✅ CORRETTO:  return data  // Solo i dati, senza formatter');
      logger.info('');
      logger.info('Ricorda: ResponseFormatter va SOLO nelle routes, MAI nei services!');
    }
    
    return {
      success: true,
      totalViolations: allViolations.length,
      filesWithViolations: sortedFiles.length,
      filesChecked: totalFilesChecked,
      violations: sortedFiles.map(([file, violations]) => ({
        file: file.replace(backendPath, ''),
        count: violations.length
      })),
      message: allViolations.length === 0 
        ? 'Tutte le routes usano correttamente ResponseFormatter!'
        : `Trovate ${allViolations.length} violazioni in ${sortedFiles.length} file`
    };
    
  } catch (error) {
    logger.error('❌ Script execution failed:', error);
    throw error;
  }
}

// Metadata for Script Manager
export const metadata = {
  id: 'check-response-formatter',
  name: 'Check ResponseFormatter Usage',
  description: 'Verifica che tutte le routes usino ResponseFormatter e che i services NON lo usino',
  category: 'testing',
  risk: 'low',
  parameters: [
    {
      name: 'showCode',
      type: 'boolean',
      default: true,
      description: 'Mostra il codice delle violazioni'
    },
    {
      name: 'checkServices',
      type: 'boolean',
      default: true,
      description: 'Controlla anche che i services NON usino ResponseFormatter'
    }
  ],
  requireConfirmation: false,
  minRole: 'ADMIN',
  timeout: 60000
};