# 🔑 CONFIGURAZIONE API KEYS POST-DEPLOY

> ⚠️ **IMPORTANTE**: Le API Keys NON vanno in `.env`!  
> Si configurano **DOPO il deploy** dal pannello Admin.

---

## 🎯 PERCHÉ NEL DATABASE?

Il sistema salva le API Keys nel **database** (tabella `ApiKey`) perché:

✅ **Sicurezza**: Keys criptate nel database  
✅ **Flessibilità**: Cambi senza riavviare  
✅ **Multi-ambiente**: Keys diverse per dev/prod  
✅ **Audit**: Log di chi modifica cosa  
✅ **Backup**: Incluse nei backup database  

---

## 📋 PROCEDURA POST-DEPLOY

### 1️⃣ Login come Admin

```
URL: http://TUO-IP (o https://tuodominio.it)
Email: admin@admin.it
Password: Admin123!
```

### 2️⃣ Vai su API Keys

```
Menu → Admin → Settings → API Keys
```

### 3️⃣ Configura le chiavi necessarie

| Servizio | Chiave | Dove ottenerla | Obbligatorio? |
|----------|--------|----------------|---------------|
| **Google Maps** | API Key | [Google Cloud Console](https://console.cloud.google.com) | ✅ Sì |
| **OpenAI** | API Key | [OpenAI Platform](https://platform.openai.com/api-keys) | ⚠️ Consigliato |
| **Stripe** | Secret Key | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | ⚠️ Se usi pagamenti |
| **Stripe** | Public Key | Stripe Dashboard | ⚠️ Se usi pagamenti |
| **Stripe** | Webhook Secret | Stripe Dashboard → Webhooks | ⚠️ Se usi pagamenti |
| **Brevo** | API Key | [Brevo](https://app.brevo.com/settings/keys/api) | ⚠️ Alternativa a SMTP |

---

## 🗺️ GOOGLE MAPS API KEY (Obbligatorio)

### Crea il progetto

1. Vai su [Google Cloud Console](https://console.cloud.google.com)
2. Crea nuovo progetto
3. Abilita API:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Distance Matrix API

### Crea API Key

1. Vai su "Credenziali"
2. Crea credenziali → API Key
3. Copia la chiave
4. **Importante**: Restrizioni
   - HTTP referrer: `tuodominio.it/*`
   - API: Solo quelle necessarie

### Inserisci nel sistema

```
Admin → API Keys → Google Maps
Key Name: GOOGLE_MAPS_API_KEY
Value: [LA_TUA_CHIAVE]
Environment: production
Is Active: ✅
```

---

## 🤖 OPENAI API KEY (Consigliato)

Per le funzionalità AI (preventivi smart, chatbot, ecc.)

### Ottieni la chiave

1. Vai su [OpenAI Platform](https://platform.openai.com)
2. Login/Registrati
3. Vai su API Keys
4. Create new secret key
5. Copia (la vedi solo una volta!)

### Inserisci nel sistema

```
Admin → API Keys → OpenAI
Key Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxxxx
Environment: production
Is Active: ✅
```

### Costi OpenAI

- GPT-3.5: ~$0.0015 per 1000 token
- GPT-4: ~$0.03 per 1000 token
- Budget consigliato: $20/mese per iniziare

---

## 💳 STRIPE KEYS (Se usi pagamenti)

### Ottieni le chiavi

1. Vai su [Stripe Dashboard](https://dashboard.stripe.com)
2. Developers → API Keys
3. Copia:
   - **Secret key** (sk_live_xxx)
   - **Publishable key** (pk_live_xxx)

### Webhook Secret

1. Developers → Webhooks
2. Add endpoint
3. URL: `https://tuodominio.it/api/stripe/webhook`
4. Eventi da ascoltare:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.paid`
   - `customer.subscription.updated`
5. Copia il **Signing secret** (whsec_xxx)

### Inserisci nel sistema

```
Admin → API Keys → Stripe

1. STRIPE_SECRET_KEY
   Value: sk_live_xxxxxxxxx
   
2. STRIPE_PUBLIC_KEY  
   Value: pk_live_xxxxxxxxx
   
3. STRIPE_WEBHOOK_SECRET
   Value: whsec_xxxxxxxxx
```

---

## 📧 BREVO API KEY (Alternativa SMTP)

Se preferisci API invece di SMTP:

1. Vai su [Brevo](https://app.brevo.com)
2. Settings → API Keys
3. Create new API Key
4. Copia la chiave

### Inserisci nel sistema

```
Admin → API Keys → Brevo
Key Name: BREVO_API_KEY
Value: xkeysib-xxxxxxxxx
Environment: production
```

---

## ✅ VERIFICA CONFIGURAZIONE

Dopo aver inserito le chiavi, **testa** che funzionino:

### Test Google Maps

```
Admin → Settings → Test API → Google Maps
```

Dovrebbe mostrare una mappa e geocodificare un indirizzo.

### Test OpenAI

```
Admin → Settings → Test API → OpenAI
```

Chiedi al chatbot qualcosa.

### Test Stripe

```
Admin → Payments → Test Payment
```

Usa carta test: `4242 4242 4242 4242`

---

## 🔒 SICUREZZA API KEYS

### ✅ Best Practices

- **Mai committare** su Git
- **Restrizioni IP/Domain** quando possibile
- **Rotazione** ogni 6-12 mesi
- **Monitor usage** per rilevare abusi
- **Backup criptato** del database

### ⚠️ Se compromessa

1. **Revoca** immediatamente dalla piattaforma
2. **Genera nuova** chiave
3. **Aggiorna** nel pannello admin
4. **Verifica** log per accessi sospetti

---

## 🔄 CAMBIO API KEYS

### Senza downtime

1. Genera nuova chiave sulla piattaforma
2. Aggiorna nel pannello admin
3. Salva
4. Sistema usa subito la nuova (no restart!)
5. Dopo 24h, revoca vecchia chiave

---

## 💰 COSTI MENSILI TIPICI

| Servizio | Costo | Note |
|----------|-------|------|
| Google Maps | $200 gratis poi pay | 28k richieste gratis/mese |
| OpenAI | $20-100 | Dipende da uso AI |
| Stripe | 1.4% + €0.25 | Solo su transazioni |
| Brevo | Gratis | Fino a 300 email/giorno |
| **TOTALE** | **$20-320/mese** | Variabile con uso |

---

## 🆘 PROBLEMI COMUNI

### "API Key non valida"

- Verifica che sia copiata correttamente (no spazi)
- Controlla che sia attiva sulla piattaforma
- Verifica restrizioni IP/domain

### "Quota exceeded"

- Hai finito i crediti gratuiti
- Aggiungi metodo di pagamento
- O aumenta il limite

### "Permission denied"

- API non abilitata sul progetto
- Key non ha permessi necessari
- Restrizioni troppo strette

---

## 📊 MONITORING

### Dashboard utilizzo

```
Admin → Analytics → API Usage
```

Mostra:
- Chiamate per API
- Costi stimati
- Errori
- Trend giornaliero

### Alert automatici

Configura alert per:
- Uso anomalo (+ 200% rispetto media)
- Errori API (>5%)
- Quota vicina a limite (>80%)

---

## ✅ CHECKLIST FINALE

Dopo deploy, verifica:

- [ ] Google Maps API configurata e testata
- [ ] OpenAI API configurata (se usata)
- [ ] Stripe API configurate (se pagamenti)
- [ ] Brevo API configurata (se alternativa SMTP)
- [ ] Tutte keys con `isActive: true`
- [ ] Test API passati
- [ ] Restrizioni IP/Domain configurate
- [ ] Monitoring attivo
- [ ] Budget alerts configurati

---

**Documenti correlati**:
- DEPLOY-DOCKER.md (Deploy completo)
- FAQ-DEPLOY.md (Domande comuni)

**Ultimo aggiornamento**: Gennaio 2025
