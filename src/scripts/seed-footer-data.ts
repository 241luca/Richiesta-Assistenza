import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedFooterData() {
  console.log('🦶 Inizializzazione dati Footer...');

  try {
    // Crea le sezioni del footer
    const sections = [
      { key: 'company', title: 'Azienda', order: 1, isVisible: true },
      { key: 'support', title: 'Supporto', order: 2, isVisible: true },
      { key: 'legal', title: 'Documenti Legali', order: 3, isVisible: true },
      { key: 'contact', title: 'Contatti', order: 4, isVisible: true }
    ];

    for (const section of sections) {
      await prisma.footerSection.upsert({
        where: { key: section.key },
        update: section,
        create: section
      });
    }

    console.log('✅ Sezioni footer create');

    // Crea i link del footer
    const footerLinks = [
      // Sezione Azienda
      { section: 'company', label: 'Chi Siamo', url: '/about', order: 1, isExternal: false, isActive: true },
      { section: 'company', label: 'Come Funziona', url: '/how-it-works', order: 2, isExternal: false, isActive: true },
      { section: 'company', label: 'Dashboard', url: '/dashboard', order: 3, isExternal: false, isActive: true },
      { section: 'company', label: 'Richieste', url: '/requests', order: 4, isExternal: false, isActive: true },

      // Sezione Supporto
      { section: 'support', label: 'Centro Assistenza', url: '/help', order: 1, isExternal: false, isActive: true },
      { section: 'support', label: 'FAQ', url: '/faq', order: 2, isExternal: false, isActive: true },
      { section: 'support', label: 'Documentazione', url: '/docs', order: 3, isExternal: false, isActive: true },
      { section: 'support', label: 'Stato Sistema', url: '/status', order: 4, isExternal: false, isActive: true },

      // Sezione Documenti Legali
      { section: 'legal', label: 'Privacy Policy', url: '/legal/privacy-policy', order: 1, isExternal: false, isActive: true },
      { section: 'legal', label: 'Termini di Servizio', url: '/legal/terms-service', order: 2, isExternal: false, isActive: true },
      { section: 'legal', label: 'Cookie Policy', url: '/legal/cookie-policy', order: 3, isExternal: false, isActive: true },
      { section: 'legal', label: 'Tutti i Documenti', url: '/legal', order: 4, isExternal: false, isActive: true },

      // Sezione Contatti (non link ma testo, verrà gestita diversamente nel componente)
    ];

    // Prima elimina i link esistenti per evitare duplicati
    await prisma.footerLink.deleteMany({});

    // Poi crea i nuovi link
    for (const link of footerLinks) {
      await prisma.footerLink.create({
        data: link
      });
    }

    console.log('✅ Link footer creati');
    console.log('🎉 Dati Footer inizializzati con successo!');

  } catch (error) {
    console.error('❌ Errore durante l\'inizializzazione dei dati Footer:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il seed
seedFooterData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
