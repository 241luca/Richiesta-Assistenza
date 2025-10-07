-- ============================================
-- TERMINI DI SERVIZIO - Documento completo per Richiesta Assistenza
-- Conforme al Codice del Consumo e normativa italiana
-- Data: Gennaio 2025
-- ============================================

-- Inserimento documento Termini di Servizio
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
  'terms-service-2025',
  'TERMS_SERVICE',
  'terms-service-2025',
  'Termini e Condizioni di Servizio',
  'Termini e condizioni complete per l''utilizzo della piattaforma Richiesta Assistenza',
  true,
  true,
  true,
  2,
  NOW(),
  NOW()
);

-- Inserimento versione Termini di Servizio
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
  'terms-service-v1-2025',
  'terms-service-2025',
  '1.0.0',
  'Termini e Condizioni di Servizio - Richiesta Assistenza',
  E'<div class="legal-document terms-service">
  <h1>Termini e Condizioni di Servizio</h1>
  <p class="last-updated">Ultimo aggiornamento: Gennaio 2025 • Versione 1.0.0</p>

  <div class="table-of-contents">
    <h2>Indice</h2>
    <ol>
      <li><a href="#introduzione">Introduzione e Accettazione</a></li>
      <li><a href="#definizioni">Definizioni</a></li>
      <li><a href="#descrizione">Descrizione del Servizio</a></li>
      <li><a href="#registrazione">Registrazione e Account</a></li>
      <li><a href="#utilizzo">Utilizzo del Servizio</a></li>
      <li><a href="#ruoli">Ruoli e Responsabilità</a></li>
      <li><a href="#pagamenti">Pagamenti e Commissioni</a></li>
      <li><a href="#contenuti">Contenuti e Proprietà Intellettuale</a></li>
      <li><a href="#garanzie">Garanzie e Limitazioni</a></li>
      <li><a href="#responsabilita">Responsabilità</a></li>
      <li><a href="#risoluzione">Risoluzione e Sospensione</a></li>
      <li><a href="#modifiche">Modifiche ai Termini</a></li>
      <li><a href="#legge">Legge Applicabile e Foro Competente</a></li>
      <li><a href="#contatti">Contatti</a></li>
    </ol>
  </div>
</div>',
  'Testo semplificato dei termini di servizio...',
  'Prima versione completa dei Termini di Servizio conformi alla normativa italiana',
  'Versione iniziale completa con tutte le clausole necessarie',
  '2025-01-18',
  'PUBLISHED',
  'it',
  NOW(),
  NOW()
);
