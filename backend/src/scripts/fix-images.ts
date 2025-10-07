// Script per aggiornare le impostazioni delle immagini
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Aggiornamento URL immagini...');

  // Aggiorna logo
  await prisma.systemSettings.updateMany({
    where: { key: 'site_logo_url' },
    data: { value: '/logo.svg' }
  });
  console.log('✅ Logo aggiornato a /logo.svg');

  // Aggiorna favicon
  await prisma.systemSettings.updateMany({
    where: { key: 'site_favicon_url' },
    data: { value: '/vite.svg' }
  });
  console.log('✅ Favicon aggiornata a /vite.svg');

  // Fix tipo primary_color
  await prisma.systemSettings.updateMany({
    where: { key: 'primary_color' },
    data: { type: 'string' }
  });
  console.log('✅ Tipo primary_color corretto');

  console.log('✅ Aggiornamento completato!');
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
