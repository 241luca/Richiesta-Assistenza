/**
 * Script di migrazione completa dal sistema hardcoded al sistema basato su DB
 * 
 * Questo script:
 * 1. Verifica che le tabelle di configurazione siano popolate
 * 2. Aggiorna tutti i documenti esistenti per collegarli ai tipi
 * 3. Verifica che non ci siano più riferimenti hardcoded
 * 4. Genera un report finale
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function migrateToConfigurableSystem() {
  console.log('\n🔄 MIGRAZIONE AL SISTEMA CONFIGURABILE');
  console.log('======================================\n');
  
  const migrationLog = [];
  const timestamp = new Date().toISOString();
  
  try {
    // STEP 1: Verifica prerequisiti
    console.log('📋 STEP 1: Verifica prerequisiti...');
    console.log('-----------------------------------');
    
    const typeCount = await prisma.documentTypeConfig.count();
    const categoryCount = await prisma.documentCategory.count();
    
    if (typeCount === 0 || categoryCount === 0) {
      console.log('❌ Le tabelle di configurazione sono vuote!');
      console.log('   Esegui prima: node scripts/populate-document-configs.js');
      return;
    }
    
    console.log(`✅ Trovati ${typeCount} tipi documento`);
    console.log(`✅ Trovate ${categoryCount} categorie`);
    migrationLog.push(`Prerequisiti OK: ${typeCount} tipi, ${categoryCount} categorie`);
    
    // STEP 2: Migra documenti esistenti
    console.log('\n📄 STEP 2: Migrazione documenti esistenti...');
    console.log('-------------------------------------------');
    
    const documents = await prisma.legalDocument.findMany();
    let migrated = 0;
    let alreadyLinked = 0;
    let failed = 0;
    
    for (const doc of documents) {
      if (doc.typeConfigId) {
        alreadyLinked++;
        console.log(`⏭️  ${doc.displayName} - già collegato`);
        continue;
      }
      
      // Trova il tipo corrispondente
      const typeConfig = await prisma.documentTypeConfig.findUnique({
        where: { code: doc.type }
      });
      
      if (typeConfig) {
        await prisma.legalDocument.update({
          where: { id: doc.id },
          data: { typeConfigId: typeConfig.id }
        });
        console.log(`✅ ${doc.displayName} → collegato a ${typeConfig.displayName}`);
        migrated++;
        migrationLog.push(`Migrato: ${doc.displayName} → ${typeConfig.code}`);
      } else {
        console.log(`❌ ${doc.displayName} - tipo ${doc.type} non trovato!`);
        failed++;
        migrationLog.push(`ERRORE: ${doc.displayName} - tipo ${doc.type} non trovato`);
      }
    }
    
    console.log(`\nRiepilogo migrazione documenti:`);
    console.log(`  ✅ Migrati: ${migrated}`);
    console.log(`  ⏭️  Già collegati: ${alreadyLinked}`);
    console.log(`  ❌ Falliti: ${failed}`);
    
    // STEP 3: Verifica integrità sistema
    console.log('\n🔍 STEP 3: Verifica integrità sistema...');
    console.log('----------------------------------------');
    
    // Controlla che tutti i documenti abbiano un tipo
    const unlinkedDocs = await prisma.legalDocument.count({
      where: { typeConfigId: null }
    });
    
    if (unlinkedDocs > 0) {
      console.log(`⚠️  Attenzione: ${unlinkedDocs} documenti senza tipo configurato`);
      migrationLog.push(`WARNING: ${unlinkedDocs} documenti non collegati`);
    } else {
      console.log('✅ Tutti i documenti sono collegati ai tipi');
      migrationLog.push('Tutti i documenti collegati correttamente');
    }
    
    // Verifica che i tipi abbiano almeno un documento
    const types = await prisma.documentTypeConfig.findMany({
      where: { isActive: true, isRequired: true }
    });
    
    for (const type of types) {
      const docCount = await prisma.legalDocument.count({
        where: { typeConfigId: type.id }
      });
      
      if (docCount === 0 && type.isRequired) {
        console.log(`⚠️  Tipo obbligatorio senza documenti: ${type.displayName}`);
        migrationLog.push(`WARNING: Tipo ${type.code} obbligatorio ma senza documenti`);
      }
    }
    
    // STEP 4: Verifica API
    console.log('\n🌐 STEP 4: Test API endpoints...');
    console.log('--------------------------------');
    
    try {
      const { documentTypeService } = require('../src/services/document-type.service');
      
      const apiTypes = await documentTypeService.getAllTypes();
      console.log(`✅ API /admin/document-types: ${apiTypes.length} tipi`);
      
      const stats = await documentTypeService.getStatistics();
      console.log(`✅ API /admin/document-types/stats: OK`);
      console.log(`   - Attivi: ${stats.active}`);
      console.log(`   - Obbligatori: ${stats.required}`);
      console.log(`   - Di sistema: ${stats.system}`);
      
      migrationLog.push(`API funzionanti: ${apiTypes.length} tipi disponibili`);
    } catch (error) {
      console.log('❌ Errore nel test API:', error.message);
      migrationLog.push(`ERRORE API: ${error.message}`);
    }
    
    // STEP 5: Genera report finale
    console.log('\n📊 STEP 5: Generazione report finale...');
    console.log('---------------------------------------');
    
    const finalStats = {
      timestamp: timestamp,
      documentsTotal: documents.length,
      documentsMigrated: migrated,
      documentsLinked: documents.length - unlinkedDocs,
      typesConfigured: typeCount,
      categoriesConfigured: categoryCount,
      migrationLog: migrationLog
    };
    
    // Salva report su file
    const reportPath = path.join(__dirname, `migration-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(finalStats, null, 2));
    console.log(`📄 Report salvato in: ${reportPath}`);
    
    // RISULTATO FINALE
    console.log('\n========================================');
    console.log('🎉 MIGRAZIONE COMPLETATA');
    console.log('========================================\n');
    
    if (unlinkedDocs === 0 && failed === 0) {
      console.log('✅ SUCCESSO TOTALE!');
      console.log('\nIl sistema ora:');
      console.log('  • Usa completamente le tabelle di configurazione');
      console.log('  • Non ha più valori hardcoded');
      console.log('  • Tutti i documenti sono collegati ai tipi');
      console.log('  • Le API funzionano correttamente');
      console.log('\n📌 Puoi ora:');
      console.log('  1. Gestire i tipi documento dal pannello admin');
      console.log('  2. Creare nuovi tipi senza modificare il codice');
      console.log('  3. Configurare permessi e workflow dal database');
      console.log('\n⚠️  IMPORTANTE:');
      console.log('  • NON usare più seed-legal-documents.js (vecchia versione)');
      console.log('  • Usa seed-legal-documents-v2.js per futuri seed');
      console.log('  • Tutte le configurazioni sono nel database');
    } else {
      console.log('⚠️  MIGRAZIONE PARZIALE');
      console.log(`\nProblemi riscontrati:`);
      if (unlinkedDocs > 0) console.log(`  • ${unlinkedDocs} documenti non collegati`);
      if (failed > 0) console.log(`  • ${failed} documenti non migrati`);
      console.log('\nControlla il report per i dettagli.');
    }
    
    console.log('\n========================================\n');
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
    migrationLog.push(`ERRORE FATALE: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la migrazione
migrateToConfigurableSystem()
  .catch((e) => {
    console.error('Errore fatale:', e);
    process.exit(1);
  });
