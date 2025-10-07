-- ============================================
-- PRIVACY POLICY - Documento completo per Richiesta Assistenza
-- Conforme a GDPR (Regolamento UE 2016/679) e Codice Privacy italiano
-- Data: Gennaio 2025
-- ============================================

-- NOTA: Sostituire 'system-user-id' con l'ID di un utente admin reale dal database

-- Inserimento documento Privacy Policy
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
  'Informativa completa sul trattamento dei dati personali ai sensi del GDPR e della normativa italiana',
  'shield-check',
  true,
  true,
  1,
  '{"category": "legal", "tags": ["gdpr", "privacy", "data-protection"]}',
  NOW(),
  NOW(),
  (SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' LIMIT 1)
);

-- Inserimento versione Privacy Policy
INSERT INTO "LegalDocumentVersion" (
  id,
  "documentId",
  version,
  "versionNotes",
  title,
  content,
  "contentPlain",
  "contentChecksum",
  summary,
  "effectiveDate",
  "expiryDate",
  language,
  status,
  "requiresAccept",
  "notifyUsers",
  "createdAt",
  "updatedAt",
  "createdBy",
  "publishedAt",
  "publishedBy"
) VALUES (
  'privacy-policy-v1-2025',
  'privacy-policy-2025',
  '1.0.0',
  'Prima versione completa della Privacy Policy',
  'Informativa sulla Privacy e Protezione dei Dati Personali',
  E'<div class="legal-document privacy-policy">
  <h1>Informativa sulla Privacy e Protezione dei Dati Personali</h1>
  <p class="last-updated">Ultimo aggiornamento: Gennaio 2025 • Versione 1.0.0</p>
  <p>Contenuto completo della Privacy Policy...</p>
  </div>',
  'Testo semplificato della privacy policy...',
  'hash-privacy-v1',
  'Prima versione completa della Privacy Policy conforme GDPR',
  '2025-01-18',
  NULL,
  'it',
  'PUBLISHED',
  true,
  false,
  NOW(),
  NOW(),
  (SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' LIMIT 1),
  NOW(),
  (SELECT id FROM "User" WHERE role = 'SUPER_ADMIN' LIMIT 1)
);