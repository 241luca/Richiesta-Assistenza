// Script di test per verificare i dati del professionista
const { prisma } = require('./src/config/database');

async function checkProfessional() {
  const professionalId = '348ba304-26ff-4c43-9fa7-6ea7b414d67b';
  
  console.log('=== VERIFICA DATI PROFESSIONISTA ===\n');
  
  // 1. Verifica i dati base del professionista
  const user = await prisma.user.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      role: true,
      profession: true,  // Campo stringa
      professionId: true, // Riferimento alla tabella Profession
      professionData: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
  
  console.log('Dati utente:');
  console.log('- ID:', user.id);
  console.log('- Nome:', user.firstName, user.lastName);
  console.log('- Ruolo:', user.role);
  console.log('- profession (stringa):', user.profession);
  console.log('- professionId (FK):', user.professionId);
  console.log('- professionData:', user.professionData);
  console.log('\n');
  
  // 2. Se ha un professionId, verifica le categorie associate
  if (user.professionId) {
    const professionCategories = await prisma.professionCategory.findMany({
      where: { 
        professionId: user.professionId,
        isActive: true
      },
      include: {
        category: true,
        profession: true
      }
    });
    
    console.log('Categorie associate alla professione:');
    professionCategories.forEach(pc => {
      console.log(`- ${pc.category.name} (${pc.profession.name})`);
    });
  } else {
    console.log('⚠️  Il professionista NON ha un professionId assegnato!');
    console.log('   Deve essere assegnata una professione dalla tabella Profession');
  }
  
  // 3. Verifica se esiste una professione "Idraulico"
  const idraulico = await prisma.profession.findFirst({
    where: { 
      OR: [
        { name: 'Idraulico' },
        { name: { contains: 'idraul', mode: 'insensitive' } }
      ]
    }
  });
  
  if (idraulico) {
    console.log('\n✅ Trovata professione Idraulico:');
    console.log('   ID:', idraulico.id);
    console.log('   Nome:', idraulico.name);
    
    // Se il professionista non ha questa professione, suggeriamo di assegnarla
    if (user.professionId !== idraulico.id) {
      console.log('\n📝 Per assegnare questa professione al professionista:');
      console.log(`   UPDATE "User" SET "professionId" = '${idraulico.id}' WHERE id = '${professionalId}';`);
    }
  } else {
    console.log('\n⚠️  Non esiste una professione "Idraulico" nella tabella Profession');
  }
  
  await prisma.$disconnect();
}

checkProfessional().catch(console.error);
