import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedScripts() {
  console.log('🌱 Seeding script configurations...');

  const scripts = [
    {
      scriptName: 'check-system',
      displayName: 'Controllo Sistema',
      description: 'Verifica completa dello stato del sistema di sviluppo',
      category: 'UTILITY' as const,
      risk: 'LOW' as const,
      filePath: '/scripts/check-system.sh',
      timeout: 60000,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'ArrowPathIcon',
      color: 'blue',
      order: 1,
      purpose: 'Verifica completa dello stato del sistema di sviluppo',
      whenToUse: "All'inizio di ogni sessione di lavoro o quando qualcosa non funziona",
      whatItChecks: [
        'Node.js e NPM installati e versioni',
        'Database PostgreSQL connesso e tabelle presenti',
        'Redis server attivo e funzionante',
        'Porte 3200 (backend) e 5193 (frontend) libere o occupate',
        'Struttura directory del progetto completa',
        'File critici presenti (package.json, schema.prisma, etc.)',
        'Dipendenze installate (node_modules)',
        'Errori TypeScript nel codice',
        'Stato Git e file modificati'
      ],
      interpreteOutput: {
        '✅ Verde': 'Tutto funziona correttamente',
        '⚠️ Giallo': 'Attenzione, potrebbe esserci un problema non bloccante',
        '❌ Rosso': 'Errore che deve essere risolto'
      },
      commonIssues: [
        'Port already in use: Un servizio sta già usando quella porta',
        'Database not connected: Controlla DATABASE_URL nel file .env',
        'Redis not running: Avvia Redis con redis-server',
        'Missing directories: Alcune cartelle del progetto mancano'
      ],
      hasQuickMode: false,
      isComplexScript: false,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    },
    {
      scriptName: 'pre-commit-check',
      displayName: 'Controllo Pre-Commit',
      description: 'Controlli completi prima di salvare il codice su Git',
      category: 'TESTING' as const,
      risk: 'LOW' as const,
      filePath: '/scripts/pre-commit-check.sh',
      timeout: 60000,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PROFESSIONAL'],
      icon: 'CheckCircleIcon',
      color: 'green',
      order: 2,
      purpose: 'Controlli completi prima di salvare il codice su Git',
      whenToUse: 'SEMPRE prima di fare un commit su Git',
      whatItChecks: [
        'TypeScript: Nessun errore di compilazione',
        'ResponseFormatter: Usato in TUTTE le routes (obbligatorio)',
        'ResponseFormatter: NON usato nei services (vietato)',
        'Console.log: Rilevamento di statement di debug dimenticati',
        'File backup: Presenza di file .backup da non committare',
        'Prisma: Client generato e sincronizzato',
        'Tailwind CSS: Versione corretta (v3, non v4)',
        'Build: Il progetto compila correttamente'
      ],
      interpreteOutput: {
        '✅ All checks passed': 'Puoi procedere con il commit',
        '⚠️ Warnings': 'Puoi committare ma è meglio sistemare',
        '❌ Errors found': 'DEVI correggere prima di committare'
      },
      commonIssues: [
        'ResponseFormatter not found: Aggiungi ResponseFormatter.success() nelle routes',
        'TypeScript errors: Correggi gli errori di tipo nel codice',
        'Console.log found: Rimuovi i console.log dal codice',
        'Build failed: Il codice non compila, controlla gli errori'
      ],
      hasQuickMode: false,
      isComplexScript: false,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    },
    {
      scriptName: 'validate-work',
      displayName: 'Valida Modifiche',
      description: 'Controlla solo le modifiche fatte nella sessione corrente',
      category: 'TESTING' as const,
      risk: 'LOW' as const,
      filePath: '/scripts/validate-work.sh',
      timeout: 60000,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PROFESSIONAL'],
      icon: 'ExclamationTriangleIcon',
      color: 'yellow',
      order: 3,
      purpose: 'Controlla solo le modifiche fatte nella sessione corrente',
      whenToUse: 'Dopo aver scritto codice, per verificare velocemente le modifiche',
      whatItChecks: [
        'File modificati: Lista di tutti i file cambiati',
        'Routes modificate: Controllo ResponseFormatter nelle routes cambiate',
        'Services modificati: Verifica che NON usino ResponseFormatter',
        'Nuovi file: Controllo che non siano file backup',
        'Import corretti: React Query invece di fetch diretto',
        'Console.log: Nei nuovi codici aggiunti',
        'TypeScript: Errori solo nei file modificati'
      ],
      interpreteOutput: {
        'Modified files': 'Elenco dei file che hai modificato',
        '✅ OK': 'Il file rispetta le regole',
        '❌ Missing ResponseFormatter': 'Aggiungi ResponseFormatter nella route',
        '⚠️ Backup file': 'Non committare file di backup'
      },
      commonIssues: [
        'ResponseFormatter in services: Rimuovilo, va solo nelle routes',
        'Direct fetch usage: Usa React Query invece di fetch',
        'New console.log: Rimuovi i console.log aggiunti'
      ],
      hasQuickMode: false,
      isComplexScript: false,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    },
    {
      scriptName: 'claude-help',
      displayName: 'Guida Sviluppatore',
      description: 'Mostra la guida rapida con le regole del progetto',
      category: 'UTILITY' as const,
      risk: 'LOW' as const,
      filePath: '/scripts/claude-help.sh',
      timeout: 30000,
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'PROFESSIONAL', 'CLIENT'],
      icon: 'CommandLineIcon',
      color: 'purple',
      order: 4,
      purpose: 'Guida rapida per sviluppatori con le regole del progetto',
      whenToUse: 'Quando non ricordi le regole o hai dubbi su come fare qualcosa',
      whatItChecks: [
        'Non esegue controlli, mostra solo informazioni'
      ],
      interpreteOutput: {
        "Le 5 Regole d'Oro": 'Regole fondamentali da non dimenticare MAI',
        'Comandi Rapidi': 'Lista dei comandi più utili',
        'File Importanti': 'Documenti e file critici del progetto',
        'Troubleshooting': 'Soluzioni ai problemi comuni',
        'Errori da Evitare': 'Cosa NON fare mai'
      },
      commonIssues: [
        'È una guida di riferimento, non un controllo',
        'Consultala quando hai dubbi sulle best practices',
        'Contiene esempi di codice corretto vs sbagliato'
      ],
      hasQuickMode: false,
      isComplexScript: false,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    },
    {
      scriptName: 'request-system-check-complete',
      displayName: 'Analisi Completa Modulo Richieste',
      description: 'Analisi dettagliata e completa del modulo richieste con 17 sezioni di controlli',
      category: 'ANALYSIS' as const,
      risk: 'MEDIUM' as const,
      filePath: '/scripts/request-system-check-complete.sh',
      timeout: 300000, // 5 minuti
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'DocumentMagnifyingGlassIcon',
      color: 'cyan',
      order: 5,
      purpose: "🔍 Esegue un'analisi approfondita e dettagliata del modulo Richieste Assistenza con 17 sezioni di controlli specifici",
      whenToUse: 'Quando vuoi verificare in modo completo che il modulo richieste funzioni correttamente. Ideale per controlli periodici approfonditi o dopo modifiche importanti al sistema.',
      whatItChecks: [
        '📊 DATABASE E MODELLI: Connessione, schema Prisma, modello AssistanceRequest, relazioni, statistiche record',
        '🎨 PAGINE FRONTEND: Verifica presenza di tutte le pagine (Lista, Dettaglio, Nuova, Modifica, Admin)',
        '📘 TYPESCRIPT: Compilazione senza errori di routes e services, strict mode attivo',
        '🌐 API ROUTES: Tutti gli endpoint /api/requests (GET, POST, PUT, PATCH, DELETE)',
        '⚙️ SERVICES: Funzioni del service layer, transazioni, query optimization, paginazione',
        '🔗 INTEGRAZIONI: Collegamenti con Preventivi, Notifiche, Chat, Maps, AI, Pagamenti, Email',
        '🔐 SICUREZZA: RBAC, controllo ownership, protezione SQL injection, rate limiting',
        '⚡ PERFORMANCE: Indici database, cache Redis, lazy loading, operazioni bulk',
        '📋 WORKFLOW: Stati (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED), priorità, regole business',
        '🧪 TEST: Presenza file di test, configurazione Jest/Vitest',
        '🔌 WEBSOCKET: Eventi real-time, notifiche push, listener frontend',
        '📊 METRICHE: Performance monitoring, timing, aggregazioni, complessità query',
        '📚 DOCUMENTAZIONE: JSDoc nel codice, commenti inline, documentazione API',
        '🔢 VERSIONING: Controllo versioning API (v1, v2), deprecation warnings',
        '📝 LOGGING: Uso del logger invece di console.log, livelli di log, configurazione',
        '💾 BACKUP: Integrazione con sistema backup, export dati',
        '🔔 MONITORING: Health check endpoint, alerting, metriche business'
      ],
      interpreteOutput: {
        '✅ Verde (Passato)': 'Il controllo è completato con successo, tutto funziona',
        '⚠️ Giallo (Warning)': 'Funziona ma può essere migliorato, non bloccante',
        '❌ Rosso (Errore)': 'Problema che deve essere risolto, potrebbe causare malfunzionamenti',
        'ℹ️ Blu (Info)': 'Informazione utile ma non richiede azione',
        '📊 Health Score': 'Percentuale di salute del modulo (>80% ottimo, 60-80% buono, <60% critico)'
      },
      commonIssues: [
        'ResponseFormatter non trovato nelle routes: Aggiungi ResponseFormatter.success() in tutte le routes',
        'ResponseFormatter trovato nei services: ERRORE! Deve essere solo nelle routes, mai nei services',
        'TypeScript errors: Correggi gli errori di tipo prima di procedere',
        'Console.log trovati: Sostituisci con logger.info() o logger.debug()',
        'Transazioni non utilizzate: Usa prisma.$transaction per operazioni multiple',
        'Cache non implementata: Considera Redis per migliorare performance',
        'Test non trovati: Aggiungi test unitari e di integrazione',
        'Documentazione mancante: Aggiungi JSDoc sopra le funzioni principali',
        'Health Score basso: Controlla prima gli errori rossi, poi i warning gialli'
      ],
      sections: [
        { number: 1, name: 'DATABASE E MODELLI PRISMA', description: 'Verifica connessione, schema e relazioni' },
        { number: 2, name: 'PAGINE FRONTEND', description: 'Controlla presenza componenti React' },
        { number: 3, name: 'CONTROLLI TYPESCRIPT', description: 'Compilazione e type checking' },
        { number: 4, name: 'API ROUTES', description: 'Verifica tutti gli endpoint REST' },
        { number: 5, name: 'SERVICES LAYER', description: 'Business logic e query optimization' },
        { number: 6, name: 'INTEGRAZIONI', description: 'Collegamenti con altri moduli' },
        { number: 7, name: 'SICUREZZA E PERMESSI', description: 'RBAC e protezioni' },
        { number: 8, name: 'OTTIMIZZAZIONI PERFORMANCE', description: 'Cache, indici, lazy loading' },
        { number: 9, name: 'WORKFLOW E BUSINESS LOGIC', description: 'Stati e regole di business' },
        { number: 10, name: 'TEST E QUALITÀ', description: 'Coverage e test automatici' },
        { number: 11, name: 'WEBSOCKET E REAL-TIME', description: 'Eventi e notifiche push' },
        { number: 12, name: 'METRICHE E PERFORMANCE API', description: 'Monitoring e timing' },
        { number: 13, name: 'DOCUMENTAZIONE CODICE', description: 'JSDoc e commenti' },
        { number: 14, name: 'VERSIONING API', description: 'Gestione versioni endpoint' },
        { number: 15, name: 'SISTEMA DI LOGGING', description: 'Logger strutturato' },
        { number: 16, name: 'INTEGRAZIONE BACKUP', description: 'Export e backup dati' },
        { number: 17, name: 'MONITORING E ALERTING', description: 'Health check e alerts' }
      ],
      hasQuickMode: true,
      isComplexScript: true,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    },
    {
      scriptName: 'quote-system-check-complete',
      displayName: 'Analisi Completa Modulo Preventivi',
      description: 'Verifica dettagliata del modulo preventivi con 17 sezioni di controlli specifici',
      category: 'ANALYSIS' as const,
      risk: 'MEDIUM' as const,
      filePath: '/scripts/quote-system-check-complete.sh',
      timeout: 300000, // 5 minuti
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'CurrencyDollarIcon',
      color: 'emerald',
      order: 6,
      purpose: '💰 Verifica dettagliata del modulo Quote (Preventivi) con controlli specifici per calcoli, versioning e workflow',
      whenToUse: 'Esegui questo script per verificare completamente il modulo preventivi, inclusi calcoli prezzi, IVA, scadenze, versioning e integrazioni.',
      whatItChecks: [
        '📊 DATABASE: Modelli Quote, QuoteVersion, materiali e relazioni',
        '💼 BUSINESS LOGIC: Calcolo prezzi (manodopera + materiali + trasferimento)',
        '🧮 CALCOLI: Gestione IVA/tasse, scaglioni chilometrici, sconti',
        '📅 SCADENZE: Sistema di scadenza preventivi automatica',
        '📝 VERSIONING: Sistema versioning per modifiche preventivi',
        '📄 TEMPLATE: Template preventivi per categoria',
        '✉️ WORKFLOW: Stati (DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED)',
        '🔐 PERMESSI: Solo professionisti creano, clienti accettano/rifiutano',
        '📧 NOTIFICHE: Invio email al cliente, notifiche in-app',
        '📑 PDF: Generazione PDF con watermark e numerazione',
        '🤝 NEGOZIAZIONE: Sistema counter-offer e trattative',
        '💱 MULTI-VALUTA: Supporto EUR, USD, altre valute',
        '🎁 PROMOZIONI: Sistema sconti e codici promo',
        '📊 STATISTICHE: Conversion rate, importo medio, tempo risposta',
        '🔗 INTEGRAZIONI: Con Richieste, Pagamenti, Notifiche',
        '⚡ PERFORMANCE: Paginazione, cache, query optimization',
        '🧪 TESTING: Test calcoli, workflow, integrazioni'
      ],
      interpreteOutput: {
        '✅ Verde': 'Funzionalità implementata e funzionante',
        '⚠️ Giallo': 'Funzionalità parziale o migliorabile',
        '❌ Rosso': 'Errore critico o funzionalità mancante',
        'ℹ️ Info': 'Funzionalità opzionale non implementata',
        '📊 Health Score': '>80% sistema preventivi ottimo'
      },
      commonIssues: [
        'Calcolo totale errato: Verifica formula laborCost + materialCost + travelCost',
        'IVA non calcolata: Aggiungi campo VAT e calcolo percentuale',
        'Scadenza non gestita: Implementa job schedulato per check scadenze',
        'Versioning mancante: Crea tabella QuoteVersion per storico',
        'PDF non generato: Verifica integrazione PDFKit',
        'Manca integrazione richieste: Quote deve riferirsi a AssistanceRequest',
        'Stati non gestiti: Implementa macchina a stati per transizioni'
      ],
      sections: [
        { number: 1, name: 'DATABASE E MODELLI', description: 'Quote, QuoteVersion, relazioni' },
        { number: 2, name: 'PAGINE FRONTEND', description: 'Lista, dettaglio, creazione, modifica' },
        { number: 3, name: 'TYPESCRIPT BACKEND', description: 'Type checking e compilazione' },
        { number: 4, name: 'API ROUTES', description: 'CRUD + send, accept, reject, duplicate' },
        { number: 5, name: 'SERVICES LAYER', description: 'Logica calcoli e workflow' },
        { number: 6, name: 'BUSINESS LOGIC PREVENTIVI', description: 'Calcoli, IVA, scadenze' },
        { number: 7, name: 'INTEGRAZIONI', description: 'Richieste, notifiche, email, PDF' },
        { number: 8, name: 'WORKFLOW E STATI', description: 'Macchina a stati preventivo' },
        { number: 9, name: 'SICUREZZA E PERMESSI', description: 'RBAC e ownership' },
        { number: 10, name: 'TESTING', description: 'Test unitari e integrazione' },
        { number: 11, name: 'PERFORMANCE', description: 'Cache, paginazione, indici' },
        { number: 12, name: 'DOCUMENTAZIONE', description: 'JSDoc e commenti' },
        { number: 13, name: 'WEBSOCKET', description: 'Eventi real-time' },
        { number: 14, name: 'LOGGING', description: 'Logger vs console.log' },
        { number: 15, name: 'FUNZIONALITÀ AVANZATE', description: 'Sconti, multi-valuta, negoziazione' },
        { number: 16, name: 'BACKUP', description: 'Export e archiviazione' },
        { number: 17, name: 'MONITORING', description: 'Metriche e alerting' }
      ],
      hasQuickMode: true,
      isComplexScript: true,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    },
    {
      scriptName: 'intervention-report-check-complete',
      displayName: 'Analisi Completa Modulo Rapporti',
      description: 'Analisi completa del modulo rapporti intervento con 17 sezioni di verifiche',
      category: 'ANALYSIS' as const,
      risk: 'MEDIUM' as const,
      filePath: '/scripts/intervention-report-check-complete.sh',
      timeout: 300000, // 5 minuti
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'DocumentTextIcon',
      color: 'amber',
      order: 7,
      purpose: '📋 Verifica dettagliata del modulo InterventionReport con controlli per firma digitale, materiali, template e PDF',
      whenToUse: 'Usa questo script per verificare il modulo rapporti intervento, inclusi numerazione, ore lavoro, materiali, firme digitali e generazione PDF.',
      whatItChecks: [
        '📊 DATABASE: InterventionReport, ReportTemplate, ReportMaterial, ReportSignature',
        '🔢 NUMERAZIONE: Sistema numerazione automatica rapporti',
        '⏱️ ORE LAVORO: Calcolo automatico durata intervento',
        '🛠️ MATERIALI: Gestione materiali utilizzati con prezzi',
        '📝 TEMPLATE: Template personalizzabili per tipo intervento',
        '💬 FRASI PREDEFINITE: Sistema frasi rapide per compilazione',
        '📸 FOTO: Upload e gestione foto prima/dopo intervento',
        '✍️ FIRMA DIGITALE: Canvas per firma cliente e professionista',
        '📄 PDF: Generazione PDF con watermark e QR code',
        '📍 GEOLOCALIZZAZIONE: Coordinate GPS intervento',
        '📧 INVIO: Sistema invio rapporto via email',
        '📋 STATI: DRAFT, COMPLETED, SIGNED, SENT',
        '🔒 BLOCCO MODIFICA: Rapporto non modificabile dopo firma',
        '🗄️ ARCHIVIAZIONE: Sistema archivio rapporti',
        '🔗 COLLEGAMENTI: Con richieste, preventivi, fatturazione',
        '⚡ OTTIMIZZAZIONI: Query, paginazione, cache',
        '🧪 QUALITÀ: Test, documentazione, logging'
      ],
      interpreteOutput: {
        '✅ Verde': 'Funzionalità presente e funzionante',
        '⚠️ Giallo': 'Funzionalità parziale, può essere migliorata',
        '❌ Rosso': 'Problema critico, deve essere risolto',
        'ℹ️ Info': 'Funzionalità opzionale non presente',
        '📊 Health Score': '>80% modulo rapporti eccellente'
      },
      commonIssues: [
        'Numerazione mancante: Implementa contatore progressivo annuale',
        'Calcolo ore errato: Verifica differenza workEndTime - workStartTime',
        'Materiali non gestiti: Crea tabella ReportMaterial con prezzi',
        'Firma non funziona: Implementa canvas HTML5 per cattura firma',
        'PDF non generato: Verifica PDFKit e template',
        'Template mancanti: Crea ReportTemplate per tipi intervento',
        'Foto non caricate: Verifica upload con Multer',
        'Manca collegamento richiesta: InterventionReport deve riferirsi a AssistanceRequest'
      ],
      sections: [
        { number: 1, name: 'DATABASE E MODELLI', description: 'Report e tabelle correlate' },
        { number: 2, name: 'PAGINE FRONTEND', description: 'Lista, creazione, firma' },
        { number: 3, name: 'TYPESCRIPT', description: 'Type checking backend' },
        { number: 4, name: 'API ROUTES', description: 'CRUD + sign, send, PDF' },
        { number: 5, name: 'SERVICES', description: 'Business logic rapporti' },
        { number: 6, name: 'BUSINESS LOGIC', description: 'Numerazione, ore, materiali' },
        { number: 7, name: 'INTEGRAZIONI', description: 'Richieste, preventivi, notifiche' },
        { number: 8, name: 'WORKFLOW', description: 'Stati e transizioni' },
        { number: 9, name: 'SICUREZZA', description: 'Permessi e ownership' },
        { number: 10, name: 'TESTING', description: 'Test e qualità' },
        { number: 11, name: 'PERFORMANCE', description: 'Ottimizzazioni' },
        { number: 12, name: 'DOCUMENTAZIONE', description: 'JSDoc e commenti' },
        { number: 13, name: 'REAL-TIME', description: 'WebSocket e notifiche' },
        { number: 14, name: 'LOGGING', description: 'Sistema log' },
        { number: 15, name: 'FUNZIONALITÀ AVANZATE', description: 'Foto, QR, geolocalizzazione' },
        { number: 16, name: 'BACKUP', description: 'Export e archivio' },
        { number: 17, name: 'MONITORING', description: 'Metriche e alert' }
      ],
      hasQuickMode: true,
      isComplexScript: true,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    },
    {
      scriptName: 'audit-system-check',
      displayName: 'Analisi Completa Sistema Audit',
      description: 'Verifica completa del sistema di audit log e tracciamento con 17 sezioni',
      category: 'ANALYSIS' as const,
      risk: 'MEDIUM' as const,
      filePath: '/scripts/audit-system-check.sh',
      timeout: 300000, // 5 minuti
      requiresConfirmation: false,
      allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
      icon: 'ScaleIcon',
      color: 'red',
      order: 8,
      purpose: '⚖️ Verifica dettagliata del sistema di Audit Log e tracciamento con controlli su middleware, retention, alert e compliance',
      whenToUse: 'Esegui per verificare il sistema di audit log, controllare che tutti gli eventi vengano tracciati, verificare retention policies e sistema alert.',
      whatItChecks: [
        '📊 DATABASE: AuditLog, AuditLogRetention, AuditLogAlert',
        '📝 CAMPI ESSENZIALI: action, userId, ipAddress, userAgent, oldValues, newValues',
        '🏷️ CATEGORIZZAZIONE: AUTH, DATA, ADMIN, SYSTEM, SECURITY',
        '🚨 SEVERITY LEVELS: INFO, WARNING, ERROR, CRITICAL',
        '🔌 MIDDLEWARE: auditLogger integrato in routes e server.ts',
        '📊 STATISTICHE: Log per categoria, severity, utente, periodo',
        '🗓️ RETENTION: Politiche pulizia automatica per categoria',
        '🚨 ALERT SYSTEM: Alert automatici su eventi critici',
        '🔍 RICERCA: Ricerca avanzata, filtri, export',
        '📈 DASHBOARD: Componenti visualizzazione e analisi',
        '🔐 SICUREZZA: Solo admin accedono, RBAC implementato',
        '🔗 INTEGRAZIONI: Con Auth, Richieste, Preventivi, Utenti',
        '🕵️ ANOMALY DETECTION: Rilevamento comportamenti sospetti',
        '📊 COMPLIANCE: GDPR, privacy, forensic analysis',
        '💾 EXPORT: CSV, JSON, PDF per analisi',
        '⚡ PERFORMANCE: Indici, paginazione, batch operations',
        '📚 DOCUMENTAZIONE: JSDoc in middleware, service, routes'
      ],
      interpreteOutput: {
        '✅ Verde': 'Sistema audit funzionante',
        '⚠️ Giallo': 'Funzionalità da migliorare',
        '❌ Rosso': 'Problema critico audit',
        'ℹ️ Info': 'Feature avanzata opzionale',
        '📊 Health Score': '>80% audit system affidabile'
      },
      commonIssues: [
        'Middleware non integrato: Aggiungi auditLogger a server.ts',
        'Log non salvati: Verifica connessione DB e tabella AuditLog',
        'Categorie mancanti: Definisci enum AuditCategory in schema',
        'Retention non attiva: Implementa job pulizia schedulato',
        'Alert non configurati: Crea AuditLogAlert per eventi critici',
        'Dashboard assente: Crea componenti visualizzazione audit',
        'Integrazione Auth mancante: CRITICO! Logga login/logout',
        'Export non funziona: Verifica json2csv e generazione report'
      ],
      sections: [
        { number: 1, name: 'DATABASE', description: 'Tabelle e campi audit' },
        { number: 2, name: 'FRONTEND', description: 'Dashboard e componenti' },
        { number: 3, name: 'TYPESCRIPT', description: 'Type checking' },
        { number: 4, name: 'API ROUTES', description: 'Endpoints audit' },
        { number: 5, name: 'SERVICES', description: 'Business logic' },
        { number: 6, name: 'MIDDLEWARE', description: 'auditLogger integration' },
        { number: 7, name: 'BUSINESS LOGIC', description: 'Retention, alert, export' },
        { number: 8, name: 'INTEGRAZIONI', description: 'Con altri moduli' },
        { number: 9, name: 'CATEGORIE', description: 'Categories e severity' },
        { number: 10, name: 'TESTING', description: 'Test audit system' },
        { number: 11, name: 'PERFORMANCE', description: 'Ottimizzazioni' },
        { number: 12, name: 'DOCUMENTAZIONE', description: 'JSDoc' },
        { number: 13, name: 'REAL-TIME', description: 'Dashboard updates' },
        { number: 14, name: 'LOGGING', description: 'Meta-logging' },
        { number: 15, name: 'AVANZATE', description: 'Anomaly, forensic, compliance' },
        { number: 16, name: 'BACKUP', description: 'Archive e restore' },
        { number: 17, name: 'MONITORING', description: 'Health e metrics' }
      ],
      hasQuickMode: true,
      isComplexScript: true,
      isEnabled: true,
      isVisible: true,
      isDangerous: false
    }
  ];

  // Delete existing configurations
  await prisma.scriptConfiguration.deleteMany();
  console.log('🗑️  Cleared existing script configurations');

  // Insert new configurations
  for (const script of scripts) {
    await prisma.scriptConfiguration.create({
      data: script
    });
    console.log(`✅ Created script configuration: ${script.displayName}`);
  }

  console.log(`\n🎉 Successfully seeded ${scripts.length} script configurations!`);
}

async function main() {
  try {
    await seedScripts();
  } catch (error) {
    console.error('❌ Error seeding scripts:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
