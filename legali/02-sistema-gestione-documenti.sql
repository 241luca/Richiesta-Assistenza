-- ============================================
-- POPOLAMENTO COMPLETO SISTEMA GESTIONE DOCUMENTI
-- PRIMA I METADATI, POI I DOCUMENTI
-- ============================================

-- ============================================
-- 1. TIPI DOCUMENTO (DocumentType)
-- ============================================
INSERT INTO "DocumentType" (id, code, name, description, category, "requiresApproval", "isActive", "createdAt", "updatedAt") VALUES
('dt-1', 'PRIVACY_POLICY', 'Privacy Policy', 'Informativa sulla privacy e trattamento dati', 'LEGAL', false, true, NOW(), NOW()),
('dt-2', 'TERMS_SERVICE', 'Termini di Servizio', 'Termini e condizioni di utilizzo', 'LEGAL', false, true, NOW(), NOW()),
('dt-3', 'COOKIE_POLICY', 'Cookie Policy', 'Informativa sui cookie', 'LEGAL', false, true, NOW(), NOW()),
('dt-4', 'DPA', 'Data Processing Agreement', 'Accordo per il trattamento dati', 'LEGAL', true, true, NOW(), NOW()),
('dt-5', 'SLA', 'Service Level Agreement', 'Accordo sui livelli di servizio', 'TECHNICAL', true, true, NOW(), NOW()),
('dt-6', 'NDA', 'Non-Disclosure Agreement', 'Accordo di non divulgazione', 'LEGAL', true, true, NOW(), NOW()),
('dt-7', 'CONTRACT', 'Contratto', 'Contratto di servizio', 'BUSINESS', true, true, NOW(), NOW()),
('dt-8', 'INVOICE', 'Fattura', 'Documento fiscale', 'FINANCIAL', false, true, NOW(), NOW()),
('dt-9', 'QUOTE', 'Preventivo', 'Preventivo di spesa', 'FINANCIAL', false, true, NOW(), NOW()),
('dt-10', 'REPORT', 'Report Intervento', 'Report di intervento tecnico', 'TECHNICAL', false, true, NOW(), NOW()),
('dt-11', 'CERTIFICATE', 'Certificato', 'Certificazioni e attestati', 'TECHNICAL', true, true, NOW(), NOW());

-- ============================================
-- 2. CATEGORIE DOCUMENTI (DocumentCategory)
-- ============================================
INSERT INTO "DocumentCategory" (id, code, name, description, parent, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
('dc-1', 'LEGAL', 'Documenti Legali', 'Documenti legali e compliance', NULL, 1, true, NOW(), NOW()),
('dc-2', 'TECHNICAL', 'Documenti Tecnici', 'Documentazione tecnica e report', NULL, 2, true, NOW(), NOW()),
('dc-3', 'FINANCIAL', 'Documenti Finanziari', 'Fatture, preventivi e documenti fiscali', NULL, 3, true, NOW(), NOW()),
('dc-4', 'BUSINESS', 'Documenti Business', 'Contratti e accordi commerciali', NULL, 4, true, NOW(), NOW()),
('dc-5', 'INTERNAL', 'Documenti Interni', 'Documentazione interna aziendale', NULL, 5, true, NOW(), NOW());

-- ============================================
-- 3. WORKFLOW APPROVAZIONE (ApprovalWorkflow)
-- ============================================
INSERT INTO "ApprovalWorkflow" (id, name, description, steps, "isActive", "createdAt", "updatedAt") VALUES
('wf-1', 'Approvazione Semplice', 'Approvazione singolo livello', '[{"level":1,"role":"ADMIN","action":"approve"}]', true, NOW(), NOW()),
('wf-2', 'Approvazione Doppia', 'Approvazione a due livelli', '[{"level":1,"role":"ADMIN","action":"review"},{"level":2,"role":"SUPER_ADMIN","action":"approve"}]', true, NOW(), NOW()),
('wf-3', 'Approvazione Legale', 'Workflow per documenti legali', '[{"level":1,"role":"LEGAL","action":"review"},{"level":2,"role":"ADMIN","action":"approve"},{"level":3,"role":"SUPER_ADMIN","action":"final"}]', true, NOW(), NOW());

-- ============================================
-- 4. PERMESSI DOCUMENTI (DocumentPermission)
-- ============================================
INSERT INTO "DocumentPermission" (id, "documentType", role, "canView", "canCreate", "canEdit", "canDelete", "canApprove", "createdAt", "updatedAt") VALUES
('dp-1', 'PRIVACY_POLICY', 'SUPER_ADMIN', true, true, true, true, true, NOW(), NOW()),
('dp-2', 'PRIVACY_POLICY', 'ADMIN', true, false, true, false, false, NOW(), NOW()),
('dp-3', 'PRIVACY_POLICY', 'CLIENT', true, false, false, false, false, NOW(), NOW()),
('dp-4', 'TERMS_SERVICE', 'SUPER_ADMIN', true, true, true, true, true, NOW(), NOW()),
('dp-5', 'TERMS_SERVICE', 'ADMIN', true, false, true, false, false, NOW(), NOW()),
('dp-6', 'TERMS_SERVICE', 'CLIENT', true, false, false, false, false, NOW(), NOW()),
('dp-7', 'CONTRACT', 'PROFESSIONAL', true, true, false, false, false, NOW(), NOW()),
('dp-8', 'CONTRACT', 'CLIENT', true, false, false, false, false, NOW(), NOW()),
('dp-9', 'INVOICE', 'PROFESSIONAL', true, true, true, false, false, NOW(), NOW()),
('dp-10', 'INVOICE', 'CLIENT', true, false, false, false, false, NOW(), NOW()),
('dp-11', 'REPORT', 'PROFESSIONAL', true, true, true, false, false, NOW(), NOW()),
('dp-12', 'REPORT', 'CLIENT', true, false, false, false, false, NOW(), NOW());

-- ============================================
-- 5. TEMPLATE NOTIFICHE DOCUMENTI (DocumentNotificationTemplate)
-- ============================================
INSERT INTO "DocumentNotificationTemplate" (id, event, name, subject, body, recipients, "isActive", "createdAt", "updatedAt") VALUES
('dnt-1', 'DOCUMENT_CREATED', 'Documento Creato', 'Nuovo documento: {{documentName}}', '<p>È stato creato un nuovo documento: {{documentName}}</p>', '["creator","admins"]', true, NOW(), NOW()),
('dnt-2', 'DOCUMENT_UPDATED', 'Documento Aggiornato', 'Aggiornamento: {{documentName}}', '<p>Il documento {{documentName}} è stato aggiornato</p>', '["editors","watchers"]', true, NOW(), NOW()),
('dnt-3', 'DOCUMENT_APPROVED', 'Documento Approvato', 'Approvato: {{documentName}}', '<p>Il documento {{documentName}} è stato approvato</p>', '["creator","stakeholders"]', true, NOW(), NOW()),
('dnt-4', 'DOCUMENT_REJECTED', 'Documento Rifiutato', 'Rifiutato: {{documentName}}', '<p>Il documento {{documentName}} è stato rifiutato: {{reason}}</p>', '["creator"]', true, NOW(), NOW()),
('dnt-5', 'APPROVAL_REQUIRED', 'Approvazione Richiesta', 'Richiesta approvazione: {{documentName}}', '<p>Il documento {{documentName}} richiede la tua approvazione</p>', '["approvers"]', true, NOW(), NOW()),
('dnt-6', 'DOCUMENT_SIGNED', 'Documento Firmato', 'Firmato: {{documentName}}', '<p>Il documento {{documentName}} è stato firmato da {{signerName}}</p>', '["parties"]', true, NOW(), NOW()),
('dnt-7', 'DOCUMENT_EXPIRING', 'Documento in Scadenza', 'In scadenza: {{documentName}}', '<p>Il documento {{documentName}} scadrà tra {{days}} giorni</p>', '["owner","admins"]', true, NOW(), NOW()),
('dnt-8', 'DOCUMENT_EXPIRED', 'Documento Scaduto', 'Scaduto: {{documentName}}', '<p>Il documento {{documentName}} è scaduto</p>', '["owner","admins"]', true, NOW(), NOW());

-- ============================================
-- 6. CAMPI PERSONALIZZATI (DocumentCustomField)
-- ============================================
INSERT INTO "DocumentCustomField" (id, "documentType", "fieldName", "fieldType", label, required, options, "sortOrder", "createdAt", "updatedAt") VALUES
('dcf-1', 'CONTRACT', 'contract_value', 'number', 'Valore Contratto', true, NULL, 1, NOW(), NOW()),
('dcf-2', 'CONTRACT', 'duration_months', 'number', 'Durata (mesi)', true, NULL, 2, NOW(), NOW()),
('dcf-3', 'CONTRACT', 'payment_terms', 'select', 'Termini Pagamento', true, '["30gg","60gg","90gg"]', 3, NOW(), NOW()),
('dcf-4', 'INVOICE', 'invoice_number', 'text', 'Numero Fattura', true, NULL, 1, NOW(), NOW()),
('dcf-5', 'INVOICE', 'tax_rate', 'number', 'Aliquota IVA', true, NULL, 2, NOW(), NOW()),
('dcf-6', 'INVOICE', 'payment_method', 'select', 'Metodo Pagamento', true, '["bonifico","carta","paypal"]', 3, NOW(), NOW()),
('dcf-7', 'REPORT', 'intervention_date', 'date', 'Data Intervento', true, NULL, 1, NOW(), NOW()),
('dcf-8', 'REPORT', 'duration_hours', 'number', 'Ore Lavorate', true, NULL, 2, NOW(), NOW()),
('dcf-9', 'REPORT', 'materials_used', 'textarea', 'Materiali Utilizzati', false, NULL, 3, NOW(), NOW()),
('dcf-10', 'CERTIFICATE', 'issue_date', 'date', 'Data Rilascio', true, NULL, 1, NOW(), NOW()),
('dcf-11', 'CERTIFICATE', 'expiry_date', 'date', 'Data Scadenza', false, NULL, 2, NOW(), NOW()),
('dcf-12', 'CERTIFICATE', 'issuing_body', 'text', 'Ente Rilasciante', true, NULL, 3, NOW(), NOW()),
('dcf-13', 'DPA', 'data_categories', 'multiselect', 'Categorie Dati', true, '["personal","sensitive","financial","health"]', 1, NOW(), NOW()),
('dcf-14', 'DPA', 'processing_purposes', 'textarea', 'Finalità Trattamento', true, NULL, 2, NOW(), NOW()),
('dcf-15', 'DPA', 'retention_period', 'text', 'Periodo Conservazione', true, NULL, 3, NOW(), NOW());

-- ============================================
-- 7. CONFIGURAZIONE UI (DocumentUIConfig)
-- ============================================
INSERT INTO "DocumentUIConfig" (id, role, page, config, "createdAt", "updatedAt") VALUES
('duc-1', 'ADMIN', 'document-list', '{"showFilters":true,"columns":["name","type","status","date","actions"],"defaultSort":"date"}', NOW(), NOW()),
('duc-2', 'CLIENT', 'document-list', '{"showFilters":false,"columns":["name","type","date"],"defaultSort":"date"}', NOW(), NOW()),
('duc-3', 'PROFESSIONAL', 'document-list', '{"showFilters":true,"columns":["name","type","client","status","date"],"defaultSort":"status"}', NOW(), NOW()),
('duc-4', 'ADMIN', 'document-create', '{"showAllTypes":true,"requireApproval":false,"autoSave":true}', NOW(), NOW()),
('duc-5', 'PROFESSIONAL', 'document-create', '{"showAllTypes":false,"allowedTypes":["QUOTE","REPORT","INVOICE"],"autoSave":true}', NOW(), NOW()),
('duc-6', 'ALL', 'document-view', '{"showHistory":true,"showComments":true,"allowDownload":true,"allowPrint":true}', NOW(), NOW());

-- ============================================
-- 8. IMPOSTAZIONI SISTEMA DOCUMENTI (DocumentSystemSettings)
-- ============================================
INSERT INTO "DocumentSystemSettings" (id, key, value, description, "createdAt", "updatedAt") VALUES
('dss-1', 'storage_type', 'database', 'Tipo di storage documenti (database/s3/local)', NOW(), NOW()),
('dss-2', 'max_file_size', '10485760', 'Dimensione massima file in bytes (10MB)', NOW(), NOW()),
('dss-3', 'allowed_extensions', '.pdf,.doc,.docx,.txt,.html', 'Estensioni file permesse', NOW(), NOW()),
('dss-4', 'auto_versioning', 'true', 'Versioning automatico documenti', NOW(), NOW()),
('dss-5', 'version_limit', '10', 'Numero massimo versioni per documento', NOW(), NOW()),
('dss-6', 'retention_days', '365', 'Giorni di retention documenti eliminati', NOW(), NOW()),
('dss-7', 'audit_enabled', 'true', 'Abilita audit log per documenti', NOW(), NOW()),
('dss-8', 'encryption_enabled', 'false', 'Crittografia documenti at rest', NOW(), NOW()),
('dss-9', 'watermark_enabled', 'false', 'Aggiungi watermark ai PDF', NOW(), NOW()),
('dss-10', 'ocr_enabled', 'false', 'OCR automatico per PDF scansionati', NOW(), NOW()),
('dss-11', 'signature_enabled', 'true', 'Abilita firma digitale', NOW(), NOW()),
('dss-12', 'signature_type', 'simple', 'Tipo firma (simple/qualified)', NOW(), NOW()),
('dss-13', 'notification_enabled', 'true', 'Notifiche per eventi documenti', NOW(), NOW()),
('dss-14', 'email_notifications', 'true', 'Notifiche via email', NOW(), NOW()),
('dss-15', 'sms_notifications', 'false', 'Notifiche via SMS', NOW(), NOW()),
('dss-16', 'approval_timeout_days', '7', 'Timeout approvazione in giorni', NOW(), NOW()),
('dss-17', 'reminder_days_before_expiry', '30', 'Giorni anticipo reminder scadenza', NOW(), NOW()),
('dss-18', 'auto_archive_days', '180', 'Archiviazione automatica dopo giorni', NOW(), NOW()),
('dss-19', 'search_enabled', 'true', 'Ricerca full-text nei documenti', NOW(), NOW()),
('dss-20', 'preview_enabled', 'true', 'Anteprima documenti inline', NOW(), NOW()),
('dss-21', 'batch_upload_enabled', 'false', 'Upload multiplo documenti', NOW(), NOW()),
('dss-22', 'batch_upload_limit', '10', 'Limite file per upload multiplo', NOW(), NOW()),
('dss-23', 'api_access_enabled', 'true', 'Accesso API ai documenti', NOW(), NOW()),
('dss-24', 'webhook_enabled', 'false', 'Webhook per eventi documenti', NOW(), NOW()),
('dss-25', 'default_language', 'it', 'Lingua predefinita documenti', NOW(), NOW());

-- ============================================
-- VERIFICA INSERIMENTO
-- ============================================
SELECT 'Sistema Gestione Documenti popolato!' as status;
