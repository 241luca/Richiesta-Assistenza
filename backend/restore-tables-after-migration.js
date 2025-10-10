const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function restoreTables() {
  console.log('🔄 Inizio ripristino delle 4 tabelle critiche...\n');

  try {
    // Trova il file di backup più recente
    const backupFiles = fs.readdirSync('.').filter(f => f.startsWith('backup-tables-') && f.endsWith('.json'));
    if (backupFiles.length === 0) {
      throw new Error('Nessun file di backup trovato!');
    }

    const latestBackup = backupFiles.sort().reverse()[0];
    console.log(`📂 Carico backup: ${latestBackup}\n`);

    const backup = JSON.parse(fs.readFileSync(latestBackup, 'utf8'));

    // Ripristina FooterSection (prima, perché FooterLink dipende da essa)
    console.log('🔄 Ripristino FooterSection...');
    for (const section of backup.tables.FooterSection) {
      await prisma.$executeRaw`
        INSERT INTO "FooterSection" (id, name, "displayName", "displayOrder", "isActive", "createdAt", "updatedAt")
        VALUES (
          ${section.id}::text,
          ${section.name}::text,
          ${section.displayName}::text,
          ${section.displayOrder}::integer,
          ${section.isActive}::boolean,
          ${new Date(section.createdAt)}::timestamp,
          ${new Date(section.updatedAt)}::timestamp
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`✅ FooterSection: ${backup.tables.FooterSection.length} righe ripristinate`);

    // Ripristina FooterLink
    console.log('🔄 Ripristino FooterLink...');
    for (const link of backup.tables.FooterLink) {
      await prisma.$executeRaw`
        INSERT INTO "FooterLink" (id, "sectionId", label, url, icon, "openInNewTab", "displayOrder", "isActive", "createdAt", "updatedAt")
        VALUES (
          ${link.id}::text,
          ${link.sectionId}::text,
          ${link.label}::text,
          ${link.url}::text,
          ${link.icon || null}::text,
          ${link.openInNewTab}::boolean,
          ${link.displayOrder}::integer,
          ${link.isActive}::boolean,
          ${new Date(link.createdAt)}::timestamp,
          ${new Date(link.updatedAt)}::timestamp
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`✅ FooterLink: ${backup.tables.FooterLink.length} righe ripristinate`);

    // Ripristina module_settings
    console.log('🔄 Ripristino module_settings...');
    for (const setting of backup.tables.module_settings) {
      await prisma.$executeRaw`
        INSERT INTO module_settings (id, module_id, key, value, type, category, description, "isEditable", "createdAt", "updatedAt")
        VALUES (
          ${setting.id}::text,
          ${setting.module_id}::text,
          ${setting.key}::text,
          ${setting.value}::text,
          ${setting.type || 'string'}::text,
          ${setting.category || 'general'}::text,
          ${setting.description || null}::text,
          ${setting.isEditable !== false}::boolean,
          ${new Date(setting.createdAt)}::timestamp,
          ${new Date(setting.updatedAt)}::timestamp
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`✅ module_settings: ${backup.tables.module_settings.length} righe ripristinate`);

    // Ripristina system_modules
    console.log('🔄 Ripristino system_modules...');
    for (const module of backup.tables.system_modules) {
      await prisma.$executeRaw`
        INSERT INTO system_modules (id, name, code, description, category, icon, color, version, "isActive", "isCore", "isInstalled", dependencies, permissions, "createdAt", "updatedAt")
        VALUES (
          ${module.id}::text,
          ${module.name}::text,
          ${module.code}::text,
          ${module.description || null}::text,
          ${module.category || 'general'}::text,
          ${module.icon || null}::text,
          ${module.color || '#000000'}::text,
          ${module.version || '1.0.0'}::text,
          ${module.isActive !== false}::boolean,
          ${module.isCore === true}::boolean,
          ${module.isInstalled !== false}::boolean,
          ${JSON.stringify(module.dependencies || [])}::jsonb,
          ${JSON.stringify(module.permissions || [])}::jsonb,
          ${new Date(module.createdAt)}::timestamp,
          ${new Date(module.updatedAt)}::timestamp
        )
        ON CONFLICT (id) DO NOTHING
      `;
    }
    console.log(`✅ system_modules: ${backup.tables.system_modules.length} righe ripristinate`);

    console.log('\n🎉 RIPRISTINO COMPLETATO CON SUCCESSO!');
    console.log(`\n📊 Riepilogo:`);
    console.log(`   - FooterSection: ${backup.tables.FooterSection.length} righe`);
    console.log(`   - FooterLink: ${backup.tables.FooterLink.length} righe`);
    console.log(`   - module_settings: ${backup.tables.module_settings.length} righe`);
    console.log(`   - system_modules: ${backup.tables.system_modules.length} righe`);
    
  } catch (error) {
    console.error('❌ ERRORE durante il ripristino:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

restoreTables();
