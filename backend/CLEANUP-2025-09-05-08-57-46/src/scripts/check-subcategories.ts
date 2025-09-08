import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSubcategories() {
  try {
    console.log('\n🔍 Controllo Sottocategorie nel Database\n');
    
    // 1. Conta sottocategorie
    const count = await prisma.subcategory.count();
    console.log(`📊 Totale sottocategorie: ${count}`);
    
    if (count === 0) {
      console.log('\n⚠️  Non ci sono sottocategorie nel database!');
      
      // Verifica se ci sono categorie
      const categoryCount = await prisma.category.count();
      console.log(`📊 Totale categorie: ${categoryCount}`);
      
      if (categoryCount > 0) {
        // Mostra le categorie disponibili
        const categories = await prisma.category.findMany({
          select: { id: true, name: true }
        });
        
        console.log('\n📋 Categorie disponibili per creare sottocategorie:');
        categories.forEach(cat => {
          console.log(`  - ${cat.name} (ID: ${cat.id})`);
        });
        
        // Crea alcune sottocategorie di esempio
        console.log('\n✨ Creo sottocategorie di esempio...\n');
        
        for (const category of categories) {
          const subcategories = getSubcategoriesForCategory(category.name);
          
          for (const subcat of subcategories) {
            try {
              const created = await prisma.subcategory.create({
                data: {
                  name: subcat.name,
                  slug: subcat.slug,
                  description: subcat.description,
                  categoryId: category.id,
                  isActive: true,
                  color: subcat.color,
                  textColor: '#FFFFFF'
                }
              });
              console.log(`✅ Creata: ${created.name} per ${category.name}`);
            } catch (err: any) {
              if (err.code === 'P2002') {
                console.log(`⏭️  ${subcat.name} già esiste`);
              } else {
                console.error(`❌ Errore creando ${subcat.name}:`, err.message);
              }
            }
          }
        }
      } else {
        console.log('\n⚠️  Non ci sono nemmeno categorie! Devi prima creare le categorie.');
      }
    } else {
      // Mostra sottocategorie esistenti
      const subcategories = await prisma.subcategory.findMany({
        include: {
          category: true,
          _count: {
            select: {
              assistanceRequests: true
            }
          }
        }
      });
      
      console.log('\n📋 Sottocategorie esistenti:');
      subcategories.forEach(sub => {
        console.log(`\n- ${sub.name}`);
        console.log(`  Categoria: ${sub.category.name}`);
        console.log(`  Slug: ${sub.slug}`);
        console.log(`  Attiva: ${sub.isActive ? 'Sì' : 'No'}`);
        console.log(`  Richieste: ${sub._count.assistanceRequests}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function getSubcategoriesForCategory(categoryName: string) {
  const subcategoriesMap: Record<string, any[]> = {
    'Elettricista': [
      { name: 'Impianti civili', slug: 'impianti-civili', description: 'Installazione e manutenzione impianti elettrici civili', color: '#FFD700' },
      { name: 'Impianti industriali', slug: 'impianti-industriali', description: 'Impianti elettrici per industrie', color: '#FFA500' },
      { name: 'Automazione cancelli', slug: 'automazione-cancelli', description: 'Installazione e riparazione automazioni', color: '#FF8C00' },
      { name: 'Videocitofonia', slug: 'videocitofonia', description: 'Sistemi di videocitofonia e controllo accessi', color: '#FFB347' },
      { name: 'Illuminazione LED', slug: 'illuminazione-led', description: 'Progettazione e installazione illuminazione LED', color: '#FFFF00' }
    ],
    'Idraulico': [
      { name: 'Riparazioni urgenti', slug: 'riparazioni-urgenti', description: 'Interventi urgenti perdite e rotture', color: '#4169E1' },
      { name: 'Installazione sanitari', slug: 'installazione-sanitari', description: 'Montaggio bagni e sanitari', color: '#0000CD' },
      { name: 'Impianti riscaldamento', slug: 'impianti-riscaldamento', description: 'Caldaie e termosifoni', color: '#FF4500' },
      { name: 'Condizionamento', slug: 'condizionamento', description: 'Installazione e manutenzione climatizzatori', color: '#87CEEB' },
      { name: 'Irrigazione giardini', slug: 'irrigazione-giardini', description: 'Impianti di irrigazione automatica', color: '#32CD32' }
    ],
    'Falegname': [
      { name: 'Mobili su misura', slug: 'mobili-su-misura', description: 'Progettazione e realizzazione mobili personalizzati', color: '#8B4513' },
      { name: 'Riparazione mobili', slug: 'riparazione-mobili', description: 'Restauro e riparazione mobili', color: '#A0522D' },
      { name: 'Porte e finestre', slug: 'porte-finestre', description: 'Installazione e riparazione serramenti', color: '#DEB887' },
      { name: 'Parquet', slug: 'parquet', description: 'Posa e manutenzione pavimenti in legno', color: '#D2691E' },
      { name: 'Scale in legno', slug: 'scale-legno', description: 'Realizzazione e restauro scale', color: '#8B7355' }
    ],
    'Muratore': [
      { name: 'Ristrutturazioni complete', slug: 'ristrutturazioni-complete', description: 'Ristrutturazione completa appartamenti', color: '#808080' },
      { name: 'Opere murarie', slug: 'opere-murarie', description: 'Costruzione muri e tramezzi', color: '#696969' },
      { name: 'Intonaci e rasature', slug: 'intonaci-rasature', description: 'Intonacatura e finitura pareti', color: '#A9A9A9' },
      { name: 'Pavimenti e rivestimenti', slug: 'pavimenti-rivestimenti', description: 'Posa piastrelle e rivestimenti', color: '#CD853F' },
      { name: 'Impermeabilizzazioni', slug: 'impermeabilizzazioni', description: 'Impermeabilizzazione terrazzi e tetti', color: '#4682B4' }
    ],
    'Imbianchino': [
      { name: 'Tinteggiatura interni', slug: 'tinteggiatura-interni', description: 'Pittura pareti e soffitti interni', color: '#FFE4E1' },
      { name: 'Tinteggiatura esterni', slug: 'tinteggiatura-esterni', description: 'Pittura facciate e muri esterni', color: '#FFA07A' },
      { name: 'Decorazioni murali', slug: 'decorazioni-murali', description: 'Stucchi, cornici e decorazioni', color: '#FFB6C1' },
      { name: 'Carta da parati', slug: 'carta-da-parati', description: 'Applicazione carte da parati', color: '#DDA0DD' },
      { name: 'Verniciatura legno', slug: 'verniciatura-legno', description: 'Verniciatura porte, finestre e mobili', color: '#8B4513' }
    ]
  };
  
  return subcategoriesMap[categoryName] || [
    { name: 'Servizio base', slug: 'servizio-base', description: 'Servizio standard', color: '#808080' },
    { name: 'Servizio avanzato', slug: 'servizio-avanzato', description: 'Servizio specializzato', color: '#606060' }
  ];
}

checkSubcategories();
