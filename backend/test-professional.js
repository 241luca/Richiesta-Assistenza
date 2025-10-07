// Script di test per verificare i dati del professionista
const { prisma } = require('./src/config/database');

async function checkProfessionalData() {
  const professionalId = '348ba304-26ff-4c43-9fa7-6ea7b414d67b';
  
  console.log('=== VERIFICA DATI PROFESSIONISTA ===\n');
  
  // 1. Verifica dati base
  const user = await prisma.user.findUnique({
    where: { id: professionalId },
    include: {
      professionData: true,
      professionalUserSubcategories: {
        include: {
          subcategory: {
            include: {
              category: true
            }
          }
        }
      }
    }
  });
  
  console.log('Dati utente:');
  console.log('- Nome:', user.firstName, user.lastName);
  console.log('- Ruolo:', user.role);
  console.log('- profession (stringa):', user.profession);
  console.log('- professionId:', user.professionId);
  console.log('- professionData:', user.professionData);
  console.log('- Numero competenze:', user.professionalUserSubcategories?.length || 0);
  
  // 2. Verifica professioni disponibili
  const professions = await prisma.profession.findMany({
    where: { isActive: true }
  });
  
  console.log('\nProfessioni disponibili:');
  professions.forEach(p => {
    console.log(`- ${p.name} (ID: ${p.id})`);
  });
  
  // 3. Se c'è una professionId, verifica le categorie collegate
  if (user.professionId) {
    const professionCategories = await prisma.professionCategory.findMany({
      where: { 
        professionId: user.professionId,
        isActive: true
      },
      include: {
        category: true
      }
    });
    
    console.log('\nCategorie della professione:');
    professionCategories.forEach(pc => {
      console.log(`- ${pc.category.name}`);
    });
  } else {
    console.log('\nNessuna professionId impostata!');
  }
  
  await prisma.$disconnect();
}

checkProfessionalData().catch(console.error);
