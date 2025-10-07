/**
 * Script di verifica stato configurazione documenti
 * Mostra lo stato delle tabelle prima/dopo il popolamento
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocumentConfigStatus() {
  console.log('🔍 VERIFICA STATO CONFIGURAZIONE DOCUMENTI');
  console.log('==========================================\n');

  try {
    // 1. Controlla tabelle di configurazione
    console.log('📊 STATO TABELLE DI CONFIGURAZIONE:');
    console.log('------------------------------------');

    // Categorie
    const categories = await prisma.documentCategory.findMany({
      select: { code: true, name: true, isActive: true }
    });
    
    console.log(`\n📂 Categorie (${categories.length} totali):`);
    if (categories.length === 0) {
      console.log('   ⚠️  TABELLA VUOTA');
    } else {
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.code}) ${cat.isActive ? '✅' : '❌'}`);
      });
    }

    // Tipi documento
    const docTypes = await prisma.documentTypeConfig.findMany({
      select: { code: true, displayName: true, category: true, isActive: true }
    });
    
    console.log(`\n📋 Tipi Documento (${docTypes.length} totali):`);
    if (docTypes.length === 0) {
      console.log('   ⚠️  TABELLA VUOTA');
    } else {
      docTypes.forEach(type => {
        console.log(`   - ${type.displayName} [${type.category || 'N/A'}] ${type.isActive ? '✅' : '❌'}`);
      });
    }

    // System Config
    const configs = await prisma.documentSystemConfig.findMany({
      select: { key: true, category: true }
    });
    
    console.log(`\n⚙️  Configurazioni Sistema (${configs.length} totali):`);
    if (configs.length === 0) {
      console.log('   ⚠️  TABELLA VUOTA');
    } else {
      const byCategory = configs.reduce((acc, cfg) => {
        acc[cfg.category] = (acc[cfg.category] || 0) + 1;
        return acc;
      }, {});
      Object.entries(byCategory).forEach(([cat, count]) => {
        console.log(`   - ${cat}: ${count} configurazioni`);
      });
    }

    // Permessi
    const permissions = await prisma.documentPermission.findMany({
      select: { role: true, documentType: true }
    });
    
    console.log(`\n🔐 Permessi (${permissions.length} totali):`);
    if (permissions.length === 0) {
      console.log('   ⚠️  TABELLA VUOTA');
    } else {
      const byRole = permissions.reduce((acc, perm) => {
        acc[perm.role] = (acc[perm.role] || 0) + 1;
        return acc;
      }, {});
      Object.entries(byRole).forEach(([role, count]) => {
        console.log(`   - ${role}: ${count} set di permessi`);
      });
    }

    // Workflow
    const workflows = await prisma.approvalWorkflowConfig.findMany({
      select: { name: true, documentType: true, isDefault: true, isActive: true }
    });
    
    console.log(`\n📊 Workflow (${workflows.length} totali):`);
    if (workflows.length === 0) {
      console.log('   ⚠️  TABELLA VUOTA');
    } else {
      workflows.forEach(wf => {
        console.log(`   - ${wf.name} ${wf.isDefault ? '⭐' : ''} ${wf.isActive ? '✅' : '❌'}`);
      });
    }

    // 2. Controlla documenti esistenti
    console.log('\n\n📄 DOCUMENTI ESISTENTI:');
    console.log('----------------------');

    const documents = await prisma.legalDocument.findMany({
      include: {
        typeConfig: {
          select: { displayName: true }
        }
      }
    });

    console.log(`\nDocumenti totali: ${documents.length}`);
    
    const withConfig = documents.filter(d => d.typeConfigId !== null).length;
    const withoutConfig = documents.filter(d => d.typeConfigId === null).length;
    
    console.log(`  ✅ Con tipo configurato: ${withConfig}`);
    console.log(`  ⚠️  Senza tipo configurato: ${withoutConfig}`);

    if (withoutConfig > 0) {
      console.log('\nDocumenti senza configurazione:');
      documents
        .filter(d => d.typeConfigId === null)
        .forEach(d => {
          console.log(`  - ${d.displayName} (type: ${d.type})`);
        });
    }

    // 3. Verifica integrità
    console.log('\n\n🔎 VERIFICA INTEGRITÀ:');
    console.log('----------------------');

    // Controlla se ci sono documenti con type che non esiste in config
    const orphanDocs = [];
    for (const doc of documents) {
      if (doc.type && !doc.typeConfigId) {
        const configExists = await prisma.documentTypeConfig.findUnique({
          where: { code: doc.type }
        });
        if (!configExists) {
          orphanDocs.push(doc);
        }
      }
    }

    if (orphanDocs.length > 0) {
      console.log(`⚠️  ${orphanDocs.length} documenti con tipo non configurato:`);
      orphanDocs.forEach(d => {
        console.log(`   - ${d.displayName} (type: ${d.type})`);
      });
    } else {
      console.log('✅ Tutti i documenti hanno tipi validi o sono già configurati');
    }

    // 4. Suggerimenti
    console.log('\n\n💡 SUGGERIMENTI:');
    console.log('----------------');

    if (categories.length === 0 || docTypes.length === 0) {
      console.log('📌 Le tabelle di configurazione sono vuote!');
      console.log('   Esegui: node scripts/populate-document-configs.js');
    } else if (withoutConfig > 0) {
      console.log('📌 Alcuni documenti non sono collegati ai tipi');
      console.log('   Lo script populate-document-configs.js dovrebbe risolvere');
    } else {
      console.log('✅ Sistema configurato correttamente!');
    }

  } catch (error) {
    console.error('❌ Errore durante la verifica:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
checkDocumentConfigStatus()
  .catch((e) => {
    console.error('Errore fatale:', e);
    process.exit(1);
  });
