const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function backupTables() {
  console.log('📦 Inizio backup delle 4 tabelle critiche...\n');

  try {
    // Backup FooterLink
    const footerLinks = await prisma.$queryRaw`SELECT * FROM "FooterLink"`;
    console.log(`✅ FooterLink: ${footerLinks.length} righe`);

    // Backup FooterSection
    const footerSections = await prisma.$queryRaw`SELECT * FROM "FooterSection"`;
    console.log(`✅ FooterSection: ${footerSections.length} righe`);

    // Backup module_settings
    const moduleSettings = await prisma.$queryRaw`SELECT * FROM module_settings`;
    console.log(`✅ module_settings: ${moduleSettings.length} righe`);

    // Backup system_modules
    const systemModules = await prisma.$queryRaw`SELECT * FROM system_modules`;
    console.log(`✅ system_modules: ${systemModules.length} righe`);

    // Salva in file JSON
    const backup = {
      timestamp: new Date().toISOString(),
      tables: {
        FooterLink: footerLinks,
        FooterSection: footerSections,
        module_settings: moduleSettings,
        system_modules: systemModules
      }
    };

    const filename = `backup-tables-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(backup, null, 2));
    
    console.log(`\n✅ BACKUP COMPLETATO: ${filename}`);
    console.log(`📊 Totale righe salvate: ${footerLinks.length + footerSections.length + moduleSettings.length + systemModules.length}`);
    
  } catch (error) {
    console.error('❌ ERRORE durante il backup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backupTables();
