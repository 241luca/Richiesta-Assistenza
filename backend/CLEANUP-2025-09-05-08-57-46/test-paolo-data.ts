// Test per verificare che i dati vengano ritornati correttamente
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPaoloData() {
  try {
    console.log('🔍 Test dati Paolo Costa\n');
    console.log('=====================================\n');
    
    // Trova Paolo Costa con professionData
    const paolo = await prisma.user.findFirst({
      where: {
        firstName: 'Paolo',
        lastName: 'Costa'
      },
      include: {
        professionData: true
      }
    });
    
    if (paolo) {
      console.log('✅ Paolo Costa trovato:');
      console.log('   ID:', paolo.id);
      console.log('   Email:', paolo.email);
      console.log('\n📊 DATI PROFESSIONE:');
      console.log('   profession (campo testo):', paolo.profession || 'null');
      console.log('   professionId:', paolo.professionId || 'null');
      
      if (paolo.professionData) {
        console.log('\n✅ PROFESSION DATA (dalla tabella):');
        console.log('   ID:', paolo.professionData.id);
        console.log('   Nome:', paolo.professionData.name);
        console.log('   Slug:', paolo.professionData.slug);
        console.log('   Descrizione:', paolo.professionData.description || 'nessuna');
        console.log('   Attiva:', paolo.professionData.isActive);
      } else {
        console.log('\n❌ PROFESSION DATA: null (non caricata)');
      }
      
      console.log('\n📝 Ultimo aggiornamento:', paolo.updatedAt);
    } else {
      console.log('❌ Paolo Costa non trovato');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPaoloData();
