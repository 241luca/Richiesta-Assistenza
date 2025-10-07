// Script diagnostico
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  console.log('=== DIAGNOSI PROBLEMA PROFESSIONE ===\n');
  
  // 1. Dati del professionista
  console.log('1. PROFESSIONISTA:');
  const user = await prisma.user.findUnique({
    where: { id: '348ba304-26ff-4c43-9fa7-6ea7b414d67b' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profession: true,
      professionId: true
    }
  });
  console.log('- Nome:', user?.firstName, user?.lastName);
  console.log('- profession (campo testo):', user?.profession);
  console.log('- professionId (FK):', user?.professionId);
  
  // 2. Lista professioni disponibili
  console.log('\n2. PROFESSIONI DISPONIBILI:');
  const professions = await prisma.profession.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' }
  });
  
  professions.forEach(p => {
    console.log(`- ${p.name} (ID: ${p.id})`);
  });
  
  // 3. Cerca "Idraulico"
  const idraulico = professions.find(p => 
    p.name.toLowerCase().includes('idraul')
  );
  
  if (idraulico) {
    console.log('\n✅ Trovata professione Idraulico:', idraulico.name);
    console.log('   ID:', idraulico.id);
    
    // 4. Verifica categorie associate
    const profCats = await prisma.professionCategory.findMany({
      where: { professionId: idraulico.id },
      include: { category: true }
    });
    
    console.log('\n3. CATEGORIE ASSOCIATE A', idraulico.name + ':');
    if (profCats.length > 0) {
      profCats.forEach(pc => {
        console.log(`- ${pc.category.name}`);
      });
    } else {
      console.log('❌ Nessuna categoria associata!');
    }
  } else {
    console.log('\n❌ Professione "Idraulico" NON trovata!');
  }
  
  await prisma.$disconnect();
}

diagnose().catch(console.error);
