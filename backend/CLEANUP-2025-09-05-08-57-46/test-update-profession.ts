// Test update professione
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUpdateProfession() {
  try {
    console.log('🔍 Test Update Professione\n');
    
    // 1. Trova un professionista
    const professional = await prisma.user.findFirst({
      where: { role: 'PROFESSIONAL' },
      include: { professionData: true }
    });
    
    if (!professional) {
      console.log('❌ Nessun professionista trovato');
      return;
    }
    
    console.log(`👤 Professionista: ${professional.firstName} ${professional.lastName}`);
    console.log(`   ID: ${professional.id}`);
    console.log(`   Professione campo testo: ${professional.profession || 'nessuna'}`);
    console.log(`   Professione tabellata: ${professional.professionData?.name || 'nessuna'}`);
    console.log(`   ProfessionId: ${professional.professionId || 'null'}\n`);
    
    // 2. Trova una professione da assegnare
    const profession = await prisma.profession.findFirst({
      where: { isActive: true }
    });
    
    if (!profession) {
      console.log('❌ Nessuna professione trovata');
      return;
    }
    
    console.log(`📋 Assegnando professione: ${profession.name} (ID: ${profession.id})\n`);
    
    // 3. Aggiorna il professionista
    const updated = await prisma.user.update({
      where: { id: professional.id },
      data: { 
        professionId: profession.id,
        updatedAt: new Date()
      },
      include: { professionData: true }
    });
    
    console.log('✅ Aggiornamento completato!');
    console.log(`   Nuova professione: ${updated.professionData?.name}`);
    console.log(`   ProfessionId: ${updated.professionId}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdateProfession();
