import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixTermsVersion() {
  console.log('🔧 Correzione versione 1.0.1 Termini di Utilizzo...\n');

  try {
    // Trova il documento "Termini di Utilizzo"
    const termsDocument = await prisma.legalDocument.findFirst({
      where: {
        type: 'TERMS_SERVICE',
        OR: [
          { internalName: { contains: 'termini' } },
          { displayName: { contains: 'Termini' } }
        ]
      }
    });

    if (!termsDocument) {
      console.log('❌ Documento Termini di Utilizzo non trovato');
      return;
    }

    console.log(`✅ Documento trovato: ${termsDocument.displayName}`);
    console.log(`   ID: ${termsDocument.id}`);

    // Carica le versioni del documento
    const versions = await prisma.legalDocumentVersion.findMany({
      where: { documentId: termsDocument.id },
      orderBy: { version: 'asc' }
    });

    console.log(`   Versioni totali: ${versions.length}\n`);

    // Trova la versione 1.0.0 (quella corretta con contenuto completo)
    const version100 = versions.find(v => v.version === '1.0.0');
    
    if (!version100) {
      console.log('❌ Versione 1.0.0 non trovata');
      return;
    }

    console.log(`✅ Versione 1.0.0 trovata:`);
    console.log(`   ID: ${version100.id}`);
    console.log(`   Titolo: ${version100.title}`);
    console.log(`   Contenuto: ${Math.round(version100.content.length / 1024)} KB`);
    console.log(`   Data: ${version100.createdAt}\n`);

    // Trova la versione 1.0.1 (quella con contenuto hardcoded da correggere)
    const version101 = versions.find(v => v.version === '1.0.1');
    
    if (!version101) {
      console.log('❌ Versione 1.0.1 non trovata - nessuna correzione necessaria');
      return;
    }

    console.log(`⚠️  Versione 1.0.1 trovata (da correggere):`);
    console.log(`   ID: ${version101.id}`);
    console.log(`   Titolo: ${version101.title}`);
    console.log(`   Contenuto attuale: ${Math.round(version101.content.length / 1024)} KB`);
    console.log(`   Data: ${version101.createdAt}\n`);

    // Conferma che il contenuto della 1.0.1 è molto più piccolo (hardcoded)
    if (version101.content.length > version100.content.length * 0.8) {
      console.log('ℹ️  La versione 1.0.1 sembra già avere contenuto completo');
      console.log('   Vuoi comunque sovrascriverla? (continuo comunque)');
    }

    // Aggiorna la versione 1.0.1 con il contenuto della 1.0.0
    console.log('\n🔄 Aggiornamento versione 1.0.1...');
    
    // Genera contentPlain dal content HTML
    const div = { textContent: version100.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() };
    
    const updated = await prisma.legalDocumentVersion.update({
      where: { id: version101.id },
      data: {
        content: version100.content,
        contentPlain: div.textContent,
        // Mantieni gli altri campi come sono
        updatedAt: new Date()
      }
    });

    console.log(`\n✅ Versione 1.0.1 aggiornata con successo!`);
    console.log(`   Contenuto nuovo: ${Math.round(updated.content.length / 1024)} KB`);
    console.log(`   Content Plain: ${Math.round((updated.contentPlain?.length || 0) / 1024)} KB`);

    // Verifica finale
    console.log('\n📊 Verifica finale:');
    console.log(`   Versione 1.0.0: ${Math.round(version100.content.length / 1024)} KB`);
    console.log(`   Versione 1.0.1: ${Math.round(updated.content.length / 1024)} KB`);
    
    if (updated.content.length === version100.content.length) {
      console.log('\n✅ Contenuti identici - Correzione completata con successo! 🎉');
    } else {
      console.log('\n⚠️  I contenuti hanno lunghezze diverse - verifica manuale consigliata');
    }

  } catch (error) {
    console.error('❌ Errore durante la correzione:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
fixTermsVersion()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
