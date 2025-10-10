import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateFooterLinks() {
  console.log('🔧 Aggiornamento link Footer con pagine esistenti...');

  try {
    // Link corretti per sezione Azienda
    const aziendaLinks = [
      { label: 'Dashboard', url: '/dashboard' },
      { label: 'Richieste', url: '/requests' },
      { label: 'Preventivi', url: '/quotes' },
      { label: 'Profilo', url: '/profile' }
    ];

    // Aggiorna link sezione company
    for (let i = 0; i < aziendaLinks.length; i++) {
      await prisma.footerLink.updateMany({
        where: {
          section: 'company',
          order: i + 1
        },
        data: {
          label: aziendaLinks[i].label,
          url: aziendaLinks[i].url,
          isExternal: false
        }
      });
    }

    // Link corretti per sezione Supporto
    const supportLinks = [
      { label: 'Dashboard Admin', url: '/admin' },
      { label: 'Categorie', url: '/admin/categories' },
      { label: 'Utenti', url: '/admin/users' },
      { label: 'Sistema', url: '/admin/system-settings' }
    ];

    // Aggiorna link sezione support
    for (let i = 0; i < supportLinks.length; i++) {
      await prisma.footerLink.updateMany({
        where: {
          section: 'support',
          order: i + 1
        },
        data: {
          label: supportLinks[i].label,
          url: supportLinks[i].url,
          isExternal: false
        }
      });
    }

    // I link Legal sono già corretti e funzionano!
    console.log('✅ Link Legal già funzionanti: /legal, /legal/privacy-policy, ecc.');

    console.log('🎉 Link Footer aggiornati con successo!');
    console.log('\n📋 Link ora disponibili:');
    console.log('- Azienda: Dashboard, Richieste, Preventivi, Profilo');
    console.log('- Supporto: Admin, Categorie, Utenti, Sistema');
    console.log('- Legali: Privacy, Termini, Cookie (già funzionanti)');

  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento dei link Footer:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui l'aggiornamento
updateFooterLinks()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
