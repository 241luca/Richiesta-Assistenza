// Script per verificare i dati recuperati
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkRecoveredData() {
  try {
    console.log('=== DATI RECUPERATI DAL BACKUP ===\n');
    
    // Utenti
    const users = await prisma.user.findMany({
      select: { email: true, fullName: true, role: true }
    });
    
    console.log('👥 UTENTI RECUPERATI:');
    users.forEach(u => {
      console.log(`- ${u.fullName || u.email} (${u.role})`);
    });
    
    // Professionisti dettaglio
    const professionals = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      select: { fullName: true, email: true }
    });
    
    console.log(`\n👷 PROFESSIONISTI: ${professionals.length}`);
    professionals.forEach(p => {
      console.log(`- ${p.fullName}`);
    });
    
    // Altre statistiche
    const categories = await prisma.category.count();
    const subcategories = await prisma.subcategory.count();
    const requests = await prisma.assistanceRequest.count();
    const quotes = await prisma.quote.count();
    
    console.log(`\n📊 STATISTICHE:`);
    console.log(`- Categorie: ${categories}`);
    console.log(`- Sottocategorie: ${subcategories}`);
    console.log(`- Richieste: ${requests}`);
    console.log(`- Preventivi: ${quotes}`);
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecoveredData();
