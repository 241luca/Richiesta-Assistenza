// Script per popolare le impostazioni di sistema predefinite
// Da eseguire con: cd backend && npx tsx src/scripts/populate-system-settings.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Popolamento impostazioni di sistema...');

  const defaultSettings = [
    // BRANDING
    {
      key: 'site_name',
      value: 'Richiesta Assistenza',
      type: 'string',
      category: 'Branding',
      description: 'Nome del sito/sistema',
      isActive: true,
      isEditable: true
    },
    {
      key: 'site_version',
      value: 'v2.0',
      type: 'string',
      category: 'Branding',
      description: 'Versione del sistema',
      isActive: true,
      isEditable: true
    },
    {
      key: 'site_logo_url',
      value: '/logo.svg',
      type: 'url',
      category: 'Branding',
      description: 'URL del logo principale',
      isActive: true,
      isEditable: true
    },
    {
      key: 'site_favicon_url',
      value: '/vite.svg',
      type: 'url',
      category: 'Branding',
      description: 'URL della favicon',
      isActive: true,
      isEditable: true
    },
    {
      key: 'primary_color',
      value: '#3B82F6',
      type: 'string',
      category: 'Branding',
      description: 'Colore primario del tema',
      isActive: true,
      isEditable: true
    },

    // AZIENDA
    {
      key: 'company_name',
      value: 'Richiesta Assistenza Srl',
      type: 'string',
      category: 'Azienda',
      description: 'Ragione sociale completa',
      isActive: true,
      isEditable: true
    },
    {
      key: 'company_vat',
      value: 'IT12345678901',
      type: 'string',
      category: 'Azienda',
      description: 'Partita IVA',
      isActive: true,
      isEditable: true
    },
    {
      key: 'company_description',
      value: 'Sistema professionale per la gestione delle richieste di assistenza tecnica, sviluppato per ottimizzare il flusso di lavoro tra clienti e professionisti.',
      type: 'text',
      category: 'Azienda',
      description: 'Descrizione dell\'azienda/sistema',
      isActive: true,
      isEditable: true
    },
    {
      key: 'company_founded',
      value: '2023',
      type: 'string',
      category: 'Azienda',
      description: 'Anno di fondazione',
      isActive: true,
      isEditable: true
    },

    // CONTATTI (già esistenti, aggiungiamo i mancanti)
    {
      key: 'contact_phone',
      value: '+39 02 1234567',
      type: 'string',
      category: 'Contatti',
      description: 'Numero di telefono principale',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_email',
      value: 'info@assistenza.it',
      type: 'email',
      category: 'Contatti',
      description: 'Email principale di contatto',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_address',
      value: 'Via Example 123',
      type: 'string',
      category: 'Contatti',
      description: 'Indirizzo stradale',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_city',
      value: 'Milano',
      type: 'string',
      category: 'Contatti',
      description: 'Città sede legale',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_cap',
      value: '20121',
      type: 'string',
      category: 'Contatti',
      description: 'CAP',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_province',
      value: 'MI',
      type: 'string',
      category: 'Contatti',
      description: 'Provincia',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_country',
      value: 'Italia',
      type: 'string',
      category: 'Contatti',
      description: 'Nazione',
      isActive: true,
      isEditable: true
    },
    {
      key: 'contact_hours',
      value: 'Lun-Ven: 9:00-18:00',
      type: 'string',
      category: 'Contatti',
      description: 'Orari di apertura',
      isActive: true,
      isEditable: true
    },
    {
      key: 'support_email',
      value: 'supporto@assistenza.it',
      type: 'email',
      category: 'Contatti',
      description: 'Email per supporto tecnico',
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

    // PRIVACY
    {
      key: 'privacy_policy_url',
      value: '/privacy-policy',
      type: 'url',
      category: 'Privacy',
      description: 'Link alla Privacy Policy',
      isActive: true,
      isEditable: true
    },
    {
      key: 'terms_service_url',
      value: '/terms-of-service',
      type: 'url',
      category: 'Privacy',
      description: 'Link ai Termini di Servizio',
      isActive: true,
      isEditable: true
    },
    {
      key: 'cookie_policy_url',
      value: '/cookie-policy',
      type: 'url',
      category: 'Privacy',
      description: 'Link alla Cookie Policy',
      isActive: true,
      isEditable: true
    },
    {
      key: 'gdpr_enabled',
      value: 'true',
      type: 'boolean',
      category: 'Privacy',
      description: 'Abilita conformità GDPR',
      isActive: true,
      isEditable: true
    },
    {
      key: 'data_retention_days',
      value: '365',
      type: 'number',
      category: 'Privacy',
      description: 'Giorni di retention dei dati',
      isActive: true,
      isEditable: true
    },

    // SISTEMA
    {
      key: 'maintenance_mode',
      value: 'false',
      type: 'boolean',
      category: 'Sistema',
      description: 'Modalità manutenzione',
      isActive: true,
      isEditable: true
    },
    {
      key: 'enable_registration',
      value: 'true',
      type: 'boolean',
      category: 'Sistema',
      description: 'Abilita registrazione nuovi utenti',
      isActive: true,
      isEditable: true
    },
    {
      key: 'enable_2fa',
      value: 'true',
      type: 'boolean',
      category: 'Sistema',
      description: 'Abilita autenticazione a due fattori',
      isActive: true,
      isEditable: true
    },
    {
      key: 'session_timeout_minutes',
      value: '60',
      type: 'number',
      category: 'Sistema',
      description: 'Timeout sessione in minuti',
      isActive: true,
      isEditable: true
    },
    {
      key: 'max_file_upload_size_mb',
      value: '10',
      type: 'number',
      category: 'Sistema',
      description: 'Dimensione massima upload file (MB)',
      isActive: true,
      isEditable: true
    },
    {
      key: 'enable_notifications',
      value: 'true',
      type: 'boolean',
      category: 'Sistema',
      description: 'Abilita sistema notifiche',
      isActive: true,
      isEditable: true
    },
    {
      key: 'backup_enabled',
      value: 'true',
      type: 'boolean',
      category: 'Sistema',
      description: 'Abilita backup automatici',
      isActive: true,
      isEditable: true
    },
    {
      key: 'api_rate_limit',
      value: '100',
      type: 'number',
      category: 'Sistema',
      description: 'Rate limit API (richieste/minuto)',
      isActive: true,
      isEditable: true
    }
  ];

  for (const setting of defaultSettings) {
    try {
      // Controlla se l'impostazione esiste già
      const existing = await prisma.systemSettings.findFirst({
        where: { key: setting.key }
      });

      if (!existing) {
        await prisma.systemSettings.create({
          data: setting as any
        });
        console.log(`✅ Creata impostazione: ${setting.key}`);
      } else {
        console.log(`⏭️  Impostazione già esistente: ${setting.key}`);
      }
    } catch (error) {
      console.error(`❌ Errore creando ${setting.key}:`, error);
    }
  }

  console.log('✅ Popolamento completato!');
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
