# 🚀 QUICK START GUIDE - WHATSAPP AI SYSTEM
## Setup in 30 Minuti

---

## ⚡ SETUP RAPIDO (30 MINUTI)

### 📋 CHECKLIST PRE-INSTALLAZIONE

- [ ] Node.js 18+ installato
- [ ] PostgreSQL 14+ installato e running
- [ ] Redis installato (opzionale ma consigliato)
- [ ] Account SendApp Cloud creato
- [ ] OpenAI API Key con crediti
- [ ] Numero WhatsApp Business disponibile

---

## 🎯 STEP 1: SETUP BASE (5 minuti)

```bash
# 1. Clone del progetto
git clone https://github.com/241luca/Richiesta-Assistenza.git
cd Richiesta-Assistenza

# 2. Installazione dipendenze
npm install
cd backend && npm install && cd ..

# 3. Copia configurazione
cp .env.example .env
```

---

## 🔧 STEP 2: CONFIGURAZIONE ENVIRONMENT (5 minuti)

Apri `.env` e configura:

```env
# 🗄️ DATABASE (obbligatorio)
DATABASE_URL="postgresql://postgres:password@localhost:5432/assistenza"

# 📱 WHATSAPP (obbligatorio)
SENDAPP_BASE_URL=https://app.sendapp.cloud/api
SENDAPP_ACCESS_TOKEN=  # ⚠️ INSERISCI IL TUO TOKEN
SENDAPP_WEBHOOK_URL=   # Verrà configurato dopo

# 🤖 AI (obbligatorio)
OPENAI_API_KEY=sk-...  # ⚠️ INSERISCI LA TUA API KEY

# 💾 REDIS (consigliato)
REDIS_URL=redis://localhost:6379

# 📧 EMAIL (opzionale per ora)
BREVO_API_KEY=
BREVO_SENDER_EMAIL=

# 🔐 SECURITY (genera valori casuali)
JWT_SECRET=genera-stringa-casuale-di-almeno-32-caratteri
SESSION_SECRET=altra-stringa-casuale-di-almeno-32-caratteri
```

### 🔑 Ottenere le API Keys

#### SendApp Cloud Token:
1. Vai su https://app.sendapp.cloud
2. Registrati/Login
3. Dashboard → API Settings
4. Click "Generate Access Token"
5. Copia il token nel `.env`

#### OpenAI API Key:
1. Vai su https://platform.openai.com
2. Login → API Keys
3. Create new secret key
4. Copia nel `.env`

---

## 💾 STEP 3: DATABASE SETUP (5 minuti)

```bash
# 1. Crea database
createdb assistenza

# 2. Genera schema Prisma
cd backend
npx prisma generate

# 3. Applica migrazioni
npx prisma db push

# 4. (Opzionale) Seed con dati test
npx prisma db seed

# 5. Verifica
npx prisma studio  # Apre GUI a http://localhost:5555

cd ..
```

---

## 🌐 STEP 4: AVVIO SERVIZI (5 minuti)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
# ✅ Backend running on http://localhost:3200
```

### Terminal 2 - Frontend
```bash
npm run dev
# ✅ Frontend running on http://localhost:5193
```

### Terminal 3 - Redis (opzionale)
```bash
redis-server
# ✅ Redis ready on localhost:6379
```

### Terminal 4 - Ngrok (per test locale)
```bash
# Installa ngrok se non ce l'hai
# brew install ngrok  # Mac
# o scarica da https://ngrok.com

ngrok http 3200
# ✅ Copia l'URL tipo: https://abc123.ngrok.io
```

---

## 📱 STEP 5: CONNESSIONE WHATSAPP (5 minuti)

### 1. Configura Webhook URL
```bash
# Aggiorna .env con URL ngrok
SENDAPP_WEBHOOK_URL=https://abc123.ngrok.io/api/whatsapp/webhook
```

### 2. Inizializza WhatsApp
1. Apri browser: http://localhost:5193/admin/whatsapp/setup
2. Login come admin (credenziali di default o create)
3. Click "Inizializza WhatsApp"
4. Click "Genera QR Code"

### 3. Scansiona QR Code
1. Apri WhatsApp sul telefono
2. Menu → Dispositivi collegati
3. Collega un dispositivo
4. Scansiona il QR code
5. Attendi conferma "✅ Connesso"

---

## 🧪 STEP 6: TEST SISTEMA (5 minuti)

### Test 1: Verifica Connessione
```bash
curl http://localhost:3200/api/whatsapp/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Risposta attesa:
# {"success":true,"data":{"connected":true,"phoneNumber":"+39XXX"}}
```

### Test 2: Invia Messaggio Test
Invia un messaggio WhatsApp al numero collegato:
```
Ciao
```

Risposta attesa dal bot:
```
Ciao! 👋 Sono l'assistente di Richiesta Assistenza.
Come posso aiutarti?
...
```

### Test 3: Test Comando
Invia:
```
AIUTO
```

Dovrebbe rispondere con il menu completo.

### Test 4: Test Richiesta Assistenza
Invia:
```
Ho una perdita d'acqua dal rubinetto della cucina
```

Il bot dovrebbe:
1. Riconoscere categoria "idraulica"
2. Fornire suggerimenti immediati
3. Offrire di creare una richiesta

---

## ⚙️ CONFIGURAZIONE AVANZATA (10 minuti)

### 1. Configura Categorie e Sottocategorie

```sql
-- Inserisci categorie base
INSERT INTO "Category" (id, name, slug, description, is_active) VALUES
('cat-1', 'Idraulica', 'idraulica', 'Servizi idraulici', true),
('cat-2', 'Elettricista', 'elettricista', 'Servizi elettrici', true),
('cat-3', 'Condizionamento', 'condizionamento', 'Climatizzazione', true);

-- Inserisci sottocategorie
INSERT INTO "Subcategory" (id, category_id, name, slug, is_active) VALUES
('sub-1', 'cat-1', 'Perdite acqua', 'perdite-acqua', true),
('sub-2', 'cat-1', 'Scarichi otturati', 'scarichi-otturati', true),
('sub-3', 'cat-2', 'Blackout', 'blackout', true),
('sub-4', 'cat-2', 'Cortocircuito', 'cortocircuito', true);
```

### 2. Configura AI per Sottocategorie

```sql
-- Configura AI per sottocategoria "Perdite acqua"
INSERT INTO "SubcategoryAiSettings" (
  subcategory_id,
  system_prompt,
  temperature,
  max_tokens,
  model,
  is_active
) VALUES (
  'sub-1',
  'Sei un esperto idraulico. Aiuta con perdite d''acqua fornendo soluzioni pratiche e sicure.',
  0.7,
  1000,
  'gpt-3.5-turbo',
  true
);
```

### 3. Upload Documenti Knowledge Base

Via interfaccia admin:
1. Vai a http://localhost:5193/admin/kb
2. Seleziona sottocategoria
3. Upload PDF/documenti
4. Sistema processerà automaticamente

O via API:
```bash
curl -X POST http://localhost:3200/api/kb/documents \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@manuale-idraulica.pdf" \
  -F "subcategoryId=sub-1" \
  -F "title=Manuale Idraulica Base"
```

---

## 🎉 SISTEMA PRONTO!

### ✅ Checklist Finale

- [ ] WhatsApp connesso e risponde
- [ ] Comandi base funzionano (AIUTO, STATO)
- [ ] AI risponde correttamente
- [ ] Categorie riconosciute
- [ ] Knowledge Base caricata
- [ ] Database popolato
- [ ] Logs senza errori

### 📊 Dashboard Admin

Accedi a: http://localhost:5193/admin

Sezioni principali:
- **/admin/whatsapp** - Gestione WhatsApp
- **/admin/whatsapp/analytics** - Statistiche
- **/admin/kb** - Knowledge Base
- **/admin/users** - Gestione utenti
- **/admin/requests** - Richieste assistenza

---

## ❓ FAQ - DOMANDE FREQUENTI

### Q: WhatsApp non si connette
**A:** Verifica:
1. Token SendApp corretto nel .env
2. Numero non già connesso altrove
3. QR Code scansionato entro 60 secondi
4. Webhook URL raggiungibile (test con curl)

### Q: Bot non risponde ai messaggi
**A:** Controlla:
1. Backend running su porta 3200
2. Webhook configurato su SendApp
3. Ngrok attivo (se in locale)
4. Logs per errori: `tail -f backend/logs/error.log`

### Q: Errore "AI quota exceeded"
**A:** OpenAI crediti finiti. Soluzioni:
1. Aggiungi crediti su OpenAI
2. Cambia a modello più economico (gpt-3.5-turbo)
3. Abilita cache per risposte comuni

### Q: Knowledge Base non trova documenti
**A:** Verifica:
1. Documenti caricati e processati
2. Sottocategoria corretta assegnata
3. Embeddings generati: check in DB
4. Riprocessa: `/api/kb/reprocess`

### Q: Come aggiungere nuove categorie?
**A:** 
1. Via Admin UI: /admin/categories
2. O via SQL diretto nel database
3. Ricorda di configurare AI settings
4. Upload documenti KB correlati

### Q: Come vedere i costi AI?
**A:** Dashboard: /admin/whatsapp/analytics
Mostra:
- Token usati oggi
- Costo stimato
- Trend settimanale
- Alert se sopra budget

### Q: Backup e restore?
**A:** 
```bash
# Backup
pg_dump assistenza > backup.sql

# Restore
psql assistenza < backup.sql
```

### Q: Performance lenta?
**A:** Ottimizzazioni:
1. Abilita Redis per caching
2. Riduci max_tokens AI (500 invece di 2000)
3. Usa gpt-3.5-turbo invece di gpt-4
4. Aggiungi indici database (vedi docs)

### Q: Multi-lingua?
**A:** Attualmente solo italiano. Per altre lingue:
1. Traduci prompt AI
2. Traduci template risposte
3. Configura in SubcategoryAiSettings

### Q: Limiti di sistema?
**A:** 
- Max 10 msg/minuto per utente
- Max 4096 caratteri per messaggio  
- Max 10MB per file allegato
- Max 1000 conversazioni simultanee

---

## 🚨 TROUBLESHOOTING RAPIDO

### Comandi Utili Debug

```bash
# Check sistema completo
./scripts/check-system.sh

# Logs real-time
tail -f backend/logs/*.log

# Test webhook manuale
curl -X POST http://localhost:3200/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Reset WhatsApp connection
curl -X POST http://localhost:3200/api/whatsapp/reset \
  -H "Authorization: Bearer TOKEN"

# Database stats
psql assistenza -c "
  SELECT 
    (SELECT COUNT(*) FROM users) as users,
    (SELECT COUNT(*) FROM whatsapp_message) as messages,
    (SELECT COUNT(*) FROM assistance_request) as requests,
    (SELECT COUNT(*) FROM kb_document) as kb_docs
"

# Redis check
redis-cli ping

# Process manager
pm2 status
pm2 logs
pm2 restart all
```

---

## 📞 SUPPORTO

### Canali di Supporto

- **GitHub Issues**: https://github.com/241luca/Richiesta-Assistenza/issues
- **Email**: support@lmtecnologie.it
- **Documentazione**: /docs/
- **Community Discord**: [Link Discord]

### Risorse Utili

- [Documentazione Tecnica Completa](./DOCUMENTAZIONE-TECNICA-WHATSAPP-AI-KB.md)
- [Manuale Operativo](./MANUALE-OPERATIVO-WHATSAPP.md)
- [API Reference](./API-REFERENCE.md)
- [Security Guidelines](./SECURITY.md)

---

## 🎊 PROSSIMI PASSI

Ora che il sistema è operativo:

1. **Personalizza AI**: Modifica prompt in admin/ai-settings
2. **Carica KB**: Upload documenti specifici del tuo business
3. **Configura Analytics**: Setup dashboard metriche
4. **Test con utenti reali**: Invita beta tester
5. **Ottimizza**: Monitora e ottimizza performance

---

**CONGRATULAZIONI! 🎉**

Il tuo sistema WhatsApp AI è pronto e operativo!

Per funzionalità avanzate, consulta la documentazione completa.

---

*Quick Start Guide v1.0 - Settembre 2025*
*© LM Tecnologie - Tutti i diritti riservati*
