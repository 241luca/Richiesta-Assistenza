/**
 * Script finale di verifica e fix sistema documenti
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function finalCheckAndFix() {
  console.log('\n🔧 VERIFICA FINALE E FIX AUTOMATICI');
  console.log('====================================\n');
  
  try {
    let fixesApplied = 0;
    
    // 1. Verifica se le tabelle sono popolate
    console.log('📋 Controllo popolamento tabelle...');
    
    const counts = {
      categories: await prisma.documentCategory.count(),
      types: await prisma.documentTypeConfig.count(),
      configs: await prisma.documentSystemConfig.count(),
      permissions: await prisma.documentPermission.count(),
      workflows: await prisma.approvalWorkflowConfig.count()
    };
    
    console.log(`  Categorie: ${counts.categories}`);
    console.log(`  Tipi: ${counts.types}`);
    console.log(`  Config: ${counts.configs}`);
    console.log(`  Permessi: ${counts.permissions}`);
    console.log(`  Workflow: ${counts.workflows}`);
    
    // Se manca qualcosa, suggerisci di eseguire lo script di popolamento
    if (Object.values(counts).some(v => v === 0)) {
      console.log('\n⚠️  Alcune tabelle sono vuote!');
      console.log('   Esegui: node scripts/populate-document-configs.js');
      return;
    }
    
    console.log('\n✅ Tutte le tabelle sono popolate');
    
    // 2. Fix documenti non collegati
    console.log('\n🔗 Verifica collegamenti documenti...');
    
    const unlinkedDocs = await prisma.legalDocument.findMany({
      where: { typeConfigId: null }
    });
    
    if (unlinkedDocs.length > 0) {
      console.log(`  ⚠️  ${unlinkedDocs.length} documenti non collegati. Applico fix...`);
      
      for (const doc of unlinkedDocs) {
        const typeConfig = await prisma.documentTypeConfig.findUnique({
          where: { code: doc.type }
        });
        
        if (typeConfig) {
          await prisma.legalDocument.update({
            where: { id: doc.id },
            data: { typeConfigId: typeConfig.id }
          });
          console.log(`  ✅ Collegato: ${doc.displayName}`);
          fixesApplied++;
        }
      }
    } else {
      console.log('  ✅ Tutti i documenti sono collegati');
    }
    
    // 3. Verifica integrità relazioni
    console.log('\n🔍 Verifica integrità relazioni...');
    
    const docsWithConfig = await prisma.legalDocument.findMany({
      where: { 
        typeConfigId: { not: null }
      },
      include: {
        typeConfig: true
      }
    });
    
    let brokenRelations = 0;
    for (const doc of docsWithConfig) {
      if (!doc.typeConfig) {
        console.log(`  ⚠️  Relazione rotta per: ${doc.displayName}`);
        brokenRelations++;
      }
    }
    
    if (brokenRelations === 0) {
      console.log('  ✅ Tutte le relazioni sono valide');
    } else {
      console.log(`  ❌ ${brokenRelations} relazioni da sistemare manualmente`);
    }
    
    // 4. Test query service
    console.log('\n🧪 Test query dal service...');
    
    try {
      // Importa il service
      const { documentTypeService } = require('../src/services/document-type.service');
      
      const types = await documentTypeService.getAllTypes();
      console.log(`  ✅ Service restituisce ${types.length} tipi`);
      
      const stats = await documentTypeService.getStatistics();
      console.log(`  ✅ Statistiche funzionanti (totale: ${stats.total})`);
      
    } catch (error) {
      console.log('  ❌ Errore nel service:', error.message);
    }
    
    // RIEPILOGO
    console.log('\n\n====================================');
    console.log('📊 RIEPILOGO FINALE');
    console.log('====================================');
    
    if (fixesApplied > 0) {
      console.log(`\n✅ Applicati ${fixesApplied} fix automatici`);
    }
    
    // Stato finale
    const finalStats = await prisma.legalDocument.groupBy({
      by: ['typeConfigId'],
      _count: true
    });
    
    const configured = finalStats.filter(s => s.typeConfigId !== null).reduce((sum, s) => sum + s._count, 0);
    const notConfigured = finalStats.filter(s => s.typeConfigId === null).reduce((sum, s) => sum + s._count, 0);
    
    console.log('\n📈 STATO DOCUMENTI:');
    console.log(`  ✅ Configurati: ${configured}`);
    console.log(`  ❌ Non configurati: ${notConfigured}`);
    
    if (notConfigured === 0) {
      console.log('\n🎉 SISTEMA COMPLETAMENTE CONFIGURATO!');
      console.log('\nIl sistema gestione documenti è pronto per l\'uso.');
      console.log('Ora i documenti possono essere gestiti dal database');
      console.log('invece che da valori hardcoded nel codice.\n');
      
      console.log('📌 PROSSIMI PASSI:');
      console.log('  1. Testa l\'interfaccia admin: http://localhost:5193/admin');
      console.log('  2. Verifica che i documenti esistenti funzionino');
      console.log('  3. Prova a creare un nuovo tipo documento');
      console.log('  4. Testa i permessi con utenti diversi');
    } else {
      console.log('\n⚠️  Sistema parzialmente configurato');
      console.log('   Alcuni documenti necessitano intervento manuale');
    }
    
    console.log('\n====================================\n');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

finalCheckAndFix();
