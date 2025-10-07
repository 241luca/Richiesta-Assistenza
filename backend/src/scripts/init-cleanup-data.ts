// Script di inizializzazione dati cleanup
// backend/src/scripts/init-cleanup-data.ts

import { prisma } from '../config/database';
import logger from '../utils/logger';

async function initCleanupData() {
  console.log('🚀 Inizializzazione dati Cleanup System v2.0...');

  try {
    // 1. Crea configurazione di default
    const config = await prisma.cleanupConfig.upsert({
      where: { name: 'default' },
      update: {},
      create: {
        name: 'default',
        targetDirectory: 'cleanup-archive', // Directory di default
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
      { pattern: 'setup-*.sh', description: 'Script di setup temporanei', category: 'script', priority: 15 },

      // Pattern per file di codice temporanei
      { pattern: '*.fixed.ts', description: 'TypeScript file corretti', category: 'code', priority: 20 },
      { pattern: '*.fixed.tsx', description: 'React TypeScript corretti', category: 'code', priority: 21 },
      { pattern: '*.fixed.js', description: 'JavaScript corretti', category: 'code', priority: 22 },
      { pattern: '*.fixed.jsx', description: 'React JavaScript corretti', category: 'code', priority: 23 },
      { pattern: '*.temp.ts', description: 'TypeScript temporanei', category: 'code', priority: 24 },
      { pattern: '*.temp.tsx', description: 'React temporanei', category: 'code', priority: 25 },

      // Pattern per file di log e test
      { pattern: '*.log.old', description: 'Log file vecchi', category: 'log', priority: 30 },
      { pattern: '*.log.[0-9]*', description: 'Log file ruotati', category: 'log', priority: 31 },
      { pattern: 'test-*.mjs', description: 'Test module JavaScript', category: 'test', priority: 40 },
      { pattern: '*.test.backup', description: 'Backup di file test', category: 'test', priority: 41 },

      // Pattern specifici del progetto Richiesta Assistenza
      { pattern: 'schema.backup*.prisma', description: 'Backup schema Prisma', category: 'database', priority: 50 },
      { pattern: '*.AIFIX-*', description: 'File corretti da AI', category: 'code', priority: 51 },
      { pattern: '*.WORKING-*', description: 'File in lavorazione', category: 'code', priority: 52 },
      { pattern: '*.COMPLETE-*', description: 'File completati', category: 'code', priority: 53 },
      { pattern: '*.PERFECT-*', description: 'File perfezionati', category: 'code', priority: 54 },
    ];

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
      } catch (err) {
        // Ignora duplicati
      }
    }
    console.log(`✅ ${patterns.length} pattern di file aggiunti`);

    // 3. Aggiungi file da escludere
    const excludedFiles = [
      // File di configurazione critici
      { fileName: '.env', reason: 'Variabili ambiente production', criticality: 'CRITICAL' },
      { fileName: '.env.local', reason: 'Variabili ambiente locali', criticality: 'CRITICAL' },
      { fileName: '.env.production', reason: 'Variabili ambiente production', criticality: 'CRITICAL' },
      { fileName: '.env.development', reason: 'Variabili ambiente development', criticality: 'CRITICAL' },
      { fileName: '.env.test', reason: 'Variabili ambiente test', criticality: 'CRITICAL' },

      // File di sicurezza
      { fileName: '*.key', reason: 'Chiavi private', criticality: 'CRITICAL', isPattern: true },
      { fileName: '*.pem', reason: 'Certificati SSL', criticality: 'CRITICAL', isPattern: true },
      { fileName: '*.crt', reason: 'Certificati', criticality: 'CRITICAL', isPattern: true },
      { fileName: '*.p12', reason: 'Certificati PKCS12', criticality: 'CRITICAL', isPattern: true },
      { fileName: '*.pfx', reason: 'Certificati PFX', criticality: 'CRITICAL', isPattern: true },

      // File di sistema progetto
      { fileName: 'package.json', reason: 'Configurazione NPM', criticality: 'CRITICAL' },
      { fileName: 'package-lock.json', reason: 'Lock file NPM', criticality: 'HIGH' },
      { fileName: 'yarn.lock', reason: 'Lock file Yarn', criticality: 'HIGH' },
      { fileName: 'pnpm-lock.yaml', reason: 'Lock file PNPM', criticality: 'HIGH' },
      { fileName: 'tsconfig.json', reason: 'Configurazione TypeScript', criticality: 'HIGH' },
      { fileName: 'vite.config.ts', reason: 'Configurazione Vite', criticality: 'HIGH' },
      { fileName: 'vite.config.js', reason: 'Configurazione Vite JS', criticality: 'HIGH' },
      { fileName: 'tailwind.config.js', reason: 'Configurazione Tailwind', criticality: 'HIGH' },
      { fileName: 'postcss.config.js', reason: 'Configurazione PostCSS', criticality: 'HIGH' },

      // File Prisma importanti
      { fileName: 'schema.prisma', reason: 'Schema database principale', criticality: 'CRITICAL' },
      { fileName: 'seed.ts', reason: 'Script seed database', criticality: 'HIGH' },
      { fileName: 'seed.js', reason: 'Script seed database JS', criticality: 'HIGH' },

      // File documentazione importanti
      { fileName: 'README.md', reason: 'Documentazione principale', criticality: 'HIGH' },
      { fileName: 'ISTRUZIONI-PROGETTO.md', reason: 'Istruzioni tecniche vincolanti', criticality: 'CRITICAL' },
      { fileName: 'ARCHITETTURA-SISTEMA-COMPLETA.md', reason: 'Documentazione architettura', criticality: 'HIGH' },
      { fileName: 'CHECKLIST-FUNZIONALITA-SISTEMA.md', reason: 'Checklist funzionalità', criticality: 'HIGH' },
    ];

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
      } catch (err) {
        // Ignora duplicati
      }
    }
    console.log(`✅ ${excludedFiles.length} file esclusi aggiunti`);

    // 4. Aggiungi directory da escludere
    const excludedDirs = [
      // Directory di sistema
      { directory: '.git', reason: 'Repository Git', recursive: true },
      { directory: 'node_modules', reason: 'Dipendenze NPM', recursive: true },
      { directory: '.next', reason: 'Build Next.js', recursive: true },
      { directory: 'dist', reason: 'Build distribuzione', recursive: true },
      { directory: 'build', reason: 'Build produzione', recursive: true },
      { directory: '.vite', reason: 'Cache Vite', recursive: true },

      // Directory WhatsApp critiche
      { directory: '.wwebjs_auth', reason: 'Autenticazione WhatsApp Web', recursive: true },
      { directory: '.wppconnect', reason: 'WPPConnect sessions', recursive: true },
      { directory: 'tokens', reason: 'Token WhatsApp', recursive: true },
      { directory: 'ChromeProfile', reason: 'Profilo Chrome WhatsApp', recursive: true },
      { directory: 'userDataDir', reason: 'Dati utente Chrome', recursive: true },
      { directory: 'whatsapp-sessions', reason: 'Sessioni WhatsApp', recursive: true },

      // Directory dati importanti
      { directory: 'uploads', reason: 'File caricati dagli utenti', recursive: true },
      { directory: 'public/uploads', reason: 'File pubblici utenti', recursive: true },
      { directory: 'database-backups', reason: 'Backup ufficiali database', recursive: true },
      { directory: 'backend/backups', reason: 'Backup sistema backend', recursive: true },
      { directory: 'backups', reason: 'Backup generali', recursive: true },
      { directory: 'logs', reason: 'Log applicazione attivi', recursive: true },

      // Directory Prisma
      { directory: 'prisma/migrations', reason: 'Migrazioni database', recursive: true },
      { directory: 'backend/prisma/migrations', reason: 'Migrazioni backend', recursive: true },

      // Directory documentazione
      { directory: 'Docs', reason: 'Documentazione progetto', recursive: true },
      { directory: 'DOCUMENTAZIONE', reason: 'Documentazione completa', recursive: true },
      { directory: 'REPORT-SESSIONI-CLAUDE', reason: 'Report di sviluppo', recursive: true },

      // Directory di sviluppo da preservare
      { directory: 'src/components', reason: 'Componenti React', recursive: true },
      { directory: 'src/pages', reason: 'Pagine applicazione', recursive: true },
      { directory: 'src/services', reason: 'Servizi frontend', recursive: true },
      { directory: 'backend/src/routes', reason: 'Routes API', recursive: true },
      { directory: 'backend/src/services', reason: 'Servizi backend', recursive: true },
      { directory: 'backend/src/middleware', reason: 'Middleware Express', recursive: true },

      // Esclusione ricorsiva per evitare loop
      { directory: 'CLEANUP-*', reason: 'Cartelle cleanup esistenti', recursive: true, isPattern: true },
      { directory: 'cleanup-archive', reason: 'Archivio cleanup', recursive: true },
    ];

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
      } catch (err) {
        // Ignora duplicati
      }
    }
    console.log(`✅ ${excludedDirs.length} directory escluse aggiunte`);

    // 5. Aggiungi schedule di esempio (disattivati)
    const schedules = [
      {
        name: 'daily-cleanup',
        description: 'Cleanup giornaliero alle 2 di notte',
        cronExpression: '0 2 * * *',
        timezone: 'Europe/Rome',
        configName: 'default',
        runOnStartup: false,
        catchUp: false,
        isActive: false
      },
      {
        name: 'weekly-cleanup',
        description: 'Cleanup settimanale ogni lunedì',
        cronExpression: '0 3 * * 1',
        timezone: 'Europe/Rome',
        configName: 'default',
        runOnStartup: false,
        catchUp: false,
        isActive: false
      }
    ];

    for (const s of schedules) {
      try {
        await prisma.cleanupSchedule.create({
          data: {
            name: s.name,
            description: s.description,
            cronExpression: s.cronExpression,
            isActive: s.isActive
          }
        });
      } catch (err) {
        // Ignora duplicati
      }
    }
    console.log(`✅ ${schedules.length} schedule di esempio aggiunti (disattivati)`);

    console.log('\n🎉 Inizializzazione completata con successo!');
    console.log('\n📝 PROSSIMI PASSI:');
    console.log('1. Vai su http://localhost:5193/admin/backup');
    console.log('2. Clicca sul tab "Impostazioni"');
    console.log('3. Configura:');
    console.log('   - Project Path: /Users/lucamambelli/Desktop/Richiesta-Assistenza');
    console.log('   - Target Directory: /Users/lucamambelli/Desktop/backup-ra/cleanup');
    console.log('4. Verifica pattern ed esclusioni');
    console.log('5. Salva la configurazione');
    console.log('\n✅ Il sistema cleanup v2.0 è pronto all\'uso!');

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui l'inizializzazione
initCleanupData();
