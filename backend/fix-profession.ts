// Script per verificare e sistemare la professione del professionista
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProfession() {
  const professionalId = '348ba304-26ff-4c43-9fa7-6ea7b414d67b';
  
  console.log('=== VERIFICA PROFESSIONE ===\n');
  
  // 1. Verifica dati attuali del professionista
  const user = await prisma.user.findUnique({
    where: { id: professionalId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profession: true,  // Campo stringa
      professionId: true, // Riferimento alla tabella Profession
      professionData: true // Dati dalla tabella Profession
    }
  });
  
  console.log('Dati attuali:');
  console.log('- profession (stringa):', user?.profession);
  console.log('- professionId:', user?.professionId);
  console.log('- professionData:', user?.professionData);
  console.log('\n');
  
  // 2. Cerca la professione "Idraulico" nella tabella Profession
  const idraulicoProfession = await prisma.profession.findFirst({
    where: {
      OR: [
        { name: { contains: 'Idraulico', mode: 'insensitive' } },
        { slug: { contains: 'idraulico', mode: 'insensitive' } }
      ]
    }
  });
  
  if (idraulicoProfession) {
    console.log('Trovata professione Idraulico:');
    console.log(idraulicoProfession);
    
    // 3. Aggiorna il professionista con il professionId corretto
    const updated = await prisma.user.update({
      where: { id: professionalId },
      data: {
        professionId: idraulicoProfession.id
      },
      include: {
        professionData: true
      }
    });
    
    console.log('\n✅ Professionista aggiornato con successo!');
    console.log('Nuova professione:', updated.professionData?.name);
    
    // 4. Verifica le categorie associate alla professione
    const professionCategories = await prisma.professionCategory.findMany({
      where: {
        professionId: idraulicoProfession.id,
        isActive: true
      },
      include: {
        category: true
      }
    });
    
    console.log('\n📂 Categorie associate alla professione Idraulico:');
    if (professionCategories.length > 0) {
      professionCategories.forEach(pc => {
        console.log(`- ${pc.category.name}`);
      });
    } else {
      console.log('Nessuna categoria associata! Dobbiamo crearle.');
      
      // 5. Cerca le categorie Idraulica e Climatizzazione
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: 'Idraulica', mode: 'insensitive' } },
            { name: { contains: 'Climatizzazione', mode: 'insensitive' } }
          ]
        }
      });
      
      console.log('\nCategorie trovate:', categories.map(c => c.name));
      
      // 6. Associa le categorie alla professione
      for (const category of categories) {
        const existing = await prisma.professionCategory.findFirst({
          where: {
            professionId: idraulicoProfession.id,
            categoryId: category.id
          }
        });
        
        if (!existing) {
          await prisma.professionCategory.create({
            data: {
              professionId: idraulicoProfession.id,
              categoryId: category.id,
              isActive: true
            }
          });
          console.log(`✅ Associata categoria ${category.name} alla professione Idraulico`);
        }
      }
    }
  } else {
    console.log('❌ Professione Idraulico non trovata nella tabella Profession!');
    
    // Lista tutte le professioni disponibili
    const allProfessions = await prisma.profession.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    console.log('\nProfessioni disponibili:');
    allProfessions.forEach(p => {
      console.log(`- ${p.name} (ID: ${p.id})`);
    });
  }
  
  await prisma.$disconnect();
}

fixProfession().catch(console.error);
