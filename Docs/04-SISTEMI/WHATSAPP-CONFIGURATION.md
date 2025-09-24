# 🔴 CONFIGURAZIONE WHATSAPP - REGOLE CRITICHE

## ⚠️ REGOLA FONDAMENTALE
**MAI HARDCODARE CREDENZIALI O CONFIGURAZIONI NEL CODICE!**

Tutte le configurazioni DEVONO essere salvate nel database nella tabella `ApiKey`.

## 📍 Dove si trova la configurazione

La configurazione WhatsApp è salvata nel database:
- **Tabella**: `ApiKey`
- **Provider**: `WHATSAPP`
- **Campo configuration**: Contiene URL, apiKey e instance

## 🔧 Come configurare WhatsApp

### 1. Da Admin Panel (RACCOMANDATO)
1. Vai su http://localhost:5193/admin/api-keys
2. Cerca o crea la configurazione WhatsApp
3. Imposta:
   - URL: `http://37.27.89.35:8080`
   - API Key: `evolution_key_luca_2025_secure_21806`
   - Instance: `assistenza`

### 2. Via Database (Prisma Studio)
```bash
cd backend
npx prisma studio
```
Poi modifica il record con provider = 'WHATSAPP'

### 3. Via Script (se necessario)
```bash
cd backend
npx ts-node src/scripts/setup-whatsapp.ts
```

## ❌ COSA NON FARE MAI

1. **NON hardcodare configurazioni nel codice**
2. **NON usare valori di default nel codice**
3. **NON mettere API keys nel codice sorgente**
4. **NON usare file .env per configurazioni runtime**

## ✅ COME FUNZIONA

1. Il sistema legge la configurazione dal database
2. Se non trova la configurazione, genera errore (NO fallback)
3. La configurazione viene cachata in memoria per performance
4. Per ricaricare: POST /api/whatsapp/config/refresh

## 🔍 Debug

Se WhatsApp non funziona:
1. Controlla i log del backend
2. Verifica che la configurazione sia nel database
3. Verifica che l'istanza Evolution API sia attiva
4. Controlla che l'API key sia corretta

## 📝 Note Importanti

- La configurazione DEVE essere nel database
- NON ci sono fallback o valori di default
- Tutto è configurabile da Admin Panel
- Le credenziali non devono MAI essere nel codice
