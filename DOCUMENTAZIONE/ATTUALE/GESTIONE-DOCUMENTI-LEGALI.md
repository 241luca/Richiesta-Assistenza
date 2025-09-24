# 📚 SISTEMA GESTIONE DOCUMENTI LEGALI
**Versione**: 1.0.0  
**Data**: 18 Gennaio 2025  
**Stato**: ✅ Implementato e Funzionante

---

## 📋 INDICE

1. [Panoramica](#1-panoramica)
2. [Architettura del Sistema](#2-architettura-del-sistema)
3. [Componenti Principali](#3-componenti-principali)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend - Editor](#6-frontend---editor)
7. [Gestione Versioni](#7-gestione-versioni)
8. [Template Predefiniti](#8-template-predefiniti)
9. [Configurazione TinyMCE](#9-configurazione-tinymce)
10. [Sicurezza e Permessi](#10-sicurezza-e-permessi)
11. [Guida Utente](#11-guida-utente)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. PANORAMICA

### Descrizione
Il Sistema di Gestione Documenti Legali permette agli amministratori di creare, modificare e gestire documenti legali come Privacy Policy, Termini di Servizio e Cookie Policy. Include un editor WYSIWYG avanzato, gestione versioni e template predefiniti GDPR-compliant.

### Funzionalità Principali
- **Editor WYSIWYG** professionale con TinyMCE 8
- **Gestione versioni** completa dei documenti
- **Template predefiniti** GDPR-compliant
- **Preview in tempo reale** dei documenti
- **Export e pubblicazione** automatica
- **Storico modifiche** tracciato

### Documenti Supportati
- Privacy Policy (GDPR)
- Termini e Condizioni di Servizio  
- Cookie Policy
- Disclaimer
- Condizioni di Vendita
- Documenti Custom

---

## 2. ARCHITETTURA DEL SISTEMA

### Stack Tecnologico
```
Frontend:
├── React 18.3
├── TinyMCE 8 (Editor WYSIWYG)
├── React Query (Gestione stato server)
├── TailwindCSS (Styling)
└── TypeScript

Backend:
├── Node.js + Express
├── Prisma ORM
├── PostgreSQL
└── API RESTful
```

### Flusso Dati
```
[Editor TinyMCE] → [React Component] → [API] → [Database]
                                         ↓
                                    [Versioning System]
```

---

## 3. COMPONENTI PRINCIPALI

### Frontend Components

#### LegalDocumentEditor.tsx
Il componente principale che gestisce l'intera interfaccia dell'editor.

**Path**: `/src/pages/admin/LegalDocumentEditor.tsx`

**Funzionalità**:
- Caricamento documenti dal database
- Editor WYSIWYG con TinyMCE
- Gestione versioni documenti
- Applicazione template predefiniti
- Preview in tempo reale
- Salvataggio e aggiornamento

#### LegalDocuments.tsx
Componente per la visualizzazione e gestione lista documenti.

**Path**: `/src/pages/admin/LegalDocuments.tsx`

**Funzionalità**:
- Lista tutti i documenti legali
- Creazione nuovi documenti
- Pubblicazione/ritiro versioni
- Gestione metadata documenti

### Backend Services

#### legalDocuments.service.ts
**Path**: `/backend/src/services/legalDocuments.service.ts`

```typescript
// Funzioni principali
- getAllDocuments()
- getDocumentById(id)
- createDocument(data)
- updateDocument(id, data)
- createVersion(documentId, versionData)
- publishVersion(documentId, versionId)
- getActiveVersion(documentType)
```

---

## 4. DATABASE SCHEMA

### Tabella: LegalDocument
```prisma
model LegalDocument {
  id           String    @id @default(cuid())
  type         String    @unique  // PRIVACY_POLICY, TERMS_SERVICE, etc.
  internalName String    // Nome interno per admin
  displayName  String    // Nome visualizzato pubblicamente
  description  String?   // Descrizione documento
  isActive     Boolean   @default(true)
  versions     LegalDocumentVersion[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### Tabella: LegalDocumentVersion
```prisma
model LegalDocumentVersion {
  id            String    @id @default(cuid())
  documentId    String
  document      LegalDocument @relation(fields: [documentId], references: [id])
  version       String    // es: "1.0.0"
  title         String    
  content       String    @db.Text  // HTML content
  contentPlain  String?   @db.Text  // Plain text version
  effectiveDate DateTime
  expiryDate    DateTime?
  status        String    // DRAFT, PUBLISHED, ARCHIVED
  publishedBy   String?
  language      String    @default("it")
  metadata      Json?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## 5. API ENDPOINTS

### Documenti

#### GET /api/admin/legal-documents
Recupera tutti i documenti legali con le loro versioni.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "doc1",
      "type": "PRIVACY_POLICY",
      "displayName": "Informativa Privacy",
      "versions": [...]
    }
  ]
}
```

#### POST /api/admin/legal-documents
Crea un nuovo documento legale.

**Request Body**:
```json
{
  "type": "PRIVACY_POLICY",
  "internalName": "privacy-policy-v1",
  "displayName": "Informativa sulla Privacy",
  "description": "Documento GDPR compliant"
}
```

### Versioni

#### POST /api/admin/legal-documents/:documentId/versions
Crea una nuova versione del documento.

**Request Body**:
```json
{
  "version": "1.0.1",
  "title": "Privacy Policy v1.0.1",
  "content": "<h1>Privacy Policy</h1>...",
  "contentPlain": "Privacy Policy...",
  "effectiveDate": "2025-01-18T00:00:00Z",
  "language": "it"
}
```

#### PUT /api/admin/legal-documents/:documentId/versions/:versionId
Aggiorna una versione esistente.

#### POST /api/admin/legal-documents/:documentId/versions/:versionId/publish
Pubblica una versione rendendola attiva.

---

## 6. FRONTEND - EDITOR

### Layout Interfaccia

```
┌─────────────────────────────────────────────────────────────┐
│                     Header con Titolo                        │
│  [Editor Documenti Legali]           [Nuova Ver] [Salva]    │
├─────────────────────────────────────────────────────────────┤
│                  Documenti (Orizzontale)                     │
│  [Privacy Policy] [Terms Service] [Cookie Policy] [+]        │
│  Versioni: [v1.0.0 ✅] [v1.0.1 📝] [v1.0.2 📝]              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                      Editor TinyMCE                         │
│                                                              │
│                    (Area principale 90%)                     │
│                                                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Funzionalità Editor

#### Toolbar Principale
- Formattazione testo (Bold, Italic, Underline)
- Allineamento (Left, Center, Right, Justify)
- Liste (Ordinate, Non ordinate)
- Link e Immagini
- Tabelle
- Codice sorgente HTML
- Preview fullscreen

#### Stili Personalizzati
- Titoli GDPR-compliant
- Box informativi (Importante, Attenzione, Successo)
- Formattazione legale (Articoli, Comma)
- Citazioni e riferimenti normativi

---

## 7. GESTIONE VERSIONI

### Stati delle Versioni

| Stato | Descrizione | Azioni Disponibili |
|-------|-------------|-------------------|
| **DRAFT** | Bozza in lavorazione | Modifica, Elimina, Pubblica |
| **PUBLISHED** | Versione attiva pubblicata | Visualizza, Archivia |
| **ARCHIVED** | Versione storica archiviata | Visualizza, Ripristina |

### Workflow Versioni

```
[Crea Versione] → [DRAFT] → [Modifica] → [Review] → [PUBLISHED]
                     ↓                                    ↓
                [Elimina]                            [ARCHIVED]
```

### Numerazione Versioni
Segue il formato Semantic Versioning: `MAJOR.MINOR.PATCH`
- **MAJOR**: Cambiamenti sostanziali
- **MINOR**: Aggiunte/modifiche minori
- **PATCH**: Correzioni e piccoli aggiustamenti

---

## 8. TEMPLATE PREDEFINITI

### Privacy Policy (GDPR)
Template completo con tutte le sezioni richieste dal GDPR:
- Titolare del trattamento
- Tipologie di dati raccolti
- Finalità del trattamento
- Base giuridica
- Diritti dell'interessato (Art. 15-22)
- Periodo di conservazione
- Contatti DPO

### Terms of Service
Template strutturato per termini di servizio:
- Accettazione dei termini
- Descrizione del servizio
- Obblighi dell'utente
- Limitazioni di responsabilità
- Proprietà intellettuale
- Legge applicabile

### Cookie Policy
Template per informativa cookie:
- Tipologie di cookie
- Cookie tecnici
- Cookie analitici
- Cookie di terze parti
- Gestione preferenze
- Disabilitazione

---

## 9. CONFIGURAZIONE TINYMCE

### Setup API Key

#### 1. Ottenere API Key
1. Registrarsi su [tiny.cloud](https://www.tiny.cloud/auth/signup/)
2. Creare un nuovo progetto
3. Copiare la API key generata

#### 2. Configurare nel Sistema
1. Accedere a `/admin/api-keys`
2. Trovare la card "TinyMCE"
3. Cliccare "Configura"
4. Inserire la API key
5. Salvare

#### 3. Verifica Configurazione
```javascript
// Il sistema carica automaticamente la chiave dal database
// Path: /admin/api-keys/TINYMCE/raw
// La chiave NON è hardcoded nel codice
```

### Plugin Compatibili TinyMCE 8
```javascript
plugins: [
  'advlist', 'autolink', 'lists', 'link', 'image', 
  'charmap', 'preview', 'anchor', 'searchreplace', 
  'visualblocks', 'code', 'fullscreen', 'insertdatetime', 
  'media', 'table', 'help', 'wordcount', 'emoticons',
  'pagebreak', 'nonbreaking', 'visualchars', 'quickbars', 
  'codesample', 'directionality', 'save', 'autosave'
]
```

⚠️ **Plugin Obsoleti (NON usare)**:
- `template`, `print`, `hr`, `paste`, `imagetools`, `textpattern`, `noneditable`, `toc`

---

## 10. SICUREZZA E PERMESSI

### Controllo Accessi
- Solo utenti con ruolo `ADMIN` o `SUPER_ADMIN` possono accedere
- Autenticazione JWT richiesta per tutte le operazioni
- Audit log per ogni modifica

### Sanitizzazione Content
- HTML content viene sanitizzato prima del salvataggio
- XSS protection attiva
- Content Security Policy configurata

### Backup e Recovery
- Backup automatico prima di ogni pubblicazione
- Storico completo delle versioni mantenuto
- Possibilità di rollback a versioni precedenti

---

## 11. GUIDA UTENTE

### Come Creare un Nuovo Documento

1. **Accedere all'Editor**
   - Navigare a `/admin/legal-documents/editor`
   - Verificare di avere i permessi admin

2. **Selezionare Tipo Documento**
   - Cliccare sul tipo di documento dalla lista orizzontale
   - Se nuovo, cliccare "+" per crearne uno

3. **Applicare Template (Opzionale)**
   - Cliccare "Applica Template"
   - Il sistema caricherà il template appropriato

4. **Modificare Contenuto**
   - Usare l'editor TinyMCE per modifiche
   - Formattare secondo necessità
   - Aggiungere sezioni personalizzate

5. **Salvare Versione**
   - Inserire numero versione (es: 1.0.0)
   - Aggiungere titolo versione
   - Cliccare "Salva"

### Come Pubblicare una Versione

1. Selezionare la versione da pubblicare
2. Verificare il contenuto in preview
3. Cliccare "Pubblica"
4. Confermare la pubblicazione
5. La versione diventerà attiva per gli utenti

### Best Practices

- **Sempre testare** in preview prima di pubblicare
- **Mantenere versioning** consistente
- **Documentare cambiamenti** nel titolo versione
- **Backup prima** di modifiche maggiori
- **Review legale** per cambiamenti sostanziali

---

## 12. TROUBLESHOOTING

### Problemi Comuni e Soluzioni

#### Editor non si carica
**Problema**: L'editor TinyMCE non appare
**Soluzione**:
1. Verificare API key configurata in `/admin/api-keys`
2. Controllare console browser per errori
3. Ricaricare la pagina
4. Verificare connessione internet

#### Template troncati
**Problema**: I template si caricano parzialmente
**Soluzione**:
- Verificare versione TinyMCE (deve essere 8.x)
- Controllare che `onEditorChange` sia configurato
- Verificare limite caratteri database

#### Salvataggio fallisce
**Problema**: Errore nel salvare le modifiche
**Soluzione**:
1. Verificare permessi utente (ADMIN)
2. Controllare validazione campi (versione, titolo)
3. Verificare spazio database
4. Controllare log errori backend

#### Plugin mancanti
**Problema**: Alcuni pulsanti toolbar non funzionano
**Soluzione**:
- TinyMCE 8 ha rimosso alcuni plugin
- Usare solo plugin compatibili (vedi sezione 9)
- Non usare: template, print, hr, paste, imagetools

### Log e Debug

#### Frontend Logs
```javascript
// Abilitare debug TinyMCE
console.log('TinyMCE API Response:', response.data);
console.log('TinyMCE key loaded from database successfully');
```

#### Backend Logs
```bash
# Verificare log backend
tail -f backend/logs/error.log
tail -f backend/logs/combined.log
```

### Contatti Supporto
Per problemi non risolti, contattare:
- Email: support@lmtecnologie.it
- Documentazione: `/documentazione/attuale/`

---

## 📝 CHANGELOG

### Versione 1.0.0 (18 Gennaio 2025)
- ✅ Implementazione iniziale completa
- ✅ Editor TinyMCE 8 integrato
- ✅ Sistema versioning documenti
- ✅ Template GDPR-compliant
- ✅ Layout orizzontale ottimizzato
- ✅ Caricamento API key da database

---

**Fine Documentazione**

Per aggiornamenti e modifiche future, consultare sempre l'ultima versione in `/documentazione/attuale/`
