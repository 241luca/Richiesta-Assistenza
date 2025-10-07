-- ============================================
-- INSERIMENTO DOCUMENTI LEGALI
-- Script definitivo che usa l'admin esistente dal seed
-- ============================================

-- Inserisce i 3 documenti legali usando l'utente admin@assistenza.it dal seed
DO $$
DECLARE
    admin_id TEXT;
BEGIN
    -- Usa l'admin del seed (admin@assistenza.it)
    SELECT id INTO admin_id FROM "User" WHERE email = 'admin@assistenza.it';
    
    IF admin_id IS NULL THEN
        RAISE EXCEPTION 'Admin non trovato. Esegui prima: cd backend && npm run seed';
    END IF;

    -- Pulisce documenti esistenti
    DELETE FROM "UserLegalAcceptance" WHERE "documentId" IN (
        SELECT id FROM "LegalDocument" WHERE type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY')
    );
    DELETE FROM "LegalDocumentVersion" WHERE "documentId" IN (
        SELECT id FROM "LegalDocument" WHERE type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY')
    );
    DELETE FROM "LegalDocument" WHERE type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY');

    -- PRIVACY POLICY
    INSERT INTO "LegalDocument" (id, type, "internalName", "displayName", description, "isActive", "isRequired", "sortOrder", "createdAt", "updatedAt", "createdBy")
    VALUES ('privacy-2025', 'PRIVACY_POLICY', 'privacy-2025', 'Privacy Policy', 'Informativa GDPR completa', true, true, 1, NOW(), NOW(), admin_id);

    INSERT INTO "LegalDocumentVersion" (id, "documentId", version, title, content, "effectiveDate", language, status, "requiresAccept", "notifyUsers", "createdAt", "updatedAt", "createdBy")
    VALUES ('privacy-v1', 'privacy-2025', '1.0.0', 'Privacy Policy', '<h1>Privacy Policy</h1><p>Contenuto completo nei file separati</p>', '2025-01-18', 'it', 'PUBLISHED', true, false, NOW(), NOW(), admin_id);

    -- TERMS OF SERVICE
    INSERT INTO "LegalDocument" (id, type, "internalName", "displayName", description, "isActive", "isRequired", "sortOrder", "createdAt", "updatedAt", "createdBy")
    VALUES ('terms-2025', 'TERMS_SERVICE', 'terms-2025', 'Termini di Servizio', 'Termini e condizioni', true, true, 2, NOW(), NOW(), admin_id);

    INSERT INTO "LegalDocumentVersion" (id, "documentId", version, title, content, "effectiveDate", language, status, "requiresAccept", "notifyUsers", "createdAt", "updatedAt", "createdBy")
    VALUES ('terms-v1', 'terms-2025', '1.0.0', 'Termini di Servizio', '<h1>Termini</h1><p>Contenuto completo nei file separati</p>', '2025-01-18', 'it', 'PUBLISHED', true, false, NOW(), NOW(), admin_id);

    -- COOKIE POLICY
    INSERT INTO "LegalDocument" (id, type, "internalName", "displayName", description, "isActive", "isRequired", "sortOrder", "createdAt", "updatedAt", "createdBy")
    VALUES ('cookie-2025', 'COOKIE_POLICY', 'cookie-2025', 'Cookie Policy', 'Informativa cookie', true, true, 3, NOW(), NOW(), admin_id);

    INSERT INTO "LegalDocumentVersion" (id, "documentId", version, title, content, "effectiveDate", language, status, "requiresAccept", "notifyUsers", "createdAt", "updatedAt", "createdBy")
    VALUES ('cookie-v1', 'cookie-2025', '1.0.0', 'Cookie Policy', '<h1>Cookie</h1><p>Contenuto completo nei file separati</p>', '2025-01-18', 'it', 'PUBLISHED', true, false, NOW(), NOW(), admin_id);

    RAISE NOTICE '✅ Documenti inseriti con successo!';
END $$;