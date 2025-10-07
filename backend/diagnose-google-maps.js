const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function diagnoseAndFix() {
  console.log('\n🔧 DIAGNOSI E FIX GOOGLE MAPS API KEY\n');
  console.log('='.repeat(60));
  
  try {
    // 1. DIAGNOSI COMPLETA
    console.log('\n1️⃣ DIAGNOSI STATO ATTUALE:\n');
    
    // Cerca con findUnique (come fa il backend)
    console.log('   Test findUnique({ service: "GOOGLE_MAPS" }):');
    const uniqueResult = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });
    
    if (uniqueResult) {
      console.log('   ✅ TROVATA con findUnique!');
      console.log('      ID:', uniqueResult.id);
      console.log('      Name:', uniqueResult.name);
      console.log('      Key (primi 20):', uniqueResult.key?.substring(0, 20));
      console.log('      isActive:', uniqueResult.isActive);
      
      if (uniqueResult.isActive) {
        console.log('\n✅ LA CHIAVE È CORRETTA E ATTIVA!');
        console.log('   Il backend DOVREBBE trovarla.');
        console.log('\n💡 PROBLEMA: Probabilmente il backend ha una connessione Prisma vecchia.');
        console.log('   SOLUZIONE: Riavvia il backend con: npm run dev');
      } else {
        console.log('\n⚠️  LA CHIAVE ESISTE MA NON È ATTIVA!');
        console.log('   Attivazione in corso...');
        
        await prisma.apiKey.update({
          where: { id: uniqueResult.id },
          data: { isActive: true }
        });
        
        console.log('   ✅ Chiave attivata!');
      }
      
      return;
    }
    
    console.log('   ❌ NON TROVATA con findUnique');
    
    // Cerca tutte le chiavi simili
    console.log('\n   Cercando chiavi simili nel database...');
    const allKeys = await prisma.apiKey.findMany({
      where: {
        OR: [
          { name: { contains: 'Google', mode: 'insensitive' } },
          { name: { contains: 'Maps', mode: 'insensitive' } },
          { service: { contains: 'google', mode: 'insensitive' } },
          { service: { contains: 'maps', mode: 'insensitive' } }
        ]
      }
    });
    
    console.log(`   Trovate ${allKeys.length} chiavi simili:`);
    allKeys.forEach((k, i) => {
      console.log(`      ${i+1}. service="${k.service}" name="${k.name}" active=${k.isActive}`);
    });
    
    // 2. VERIFICA CONSTRAINT UNIQUE
    console.log('\n2️⃣ VERIFICA CONSTRAINT UNIQUE SU SERVICE:\n');
    
    const allApiKeys = await prisma.apiKey.findMany({
      select: { id: true, service: true, name: true }
    });
    
    const serviceCounts = {};
    allApiKeys.forEach(k => {
      serviceCounts[k.service] = (serviceCounts[k.service] || 0) + 1;
    });
    
    const duplicates = Object.entries(serviceCounts).filter(([_, count]) => count > 1);
    
    if (duplicates.length > 0) {
      console.log('   ⚠️  TROVATI DUPLICATI (violano UNIQUE constraint):');
      duplicates.forEach(([service, count]) => {
        console.log(`      - service="${service}": ${count} righe`);
      });
      console.log('\n   💡 Questo è un PROBLEMA! Il campo service deve essere UNIQUE.');
    } else {
      console.log('   ✅ Nessun duplicato trovato. Constraint UNIQUE rispettato.');
    }
    
    // 3. PROPOSTA SOLUZIONE
    console.log('\n3️⃣ PROPOSTA SOLUZIONE:\n');
    
    if (allKeys.length > 0) {
      const googleKey = allKeys[0];
      console.log('   📝 Trovata chiave Google Maps esistente:');
      console.log('      service attuale:', `"${googleKey.service}"`);
      console.log('      name:', googleKey.name);
      
      if (googleKey.service !== 'GOOGLE_MAPS') {
        console.log('\n   🔧 FIXING: Aggiorno service a "GOOGLE_MAPS"...');
        
        await prisma.apiKey.update({
          where: { id: googleKey.id },
          data: { 
            service: 'GOOGLE_MAPS',
            isActive: true
          }
        });
        
        console.log('   ✅ Chiave aggiornata!');
        console.log('      service nuovo: "GOOGLE_MAPS"');
        console.log('      isActive: true');
      }
    } else {
      console.log('   ❌ NESSUNA chiave Google Maps trovata!');
      console.log('\n   💡 AZIONE RICHIESTA:');
      console.log('      1. Vai su Prisma Studio: npx prisma studio');
      console.log('      2. Apri tabella ApiKey');
      console.log('      3. Clicca "Add record"');
      console.log('      4. Compila:');
      console.log('         - id: genera con uuid');
      console.log('         - key: LA_TUA_CHIAVE_GOOGLE_MAPS');
      console.log('         - name: "Google Maps API Key"');
      console.log('         - service: "GOOGLE_MAPS"');
      console.log('         - isActive: true');
    }
    
    // 4. TEST FINALE
    console.log('\n4️⃣ TEST FINALE:\n');
    const finalCheck = await prisma.apiKey.findUnique({
      where: { service: 'GOOGLE_MAPS' }
    });
    
    if (finalCheck && finalCheck.isActive) {
      console.log('   ✅ SUCCESSO! Chiave trovata e attiva!');
      console.log('\n' + '='.repeat(60));
      console.log('✅ SISTEMA PRONTO!');
      console.log('   Ora riavvia il backend: npm run dev');
      console.log('='.repeat(60));
    } else {
      console.log('   ⚠️  Chiave ancora non trovata.');
      console.log('   Segui le istruzioni sopra per crearla.');
    }
    
  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    if (error.code === 'P2002') {
      console.log('\n💡 Errore UNIQUE constraint violation.');
      console.log('   Ci sono duplicati nel database da rimuovere.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

diagnoseAndFix();
