# 🔑 SISTEMA GESTIONE API KEYS
**Versione**: 2.0.0  
**Data**: 18 Gennaio 2025  
**Stato**: ✅ Implementato e Funzionante

---

## 📋 INDICE COMPLETO

1. [Panoramica Sistema](#1-panoramica-sistema)
2. [Architettura e Sicurezza](#2-architettura-e-sicurezza)
3. [Servizi Supportati](#3-servizi-supportati)
4. [Database Schema](#4-database-schema)
5. [API Endpoints](#5-api-endpoints)
6. [Frontend Components](#6-frontend-components)
7. [Backend Implementation](#7-backend-implementation)
8. [Configurazione Servizi](#8-configurazione-servizi)
9. [Test e Validazione](#9-test-e-validazione)
10. [Sicurezza e Crittografia](#10-sicurezza-e-crittografia)
11. [Guida Amministratore](#11-guida-amministratore)
12. [Troubleshooting](#12-troubleshooting)
13. [Best Practices](#13-best-practices)

---

## 1. PANORAMICA SISTEMA

### Descrizione
Il Sistema di Gestione API Keys centralizza la gestione di tutte le chiavi API esterne utilizzate dall'applicazione. Fornisce un'interfaccia unificata per configurare, testare e monitorare le integrazioni con servizi esterni.

### Caratteristiche Principali
- **Gestione Centralizzata**: Tutte le API keys in un unico posto
- **Crittografia**: Chiavi criptate nel database
- **Mascheramento**: Visualizzazione sicura delle chiavi
- **Test Integrati**: Verifica connettività per ogni servizio
- **Audit Trail**: Log di tutte le modifiche
- **Validazione**: Controllo formato e validità chiavi

### Servizi Gestiti
| Servizio | Tipo | Stato | Criticità |
|----------|------|-------|-----------|
| **OpenAI** | AI/LLM | Attivo | Alta |
| **Stripe** | Pagamenti | Attivo | Alta |
| **Google Maps** | Mappe | Attivo | Media |
| **Brevo** | Email | Attivo | Alta |
| **TinyMCE** | Editor | Attivo | Media |
| **WhatsApp** | Messaggistica | Attivo | Bassa |
| **Twilio** | SMS | Pianificato | Media |
| **SendGrid** | Email alternativa | Pianificato | Bassa |

---

## 2. ARCHITETTURA E SICUREZZA

### Stack Tecnologico
```
Frontend:
├── React + TypeScript
├── React Query (Cache e stato)
├── TailwindCSS (UI)
└── React Hot Toast (Notifiche)

Backend:
├── Node.js + Express
├── Prisma ORM
├── PostgreSQL
├── Crypto (Node.js built-in)
└── Zod (Validazione)
```

### Flusso Sicurezza
```
[Input Chiave] → [Validazione] → [Crittografia] → [Database]
                                         ↓
[Frontend] ← [Mascheramento] ← [Decriptazione] ← [API Request]
```

### Livelli di Sicurezza
1. **Accesso**: Solo ADMIN e SUPER_ADMIN
2. **Trasporto**: HTTPS obbligatorio
3. **Storage**: Crittografia AES-256-GCM
4. **Visualizzazione**: Mascheramento parziale
5. **Audit**: Log di ogni operazione

---

## 3. SERVIZI SUPPORTATI

### OpenAI
**Uso**: Assistente AI, generazione contenuti
```javascript
{
  service: "OPENAI",
  format: "sk-[48 caratteri alfanumerici]",
  testEndpoint: "https://api.openai.com/v1/models",
  requiredHeaders: { "Authorization": "Bearer {key}" }
}
```

### Stripe
**Uso**: Gestione pagamenti
```javascript
{
  service: "STRIPE",
  format: "sk_live_[98 caratteri] o sk_test_[98 caratteri]",
  testEndpoint: "https://api.stripe.com/v1/customers",
  requiredHeaders: { "Authorization": "Bearer {key}" }
}
```

### Google Maps
**Uso**: Mappe, geocoding, calcolo distanze
```javascript
{
  service: "GOOGLE_MAPS",
  format: "AIza[35 caratteri alfanumerici]",
  testEndpoint: "https://maps.googleapis.com/maps/api/geocode/json",
  requiredParams: { "key": "{key}", "address": "test" }
}
```

### Brevo (ex SendinBlue)
**Uso**: Email transazionali e marketing
```javascript
{
  service: "BREVO",
  format: "xkeysib-[64 caratteri hex]",
  testEndpoint: "https://api.brevo.com/v3/account",
  requiredHeaders: { "api-key": "{key}" }
}
```

### TinyMCE
**Uso**: Editor WYSIWYG documenti legali
```javascript
{
  service: "TINYMCE",
  format: "[32 caratteri alfanumerici]",
  testEndpoint: "https://cdn.tiny.cloud/1/{key}/tinymce/",
  validation: "Check CDN availability"
}
```

### WhatsApp Business
**Uso**: Messaggistica con clienti
```javascript
{
  service: "WHATSAPP",
  format: "Token permanente o temporaneo",
  testEndpoint: "https://graph.facebook.com/v18.0/me",
  requiredHeaders: { "Authorization": "Bearer {key}" }
}
```

---

## 4. DATABASE SCHEMA

### Tabella: ApiKey
```prisma
model ApiKey {
  id              String   @id @default(cuid())
  service         String   @unique  // OPENAI, STRIPE, etc.
  key             String   // Crittografata
  encryptedKey    String?  // Nuovo campo per migrazione
  iv              String?  // Initialization Vector per crittografia
  tag             String?  // Authentication tag
  isActive        Boolean  @default(true)
  lastValidated   DateTime?
  validationError String?
  metadata        Json?    // Configurazioni extra servizio
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  createdBy       String?  // User ID
  updatedBy       String?  // User ID
  
  @@index([service])
  @@index([isActive])
}
```

### Tabella: ApiKeyAuditLog
```prisma
model ApiKeyAuditLog {
  id        String   @id @default(cuid())
  service   String
  action    String   // CREATE, UPDATE, DELETE, TEST, VIEW
  userId    String
  userEmail String
  details   Json?    // Dettagli operazione
  ipAddress String?
  userAgent String?
  success   Boolean
  error     String?
  createdAt DateTime @default(now())
  
  @@index([service])
  @@index([userId])
  @@index([action])
}
```

---

## 5. API ENDPOINTS

### Endpoints Principali

#### GET /api/admin/api-keys
Recupera tutte le API keys (mascherate).

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "clxx...",
      "service": "OPENAI",
      "key": "sk-...***...xyz",  // Mascherata
      "isActive": true,
      "lastValidated": "2025-01-18T10:00:00Z"
    }
  ]
}
```

#### GET /api/admin/api-keys/:service
Recupera una specifica API key (mascherata).

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "clxx...",
    "service": "OPENAI",
    "key": "sk-...***...xyz",
    "isActive": true,
    "metadata": {}
  }
}
```

#### GET /api/admin/api-keys/:service/raw
Recupera la chiave completa non mascherata (solo per integrazione).

**Security**: Richiede permessi elevati e viene loggato

**Response**:
```json
{
  "success": true,
  "data": {
    "key": "sk-proj-abc123...",  // Chiave completa
    "service": "OPENAI"
  }
}
```

#### POST /api/admin/api-keys
Crea o aggiorna una API key.

**Request Body**:
```json
{
  "service": "OPENAI",
  "key": "sk-proj-abc123...",
  "metadata": {
    "model": "gpt-4",
    "maxTokens": 4000
  }
}
```

#### POST /api/admin/api-keys/:service/test
Testa la validità di una API key.

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "message": "Connection successful",
    "details": {
      "service": "OPENAI",
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "organization": "org-xxx"
    }
  }
}
```

#### DELETE /api/admin/api-keys/:service
Elimina una API key.

**Response**:
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

---

## 6. FRONTEND COMPONENTS

### ApiKeysOverview.tsx
Componente principale per la gestione delle API keys.

**Path**: `/src/pages/admin/ApiKeysOverview.tsx`

**Struttura**:
```typescript
interface ApiKeyCard {
  service: string;
  displayName: string;
  description: string;
  icon: ReactNode;
  isConfigured: boolean;
  lastValidated?: Date;
  status: 'active' | 'error' | 'not_configured';
}
```

**Funzionalità**:
- Vista card per ogni servizio
- Indicatori stato visivi (verde/rosso/grigio)
- Modal per configurazione
- Test connessione integrato
- Copia chiave mascherata

### ApiKeyConfigModal.tsx
Modal per configurare/modificare una API key.

**Features**:
- Input con validazione formato
- Toggle visibilità chiave
- Test immediato
- Metadata aggiuntivi per servizio
- Feedback visivo risultati

### Layout UI
```
┌─────────────────────────────────────────────────────────────┐
│                    Gestione API Keys                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ OpenAI  │  │ Stripe  │  │ Google  │  │  Brevo  │       │
│  │   ✅    │  │   ✅    │  │   ✅    │  │   ❌    │       │
│  │ [Test]  │  │ [Test]  │  │ [Test]  │  │ [Config]│       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │TinyMCE  │  │WhatsApp │  │ Twilio  │  │SendGrid │       │
│  │   ✅    │  │   ✅    │  │   ⚠️    │  │   ➕    │       │
│  │ [Test]  │  │ [Test]  │  │ [Config]│  │  [Add]  │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. BACKEND IMPLEMENTATION

### apiKeys.service.ts
**Path**: `/backend/src/services/apiKeys.service.ts`

```typescript
class ApiKeysService {
  // Crittografia
  private encrypt(text: string): EncryptedData
  private decrypt(encryptedData: EncryptedData): string
  
  // CRUD Operations
  async getAllKeys(): Promise<ApiKey[]>
  async getKey(service: string): Promise<ApiKey>
  async getRawKey(service: string): Promise<string>
  async createOrUpdateKey(data: CreateApiKeyDto): Promise<ApiKey>
  async deleteKey(service: string): Promise<void>
  
  // Validazione
  async testKey(service: string): Promise<TestResult>
  private validateKeyFormat(service: string, key: string): boolean
  
  // Utility
  private maskKey(key: string): string
  private auditLog(action: string, details: any): Promise<void>
}
```

### Crittografia Implementata
```typescript
// Algoritmo: AES-256-GCM
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const secretKey = crypto.scryptSync(
  process.env.ENCRYPTION_KEY, 
  'salt', 
  32
);

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: tag.toString('hex')
  };
}
```

### Test Implementations

#### OpenAI Test
```typescript
async testOpenAI(apiKey: string) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) throw new Error('Invalid API key');
  
  const data = await response.json();
  return {
    valid: true,
    models: data.data.map(m => m.id)
  };
}
```

#### Stripe Test
```typescript
async testStripe(apiKey: string) {
  const stripe = new Stripe(apiKey);
  
  try {
    const customers = await stripe.customers.list({ limit: 1 });
    return { valid: true, mode: apiKey.startsWith('sk_live') ? 'live' : 'test' };
  } catch (error) {
    throw new Error('Invalid Stripe key');
  }
}
```

---

## 8. CONFIGURAZIONE SERVIZI

### OpenAI Configuration
```javascript
// Metadata fields
{
  model: "gpt-4" | "gpt-3.5-turbo",
  maxTokens: 4000,
  temperature: 0.7,
  organization: "org-xxx"  // Opzionale
}

// Uso nell'applicazione
const openai = new OpenAI({
  apiKey: await apiKeyService.getRawKey('OPENAI')
});
```

### Stripe Configuration
```javascript
// Metadata fields
{
  mode: "test" | "live",
  webhookSecret: "whsec_xxx",  // Per webhook
  currency: "EUR"
}

// Uso nell'applicazione
const stripe = new Stripe(
  await apiKeyService.getRawKey('STRIPE'),
  { apiVersion: '2023-10-16' }
);
```

### Google Maps Configuration
```javascript
// Metadata fields
{
  libraries: ["places", "geometry", "drawing"],
  region: "IT",
  language: "it",
  restrictions: {
    country: ["IT"]  // Limita a Italia
  }
}

// Uso nell'applicazione
const loader = new Loader({
  apiKey: await apiKeyService.getRawKey('GOOGLE_MAPS'),
  version: "weekly",
  libraries: metadata.libraries
});
```

### TinyMCE Configuration
```javascript
// Metadata fields
{
  plugins: ["advlist", "autolink", "lists"],
  toolbar: "undo redo | formatselect | bold italic",
  height: 500
}

// Uso nell'applicazione
<Editor
  apiKey={await apiKeyService.getRawKey('TINYMCE')}
  init={{
    plugins: metadata.plugins,
    toolbar: metadata.toolbar
  }}
/>
```

---

## 9. TEST E VALIDAZIONE

### Test Automatici
Ogni servizio ha test specifici per validare la chiave:

| Servizio | Metodo Test | Tempo Risposta | Retry |
|----------|-------------|----------------|-------|
| OpenAI | GET /models | <2s | 3x |
| Stripe | GET /customers | <1s | 2x |
| Google Maps | Geocode test | <1s | 2x |
| Brevo | GET /account | <2s | 2x |
| TinyMCE | CDN check | <1s | 1x |
| WhatsApp | GET /me | <3s | 3x |

### Validazione Formato
```typescript
const KEY_PATTERNS = {
  OPENAI: /^sk-[a-zA-Z0-9]{48}$/,
  STRIPE: /^sk_(test|live)_[a-zA-Z0-9]{98}$/,
  GOOGLE_MAPS: /^AIza[a-zA-Z0-9]{35}$/,
  BREVO: /^xkeysib-[a-f0-9]{64}$/,
  TINYMCE: /^[a-z0-9]{32}$/,
  WHATSAPP: /^[A-Za-z0-9_-]+$/
};
```

### Test Schedulati
```javascript
// Cron job per validazione periodica
schedule.scheduleJob('0 0 * * *', async () => {
  const keys = await apiKeyService.getAllKeys();
  
  for (const key of keys) {
    try {
      await apiKeyService.testKey(key.service);
    } catch (error) {
      await notificationService.notifyAdmins(
        `API Key ${key.service} validation failed`
      );
    }
  }
});
```

---

## 10. SICUREZZA E CRITTOGRAFIA

### Crittografia Database
- **Algoritmo**: AES-256-GCM
- **Key Derivation**: PBKDF2 con salt
- **Storage**: Chiave, IV e tag separati
- **Rotazione**: Ogni 90 giorni consigliata

### Mascheramento Chiavi
```typescript
function maskKey(key: string): string {
  if (key.length <= 10) return '***';
  
  const start = key.substring(0, 6);
  const end = key.substring(key.length - 4);
  
  return `${start}...***...${end}`;
}
// Esempio: sk-proj...***...x7y8
```

### Audit Trail
Ogni operazione viene loggata:
```json
{
  "action": "UPDATE_KEY",
  "service": "OPENAI",
  "userId": "user_123",
  "timestamp": "2025-01-18T10:30:00Z",
  "ipAddress": "192.168.1.1",
  "success": true,
  "details": {
    "previousKeyHash": "abc123...",
    "newKeyHash": "def456..."
  }
}
```

### Permessi e Ruoli
| Azione | SUPER_ADMIN | ADMIN | PROFESSIONAL | CLIENT |
|--------|-------------|-------|--------------|--------|
| View Masked | ✅ | ✅ | ❌ | ❌ |
| View Raw | ✅ | ❌ | ❌ | ❌ |
| Create/Update | ✅ | ✅ | ❌ | ❌ |
| Delete | ✅ | ❌ | ❌ | ❌ |
| Test | ✅ | ✅ | ❌ | ❌ |

---

## 11. GUIDA AMMINISTRATORE

### Come Aggiungere una Nuova API Key

1. **Accedere al Sistema**
   ```
   Navigare a: /admin/api-keys
   Verificare permessi: ADMIN o SUPER_ADMIN
   ```

2. **Selezionare il Servizio**
   - Trovare la card del servizio
   - Cliccare su "Configura" o "+"

3. **Inserire la Chiave**
   - Incollare la chiave nel campo
   - Sistema valida automaticamente il formato
   - Aggiungere metadata se richiesti

4. **Testare la Connessione**
   - Cliccare "Test Connessione"
   - Attendere risultato (2-3 secondi)
   - Verificare messaggio successo

5. **Salvare**
   - Cliccare "Salva"
   - Chiave viene crittografata e salvata
   - Card mostra stato "Attiva" ✅

### Come Aggiornare una Chiave Esistente

1. Cliccare sulla card del servizio
2. Cliccare "Configura"
3. Inserire nuova chiave
4. Testare connessione
5. Salvare modifiche

### Come Verificare lo Stato

- **Verde (✅)**: Servizio attivo e funzionante
- **Rosso (❌)**: Chiave non configurata
- **Giallo (⚠️)**: Errore validazione o test fallito

### Rotazione Chiavi
Best practice per la sicurezza:
1. Ruotare ogni 90 giorni
2. Generare nuova chiave dal provider
3. Aggiornare nel sistema
4. Testare funzionalità
5. Revocare vecchia chiave dal provider

---

## 12. TROUBLESHOOTING

### Problemi Comuni

#### Chiave Non Accettata
**Problema**: Il sistema rifiuta la chiave inserita
**Soluzioni**:
1. Verificare spazi bianchi all'inizio/fine
2. Controllare formato corretto per il servizio
3. Verificare che sia la chiave giusta (live vs test)
4. Controllare scadenza chiave

#### Test Connessione Fallisce
**Problema**: La chiave è accettata ma il test fallisce
**Soluzioni**:
1. Verificare connessione internet
2. Controllare firewall/proxy
3. Verificare limiti API del provider
4. Controllare permessi chiave sul provider

#### Chiave Non Si Salva
**Problema**: Dopo salvataggio, la chiave non appare configurata
**Soluzioni**:
1. Verificare permessi utente
2. Controllare log errori console
3. Verificare spazio database
4. Controllare encryption key configurata

### Error Codes

| Codice | Significato | Soluzione |
|--------|-------------|-----------|
| `INVALID_FORMAT` | Formato chiave errato | Verificare pattern chiave |
| `TEST_FAILED` | Test connessione fallito | Controllare validità chiave |
| `ENCRYPTION_ERROR` | Errore crittografia | Verificare ENCRYPTION_KEY env |
| `PERMISSION_DENIED` | Permessi insufficienti | Verificare ruolo utente |
| `SERVICE_NOT_FOUND` | Servizio non riconosciuto | Verificare nome servizio |
| `RATE_LIMIT` | Troppi tentativi | Attendere prima di riprovare |

### Debug Mode
```javascript
// Abilitare debug in development
localStorage.setItem('API_KEY_DEBUG', 'true');

// Log dettagliati in console
console.log('API Key Debug:', {
  service,
  masked: maskedKey,
  testResult,
  metadata
});
```

---

## 13. BEST PRACTICES

### Sicurezza
1. **Mai condividere** chiavi in plain text
2. **Usare HTTPS** sempre in produzione
3. **Ruotare chiavi** regolarmente (90 giorni)
4. **Limitare accesso** solo ad admin necessari
5. **Monitorare audit log** per attività sospette
6. **Backup encryption key** in luogo sicuro

### Performance
1. **Cache chiavi** decriptate per 5 minuti
2. **Test asincroni** per non bloccare UI
3. **Retry logic** per test temporaneamente falliti
4. **Batch validation** per controlli schedulati

### Manutenzione
1. **Review mensile** chiavi non utilizzate
2. **Pulizia audit log** dopo 180 giorni
3. **Verifica scadenze** chiavi trial/temporanee
4. **Update documentazione** per nuovi servizi

### Disaster Recovery
1. **Backup database** prima di modifiche
2. **Export chiavi** (criptate) periodicamente
3. **Documentare** quali servizi sono critici
4. **Piano B** per servizi essenziali

---

## 📝 CHANGELOG

### v2.0.0 (18 Gennaio 2025)
- ✅ Refactoring completo sistema
- ✅ Aggiunta crittografia AES-256-GCM
- ✅ Nuovo UI con card layout
- ✅ Test integrati per tutti i servizi
- ✅ Audit log completo
- ✅ Support per TinyMCE e WhatsApp

### v1.0.0 (01 Dicembre 2024)
- Implementazione iniziale
- Supporto base OpenAI, Stripe, Google Maps
- Storage plain text (deprecato)

---

## 🔗 RIFERIMENTI

### Documentazione Providers
- [OpenAI API](https://platform.openai.com/docs)
- [Stripe API](https://stripe.com/docs/api)
- [Google Maps API](https://developers.google.com/maps)
- [Brevo API](https://developers.brevo.com/docs)
- [TinyMCE](https://www.tiny.cloud/docs/)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

### File Sistema
- `/src/pages/admin/ApiKeysOverview.tsx` - UI principale
- `/backend/src/services/apiKeys.service.ts` - Business logic
- `/backend/src/routes/admin/apiKeys.routes.ts` - API endpoints
- `/backend/prisma/schema.prisma` - Database schema

---

**Fine Documentazione Sistema API Keys**

Per supporto: support@lmtecnologie.it
