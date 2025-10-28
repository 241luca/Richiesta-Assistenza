-- ============================================
-- SCRIPT SICURO IMPORTAZIONE DOCUMENTI LEGALI
-- Data: 23 Ottobre 2025
-- Descrizione: Importa solo i 3 documenti legali mancanti senza toccare dati esistenti
-- ============================================

-- Usa SUPER_ADMIN esistente come createdBy
DO $$
DECLARE
    admin_user_id TEXT;
    privacy_doc_id TEXT;
    terms_doc_id TEXT;
    cookie_doc_id TEXT;
BEGIN
    -- Ottieni ID SUPER_ADMIN
    SELECT id INTO admin_user_id 
    FROM "User" 
    WHERE role = 'SUPER_ADMIN' 
    AND email = 'admin@assistenza.it'
    LIMIT 1;

    IF admin_user_id IS NULL THEN
        RAISE EXCEPTION 'SUPER_ADMIN non trovato! Impossibile procedere.';
    END IF;

    RAISE NOTICE 'Usando SUPER_ADMIN: %', admin_user_id;

    -- ==========================================
    -- 1. PRIVACY POLICY
    -- ==========================================
    
    -- Verifica se esiste già
    IF NOT EXISTS (SELECT 1 FROM "LegalDocument" WHERE type = 'PRIVACY_POLICY') THEN
        privacy_doc_id := gen_random_uuid()::text;
        
        INSERT INTO "LegalDocument" (
            id, type, "internalName", "displayName", description,
            "isActive", "isRequired", "sortOrder",
            "createdAt", "updatedAt", "createdBy"
        ) VALUES (
            privacy_doc_id,
            'PRIVACY_POLICY',
            'privacy-policy-2025',
            'Informativa sulla Privacy e Protezione dei Dati',
            'Informativa completa sul trattamento dei dati personali ai sensi del GDPR e normativa italiana',
            true, true, 1,
            NOW(), NOW(), admin_user_id
        );

        -- Inserisci versione 1.0.0
        INSERT INTO "LegalDocumentVersion" (
            id, "documentId", version, title, content, "contentPlain",
            summary, "effectiveDate", status, language, "requiresAccept",
            "createdAt", "updatedAt", "createdBy"
        ) VALUES (
            gen_random_uuid()::text,
            privacy_doc_id,
            '1.0.0',
            'Informativa sulla Privacy - GDPR 2025',
            E'<!-- Contenuto HTML Privacy Policy verrà aggiornato dal file separato -->
<div class="legal-document privacy-policy">
    <h1>Informativa sulla Privacy e Protezione dei Dati Personali</h1>
    <p class="last-updated">Ultimo aggiornamento: Gennaio 2025 • Versione: 1.0.0</p>
    <p>Documento completo da aggiornare con contenuto da PRIVACY-POLICY-COMPLETA.html</p>
</div>',
            'Informativa privacy completa GDPR 2025',
            'Informativa completa sul trattamento dei dati personali',
            '2025-01-20',
            'PUBLISHED',
            'it',
            true,
            NOW(), NOW(), admin_user_id
        );
        
        RAISE NOTICE 'PRIVACY_POLICY inserita con ID: %', privacy_doc_id;
    ELSE
        RAISE NOTICE 'PRIVACY_POLICY già esistente, skip';
    END IF;

    -- ==========================================
    -- 2. TERMS OF SERVICE
    -- ==========================================
    
    IF NOT EXISTS (SELECT 1 FROM "LegalDocument" WHERE type = 'TERMS_SERVICE') THEN
        terms_doc_id := gen_random_uuid()::text;
        
        INSERT INTO "LegalDocument" (
            id, type, "internalName", "displayName", description,
            "isActive", "isRequired", "sortOrder",
            "createdAt", "updatedAt", "createdBy"
        ) VALUES (
            terms_doc_id,
            'TERMS_SERVICE',
            'terms-service-2025',
            'Termini e Condizioni di Servizio',
            'Termini e condizioni complete per utilizzo della piattaforma Richiesta Assistenza',
            true, true, 2,
            NOW(), NOW(), admin_user_id
        );

        INSERT INTO "LegalDocumentVersion" (
            id, "documentId", version, title, content, "contentPlain",
            summary, "effectiveDate", status, language, "requiresAccept",
            "createdAt", "updatedAt", "createdBy"
        ) VALUES (
            gen_random_uuid()::text,
            terms_doc_id,
            '1.0.0',
            'Termini e Condizioni di Servizio',
            E'<!-- Contenuto HTML Terms Service verrà aggiornato dal file separato -->
<div class="legal-document terms-service">
    <h1>Termini e Condizioni di Servizio</h1>
    <p class="last-updated">Ultimo aggiornamento: Gennaio 2025 • Versione: 1.0.0</p>
    <p>Documento completo da aggiornare con contenuto da TERMINI-SERVIZIO-COMPLETO.html</p>
</div>',
            'Termini di servizio completi',
            'Termini e condizioni complete per utilizzo della piattaforma',
            '2025-01-20',
            'PUBLISHED',
            'it',
            true,
            NOW(), NOW(), admin_user_id
        );
        
        RAISE NOTICE 'TERMS_SERVICE inseriti con ID: %', terms_doc_id;
    ELSE
        RAISE NOTICE 'TERMS_SERVICE già esistenti, skip';
    END IF;

    -- ==========================================
    -- 3. COOKIE POLICY
    -- ==========================================
    
    IF NOT EXISTS (SELECT 1 FROM "LegalDocument" WHERE type = 'COOKIE_POLICY') THEN
        cookie_doc_id := gen_random_uuid()::text;
        
        INSERT INTO "LegalDocument" (
            id, type, "internalName", "displayName", description,
            "isActive", "isRequired", "sortOrder",
            "createdAt", "updatedAt", "createdBy"
        ) VALUES (
            cookie_doc_id,
            'COOKIE_POLICY',
            'cookie-policy-2025',
            'Cookie Policy',
            'Informativa completa sull''utilizzo dei cookie e tecnologie simili',
            true, true, 3,
            NOW(), NOW(), admin_user_id
        );

        INSERT INTO "LegalDocumentVersion" (
            id, "documentId", version, title, content, "contentPlain",
            summary, "effectiveDate", status, language, "requiresAccept",
            "createdAt", "updatedAt", "createdBy"
        ) VALUES (
            gen_random_uuid()::text,
            cookie_doc_id,
            '1.0.0',
            'Cookie Policy',
            E'<!-- Contenuto HTML Cookie Policy verrà aggiornato dal file separato -->
<div class="legal-document cookie-policy">
    <h1>Cookie Policy</h1>
    <p class="last-updated">Ultimo aggiornamento: Gennaio 2025 • Versione: 1.0.0</p>
    <p>Documento completo da aggiornare con contenuto da COOKIE-POLICY-COMPLETO.html</p>
</div>',
            'Cookie policy completa',
            'Informativa completa sull''utilizzo dei cookie',
            '2025-01-20',
            'PUBLISHED',
            'it',
            true,
            NOW(), NOW(), admin_user_id
        );
        
        RAISE NOTICE 'COOKIE_POLICY inserita con ID: %', cookie_doc_id;
    ELSE
        RAISE NOTICE 'COOKIE_POLICY già esistente, skip';
    END IF;

    -- Commit transaction
    RAISE NOTICE '✅ Importazione completata con successo!';
    
END $$;

-- ==========================================
-- VERIFICA FINALE
-- ==========================================

SELECT 
    type,
    "displayName",
    "isActive",
    "createdBy",
    (SELECT COUNT(*) FROM "LegalDocumentVersion" WHERE "documentId" = ld.id) as versions
FROM "LegalDocument" ld
WHERE type IN ('PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY')
ORDER BY "sortOrder";
