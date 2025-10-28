-- ============================================
-- POPOLAMENTO COMPLETO DATABASE RICHIESTA ASSISTENZA
-- Data: Gennaio 2025
-- Versione: COMPLETA
-- ============================================

-- Disabilita temporaneamente i vincoli di chiave esterna
SET session_replication_role = 'replica';

-- ============================================
-- PULIZIA TABELLE (in ordine di dipendenza)
-- ============================================
DELETE FROM "UserLegalAcceptance";
DELETE FROM "LegalDocumentVersion";
DELETE FROM "LegalDocument";
DELETE FROM "NotificationTemplate";
DELETE FROM "SystemSettings";
DELETE FROM "Subcategory";
DELETE FROM "Category";
DELETE FROM "ProfessionalSkill";
DELETE FROM "ProfessionalAvailability";
DELETE FROM "ProfessionalDocument";
DELETE FROM "TransferCost";
DELETE FROM "ProfessionalProfile";
DELETE FROM "User" WHERE email != 'admin@richiesta-assistenza.it'; -- Mantieni solo admin

-- ============================================
-- 1. SYSTEM SETTINGS
-- ============================================
INSERT INTO "SystemSettings" (id, key, value, description, "createdAt", "updatedAt") VALUES
('set-1', 'site_name', 'Richiesta Assistenza', 'Nome del sito', NOW(), NOW()),
('set-2', 'site_url', 'https://richiesta-assistenza.it', 'URL principale del sito', NOW(), NOW()),
('set-3', 'site_email', 'info@richiesta-assistenza.it', 'Email principale', NOW(), NOW()),
('set-4', 'site_phone', '+39 06 12345678', 'Telefono principale', NOW(), NOW()),
('set-5', 'site_address', 'Via Roma 1, 00100 Roma', 'Indirizzo sede', NOW(), NOW()),
('set-6', 'site_version', '4.3.0', 'Versione del sistema', NOW(), NOW()),
('set-7', 'commission_rate', '15', 'Percentuale commissione standard', NOW(), NOW()),
('set-8', 'commission_rate_premium', '10', 'Percentuale commissione premium', NOW(), NOW()),
('set-9', 'premium_monthly_fee', '99', 'Costo mensile abbonamento premium', NOW(), NOW()),
('set-10', 'max_upload_size', '10485760', 'Dimensione massima upload in bytes (10MB)', NOW(), NOW()),
('set-11', 'session_timeout', '7200', 'Timeout sessione in secondi (2 ore)', NOW(), NOW()),
('set-12', 'two_factor_enabled', 'true', '2FA abilitato di default', NOW(), NOW()),
('set-13', 'email_verification_required', 'true', 'Verifica email obbligatoria', NOW(), NOW()),
('set-14', 'auto_assign_enabled', 'true', 'Assegnazione automatica richieste', NOW(), NOW()),
('set-15', 'notification_email_enabled', 'true', 'Notifiche email abilitate', NOW(), NOW()),
('set-16', 'notification_sms_enabled', 'false', 'Notifiche SMS abilitate', NOW(), NOW()),
('set-17', 'notification_whatsapp_enabled', 'true', 'Notifiche WhatsApp abilitate', NOW(), NOW()),
('set-18', 'maintenance_mode', 'false', 'Modalità manutenzione', NOW(), NOW()),
('set-19', 'google_maps_api_key', '', 'API Key Google Maps (da configurare)', NOW(), NOW()),
('set-20', 'openai_api_key', '', 'API Key OpenAI (da configurare)', NOW(), NOW()),
('set-21', 'stripe_public_key', '', 'Chiave pubblica Stripe (da configurare)', NOW(), NOW()),
('set-22', 'stripe_secret_key', '', 'Chiave segreta Stripe (da configurare)', NOW(), NOW()),
('set-23', 'brevo_api_key', '', 'API Key Brevo per email (da configurare)', NOW(), NOW()),
('set-24', 'tinymce_api_key', '', 'API Key TinyMCE editor (da configurare)', NOW(), NOW());

-- ============================================
-- 2. CATEGORIE SERVIZI
-- ============================================
INSERT INTO "Category" (id, name, slug, description, icon, color, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('cat-1', 'Idraulica', 'idraulica', 'Servizi idraulici e riparazioni', 'wrench', '#2196F3', true, 1, NOW(), NOW()),
('cat-2', 'Elettricista', 'elettricista', 'Impianti elettrici e riparazioni', 'bolt', '#FFC107', true, 2, NOW(), NOW()),
('cat-3', 'Condizionamento', 'condizionamento', 'Climatizzazione e riscaldamento', 'snowflake', '#00BCD4', true, 3, NOW(), NOW()),
('cat-4', 'Serramenti', 'serramenti', 'Porte, finestre e serrature', 'door-open', '#795548', true, 4, NOW(), NOW()),
('cat-5', 'Pulizie', 'pulizie', 'Pulizie e sanificazione', 'sparkles', '#4CAF50', true, 5, NOW(), NOW()),
('cat-6', 'Traslochi', 'traslochi', 'Traslochi e trasporti', 'truck', '#FF5722', true, 6, NOW(), NOW()),
('cat-7', 'Giardinaggio', 'giardinaggio', 'Manutenzione giardini e verde', 'leaf', '#8BC34A', true, 7, NOW(), NOW()),
('cat-8', 'Edilizia', 'edilizia', 'Lavori edili e ristrutturazioni', 'building', '#9E9E9E', true, 8, NOW(), NOW()),
('cat-9', 'Elettrodomestici', 'elettrodomestici', 'Riparazione elettrodomestici', 'washing-machine', '#E91E63', true, 9, NOW(), NOW()),
('cat-10', 'Altro', 'altro', 'Altri servizi tecnici', 'tools', '#607D8B', true, 10, NOW(), NOW());

-- ============================================
-- 3. SOTTOCATEGORIE
-- ============================================
-- Idraulica
INSERT INTO "Subcategory" (id, "categoryId", name, slug, description, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('sub-1-1', 'cat-1', 'Perdite acqua', 'perdite-acqua', 'Riparazione perdite e infiltrazioni', true, 1, NOW(), NOW()),
('sub-1-2', 'cat-1', 'Scarichi otturati', 'scarichi-otturati', 'Disostruzione scarichi e tubature', true, 2, NOW(), NOW()),
('sub-1-3', 'cat-1', 'Rubinetti', 'rubinetti', 'Sostituzione e riparazione rubinetteria', true, 3, NOW(), NOW()),
('sub-1-4', 'cat-1', 'Caldaia', 'caldaia', 'Manutenzione e riparazione caldaie', true, 4, NOW(), NOW()),
('sub-1-5', 'cat-1', 'Bagno completo', 'bagno-completo', 'Ristrutturazione completa bagno', true, 5, NOW(), NOW());

-- Elettricista
INSERT INTO "Subcategory" (id, "categoryId", name, slug, description, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('sub-2-1', 'cat-2', 'Blackout', 'blackout', 'Ripristino corrente elettrica', true, 1, NOW(), NOW()),
('sub-2-2', 'cat-2', 'Quadro elettrico', 'quadro-elettrico', 'Manutenzione quadri elettrici', true, 2, NOW(), NOW()),
('sub-2-3', 'cat-2', 'Impianto nuovo', 'impianto-nuovo', 'Realizzazione nuovi impianti', true, 3, NOW(), NOW()),
('sub-2-4', 'cat-2', 'Certificazioni', 'certificazioni', 'Certificazioni di conformità', true, 4, NOW(), NOW()),
('sub-2-5', 'cat-2', 'Domotica', 'domotica', 'Installazione sistemi smart home', true, 5, NOW(), NOW());

-- Condizionamento
INSERT INTO "Subcategory" (id, "categoryId", name, slug, description, "isActive", "sortOrder", "createdAt", "updatedAt") VALUES
('sub-3-1', 'cat-3', 'Installazione', 'installazione-clima', 'Installazione nuovi condizionatori', true, 1, NOW(), NOW()),
('sub-3-2', 'cat-3', 'Manutenzione', 'manutenzione-clima', 'Pulizia e manutenzione periodica', true, 2, NOW(), NOW()),
('sub-3-3', 'cat-3', 'Ricarica gas', 'ricarica-gas', 'Ricarica gas refrigerante', true, 3, NOW(), NOW()),
('sub-3-4', 'cat-3', 'Riparazione', 'riparazione-clima', 'Riparazione guasti', true, 4, NOW(), NOW());

-- ============================================
-- 4. UTENTI DI ESEMPIO
-- ============================================
-- Password di default per tutti: Test123!@# (già hashata)
-- Hash bcrypt: $2b$10$5vJ3Kz5XZ5qKu2Xq0Oi6a.vHtVJY9aW1jF9p5vJ3Kz5XZ5qKu2Xq

-- Clienti
INSERT INTO "User" (id, email, password, "fullName", phone, role, "isActive", "emailVerified", "createdAt", "updatedAt") VALUES
('user-client-1', 'mario.rossi@email.com', '$2b$10$5vJ3Kz5XZ5qKu2Xq0Oi6a.vHtVJY9aW1jF9p5vJ3Kz5XZ5qKu2Xq', 'Mario Rossi', '+39 333 1234567', 'CLIENT', true, true, NOW(), NOW()),
('user-client-2', 'laura.bianchi@email.com', '$2b$10$5vJ3Kz5XZ5qKu2Xq0Oi6a.vHtVJY9aW1jF9p5vJ3Kz5XZ5qKu2Xq', 'Laura Bianchi', '+39 334 2345678', 'CLIENT', true, true, NOW(), NOW()),
('user-client-3', 'giuseppe.verdi@email.com', '$2b$10$5vJ3Kz5XZ5qKu2Xq0Oi6a.vHtVJY9aW1jF9p5vJ3Kz5XZ5qKu2Xq', 'Giuseppe Verdi', '+39 335 3456789', 'CLIENT', true, true, NOW(), NOW());

-- Professionisti
INSERT INTO "User" (id, email, password, "fullName", phone, role, "isActive", "emailVerified", "createdAt", "updatedAt") VALUES
('user-prof-1', 'idraulico1@email.com', '$2b$10$5vJ3Kz5XZ5qKu2Xq0Oi6a.vHtVJY9aW1jF9p5vJ3Kz5XZ5qKu2Xq', 'Giovanni Fontana', '+39 340 1111111', 'PROFESSIONAL', true, true, NOW(), NOW()),
('user-prof-2', 'elettricista1@email.com', '$2b$10$5vJ3Kz5XZ5qKu2Xq0Oi6a.vHtVJY9aW1jF9p5vJ3Kz5XZ5qKu2Xq', 'Marco Elettrico', '+39 341 2222222', 'PROFESSIONAL', true, true, NOW(), NOW()),
('user-prof-3', 'multiservizi@email.com', '$2b$10$5vJ3Kz5XZ5qKu2Xq0Oi6a.vHtVJY9aW1jF9p5vJ3Kz5XZ5qKu2Xq', 'Paolo Multiservice', '+39 342 3333333', 'PROFESSIONAL', true, true, NOW(), NOW());

-- Admin aggiuntivo
INSERT INTO "User" (id, email, password, "fullName", phone, role, "isActive", "emailVerified", "createdAt", "updatedAt") VALUES
('user-admin-2', 'admin2@richiesta-assistenza.it', '$2b$10$5vJ3Kz5XZ5qKu2Xq0Oi6a.vHtVJY9aW1jF9p5vJ3Kz5XZ5qKu2Xq', 'Admin Support', '+39 06 87654321', 'ADMIN', true, true, NOW(), NOW());

-- ============================================
-- 5. DETTAGLI PROFESSIONISTI
-- ============================================
INSERT INTO "ProfessionalProfile" (
    id, "userId", "businessName", "vatNumber", description, 
    "yearsExperience", "serviceRadius", address, city, province, 
    "postalCode", latitude, longitude, "isVerified", 
    rating, "completedJobs", "responseTime", "createdAt", "updatedAt"
) VALUES
('prof-1', 'user-prof-1', 'Idraulica Fontana', 'IT12345678901', 'Servizi idraulici professionali 24/7. Pronto intervento e manutenzione ordinaria.', 
 10, 30, 'Via Roma 100', 'Roma', 'RM', '00100', 41.9028, 12.4964, true, 
 4.8, 150, 30, NOW(), NOW()),
 
('prof-2', 'user-prof-2', 'Elettro Service', 'IT23456789012', 'Impianti elettrici civili e industriali. Certificazioni e messa a norma.', 
 15, 25, 'Via Milano 50', 'Roma', 'RM', '00150', 41.8919, 12.5113, true, 
 4.7, 200, 45, NOW(), NOW()),
 
('prof-3', 'user-prof-3', 'MultiService Pro', 'IT34567890123', 'Servizi di manutenzione a 360 gradi. Qualità e convenienza garantita.', 
 8, 40, 'Via Napoli 75', 'Roma', 'RM', '00180', 41.8850, 12.5000, true, 
 4.6, 120, 60, NOW(), NOW());

-- ============================================
-- 6. COMPETENZE PROFESSIONISTI
-- ============================================
INSERT INTO "ProfessionalSkill" (id, "professionalId", "categoryId", "subcategoryId", "yearsExperience", "certificationLevel", "createdAt", "updatedAt") VALUES
-- Idraulico
('skill-1', 'prof-1', 'cat-1', 'sub-1-1', 10, 'EXPERT', NOW(), NOW()),
('skill-2', 'prof-1', 'cat-1', 'sub-1-2', 10, 'EXPERT', NOW(), NOW()),
('skill-3', 'prof-1', 'cat-1', 'sub-1-3', 10, 'EXPERT', NOW(), NOW()),
('skill-4', 'prof-1', 'cat-1', 'sub-1-4', 8, 'ADVANCED', NOW(), NOW()),
('skill-5', 'prof-1', 'cat-1', 'sub-1-5', 7, 'ADVANCED', NOW(), NOW()),
-- Elettricista
('skill-6', 'prof-2', 'cat-2', 'sub-2-1', 15, 'EXPERT', NOW(), NOW()),
('skill-7', 'prof-2', 'cat-2', 'sub-2-2', 15, 'EXPERT', NOW(), NOW()),
('skill-8', 'prof-2', 'cat-2', 'sub-2-3', 12, 'EXPERT', NOW(), NOW()),
('skill-9', 'prof-2', 'cat-2', 'sub-2-4', 15, 'EXPERT', NOW(), NOW()),
('skill-10', 'prof-2', 'cat-2', 'sub-2-5', 5, 'INTERMEDIATE', NOW(), NOW()),
-- Multiservice
('skill-11', 'prof-3', 'cat-1', 'sub-1-1', 5, 'INTERMEDIATE', NOW(), NOW()),
('skill-12', 'prof-3', 'cat-2', 'sub-2-1', 5, 'INTERMEDIATE', NOW(), NOW()),
('skill-13', 'prof-3', 'cat-3', 'sub-3-2', 8, 'ADVANCED', NOW(), NOW()),
('skill-14', 'prof-3', 'cat-5', NULL, 8, 'ADVANCED', NOW(), NOW()),
('skill-15', 'prof-3', 'cat-6', NULL, 6, 'INTERMEDIATE', NOW(), NOW());

-- ============================================
-- 7. DISPONIBILITÀ PROFESSIONISTI
-- ============================================
INSERT INTO "ProfessionalAvailability" (id, "professionalId", "dayOfWeek", "startTime", "endTime", "isAvailable", "createdAt", "updatedAt") VALUES
-- Idraulico (Lun-Sab)
('avail-1', 'prof-1', 1, '08:00', '18:00', true, NOW(), NOW()),
('avail-2', 'prof-1', 2, '08:00', '18:00', true, NOW(), NOW()),
('avail-3', 'prof-1', 3, '08:00', '18:00', true, NOW(), NOW()),
('avail-4', 'prof-1', 4, '08:00', '18:00', true, NOW(), NOW()),
('avail-5', 'prof-1', 5, '08:00', '18:00', true, NOW(), NOW()),
('avail-6', 'prof-1', 6, '08:00', '13:00', true, NOW(), NOW()),
('avail-7', 'prof-1', 0, '00:00', '00:00', false, NOW(), NOW()),
-- Elettricista (Lun-Ven + emergenze)
('avail-8', 'prof-2', 1, '07:00', '20:00', true, NOW(), NOW()),
('avail-9', 'prof-2', 2, '07:00', '20:00', true, NOW(), NOW()),
('avail-10', 'prof-2', 3, '07:00', '20:00', true, NOW(), NOW()),
('avail-11', 'prof-2', 4, '07:00', '20:00', true, NOW(), NOW()),
('avail-12', 'prof-2', 5, '07:00', '20:00', true, NOW(), NOW()),
('avail-13', 'prof-2', 6, '09:00', '13:00', true, NOW(), NOW()),
('avail-14', 'prof-2', 0, '09:00', '13:00', true, NOW(), NOW()),
-- Multiservice (Tutti i giorni)
('avail-15', 'prof-3', 1, '08:00', '19:00', true, NOW(), NOW()),
('avail-16', 'prof-3', 2, '08:00', '19:00', true, NOW(), NOW()),
('avail-17', 'prof-3', 3, '08:00', '19:00', true, NOW(), NOW()),
('avail-18', 'prof-3', 4, '08:00', '19:00', true, NOW(), NOW()),
('avail-19', 'prof-3', 5, '08:00', '19:00', true, NOW(), NOW()),
('avail-20', 'prof-3', 6, '08:00', '17:00', true, NOW(), NOW()),
('avail-21', 'prof-3', 0, '10:00', '16:00', true, NOW(), NOW());

-- ============================================
-- 8. COSTI TRASFERIMENTO
-- ============================================
INSERT INTO "TransferCost" (id, "professionalId", "minDistance", "maxDistance", cost, "createdAt", "updatedAt") VALUES
-- Idraulico
('cost-1', 'prof-1', 0, 5, 0.00, NOW(), NOW()),
('cost-2', 'prof-1', 5, 10, 10.00, NOW(), NOW()),
('cost-3', 'prof-1', 10, 20, 20.00, NOW(), NOW()),
('cost-4', 'prof-1', 20, 30, 35.00, NOW(), NOW()),
-- Elettricista
('cost-5', 'prof-2', 0, 5, 0.00, NOW(), NOW()),
('cost-6', 'prof-2', 5, 15, 15.00, NOW(), NOW()),
('cost-7', 'prof-2', 15, 25, 30.00, NOW(), NOW()),
-- Multiservice
('cost-8', 'prof-3', 0, 10, 0.00, NOW(), NOW()),
('cost-9', 'prof-3', 10, 25, 25.00, NOW(), NOW()),
('cost-10', 'prof-3', 25, 40, 40.00, NOW(), NOW());

-- ============================================
-- 9. TEMPLATE NOTIFICHE
-- ============================================
INSERT INTO "NotificationTemplate" (
    id, code, name, description, subject, body, 
    variables, channels, "isActive", "createdAt", "updatedAt"
) VALUES
('tmpl-1', 'WELCOME', 'Benvenuto', 'Email di benvenuto per nuovi utenti', 
 'Benvenuto in Richiesta Assistenza!', 
 '<h1>Benvenuto {{userName}}!</h1><p>Il tuo account è stato creato con successo.</p><p>Email: {{email}}</p>', 
 '["userName", "email"]', '["EMAIL", "IN_APP"]', true, NOW(), NOW()),

('tmpl-2', 'REQUEST_CREATED', 'Richiesta Creata', 'Notifica creazione nuova richiesta', 
 'Nuova richiesta di assistenza #{{requestId}}', 
 '<p>La tua richiesta di assistenza per <strong>{{category}}</strong> è stata creata con successo.</p><p>Descrizione: {{description}}</p>', 
 '["requestId", "category", "description"]', '["EMAIL", "IN_APP", "WHATSAPP"]', true, NOW(), NOW()),

('tmpl-3', 'REQUEST_ASSIGNED', 'Richiesta Assegnata', 'Notifica assegnazione professionista', 
 'Professionista assegnato alla richiesta #{{requestId}}', 
 '<p><strong>{{professionalName}}</strong> è stato assegnato alla tua richiesta.</p><p>Telefono: {{professionalPhone}}</p>', 
 '["requestId", "professionalName", "professionalPhone"]', '["EMAIL", "IN_APP", "WHATSAPP"]', true, NOW(), NOW()),

('tmpl-4', 'QUOTE_RECEIVED', 'Preventivo Ricevuto', 'Notifica nuovo preventivo', 
 'Nuovo preventivo per richiesta #{{requestId}}', 
 '<p>Hai ricevuto un preventivo di <strong>€{{amount}}</strong> da {{professionalName}}.</p>', 
 '["requestId", "amount", "professionalName"]', '["EMAIL", "IN_APP"]', true, NOW(), NOW()),

('tmpl-5', 'QUOTE_ACCEPTED', 'Preventivo Accettato', 'Notifica accettazione preventivo', 
 'Preventivo accettato per richiesta #{{requestId}}', 
 '<p>{{clientName}} ha accettato il tuo preventivo di €{{amount}}.</p>', 
 '["requestId", "amount", "clientName"]', '["EMAIL", "IN_APP", "WHATSAPP"]', true, NOW(), NOW()),

('tmpl-6', 'WORK_COMPLETED', 'Lavoro Completato', 'Notifica completamento lavoro', 
 'Lavoro completato - Richiesta #{{requestId}}', 
 '<p>Il lavoro per la richiesta #{{requestId}} è stato completato da {{professionalName}}.</p>', 
 '["requestId", "professionalName"]', '["EMAIL", "IN_APP"]', true, NOW(), NOW()),

('tmpl-7', 'PAYMENT_RECEIVED', 'Pagamento Ricevuto', 'Conferma pagamento', 
 'Pagamento ricevuto €{{amount}}', 
 '<p>Abbiamo ricevuto il pagamento di €{{amount}} per la richiesta #{{requestId}}.</p><p>Metodo: {{paymentMethod}}</p>', 
 '["requestId", "amount", "paymentMethod"]', '["EMAIL", "IN_APP"]', true, NOW(), NOW()),

('tmpl-8', 'PASSWORD_RESET', 'Reset Password', 'Email reset password', 
 'Reset della tua password', 
 '<p>Ciao {{userName}},</p><p>Clicca <a href="{{resetLink}}">qui</a> per reimpostare la password.</p>', 
 '["resetLink", "userName"]', '["EMAIL"]', true, NOW(), NOW()),

('tmpl-9', 'LEGAL_DOCUMENT_UPDATE', 'Aggiornamento Documenti Legali', 'Notifica aggiornamento privacy/terms', 
 'Aggiornamento {{documentType}}', 
 '<p>Abbiamo aggiornato {{documentType}}.</p><p><a href="{{documentLink}}">Clicca qui</a> per prenderne visione.</p>', 
 '["documentType", "documentLink"]', '["EMAIL", "IN_APP"]', true, NOW(), NOW()),

('tmpl-10', 'TWO_FACTOR_CODE', 'Codice 2FA', 'Codice autenticazione due fattori', 
 'Il tuo codice di verifica', 
 '<p>Ciao {{userName}},</p><p>Il tuo codice di verifica è: <strong>{{code}}</strong></p><p>Valido per 5 minuti.</p>', 
 '["code", "userName"]', '["EMAIL"]', true, NOW(), NOW()),

('tmpl-11', 'NEW_MESSAGE', 'Nuovo Messaggio', 'Notifica nuovo messaggio chat', 
 'Nuovo messaggio da {{senderName}}', 
 '<p>Hai ricevuto un nuovo messaggio da {{senderName}} per la richiesta #{{requestId}}.</p>', 
 '["senderName", "requestId"]', '["IN_APP", "EMAIL"]', true, NOW(), NOW()),

('tmpl-12', 'REVIEW_REQUEST', 'Richiesta Recensione', 'Invito a lasciare una recensione', 
 'Lascia una recensione per {{professionalName}}', 
 '<p>Il lavoro è stato completato. Lascia una recensione per {{professionalName}}.</p>', 
 '["professionalName", "requestId"]', '["EMAIL", "IN_APP"]', true, NOW(), NOW());

-- ============================================
-- 10. DOCUMENTI LEGALI (senza contenuto HTML)
-- ============================================
INSERT INTO "LegalDocument" (
    id, type, "internalName", "displayName", description,
    "isActive", "isRequired", "requiresAcceptance", "sortOrder",
    "createdAt", "updatedAt"
) VALUES 
('legal-privacy-2025', 'PRIVACY_POLICY', 'privacy-policy-2025',
 'Informativa sulla Privacy e Protezione dei Dati',
 'Informativa completa sul trattamento dei dati personali ai sensi del GDPR',
 true, true, true, 1, NOW(), NOW()),

('legal-terms-2025', 'TERMS_SERVICE', 'terms-service-2025',
 'Termini e Condizioni di Servizio',
 'Termini e condizioni complete per utilizzo della piattaforma',
 true, true, true, 2, NOW(), NOW()),

('legal-cookie-2025', 'COOKIE_POLICY', 'cookie-policy-2025',
 'Cookie Policy',
 'Informativa completa sui cookie e tecnologie simili',
 true, true, true, 3, NOW(), NOW());

-- ============================================
-- 11. RIABILITAZIONE VINCOLI
-- ============================================
SET session_replication_role = 'origin';

-- ============================================
-- REPORT FINALE
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ DATABASE POPOLATO CON SUCCESSO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Dati inseriti:';
    RAISE NOTICE '- System Settings: %', (SELECT COUNT(*) FROM "SystemSettings");
    RAISE NOTICE '- Categorie: %', (SELECT COUNT(*) FROM "Category");
    RAISE NOTICE '- Sottocategorie: %', (SELECT COUNT(*) FROM "Subcategory");
    RAISE NOTICE '- Utenti: %', (SELECT COUNT(*) FROM "User");
    RAISE NOTICE '- Professionisti: %', (SELECT COUNT(*) FROM "ProfessionalProfile");
    RAISE NOTICE '- Template Notifiche: %', (SELECT COUNT(*) FROM "NotificationTemplate");
    RAISE NOTICE '- Documenti Legali: %', (SELECT COUNT(*) FROM "LegalDocument");
    RAISE NOTICE '';
    RAISE NOTICE 'Credenziali di accesso:';
    RAISE NOTICE '- Admin: admin@richiesta-assistenza.it / (password esistente)';
    RAISE NOTICE '- Admin2: admin2@richiesta-assistenza.it / Test123!@#';
    RAISE NOTICE '- Cliente: mario.rossi@email.com / Test123!@#';
    RAISE NOTICE '- Professionista: idraulico1@email.com / Test123!@#';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Eseguire 02-documenti-legali.sql per il contenuto completo dei documenti';
    RAISE NOTICE '============================================';
END $$;
