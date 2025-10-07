import { PrismaClient, ModuleCategory, SettingType, ModuleAction } from '@prisma/client';

/**
 * Seed completo 66 moduli sistema
 * Organizzati in 9 categorie + settings predefiniti
 */
export async function seedModules(prisma?: PrismaClient) {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  
  console.log('🌱 Seeding moduli sistema...');
  
  // ==========================================
  // 🔴 CATEGORIA: CORE (6 moduli)
  // ==========================================
  const coreModules = [
    {
      code: 'auth',
      name: 'Autenticazione Base',
      description: 'Login JWT, refresh token, session management',
      category: ModuleCategory.CORE,
      isCore: true,
      isEnabled: true,
      icon: '🔐',
      color: '#EF4444',
      order: 1,
      config: {
        jwtExpiry: 30, // giorni
        sessionDuration: 24 // ore
      }
    },
    {
      code: 'auth-2fa',
      name: 'Autenticazione 2FA',
      description: '2FA TOTP con Speakeasy, codici backup',
      category: ModuleCategory.CORE,
      isCore: false,
      isEnabled: true,
      icon: '🔑',
      color: '#DC2626',
      order: 2,
      dependsOn: ['auth']
    },
    {
      code: 'users',
      name: 'Gestione Utenti',
      description: '4 ruoli: CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN',
      category: ModuleCategory.CORE,
      isCore: true,
      isEnabled: true,
      icon: '👥',
      color: '#EF4444',
      order: 3
    },
    {
      code: 'profiles',
      name: 'Profili Utente',
      description: 'Profili dettagliati con campi professionali',
      category: ModuleCategory.CORE,
      isCore: false,
      isEnabled: true,
      icon: '👤',
      color: '#F87171',
      order: 4,
      dependsOn: ['users']
    },
    {
      code: 'security',
      name: 'Sistema Sicurezza',
      description: 'Account lockout, login history, IP tracking',
      category: ModuleCategory.CORE,
      isCore: true,
      isEnabled: true,
      icon: '🛡️',
      color: '#DC2626',
      order: 5
    },
    {
      code: 'session-management',
      name: 'Session Management',
      description: 'Session Redis con multi-device support',
      category: ModuleCategory.CORE,
      isCore: true,
      isEnabled: true,
      icon: '⚡',
      color: '#EF4444',
      order: 6,
      dependsOn: ['auth']
    }
  ];

  // ==========================================
  // 🟢 CATEGORIA: BUSINESS (8 moduli)
  // ==========================================
  const businessModules = [
    {
      code: 'requests',
      name: 'Richieste Assistenza',
      description: 'Sistema completo gestione richieste, 6 stati, 4 priorità',
      category: ModuleCategory.BUSINESS,
      isCore: true,
      isEnabled: true,
      icon: '📋',
      color: '#10B981',
      order: 10,
      dependsOn: ['users', 'categories']
    },
    {
      code: 'request-workflow',
      name: 'Workflow Richieste',
      description: 'Assegnazione manuale/automatica, filtri avanzati',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '🔄',
      color: '#059669',
      order: 11,
      dependsOn: ['requests']
    },
    {
      code: 'quotes',
      name: 'Sistema Preventivi',
      description: 'Quote builder drag-drop, items illimitati, versioning',
      category: ModuleCategory.BUSINESS,
      isCore: true,
      isEnabled: true,
      icon: '💰',
      color: '#10B981',
      order: 12,
      dependsOn: ['requests']
    },
    {
      code: 'quote-templates',
      name: 'Template Preventivi',
      description: '20+ template predefiniti per categoria',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '📄',
      color: '#34D399',
      order: 13,
      dependsOn: ['quotes']
    },
    {
      code: 'quotes-advanced',
      name: 'Preventivi Avanzati',
      description: 'Confronto preventivi, scaglioni km, deposit rules',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '📊',
      color: '#059669',
      order: 14,
      dependsOn: ['quotes']
    },
    {
      code: 'categories',
      name: 'Categorie e Sottocategorie',
      description: 'Gestione gerarchica categorie servizi',
      category: ModuleCategory.BUSINESS,
      isCore: true,
      isEnabled: true,
      icon: '🗂️',
      color: '#10B981',
      order: 15
    },
    {
      code: 'calendar',
      name: 'Calendario Interventi',
      description: 'Calendario con Google Calendar sync bidirezionale',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '📅',
      color: '#3B82F6',
      order: 16,
      dependsOn: ['requests']
    },
    {
      code: 'scheduled-interventions',
      name: 'Interventi Programmati',
      description: 'Scheduling, conferme cliente, conflict detection',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '⏰',
      color: '#2563EB',
      order: 17,
      dependsOn: ['calendar', 'requests']
    }
  ];

  // ==========================================
  // 💳 CATEGORIA: PAYMENTS (5 moduli)
  // ==========================================
  const paymentModules = [
    {
      code: 'payments',
      name: 'Sistema Pagamenti',
      description: 'Stripe integration, 11 tabelle DB, gestione completa',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '💳',
      color: '#10B981',
      order: 20,
      dependsOn: ['quotes'],
      config: {
        provider: 'stripe',
        testMode: true,
        currency: 'EUR'
      }
    },
    {
      code: 'invoices',
      name: 'Sistema Fatturazione',
      description: 'Fatture automatiche, numerazione progressiva',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '🧾',
      color: '#059669',
      order: 21,
      dependsOn: ['payments']
    },
    {
      code: 'payouts',
      name: 'Payout Professionisti',
      description: 'Gestione pagamenti ai professionisti, schedule automatici',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '💸',
      color: '#34D399',
      order: 22,
      dependsOn: ['payments']
    },
    {
      code: 'payment-splits',
      name: 'Payment Splitting',
      description: 'Divisione automatica pagamenti con commissioni',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: false, // Premium feature
      icon: '🔀',
      color: '#10B981',
      order: 23,
      dependsOn: ['payments']
    },
    {
      code: 'refunds',
      name: 'Sistema Rimborsi',
      description: 'Gestione rimborsi totali e parziali',
      category: ModuleCategory.BUSINESS,
      isCore: false,
      isEnabled: true,
      icon: '↩️',
      color: '#F59E0B',
      order: 24,
      dependsOn: ['payments']
    }
  ];

  // ==========================================
  // 💬 CATEGORIA: COMMUNICATION (9 moduli)
  // ==========================================
  const communicationModules = [
    {
      code: 'notifications',
      name: 'Sistema Notifiche',
      description: '8 modelli DB, 4 canali: Email, WebSocket, In-app, WhatsApp',
      category: ModuleCategory.COMMUNICATION,
      isCore: true,
      isEnabled: true,
      icon: '🔔',
      color: '#3B82F6',
      order: 30
    },
    {
      code: 'notification-templates',
      name: 'Template Notifiche',
      description: 'Template Editor WYSIWYG, 50+ eventi trigger',
      category: ModuleCategory.COMMUNICATION,
      isCore: false,
      isEnabled: true,
      icon: '📧',
      color: '#2563EB',
      order: 31,
      dependsOn: ['notifications']
    },
    {
      code: 'notification-queue',
      name: 'Queue Management',
      description: 'Priorità, scheduling, retry logic',
      category: ModuleCategory.COMMUNICATION,
      isCore: false,
      isEnabled: true,
      icon: '📬',
      color: '#60A5FA',
      order: 32,
      dependsOn: ['notifications']
    },
    {
      code: 'chat',
      name: 'Chat Real-time',
      description: 'WebSocket Socket.io, messaggi per richiesta',
      category: ModuleCategory.COMMUNICATION,
      isCore: false,
      isEnabled: true,
      icon: '💬',
      color: '#3B82F6',
      order: 33,
      dependsOn: ['requests']
    },
    {
      code: 'chat-advanced',
      name: 'Chat Avanzata',
      description: 'File sharing, read receipts, typing indicators',
      category: ModuleCategory.COMMUNICATION,
      isCore: false,
      isEnabled: true,
      icon: '💭',
      color: '#2563EB',
      order: 34,
      dependsOn: ['chat']
    },
    {
      code: 'email-system',
      name: 'Sistema Email',
      description: 'Brevo integration, template personalizzati',
      category: ModuleCategory.COMMUNICATION,
      isCore: true,
      isEnabled: true,
      icon: '✉️',
      color: '#3B82F6',
      order: 35
    },
    {
      code: 'whatsapp',
      name: 'WhatsApp Business',
      description: 'WppConnect locale, QR pairing, messaggi/gruppi',
      category: ModuleCategory.COMMUNICATION,
      isCore: false,
      isEnabled: true,
      icon: '📱',
      color: '#25D366',
      order: 36,
      config: {
        provider: 'wppconnect',
        sessionName: 'default',
        autoReconnect: true,
        qrRefreshInterval: 30000
      }
    },
    {
      code: 'whatsapp-groups',
      name: 'WhatsApp Gruppi',
      description: 'Gestione gruppi, broadcast lists, admin',
      category: ModuleCategory.COMMUNICATION,
      isCore: false,
      isEnabled: true,
      icon: '👥',
      color: '#25D366',
      order: 37,
      dependsOn: ['whatsapp']
    },
    {
      code: 'whatsapp-media',
      name: 'WhatsApp Media',
      description: 'Invio immagini, PDF, audio con compressione',
      category: ModuleCategory.COMMUNICATION,
      isCore: false,
      isEnabled: true,
      icon: '📎',
      color: '#25D366',
      order: 38,
      dependsOn: ['whatsapp']
    }
  ];

  // ==========================================
  // 🤖 CATEGORIA: ADVANCED (10 moduli)
  // ==========================================
  const advancedModules = [
    {
      code: 'reviews',
      name: 'Sistema Recensioni',
      description: 'Recensioni 1-5 stelle, commenti, rating medio',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '⭐',
      color: '#F59E0B',
      order: 40,
      dependsOn: ['requests']
    },
    {
      code: 'portfolio',
      name: 'Portfolio Lavori',
      description: 'Foto prima/dopo, gallery professionisti',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '🖼️',
      color: '#EC4899',
      order: 41,
      dependsOn: ['requests']
    },
    {
      code: 'certifications',
      name: 'Certificazioni',
      description: 'Badge certificazioni professionisti verificate',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '📜',
      color: '#8B5CF6',
      order: 42
    },
    {
      code: 'verified-badge',
      name: 'Badge Verificato',
      description: 'Sistema verifica professionisti, documenti, background check',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '✅',
      color: '#10B981',
      order: 43
    },
    {
      code: 'ai-assistant',
      name: 'AI Assistant',
      description: 'Chat AI dual config (Professional + Client)',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '🤖',
      color: '#8B5CF6',
      order: 44,
      config: {
        provider: 'openai',
        defaultModel: 'gpt-3.5-turbo',
        maxTokens: 2048,
        temperature: 0.7
      }
    },
    {
      code: 'ai-categorization',
      name: 'AI Auto-Categorization',
      description: 'Categorizzazione automatica richieste con GPT',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '🎯',
      color: '#7C3AED',
      order: 45,
      dependsOn: ['ai-assistant', 'requests']
    },
    {
      code: 'ai-knowledge-base',
      name: 'Knowledge Base AI',
      description: '10k+ documenti indicizzati, embeddings',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '📚',
      color: '#A78BFA',
      order: 46,
      dependsOn: ['ai-assistant']
    },
    {
      code: 'referral',
      name: 'Sistema Referral',
      description: 'Invita amico, codici referral, rewards',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '🎁',
      color: '#06B6D4',
      order: 47
    },
    {
      code: 'loyalty-points',
      name: 'Punti Fedeltà',
      description: 'Sistema punti, transazioni, rewards',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '🏆',
      color: '#0891B2',
      order: 48,
      dependsOn: ['referral']
    },
    {
      code: 'price-range',
      name: 'Range Prezzi Indicativi',
      description: 'Calcolo automatico range prezzi da storico',
      category: ModuleCategory.ADVANCED,
      isCore: false,
      isEnabled: true,
      icon: '💶',
      color: '#10B981',
      order: 49,
      dependsOn: ['quotes']
    }
  ];

  // ==========================================
  // 📊 CATEGORIA: REPORTING (7 moduli)
  // ==========================================
  const reportingModules = [
    {
      code: 'intervention-reports',
      name: 'Rapporti di Intervento',
      description: '15+ modelli DB, template builder, 50+ campi',
      category: ModuleCategory.REPORTING,
      isCore: false,
      isEnabled: true,
      icon: '📄',
      color: '#6366F1',
      order: 50,
      dependsOn: ['requests']
    },
    {
      code: 'report-templates',
      name: 'Template Rapporti',
      description: '10 tipi intervento, sezioni personalizzabili',
      category: ModuleCategory.REPORTING,
      isCore: false,
      isEnabled: true,
      icon: '📋',
      color: '#818CF8',
      order: 51,
      dependsOn: ['intervention-reports']
    },
    {
      code: 'report-materials',
      name: 'Catalogo Materiali',
      description: '500+ materiali con prezzi, codici',
      category: ModuleCategory.REPORTING,
      isCore: false,
      isEnabled: true,
      icon: '🔧',
      color: '#A5B4FC',
      order: 52,
      dependsOn: ['intervention-reports']
    },
    {
      code: 'report-signatures',
      name: 'Firma Digitale',
      description: 'Firma touch/mouse con timestamp',
      category: ModuleCategory.REPORTING,
      isCore: false,
      isEnabled: true,
      icon: '✍️',
      color: '#4F46E5',
      order: 53,
      dependsOn: ['intervention-reports']
    },
    {
      code: 'report-export',
      name: 'Export PDF Rapporti',
      description: 'PDF A4 con intestazione, logo, watermark',
      category: ModuleCategory.REPORTING,
      isCore: false,
      isEnabled: true,
      icon: '📑',
      color: '#6366F1',
      order: 54,
      dependsOn: ['intervention-reports']
    },
    {
      code: 'analytics',
      name: 'Analytics & KPI',
      description: '20+ metriche, dashboard real-time',
      category: ModuleCategory.REPORTING,
      isCore: false,
      isEnabled: true,
      icon: '📈',
      color: '#6366F1',
      order: 55
    },
    {
      code: 'reports-scheduled',
      name: 'Report Automatici',
      description: 'Email report giornalieri/settimanali',
      category: ModuleCategory.REPORTING,
      isCore: false,
      isEnabled: true,
      icon: '📊',
      color: '#818CF8',
      order: 56,
      dependsOn: ['analytics']
    }
  ];

  // ==========================================
  // ⚙️ CATEGORIA: AUTOMATION (6 moduli)
  // ==========================================
  const automationModules = [
    {
      code: 'backup-system',
      name: 'Sistema Backup',
      description: '6 tipi backup, scheduling, encryption AES-256',
      category: ModuleCategory.AUTOMATION,
      isCore: true,
      isEnabled: true,
      icon: '💾',
      color: '#6366F1',
      order: 60
    },
    {
      code: 'backup-scheduling',
      name: 'Backup Scheduling',
      description: 'Cron scheduling, retention automatica',
      category: ModuleCategory.AUTOMATION,
      isCore: false,
      isEnabled: true,
      icon: '⏰',
      color: '#818CF8',
      order: 61,
      dependsOn: ['backup-system']
    },
    {
      code: 'cleanup-system',
      name: 'Sistema Cleanup',
      description: '8 modelli DB, pattern matching, exclude rules',
      category: ModuleCategory.AUTOMATION,
      isCore: false,
      isEnabled: true,
      icon: '🧹',
      color: '#F59E0B',
      order: 62
    },
    {
      code: 'cleanup-scheduling',
      name: 'Cleanup Automatico',
      description: 'Cron scheduling pulizia automatica',
      category: ModuleCategory.AUTOMATION,
      isCore: false,
      isEnabled: true,
      icon: '⏱️',
      color: '#FBBF24',
      order: 63,
      dependsOn: ['cleanup-system']
    },
    {
      code: 'scheduler',
      name: 'Sistema Scheduler',
      description: 'Cron jobs, notifiche automatiche, security jobs',
      category: ModuleCategory.AUTOMATION,
      isCore: true,
      isEnabled: true,
      icon: '⚙️',
      color: '#6366F1',
      order: 64
    },
    {
      code: 'queue-system',
      name: 'Bull Queue',
      description: 'Queue operazioni asincrone, 5 worker paralleli',
      category: ModuleCategory.AUTOMATION,
      isCore: true,
      isEnabled: true,
      icon: '📬',
      color: '#3B82F6',
      order: 65
    }
  ];

  // ==========================================
  // 🔗 CATEGORIA: INTEGRATIONS (5 moduli)
  // ==========================================
  const integrationModules = [
    {
      code: 'google-maps',
      name: 'Google Maps',
      description: 'Places, Geocoding, Directions, Distance Matrix',
      category: ModuleCategory.INTEGRATIONS,
      isCore: false,
      isEnabled: true,
      icon: '🗺️',
      color: '#10B981',
      order: 70,
      config: {
        provider: 'google',
        cacheEnabled: true,
        cacheTTL: 86400 // 24h
      }
    },
    {
      code: 'google-calendar',
      name: 'Google Calendar',
      description: 'Sync bidirezionale calendario',
      category: ModuleCategory.INTEGRATIONS,
      isCore: false,
      isEnabled: true,
      icon: '📆',
      color: '#3B82F6',
      order: 71,
      dependsOn: ['calendar']
    },
    {
      code: 'stripe',
      name: 'Stripe Payments',
      description: 'Gateway pagamenti, webhook',
      category: ModuleCategory.INTEGRATIONS,
      isCore: false,
      isEnabled: true,
      icon: '💳',
      color: '#635BFF',
      order: 72,
      config: {
        testMode: true,
        webhookSecret: null
      }
    },
    {
      code: 'brevo-email',
      name: 'Brevo Email Service',
      description: 'SMTP email service provider',
      category: ModuleCategory.INTEGRATIONS,
      isCore: false,
      isEnabled: true,
      icon: '📧',
      color: '#0B996E',
      order: 73
    },
    {
      code: 'openai',
      name: 'OpenAI API',
      description: 'GPT models, embeddings',
      category: ModuleCategory.INTEGRATIONS,
      isCore: false,
      isEnabled: true,
      icon: '🧠',
      color: '#10A37F',
      order: 74,
      dependsOn: ['ai-assistant']
    }
  ];

  // ==========================================
  // 🛠️ CATEGORIA: ADMIN (10 moduli)
  // ==========================================
  const adminModules = [
    {
      code: 'admin-dashboard',
      name: 'Dashboard Admin',
      description: '15+ tab organizzate per funzione',
      category: ModuleCategory.ADMIN,
      isCore: true,
      isEnabled: true,
      icon: '🎛️',
      color: '#6366F1',
      order: 80
    },
    {
      code: 'user-management',
      name: 'Gestione Utenti Admin',
      description: 'CRUD utenti, role management',
      category: ModuleCategory.ADMIN,
      isCore: true,
      isEnabled: true,
      icon: '👥',
      color: '#818CF8',
      order: 81
    },
    {
      code: 'system-settings',
      name: 'System Settings',
      description: '50+ configurazioni sistema',
      category: ModuleCategory.ADMIN,
      isCore: true,
      isEnabled: true,
      icon: '⚙️',
      color: '#6366F1',
      order: 82
    },
    {
      code: 'script-manager',
      name: 'Script Manager',
      description: 'Esecuzione sicura script sistema',
      category: ModuleCategory.ADMIN,
      isCore: false,
      isEnabled: true,
      icon: '🔧',
      color: '#8B5CF6',
      order: 83
    },
    {
      code: 'health-monitor',
      name: 'Health Monitor',
      description: '15 moduli monitorati, check ogni 5min',
      category: ModuleCategory.ADMIN,
      isCore: true,
      isEnabled: true,
      icon: '❤️',
      color: '#EF4444',
      order: 84
    },
    {
      code: 'audit-log',
      name: 'Audit Log System',
      description: '40+ azioni tracciate, compliance GDPR',
      category: ModuleCategory.ADMIN,
      isCore: true,
      isEnabled: true,
      icon: '📝',
      color: '#6366F1',
      order: 85
    },
    {
      code: 'api-keys',
      name: 'API Keys Management',
      description: 'Gestione chiavi API, rate limiting',
      category: ModuleCategory.ADMIN,
      isCore: false,
      isEnabled: true,
      icon: '🔑',
      color: '#10B981',
      order: 86
    },
    {
      code: 'legal-documents',
      name: 'Documenti Legali',
      description: 'Privacy policy, terms, cookie policy, versioning',
      category: ModuleCategory.ADMIN,
      isCore: false,
      isEnabled: true,
      icon: '⚖️',
      color: '#6366F1',
      order: 87
    },
    {
      code: 'enum-manager',
      name: 'Enum Manager',
      description: 'Gestione configurazioni sistema',
      category: ModuleCategory.ADMIN,
      isCore: false,
      isEnabled: true,
      icon: '📊',
      color: '#818CF8',
      order: 88
    },
    {
      code: 'test-history',
      name: 'Test History',
      description: 'Tracking esecuzione test, coverage 75%',
      category: ModuleCategory.ADMIN,
      isCore: false,
      isEnabled: true,
      icon: '🧪',
      color: '#8B5CF6',
      order: 89
    }
  ];

  // ==========================================
  // MERGE TUTTI I MODULI
  // ==========================================
  const allModules = [
    ...coreModules,
    ...businessModules,
    ...paymentModules,
    ...communicationModules,
    ...advancedModules,
    ...reportingModules,
    ...automationModules,
    ...integrationModules,
    ...adminModules
  ];

  console.log(`📦 Seeding ${allModules.length} moduli...`);

  let created = 0;
  let updated = 0;

  for (const moduleData of allModules) {
    const existing = await prisma.systemModule.findUnique({
      where: { code: moduleData.code }
    });

    await prisma.systemModule.upsert({
      where: { code: moduleData.code },
      create: moduleData,
      update: {
        name: moduleData.name,
        description: moduleData.description,
        category: moduleData.category,
        icon: moduleData.icon,
        color: moduleData.color,
        order: moduleData.order,
        dependsOn: moduleData.dependsOn || [],
        config: moduleData.config
      }
    });

    if (existing) {
      updated++;
    } else {
      created++;
    }
  }

  console.log(`✅ Seed completato!`);
  console.log(`   📦 Totale moduli: ${allModules.length}`);
  console.log(`   ✨ Nuovi: ${created}`);
  console.log(`   🔄 Aggiornati: ${updated}`);
  console.log('');
  console.log('📊 Breakdown per categoria:');
  console.log(`   🔴 CORE: ${coreModules.length}`);
  console.log(`   🟢 BUSINESS: ${businessModules.length}`);
  console.log(`   💳 PAYMENTS: ${paymentModules.length}`);
  console.log(`   💬 COMMUNICATION: ${communicationModules.length}`);
  console.log(`   🤖 ADVANCED: ${advancedModules.length}`);
  console.log(`   📊 REPORTING: ${reportingModules.length}`);
  console.log(`   ⚙️ AUTOMATION: ${automationModules.length}`);
  console.log(`   🔗 INTEGRATIONS: ${integrationModules.length}`);
  console.log(`   🛠️ ADMIN: ${adminModules.length}`);
}

/**
 * Seed settings predefiniti per moduli chiave
 */
export async function seedModuleSettings(prisma?: PrismaClient) {
  if (!prisma) {
    const { PrismaClient } = await import('@prisma/client');
    prisma = new PrismaClient();
  }
  
  console.log('🔧 Seeding settings moduli...');

  const settingsData = [
    // WhatsApp Settings
    {
      moduleCode: 'whatsapp',
      key: 'session_name',
      value: 'default',
      type: SettingType.STRING,
      label: 'Nome Sessione',
      description: 'Nome univoco della sessione WhatsApp',
      isRequired: true,
      order: 1
    },
    {
      moduleCode: 'whatsapp',
      key: 'qr_refresh_interval',
      value: '30000',
      type: SettingType.NUMBER,
      label: 'Intervallo Refresh QR (ms)',
      description: 'Ogni quanto rigenerare il QR code',
      validation: { min: 10000, max: 120000 },
      order: 2
    },
    {
      moduleCode: 'whatsapp',
      key: 'auto_reconnect',
      value: 'true',
      type: SettingType.BOOLEAN,
      label: 'Auto Riconnessione',
      description: 'Riconnetti automaticamente in caso di disconnessione',
      order: 3
    },

    // AI Settings
    {
      moduleCode: 'ai-assistant',
      key: 'openai_api_key',
      value: '',
      type: SettingType.PASSWORD,
      label: 'OpenAI API Key',
      description: 'Chiave API per OpenAI',
      isRequired: true,
      isSecret: true,
      order: 1
    },
    {
      moduleCode: 'ai-assistant',
      key: 'default_model',
      value: 'gpt-3.5-turbo',
      type: SettingType.STRING,
      label: 'Modello Default',
      description: 'Modello GPT da utilizzare di default',
      order: 2
    },
    {
      moduleCode: 'ai-assistant',
      key: 'max_tokens',
      value: '2048',
      type: SettingType.NUMBER,
      label: 'Max Tokens',
      description: 'Numero massimo di token per risposta',
      validation: { min: 100, max: 4000 },
      order: 3
    },

    // Stripe Settings
    {
      moduleCode: 'stripe',
      key: 'secret_key',
      value: '',
      type: SettingType.PASSWORD,
      label: 'Secret Key',
      description: 'Stripe Secret Key',
      isRequired: true,
      isSecret: true,
      order: 1
    },
    {
      moduleCode: 'stripe',
      key: 'webhook_secret',
      value: '',
      type: SettingType.PASSWORD,
      label: 'Webhook Secret',
      description: 'Stripe Webhook Secret',
      isSecret: true,
      order: 2
    },
    {
      moduleCode: 'stripe',
      key: 'test_mode',
      value: 'true',
      type: SettingType.BOOLEAN,
      label: 'Modalità Test',
      description: 'Usa chiavi di test invece che produzione',
      order: 3
    },

    // Google Maps Settings
    {
      moduleCode: 'google-maps',
      key: 'api_key',
      value: '',
      type: SettingType.PASSWORD,
      label: 'API Key',
      description: 'Google Maps API Key',
      isRequired: true,
      isSecret: true,
      order: 1
    },
    {
      moduleCode: 'google-maps',
      key: 'cache_enabled',
      value: 'true',
      type: SettingType.BOOLEAN,
      label: 'Cache Abilitata',
      description: 'Abilita caching geocoding',
      order: 2
    },
    {
      moduleCode: 'google-maps',
      key: 'cache_ttl',
      value: '86400',
      type: SettingType.NUMBER,
      label: 'Cache TTL (secondi)',
      description: 'Durata cache geocoding',
      validation: { min: 3600, max: 604800 },
      order: 3
    },

    // Backup Settings
    {
      moduleCode: 'backup-system',
      key: 'retention_days',
      value: '30',
      type: SettingType.NUMBER,
      label: 'Giorni Retention',
      description: 'Giorni di conservazione backup',
      validation: { min: 7, max: 365 },
      order: 1
    },
    {
      moduleCode: 'backup-system',
      key: 'encryption_enabled',
      value: 'true',
      type: SettingType.BOOLEAN,
      label: 'Encryption Abilitata',
      description: 'Cripta backup con AES-256',
      order: 2
    },

    // Reviews Settings
    {
      moduleCode: 'reviews',
      key: 'min_reviews_for_rating',
      value: '5',
      type: SettingType.NUMBER,
      label: 'Min Recensioni per Rating',
      description: 'Numero minimo recensioni per mostrare rating',
      validation: { min: 1, max: 20 },
      order: 1
    },
    {
      moduleCode: 'reviews',
      key: 'allow_edit_days',
      value: '7',
      type: SettingType.NUMBER,
      label: 'Giorni Modifica Recensione',
      description: 'Giorni entro cui modificare recensione',
      validation: { min: 0, max: 30 },
      order: 2
    }
  ];

  let settingsCreated = 0;
  let settingsUpdated = 0;

  for (const setting of settingsData) {
    const existing = await prisma.moduleSetting.findUnique({
      where: {
        moduleCode_key: {
          moduleCode: setting.moduleCode,
          key: setting.key
        }
      }
    });

    await prisma.moduleSetting.upsert({
      where: {
        moduleCode_key: {
          moduleCode: setting.moduleCode,
          key: setting.key
        }
      },
      create: setting,
      update: {
        label: setting.label,
        description: setting.description,
        type: setting.type,
        validation: setting.validation,
        order: setting.order
      }
    });

    if (existing) {
      settingsUpdated++;
    } else {
      settingsCreated++;
    }
  }

  console.log(`✅ ${settingsData.length} settings seeded!`);
  console.log(`   ✨ Nuovi: ${settingsCreated}`);
  console.log(`   🔄 Aggiornati: ${settingsUpdated}`);
}
