# 🔐 CONFIGURAZIONE SICURA WHATSAPP

## ⚠️ IMPORTANTE: Sicurezza delle Chiavi

**MAI** inserire chiavi API direttamente nel codice sorgente!

## 📋 Come Configurare WhatsApp

### Metodo 1: Tramite Interfaccia Web (CONSIGLIATO)

1. **Accedi come Admin** al sistema
2. **Vai a "API Keys"** dal menu admin
3. **Cerca la configurazione WhatsApp** o creane una nuova
4. **Inserisci i seguenti dati**:
   - **Service**: WHATSAPP
   - **API Key**: Il tuo access token SendApp (es: 64833dfa0xxxx)
   - **Instance ID**: Lascia vuoto, verrà generato automaticamente
   - **Webhook URL**: Verrà configurato automaticamente

### Metodo 2: Tramite Database (Avanzato)

Se devi configurare direttamente nel database:

```sql
-- Inserisci o aggiorna configurazione WhatsApp
UPDATE "ApiKey" 
SET 
  "apiKey" = 'TUO_ACCESS_TOKEN',
  "instanceId" = 'TUO_INSTANCE_ID',
  "webhookUrl" = 'http://tuoserver.com/api/whatsapp/webhook',
  "isActive" = true
WHERE "service" = 'WHATSAPP';
```

### Metodo 3: Tramite Script

```bash
# Esegui lo script di configurazione
cd backend
npx ts-node scripts/setup-whatsapp-secure.ts
```

## 🔄 Processo di Connessione Nuovo Telefono

### 1. Disconnetti Telefono Attuale (se connesso)

```bash
# Tramite interfaccia
1. Vai su /admin/whatsapp
2. Clicca "Disconnetti"

# O tramite script
cd backend
npx ts-node scripts/disconnect-whatsapp.ts
```

### 2. Genera Nuova Istanza e QR Code

```bash
# Tramite interfaccia
1. Vai su /admin/whatsapp
2. Clicca "Genera QR Code"
3. Scansiona con WhatsApp sul nuovo telefono

# Il sistema automaticamente:
- Crea nuova istanza
- Salva instance ID
- Mostra QR code
- Configura webhook
```

### 3. Verifica Connessione

```bash
# Tramite interfaccia
1. Clicca "Aggiorna Stato"
2. Deve mostrare "Connesso"

# O tramite script test
cd backend
npx ts-node scripts/test-whatsapp-send.ts
```

## 📝 Dove Vengono Salvate le Configurazioni

Le configurazioni WhatsApp sono salvate in modo sicuro nel database:

- **Tabella**: `ApiKey`
- **Service**: 'WHATSAPP'
- **Campi importanti**:
  - `apiKey`: Access token SendApp (criptato)
  - `instanceId`: ID istanza WhatsApp
  - `webhookUrl`: URL per ricevere messaggi
  - `isActive`: Stato attivazione
  - `metadata`: Configurazioni aggiuntive (JSON)

## 🚫 Cosa NON Fare

1. ❌ **MAI** inserire chiavi nel codice
2. ❌ **MAI** commitare file .env con valori reali
3. ❌ **MAI** condividere access token in chat/email
4. ❌ **MAI** usare lo stesso instance ID per più telefoni

## ✅ Best Practices

1. ✅ Usa sempre l'interfaccia web per configurare
2. ✅ Ruota periodicamente l'access token
3. ✅ Monitora i log per attività sospette
4. ✅ Testa sempre in ambiente di sviluppo prima
5. ✅ Documenta ogni cambio di configurazione

## 🆘 Troubleshooting

### Errore: "Client WhatsApp non inizializzato"
- Verifica che l'access token sia configurato in API Keys
- Controlla i log del backend

### Errore: "Instance ID non trovato"
- Genera una nuova istanza tramite "Genera QR Code"
- Verifica nella tabella ApiKey che instanceId sia presente

### QR Code non si genera
- Controlla che l'access token sia valido
- Verifica la connessione internet
- Controlla i log per errori API

## 📊 Monitoraggio

Per monitorare lo stato di WhatsApp:

1. **Dashboard**: `/admin/whatsapp/dashboard`
2. **Logs**: `tail -f backend/logs/whatsapp.log`
3. **Database**: Controlla tabella `WhatsAppMessage`

---

**RICORDA**: La sicurezza delle chiavi API è fondamentale. Non esporle mai!
