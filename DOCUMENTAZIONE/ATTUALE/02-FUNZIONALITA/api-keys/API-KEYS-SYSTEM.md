# 🔑 SISTEMA API KEYS - Documentazione Completa

**Versione**: 5.1.0  
**Data**: 29 Settembre 2025  
**Stato**: ⚠️ DA UNIFORMARE

---

## 📊 STRUTTURA STANDARD API KEYS

### Schema Database

```prisma
model ApiKey {
  id          String    @id @default(cuid())
  key         String    @unique  // Identificativo univoco (es: "stripe_keys", "google_maps_key")
  name        String               // Nome descrittivo (es: "Stripe API Keys")
  service     String               // Servizio (es: "STRIPE", "GOOGLE_MAPS")
  value       String?              // Valore singolo chiave (per chiavi semplici)
  permissions Json?                // JSON con configurazioni multiple (per sistemi complessi)
  isActive    Boolean   @default(true)
  userId      String?              // Chi ha creato/modificato
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

---

## 🎯 STANDARD DI UNIFORMAZIONE

### Regola 1: Chiavi Singole
Per servizi con UNA SOLA chiave API (es: Google Maps, OpenAI):
```json
{
  "key": "google_maps_key",
  "name": "Google Maps API Key",
  "service": "GOOGLE_MAPS",
  "value": "AIzaSyB...",  // La chiave va qui
  "permissions": {
    "services": ["maps", "places", "geocoding"],
    "restrictions": "*.tuodominio.com"
  }
}
```

### Regola 2: Chiavi Multiple
Per servizi con PIÙ chiavi correlate (es: Stripe, AWS):
```json
{
  "key": "stripe_keys",
  "name": "Stripe API Keys",
  "service": "STRIPE",
  "value": null,  // Non usato per chiavi multiple
  "permissions": {
    "secretKey": "sk_live_...",
    "publicKey": "pk_live_...",
    "webhookSecret": "whsec_...",
    "mode": "live",  // o "test"
    "capabilities": ["payments", "invoices", "customers"]
  }
}
```

### Regola 3: Naming Convention
- `key`: lowercase_snake_case (es: `stripe_keys`, `google_maps_key`)
- `service`: UPPERCASE (es: `STRIPE`, `GOOGLE_MAPS`)
- `name`: Human Readable (es: "Stripe API Keys")

---

## 🔧 CONFIGURAZIONI ATTUALI

### ✅ Configurazioni Corrette

1. **Google Maps**
   - key: `google_maps_key`
   - value: contiene la chiave
   - permissions: configurazioni aggiuntive

2. **Brevo (Email)**
   - key: `brevo_key`
   - value: contiene la chiave API
   - permissions: sender info

### ❌ Configurazioni da Correggere

1. **Stripe** (ATTUALMENTE SBAGLIATO)
   - 3 righe separate (STRIPE, STRIPE_PUBLIC, STRIPE_WEBHOOK)
   - Non uniforme con lo standard

   **DEVE DIVENTARE:**
   - 1 sola riga con key: `stripe_keys`
   - Tutte le chiavi in permissions

---

## 📡 ACCESSO ALLE CHIAVI

### Backend - Lettura Chiavi Singole
```typescript
// services/apikey.service.ts
async function getApiKey(keyName: string): Promise<string | null> {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: keyName }
  });
  
  return apiKey?.value || null;
}

// Esempio uso
const googleMapsKey = await getApiKey('google_maps_key');
```

### Backend - Lettura Chiavi Multiple
```typescript
// services/stripe.service.ts
async function getStripeKeys() {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: 'stripe_keys' }
  });
  
  if (!apiKey?.permissions) {
    throw new Error('Stripe keys not configured');
  }
  
  const keys = apiKey.permissions as any;
  return {
    secretKey: keys.secretKey,
    publicKey: keys.publicKey,
    webhookSecret: keys.webhookSecret
  };
}
```

### Frontend - Endpoint Pubblico
```typescript
// GET /api/config/stripe
router.get('/config/stripe', async (req, res) => {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key: 'stripe_keys' }
  });
  
  const keys = apiKey?.permissions as any;
  
  // Restituisce SOLO la chiave pubblica
  res.json({
    publicKey: keys?.publicKey,
    mode: keys?.mode || 'test'
  });
});
```

---

## 🛠️ SCRIPT DI MIGRAZIONE

### Step 1: Backup
```bash
# Backup delle chiavi attuali
pg_dump -t "ApiKey" database_name > apikeys_backup.sql
```

### Step 2: Migrazione Stripe
```sql
-- Elimina le vecchie righe separate
DELETE FROM "ApiKey" WHERE key IN ('STRIPE', 'STRIPE_PUBLIC', 'STRIPE_WEBHOOK');

-- Inserisci la nuova riga unificata
INSERT INTO "ApiKey" (id, key, name, service, value, permissions, "isActive")
VALUES (
  gen_random_uuid(),
  'stripe_keys',
  'Stripe API Keys',
  'STRIPE',
  NULL,
  '{
    "secretKey": "sk_live_...",
    "publicKey": "pk_live_...",
    "webhookSecret": "whsec_...",
    "mode": "live"
  }',
  true
);
```

---

## 🔒 SICUREZZA

### Best Practices
1. **MAI esporre chiavi segrete** al frontend
2. **Usare variabili ambiente** in sviluppo
3. **Rotazione periodica** delle chiavi (90 giorni)
4. **Audit log** per ogni modifica
5. **Crittografia** dei valori nel database

### Controllo Accessi
- **Lettura**: ADMIN, SUPER_ADMIN
- **Scrittura**: Solo SUPER_ADMIN
- **Test connessione**: ADMIN, SUPER_ADMIN

---

## 📋 CHECKLIST UNIFORMAZIONE

- [ ] Backup tabella ApiKey
- [ ] Migrare Stripe a formato unificato
- [ ] Aggiornare payment.service.ts per nuovo formato
- [ ] Aggiornare UI admin per gestione uniforme
- [ ] Testare tutti i servizi
- [ ] Documentare modifiche

---

## 🎯 INTERFACCIA ADMIN

### Vista Lista
```
┌────────────────┬─────────────────────┬──────────┬──────────┐
│ Servizio       │ Chiave              │ Stato    │ Azioni   │
├────────────────┼─────────────────────┼──────────┼──────────┤
│ Stripe         │ stripe_keys         │ ✅ Attiva │ [Test]   │
│ Google Maps    │ google_maps_key     │ ✅ Attiva │ [Test]   │
│ Brevo Email    │ brevo_key           │ ✅ Attiva │ [Test]   │
│ OpenAI         │ openai_key          │ ✅ Attiva │ [Test]   │
└────────────────┴─────────────────────┴──────────┴──────────┘
```

### Form Modifica (Stripe)
```
Stripe API Keys
─────────────────────────────
Secret Key:    [sk_live_...]
Public Key:    [pk_live_...]
Webhook Secret:[whsec_...]
Mode:          [●] Live [ ] Test

[Salva] [Test Connessione]
```

---

## ⚠️ NOTE IMPORTANTI

1. **Compatibilità**: Dopo la migrazione, aggiornare TUTTI i servizi
2. **Testing**: Testare ogni integrazione dopo la migrazione
3. **Rollback**: Tenere backup per almeno 30 giorni
4. **Monitoraggio**: Verificare logs per errori post-migrazione

---

**Fine Documentazione API Keys**
