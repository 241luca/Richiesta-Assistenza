# 📋 MIGRAZIONE API KEYS AL DATABASE

## ⚠️ IMPORTANTE: Cambio Sistema Configurazione

A partire dalla versione 4.0, **TUTTE le API Keys** sono gestite tramite il database e NON più nei file .env

## 🔄 Stato Migrazione

### ✅ Completamente Migrato
- **WhatsApp (SendApp)**: Configurazione completa nel database
  - Nessun riferimento hardcoded
  - .env pulito
  - UI di configurazione: `/admin/api-keys/whatsapp`

### ⚠️ Da Migrare (ancora in .env per retrocompatibilità)
- **Google Maps**: Ancora in `GOOGLE_MAPS_API_KEY`
- **Brevo (Email)**: Ancora in `BREVO_API_KEY`
- **OpenAI**: Ancora in `OPENAI_API_KEY`
- **Stripe**: Ancora in `STRIPE_SECRET_KEY`

## 📝 Come Migrare le API Keys Rimanenti

### Per gli Amministratori (via UI)

1. **Login come Admin/Super Admin**
2. **Vai a**: http://localhost:5193/admin/api-keys
3. **Per ogni servizio**:
   - Clicca "Configura"
   - Inserisci la API Key
   - Salva
   - Test connessione
4. **Rimuovi dal .env** (dopo verifica funzionamento)

### Per gli Sviluppatori (via Database)

```sql
-- Esempio: Migrare Google Maps
INSERT INTO "ApiKey" (
  id,
  service,
  key,
  name,
  permissions,
  isActive,
  "createdAt",
  "updatedAt"
) VALUES (
  'google_maps_' || extract(epoch from now())::text,
  'GOOGLE_MAPS',
  'your_api_key_here',
  'Google Maps API',
  '{}',
  true,
  NOW(),
  NOW()
);

-- Ripeti per altri servizi
```

## 🗂️ Struttura Database

### Tabella: ApiKey
```sql
CREATE TABLE "ApiKey" (
  id VARCHAR PRIMARY KEY,
  service VARCHAR UNIQUE,  -- 'whatsapp', 'GOOGLE_MAPS', etc.
  key VARCHAR NOT NULL,     -- Token/API Key criptata
  name VARCHAR,             -- Nome descrittivo
  permissions JSONB,        -- Configurazioni extra
  isActive BOOLEAN DEFAULT true,
  rateLimit INTEGER DEFAULT 1000,
  lastUsedAt TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  userId VARCHAR REFERENCES "User"(id)
);
```

## 🔐 Vantaggi del Nuovo Sistema

1. **Sicurezza**: API Keys criptate nel database
2. **Gestione Centralizzata**: Tutto in un posto
3. **Audit Trail**: Modifiche tracciate
4. **Backup**: Con backup database
5. **Multi-tenant Ready**: Ogni istanza sue configurazioni
6. **No Repository**: Keys non finiscono su Git
7. **Rotazione Facile**: Cambio keys senza deploy

## ⚡ Servizi e Loro Configurazioni

### WhatsApp (✅ Migrato)
```javascript
{
  service: 'whatsapp',
  key: 'sendapp_access_token',
  permissions: {
    baseURL: 'https://app.sendapp.cloud/api',
    instanceId: 'xxx',
    webhookUrl: 'https://...'
  }
}
```

### Google Maps (⚠️ Da Migrare)
```javascript
{
  service: 'GOOGLE_MAPS',
  key: 'AIza...',
  permissions: {
    // Configurazioni future
  }
}
```

### Brevo Email (⚠️ Da Migrare)
```javascript
{
  service: 'BREVO',
  key: 'xkeysib-...',
  permissions: {
    senderEmail: 'noreply@...',
    senderName: 'Sistema'
  }
}
```

### OpenAI (⚠️ Da Migrare)
```javascript
{
  service: 'OPENAI',
  key: 'sk-...',
  permissions: {
    model: 'gpt-3.5-turbo',
    maxTokens: 2000
  }
}
```

## 🚀 Piano di Migrazione Completa

### Fase 1: WhatsApp (✅ COMPLETATA)
- Servizio migrato
- UI implementata
- .env pulito

### Fase 2: Altri Servizi (IN CORSO)
- [ ] Aggiornare servizi per leggere da DB
- [ ] Implementare fallback a .env (temporaneo)
- [ ] Test completo
- [ ] Rimuovere da .env

### Fase 3: Cleanup (FUTURO)
- [ ] Rimuovere tutto il codice legacy
- [ ] Eliminare riferimenti a process.env per API keys
- [ ] Documentazione finale

## 📌 Note Importanti

1. **Retrocompatibilità**: I servizi non migrati continuano a funzionare con .env
2. **Priorità Database**: Se presente in DB, usa quello invece di .env
3. **Encryption**: Le keys sono criptate nel database (se ENCRYPTION_KEY configurata)
4. **Backup**: Fare sempre backup del database prima di migrazioni

## 🆘 Troubleshooting

### Problema: API Key non funziona dopo migrazione
**Soluzione**: 
1. Verifica in `/admin/api-keys` che sia configurata
2. Clicca "Test Connessione"
3. Controlla i log del server

### Problema: Servizio cerca ancora in .env
**Soluzione**: Il servizio non è ancora migrato. Mantieni la key in .env finché non viene aggiornato il codice.

### Problema: Non riesco ad accedere ad /admin/api-keys
**Soluzione**: Devi essere ADMIN o SUPER_ADMIN. Verifica il tuo ruolo utente.

---

**Data Documento**: 10 Gennaio 2025
**Versione Sistema**: 4.0
**Status**: WhatsApp Migrato ✅ | Altri in corso ⚠️
