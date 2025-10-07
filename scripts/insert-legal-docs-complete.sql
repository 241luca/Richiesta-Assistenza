-- ============================================
-- INSERIMENTO DOCUMENTI LEGALI CON UTENTE ADMIN
-- Usa l'email admin@assistenza.it dal seed
-- ============================================

-- Trova l'ID dell'admin usando l'email dal seed
DO $$
DECLARE
    admin_id TEXT;
BEGIN
    -- Cerca l'admin usando l'email dal seed
    SELECT id INTO admin_id FROM "User" 
    WHERE email = 'admin@assistenza.it'
    LIMIT 1;
    
    -- Se non esiste, prova con staff
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM "User" 
        WHERE email = 'staff@assistenza.it'
        LIMIT 1;
    END IF;
    
    -- Se ancora non esiste, cerca qualsiasi admin
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM "User" 
        WHERE role IN ('ADMIN', 'SUPER_ADMIN')
        LIMIT 1;
    END IF;
    
    -- Se ancora NULL, solleva un errore informativo
    IF admin_id IS NULL THEN
        RAISE NOTICE 'Nessun utente admin trovato. Assicurati di aver eseguito prima: npx prisma db seed';
        RAISE EXCEPTION 'Esegui prima: cd backend && npx prisma db seed';
    END IF;

    -- Elimina eventuali documenti esistenti per evitare duplicati
    DELETE FROM "UserLegalAcceptance" WHERE "documentId" IN (
        SELECT id FROM "LegalDocument" WHERE type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY')
    );
    DELETE FROM "LegalDocumentVersion" WHERE "documentId" IN (
        SELECT id FROM "LegalDocument" WHERE type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY')
    );
    DELETE FROM "LegalDocument" WHERE type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY');

    -- 1. INSERIMENTO PRIVACY POLICY
    INSERT INTO "LegalDocument" (
        id,
        type,
        "internalName",
        "displayName",
        description,
        icon,
        "isActive",
        "isRequired",
        "sortOrder",
        metadata,
        "createdAt",
        "updatedAt",
        "createdBy"
    ) VALUES (
        'privacy-policy-2025',
        'PRIVACY_POLICY',
        'privacy-policy-2025',
        'Informativa sulla Privacy e Protezione dei Dati',
        'Informativa completa sul trattamento dei dati personali ai sensi del GDPR',
        'shield-check',
        true,
        true,
        1,
        '{"category": "legal", "tags": ["gdpr", "privacy"]}',
        NOW(),
        NOW(),
        admin_id
    );

    -- 2. INSERIMENTO TERMINI DI SERVIZIO
    INSERT INTO "LegalDocument" (
        id,
        type,
        "internalName",
        "displayName",
        description,
        icon,
        "isActive",
        "isRequired",
        "sortOrder",
        metadata,
        "createdAt",
        "updatedAt",
        "createdBy"
    ) VALUES (
        'terms-service-2025',
        'TERMS_SERVICE',
        'terms-service-2025',
        'Termini e Condizioni di Servizio',
        'Termini e condizioni complete per l''utilizzo della piattaforma',
        'document-text',
        true,
        true,
        2,
        '{"category": "legal", "tags": ["terms", "conditions"]}',
        NOW(),
        NOW(),
        admin_id
    );

    -- 3. INSERIMENTO COOKIE POLICY
    INSERT INTO "LegalDocument" (
        id,
        type,
        "internalName",
        "displayName",
        description,
        icon,
        "isActive",
        "isRequired",
        "sortOrder",
        metadata,
        "createdAt",
        "updatedAt",
        "createdBy"
    ) VALUES (
        'cookie-policy-2025',
        'COOKIE_POLICY',
        'cookie-policy-2025',
        'Cookie Policy',
        'Informativa sull''utilizzo dei cookie e tecnologie simili',
        'computer-desktop',
        true,
        true,
        3,
        '{"category": "legal", "tags": ["cookie", "privacy"]}',
        NOW(),
        NOW(),
        admin_id
    );

    -- INSERIMENTO VERSIONI (semplificate per test)
    -- Privacy Policy Version
    INSERT INTO "LegalDocumentVersion" (
        id,
        "documentId",
        version,
        "versionNotes",
        title,
        content,
        "contentPlain",
        summary,
        "effectiveDate",
        language,
        status,
        "requiresAccept",
        "notifyUsers",
        "createdAt",
        "updatedAt",
        "createdBy"
    ) VALUES (
        'privacy-v1',
        'privacy-policy-2025',
        '1.0.0',
        'Prima versione',
        'Informativa Privacy GDPR',
        '<div class="prose max-w-none">
            <h1>Informativa sulla Privacy</h1>
            <p>Documento completo disponibile.</p>
            <p>Per il contenuto completo, esegui gli script con i documenti completi.</p>
        </div>',
        'Informativa privacy semplificata',
        'Prima versione della privacy policy',
        '2025-01-18',
        'it',
        'PUBLISHED',
        true,
        false,
        NOW(),
        NOW(),
        admin_id
    );

    -- Terms of Service Version
    INSERT INTO "LegalDocumentVersion" (
        id,
        "documentId",
        version,
        "versionNotes",
        title,
        content,
        "contentPlain",
        summary,
        "effectiveDate",
        language,
        status,
        "requiresAccept",
        "notifyUsers",
        "createdAt",
        "updatedAt",
        "createdBy"
    ) VALUES (
        'terms-v1',
        'terms-service-2025',
        '1.0.0',
        'Prima versione',
        'Termini di Servizio',
        '<div class="prose max-w-none">
            <h1>Termini e Condizioni</h1>
            <p>Documento completo disponibile.</p>
            <p>Per il contenuto completo, esegui gli script con i documenti completi.</p>
        </div>',
        'Termini di servizio semplificati',
        'Prima versione dei termini',
        '2025-01-18',
        'it',
        'PUBLISHED',
        true,
        false,
        NOW(),
        NOW(),
        admin_id
    );

    -- Cookie Policy Version
    INSERT INTO "LegalDocumentVersion" (
        id,
        "documentId",
        version,
        "versionNotes",
        title,
        content,
        "contentPlain",
        summary,
        "effectiveDate",
        language,
        status,
        "requiresAccept",
        "notifyUsers",
        "createdAt",
        "updatedAt",
        "createdBy"
    ) VALUES (
        'cookie-v1',
        'cookie-policy-2025',
        '1.0.0',
        'Prima versione',
        'Cookie Policy',
        '<div class="prose max-w-none">
            <h1>Cookie Policy</h1>
            <p>Documento completo disponibile.</p>
            <p>Per il contenuto completo, esegui gli script con i documenti completi.</p>
        </div>',
        'Informativa cookie semplificata',
        'Prima versione cookie policy',
        '2025-01-18',
        'it',
        'PUBLISHED',
        true,
        false,
        NOW(),
        NOW(),
        admin_id
    );

    RAISE NOTICE '✅ Documenti legali inseriti con successo!';
    RAISE NOTICE '📋 Privacy Policy: ID = privacy-policy-2025';
    RAISE NOTICE '📋 Terms of Service: ID = terms-service-2025';
    RAISE NOTICE '📋 Cookie Policy: ID = cookie-policy-2025';
    RAISE NOTICE '👤 Creati dall''utente con ID: %', admin_id;

END $$;