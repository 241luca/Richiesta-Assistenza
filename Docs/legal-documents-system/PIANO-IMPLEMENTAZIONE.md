# 📚 Sistema Gestione Documenti Legali - Piano di Implementazione

## 🎯 Obiettivo
Creare un sistema enterprise per la gestione di documenti legali (Privacy Policy, Terms of Service, Cookie Policy) con versionamento completo e tracciamento delle accettazioni utente.

## 🏗️ Architettura del Sistema

### 1. Database Schema (Prisma)

#### Tabelle Principali:

```prisma
// Documenti Legali
model LegalDocument {
  id              String                @id @default(cuid())
  type            LegalDocumentType     // PRIVACY_POLICY, TERMS_SERVICE, COOKIE_POLICY
  internalName    String                // Nome interno (es: "privacy-policy-2025")
  isActive        Boolean               @default(false)
  metadata        Json?                 // Metadati aggiuntivi
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  createdBy       String
  versions        LegalDocumentVersion[]
  acceptances     UserLegalAcceptance[]
  
  @@unique([type, internalName])
  @@index([type, isActive])
}

// Versioni dei Documenti
model LegalDocumentVersion {
  id              String                @id @default(cuid())
  documentId      String
  version         String                // es: "1.0.0", "2.0.0"
  title           String                // Titolo visualizzato
  content         String                // Contenuto HTML
  contentPlain    String?               // Contenuto plain text per ricerche
  summary         String?               // Riassunto delle modifiche
  effectiveDate   DateTime              // Data di entrata in vigore
  expiryDate      DateTime?             // Data di scadenza (opzionale)
  language        String                @default("it")
  status          VersionStatus         // DRAFT, PUBLISHED, ARCHIVED
  requiresAccept  Boolean               @default(true)
  metadata        Json?
  createdAt       DateTime              @default(now())
  updatedAt       DateTime              @updatedAt
  createdBy       String
  publishedAt     DateTime?
  publishedBy     String?
  
  document        LegalDocument         @relation(fields: [documentId], references: [id])
  acceptances     UserLegalAcceptance[]
  
  @@unique([documentId, version])
  @@index([status, effectiveDate])
}

// Accettazioni Utente
model UserLegalAcceptance {
  id              String                @id @default(cuid())
  userId          String
  documentId      String
  versionId       String
  acceptedAt      DateTime              @default(now())
  ipAddress       String
  userAgent       String?
  method          AcceptanceMethod      // EXPLICIT_CLICK, IMPLICIT_SCROLL, API, IMPORT
  metadata        Json?                 // Info aggiuntive (es: checkbox state, scroll percentage)
  
  user            User                  @relation(fields: [userId], references: [id])
  document        LegalDocument         @relation(fields: [documentId], references: [id])
  version         LegalDocumentVersion  @relation(fields: [versionId], references: [id])
  
  @@unique([userId, documentId, versionId])
  @@index([userId, acceptedAt])
  @@index([documentId, versionId])
}

// Enum Types
enum LegalDocumentType {
  PRIVACY_POLICY
  TERMS_SERVICE
  COOKIE_POLICY
  DPA              // Data Processing Agreement
  SLA              // Service Level Agreement
  NDA              // Non-Disclosure Agreement
  CUSTOM
}

enum VersionStatus {
  DRAFT
  REVIEW
  APPROVED
  PUBLISHED
  ARCHIVED
  SUPERSEDED
}

enum AcceptanceMethod {
  EXPLICIT_CLICK    // Click esplicito su checkbox/button
  IMPLICIT_SCROLL   // Scroll completo del documento
  API              // Accettazione via API
  IMPORT           // Importato da sistema esterno
  REGISTRATION     // Durante registrazione
  LOGIN            // Durante login
}
```

### 2. Backend API Endpoints

#### Gestione Documenti (Admin)
- `GET /api/admin/legal-documents` - Lista documenti
- `POST /api/admin/legal-documents` - Crea documento
- `PUT /api/admin/legal-documents/:id` - Aggiorna documento
- `DELETE /api/admin/legal-documents/:id` - Elimina documento

#### Gestione Versioni (Admin)
- `GET /api/admin/legal-documents/:id/versions` - Lista versioni
- `POST /api/admin/legal-documents/:id/versions` - Crea nuova versione
- `PUT /api/admin/legal-documents/:id/versions/:versionId` - Aggiorna versione
- `POST /api/admin/legal-documents/:id/versions/:versionId/publish` - Pubblica versione
- `POST /api/admin/legal-documents/:id/versions/:versionId/archive` - Archivia versione

#### Accesso Pubblico
- `GET /api/public/legal/:type` - Ottieni documento attivo per tipo
- `GET /api/public/legal/:type/version/:version` - Ottieni versione specifica
- `POST /api/legal/accept` - Registra accettazione

#### Report e Analytics (Admin)
- `GET /api/admin/legal-documents/acceptances` - Report accettazioni
- `GET /api/admin/legal-documents/pending-users` - Utenti con documenti da accettare
- `GET /api/admin/legal-documents/export` - Export dati per GDPR

### 3. Frontend Components

#### Editor Avanzato
```typescript
// Utilizzeremo TinyMCE o Quill per l'editor
- Rich text editing
- Inserimento immagini
- Tabelle
- Link
- Formattazione avanzata
- Template predefiniti
- Preview live
- Diff tra versioni
```

#### Admin Dashboard
```typescript
// Pagine principali
- /admin/legal-documents                    // Lista e gestione
- /admin/legal-documents/new                // Nuovo documento
- /admin/legal-documents/:id/edit           // Modifica documento
- /admin/legal-documents/:id/versions       // Gestione versioni
- /admin/legal-documents/:id/version/new    // Nuova versione
- /admin/legal-documents/:id/acceptances    // Report accettazioni
```

#### User Interface
```typescript
// Componenti utente
- Modal di accettazione al login
- Pagina dedicata per lettura documenti
- Banner notifica nuove versioni
- Storico accettazioni nel profilo
```

### 4. Funzionalità Chiave

#### Versionamento
- Semantic versioning (MAJOR.MINOR.PATCH)
- Changelog automatico
- Confronto visuale tra versioni (diff)
- Rollback a versioni precedenti
- Branch per bozze

#### Notifiche
- Email per nuove versioni critiche
- Banner in-app per documenti da accettare
- Reminder periodici per non accettati
- Notifica admin per scadenze

#### Compliance
- Export GDPR compliant
- Audit trail completo
- Timestamp certificati
- Archiviazione sicura
- Retention policy

#### Analytics
- Tasso di accettazione
- Tempo medio di lettura
- Metodi di accettazione
- Report per documento/versione
- Export CSV/PDF

## 📝 Step di Implementazione

### Fase 1: Database e Backend Core
1. ✅ Creare schema Prisma
2. ⏳ Migrare database
3. ⏳ Creare services base
4. ⏳ Implementare API CRUD
5. ⏳ Aggiungere validazione Zod

### Fase 2: Editor e Admin UI
1. ⏳ Integrare editor WYSIWYG
2. ⏳ Creare form creazione/modifica
3. ⏳ Implementare preview
4. ⏳ Aggiungere versioning UI
5. ⏳ Creare dashboard analytics

### Fase 3: User Experience
1. ⏳ Modal accettazione
2. ⏳ Pagine pubbliche documenti
3. ⏳ Sistema notifiche
4. ⏳ Integrazione con registrazione/login

### Fase 4: Features Avanzate
1. ⏳ Diff tra versioni
2. ⏳ Template documenti
3. ⏳ Multi-lingua
4. ⏳ Firma digitale
5. ⏳ Webhook per integrazioni

## 🔧 Tecnologie Utilizzate

- **Editor**: TinyMCE o Quill.js
- **Diff Viewer**: react-diff-viewer
- **PDF Export**: jsPDF + html2pdf
- **Validation**: Zod
- **Date Management**: date-fns
- **Styling**: TailwindCSS

## 🚀 Performance Considerations

- Lazy loading per documenti lunghi
- Caching delle versioni pubblicate
- Indicizzazione full-text per ricerche
- CDN per assets dei documenti
- Compression per storage

## 🔒 Security

- Sanitizzazione HTML input
- Rate limiting su accettazioni
- Validazione IP per frodi
- Encryption at rest
- Backup automatici

## 📊 KPI da Monitorare

- Completion rate accettazioni
- Tempo medio alla accettazione  
- Bounce rate su documenti
- Versioni per documento/anno
- Copertura utenti (% con accettazioni valide)

## 🎯 Success Criteria

- [ ] 100% utenti con documenti accettati validi
- [ ] < 2 secondi caricamento documenti
- [ ] Zero data loss
- [ ] GDPR compliance certificata
- [ ] 99.9% uptime del sistema
