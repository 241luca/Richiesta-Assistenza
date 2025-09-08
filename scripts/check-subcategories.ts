import { PrismaClient } from '../backend/node_modules/@prisma/client/index.js';

const prisma = new PrismaClient();

async function checkSubcategories() {
  try {
    // Check categories
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            subcategories: true
          }
        }
      }
    });
    
    console.log('\n=== CATEGORIES ===');
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat.id}) - Subcategories: ${cat._count.subcategories}`);
    });

    // Check subcategories
    const subcategories = await prisma.subcategory.findMany({
      include: {
        category: true
      }
    });
    
    console.log('\n=== SUBCATEGORIES ===');
    if (subcategories.length === 0) {
      console.log('No subcategories found!');
    } else {
      subcategories.forEach(sub => {
        console.log(`- ${sub.name} (Category: ${sub.category.name})`);
      });
    }

    // Check if we need to create subcategories
    if (subcategories.length === 0) {
      console.log('\n=== CREATING SUBCATEGORIES ===');
      
      const categoryMap = new Map(categories.map(c => [c.name, c.id]));
      
      const subcategoriesData = [
        // Idraulica
        { name: 'Riparazione perdite', categoryId: categoryMap.get('Idraulica'), description: 'Riparazione di perdite d\'acqua' },
        { name: 'Installazione sanitari', categoryId: categoryMap.get('Idraulica'), description: 'Installazione di sanitari e rubinetteria' },
        { name: 'Sblocco scarichi', categoryId: categoryMap.get('Idraulica'), description: 'Sblocco di scarichi otturati' },
        { name: 'Emergenze idrauliche', categoryId: categoryMap.get('Idraulica'), description: 'Interventi urgenti idraulici' },
        { name: 'Impianti idrici', categoryId: categoryMap.get('Idraulica'), description: 'Installazione e manutenzione impianti' },
        
        // Elettricista
        { name: 'Impianti elettrici', categoryId: categoryMap.get('Elettricista'), description: 'Installazione impianti elettrici' },
        { name: 'Riparazione guasti', categoryId: categoryMap.get('Elettricista'), description: 'Riparazione guasti elettrici' },
        { name: 'Quadri elettrici', categoryId: categoryMap.get('Elettricista'), description: 'Installazione e manutenzione quadri' },
        { name: 'Illuminazione', categoryId: categoryMap.get('Elettricista'), description: 'Sistemi di illuminazione' },
        { name: 'Emergenze elettriche', categoryId: categoryMap.get('Elettricista'), description: 'Interventi urgenti elettrici' },
        
        // Falegnameria
        { name: 'Mobili su misura', categoryId: categoryMap.get('Falegnameria'), description: 'Realizzazione mobili personalizzati' },
        { name: 'Riparazioni mobili', categoryId: categoryMap.get('Falegnameria'), description: 'Riparazione e restauro mobili' },
        { name: 'Porte e finestre', categoryId: categoryMap.get('Falegnameria'), description: 'Installazione e riparazione infissi' },
        { name: 'Pavimenti in legno', categoryId: categoryMap.get('Falegnameria'), description: 'Posa e manutenzione parquet' },
        
        // Muratura
        { name: 'Ristrutturazioni', categoryId: categoryMap.get('Muratura'), description: 'Lavori di ristrutturazione completa' },
        { name: 'Intonaci', categoryId: categoryMap.get('Muratura'), description: 'Realizzazione e riparazione intonaci' },
        { name: 'Piastrellatura', categoryId: categoryMap.get('Muratura'), description: 'Posa piastrelle e rivestimenti' },
        { name: 'Demolizioni', categoryId: categoryMap.get('Muratura'), description: 'Lavori di demolizione controllata' },
        
        // Pulizie
        { name: 'Pulizie domestiche', categoryId: categoryMap.get('Pulizie'), description: 'Pulizie casa e appartamenti' },
        { name: 'Pulizie uffici', categoryId: categoryMap.get('Pulizie'), description: 'Pulizie spazi commerciali' },
        { name: 'Pulizie industriali', categoryId: categoryMap.get('Pulizie'), description: 'Pulizie ambienti industriali' },
        { name: 'Sanificazione', categoryId: categoryMap.get('Pulizie'), description: 'Servizi di sanificazione ambienti' },
      ].filter(sub => sub.categoryId); // Only add if category exists

      for (const subData of subcategoriesData) {
        try {
          const created = await prisma.subcategory.create({
            data: {
              name: subData.name,
              slug: subData.name.toLowerCase().replace(/\s+/g, '-'),
              description: subData.description,
              categoryId: subData.categoryId!,
              isActive: true,
              displayOrder: 0
            }
          });
          console.log(`Created: ${created.name}`);
        } catch (error) {
          console.error(`Error creating ${subData.name}:`, error);
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubcategories();
