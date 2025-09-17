// Script per popolare professioni e categorie di base
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

async function seedProfessionsAndCategories() {
  try {
    console.log('🌱 Seeding professions and categories...');

    // Crea professioni di base
    const professions = [
      { id: 'idraulico', name: 'Idraulico', slug: 'idraulico', description: 'Specialista in impianti idraulici' },
      { id: 'elettricista', name: 'Elettricista', slug: 'elettricista', description: 'Specialista in impianti elettrici' },
      { id: 'muratore', name: 'Muratore', slug: 'muratore', description: 'Specialista in opere murarie' },
      { id: 'imbianchino', name: 'Imbianchino', slug: 'imbianchino', description: 'Specialista in tinteggiature' },
      { id: 'fabbro', name: 'Fabbro', slug: 'fabbro', description: 'Specialista in lavori metallici' },
      { id: 'falegname', name: 'Falegname', slug: 'falegname', description: 'Specialista in lavori in legno' },
      { id: 'giardiniere', name: 'Giardiniere', slug: 'giardiniere', description: 'Specialista in manutenzione giardini' },
      { id: 'tecnico-condizionatori', name: 'Tecnico Condizionatori', slug: 'tecnico-condizionatori', description: 'Specialista in climatizzazione' }
    ];

    for (const profession of professions) {
      await prisma.profession.upsert({
        where: { id: profession.id },
        update: profession,
        create: {
          ...profession,
          isActive: true,
          displayOrder: 0
        }
      });
      console.log(`✅ Professione creata/aggiornata: ${profession.name}`);
    }

    // Crea categorie di base
    const categories = [
      { id: 'impianti-idraulici', name: 'Impianti Idraulici', slug: 'impianti-idraulici', description: 'Installazione e riparazione impianti idraulici' },
      { id: 'impianti-elettrici', name: 'Impianti Elettrici', slug: 'impianti-elettrici', description: 'Installazione e riparazione impianti elettrici' },
      { id: 'riparazioni-urgenti', name: 'Riparazioni Urgenti', slug: 'riparazioni-urgenti', description: 'Interventi di emergenza' },
      { id: 'ristrutturazioni', name: 'Ristrutturazioni', slug: 'ristrutturazioni', description: 'Lavori di ristrutturazione' },
      { id: 'manutenzione', name: 'Manutenzione', slug: 'manutenzione', description: 'Manutenzione ordinaria e straordinaria' },
      { id: 'climatizzazione', name: 'Climatizzazione', slug: 'climatizzazione', description: 'Impianti di riscaldamento e condizionamento' },
      { id: 'serramenti', name: 'Serramenti', slug: 'serramenti', description: 'Porte, finestre e serrande' },
      { id: 'giardinaggio', name: 'Giardinaggio', slug: 'giardinaggio', description: 'Manutenzione aree verdi' },
      { id: 'tinteggiature', name: 'Tinteggiature', slug: 'tinteggiature', description: 'Imbiancature e decorazioni' },
      { id: 'pavimenti', name: 'Pavimenti', slug: 'pavimenti', description: 'Posa e riparazione pavimenti' }
    ];

    for (const category of categories) {
      await prisma.category.upsert({
        where: { id: category.id },
        update: category,
        create: {
          ...category,
          isActive: true,
          displayOrder: 0
        }
      });
      console.log(`✅ Categoria creata/aggiornata: ${category.name}`);
    }

    // Crea alcune associazioni di esempio
    const associations = [
      { professionId: 'idraulico', categoryId: 'impianti-idraulici', isDefault: true },
      { professionId: 'idraulico', categoryId: 'riparazioni-urgenti' },
      { professionId: 'idraulico', categoryId: 'manutenzione' },
      
      { professionId: 'elettricista', categoryId: 'impianti-elettrici', isDefault: true },
      { professionId: 'elettricista', categoryId: 'riparazioni-urgenti' },
      { professionId: 'elettricista', categoryId: 'manutenzione' },
      
      { professionId: 'muratore', categoryId: 'ristrutturazioni', isDefault: true },
      { professionId: 'muratore', categoryId: 'pavimenti' },
      
      { professionId: 'imbianchino', categoryId: 'tinteggiature', isDefault: true },
      { professionId: 'imbianchino', categoryId: 'ristrutturazioni' },
      
      { professionId: 'tecnico-condizionatori', categoryId: 'climatizzazione', isDefault: true },
      { professionId: 'tecnico-condizionatori', categoryId: 'manutenzione' },
      
      { professionId: 'giardiniere', categoryId: 'giardinaggio', isDefault: true },
      
      { professionId: 'fabbro', categoryId: 'serramenti', isDefault: true },
      { professionId: 'fabbro', categoryId: 'riparazioni-urgenti' },
      
      { professionId: 'falegname', categoryId: 'serramenti' },
      { professionId: 'falegname', categoryId: 'ristrutturazioni' }
    ];

    for (const assoc of associations) {
      try {
        await prisma.professionCategory.create({
          data: {
            ...assoc,
            isActive: true
          }
        });
        console.log(`✅ Associazione creata: ${assoc.professionId} -> ${assoc.categoryId}`);
      } catch (error: any) {
        if (error.code === 'P2002') {
          console.log(`⏭️ Associazione già esistente: ${assoc.professionId} -> ${assoc.categoryId}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n🎉 Seed completato con successo!');
    
    // Mostra statistiche
    const professionCount = await prisma.profession.count();
    const categoryCount = await prisma.category.count();
    const associationCount = await prisma.professionCategory.count();
    
    console.log('\n📊 Statistiche:');
    console.log(`- Professioni: ${professionCount}`);
    console.log(`- Categorie: ${categoryCount}`);
    console.log(`- Associazioni: ${associationCount}`);

  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
seedProfessionsAndCategories()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
