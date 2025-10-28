-- ============================================
-- INSERIMENTO DOCUMENTI LEGALI EFFETTIVI
-- ============================================

-- Pulisce solo i documenti legali
DELETE FROM "UserLegalAcceptance";
DELETE FROM "LegalDocumentVersion";
DELETE FROM "LegalDocument";

-- ============================================
-- 1. DOCUMENTI BASE
-- ============================================

INSERT INTO "LegalDocument" (
    id, type, "internalName", "displayName", description,
    "isActive", "isRequired", "requiresAcceptance", "sortOrder",
    "createdAt", "updatedAt"
) VALUES 
-- Privacy Policy
('legal-privacy', 'PRIVACY_POLICY', 'privacy-policy-2025',
 'Informativa sulla Privacy', 
 'Informativa completa sul trattamento dei dati personali ai sensi del GDPR',
 true, true, true, 1, NOW(), NOW()),

-- Termini di Servizio
('legal-terms', 'TERMS_SERVICE', 'terms-service-2025',
 'Termini e Condizioni di Servizio',
 'Termini e condizioni complete per utilizzo della piattaforma',
 true, true, true, 2, NOW(), NOW()),

-- Cookie Policy  
('legal-cookie', 'COOKIE_POLICY', 'cookie-policy-2025',
 'Cookie Policy',
 'Informativa completa sui cookie utilizzati',
 true, true, true, 3, NOW(), NOW());

-- ============================================
-- 2. VERSIONI DEI DOCUMENTI
-- ============================================

-- Privacy Policy Version
INSERT INTO "LegalDocumentVersion" (
    id, "documentId", version, title, content, "contentPlain",
    summary, "effectiveDate", status, language, "requiresAccept",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'legal-privacy',
    '1.0.0',
    'Informativa Privacy GDPR',
    '<div class="legal-content"><h1>Informativa sulla Privacy</h1><p>Documento completo privacy policy...</p></div>',
    'Testo semplificato privacy policy',
    'Informativa GDPR completa',
    '2025-01-01',
    'PUBLISHED',
    'it',
    true,
    NOW(),
    NOW()
);

-- Terms of Service Version
INSERT INTO "LegalDocumentVersion" (
    id, "documentId", version, title, content, "contentPlain",
    summary, "effectiveDate", status, language, "requiresAccept",
    "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'legal-terms',
    '1.0.0',
    'Termini e Condizioni',
    '<div class="legal-content"><h1>Termini di Servizio</h1><p>Documento completo termini...</p></div>',
    'Testo semplificato termini',
    'Termini e condizioni complete',
    '2025-01-01',
    'PUBLISHED',
    'it',
    true,
    NOW(),
    NOW()
);

-- Cookie Policy Version
INSERT INTO "LegalDocumentVersion" (
    id, "documentId", version, title, content, "contentPlain",
    summary, "effectiveDate", status, language, "requiresAccept",
    "createdAt", "updatedAt"  
) VALUES (
    gen_random_uuid()::text,
    'legal-cookie',
    '1.0.0',
    'Cookie Policy',
    '<div class="legal-content"><h1>Cookie Policy</h1><p>Documento completo cookie policy...</p></div>',
    'Testo semplificato cookie policy',
    'Informativa cookie completa',
    '2025-01-01',
    'PUBLISHED',
    'it',
    true,
    NOW(),
    NOW()
);

-- VERIFICA
SELECT 
    ld.type,
    ld."displayName",
    ld."isActive",
    ldv.version,
    ldv.status
FROM "LegalDocument" ld
JOIN "LegalDocumentVersion" ldv ON ldv."documentId" = ld.id
ORDER BY ld."sortOrder";
