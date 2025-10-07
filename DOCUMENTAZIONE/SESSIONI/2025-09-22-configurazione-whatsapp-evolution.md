# SESSIONE CONFIGURAZIONE WHATSAPP - 22 SETTEMBRE 2025

## DURATA: 5+ ore
## RISULTATO: WhatsApp/Evolution API parzialmente funzionante

---

## PROBLEMA INIZIALE
L'integrazione WhatsApp con SendApp non funzionava più. Necessario passare a Evolution API.

---

## CONFIGURAZIONE VPS (37.27.89.35)

### 1. INSTALLAZIONE EVOLUTION API

#### Docker Compose utilizzato (/opt/evolution-api/docker-compose.yml):
```yaml
version: '3.9'

services:
  evolution-api:
    container_name: evolution_api
    image: atendai/evolution-api:latest
    restart: always
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    environment:
      - NODE_ENV=production
      - SERVER_URL=http://37.27.89.35:8080
      - DATABASE_ENABLED=true
      
      # Database PostgreSQL
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://evolution:evolution123@postgres:5432/evolution
      
      # FIX CRITICO - SENZA QUESTO NON GENERA QR CODE
      - CONFIG_SESSION_PHONE_VERSION=2.3000.1023204200
      
      # Sicurezza
      - AUTHENTICATION_TYPE=apikey
      - AUTHENTICATION_API_KEY=evolution_key_luca_2025_secure_21806
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      
      # Limiti
      - INSTANCE_LIMIT=10
      - QRCODE_LIMIT=30
      
      # Webhook
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_URL=http://37.27.89.35:3200/api/whatsapp/webhook
      
      # Log
      - LOG_LEVEL=info
      
      # Pulizia automatica
      - CLEAN_STORE_CLEANING_INTERVAL=7200
      - CLEAN_STORE_MESSAGES=true
      - CLEAN_STORE_CONTACTS=true
      - CLEAN_STORE_CHATS=true
      
      # CORS
      - CORS_ORIGIN=*
      - CORS_CREDENTIALS=true
      
    volumes:
      - evolution_data:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - evolution_network

  postgres:
    image: postgres:14-alpine
    container_name: evolution_postgres
    restart: always
    environment:
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=evolution123
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution_network

volumes:
  evolution_data:
  evolution_store:
  postgres_data:

networks:
  evolution_network:
    driver: bridge
```

### 2. PROBLEMA PRINCIPALE RISOLTO
Evolution API v2.2.3 non generava QR codes perché usava una versione obsoleta del protocollo WhatsApp (Baileys).

**SOLUZIONE**: Aggiunta variabile d'ambiente:
```yaml
CONFIG_SESSION_PHONE_VERSION=2.3000.1023204200
```

### 3. COMANDI UTILI VPS

```bash
# Avvio Evolution API
cd /opt/evolution-api
docker-compose up -d

# Verifica logs
docker logs evolution_api --tail 100

# Crea istanza WhatsApp
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: evolution_key_luca_2025_secure_21806" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "sistema",
    "token": "evolution_key_luca_2025_secure_21806",
    "integration": "WHATSAPP-BAILEYS",
    "qrcode": true
  }'

# Verifica stato istanza
curl http://localhost:8080/instance/connectionState/sistema \
  -H "apikey: evolution_key_luca_2025_secure_21806"

# Lista istanze
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: evolution_key_luca_2025_secure_21806"

# Test invio messaggio
curl -X POST http://localhost:8080/message/sendText/sistema \
  -H "apikey: evolution_key_luca_2025_secure_21806" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "393403803728",
    "text": "Test messaggio"
  }'
```

---

## CONFIGURAZIONE BACKEND LOCALE

### 1. FILE MODIFICATI

#### backend/.env
```env
# Evolution API Configuration
EVOLUTION_URL=http://37.27.89.35:8080
EVOLUTION_API_KEY=evolution_key_luca_2025_secure_21806
EVOLUTION_INSTANCE=sistema
```

#### backend/src/routes/whatsapp-main.routes.ts
Aggiunto endpoint `/send` per invio messaggi:

```typescript
router.post('/send', authenticate, async (req, res) => {
  try {
    const { recipient, message } = req.body;
    
    if (!recipient || !message) {
      return res.status(400).json(
        ResponseFormatter.error('recipient and message are required', 'VALIDATION_ERROR')
      );
    }
    
    const axios = require('axios');
    const evolutionUrl = process.env.EVOLUTION_URL || 'http://37.27.89.35:8080';
    const apiKey = process.env.EVOLUTION_API_KEY || 'evolution_key_luca_2025_secure_21806';
    const instance = process.env.EVOLUTION_INSTANCE || 'sistema';
    
    const evolutionApi = axios.create({
      baseURL: evolutionUrl,
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    const number = recipient.replace(/\+|\s/g, '');
    
    const response = await evolutionApi.post(`/message/sendText/${instance}`, {
      number: number,
      text: message
    });
    
    console.log('WhatsApp message sent:', { 
      recipient: number, 
      messageId: response.data?.key?.id || 'unknown'
    });
    
    return res.json(ResponseFormatter.success(response.data, 'Message sent successfully'));
  } catch (error: any) {
    console.error('WhatsApp send error details:', {
      message: error.message,
      responseData: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    const errorMessage = error.response?.data?.response?.message?.[0] || 
                        error.response?.data?.message || 
                        error.message || 
                        'Failed to send message';
    
    return res.status(500).json(ResponseFormatter.error(errorMessage, 'SEND_ERROR'));
  }
});
```

---

## CONFIGURAZIONE FRONTEND

### FILE MODIFICATI

#### src/components/admin/whatsapp/WhatsAppSendMessage.tsx
Corretto il formato dei dati inviati:

```typescript
const sendMutation = useMutation({
  mutationFn: (data: { recipient: string; message: string }) => 
    api.post('/whatsapp/send', data),
  // ...
});

// Nel submit
sendMutation.mutate({
  recipient: formattedNumber,  // Cambiato da phoneNumber
  message: message.trim()
});
```

---

## PROBLEMI INCONTRATI E SOLUZIONI

### 1. QR Code non generato (3+ ore di debug)
- **Problema**: Evolution API v2.2.3 usa Baileys con versione protocollо WhatsApp obsoleta
- **Soluzione**: Aggiunto `CONFIG_SESSION_PHONE_VERSION=2.3000.1023204200` nel docker-compose

### 2. Errore "Cannot GET /api/whatsapp/send" 
- **Problema**: Backend interpretava POST come GET
- **Soluzione**: Aggiunto endpoint POST corretto in whatsapp-main.routes.ts

### 3. Errore "recipient required"
- **Problema**: Frontend inviava `phoneNumber` invece di `recipient`
- **Soluzione**: Modificato WhatsAppSendMessage.tsx

### 4. Errore 401 Unauthorized
- **Problema**: API key errata o istanza con token diverso
- **Soluzione**: Verificata API key corretta dal docker-compose

### 5. Errore 404 "instance not exist"
- **Problema**: Nome istanza errato nel backend
- **Soluzione**: Aggiornato .env con nome istanza corretto

### 6. Timeout su invio messaggi
- **Problema**: Istanza tipo EVOLUTION invece di WHATSAPP-BAILEYS
- **Soluzione**: Creata nuova istanza con integration corretta

---

## STATO ATTUALE

### ✅ FUNZIONANTE
- Evolution API installato e configurato sul VPS
- QR code generato correttamente
- Istanza "sistema" creata
- Backend configurato con endpoint /send
- Frontend aggiornato per formato dati corretto

### ⚠️ PROBLEMI RESIDUI
- Invio messaggi dal pannello admin ancora instabile
- Evolution API risponde ma a volte va in timeout
- Connessione WhatsApp dice "collegato" sul telefono ma invio non sempre funziona

---

## ISTANZE CREATE
1. **prova** - Creata con tipo sbagliato, non funzionante
2. **sistema** - Creata con WHATSAPP-BAILEYS, QR code generato

---

## NOTE IMPORTANTI

1. **CONFIG_SESSION_PHONE_VERSION** è CRITICO - senza questo Evolution API non genera QR codes
2. L'API key è: `evolution_key_luca_2025_secure_21806`
3. L'istanza corrente è: `sistema`
4. Evolution API gira su porta 8080 del VPS
5. Il Manager Web è accessibile su: http://37.27.89.35:8080/manager/

---

## PROSSIMI PASSI CONSIGLIATI

1. **Verificare stabilità**: Testare invio messaggi in diversi momenti
2. **Considerare alternative**: Se Evolution continua a dare problemi, valutare:
   - WPPConnect (più stabile)
   - WhatsApp Business API (ufficiale ma a pagamento)
3. **Monitoraggio**: Implementare health check per Evolution API
4. **Backup plan**: Il sistema funziona anche senza WhatsApp usando email/SMS

---

## TEMPO INVESTITO: 5+ ore
## RISULTATO: Parzialmente funzionante, necessita ulteriori test

---

Documento creato: 22 Settembre 2025, 02:30 AM
