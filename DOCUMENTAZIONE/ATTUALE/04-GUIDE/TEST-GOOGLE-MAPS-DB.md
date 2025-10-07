# 🧪 TEST GOOGLE MAPS API KEY DAL DATABASE

**Versione**: 5.1.2  
**Data**: 3 Ottobre 2025

---

## ✅ COSA È STATO FATTO

Google Maps API key ora viene caricata **dal database** invece che dal file `.env`.

---

## 🧪 TEST RAPIDO

### 1. **Verifica API Key nel Database**

```bash
# Terminal nel progetto
cd backend

# Verifica che la chiave esista
npx prisma studio
```

Poi cerca:
- Tabella: `SystemSettings`
- Campo `key`: `GOOGLE_MAPS_API_KEY`
- Campo `value`: Deve contenere la tua API key

**Se NON esiste**, inseriscila:

```sql
-- Copia questo nel Prisma Studio o psql
INSERT INTO "SystemSettings" (id, key, value, type, category, isPublic)
VALUES (
  gen_random_uuid(),
  'GOOGLE_MAPS_API_KEY',
  'LA_TUA_API_KEY_QUI',
  'string',
  'integrations',
  true
)
ON CONFLICT (key) DO UPDATE SET value = 'LA_TUA_API_KEY_QUI';
```

---

### 2. **Test Backend (Endpoint Pubblico)**

```bash
# Mentre backend è in esecuzione
curl http://localhost:3200/api/public/config/google-maps-key
```

**Risposta attesa**:
```json
{
  "success": true,
  "data": {
    "apiKey": "AIzaSyC...tuaChiaveQui"
  },
  "message": "Google Maps API Key retrieved successfully"
}
```

**❌ Se vedi errore 404**:
- Backend non è partito
- Endpoint non registrato (riavvia backend)

---

### 3. **Test Frontend (Console Browser)**

1. **Avvia frontend** (se non già avviato)
   ```bash
   npm run dev
   ```

2. **Apri app** nel browser: `http://localhost:5193`

3. **Apri Console** (F12 → Console)

4. **Cerca questi log**:
   ```
   🔑 Caricamento Google Maps API key dal database...
   ✅ Google Maps API Key caricata dal database
   ✅ Google Maps API loaded successfully
   ```

5. **Test manuale**:
   ```javascript
   // Nella console, digita:
   console.log('Google Maps loaded:', !!window.google?.maps);
   // Deve stampare: true
   ```

---

### 4. **Test Visivo nell'App**

1. **Login** come utente qualsiasi

2. **Vai in Profilo** o qualsiasi pagina con mappa

3. **Verifica**:
   - ✅ Nessun errore in console
   - ✅ Autocomplete indirizzi funziona
   - ✅ Mappa (se presente) si carica

---

## ⚠️ SE NON FUNZIONA

### Errore: "API key non trovata"

```bash
# Check 1: Verifica database
cd backend
npx prisma studio
# Cerca SystemSettings → GOOGLE_MAPS_API_KEY

# Check 2: Se manca, inseriscila
psql $DATABASE_URL -c "
INSERT INTO \"SystemSettings\" (id, key, value, type, category, isPublic)
VALUES (gen_random_uuid(), 'GOOGLE_MAPS_API_KEY', 'TUA_KEY', 'string', 'integrations', true)
ON CONFLICT (key) DO UPDATE SET value = 'TUA_KEY';
"
```

### Errore 403 in console

Console mostra:
```
You must use an API key to authenticate each request...
```

**Causa**: Frontend non riesce a caricare la chiave

**Fix**:
```bash
# 1. Riavvia backend
cd backend
npm run dev

# 2. Riavvia frontend
cd ..
npm run dev

# 3. Hard refresh browser (Ctrl+Shift+R o Cmd+Shift+R)
```

### Spinner infinito "Caricamento Google Maps..."

**Causa**: Endpoint backend non risponde

**Fix**:
```bash
# Terminal 1: Verifica backend è attivo
curl http://localhost:3200/api/health
# Deve rispondere con { "status": "ok" }

# Terminal 2: Test endpoint specifico
curl http://localhost:3200/api/public/config/google-maps-key
# Deve ritornare l'API key

# Se nessuno funziona:
cd backend
npm run dev  # Riavvia backend
```

---

## ✅ CHECKLIST FINALE

Dopo il test, verifica:

- [ ] Endpoint backend risponde con API key
- [ ] Console frontend mostra "✅ Google Maps API Key caricata"
- [ ] Console frontend mostra "✅ Google Maps API loaded successfully"
- [ ] Nessun errore 403 in console
- [ ] Autocomplete indirizzi funziona
- [ ] App carica normalmente

**Se tutti ✅ → Sistema funziona perfettamente!** 🎉

---

## 🔧 COMANDI UTILI

### Verifica API Key nel DB
```sql
SELECT key, value, category, "isPublic"
FROM "SystemSettings"
WHERE key = 'GOOGLE_MAPS_API_KEY';
```

### Cambia API Key
```sql
UPDATE "SystemSettings"
SET value = 'NUOVA_API_KEY'
WHERE key = 'GOOGLE_MAPS_API_KEY';
```

### Test completo endpoint
```bash
# Test con curl verbose
curl -v http://localhost:3200/api/public/config/google-maps-key

# Test con httpie (se installato)
http GET http://localhost:3200/api/public/config/google-maps-key
```

---

## 🎯 SUCCESSO!

Se tutti i test passano, hai ora un sistema **completamente centralizzato**:
- ✅ Nessuna dipendenza da `.env`
- ✅ API key gestita nel database
- ✅ Cambio chiave senza rideploy
- ✅ Sistema più sicuro e manutenibile

**Pronto per il commit!** 🚀
