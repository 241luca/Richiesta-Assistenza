# 🚨 SOLUZIONE URGENTE - GOOGLE MAPS KEY MANCANTE

**Problema**: API key Google Maps **NON È NEL DATABASE**

**Stato**: 🔴 BLOCCANTE - L'app non può funzionare

---

## ✅ SOLUZIONE IMMEDIATA

### Opzione 1: Prisma Studio (GUI - CONSIGLIATO)

1. **Apri Prisma Studio** (già aperto in un terminale)
   ```bash
   cd backend
   npx prisma studio
   ```

2. **Vai su tabella `SystemSettings`**

3. **Clicca "+ Add record"**

4. **Compila i campi**:
   - `id`: (lascia vuoto, genera automatico)
   - `key`: `GOOGLE_MAPS_API_KEY`
   - `value`: **LA TUA CHIAVE GOOGLE MAPS** (es: `AIzaSyC...`)
   - `type`: `string`
   - `category`: `integrations`
   - `isPublic`: ✅ TRUE (molto importante!)
   - `description`: `Google Maps API key`

5. **Clicca "Save 1 change"**

6. **✅ FATTO! Ricarica il browser**

---

### Opzione 2: SQL Diretto (Terminale)

```bash
# Terminal nel progetto
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Esegui SQL (SOSTITUISCI LA CHIAVE!)
npx prisma db execute --stdin << 'EOF'
INSERT INTO "SystemSettings" (
  id, key, value, type, category, "isPublic", description, "createdAt", "updatedAt"
) VALUES (
  gen_random_uuid(),
  'GOOGLE_MAPS_API_KEY',
  'LA_TUA_CHIAVE_QUI',
  'string',
  'integrations',
  true,
  'Google Maps API key',
  NOW(),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET value = 'LA_TUA_CHIAVE_QUI', "updatedAt" = NOW();
EOF
```

---

### Opzione 3: File SQL

1. **Apri file**: `INSERT-GOOGLE-MAPS-KEY.sql` (nella root)

2. **Sostituisci** `TUA_API_KEY_QUI` con la vera chiave

3. **Esegui**:
   ```bash
   cd backend
   psql $DATABASE_URL -f ../INSERT-GOOGLE-MAPS-KEY.sql
   ```

---

## 🔑 DOVE TROVO LA CHIAVE?

### Se hai già una chiave:

Cerca in:
- File `.env` del backend (se esiste)
- Google Cloud Console → APIs & Services → Credentials
- Documentazione progetto

### Se NON hai una chiave:

1. Vai su: https://console.cloud.google.com/
2. Crea un progetto (o seleziona esistente)
3. Abilita Google Maps JavaScript API
4. Vai su Credentials → Create Credentials → API Key
5. Copia la chiave generata
6. Inseriscila nel database come sopra

---

## 🧪 VERIFICA FUNZIONAMENTO

### Test 1: Backend

```bash
curl http://localhost:3200/api/public/config/google-maps-key
```

**Prima (errore)**:
```json
{
  "success": false,
  "error": {"code": "API_KEY_NOT_FOUND"}
}
```

**Dopo (corretto)**:
```json
{
  "success": true,
  "data": {
    "apiKey": "AIzaSy..."
  }
}
```

### Test 2: Frontend

1. Ricarica browser (`Cmd+Shift+R`)
2. Console deve mostrare:
   ```
   ✅ Google Maps API Key caricata dal database
   ```

---

## ⚠️ IMPORTANTE

La chiave DEVE avere `isPublic: true` altrimenti l'endpoint pubblico non la ritornerà!

---

## 🎯 CHECKLIST

- [ ] Chiave inserita nel database
- [ ] `isPublic` = TRUE
- [ ] `curl` ritorna `{"success": true, "data": {"apiKey": "..."}}`
- [ ] Frontend ricaricato
- [ ] Console mostra "✅ API Key caricata"
- [ ] Nessun errore 404 o 403

**Una volta completato → Sistema funziona!** 🎉

---

**PRIORITÀ MASSIMA**: Inserisci la chiave ORA, è bloccante! 🚨
