// Script di inizializzazione dati cleanup - Versione compatibile con schema esistente
// backend/src/scripts/init-cleanup-data-safe.ts

import { prisma } from '../config/database';
import logger from '../utils/logger';

async function initCleanupDataSafe() {
  console.log('🚀 Inizializzazione dati Cleanup System v2.0 (modalità compatibile)...');

  try {
    // 1. Verifica se la configurazione esiste già
    let config = await prisma.cleanupConfig.findFirst({
      where: { name: 'default' }
    });

    if (!config) {
      // Crea configurazione di default con i campi esistenti
      config = await prisma.cleanupConfig.create({
        data: {
          name: 'default',
          targetDirectory: 'cleanup-archive',
          directoryFormat: 'CLEANUP-{YYYY}-{MM}-{DD}-{HH}-{mm}-{ss}',
          maxDepth: 3,
          bufferSize: 104857600,
          timeout: 60000,
          retentionDays: 30,
          autoCleanup: false,
          autoCleanupDays: 30,
          createReadme: true,
          preserveStructure: true,
          notifyOnCleanup: true,
          isActive: true
        }
      });
      console.log('✅ Configurazione di default creata');
    } else {
      console.log('ℹ️ Configurazione default già esistente');
    }

    // 2. Aggiungi pattern di file
    const patterns = [
      // Pattern per file di backup
      { pattern: '*.backup-*', description: 'File di backup con timestamp', category: 'backup', priority: 1 },
      { pattern: '*.bak', description: 'File di backup generici', category: 'backup', priority: 2 },
      { pattern: '*.old', description: 'File vecchie versioni', category: 'backup', priority: 3 },
      { pattern: 'BACKUP-*', description: 'Directory di backup', category: 'backup', priority: 4 },
      { pattern: 'backup-*.sql', description: 'Backup database SQL', category: 'backup', priority: 5 },
      { pattern: '*.dump', description: 'Database dump files', category: 'backup', priority: 6 },

      // Pattern per script temporanei
      { pattern: 'test-*.sh', description: 'Script di test', category: 'script', priority: 10 },
      { pattern: 'fix-*.sh', description: 'Script di fix temporanei', category: 'script', priority: 11 },
      { pattern: 'check-*.sh', description: 'Script di verifica', category: 'script', priority: 12 },
      { pattern: 'debug-*.sh', description: 'Script di debug', category: 'script', priority: 13 },
      { pattern: 'temp-*.sh', description: 'Script temporanei', category: 'script', priority: 14 },

      // Pattern per file di codice temporanei
      { pattern: '*.fixed.ts', description: 'TypeScript file corretti', category: 'code', priority: 20 },
      { pattern: '*.fixed.tsx', description: 'React TypeScript corretti', category: 'code', priority: 21 },
      { pattern: '*.temp.ts', description: 'TypeScript temporanei', category: 'code', priority: 24 },
      { pattern: '*.temp.tsx', description: 'React temporanei', category: 'code', priority: 25 },

      // Pattern per file di log e test
      { pattern: '*.log.old', description: 'Log file vecchi', category: 'log', priority: 30 },
      { pattern: 'test-*.mjs', description: 'Test module JavaScript', category: 'test', priority: 40 },

      // Pattern specifici del progetto
      { pattern: 'schema.backup*.prisma', description: 'Backup schema Prisma', category: 'database', priority: 50 },
      { pattern: '*.AIFIX-*', description: 'File corretti da AI', category: 'code', priority: 51 },
    ];

    let patternsAdded = 0;
    for (const p of patterns) {
      try {
        await prisma.cleanupPattern.create({
          data: {
            pattern: p.pattern,
            description: p.description,
            category: p.category,
            priority: p.priority,
            isActive: true
          }
        });
        patternsAdded++;
      } catch (err: any) {
        if (err.code !== 'P2002') { // Non è un duplicato
          console.error(`Errore creando pattern ${p.pattern}:`, err.message);
        }
      }
    }
    console.log(`✅ ${patternsAdded} nuovi pattern aggiunti (${patterns.length - patternsAdded} già esistenti)`);

    // 3. Aggiungi file da escludere (solo i più importanti)
    const excludedFiles = [
      // File critici
      { fileName: '.env', reason: 'Variabili ambiente', criticality: 'high' },
      { fileName: '.env.local', reason: 'Variabili locali', criticality: 'high' },
      { fileName: '.env.production', reason: 'Variabili production', criticality: 'high' },
      { fileName: 'package.json', reason: 'Configurazione NPM', criticality: 'high' },
      { fileName: 'package-lock.json', reason: 'Lock file NPM', criticality: 'normal' },
      { fileName: 'schema.prisma', reason: 'Schema database', criticality: 'high' },
      { fileName: 'ISTRUZIONI-PROGETTO.md', reason: 'Istruzioni vincolanti', criticality: 'high' },
    ];

    let filesAdded = 0;
    for (const f of excludedFiles) {
      try {
        await prisma.cleanupExcludeFile.create({
          data: {
            fileName: f.fileName,
            reason: f.reason,
            criticality: f.criticality,
            isActive: true
          }
        });
        filesAdded++;
      } catch (err: any) {
        if (err.code !== 'P2002') {
          console.error(`Errore escludendo file ${f.fileName}:`, err.message);
        }
      }
    }
    console.log(`✅ ${filesAdded} file esclusi aggiunti`);

    // 4. Aggiungi directory da escludere (le più importanti)
    const excludedDirs = [
      // Sistema
      { directory: '.git', reason: 'Repository Git', recursive: true },
      { directory: 'node_modules', reason: 'Dipendenze NPM', recursive: true },
      { directory: 'dist', reason: 'Build distribuzione', recursive: true },
      { directory: 'build', reason: 'Build produzione', recursive: true },
      
      // WhatsApp
      { directory: '.wwebjs_auth', reason: 'Autenticazione WhatsApp', recursive: true },
      { directory: 'tokens', reason: 'Token WhatsApp', recursive: true },
      
      // Dati
      { directory: 'uploads', reason: 'File utenti', recursive: true },
      { directory: 'database-backups', reason: 'Backup database', recursive: true },
      { directory: 'logs', reason: 'Log applicazione', recursive: true },
      
      // Cleanup esistenti
      { directory: 'CLEANUP-*', reason: 'Cleanup esistenti', recursive: true },
      { directory: 'cleanup-archive', reason: 'Archivio cleanup', recursive: true },
    ];

    let dirsAdded = 0;
    for (const d of excludedDirs) {
      try {
        await prisma.cleanupExcludeDirectory.create({
          data: {
            directory: d.directory,
            reason: d.reason,
            recursive: d.recursive,
            isActive: true
          }
        });
        dirsAdded++;
      } catch (err: any) {
        if (err.code !== 'P2002') {
          console.error(`Errore escludendo directory ${d.directory}:`, err.message);
        }
      }
    }
    console.log(`✅ ${dirsAdded} directory escluse aggiunte`);

    console.log('\n🎉 Inizializzazione completata!');
    console.log('\n📝 CONFIGURAZIONE RICHIESTA:');
    console.log('1. Vai su http://localhost:5193/admin/backup');
    console.log('2. Clicca sul tab "Impostazioni"');
    console.log('3. Modifica il campo "Target Directory"');
    console.log('   Esempio: /Users/lucamambelli/Desktop/cleanup-backup');
    console.log('4. Salva la configurazione');
    console.log('\n✅ Il sistema cleanup è pronto!');
    
    console.log('\n⚠️ NOTA: Alcune funzionalità avanzate potrebbero non essere disponibili');
    console.log('fino all\'aggiornamento completo dello schema del database.');

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui l'inizializzazione
initCleanupDataSafe();
