# 🎨 SISTEMA BRANDING DINAMICO - DOCUMENTAZIONE COMPLETA v6.0

**Data Creazione**: 03 Ottobre 2025  
**Ultima Modifica**: 03 Ottobre 2025  
**Versione Sistema**: 6.0.0  
**Autore**: Team Development  
**Stato**: ✅ COMPLETO E FUNZIONANTE

---

## 📋 INDICE

1. [Overview del Sistema](#overview-del-sistema)
2. [Funzionalità Implementate](#funzionalità-implementate)
3. [Architettura Tecnica](#architettura-tecnica)
4. [Configurazione System Settings](#configurazione-system-settings)
5. [Componenti Personalizzabili](#componenti-personalizzabili)
6. [API e Endpoints](#api-e-endpoints)
7. [Guida Amministratore](#guida-amministratore)
8. [Sviluppo e Integrazione](#sviluppo-e-integrazione)
9. [Testing e Validazione](#testing-e-validazione)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 OVERVIEW DEL SISTEMA

Il **Sistema di Branding Dinamico** permette la personalizzazione completa dell'identità visiva e delle informazioni aziendali dell'applicazione senza modificare il codice sorgente.

### Caratteristiche Principali:
- ✅ **100% Personalizzabile** via pannello admin
- ✅ **Real-time Updates** con cache intelligente (30 secondi)
- ✅ **Multi-tenant Ready** per white-label
- ✅ **Responsive Design** su tutti i dispositivi
- ✅ **GDPR Compliant** per documenti legali
- ✅ **Social Media Integration** completa
- ✅ **Performance Optimized** con lazy loading

### Benefici:
- 🚀 **Zero Downtime** per modifiche branding
- 💰 **Cost Effective** - no sviluppatore necessario
- 🎨 **Brand Consistency** su tutta l'app
- 📱 **Mobile First** approccio
- 🌍 **Multi-language Ready** (future)

---

## ✨ FUNZIONALITÀ IMPLEMENTATE

### 1. **Gestione Logo e Favicon** 
```typescript
- Upload drag & drop
- Formati supportati: PNG, JPG, SVG
- Auto-resize e ottimizzazione
- Fallback intelligente
- Cache busting automatico
```

### 2. **Informazioni Aziendali**
```typescript
- Ragione sociale
- Partita IVA
- Descrizione azienda
- Claim aziendale
- Versione sistema
```

### 3. **Contatti Completi**
```typescript
- Telefono fisso e mobile
- Email e PEC
- Indirizzo completo (via, CAP, città, paese)
- Orari di apertura
- Coordinate GPS (future)
```

### 4. **Social Media**
```typescript
- Facebook
- Instagram
- LinkedIn
- Twitter/X
- YouTube (future)
- TikTok (future)
```

### 5. **Documenti Legali Personalizzabili**
```typescript
- Privacy Policy
- Termini di Servizio
- Cookie Policy
- GDPR Compliance
- Editor WYSIWYG integrato
```

### 6. **Colori e Temi** (Parziale)
```typescript
- Primary color
- Secondary color
- Accent color
- Dark mode (future)
```

---

## 🏗️ ARCHITETTURA TECNICA

### Stack Tecnologico

#### **Frontend**
```typescript
// React 19 + TypeScript
- Components: React Functional Components con Hooks
- State Management: React Query v5 + Zustand
- Styling: TailwindCSS v3
- Icons: Heroicons v2
- Forms: React Hook Form + Zod
```

#### **Backend**
```typescript
// Node.js + Express v5
- Database: PostgreSQL + Prisma ORM
- Validation: Zod schemas
- Caching: Redis (30s TTL)
- File Upload: Multer
- Image Processing: Sharp
```

### Schema Database

```prisma
model SystemSettings {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String   @db.Text
  type        String   // string, number, boolean, json, url, email
  category    String   // branding, contact, social, legal, system
  description String?
  isActive    Boolean  @default(true)
  isEditable  Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([key])
  @@index([category])
}
```

### Architettura dei Componenti

```
src/
├── hooks/
│   └── useSystemSettings.ts       # Hook per accesso settings
├── components/
│   ├── Layout.tsx                 # Layout con branding
│   ├── InfoPanel.tsx              # Pannello informazioni
│   ├── MinimalFooter.tsx          # Footer personalizzato
│   └── BrandingDisplay.tsx        # Display componenti brand
├── pages/
│   ├── ContactPage.tsx            # Pagina contatti
│   ├── LegalPage.tsx              # Documenti legali
│   └── admin/
│       └── SystemSettingsPage.tsx # Admin panel
└── services/
    └── systemSettings.service.ts  # Business logic
```

---

## ⚙️ CONFIGURAZIONE SYSTEM SETTINGS

### Chiavi Disponibili

#### **🎨 Branding**
| Chiave | Tipo | Descrizione | Default |
|--------|------|-------------|---------|
| `site_name` | string | Nome del sito | "Richiesta Assistenza" |
| `site_logo_url` | url | URL logo principale | "/logo.svg" |
| `site_favicon_url` | url | URL favicon | "/favicon.ico" |
| `site_claim` | string | Tagline aziendale | "Il tuo problema, la nostra soluzione!" |
| `site_version` | string | Versione sistema | "v6.0.0" |
| `primary_color` | string | Colore primario | "#3B82F6" |
| `secondary_color` | string | Colore secondario | "#8B5CF6" |

#### **🏢 Azienda**
| Chiave | Tipo | Descrizione | Default |
|--------|------|-------------|---------|
| `company_name` | string | Ragione sociale | "LM Tecnologie" |
| `company_vat` | string | Partita IVA | "IT12345678901" |
| `company_description` | text | Descrizione | "Sistema professionale..." |
| `company_fiscal_code` | string | Codice fiscale | "" |
| `company_rea` | string | Numero REA | "" |
| `company_capital` | string | Capitale sociale | "" |

#### **📞 Contatti**
| Chiave | Tipo | Descrizione | Default |
|--------|------|-------------|---------|
| `contact_phone` | string | Telefono principale | "+39 02 1234567" |
| `contact_mobile` | string | Cellulare | "+39 333 1234567" |
| `contact_email` | email | Email principale | "info@assistenza.it" |
| `contact_pec` | email | PEC aziendale | "assistenza@pec.it" |
| `contact_address` | string | Via e numero | "Via Example 123" |
| `contact_city` | string | Città | "Milano" |
| `contact_cap` | string | CAP | "20121" |
| `contact_province` | string | Provincia | "MI" |
| `contact_country` | string | Nazione | "Italia" |
| `contact_hours` | string | Orari apertura | "Lun-Ven: 9:00-18:00" |

#### **🌐 Social Media**
| Chiave | Tipo | Descrizione | Default |
|--------|------|-------------|---------|
| `social_facebook` | url | Facebook page | "" |
| `social_instagram` | url | Instagram profile | "" |
| `social_linkedin` | url | LinkedIn company | "" |
| `social_twitter` | url | Twitter/X account | "" |
| `social_youtube` | url | YouTube channel | "" |
| `social_whatsapp` | string | WhatsApp number | "" |

#### **📄 Documenti Legali**
| Chiave | Tipo | Descrizione | Default |
|--------|------|-------------|---------|
| `privacy_policy_url` | string | URL privacy | "/legal/privacy" |
| `terms_service_url` | string | URL termini | "/legal/terms" |
| `cookie_policy_url` | string | URL cookie | "/legal/cookies" |
| `legal_footer_text` | text | Testo footer legale | "" |

---

## 🎨 COMPONENTI PERSONALIZZABILI

### 1. **Header/Navbar**
```typescript
// Layout.tsx - Header con user info
- Logo dinamico con fallback
- Nome utente e ruolo
- Avatar con iniziali
- Notifiche
- Info panel trigger
```

### 2. **Sidebar**
```typescript
// Layout.tsx - Sidebar navigation
- Logo principale
- Claim aziendale
- Gradiente personalizzabile
- Menu items per ruolo
- Badge NEW animati
```

### 3. **Footer**
```typescript
// MinimalFooter.tsx
- 4 colonne responsive
- Informazioni azienda
- Contatti completi
- Link rapidi
- Documenti legali
- Social media icons
- Copyright dinamico
```

### 4. **Info Panel**
```typescript
// InfoPanel.tsx
- Slide-in panel
- Logo e branding
- Informazioni sistema
- Contatti completi
- Social links
- Quick actions
```

### 5. **Contact Page**
```typescript
// ContactPage.tsx
- Hero section branded
- Contact form
- Mappa (future)
- Orari apertura
- Multiple contact methods
```

### 6. **Legal Pages**
```typescript
// LegalPage.tsx
- Privacy Policy
- Terms of Service
- Cookie Policy
- Markdown rendering
- Print friendly
```

---

## 🔌 API E ENDPOINTS

### Public Endpoints (No Auth)

#### `GET /api/public/system-settings/basic`
Recupera le impostazioni pubbliche per il branding.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "key": "site_name",
      "value": "Richiesta Assistenza",
      "type": "string",
      "category": "branding"
    },
    // ... altre impostazioni
  ]
}
```

### Admin Endpoints (Auth Required)

#### `GET /api/admin/system-settings`
Lista tutte le impostazioni di sistema.

#### `GET /api/admin/system-settings/:key`
Recupera una specifica impostazione.

#### `PUT /api/admin/system-settings/:id`
Aggiorna un'impostazione.

**Body:**
```json
{
  "value": "Nuovo valore",
  "description": "Descrizione opzionale"
}
```

#### `POST /api/admin/system-settings`
Crea nuova impostazione (SUPER_ADMIN only).

#### `DELETE /api/admin/system-settings/:id`
Elimina impostazione (SUPER_ADMIN only).

#### `POST /api/admin/upload/logo`
Upload nuovo logo.

**Form Data:**
```
file: [Binary]
type: "logo" | "favicon"
```

---

## 👨‍💼 GUIDA AMMINISTRATORE

### Accesso al Pannello

1. **Navigare a**: `/admin/system-settings`
2. **Permessi richiesti**: ADMIN o SUPER_ADMIN
3. **Sezioni disponibili**:
   - 🎨 Branding
   - 🏢 Informazioni Azienda
   - 📞 Contatti
   - 🌐 Social Media
   - 📄 Documenti Legali

### Workflow Modifica Logo

1. **Click su "Modifica Logo"**
2. **Drag & drop** o click per selezionare file
3. **Preview automatica**
4. **Conferma upload**
5. **Cache refresh** automatico (30s)

### Best Practices

#### Logo
- **Formato**: SVG preferito, PNG/JPG supportati
- **Dimensioni**: Min 200x60px, Max 1000x300px
- **Peso**: Max 500KB
- **Trasparenza**: Supportata (PNG/SVG)

#### Favicon
- **Formato**: ICO, PNG
- **Dimensioni**: 32x32px o 16x16px
- **Multi-resolution**: Consigliato

#### Testi
- **Claim**: Max 100 caratteri
- **Descrizione**: Max 500 caratteri
- **Orari**: Formato libero

#### Social Media
- **URL completi** con https://
- **Validazione** automatica formato

### Gestione Cache

Il sistema utilizza una cache di **30 secondi** per le impostazioni:

```typescript
// Hook configuration
staleTime: 30 * 1000,        // 30 secondi
refetchOnWindowFocus: true   // Refresh su focus
```

Per forzare refresh immediato:
- **Hard Refresh**: `Cmd+Shift+R` (Mac) / `Ctrl+F5` (Windows)
- **Clear Cache**: DevTools → Application → Clear Storage

---

## 🔧 SVILUPPO E INTEGRAZIONE

### Utilizzare le Impostazioni nel Codice

#### React Component
```typescript
import { useSystemSettingsMap } from '@/hooks/useSystemSettings';

export function MyComponent() {
  const { settings, isLoading } = useSystemSettingsMap();
  
  if (isLoading) return <Spinner />;
  
  const companyName = settings.company_name || 'Default Name';
  const logo = settings.site_logo_url || '/default-logo.svg';
  
  return (
    <div>
      <img src={logo} alt={companyName} />
      <h1>{companyName}</h1>
    </div>
  );
}
```

#### Hook Semplificato
```typescript
import { useSystemSettings } from '@/hooks/useSystemSettings';

export function SimpleComponent() {
  const { siteName, siteLogo, isLoading } = useSystemSettings();
  
  return <h1>{siteName}</h1>;
}
```

### Aggiungere Nuove Impostazioni

1. **Definire la chiave** nel database:
```sql
INSERT INTO "SystemSettings" (key, value, type, category, description)
VALUES ('new_setting', 'default', 'string', 'custom', 'Descrizione');
```

2. **Aggiornare il tipo** nell'hook (opzionale):
```typescript
// useSystemSettings.ts
return {
  // ... existing
  newSetting: getSetting('new_setting', 'default'),
}
```

3. **Utilizzare** nel componente:
```typescript
const { newSetting } = useSystemSettings();
```

### Validazione Custom

```typescript
// validation.ts
const settingSchema = z.object({
  site_name: z.string().min(2).max(50),
  contact_email: z.string().email(),
  company_vat: z.string().regex(/^[A-Z]{2}\d{11}$/),
  social_facebook: z.string().url().optional(),
});
```

---

## 🧪 TESTING E VALIDAZIONE

### Test Checklist

#### ✅ Funzionalità Base
- [ ] Logo si carica correttamente
- [ ] Favicon visibile nel browser
- [ ] Nome azienda aggiornato ovunque
- [ ] Claim visibile nel sidebar
- [ ] Footer mostra info corrette

#### ✅ Contatti
- [ ] Telefono cliccabile (tel:)
- [ ] Email cliccabile (mailto:)
- [ ] PEC mostrata se presente
- [ ] Indirizzo completo
- [ ] Orari di apertura

#### ✅ Social Media
- [ ] Icone visibili solo se URL presente
- [ ] Link aprono in nuova tab
- [ ] Icone corrette per piattaforma
- [ ] Hover effects funzionanti

#### ✅ Responsive
- [ ] Mobile: Menu hamburger
- [ ] Tablet: Layout adattivo
- [ ] Desktop: Full layout
- [ ] Print: Nasconde elementi UI

#### ✅ Performance
- [ ] Logo < 100KB
- [ ] Lazy loading immagini
- [ ] Cache headers corretti
- [ ] Minification assets

### Testing Commands

```bash
# Unit tests
npm test -- useSystemSettings.test.ts

# E2E tests
npm run test:e2e -- branding.spec.ts

# Visual regression
npm run test:visual -- --update-snapshots

# Accessibility
npm run test:a11y
```

---

## 🔧 TROUBLESHOOTING

### Problema: Logo non si aggiorna
**Soluzioni:**
1. Clear browser cache: `Cmd+Shift+R`
2. Check console per errori 404
3. Verificare URL in System Settings
4. Controllare permessi file upload

### Problema: Impostazioni non salvate
**Soluzioni:**
1. Verificare permessi utente (ADMIN+)
2. Check network tab per errori API
3. Validazione Zod nel backend
4. Controllare logs server

### Problema: Social icons non visibili
**Soluzioni:**
1. URL deve essere completo (https://...)
2. Verificare che URL sia salvato
3. Check MinimalFooter.tsx per logica display
4. Console per errori React

### Problema: Cache non si aggiorna
**Soluzioni:**
```javascript
// Force clear React Query cache
queryClient.invalidateQueries(['system-settings-public']);

// Clear browser storage
localStorage.clear();
sessionStorage.clear();

// Hard reload
window.location.reload(true);
```

### Problema: Upload fallisce
**Checklist:**
- [ ] File size < 10MB
- [ ] Formato supportato (jpg, png, svg)
- [ ] Directory `/uploads` scrivibile
- [ ] Multer configurato correttamente
- [ ] Network non blocca upload

---

## 📈 ROADMAP FUTURA

### v6.1 (Q4 2025)
- [ ] **Theme Builder**: Editor visuale colori
- [ ] **Font Selector**: Google Fonts integration
- [ ] **Layout Templates**: Predefined layouts
- [ ] **A/B Testing**: Test different brandings

### v6.2 (Q1 2026)
- [ ] **Multi-tenant**: Branding per tenant
- [ ] **White Label**: Complete rebrand capability
- [ ] **Email Templates**: Branded emails
- [ ] **Invoice Branding**: Custom invoice templates

### v7.0 (Q2 2026)
- [ ] **AI Branding**: Auto-generate logos
- [ ] **Brand Guidelines**: Auto documentation
- [ ] **Marketing Kit**: Export brand assets
- [ ] **Analytics**: Brand performance metrics

---

## 📝 CHANGELOG BRANDING

### v6.0.0 - 03 Ottobre 2025
- ✅ Sistema Branding Dinamico completo
- ✅ System Settings dashboard
- ✅ Upload logo e favicon
- ✅ Info Panel rinnovato
- ✅ Footer personalizzabile
- ✅ Contact Page dinamica
- ✅ Legal Pages integrate
- ✅ Social Media support
- ✅ Cache optimization 30s
- ✅ User info in header
- ✅ Sidebar reorganization

### v5.1.0 - 27 Settembre 2025
- 🔧 Base system settings
- 🔧 Partial branding support

---

## 📚 RIFERIMENTI

### Documentazione Correlata
- [System Settings API](../../../03-API/system-settings-api.md)
- [Upload System](../UPLOAD/upload-system.md)
- [Cache Strategy](../../../01-ARCHITETTURA/cache-strategy.md)
- [Security Best Practices](../../../04-GUIDE/security-best-practices.md)

### External Resources
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [React Query Docs](https://tanstack.com/query)
- [Heroicons](https://heroicons.com)
- [Prisma Schema](https://www.prisma.io/docs)

---

**Fine Documento**  
**Versione**: 6.0.0  
**Data**: 03 Ottobre 2025  
**Stato**: ✅ Completo e Validato