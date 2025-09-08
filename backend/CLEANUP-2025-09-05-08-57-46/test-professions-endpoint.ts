// Test endpoint professioni
import { prisma } from './config/database';

async function testProfessions() {
  try {
    console.log('🔍 Test Professioni\n');
    
    // 1. Verifica se la tabella esiste
    const count = await prisma.profession.count();
    console.log(`✅ Tabella Profession esiste con ${count} record\n`);
    
    // 2. Lista le professioni
    const professions = await prisma.profession.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      take: 5
    });
    
    console.log('📋 Prime 5 professioni attive:');
    professions.forEach(p => {
      console.log(`  - ${p.name} (${p.slug})`);
    });
    
    // 3. Test un professionista
    const professional = await prisma.user.findFirst({
      where: { role: 'PROFESSIONAL' },
      include: { professionData: true }
    });
    
    if (professional) {
      console.log(`\n👤 Professionista esempio: ${professional.firstName} ${professional.lastName}`);
      console.log(`   Professione campo testo: ${professional.profession || 'nessuna'}`);
      console.log(`   Professione tabellata: ${professional.professionData?.name || 'nessuna'}`);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfessions();
