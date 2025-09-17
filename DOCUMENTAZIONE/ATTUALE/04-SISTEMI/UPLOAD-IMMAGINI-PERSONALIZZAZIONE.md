# 📄 DOCUMENTAZIONE SISTEMA UPLOAD IMMAGINI E PERSONALIZZAZIONE
**Versione**: 1.0.0  
**Data**: 16 Gennaio 2025  
**Autore**: Team Sviluppo

---

## 📋 INDICE

1. [Overview](#overview)
2. [Sistema Upload Immagini](#sistema-upload-immagini)
3. [Sistema Impostazioni Pubbliche](#sistema-impostazioni-pubbliche)
4. [Personalizzazione Login Page](#personalizzazione-login-page)
5. [API Reference](#api-reference)
6. [Componenti UI](#componenti-ui)
7. [Database Schema](#database-schema)
8. [Guida Utente](#guida-utente)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 OVERVIEW

Il sistema di personalizzazione permette agli amministratori di modificare completamente l'aspetto e il branding dell'applicazione senza dover modificare il codice. Include:

- **Upload immagini** con drag & drop
- **Impostazioni di sistema** configurabili
- **Personalizzazione completa** della pagina di login
- **Endpoint pubblici** per le impostazioni di base
- **Cache intelligente** per ottimizzare le performance

### Caratteristiche Principali
- ✅ Upload immagini con anteprima
- ✅ Drag & Drop support
- ✅ Validazione file (tipo e dimensione)
- ✅ Impostazioni pubbliche senza autenticazione
- ✅ Logo, nome e claim personalizzabili
- ✅ Footer configurabile
- ✅ Cache con React Query

---

## 📤 SISTEMA UPLOAD IMMAGINI

### Architettura

Il sistema di upload è composto da:
- **Frontend**: Componente React `ImageUpload.tsx`
- **Backend**: Endpoint Express con Multer
- **Storage**: Directory `public/uploads/`

### Frontend - Componente ImageUpload

**Posizione**: `/src/components/admin/ImageUpload.tsx`

```typescript
interface ImageUploadProps {
  currentValue: string;
  settingKey: string;
  onUploadSuccess: (url: string) => void;
  accept?: string;
  maxSize?: number; // in MB
}
```

**Funzionalità**:
- Upload via drag & drop
- Upload via selezione file
- Inserimento URL manuale
- Anteprima immagine corrente
- Validazione tipo file
- Validazione dimensione (max 5MB default)
- Feedback visivo durante upload

**Utilizzo**:
```tsx
<ImageUpload
  currentValue={setting.value}
  settingKey={setting.key}
  onUploadSuccess={(newUrl) => handleUpdate(newUrl)}
  accept="image/*"
  maxSize={5}
/>
```

### Backend - Upload Endpoint

**Posizione**: `/backend/src/routes/upload.routes.ts`

**Endpoint**: `POST /api/admin/upload/image`

**Configurazione Multer**:
```javascript
const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo immagini sono permesse'));
    }
  }
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "url": "/uploads/image-1758012635752-56028404.png"
  },
  "message": "Immagine caricata con successo"
}
```

### Storage

**Directory**: `/public/uploads/`

- Creata automaticamente se non esiste
- Servita staticamente da Express
- Path pubblico: `http://localhost:3200/uploads/[filename]`

---

## 🌐 SISTEMA IMPOSTAZIONI PUBBLICHE

### Endpoint Pubblico

**Posizione**: `/backend/src/routes/public/system-settings.routes.ts`

**Endpoint**: `GET /api/public/system-settings/basic`

**Nessuna autenticazione richiesta**

**Chiavi pubbliche esposte**:
```javascript
const publicKeys = [
  'site_name',       // Nome dell'applicazione
  'site_logo_url',   // URL del logo
  'site_favicon_url',// URL della favicon
  'site_claim',      // Slogan/claim aziendale
  'company_name',    // Nome dell'azienda
  'site_version',    // Versione del sistema
  'company_address', // Indirizzo aziendale
  'company_phone',   // Telefono
  'company_email'    // Email aziendale
];
```

### React Hooks

**Posizione**: `/src/hooks/useSystemSettings.ts`

#### useSystemSettings()
Recupera le impostazioni principali:
```typescript
const { 
  siteName,     // Nome del sito
  siteLogo,     // URL del logo
  siteFavicon,  // URL della favicon
  siteVersion,  // Versione
  siteClaim,    // Claim/slogan
  companyName,  // Nome azienda
  isLoading     // Stato caricamento
} = useSystemSettings();
```

#### useSystemSettingsMap()
Recupera tutte le impostazioni come mappa:
```typescript
const { settings, isLoading } = useSystemSettingsMap();
// Accesso: settings['site_name'], settings['site_logo_url'], etc.
```

**Configurazione React Query**:
- Cache: 5 minuti
- No retry su errore
- No refetch su window focus

---

## 🎨 PERSONALIZZAZIONE LOGIN PAGE

### Elementi Personalizzabili

#### 1. Logo
- **Chiave**: `site_logo_url`
- **Posizione**: Sopra il titolo
- **Fallback**: Icona WrenchScrewdriverIcon se non configurato
- **Dimensione**: h-16 (64px)

#### 2. Nome Applicazione
- **Chiave**: `site_name`
- **Default**: "Richiesta Assistenza"
- **Stile**: text-3xl font-bold text-blue-600

#### 3. Claim Aziendale
- **Chiave**: `site_claim`
- **Default**: "Il tuo problema, la nostra soluzione!"
- **Stile**: text-lg italic text-blue-400
- **Posizione**: Sotto il nome, sopra "Accedi al tuo account"

#### 4. Footer
- **Copyright**: © 2025 [site_name]. Tutti i diritti riservati.
- **Links**: Privacy Policy • Termini di Servizio • Cookie Policy
- **Posizione**: In basso a destra nella sezione Quick Access

### Struttura Componente

**Posizione**: `/src/pages/LoginPage.tsx`

```tsx
const LoginPage: React.FC = () => {
  const { siteName, siteLogo, siteClaim, companyName } = useSystemSettings();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Logo dinamico */}
      {siteLogo ? (
        <img src={siteLogo} alt={siteName} className="h-16 w-auto" />
      ) : (
        <WrenchScrewdriverIcon className="h-8 w-8" />
      )}
      
      {/* Nome dinamico */}
      <h1 className="text-3xl font-bold text-blue-600">
        {siteName || 'Richiesta Assistenza'}
      </h1>
      
      {/* Claim dinamico */}
      <p className="text-lg italic text-blue-400">
        {siteClaim}
      </p>
    </div>
  );
};
```

---

## 🔌 API REFERENCE

### Upload Immagine

**Endpoint**: `POST /api/admin/upload/image`  
**Autenticazione**: Richiesta (Admin/Super Admin)  
**Content-Type**: multipart/form-data

**Request**:
```javascript
const formData = new FormData();
formData.append('image', file);

const response = await api.post('/admin/upload/image', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
```

**Response Success** (200):
```json
{
  "success": true,
  "data": {
    "url": "/uploads/image-1758012635752-56028404.png"
  },
  "message": "Immagine caricata con successo"
}
```

**Response Error** (400/500):
```json
{
  "success": false,
  "message": "Tipo di file non supportato",
  "code": "INVALID_FILE_TYPE"
}
```

### Impostazioni Pubbliche

**Endpoint**: `GET /api/public/system-settings/basic`  
**Autenticazione**: Non richiesta  
**Cache**: 5 minuti client-side

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "key": "site_name",
      "value": "Richiesta Assistenza"
    },
    {
      "key": "site_logo_url",
      "value": "/uploads/logo.png"
    },
    {
      "key": "site_claim",
      "value": "Il tuo problema, la nostra soluzione!"
    }
  ],
  "message": "Impostazioni pubbliche recuperate"
}
```

### Gestione Impostazioni (Admin)

**List**: `GET /api/admin/system-settings`  
**Create**: `POST /api/admin/system-settings`  
**Update**: `PUT /api/admin/system-settings/:id`  
**Delete**: `DELETE /api/admin/system-settings/:id`  

**Autenticazione**: Richiesta (Admin/Super Admin)

---

## 🎨 COMPONENTI UI

### ImageUpload Component

**Features**:
- Drag & Drop area
- File selection button
- URL input field
- Current image preview
- Upload progress indicator
- Error handling

**Props**:
```typescript
interface ImageUploadProps {
  currentValue: string;      // URL corrente dell'immagine
  settingKey: string;        // Chiave dell'impostazione
  onUploadSuccess: (url: string) => void; // Callback su successo
  accept?: string;           // Tipi file accettati (default: "image/*")
  maxSize?: number;          // Dimensione max in MB (default: 5)
}
```

### SystemSettingsPage Component

**Posizione**: `/src/pages/admin/SystemSettingsPage.tsx`

**Features**:
- Categorie laterali (Branding, Azienda, Contatti, Privacy, Sistema)
- Ricerca impostazioni
- Add/Edit/Delete impostazioni
- Upload integrato per campi logo/favicon
- Validazione form

---

## 💾 DATABASE SCHEMA

### Tabella SystemSettings

```sql
CREATE TABLE "SystemSettings" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "key" VARCHAR UNIQUE NOT NULL,
  "value" TEXT NOT NULL,
  "type" VARCHAR NOT NULL, -- string, number, boolean, json, text, url, email, file, color
  "category" VARCHAR NOT NULL, -- Branding, Azienda, Contatti, Privacy, Sistema
  "description" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "isEditable" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Impostazioni Predefinite

```sql
-- Logo del sito
INSERT INTO "SystemSettings" ("key", "value", "type", "category", "description")
VALUES ('site_logo_url', '/logo.svg', 'url', 'Branding', 'URL del logo principale');

-- Nome del sito
INSERT INTO "SystemSettings" ("key", "value", "type", "category", "description")
VALUES ('site_name', 'Richiesta Assistenza', 'string', 'Branding', 'Nome del sito/sistema');

-- Claim aziendale
INSERT INTO "SystemSettings" ("key", "value", "type", "category", "description")
VALUES ('site_claim', 'Il tuo problema, la nostra soluzione!', 'text', 'Branding', 
        'Slogan o claim aziendale mostrato nella pagina di login');
```

---

## 📚 GUIDA UTENTE

### Come Personalizzare il Logo

1. **Accedi come Admin**
   - Vai su http://localhost:5193/login
   - Accedi con credenziali admin

2. **Vai alle Impostazioni Sistema**
   - Menu laterale → "Impostazioni Sistema"
   - Oppure diretto: http://localhost:5193/admin/system-settings

3. **Modifica il Logo**
   - Categoria "Branding"
   - Trova `site_logo_url`
   - Clicca sull'icona matita
   - **3 opzioni**:
     - Inserisci URL diretto
     - Trascina un'immagine nell'area grigia
     - Clicca "Seleziona file"
   - Clicca "Salva"

4. **Verifica**
   - Il logo appare immediatamente nella sidebar
   - Logout e verifica nella pagina di login

### Come Modificare il Claim

1. **Trova l'impostazione**
   - Impostazioni Sistema → Branding
   - Cerca `site_claim`

2. **Modifica**
   - Clicca matita
   - Inserisci nuovo claim
   - Salva

3. **Risultato**
   - Visibile immediatamente nella pagina di login
   - Sotto il nome dell'app in corsivo blu chiaro

### Come Aggiungere Nuove Impostazioni

1. **Clicca "Aggiungi"** in alto a destra
2. **Compila il form**:
   - Chiave: nome univoco (es: `contact_email`)
   - Valore: contenuto
   - Tipo: string, text, url, email, etc.
   - Categoria: Branding, Azienda, Contatti, etc.
   - Descrizione: spiegazione dell'impostazione
3. **Salva**

---

## 🔧 TROUBLESHOOTING

### Problema: Immagine non si carica

**Sintomi**: 
- Errore "Immagine non disponibile"
- Console error 404

**Soluzioni**:
1. Verifica che la directory `/public/uploads/` esista
2. Controlla permessi scrittura sulla directory
3. Verifica che Express serva file statici:
   ```javascript
   app.use('/uploads', express.static(path.join(__dirname, '../../public/uploads')));
   ```

### Problema: Refresh continui nella login page

**Sintomi**:
- La pagina si ricarica continuamente
- Errori 401 nella console

**Causa**: L'endpoint delle impostazioni richiede autenticazione

**Soluzione**: 
- Usa l'endpoint pubblico `/api/public/system-settings/basic`
- Verifica che `refetchOnWindowFocus: false` sia impostato

### Problema: Upload fallisce con file grandi

**Sintomi**:
- Errore "File troppo grande"

**Soluzioni**:
1. Verifica limite in Multer (default 5MB)
2. Modifica se necessario:
   ```javascript
   limits: { fileSize: 10 * 1024 * 1024 } // 10MB
   ```
3. Verifica anche limite Express:
   ```javascript
   app.use(express.json({ limit: '10mb' }));
   ```

### Problema: Impostazioni non visibili nella login

**Sintomi**:
- Logo/nome/claim non appaiono

**Verifiche**:
1. L'endpoint pubblico funziona:
   ```bash
   curl http://localhost:3200/api/public/system-settings/basic
   ```
2. Le chiavi sono nella lista `publicKeys`
3. React Query cache non è scaduta
4. Nessun errore nella console browser

---

## 📈 PERFORMANCE

### Ottimizzazioni Implementate

1. **Cache React Query**
   - 5 minuti per impostazioni
   - No refetch su focus window
   - No retry su errore

2. **Compressione Immagini**
   - Validazione dimensione (max 5MB)
   - Formati ottimizzati (JPEG, PNG, WebP)

3. **Lazy Loading**
   - Componente ImageUpload caricato on-demand
   - Anteprima solo quando necessaria

4. **Database**
   - Indice su campo `key` per lookup veloce
   - Query ottimizzate con `select` specifici

---

## 🔒 SICUREZZA

### Misure Implementate

1. **Upload Files**
   - Validazione tipo MIME
   - Validazione estensione
   - Limite dimensione file
   - Nomi file randomizzati
   - No esecuzione script

2. **Endpoint Pubblici**
   - Solo chiavi whitelist esposte
   - No dati sensibili
   - Rate limiting applicato

3. **Autenticazione Admin**
   - JWT required per modifiche
   - Role check (ADMIN, SUPER_ADMIN)
   - Audit log su modifiche

---

## 📝 CHANGELOG

### v1.0.0 - 16 Gennaio 2025
- ✨ Sistema upload immagini completo
- ✨ Endpoint pubblico per impostazioni base
- ✨ Personalizzazione completa login page
- ✨ Logo, nome e claim configurabili
- ✨ Componente ImageUpload con drag & drop
- ✨ Hook React per gestione impostazioni
- 🐛 Fix refresh loop nella login page
- 🐛 Fix errori placeholder immagini
- 📝 Documentazione completa

---

## 🚀 PROSSIMI SVILUPPI

- [ ] Supporto multi-lingua per claim
- [ ] Temi colore personalizzabili
- [ ] Preview live delle modifiche
- [ ] Backup/restore impostazioni
- [ ] Gestione favicon browser
- [ ] Ottimizzazione immagini automatica
- [ ] Supporto SVG animati
- [ ] Template predefiniti

---

**Fine Documentazione**

Per supporto: lucamambelli@lmtecnologie.it
