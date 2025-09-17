// Script di test per verificare i dati del professionista
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkProfessionalData() {
  const professionalId = '348ba304-26ff-4c43-9fa7-6ea7b414d67b';
  
  console.log('=== VERIFICA DATI PROFESSIONISTA ===\n');
  
  // 1. Verifica i dati del professionista
  const user = await prisma.user.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      profession: true,        // Campo stringa
      professionId: true,      // FK alla tabella Profession
      professionData: true     // Relazione con la tabella Profession
    }
  });
  
  console.log('Dati utente:');
  console.log('- profession (stringa):', user?.profession);
  console.log('- professionId (FK):', user?.professionId);
  console.log('- professionData:', user?.professionData);
  console.log('\n');
  
  // 2. Trova la professione "Idraulico"
  const idraulicoProfession = await prisma.profession.findFirst({
    where: { 
      OR: [
        { name: 'Idraulico' },
        { name: { contains: 'idraul', mode: 'insensitive' } }
      ]
    }
  });
  
  console.log('Professione Idraulico nel database:');
  console.log(idraulicoProfession);
  console.log('\n');
  
  // 3. Se non c'è professionId ma c'è la professione Idraulico, aggiorniamo
  if (!user?.professionId && idraulicoProfession) {
    console.log('Aggiorno il professionId...');
    const updated = await prisma.user.update({
      where: { id: professionalId },
      data: { professionId: idraulicoProfession.id }
    });
    console.log('Utente aggiornato con professionId:', updated.professionId);
  }
  
  // 4. Verifica le categorie associate alla professione
  if (idraulicoProfession) {
    const professionCategories = await prisma.professionCategory.findMany({
      where: { professionId: idraulicoProfession.id },
      include: { category: true }
    });
    
    console.log('\nCategorie associate alla professione Idraulico:');
    professionCategories.forEach(pc => {
      console.log(`- ${pc.category.name}`);
    });
  }
  
  // 5. Verifica tutte le professioni disponibili
  const allProfessions = await prisma.profession.findMany({
    where: { isActive: true }
  });
  
  console.log('\nTutte le professioni disponibili:');
  allProfessions.forEach(p => {
    console.log(`- ${p.name} (ID: ${p.id})`);
  });
  
  await prisma.$disconnect();
}

checkProfessionalData().catch(console.error);
