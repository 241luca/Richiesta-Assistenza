-- ============================================
-- INSERIMENTO SOLO DOCUMENTI LEGALI
-- NON TOCCA NESSUN'ALTRA TABELLA!
-- ============================================

-- Prima verifico se esistono già
DO $$
BEGIN
    -- Se non esistono documenti legali, li inserisco
    IF NOT EXISTS (SELECT 1 FROM "LegalDocument" WHERE type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY')) THEN
        
        -- PRIVACY POLICY
        INSERT INTO "LegalDocument" (
            id, type, "internalName", "displayName", description,
            "isActive", "isRequired", "requiresAcceptance", "sortOrder",
            "createdAt", "updatedAt"
        ) VALUES (
            'doc-privacy-full', 'PRIVACY_POLICY', 'privacy-policy-2025',
            'Informativa sulla Privacy e Protezione dei Dati',
            'Informativa completa sul trattamento dei dati personali ai sensi del GDPR',
            true, true, true, 1, NOW(), NOW()
        );

        -- TERMS OF SERVICE
        INSERT INTO "LegalDocument" (
            id, type, "internalName", "displayName", description,
            "isActive", "isRequired", "requiresAcceptance", "sortOrder",
            "createdAt", "updatedAt"
        ) VALUES (
            'doc-terms-full', 'TERMS_SERVICE', 'terms-service-2025',
            'Termini e Condizioni di Servizio',
            'Termini e condizioni complete per utilizzo della piattaforma',
            true, true, true, 2, NOW(), NOW()
        );

        -- COOKIE POLICY
        INSERT INTO "LegalDocument" (
            id, type, "internalName", "displayName", description,
            "isActive", "isRequired", "requiresAcceptance", "sortOrder",
            "createdAt", "updatedAt"
        ) VALUES (
            'doc-cookie-full', 'COOKIE_POLICY', 'cookie-policy-2025',
            'Cookie Policy',
            'Informativa completa sui cookie e tecnologie simili',
            true, true, true, 3, NOW(), NOW()
        );

        RAISE NOTICE 'Documenti legali inseriti';
    ELSE
        RAISE NOTICE 'Documenti legali già esistenti';
    END IF;
END $$;

-- Inserisco le versioni SOLO se i documenti esistono e non hanno versioni
-- PRIVACY POLICY VERSION
INSERT INTO "LegalDocumentVersion" (
    id, "documentId", version, title, content, "contentPlain",
    summary, "effectiveDate", status, language, "requiresAccept",
    "createdAt", "updatedAt"
)
SELECT 
    'ver-privacy-' || gen_random_uuid()::text,
    ld.id,
    '1.0.0',
    'Informativa sulla Privacy - GDPR 2025',
    '<h1>Informativa sulla Privacy</h1><p>Contenuto privacy policy completo...</p>',
    'Testo semplificato privacy',
    'Informativa GDPR completa',
    '2025-01-01',
    'PUBLISHED',
    'it',
    true,
    NOW(),
    NOW()
FROM "LegalDocument" ld
WHERE ld.type = 'PRIVACY_POLICY'
AND NOT EXISTS (
    SELECT 1 FROM "LegalDocumentVersion" 
    WHERE "documentId" = ld.id
);

-- TERMS VERSION
INSERT INTO "LegalDocumentVersion" (
    id, "documentId", version, title, content, "contentPlain",
    summary, "effectiveDate", status, language, "requiresAccept",
    "createdAt", "updatedAt"
)
SELECT 
    'ver-terms-' || gen_random_uuid()::text,
    ld.id,
    '1.0.0',
    'Termini e Condizioni di Servizio',
    '<h1>Termini di Servizio</h1><p>Contenuto termini completo...</p>',
    'Testo semplificato termini',
    'Termini e condizioni complete',
    '2025-01-01',
    'PUBLISHED',
    'it',
    true,
    NOW(),
    NOW()
FROM "LegalDocument" ld
WHERE ld.type = 'TERMS_SERVICE'
AND NOT EXISTS (
    SELECT 1 FROM "LegalDocumentVersion" 
    WHERE "documentId" = ld.id
);

-- COOKIE VERSION
INSERT INTO "LegalDocumentVersion" (
    id, "documentId", version, title, content, "contentPlain",
    summary, "effectiveDate", status, language, "requiresAccept",
    "createdAt", "updatedAt"
)
SELECT 
    'ver-cookie-' || gen_random_uuid()::text,
    ld.id,
    '1.0.0',
    'Cookie Policy',
    '<h1>Cookie Policy</h1><p>Contenuto cookie policy completo...</p>',
    'Testo semplificato cookie',
    'Informativa cookie completa',
    '2025-01-01',
    'PUBLISHED',
    'it',
    true,
    NOW(),
    NOW()
FROM "LegalDocument" ld
WHERE ld.type = 'COOKIE_POLICY'
AND NOT EXISTS (
    SELECT 1 FROM "LegalDocumentVersion" 
    WHERE "documentId" = ld.id
);

-- VERIFICA FINALE
SELECT 
    ld.type,
    ld."displayName",
    ld."isActive",
    COUNT(ldv.id) as versions
FROM "LegalDocument" ld
LEFT JOIN "LegalDocumentVersion" ldv ON ldv."documentId" = ld.id
WHERE ld.type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY')
GROUP BY ld.id, ld.type, ld."displayName", ld."isActive";
