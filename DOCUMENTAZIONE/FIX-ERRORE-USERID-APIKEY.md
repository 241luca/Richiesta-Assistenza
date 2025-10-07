# 🔧 FIX ERRORE API KEY BREVO - RISOLTO

**Data:** 12 Settembre 2025  
**Ora:** 13:10  
**Problema:** Errore "userId is not defined" quando si salva API Key Brevo

---

## ❌ ERRORE RISCONTRATO

```
Error upserting API key: userId is not defined
at ApiKeyService.upsertApiKey (/backend/src/services/apiKey.service.ts:179:26)
```

---

## ✅ SOLUZIONE APPLICATA

### File Modificato:
`/backend/src/services/apiKey.service.ts`

### Problema:
La funzione `upsertApiKey` riceveva il parametro `recipientId` ma nel codice si usava `userId` (variabile non definita).

### Correzioni:
- **Riga 179:** Cambiato `userId` → `recipientId`  
- **Riga 195:** Cambiato `userId` → `recipientId`
- **Riga 202:** Cambiato `userId` → `recipientId`

---

## 🚀 PASSI PER COMPLETARE IL FIX

### 1. Riavvia il Backend
Il backend deve essere riavviato per caricare le modifiche:

```bash
# Nel terminale dove gira il backend
# Premi Ctrl+C per fermarlo
# Poi riavvia con:
cd backend
npm run dev
```

### 2. Riprova a Salvare l'API Key
1. Vai su: http://localhost:5193/admin/api-keys/brevo
2. Inserisci la tua API key Brevo
3. Configura email mittente
4. Clicca "Salva Configurazione"

---

## ✅ VERIFICHE

### Test Dopo il Fix:
- [ ] Backend riavviato
- [ ] API Key salvata senza errori
- [ ] Test connessione funzionante
- [ ] Email di test inviata

---

## 📝 NOTE

- Il problema era un semplice errore di battitura nel codice
- Ora il sistema dovrebbe salvare correttamente le API keys
- La chiave viene criptata prima di essere salvata nel database
- Il sistema supporta 3 servizi: GOOGLE_MAPS, BREVO, OPENAI

---

**Status:** ✅ RISOLTO  
**Richiede:** Riavvio backend per applicare le modifiche
