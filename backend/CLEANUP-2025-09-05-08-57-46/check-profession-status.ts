// Script per verificare lo stato delle professioni nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfessionStatus() {
  try {
    console.log('📊 Stato Professioni nel Database\n');
    console.log('=====================================\n');
    
    // Cerca il professionista Paolo Costa che stavamo testando
    const paolo = await prisma.user.findFirst({
      where: {
        firstName: 'Paolo',
        lastName: 'Costa'
      },
      include: {
        professionData: true
      }
    });
    
    if (paolo) {
      console.log('👤 Paolo Costa:');
      console.log(`   ID: ${paolo.id}`);
      console.log(`   Campo profession (testo): "${paolo.profession || 'null'}"`);
      console.log(`   Campo professionId: ${paolo.professionId || 'null'}`);
      console.log(`   Professione tabellata: ${paolo.professionData?.name || 'NESSUNA'}`);
      console.log(`   Ultimo aggiornamento: ${paolo.updatedAt}`);
      console.log('');
    }
    
    // Conta quanti professionisti hanno professionId
    const withProfessionId = await prisma.user.count({
      where: {
        role: 'PROFESSIONAL',
        professionId: { not: null }
      }
    });
    
    const totalProfessionals = await prisma.user.count({
      where: {
        role: 'PROFESSIONAL'
      }
    });
    
    console.log(`📈 Statistiche:`);
    console.log(`   Professionisti totali: ${totalProfessionals}`);
    console.log(`   Con professione tabellata: ${withProfessionId}`);
    console.log(`   Senza professione tabellata: ${totalProfessionals - withProfessionId}`);
    
    // Mostra le professioni disponibili
    console.log('\n📋 Professioni disponibili nella tabella:');
    const professions = await prisma.profession.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' }
    });
    
    professions.forEach(p => {
      console.log(`   - ${p.name} (ID: ${p.id})`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfessionStatus();
