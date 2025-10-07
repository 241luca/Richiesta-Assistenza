# 📖 Guida Implementazione Sistema Branding

**Data**: 18 Gennaio 2025  
**Versione**: 1.0.0  
**Target**: Sviluppatori

---

## 🚀 Quick Start

### 1. Setup Database

```bash
# Genera Prisma client con nuove tabelle
cd backend
npx prisma generate

# Applica schema al database
npx prisma db push

# Popola dati iniziali
npx tsx src/scripts/seed-footer-data.ts
```

### 2. Configurazione Admin

1. Login come ADMIN o SUPER_ADMIN
2. Navigare a `/admin/system-settings`
3. Caricare logo aziendale
4. Configurare:
   - Nome sito
   - Claim/tagline
   - Info azienda
   - Contatti

### 3. Gestione Footer

1. Navigare a `/admin/footer`
2. Modificare link esistenti
3. Aggiungere nuove sezioni se necessario
4. Salvare modifiche

---

## 🔧 Implementazione Tecnica

### Backend Services

#### SystemSettingsService
```typescript
// backend/src/services/systemSettings.service.ts

// Metodi principali
getPublicSettings()    // Settings pubbliche
getSetting(key)        // Singola setting
setSetting(key, value) // Aggiorna setting
getFooterConfig()      // Config footer
```

#### FooterService
```typescript
// backend/src/services/footer.service.ts

// Metodi principali
getFooterData()           // Tutti i dati footer
getLinksBySection(section) // Link per sezione
upsertLink(data)          // Crea/aggiorna link
upsertSection(data)       // Crea/aggiorna sezione
initializeDefaults()      // Dati predefiniti
```

### Frontend Hooks

#### useSystemSettings
```typescript
// src/hooks/useSystemSettings.ts

const {
  siteName,      // Nome del sito
  siteLogo,      // URL logo
  siteClaim,     // Tagline
  companyName,   // Nome azienda
  isLoading      // Stato caricamento
} = useSystemSettings();
```

### Componenti React

#### Layout con Logo
```tsx
// src/components/Layout.tsx

// Logo nell'header sidebar
<div className="flex items-center gap-2">
  {siteLogo && (
    <img 
      src={siteLogo} 
      alt={siteName}
      className="h-8 w-auto brightness-0 invert"
    />
  )}
  <h1>{siteName || 'Default'}</h1>
</div>
```

#### MinimalFooter
```tsx
// src/components/MinimalFooter.tsx

// Footer con link legali
<footer>
  <p>© {year} {companyName}</p>
  <Link to="/legal/privacy-policy">Privacy</Link>
  <Link to="/legal/terms-service">Termini</Link>
  <Link to="/legal/cookie-policy">Cookie</Link>
</footer>
```

---

## 📝 Script Utility

### seed-footer-data.ts
Popola dati iniziali del footer:
```bash
npx tsx backend/src/scripts/seed-footer-data.ts
```

### update-footer-links.ts
Aggiorna link con URL corretti:
```bash
npx tsx backend/src/scripts/update-footer-links.ts
```

---

## 🔍 Testing

### Test Manuale

1. **Logo Display**
   - Verificare in header sidebar
   - Verificare in InfoPanel
   - Verificare in pagina Legal

2. **Footer Links**
   - Tutti i link funzionanti
   - Navigazione corretta
   - Link esterni in nuova tab

3. **InfoPanel**
   - Apertura senza problemi
   - Info azienda visibili
   - Link funzionanti

### Test Automatici (da implementare)

```typescript
describe('SystemSettings', () => {
  it('should load public settings', async () => {
    const settings = await api.get('/public/system-settings/basic');
    expect(settings.data).toHaveProperty('site_name');
  });
});

describe('Footer', () => {
  it('should display legal links', () => {
    render(<MinimalFooter />);
    expect(screen.getByText('Privacy')).toBeInTheDocument();
  });
});
```

---

## 🐛 Debugging

### Console Browser

```javascript
// Verificare settings caricate
console.log(window.__REACT_QUERY_STATE__.queries);

// Check footer data
fetch('/api/footer/public').then(r => r.json()).then(console.log);

// Check system settings
fetch('/api/public/system-settings/basic').then(r => r.json()).then(console.log);
```

### Database Queries

```sql
-- Verificare footer links
SELECT * FROM "FooterLink" WHERE "isActive" = true ORDER BY section, "order";

-- Verificare settings
SELECT * FROM "SystemSetting" WHERE "isPublic" = true;

-- Check sezioni footer
SELECT * FROM "FooterSection" WHERE "isVisible" = true ORDER BY "order";
```

---

## 🔐 Sicurezza

### Validazione Input
- Sanitizzazione URL
- Validazione dimensioni immagini
- Check MIME type per upload

### Autorizzazioni
- Public endpoints: solo lettura
- Admin endpoints: require ADMIN/SUPER_ADMIN
- Rate limiting su upload

### Best Practices
- Mai esporre chiavi sensibili
- Validare sempre lato server
- Usare prepared statements (Prisma)

---

## 📊 Performance

### Ottimizzazioni Implementate
- React Query cache (5 min)
- Database indexes su campi chiave
- Lazy loading immagini
- Compression response

### Monitoring
```typescript
// Tempo caricamento settings
console.time('loadSettings');
const settings = await useSystemSettings();
console.timeEnd('loadSettings');

// Query count
prisma.$on('query', (e) => {
  console.log('Query:', e.query);
  console.log('Duration:', e.duration + 'ms');
});
```

---

## 🔄 Migrazione

### Da Sistema Vecchio

1. Esportare dati esistenti
2. Mappare campi:
   - `company_info` → `SystemSetting`
   - `footer_config` → `FooterLink`
3. Importare con script migrazione
4. Verificare funzionamento

---

**Fine Guida Implementazione**
