import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDetailedSubcategories() {
  try {
    console.log('\n✨ Creazione sottocategorie dettagliate per il sistema\n');
    
    // Mappa categorie esistenti a sottocategorie specifiche
    const categorySubcategories = {
      'Idraulica': [
        { name: 'Riparazioni urgenti', slug: 'riparazioni-urgenti-idraulica', description: 'Perdite, rotture tubazioni, allagamenti', color: '#1E40AF' },
        { name: 'Installazione sanitari', slug: 'installazione-sanitari', description: 'Montaggio lavandini, WC, bidet, docce', color: '#2563EB' },
        { name: 'Caldaie e scaldabagni', slug: 'caldaie-scaldabagni', description: 'Installazione e manutenzione caldaie', color: '#3B82F6' },
        { name: 'Tubazioni', slug: 'tubazioni', description: 'Sostituzione e riparazione tubi', color: '#60A5FA' },
        { name: 'Scarichi e fognature', slug: 'scarichi-fognature', description: 'Disostruzione e riparazione scarichi', color: '#93C5FD' }
      ],
      'Elettricità': [
        { name: 'Impianti elettrici civili', slug: 'impianti-elettrici-civili', description: 'Impianti per abitazioni e uffici', color: '#FCD34D' },
        { name: 'Quadri elettrici', slug: 'quadri-elettrici', description: 'Installazione e certificazione quadri', color: '#FBBF24' },
        { name: 'Illuminazione', slug: 'illuminazione', description: 'Punti luce, lampadari, LED', color: '#F59E0B' },
        { name: 'Prese e interruttori', slug: 'prese-interruttori', description: 'Installazione e sostituzione', color: '#EAB308' },
        { name: 'Automazioni', slug: 'automazioni', description: 'Cancelli automatici, tapparelle elettriche', color: '#CA8A04' }
      ],
      'Climatizzazione': [
        { name: 'Condizionatori', slug: 'condizionatori', description: 'Installazione e manutenzione climatizzatori', color: '#06B6D4' },
        { name: 'Pompe di calore', slug: 'pompe-calore', description: 'Sistemi di riscaldamento/raffrescamento', color: '#0891B2' },
        { name: 'Ventilazione', slug: 'ventilazione', description: 'Sistemi di ventilazione meccanica', color: '#0E7490' },
        { name: 'Pulizia filtri', slug: 'pulizia-filtri', description: 'Sanificazione e manutenzione filtri', color: '#155E75' },
        { name: 'Ricarica gas', slug: 'ricarica-gas', description: 'Ricarica gas refrigerante', color: '#164E63' }
      ],
      'Edilizia': [
        { name: 'Ristrutturazioni complete', slug: 'ristrutturazioni-complete', description: 'Ristrutturazione appartamenti e locali', color: '#6B7280' },
        { name: 'Muratura', slug: 'muratura', description: 'Muri, tramezzi, aperture', color: '#4B5563' },
        { name: 'Intonaci', slug: 'intonaci', description: 'Intonacatura e rasatura pareti', color: '#374151' },
        { name: 'Pavimenti', slug: 'pavimenti', description: 'Posa piastrelle e pavimenti', color: '#1F2937' },
        { name: 'Impermeabilizzazioni', slug: 'impermeabilizzazioni', description: 'Terrazzi, tetti, cantine', color: '#111827' }
      ],
      'Falegnameria': [
        { name: 'Mobili su misura', slug: 'mobili-su-misura', description: 'Progettazione e realizzazione mobili', color: '#92400E' },
        { name: 'Riparazione mobili', slug: 'riparazione-mobili', description: 'Restauro e sistemazione mobili', color: '#78350F' },
        { name: 'Porte e finestre', slug: 'porte-finestre', description: 'Installazione e riparazione infissi', color: '#451A03' },
        { name: 'Parquet', slug: 'parquet', description: 'Posa e manutenzione pavimenti legno', color: '#7C2D12' },
        { name: 'Cucine', slug: 'cucine', description: 'Montaggio e modifica cucine', color: '#9A3412' }
      ],
      'Pulizie': [
        { name: 'Pulizie domestiche', slug: 'pulizie-domestiche', description: 'Pulizie ordinarie abitazioni', color: '#10B981' },
        { name: 'Pulizie uffici', slug: 'pulizie-uffici', description: 'Pulizie locali commerciali', color: '#059669' },
        { name: 'Pulizie post cantiere', slug: 'pulizie-post-cantiere', description: 'Pulizie dopo lavori edili', color: '#047857' },
        { name: 'Sanificazione', slug: 'sanificazione', description: 'Sanificazione e disinfezione ambienti', color: '#065F46' },
        { name: 'Vetri e facciate', slug: 'vetri-facciate', description: 'Pulizia vetrate e facciate esterne', color: '#064E3B' }
      ],
      'Giardinaggio': [
        { name: 'Manutenzione giardini', slug: 'manutenzione-giardini', description: 'Taglio erba, potature, pulizia', color: '#84CC16' },
        { name: 'Progettazione giardini', slug: 'progettazione-giardini', description: 'Creazione nuovi spazi verdi', color: '#65A30D' },
        { name: 'Irrigazione', slug: 'irrigazione', description: 'Impianti irrigazione automatica', color: '#4D7C0F' },
        { name: 'Potature', slug: 'potature', description: 'Potatura alberi e siepi', color: '#3F6212' },
        { name: 'Disinfestazione', slug: 'disinfestazione', description: 'Trattamenti antiparassitari', color: '#365314' }
      ],
      'Traslochi': [
        { name: 'Traslochi completi', slug: 'traslochi-completi', description: 'Trasloco casa o ufficio completo', color: '#7C3AED' },
        { name: 'Piccoli trasporti', slug: 'piccoli-trasporti', description: 'Trasporto singoli mobili o oggetti', color: '#6D28D9' },
        { name: 'Montaggio mobili', slug: 'montaggio-mobili-trasloco', description: 'Smontaggio e rimontaggio arredi', color: '#5B21B6' },
        { name: 'Deposito temporaneo', slug: 'deposito-temporaneo', description: 'Stoccaggio mobili temporaneo', color: '#4C1D95' },
        { name: 'Imballaggio', slug: 'imballaggio', description: 'Servizio imballaggio professionale', color: '#6B21A8' }
      ]
    };
    
    // Ottieni tutte le categorie
    const categories = await prisma.category.findMany();
    console.log(`Trovate ${categories.length} categorie\n`);
    
    for (const category of categories) {
      const subcats = categorySubcategories[category.name] || [];
      
      if (subcats.length === 0) {
        console.log(`⏭️  Nessuna sottocategoria definita per ${category.name}`);
        continue;
      }
      
      console.log(`\n📁 Creazione sottocategorie per ${category.name}:`);
      
      for (const subcat of subcats) {
        try {
          // Verifica se esiste già
          const existing = await prisma.subcategory.findFirst({
            where: {
              slug: subcat.slug,
              categoryId: category.id
            }
          });
          
          if (existing) {
            console.log(`  ⏭️  ${subcat.name} già esiste`);
            continue;
          }
          
          const created = await prisma.subcategory.create({
            data: {
              ...subcat,
              categoryId: category.id,
              isActive: true,
              textColor: '#FFFFFF'
            }
          });
          
          console.log(`  ✅ ${created.name}`);
        } catch (error: any) {
          console.error(`  ❌ Errore con ${subcat.name}: ${error.message}`);
        }
      }
    }
    
    // Conta il totale finale
    const totalCount = await prisma.subcategory.count();
    console.log(`\n📊 Totale sottocategorie nel database: ${totalCount}`);
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDetailedSubcategories();
