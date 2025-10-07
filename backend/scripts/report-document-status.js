/**
 * Report completo stato sistema documenti
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function generateReport() {
  console.log('\n========================================');
  console.log('📊 REPORT SISTEMA GESTIONE DOCUMENTI');
  console.log('========================================');
  console.log(`📅 Data: ${new Date().toLocaleString('it-IT')}`);
  console.log('========================================\n');

  try {
    // 1. CATEGORIE
    console.log('📂 CATEGORIE DOCUMENTO');
    console.log('----------------------');
    const categories = await prisma.documentCategory.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    if (categories.length > 0) {
      console.log(`✅ ${categories.length} categorie trovate:\n`);
      categories.forEach(cat => {
        console.log(`   ${cat.isActive ? '✅' : '❌'} ${cat.name} (${cat.code})`);
        console.log(`      📝 ${cat.description || 'Nessuna descrizione'}`);
      });
    } else {
      console.log('⚠️  Nessuna categoria trovata');
    }

    // 2. TIPI DOCUMENTO
    console.log('\n\n📋 TIPI DI DOCUMENTO');
    console.log('--------------------');
    const types = await prisma.documentTypeConfig.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    if (types.length > 0) {
      console.log(`✅ ${types.length} tipi documento trovati:\n`);
      types.forEach(type => {
        console.log(`   ${type.isActive ? '✅' : '❌'} ${type.displayName}`);
        console.log(`      📌 Codice: ${type.code}`);
        console.log(`      📂 Categoria: ${type.category || 'Non categorizzato'}`);
        console.log(`      ${type.isRequired ? '⚠️ OBBLIGATORIO' : '📄 Opzionale'}`);
        console.log(`      ${type.requiresApproval ? '✔️ Richiede approvazione' : '➖ Non richiede approvazione'}`);
        console.log(`      ${type.requiresSignature ? '✍️ Richiede firma' : '➖ Non richiede firma'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Nessun tipo documento trovato');
    }

    // 3. DOCUMENTI ESISTENTI
    console.log('\n📄 DOCUMENTI NEL SISTEMA');
    console.log('------------------------');
    const docs = await prisma.legalDocument.findMany({
      include: {
        typeConfig: true,
        versions: {
          where: { status: 'PUBLISHED' },
          take: 1
        }
      }
    });
    
    console.log(`📊 Totale documenti: ${docs.length}`);
    
    const connected = docs.filter(d => d.typeConfigId !== null);
    const notConnected = docs.filter(d => d.typeConfigId === null);
    
    console.log(`   ✅ Collegati a tipo: ${connected.length}`);
    console.log(`   ⚠️  Non collegati: ${notConnected.length}`);
    
    if (docs.length > 0) {
      console.log('\nDettaglio documenti:');
      docs.forEach(doc => {
        console.log(`\n   📄 ${doc.displayName}`);
        console.log(`      Type: ${doc.type}`);
        console.log(`      Config: ${doc.typeConfig ? doc.typeConfig.displayName : '❌ NON COLLEGATO'}`);
        console.log(`      Versioni pubblicate: ${doc.versions.length}`);
        console.log(`      Attivo: ${doc.isActive ? '✅' : '❌'}`);
      });
    }

    // 4. CONFIGURAZIONI SISTEMA
    console.log('\n\n⚙️  CONFIGURAZIONI SISTEMA');
    console.log('-------------------------');
    const configs = await prisma.documentSystemConfig.findMany({
      orderBy: { category: 'asc' }
    });
    
    if (configs.length > 0) {
      console.log(`✅ ${configs.length} configurazioni trovate:\n`);
      
      // Raggruppa per categoria
      const byCategory = {};
      configs.forEach(cfg => {
        if (!byCategory[cfg.category]) {
          byCategory[cfg.category] = [];
        }
        byCategory[cfg.category].push(cfg);
      });
      
      Object.keys(byCategory).forEach(cat => {
        console.log(`\n   📁 ${cat.toUpperCase()}`);
        byCategory[cat].forEach(cfg => {
          const value = typeof cfg.value === 'object' ? JSON.stringify(cfg.value) : cfg.value;
          console.log(`      • ${cfg.key} = ${value}`);
        });
      });
    } else {
      console.log('⚠️  Nessuna configurazione trovata');
    }

    // 5. PERMESSI
    console.log('\n\n🔐 PERMESSI RUOLI');
    console.log('-----------------');
    const permissions = await prisma.documentPermission.findMany({
      orderBy: { role: 'asc' }
    });
    
    if (permissions.length > 0) {
      console.log(`✅ ${permissions.length} set di permessi trovati:\n`);
      permissions.forEach(perm => {
        console.log(`   👤 ${perm.role} ${perm.documentType ? `(per ${perm.documentType})` : '(tutti i documenti)'}`);
        const perms = [];
        if (perm.canCreate) perms.push('Creare');
        if (perm.canRead) perms.push('Leggere');
        if (perm.canUpdate) perms.push('Modificare');
        if (perm.canDelete) perms.push('Eliminare');
        if (perm.canApprove) perms.push('Approvare');
        if (perm.canPublish) perms.push('Pubblicare');
        console.log(`      Può: ${perms.join(', ')}`);
      });
    } else {
      console.log('⚠️  Nessun permesso configurato');
    }

    // 6. WORKFLOW
    console.log('\n\n📊 WORKFLOW APPROVAZIONE');
    console.log('------------------------');
    const workflows = await prisma.approvalWorkflowConfig.findMany();
    
    if (workflows.length > 0) {
      console.log(`✅ ${workflows.length} workflow trovati:\n`);
      workflows.forEach(wf => {
        console.log(`   ${wf.isActive ? '✅' : '❌'} ${wf.name} ${wf.isDefault ? '⭐ (DEFAULT)' : ''}`);
        console.log(`      📝 ${wf.description || 'Nessuna descrizione'}`);
        if (wf.steps) {
          console.log('      Steps:');
          const steps = typeof wf.steps === 'string' ? JSON.parse(wf.steps) : wf.steps;
          steps.forEach(step => {
            console.log(`         ${step.order}. ${step.name} (${step.status})`);
          });
        }
      });
    } else {
      console.log('⚠️  Nessun workflow configurato');
    }

    // RIEPILOGO FINALE
    console.log('\n\n========================================');
    console.log('📈 RIEPILOGO STATO SISTEMA');
    console.log('========================================');
    
    const status = {
      categories: categories.length > 0,
      types: types.length > 0,
      configs: configs.length > 0,
      permissions: permissions.length > 0,
      workflows: workflows.length > 0,
      docsConnected: notConnected.length === 0
    };
    
    const allOk = Object.values(status).every(v => v === true);
    
    if (allOk) {
      console.log('✅ SISTEMA COMPLETAMENTE CONFIGURATO!');
      console.log('\nTutti i componenti sono stati popolati correttamente.');
      console.log('Il sistema è pronto per l\'uso.\n');
    } else {
      console.log('⚠️  CONFIGURAZIONE PARZIALE\n');
      console.log('Componenti da configurare:');
      if (!status.categories) console.log('   ❌ Categorie documenti');
      if (!status.types) console.log('   ❌ Tipi documento');
      if (!status.configs) console.log('   ❌ Configurazioni sistema');
      if (!status.permissions) console.log('   ❌ Permessi ruoli');
      if (!status.workflows) console.log('   ❌ Workflow approvazione');
      if (!status.docsConnected) console.log('   ⚠️  Alcuni documenti non collegati ai tipi');
    }
    
    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateReport();
