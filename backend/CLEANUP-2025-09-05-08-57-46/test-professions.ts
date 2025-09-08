// Script semplice per verificare se la tabella Profession esiste
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProfessions() {
  try {
    console.log('🔍 Test connessione database...\n');
    
    // Test query semplice
    const result = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'Profession'
    `;
    
    console.log('Risultato query:', result);
    
    // Prova a fare una query diretta
    const professions = await prisma.$queryRaw`
      SELECT * FROM "Profession" LIMIT 5
    `;
    
    console.log('\nProfessioni trovate:');
    console.log(professions);
    
  } catch (error) {
    console.error('❌ Errore:', error);
    
    // Proviamo a creare la tabella manualmente
    console.log('\n📝 Tentativo di creare la tabella manualmente...');
    
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Profession" (
          id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(100) NOT NULL UNIQUE,
          slug VARCHAR(100) NOT NULL UNIQUE,
          description TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "displayOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `;
      console.log('✅ Tabella creata!');
      
      // Inserisci dati di base
      await prisma.$executeRaw`
        INSERT INTO "Profession" (name, slug, description, "displayOrder") VALUES 
        ('Idraulico', 'idraulico', 'Esperto in impianti idraulici e sanitari', 1),
        ('Elettricista', 'elettricista', 'Esperto in impianti elettrici e automazione', 2),
        ('Muratore', 'muratore', 'Esperto in costruzioni e ristrutturazioni edili', 3)
        ON CONFLICT DO NOTHING
      `;
      console.log('✅ Dati inseriti!');
      
    } catch (createError) {
      console.error('Errore creazione:', createError);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testProfessions();
