-- ============================================
-- POPOLAMENTO SISTEMA GESTIONE DOCUMENTI
-- SOLO TABELLE CHE ESISTONO DAVVERO
-- ============================================

-- ============================================
-- 1. CATEGORIE DOCUMENTI
-- ============================================
DELETE FROM "DocumentCategory";
INSERT INTO "DocumentCategory" (id, code, name, description, "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
('dc-legal', 'LEGAL', 'Documenti Legali', 'Privacy, Termini, Cookie Policy e altri documenti legali', 1, true, NOW(), NOW()),
('dc-financial', 'FINANCIAL', 'Documenti Finanziari', 'Fatture, preventivi e documenti fiscali', 2, true, NOW(), NOW()),
('dc-technical', 'TECHNICAL', 'Documenti Tecnici', 'Report interventi, certificazioni tecniche', 3, true, NOW(), NOW()),
('dc-business', 'BUSINESS', 'Documenti Business', 'Contratti e accordi commerciali', 4, true, NOW(), NOW()),
('dc-internal', 'INTERNAL', 'Documenti Interni', 'Documentazione interna aziendale', 5, true, NOW(), NOW());

-- ============================================
-- 2. CONFIGURAZIONI SISTEMA
-- ============================================
DELETE FROM "DocumentSystemConfig";
INSERT INTO "DocumentSystemConfig" (id, key, value, category, description, "dataType", "createdAt", "updatedAt") VALUES
('dsc-1', 'enable_auto_approval', 'false', 'workflow', 'Abilita approvazione automatica', 'boolean', NOW(), NOW()),
('dsc-2', 'auto_approval_days', '7', 'workflow', 'Giorni per approvazione automatica', 'number', NOW(), NOW()),
('dsc-3', 'enable_versioning', 'true', 'general', 'Abilita versionamento documenti', 'boolean', NOW(), NOW()),
('dsc-4', 'max_versions_per_document', '10', 'general', 'Numero massimo versioni per documento', 'number', NOW(), NOW()),
('dsc-5', 'require_approval_comment', 'true', 'workflow', 'Richiedi commento per approvazione', 'boolean', NOW(), NOW()),
('dsc-6', 'notification_days_before_expiry', '30', 'notifications', 'Giorni prima della scadenza per notifica', 'number', NOW(), NOW()),
('dsc-7', 'enable_digital_signature', 'true', 'general', 'Abilita firma digitale', 'boolean', NOW(), NOW()),
('dsc-8', 'default_document_language', 'it', 'general', 'Lingua di default documenti', 'string', NOW(), NOW()),
('dsc-9', 'show_version_comparison', 'true', 'ui', 'Mostra confronto versioni', 'boolean', NOW(), NOW()),
('dsc-10', 'allow_bulk_operations', 'true', 'ui', 'Permetti operazioni bulk', 'boolean', NOW(), NOW()),
('dsc-11', 'max_file_size', '10485760', 'storage', 'Dimensione massima file (10MB)', 'number', NOW(), NOW()),
('dsc-12', 'allowed_extensions', '.pdf,.doc,.docx,.txt,.html', 'storage', 'Estensioni file permesse', 'string', NOW(), NOW()),
('dsc-13', 'retention_days', '365', 'storage', 'Giorni retention documenti eliminati', 'number', NOW(), NOW()),
('dsc-14', 'audit_enabled', 'true', 'security', 'Abilita audit log documenti', 'boolean', NOW(), NOW()),
('dsc-15', 'watermark_enabled', 'false', 'security', 'Aggiungi watermark ai PDF', 'boolean', NOW(), NOW()),
('dsc-16', 'email_notifications', 'true', 'notifications', 'Notifiche via email', 'boolean', NOW(), NOW()),
('dsc-17', 'sms_notifications', 'false', 'notifications', 'Notifiche via SMS', 'boolean', NOW(), NOW()),
('dsc-18', 'reminder_days', '7,3,1', 'notifications', 'Giorni reminder scadenza', 'string', NOW(), NOW()),
('dsc-19', 'search_enabled', 'true', 'features', 'Ricerca full-text nei documenti', 'boolean', NOW(), NOW()),
('dsc-20', 'preview_enabled', 'true', 'features', 'Anteprima documenti inline', 'boolean', NOW(), NOW()),
('dsc-21', 'batch_upload_enabled', 'true', 'features', 'Upload multiplo documenti', 'boolean', NOW(), NOW()),
('dsc-22', 'batch_upload_limit', '10', 'features', 'Limite file per upload multiplo', 'number', NOW(), NOW()),
('dsc-23', 'api_access_enabled', 'true', 'api', 'Accesso API ai documenti', 'boolean', NOW(), NOW()),
('dsc-24', 'webhook_enabled', 'false', 'api', 'Webhook per eventi documenti', 'boolean', NOW(), NOW()),
('dsc-25', 'default_timezone', 'Europe/Rome', 'general', 'Timezone predefinito', 'string', NOW(), NOW());

-- ============================================
-- 3. PERMESSI DOCUMENTI
-- ============================================
DELETE FROM "DocumentPermission";
INSERT INTO "DocumentPermission" (id, role, "documentType", "canView", "canCreate", "canEdit", "canDelete", "canPublish", "canApprove", "canExport", "canImport", "canManageTemplates", "createdAt", "updatedAt") VALUES
-- Super Admin ha tutti i permessi
('perm-1', 'SUPER_ADMIN', 'ALL', true, true, true, true, true, true, true, true, true, NOW(), NOW()),
-- Admin può gestire documenti legali
('perm-2', 'ADMIN', 'LEGAL', true, true, true, false, true, true, true, false, true, NOW(), NOW()),
('perm-3', 'ADMIN', 'TECHNICAL', true, true, true, false, true, true, true, false, false, NOW(), NOW()),
('perm-4', 'ADMIN', 'BUSINESS', true, true, true, false, true, true, true, false, false, NOW(), NOW()),
-- Professional può gestire i suoi documenti
('perm-5', 'PROFESSIONAL', 'TECHNICAL', true, true, true, false, false, false, true, false, false, NOW(), NOW()),
('perm-6', 'PROFESSIONAL', 'FINANCIAL', true, true, true, false, false, false, true, false, false, NOW(), NOW()),
-- Client può solo vedere
('perm-7', 'CLIENT', 'LEGAL', true, false, false, false, false, false, true, false, false, NOW(), NOW()),
('perm-8', 'CLIENT', 'FINANCIAL', true, false, false, false, false, false, true, false, false, NOW(), NOW()),
('perm-9', 'CLIENT', 'TECHNICAL', true, false, false, false, false, false, true, false, false, NOW(), NOW()),
-- Guest può vedere solo documenti pubblici
('perm-10', 'GUEST', 'LEGAL', true, false, false, false, false, false, false, false, false, NOW(), NOW());

-- ============================================
-- 4. TEMPLATE NOTIFICHE DOCUMENTI
-- ============================================
DELETE FROM "DocumentNotificationTemplate";
INSERT INTO "DocumentNotificationTemplate" (
    id, code, name, description, "documentType", "eventType",
    subject, "bodyHtml", "bodyText", variables, channels,
    "recipientRoles", "includeAdmins", "isActive", "createdAt", "updatedAt"
) VALUES
('dnt-1', 'DOC_CREATED', 'Documento Creato', 'Notifica creazione documento', NULL, 'created',
 'Nuovo documento: {{documentName}}',
 '<h3>Nuovo Documento Creato</h3><p>È stato creato il documento: <strong>{{documentName}}</strong></p><p>Tipo: {{documentType}}</p>',
 'Nuovo documento creato: {{documentName}}',
 '["documentName","documentType","createdBy","createdAt"]',
 '{"email","in-app"}',
 '{"ADMIN","SUPER_ADMIN"}',
 true, true, NOW(), NOW()),

('dnt-2', 'DOC_UPDATED', 'Documento Aggiornato', 'Notifica aggiornamento documento', NULL, 'updated',
 'Aggiornamento: {{documentName}}',
 '<p>Il documento <strong>{{documentName}}</strong> è stato aggiornato da {{updatedBy}}</p>',
 'Documento aggiornato: {{documentName}}',
 '["documentName","updatedBy","updatedAt","changes"]',
 '{"email","in-app"}',
 '{"ADMIN"}',
 false, true, NOW(), NOW()),

('dnt-3', 'DOC_PUBLISHED', 'Documento Pubblicato', 'Notifica pubblicazione documento', 'LEGAL', 'published',
 'Pubblicato: {{documentName}}',
 '<p>Il documento legale <strong>{{documentName}}</strong> è stato pubblicato ed è ora attivo.</p>',
 'Documento pubblicato: {{documentName}}',
 '["documentName","publishedBy","effectiveDate"]',
 '{"email","in-app"}',
 '{"ALL"}',
 true, true, NOW(), NOW()),

('dnt-4', 'DOC_EXPIRING', 'Documento in Scadenza', 'Reminder scadenza documento', NULL, 'expiring',
 'In scadenza: {{documentName}}',
 '<p>Il documento <strong>{{documentName}}</strong> scadrà tra {{daysRemaining}} giorni.</p>',
 'Documento in scadenza: {{documentName}}',
 '["documentName","expiryDate","daysRemaining"]',
 '{"email","in-app"}',
 '{"ADMIN","SUPER_ADMIN"}',
 true, true, NOW(), NOW()),

('dnt-5', 'USER_ACCEPTED', 'Documento Accettato', 'Utente ha accettato documento', 'LEGAL', 'accepted',
 'Accettazione: {{documentName}} da {{userName}}',
 '<p>L''utente <strong>{{userName}}</strong> ha accettato {{documentName}}</p>',
 'Documento accettato da {{userName}}',
 '["documentName","userName","acceptedAt","ipAddress"]',
 '{"in-app"}',
 '{"ADMIN"}',
 false, true, NOW(), NOW()),

('dnt-6', 'BULK_UPDATE', 'Aggiornamento Documenti Legali', 'Notifica aggiornamento documenti legali', 'LEGAL', 'bulk_update',
 'Importanti aggiornamenti ai documenti legali',
 '<h3>Aggiornamento Documenti Legali</h3><p>Sono stati aggiornati i seguenti documenti:</p><ul>{{documentList}}</ul><p>Ti preghiamo di prenderne visione.</p>',
 'Aggiornati documenti legali: {{documentList}}',
 '["documentList","updateDate","reason"]',
 '{"email","in-app"}',
 '{"CLIENT","PROFESSIONAL"}',
 false, true, NOW(), NOW());

-- ============================================
-- 5. CONFIGURAZIONI UI
-- ============================================
DELETE FROM "DocumentUIConfig";
INSERT INTO "DocumentUIConfig" (id, page, role, layout, actions, fields, "isActive", "createdAt", "updatedAt") VALUES
('ui-1', 'admin-list', 'ADMIN', 
 '{"showFilters":true,"showSearch":true,"columns":["name","type","status","created","actions"],"defaultSort":"created_desc","itemsPerPage":20,"cardView":false}',
 '{"showCreate":true,"showExport":true,"showImport":true,"bulkActions":["delete","archive","export"],"rowActions":["view","edit","delete"]}',
 '{"name":{"visible":true,"editable":false},"type":{"visible":true,"filterable":true},"status":{"visible":true,"filterable":true},"created":{"visible":true,"sortable":true}}',
 true, NOW(), NOW()),

('ui-2', 'client-list', 'CLIENT',
 '{"showFilters":false,"showSearch":true,"columns":["name","type","date"],"defaultSort":"date_desc","itemsPerPage":10,"cardView":true}',
 '{"showCreate":false,"showExport":true,"showImport":false,"bulkActions":[],"rowActions":["view","download"]}',
 '{"name":{"visible":true},"type":{"visible":true},"date":{"visible":true}}',
 true, NOW(), NOW()),

('ui-3', 'professional-list', 'PROFESSIONAL',
 '{"showFilters":true,"showSearch":true,"columns":["name","client","type","status","date"],"defaultSort":"status_asc","itemsPerPage":15,"cardView":false}',
 '{"showCreate":true,"showExport":true,"showImport":false,"bulkActions":["export"],"rowActions":["view","edit","download"]}',
 '{"name":{"visible":true},"client":{"visible":true,"filterable":true},"type":{"visible":true,"filterable":true},"status":{"visible":true,"filterable":true},"date":{"visible":true,"sortable":true}}',
 true, NOW(), NOW());

-- ============================================
-- REPORT FINALE
-- ============================================
SELECT 
    (SELECT COUNT(*) FROM "DocumentCategory") as categories,
    (SELECT COUNT(*) FROM "DocumentSystemConfig") as configs,
    (SELECT COUNT(*) FROM "DocumentPermission") as permissions,
    (SELECT COUNT(*) FROM "DocumentNotificationTemplate") as templates,
    (SELECT COUNT(*) FROM "DocumentUIConfig") as ui_configs;
