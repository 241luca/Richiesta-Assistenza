import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const count = await prisma.auditLog.count();
  console.log(`\n✅ TOTALE RECORD NEL DATABASE: ${count}\n`);
  
  if (count > 50) {
    console.log('🎉 OTTIMO! Ci sono abbastanza dati.');
    console.log('\n👉 ORA VAI SU: http://localhost:5193/admin/audit');
    console.log('   e dovresti vedere tutti i log!\n');
  } else {
    console.log('⚠️  Ancora pochi dati. Aggiungiamone altri...');
  }
  
  await prisma.$disconnect();
}

check();
