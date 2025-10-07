// Verifica rapida
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const user = await prisma.user.findUnique({
    where: { id: '348ba304-26ff-4c43-9fa7-6ea7b414d67b' },
    include: {
      professionData: true
    }
  });
  
  console.log('=== STATO ATTUALE ===');
  console.log('professionId:', user?.professionId);
  console.log('professionData:', user?.professionData);
  console.log('profession (string):', user?.profession);
  
  if (user?.professionId) {
    // Controlla categorie
    const profCats = await prisma.professionCategory.findMany({
      where: { professionId: user.professionId },
      include: { category: true }
    });
    
    console.log('\nCategorie associate:');
    profCats.forEach(pc => {
      console.log(`- ${pc.category.name}`);
    });
  }
  
  await prisma.$disconnect();
}

check().catch(console.error);
