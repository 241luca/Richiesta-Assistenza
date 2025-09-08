#!/usr/bin/env ts-node
/**
 * Script di verifica completa del sistema Audit Log
 * Eseguire con: cd backend && npx ts-node scripts/audit-system-check.ts
 */

import { prisma } from '../src/config/database';
import { AuditAction, LogSeverity, LogCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Colori per output console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bright + colors.cyan);
  console.log('='.repeat(60));
}

async function checkDatabase() {
  header('1. VERIFICA DATABASE');
  
  try {
    // Verifica connessione
    await prisma.$connect();
    log('✅ Connessione al database riuscita', colors.green);
    
    // Verifica tabelle audit
    const tables = [
      { name: 'AuditLog', model: prisma.auditLog },
      { name: 'AuditLogRetention', model: prisma.auditLogRetention },
      { name: 'AuditLogAlert', model: prisma.auditLogAlert }
    ];
    
    for (const table of tables) {
      const count = await (table.model as any).count();
      log(`   📊 ${table.name}: ${count} record`, colors.blue);
    }
    
    // Statistiche AuditLog
    const stats = await prisma.auditLog.groupBy({
      by: ['category'],
      _count: true
    });
    
    log('\n   Distribuzione per categoria:', colors.yellow);
    stats.forEach(stat => {
      log(`      ${stat.category}: ${stat._count} log`, colors.reset);
    });
    
    // Log più recente
    const latestLog = await prisma.auditLog.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    if (latestLog) {
      log(`\n   📅 Ultimo log: ${latestLog.timestamp.toISOString()}`, colors.blue);
      log(`      Action: ${latestLog.action}`, colors.reset);
      log(`      Entity: ${latestLog.entityType}`, colors.reset);
    } else {
      log('   ⚠️ Nessun log trovato nel database', colors.yellow);
    }
    
  } catch (error: any) {
    log(`❌ Errore database: ${error.message}`, colors.red);
    return false;
  }
  
  return true;
}

async function checkBackendCode() {
  header('2. VERIFICA CODICE BACKEND');
  
  const files = [
    { path: 'src/middleware/auditLogger.ts', desc: 'Middleware principale' },
    { path: 'src/services/auditLog.service.ts', desc: 'Service layer' },
    { path: 'src/routes/audit.routes.ts', desc: 'API endpoints' }
  ];
  
  for (const file of files) {
    const fullPath = path.join(process.cwd(), file.path);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      log(`✅ ${file.desc}: ${file.path}`, colors.green);
      log(`   Size: ${stats.size} bytes`, colors.reset);
      log(`   Modified: ${stats.mtime.toISOString()}`, colors.reset);
    } else {
      log(`❌ ${file.desc} non trovato: ${file.path}`, colors.red);
    }
  }
  
  // Verifica integrazione in server.ts
  const serverPath = path.join(process.cwd(), 'src/server.ts');
  if (fs.existsSync(serverPath)) {
    const serverContent = fs.readFileSync(serverPath, 'utf8');
    const hasAuditMiddleware = serverContent.includes('auditLogger');
    
    if (hasAuditMiddleware) {
      log('\n✅ Middleware audit integrato in server.ts', colors.green);
    } else {
      log('\n⚠️ Middleware audit potrebbe non essere integrato in server.ts', colors.yellow);
    }
  }
}

async function checkFrontendCode() {
  header('3. VERIFICA CODICE FRONTEND');
  
  const frontendBase = path.join(process.cwd(), '..', 'src', 'components', 'admin', 'audit');
  
  if (fs.existsSync(frontendBase)) {
    const files = fs.readdirSync(frontendBase);
    log(`✅ Directory dashboard trovata con ${files.length} componenti:`, colors.green);
    files.forEach(file => {
      log(`   📄 ${file}`, colors.blue);
    });
  } else {
    log('❌ Directory dashboard non trovata', colors.red);
  }
}

async function checkDependencies() {
  header('4. VERIFICA DIPENDENZE');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const requiredDeps = [
    { name: 'json2csv', type: 'CSV export' },
    { name: 'lodash', type: 'Utility functions' },
    { name: 'express-rate-limit', type: 'Rate limiting' },
    { name: 'helmet', type: 'Security headers' }
  ];
  
  for (const dep of requiredDeps) {
    const version = packageJson.dependencies?.[dep.name] || packageJson.devDependencies?.[dep.name];
    if (version) {
      log(`✅ ${dep.name} (${dep.type}): ${version}`, colors.green);
    } else {
      log(`⚠️ ${dep.name} (${dep.type}): NON INSTALLATO`, colors.yellow);
    }
  }
}

async function testAuditCreation() {
  header('5. TEST CREAZIONE LOG');
  
  try {
    const testLog = await prisma.auditLog.create({
      data: {
        action: AuditAction.SYSTEM_ERROR,
        entityType: 'SystemTest',
        entityId: 'test-' + Date.now(),
        ipAddress: '127.0.0.1',
        userAgent: 'Audit System Check Script',
        success: true,
        severity: LogSeverity.INFO,
        category: LogCategory.SYSTEM,
        metadata: {
          test: true,
          timestamp: new Date().toISOString(),
          script: 'audit-system-check.ts'
        }
      }
    });
    
    log('✅ Log di test creato con successo', colors.green);
    log(`   ID: ${testLog.id}`, colors.blue);
    log(`   Timestamp: ${testLog.timestamp}`, colors.blue);
    
    // Cleanup
    await prisma.auditLog.delete({ where: { id: testLog.id } });
    log('   🧹 Log di test rimosso', colors.yellow);
    
  } catch (error: any) {
    log(`❌ Errore creazione log: ${error.message}`, colors.red);
  }
}

async function checkRetentionPolicies() {
  header('6. VERIFICA RETENTION POLICIES');
  
  const policies = await prisma.auditLogRetention.findMany();
  
  if (policies.length === 0) {
    log('⚠️ Nessuna retention policy configurata', colors.yellow);
    log('   Suggerimento: Creare policies per gestione automatica dei log', colors.reset);
  } else {
    log(`✅ ${policies.length} retention policies configurate:`, colors.green);
    policies.forEach(policy => {
      log(`   📋 ${policy.category}: ${policy.retentionDays} giorni`, colors.blue);
    });
  }
}

async function checkAlerts() {
  header('7. VERIFICA ALERT SYSTEM');
  
  const alerts = await prisma.auditLogAlert.findMany({
    where: { isActive: true }
  });
  
  if (alerts.length === 0) {
    log('⚠️ Nessun alert configurato', colors.yellow);
  } else {
    log(`✅ ${alerts.length} alert attivi:`, colors.green);
    alerts.forEach(alert => {
      log(`   🔔 ${alert.name} (${alert.severity})`, colors.blue);
      if (alert.lastTriggered) {
        log(`      Ultimo trigger: ${alert.lastTriggered}`, colors.reset);
      }
    });
  }
}

async function generateReport() {
  header('8. REPORT FINALE');
  
  const totalLogs = await prisma.auditLog.count();
  const last24h = await prisma.auditLog.count({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    }
  });
  
  const last7days = await prisma.auditLog.count({
    where: {
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });
  
  const errorLogs = await prisma.auditLog.count({
    where: { severity: LogSeverity.ERROR }
  });
  
  const criticalLogs = await prisma.auditLog.count({
    where: { severity: LogSeverity.CRITICAL }
  });
  
  log('📊 STATISTICHE GENERALI:', colors.bright + colors.magenta);
  log(`   Total logs: ${totalLogs}`, colors.cyan);
  log(`   Ultimi 24h: ${last24h}`, colors.cyan);
  log(`   Ultimi 7 giorni: ${last7days}`, colors.cyan);
  log(`   Errori: ${errorLogs}`, errorLogs > 0 ? colors.yellow : colors.green);
  log(`   Critici: ${criticalLogs}`, criticalLogs > 0 ? colors.red : colors.green);
  
  // Raccomandazioni
  header('9. RACCOMANDAZIONI');
  
  const recommendations = [];
  
  if (totalLogs === 0) {
    recommendations.push('⚠️ Nessun log presente - verificare integrazione middleware');
  }
  
  if (errorLogs > 100) {
    recommendations.push('⚠️ Alto numero di errori - investigare cause');
  }
  
  const policies = await prisma.auditLogRetention.count();
  if (policies === 0) {
    recommendations.push('📋 Configurare retention policies per gestione automatica');
  }
  
  const alerts = await prisma.auditLogAlert.count();
  if (alerts === 0) {
    recommendations.push('🔔 Configurare alert per monitoraggio proattivo');
  }
  
  if (recommendations.length === 0) {
    log('✅ Sistema audit log configurato correttamente!', colors.green);
  } else {
    recommendations.forEach(rec => log(rec, colors.yellow));
  }
}

// Main execution
async function main() {
  console.clear();
  log('╔══════════════════════════════════════════════════════════╗', colors.bright + colors.cyan);
  log('║         AUDIT LOG SYSTEM - VERIFICA COMPLETA             ║', colors.bright + colors.cyan);
  log('║                  ' + new Date().toISOString() + '              ║', colors.bright + colors.cyan);
  log('╚══════════════════════════════════════════════════════════╝', colors.bright + colors.cyan);
  
  try {
    await checkDatabase();
    await checkBackendCode();
    await checkFrontendCode();
    await checkDependencies();
    await testAuditCreation();
    await checkRetentionPolicies();
    await checkAlerts();
    await generateReport();
    
    log('\n✅ VERIFICA COMPLETATA CON SUCCESSO', colors.bright + colors.green);
    
  } catch (error: any) {
    log(`\n❌ ERRORE DURANTE LA VERIFICA: ${error.message}`, colors.red);
    console.error(error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
