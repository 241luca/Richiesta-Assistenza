# 📱 INTEGRAZIONE WHATSAPP - DOCUMENTAZIONE COMPLETA

> **Ultimo aggiornamento**: 14 Settembre 2025  
> **Versione**: 1.0.0  
> **Stato**: ✅ FUNZIONANTE

## 📋 INDICE

1. [Panoramica](#panoramica)
2. [Prerequisiti](#prerequisiti)
3. [Configurazione SendApp](#configurazione-sendapp)
4. [Configurazione Backend](#configurazione-backend)
5. [Configurazione Database](#configurazione-database)
6. [API Endpoints](#api-endpoints)
7. [Utilizzo del Sistema](#utilizzo-del-sistema)
8. [Risoluzione Problemi](#risoluzione-problemi)
9. [Sicurezza](#sicurezza)

---

## 🎯 PANORAMICA

Il sistema integra WhatsApp Business tramite l'API di **SendApp Cloud** per:
- Inviare messaggi singoli
- Inviare messaggi di gruppo
- Inviare media (immagini, documenti)
- Gestire lo stato della connessione

### Architettura
```
Frontend (React) → Backend (Express) → SendApp API → WhatsApp
                                    ↓
                            Database (PostgreSQL)
```

---

## ⚙️ PREREQUISITI

### Account SendApp
1. Registrazione su [SendApp Cloud](https://app.sendapp.cloud)
2. Ottenere Access Token dal pannello
3. Piano attivo con crediti messaggi

### Sistema
- Node.js 18+
- PostgreSQL
- Redis (opzionale ma consigliato)

---

## 🔧 CONFIGURAZIONE SENDAPP

### 1. Ottenere le Credenziali

Dal pannello SendApp:
```
Access Token: [IL_TUO_TOKEN]
```

### 2. API Endpoints SendApp

Base URL: `https://app.sendapp.cloud/api`

Endpoints principali:
- `GET /create_instance` - Crea nuova istanza
- `GET /get_qrcode` - Ottiene QR per login
- `POST /send` - Invia messaggio
- `POST /send_group` - Invia a gruppo
- `GET /set_webhook` - Configura webhook
- `GET /reset_instance` - Reset istanza

---

## 💾 CONFIGURAZIONE DATABASE

### Schema Prisma

La tabella `SystemConfiguration` deve esistere nel database:

```prisma
model SystemConfiguration {
  key         String   @id
  value       String   @db.Text
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### Applicare lo Schema

```bash
cd backend
npx prisma generate
npx prisma db push
```

### Dati Salvati

Il sistema salva in `SystemConfiguration`:
- `whatsapp_instance_id` - ID istanza SendApp
- `whatsapp_connected_manual` - Stato connessione (true/false)
- `whatsapp_access_token` - Token SendApp (opzionale)

---

## 🔌 CONFIGURAZIONE BACKEND

### 1. Servizio WhatsApp (`backend/src/services/whatsapp.service.ts`)

#### Configurazione Client

```typescript
// ⚠️ IMPORTANTE: Il token e l'URL sono configurabili
const accessToken = process.env.SENDAPP_TOKEN || '68c575f3c2ff1';
const baseURL = process.env.SENDAPP_URL || 'https://app.sendapp.cloud/api';

sendappClient = axios.create({
  baseURL: baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});
```

#### Instance ID Management

```typescript
// L'Instance ID viene:
// 1. Recuperato dal database se esiste
// 2. Creato nuovo se non esiste
// 3. Salvato nel database per riutilizzo

const systemConfig = await prisma.systemConfiguration.findFirst({
  where: { key: 'whatsapp_instance_id' }
});

let instanceId = systemConfig?.value;

if (!instanceId) {
  // Crea nuova istanza
  const response = await sendappClient.get('/create_instance', {
    params: { access_token: accessToken }
  });
  
  instanceId = response.data.instance_id;
  
  // Salva nel database
  await prisma.systemConfiguration.create({
    data: {
      key: 'whatsapp_instance_id',
      value: instanceId,
      description: 'WhatsApp Instance ID from SendApp'
    }
  });
}
```

### 2. Routes (`backend/src/routes/whatsapp.routes.ts`)

Endpoints disponibili:
- `GET /api/whatsapp/status` - Verifica stato
- `POST /api/whatsapp/create-instance` - Crea istanza
- `GET /api/whatsapp/qr-code` - Genera QR
- `POST /api/whatsapp/set-status` - Imposta stato manuale
- `POST /api/whatsapp/send` - Invia messaggio
- `POST /api/whatsapp/reset` - Reset istanza

### 3. Variabili d'Ambiente

Aggiungi al file `.env`:

```env
# SendApp Configuration
SENDAPP_TOKEN=il_tuo_token_sendapp
SENDAPP_URL=https://app.sendapp.cloud/api
SENDAPP_WEBHOOK_URL=https://tuodominio.com/api/whatsapp/webhook
```

---

## 📡 API ENDPOINTS

### GET /api/whatsapp/status

Restituisce lo stato della connessione.

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "configured": true,
    "instanceId": "68C67956807C8",
    "accessToken": "68c575f3c2ff1",
    "message": "✅ WhatsApp CONNESSO",
    "lastCheck": "2025-09-14T15:00:00.000Z"
  }
}
```

### POST /api/whatsapp/send

Invia un messaggio WhatsApp.

**Request:**
```json
{
  "phoneNumber": "393331234567",
  "message": "Ciao! Questo è un messaggio di test",
  "mediaUrl": "https://example.com/image.jpg",  // opzionale
  "filename": "documento.pdf"  // opzionale per documenti
}
```

### GET /api/whatsapp/qr-code

Genera il QR code per connettere WhatsApp.

**Response:**
```json
{
  "success": true,
  "data": {
    "base64": "data:image/png;base64,..."
  }
}
```

### POST /api/whatsapp/set-status

Imposta manualmente lo stato di connessione.

**Request:**
```json
{
  "connected": true
}
```

---

## 🖥️ CONFIGURAZIONE FRONTEND

### Componente WhatsAppManager

Path: `src/components/admin/whatsapp/WhatsAppManagerV2.tsx`

#### Configurazione API Client

```typescript
// ⚠️ IMPORTANTE: L'API client ha già /api nel baseURL
import { api } from '@/services/api';

// ✅ CORRETTO
api.get('/whatsapp/status')

// ❌ SBAGLIATO - Risulterebbe in /api/api/whatsapp/status
api.get('/api/whatsapp/status')
```

#### Gestione Stato

```typescript
// Verifica stato ogni 5 secondi
const { data: status, refetch: refetchStatus } = useQuery({
  queryKey: ['whatsapp-status'],
  queryFn: () => api.get('/whatsapp/status'),
  refetchInterval: 5000
});
```

---

## 📱 UTILIZZO DEL SISTEMA

### 1. Prima Configurazione

1. **Accedi come Admin** al sistema
2. **Vai a** `/admin/whatsapp`
3. **Clicca** "Crea Istanza" (se necessario)
4. **Clicca** "Genera QR Code"
5. **Scansiona** il QR con WhatsApp
6. **Clicca** "Imposta come CONNESSO"

### 2. Invio Messaggi

```javascript
// Esempio invio messaggio testo
await api.post('/whatsapp/send', {
  phoneNumber: '393331234567',
  message: 'Ciao! Messaggio dal sistema'
});

// Esempio invio media
await api.post('/whatsapp/send', {
  phoneNumber: '393331234567',
  message: 'Ecco il documento richiesto',
  mediaUrl: 'https://example.com/documento.pdf',
  filename: 'preventivo.pdf'
});
```

### 3. Verifica Stato

Lo stato viene salvato nel database e persiste tra:
- Ricaricamenti pagina
- Riavvii server
- Sessioni diverse

---

## 🔍 RISOLUZIONE PROBLEMI

### Errore: "Cannot read properties of undefined"

**Causa**: Tabella `SystemConfiguration` mancante  
**Soluzione**:
```bash
cd backend
npx prisma generate
npx prisma db push
```

### Errore: "Instance ID non valido"

**Causa**: Instance ID vecchio o non valido  
**Soluzione**:
1. Clicca "Reset Istanza"
2. Clicca "Crea Istanza"
3. Genera nuovo QR Code

### QR Code non appare

**Verifiche**:
1. Token SendApp corretto
2. Instance ID valido
3. Connessione internet attiva
4. Console browser per errori JS

### Stato sempre "Non Connesso"

**Nota**: SendApp non fornisce endpoint per verificare lo stato reale.  
**Soluzione**: Usa i pulsanti manuali per aggiornare lo stato dopo la scansione QR.

---

## 🔒 SICUREZZA

### Best Practices

1. **NON committare** token e credenziali nel repository
2. **Usa variabili d'ambiente** per configurazioni sensibili
3. **Limita accesso** alle API WhatsApp solo ad admin
4. **Valida sempre** i numeri di telefono prima dell'invio
5. **Implementa rate limiting** per prevenire abusi

### Esempio Validazione

```typescript
function validatePhoneNumber(phone: string): boolean {
  // Rimuovi spazi e caratteri speciali
  const cleaned = phone.replace(/\D/g, '');
  
  // Verifica lunghezza (minimo 10 cifre)
  if (cleaned.length < 10) return false;
  
  // Verifica prefisso italiano (39)
  if (!cleaned.startsWith('39')) return false;
  
  return true;
}
```

---

## 🚀 FUNZIONALITÀ FUTURE

### Pianificate
- [ ] Ricezione messaggi via webhook
- [ ] Gestione contatti
- [ ] Template messaggi
- [ ] Schedulazione invii
- [ ] Statistiche dettagliate
- [ ] Backup conversazioni

### Webhook per Ricezione

Quando implementato, configurare:
```javascript
await api.post('/whatsapp/set-webhook', {
  webhookUrl: 'https://tuodominio.com/api/whatsapp/webhook'
});
```

---

## 📝 CHECKLIST CONFIGURAZIONE

Prima del deploy in produzione:

- [ ] Token SendApp in variabile d'ambiente
- [ ] Database con tabella SystemConfiguration
- [ ] Permessi admin per accesso WhatsApp
- [ ] SSL/HTTPS per webhook (quando implementato)
- [ ] Backup database configurato
- [ ] Monitoring errori attivo
- [ ] Rate limiting configurato
- [ ] Log audit per messaggi inviati

---

## 🆘 SUPPORTO

### Contatti
- **SendApp Support**: https://app.sendapp.cloud/support
- **Team Sviluppo**: lucamambelli@lmtecnologie.it

### Log
I log del sistema si trovano in:
- Backend: `backend/logs/`
- Frontend: Console browser (F12)

### Debug Mode
Per attivare log dettagliati:
```env
DEBUG=whatsapp:*
LOG_LEVEL=debug
```

---

**NOTA IMPORTANTE**: Questo sistema usa lo stato manuale per la connessione WhatsApp perché SendApp non fornisce un endpoint per verificare lo stato in tempo reale. Dopo aver scansionato il QR Code, è necessario cliccare manualmente su "Imposta come CONNESSO".

---

**Documento creato il**: 14 Settembre 2025  
**Ultima revisione**: 14 Settembre 2025  
**Versione**: 1.0.0