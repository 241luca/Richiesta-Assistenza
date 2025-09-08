// Script per migrare le professioni dal campo testo al campo tabellato
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateProfessions() {
  try {
    console.log('🔄 Migrazione Professioni da testo a tabella\n');
    console.log('============================================\n');
    
    // 1. Trova tutti i professionisti con professione testo ma senza professionId
    const professionals = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL',
        profession: { not: null },
        professionId: null
      }
    });
    
    console.log(`📊 Trovati ${professionals.length} professionisti da migrare\n`);
    
    if (professionals.length === 0) {
      console.log('✅ Nessun professionista da migrare!');
      return;
    }
    
    // 2. Ottieni tutte le professioni dalla tabella
    const professions = await prisma.profession.findMany();
    const professionMap = new Map();
    
    professions.forEach(p => {
      // Crea una mappa per matching case-insensitive
      professionMap.set(p.name.toLowerCase(), p);
      // Aggiungi anche varianti comuni
      if (p.name === 'Tecnico Climatizzazione') {
        professionMap.set('climatizzazione', p);
        professionMap.set('tecnico condizionamento', p);
      }
      if (p.name === 'Tecnico Elettrodomestici') {
        professionMap.set('elettrodomestici', p);
        professionMap.set('riparatore elettrodomestici', p);
      }
    });
    
    // 3. Migra ogni professionista
    let migrated = 0;
    let notFound = [];
    
    for (const professional of professionals) {
      const professionText = professional.profession?.toLowerCase().trim();
      
      if (professionText) {
        // Cerca corrispondenza esatta o parziale
        let matchedProfession = professionMap.get(professionText);
        
        // Se non trova corrispondenza esatta, prova match parziale
        if (!matchedProfession) {
          for (const [key, value] of professionMap) {
            if (professionText.includes(key) || key.includes(professionText)) {
              matchedProfession = value;
              break;
            }
          }
        }
        
        if (matchedProfession) {
          await prisma.user.update({
            where: { id: professional.id },
            data: { 
              professionId: matchedProfession.id,
              updatedAt: new Date()
            }
          });
          
          console.log(`✅ ${professional.firstName} ${professional.lastName}: "${professional.profession}" → "${matchedProfession.name}"`);
          migrated++;
        } else {
          console.log(`❌ ${professional.firstName} ${professional.lastName}: "${professional.profession}" → NON TROVATA`);
          notFound.push({
            name: `${professional.firstName} ${professional.lastName}`,
            profession: professional.profession
          });
        }
      }
    }
    
    console.log('\n========================================');
    console.log(`✅ Migrati: ${migrated}/${professionals.length}`);
    
    if (notFound.length > 0) {
      console.log(`\n⚠️ Non trovate corrispondenze per:`);
      notFound.forEach(p => {
        console.log(`   - ${p.name}: "${p.profession}"`);
      });
      console.log('\n💡 Suggerimento: Aggiungi queste professioni nella tabella o modifica manualmente');
    }
    
    // 4. Verifica finale
    const remaining = await prisma.user.count({
      where: {
        role: 'PROFESSIONAL',
        profession: { not: null },
        professionId: null
      }
    });
    
    console.log(`\n📊 Professionisti ancora da migrare: ${remaining}`);
    
  } catch (error) {
    console.error('❌ Errore durante la migrazione:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui la migrazione
migrateProfessions();
