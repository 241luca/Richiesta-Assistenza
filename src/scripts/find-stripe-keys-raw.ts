import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findStripeKeys() {
  console.log('🔍 Ricerca Chiavi Stripe\n');
  console.log('=' .repeat(50));
  
  try {
    // Prova a trovare il modello corretto
    // Basandoci su quello che abbiamo visto in Prisma Studio
    
    // Opzione 1: Prova con il nome esatto che sembra essere nel tuo database
    const sql = `
      SELECT * FROM "ApiKey" 
      WHERE "key" LIKE '%stripe%' 
      OR "key" LIKE '%STRIPE%'
      OR "service" = 'stripe'
      OR "service" = 'STRIPE'
      OR "service" = 'STRIPE_PUBLIC'
      OR "key" = 'STRIPE'
      OR "key" = 'STRIPE_PUBLIC'
      OR "key" = 'STRIPE_WEBHOOK'
    `;
    
    const results = await prisma.$queryRawUnsafe(sql);
    
    console.log('Risultati trovati:', results);
    
  } catch (error: any) {
    console.error('Errore SQL:', error.message);
    
    // Se il modello ApiKey non esiste, proviamo a vedere quali tabelle esistono
    console.log('\n📊 Controllo tabelle nel database...\n');
    
    try {
      const tables = await prisma.$queryRaw`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%api%' 
        OR table_name LIKE '%Api%'
        OR table_name LIKE '%key%'
        OR table_name LIKE '%Key%'
      `;
      
      console.log('Tabelle trovate che potrebbero contenere API keys:', tables);
    } catch (tableError) {
      console.error('Errore nel cercare tabelle:', tableError);
    }
  } finally {
    await prisma.$disconnect();
  }
}

findStripeKeys()
  .then(() => {
    console.log('\n✅ Ricerca completata');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Ricerca fallita:', error);
    process.exit(1);
  });
