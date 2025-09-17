const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedSystemSettings() {
  console.log('🌱 Creazione impostazioni di sistema essenziali...\n');
  
  const defaultSettings = [
    // Branding e Identità
    {
      key: 'site_title',
      value: 'Richiesta Assistenza',
      type: 'string',
      category: 'Branding e Identità',
      description: 'Titolo del sito web mostrato nel browser',
      isActive: true,
      isEditable: true
    },
    {
      key: 'site_logo',
      value: '/logo.svg',
      type: 'url',
      category: 'Branding e Identità',
      description: 'Logo principale usato nell\'header e login',
      isActive: true,
      isEditable: true
    },
    {
      key: 'site_favicon',
      value: '/favicon.svg',
      type: 'url',
      category: 'Branding e Identità',  
      description: 'Icona mostrata nella tab del browser',
      isActive: true,
      isEditable: true
    },
    {
      key: 'site_claim',
      value: 'Il tuo partner di fiducia per ogni assistenza',
      type: 'string',
      category: 'Branding e Identità',
      description: 'Slogan mostrato nella homepage',
      isActive: true,
      isEditable: true
    },
    {
      key: 'primary_color',
      value: '#3B82F6',
      type: 'string',
      category: 'Branding e Identità',
      description: 'Colore principale del tema (blu)',
      isActive: true,
      isEditable: true
    },
    {
      key: 'secondary_color',
      value: '#9333EA',
      type: 'string',
      category: 'Branding e Identità',
      description: 'Colore secondario del tema (viola)',
      isActive: true,
      isEditable: true
    },
    
    // Informazioni Azienda
    {
      key: 'company_name',
      value: 'Richiesta Assistenza S.r.l.',
      type: 'string',
      category: 'Informazioni Azienda',
      description: 'Ragione sociale completa',
      isActive: true,
      isEditable: true
    },
    {
      key: 'company_vat',
      value: 'IT12345678901',
      type: 'string',
      category: 'Informazioni Azienda',
      description: 'Partita IVA',
      isActive: true,
      isEditable: true
    },
    {
      key: 'company_fiscal_code',
      value: '12345678901',
      type: 'string',
      category: 'Informazioni Azienda',
      description: 'Codice Fiscale',
      isActive: true,
      isEditable: true
    },
    {
      key: 'company_rea',
      value: 'RA-123456',
      type: 'string',
      category: 'Informazioni Azienda',
      description: 'Numero REA',
      isActive: true,
      isEditable: true
    },
    
    // Contatti
    {
      key: 'contact_email',
      value: 'info@richiesta-assistenza.it',
      type: 'email',
      category: 'Contatti',
      description: 'Email principale di contatto',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_phone',
      value: '+39 0544 123456',
      type: 'string',
      category: 'Contatti',
      description: 'Numero di telefono principale',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_whatsapp',
      value: '+39 333 1234567',
      type: 'string',
      category: 'Contatti',
      description: 'Numero WhatsApp Business',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_address',
      value: 'Via Roma 1',
      type: 'string',
      category: 'Contatti',
      description: 'Indirizzo stradale',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_city',
      value: 'Ravenna',
      type: 'string',
      category: 'Contatti',
      description: 'Città sede legale',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_province',
      value: 'RA',
      type: 'string',
      category: 'Contatti',
      description: 'Provincia',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_cap',
      value: '48121',
      type: 'string',
      category: 'Contatti',
      description: 'CAP',
      isActive: true,
      isEditable: true
    },
    {
      key: 'support_email',
      value: 'supporto@richiesta-assistenza.it',
      type: 'email',
      category: 'Contatti',
      description: 'Email per supporto tecnico',
      isActive: true,
      isEditable: true
    },
    
    // Legale e Privacy
    {
      key: 'privacy_policy_url',
      value: '/privacy-policy',
      type: 'url',
      category: 'Legale e Privacy',
      description: 'Link alla privacy policy',
      isActive: true,
      isEditable: true
    },
    {
      key: 'terms_url',
      value: '/termini-servizio',
      type: 'url',
      category: 'Legale e Privacy',
      description: 'Link ai termini di servizio',
      isActive: true,
      isEditable: true
    },
    {
      key: 'cookie_policy_url',
      value: '/cookie-policy',
      type: 'url',
      category: 'Legale e Privacy',
      description: 'Link alla cookie policy',
      isActive: true,
      isEditable: true
    },
    {
      key: 'gdpr_email',
      value: 'privacy@richiesta-assistenza.it',
      type: 'email',
      category: 'Legale e Privacy',
      description: 'Email responsabile GDPR',
      isActive: true,
      isEditable: true
    },
    
    // Sistema (solo impostazioni generali non gestite altrove)
    {
      key: 'maintenance_mode',
      value: 'false',
      type: 'boolean',
      category: 'Sistema',
      description: 'Attiva modalità manutenzione (mostra pagina di manutenzione)',
      isActive: true,
      isEditable: true
    },
    {
      key: 'maintenance_message',
      value: 'Il sistema è in manutenzione. Torneremo presto online!',
      type: 'text',
      category: 'Sistema',
      description: 'Messaggio mostrato durante la manutenzione',
      isActive: true,
      isEditable: true
    },
    {
      key: 'allow_registration',
      value: 'true',
      type: 'boolean',
      category: 'Sistema',
      description: 'Permetti registrazione nuovi utenti',
      isActive: true,
      isEditable: true
    },
    {
      key: 'require_email_verification',
      value: 'true',
      type: 'boolean',
      category: 'Sistema',
      description: 'Richiedi verifica email per nuovi utenti',
      isActive: true,
      isEditable: true
    },
    {
      key: 'default_language',
      value: 'it',
      type: 'string',
      category: 'Sistema',
      description: 'Lingua predefinita del sistema',
      isActive: true,
      isEditable: true
    },
    {
      key: 'timezone',
      value: 'Europe/Rome',
      type: 'string',
      category: 'Sistema',
      description: 'Fuso orario predefinito',
      isActive: true,
      isEditable: true
    }
  ];

  let created = 0;
  let skipped = 0;

  for (const setting of defaultSettings) {
    try {
      // Controlla se esiste già
      const existing = await prisma.systemSettings.findUnique({
        where: { key: setting.key }
      });
      
      if (existing) {
        console.log(`⏭️  ${setting.key} già esiste, saltato`);
        skipped++;
      } else {
        await prisma.systemSettings.create({ data: setting });
        console.log(`✅ Creato: ${setting.key} (${setting.category})`);
        created++;
      }
    } catch (error) {
      console.error(`❌ Errore creando ${setting.key}:`, error.message);
    }
  }

  console.log('\n📊 Riepilogo:');
  console.log(`   ✅ Create: ${created} impostazioni`);
  console.log(`   ⏭️  Saltate: ${skipped} impostazioni`);
  console.log(`   📋 Totale: ${defaultSettings.length} impostazioni base`);
  
  console.log('\n💡 Nota: Le impostazioni per notifiche, pagamenti e altre funzionalità');
  console.log('   sono gestite nelle rispettive sezioni dedicate del pannello admin.');
  
  await prisma.$disconnect();
}

seedSystemSettings().catch(error => {
  console.error('Errore durante il seed:', error);
  process.exit(1);
});
