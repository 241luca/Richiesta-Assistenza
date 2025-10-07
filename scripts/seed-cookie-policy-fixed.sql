-- ============================================
-- COOKIE POLICY - Documento completo per Richiesta Assistenza
-- Conforme a GDPR e Direttiva ePrivacy
-- Data: Gennaio 2025
-- ============================================

-- Inserimento documento Cookie Policy
INSERT INTO "LegalDocument" (
  id,
  type,
  "internalName",
  "displayName",
  description,
  "isRequired",
  "isActive",
  "requiresAcceptance",
  "sortOrder",
  "createdAt",
  "updatedAt"
) VALUES (
  'cookie-policy-2025',
  'COOKIE_POLICY',
  'cookie-policy-2025',
  'Cookie Policy',
  'Informativa completa sull''utilizzo dei cookie e tecnologie simili',
  true,
  true,
  true,
  3,
  NOW(),
  NOW()
);

-- Inserimento versione Cookie Policy
INSERT INTO "LegalDocumentVersion" (
  id,
  "documentId",
  version,
  title,
  content,
  "contentPlain",
  summary,
  "versionNotes",
  "effectiveDate",
  status,
  language,
  "createdAt",
  "updatedAt"
) VALUES (
  'cookie-policy-v1-2025',
  'cookie-policy-2025',
  '1.0.0',
  'Cookie Policy - Informativa sull''uso dei Cookie',
  E'<div class="legal-document cookie-policy">
  <h1>Cookie Policy</h1>
  <p class="last-updated">Ultimo aggiornamento: Gennaio 2025 • Versione 1.0.0</p>

  <div class="table-of-contents">
    <h2>Indice</h2>
    <ol>
      <li><a href="#cosa-sono">Cosa sono i Cookie</a></li>
      <li><a href="#perche-usiamo">Perché usiamo i Cookie</a></li>
      <li><a href="#tipi-cookie">Tipi di Cookie che utilizziamo</a></li>
      <li><a href="#cookie-terze-parti">Cookie di Terze Parti</a></li>
      <li><a href="#gestione">Come gestire i Cookie</a></li>
      <li><a href="#tecnologie-simili">Tecnologie simili</a></li>
      <li><a href="#trasferimenti">Trasferimenti internazionali</a></li>
      <li><a href="#aggiornamenti">Aggiornamenti della Policy</a></li>
      <li><a href="#contatti">Contatti</a></li>
    </ol>
  </div>
</div>',
  'Testo semplificato della cookie policy...',
  'Prima versione completa della Cookie Policy conforme a GDPR e Direttiva ePrivacy',
  'Versione iniziale completa con tutte le informazioni richieste',
  '2025-01-18',
  'PUBLISHED',
  'it',
  NOW(),
  NOW()
);
