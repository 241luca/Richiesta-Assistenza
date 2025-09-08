// Script per verificare le professioni nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfessions() {
  try {
    console.log('🔍 Verifica tabella Professions...\n');
    
    // Conta le professioni
    const count = await prisma.profession.count();
    console.log(`✅ Totale professioni nel database: ${count}\n`);
    
    // Lista le prime 5
    const professions = await prisma.profession.findMany({
      orderBy: { displayOrder: 'asc' },
      take: 5
    });
    
    console.log('📋 Prime 5 professioni:');
    console.log('------------------------');
    professions.forEach(p => {
      console.log(`- ${p.name} (${p.slug}) - Attiva: ${p.isActive ? 'Si' : 'No'}`);
    });
    
    // Verifica se qualche utente ha già una professionId
    const usersWithProfession = await prisma.user.count({
      where: {
        professionId: { not: null }
      }
    });
    
    console.log(`\n👥 Utenti con professionId: ${usersWithProfession}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProfessions();
