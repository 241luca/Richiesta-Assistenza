// Seeder per popolare la tabella ScriptConfiguration
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedScripts() {
  console.log('🌱 Seeding ScriptConfiguration table...');

  const scripts = [
    {
      scriptName: 'check-system',
      displayName: 'System Check',
      description: 'Verifica lo stato completo del sistema',
      category: 'MAINTENANCE',
      risk: 'LOW',
      filePath: '/scripts/check-system.sh',
      timeout: 30000,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'ArrowPathIcon',
      color: 'blue',
      order: 1,
      purpose: 'Controlla lo stato di tutti i servizi del sistema',
      whenToUse: 'Eseguire quando si sospettano problemi o per controlli periodici',
      isEnabled: true,
      isVisible: true
    },
    {
      scriptName: 'backup-all',
      displayName: 'Backup Completo',
      description: 'Esegue un backup completo del database e dei file',
      category: 'DATABASE',
      risk: 'MEDIUM',
      filePath: '/scripts/backup-all.sh',
      timeout: 120000,
      requiresConfirmation: true,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'CloudArrowDownIcon',
      color: 'green',
      order: 2,
      purpose: 'Crea un backup completo del sistema',
      whenToUse: 'Prima di aggiornamenti importanti o come backup periodico',
      isEnabled: true,
      isVisible: true
    },
    {
      scriptName: 'audit-system-check',
      displayName: 'Audit System Check',
      description: 'Verifica il sistema di audit log',
      category: 'SECURITY',
      risk: 'LOW',
      filePath: '/scripts/audit-system-check.sh',
      timeout: 30000,
      requiresConfirmation: false,
      allowedRoles: ['SUPER_ADMIN'],
      icon: 'ShieldCheckIcon',
      color: 'yellow',
      order: 3,
      purpose: 'Controlla il funzionamento del sistema di audit',
      whenToUse: 'Per verificare che tutti i log vengano registrati correttamente',
      isEnabled: true,
      isVisible: true
    },
    {
      scriptName: 'test-sistema-completo',
      displayName: 'Test Sistema Completo',
      description: 'Esegue tutti i test del sistema',
      category: 'TESTING',
      risk: 'LOW',
      filePath: '/scripts/test-sistema-completo.sh',
      timeout: 180000,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'BeakerIcon',
      color: 'purple',
      order: 4,
      purpose: 'Test completo di tutte le funzionalità',
      whenToUse: 'Dopo modifiche importanti o per verifiche periodiche',
      isEnabled: true,
      isVisible: true
    },
    {
      scriptName: 'validate-addresses',
      displayName: 'Validazione Indirizzi',
      description: 'Valida e geocodifica gli indirizzi nel database',
      category: 'MAINTENANCE',
      risk: 'MEDIUM',
      filePath: '/scripts/validate-addresses.sh',
      timeout: 60000,
      requiresConfirmation: true,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'MapPinIcon',
      color: 'indigo',
      order: 5,
      purpose: 'Valida e aggiorna le coordinate GPS degli indirizzi',
      whenToUse: 'Quando ci sono problemi con la geolocalizzazione',
      isEnabled: true,
      isVisible: true
    }
  ];

  try {
    // Pulisce eventuali script esistenti
    await prisma.scriptConfiguration.deleteMany();
    console.log('🧹 Tabella pulita');

    // Inserisce i nuovi script
    for (const script of scripts) {
      const created = await prisma.scriptConfiguration.create({
        data: script
      });
      console.log(`✅ Creato: ${created.displayName}`);
    }

    const count = await prisma.scriptConfiguration.count();
    console.log(`\n✅ Seeding completato! ${count} script inseriti nel database.`);

  } catch (error) {
    console.error('❌ Errore durante il seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedScripts();
