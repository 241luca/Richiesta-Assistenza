-- Script per inserire documenti legali di esempio
-- Eseguire con: npx prisma db execute --file=scripts/insert-sample-legal-docs.sql

-- Prima ottieni un user ID valido (assumiamo che ci sia almeno un admin)
-- Useremo un ID fisso per semplicità, ma in produzione dovresti ottenere un ID reale

-- Inserisci i documenti principali
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "icon",
    "isActive", 
    "isRequired", 
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES 
(
    'legal-doc-privacy-001',
    'PRIVACY_POLICY',
    'privacy-policy-2025',
    'Informativa sulla Privacy',
    'Informativa sul trattamento dei dati personali ai sensi del GDPR',
    'ShieldCheckIcon',
    true,
    true,
    1,
    NOW(),
    NOW(),
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1)
),
(
    'legal-doc-terms-001',
    'TERMS_SERVICE',
    'terms-service-2025',
    'Termini e Condizioni',
    'Termini e condizioni di utilizzo del servizio',
    'DocumentTextIcon',
    true,
    true,
    2,
    NOW(),
    NOW(),
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1)
),
(
    'legal-doc-cookie-001',
    'COOKIE_POLICY',
    'cookie-policy-2025',
    'Politica sui Cookie',
    'Informativa sull''utilizzo dei cookie e tecnologie simili',
    'CakeIcon',
    true,
    false,
    3,
    NOW(),
    NOW(),
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1)
);

-- Inserisci versioni pubblicate per ogni documento
INSERT INTO "LegalDocumentVersion" (
    "id",
    "documentId",
    "version",
    "title",
    "content",
    "contentPlain",
    "summary",
    "effectiveDate",
    "language",
    "status",
    "requiresAccept",
    "notifyUsers",
    "createdAt",
    "updatedAt",
    "createdBy",
    "publishedAt",
    "publishedBy"
) VALUES
(
    'legal-ver-privacy-001',
    'legal-doc-privacy-001',
    '1.0.0',
    'Informativa sulla Privacy - v1.0',
    '<h1>Informativa sulla Privacy</h1><p>Questa è l''informativa sulla privacy del nostro servizio di richiesta assistenza.</p><h2>1. Dati raccolti</h2><p>Raccogliamo i seguenti dati personali:</p><ul><li>Nome e cognome</li><li>Email</li><li>Numero di telefono</li><li>Indirizzo</li></ul><h2>2. Finalità del trattamento</h2><p>I dati sono utilizzati per fornire il servizio di assistenza richiesto.</p><h2>3. Base giuridica</h2><p>Il trattamento si basa sul consenso dell''interessato e sull''esecuzione di un contratto.</p>',
    'Informativa sulla Privacy. Questa è l''informativa sulla privacy del nostro servizio...',
    'Prima versione dell''informativa privacy conforme al GDPR',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    true,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1),
    NOW() - INTERVAL '30 days',
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1)
),
(
    'legal-ver-terms-001',
    'legal-doc-terms-001',
    '1.0.0',
    'Termini e Condizioni - v1.0',
    '<h1>Termini e Condizioni di Servizio</h1><p>Benvenuto nel nostro servizio di richiesta assistenza.</p><h2>1. Accettazione dei termini</h2><p>Utilizzando questo servizio, accetti i presenti termini e condizioni.</p><h2>2. Descrizione del servizio</h2><p>Il nostro servizio mette in contatto clienti con professionisti qualificati.</p><h2>3. Obblighi dell''utente</h2><p>L''utente si impegna a fornire informazioni veritiere e accurate.</p>',
    'Termini e Condizioni di Servizio. Benvenuto nel nostro servizio...',
    'Prima versione dei termini di servizio',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    true,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1),
    NOW() - INTERVAL '30 days',
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1)
),
(
    'legal-ver-cookie-001',
    'legal-doc-cookie-001',
    '1.0.0',
    'Cookie Policy - v1.0',
    '<h1>Politica sui Cookie</h1><p>Questo sito utilizza i cookie per migliorare l''esperienza utente.</p><h2>1. Cosa sono i cookie</h2><p>I cookie sono piccoli file di testo salvati sul tuo dispositivo.</p><h2>2. Tipi di cookie utilizzati</h2><ul><li>Cookie tecnici: necessari per il funzionamento</li><li>Cookie analitici: per migliorare il servizio</li><li>Cookie di preferenza: per salvare le tue impostazioni</li></ul>',
    'Politica sui Cookie. Questo sito utilizza i cookie...',
    'Prima versione della cookie policy',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    false,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1),
    NOW() - INTERVAL '30 days',
    (SELECT id FROM "User" WHERE role = 'ADMIN' OR role = 'SUPER_ADMIN' LIMIT 1)
);
