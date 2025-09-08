// Script per verificare lo stato delle professioni nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllProfessionals() {
  try {
    console.log('📊 Stato Professioni di TUTTI i Professionisti\n');
    console.log('================================================\n');
    
    // Ottieni tutti i professionisti
    const professionals = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL'
      },
      include: {
        professionData: true
      },
      orderBy: {
        lastName: 'asc'
      }
    });
    
    console.log(`Trovati ${professionals.length} professionisti:\n`);
    
    professionals.forEach((prof, index) => {
      console.log(`${index + 1}. ${prof.firstName} ${prof.lastName}:`);
      console.log(`   ID: ${prof.id}`);
      console.log(`   Email: ${prof.email}`);
      console.log(`   Professione (testo): "${prof.profession || 'nessuna'}"`);
      console.log(`   ProfessionId: ${prof.professionId || 'null'}`);
      console.log(`   Professione tabellata: ${prof.professionData?.name || 'NESSUNA'}`);
      console.log(`   ✅ Tabellata: ${prof.professionId ? 'SI' : 'NO'}`);
      console.log('   ---');
    });
    
    // Statistiche
    const withProfessionId = professionals.filter(p => p.professionId).length;
    const withoutProfessionId = professionals.filter(p => !p.professionId).length;
    
    console.log('\n📈 RIEPILOGO:');
    console.log(`   ✅ Con professione tabellata: ${withProfessionId}`);
    console.log(`   ❌ Senza professione tabellata: ${withoutProfessionId}`);
    console.log(`   📊 Totale: ${professionals.length}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllProfessionals();
