# 📱 SISTEMA WHATSAPP BUSINESS - DOCUMENTAZIONE COMPLETA

**Versione**: 1.0.0  
**Data Ultimo Aggiornamento**: 10 Gennaio 2025  
**Stato**: ✅ Completamente Operativo

---

## 📑 INDICE

1. [Panoramica Sistema](#panoramica-sistema)
2. [Architettura Tecnica](#architettura-tecnica)
3. [API Backend - Endpoints](#api-backend---endpoints)
4. [Frontend - Interfaccia Admin](#frontend---interfaccia-admin)
5. [Configurazione](#configurazione)
6. [Guida Operativa](#guida-operativa)
7. [Troubleshooting](#troubleshooting)
8. [Roadmap e Sviluppi Futuri](#roadmap-e-sviluppi-futuri)

---

## 🌟 PANORAMICA SISTEMA

### Descrizione
Il **Sistema WhatsApp Business** è un modulo completamente integrato nel sistema di Richiesta Assistenza che permette l'invio e la ricezione di messaggi WhatsApp tramite l'integrazione con **Evolution API**.

### Funzionalità Principali

✅ **Gestione Istanze WhatsApp**
- Creazione e configurazione istanze
- Connessione tramite QR Code o codice accoppiamento
- Gestione multi-istanza
- Monitoraggio stato connessione in tempo reale

✅ **Invio Messaggi**
- Invio messaggi di testo
- Formattazione automatica numeri italiani
- Templates predefiniti
- Delay configurabile per simulare digitazione umana
- Supporto per link preview

✅ **Ricezione Messaggi** (tramite Webhook)
- Configurazione webhook personalizzabile
- Filtro eventi
- Gestione messaggi in arrivo
- Notifiche real-time

✅ **Gestione Profilo**
- Visualizzazione profilo WhatsApp connesso
- Recupero informazioni profili esterni
- Visualizzazione numero e nome profilo

✅ **Configurazione Avanzata**
- Impostazioni comportamento istanza
- Gestione chiamate automatica
- Lettura automatica messaggi
- Sincronizzazione cronologia

---

## 🏗️ ARCHITETTURA TECNICA

### Stack Tecnologico

#### Backend
- **Node.js** + **TypeScript**
- **Express.js** per API REST
- **Prisma** ORM per database
- **Evolution API** come provider WhatsApp
- **Axios** per chiamate HTTP

#### Frontend
- **React** 18.3.1
- **TypeScript**
- **TailwindCSS** per styling
- **React Query** per gestione stato server
- **React Hot Toast** per notifiche

### Provider WhatsApp
- **Evolution API** v2.0
- **Baileys** come motore WhatsApp
- Supporto multi-device
- Self-hosted su http://37.27.89.35:8080

### Flusso Dati

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Frontend  │────►│   Backend    │────►│ Evolution API │
│   (React)   │◄────│   (Express)  │◄────│   (Baileys)   │
└─────────────┘     └──────────────┘     └───────────────┘
                            │                      │
                            ▼                      ▼
                     ┌──────────┐          ┌─────────────┐
                     │ Database │          │  WhatsApp   │
                     │(Postgres)│          │   Server    │
                     └──────────┘          └─────────────┘
```

---

## 🔌 API BACKEND - ENDPOINTS

### Base URL
```
http://localhost:3200/api/whatsapp
```

### Autenticazione
Tutti gli endpoint richiedono autenticazione JWT nel header:
```
Authorization: Bearer <token>
```

### 📋 Endpoints Disponibili

#### 1. **GET /status**
Verifica lo stato della connessione WhatsApp.

**Risposta:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "provider": "evolution",
    "url": "http://37.27.89.35:8080",
    "instance": "assistenza",
    "state": "open",
    "phoneNumber": "393517935661",
    "profileName": "Medicina Ravenna",
    "message": "WhatsApp connesso - 393517935661"
  }
}
```

#### 2. **GET /info**
Ottiene informazioni sull'API Evolution.

**Risposta:**
```json
{
  "success": true,
  "data": {
    "status": 200,
    "message": "Welcome to the Evolution API",
    "version": "1.7.4",
    "manager": "http://37.27.89.35:8080/manager",
    "documentation": "https://doc.evolution-api.com"
  }
}
```

#### 3. **POST /instance/create**
Crea una nuova istanza WhatsApp.

**Body:**
```json
{
  "instanceName": "assistenza",
  "integration": "WHATSAPP-BAILEYS",
  "qrcode": true,
  "alwaysOnline": true,
  "readMessages": true,
  "readStatus": true
}
```

#### 4. **GET /qrcode**
Genera QR code per connessione WhatsApp.

**Risposta:**
```json
{
  "success": true,
  "data": {
    "qrcode": "data:image/png;base64,...",
    "code": "2@...",
    "instance": "assistenza"
  }
}
```

#### 5. **GET /connect/{instance}**
Connette WhatsApp tramite numero telefono.

**Query Parameters:**
- `number`: Numero di telefono con prefisso internazionale

**Risposta:**
```json
{
  "pairingCode": "WZYEH1YY",
  "code": "2@...",
  "count": 1
}
```

#### 6. **PUT /restart/{instance}**
Riavvia l'istanza WhatsApp.

**Risposta:**
```json
{
  "success": true,
  "data": {
    "instanceName": "assistenza",
    "state": "open"
  }
}
```

#### 7. **DELETE /logout/{instance}**
Disconnette WhatsApp dall'istanza.

#### 8. **DELETE /instance**
Elimina completamente l'istanza.

#### 9. **GET /instances**
Lista tutte le istanze disponibili.

**Risposta:**
```json
{
  "success": true,
  "data": {
    "instances": [
      {
        "instanceName": "assistenza",
        "instanceId": "uuid",
        "owner": "393517935661@s.whatsapp.net",
        "profileName": "Medicina Ravenna",
        "status": "open",
        "state": "open"
      }
    ]
  }
}
```

#### 10. **POST /send**
Invia un messaggio WhatsApp.

**Body:**
```json
{
  "recipient": "393331234567",
  "message": "Testo del messaggio",
  "delay": 1000
}
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "sent": true,
    "messageId": "BAE594145F4C59B4",
    "recipient": "393331234567",
    "status": "PENDING",
    "timestamp": "1717689097"
  },
  "message": "Message sent successfully"
}
```

#### 11. **POST /check-number**
Verifica se un numero è registrato su WhatsApp.

**Body:**
```json
{
  "number": "393331234567"
}
```

**Risposta:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "number": "393331234567",
    "jid": "393331234567@s.whatsapp.net",
    "connected": true
  }
}
```

#### 12. **GET /verify-connection**
Verifica connessione usando metodo affidabile.

**Risposta:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "method": "number_check",
    "message": "WhatsApp connesso e operativo"
  }
}
```

#### 13. **GET /settings**
Ottiene le impostazioni dell'istanza.

**Risposta:**
```json
{
  "success": true,
  "data": {
    "reject_call": false,
    "msg_call": "",
    "groups_ignore": false,
    "always_online": true,
    "read_messages": true,
    "read_status": true,
    "sync_full_history": false
  }
}
```

#### 14. **POST /settings**
Aggiorna le impostazioni dell'istanza.

**Body:**
```json
{
  "rejectCall": false,
  "msgCall": "Chiamata rifiutata automaticamente",
  "groupsIgnore": false,
  "alwaysOnline": true,
  "readMessages": true,
  "readStatus": true,
  "syncFullHistory": false
}
```

#### 15. **GET /webhook**
Ottiene configurazione webhook.

#### 16. **POST /webhook**
Configura webhook per ricezione eventi.

**Body:**
```json
{
  "enabled": true,
  "url": "https://tuodominio.com/webhook",
  "webhookByEvents": true,
  "webhookBase64": true,
  "events": [
    "MESSAGES_UPSERT",
    "MESSAGES_UPDATE",
    "CONNECTION_UPDATE"
  ]
}
```

#### 17. **GET /profile/me**
Ottiene il profilo WhatsApp corrente.

**Risposta:**
```json
{
  "success": true,
  "data": {
    "name": "Medicina Ravenna",
    "status": "Available",
    "pictureUrl": "https://...",
    "number": "393517935661",
    "instanceName": "assistenza"
  }
}
```

#### 18. **POST /profile/fetch**
Ottiene profilo di un numero specifico.

**Body:**
```json
{
  "number": "393331234567"
}
```

#### 19. **POST /webhook/:instance**
Endpoint per ricevere eventi da Evolution API.

---

## 💻 FRONTEND - INTERFACCIA ADMIN

### Percorso
```
http://localhost:5193/admin/whatsapp
```

### Componenti Principali

#### 1. **Header**
Mostra sempre:
- Nome sistema: "WhatsApp Business"
- Istanza corrente (es: "assistenza")
- Numero connesso (quando online): Badge verde con numero
- Nome profilo (es: "Medicina Ravenna")
- Pulsante Aggiorna stato

#### 2. **Tab Sistema**

##### Tab 1: Stato Connessione
- **Informazioni Istanza**: Nome, stato, provider, URL server
- **Stato Visivo**: 
  - ✅ Verde: Connesso
  - 🟡 Giallo: In connessione
  - 🔴 Rosso: Disconnesso
- **QR Code/Pairing Code**: Per connessione iniziale
- **Azioni Rapide**: Riavvia istanza, genera QR

##### Tab 2: Gestione Istanza
- **Genera QR Code**: Bottone per nuova connessione
- **Connetti con Numero**: Input per numero telefono
- **Lista Istanze**: Visualizzazione tutte le istanze
  - Nome istanza
  - Numero proprietario
  - Stato (open/close)
  - Token API (copiabile)
- **Azioni Pericolose**:
  - Disconnetti WhatsApp
  - Elimina Istanza

##### Tab 3: Invia Messaggio
**Form Base:**
- **Numero Destinatario**: Input con validazione
- **Messaggio**: Textarea (max 4096 caratteri)
- **Ritardo**: Delay in millisecondi
- **Pulsante Invio**: Con stato loading

**Opzioni Avanzate:**
- Tipo messaggio (testo, immagine, documento, etc.)
- Menzioni per gruppi
- Opzioni (effimero, broadcast, link preview)
- Templates predefiniti:
  - Benvenuto
  - Conferma Appuntamento
  - Richiesta Ricevuta
  - Tecnico in Arrivo

**Test Multipli:**
- Area per inserire più numeri
- Invio massivo stesso messaggio

##### Tab 4: Info Sistema
**Informazioni API:**
- Versione Evolution API
- Stato servizio
- Link Manager
- Link Documentazione

**Funzionalità Disponibili:**
- Lista features attive con checkmark

**Configurazione Istanza:**
- Checkboxes per:
  - Sempre Online
  - Leggi Messaggi
  - Mostra Stato Lettura
  - Rifiuta Chiamate
  - Ignora Gruppi
  - Sincronizza Storia Completa
- Messaggio rifiuto chiamate (input)
- Pulsante salva configurazione

**Configurazione Webhook:**
- URL webhook
- Eventi da ricevere (checkboxes)
- Header Authorization
- Content-Type
- Opzioni (eventi separati, base64 media)
- Abilitazione webhook

### Stati Visuali

#### Connesso
```
🟢 WhatsApp Connesso
📱 393517935661 • Medicina Ravenna
✅ Il sistema è connesso e pronto per inviare messaggi
```

#### Disconnesso
```
🔴 WhatsApp Non Connesso
⚠️ Clicca su "Genera QR" per connettere WhatsApp
```

#### In Connessione
```
🟡 Connessione in corso...
⏳ Scansiona il QR code con WhatsApp
```

### Bottoni di Emergenza
Se lo stato non si sincronizza correttamente:

1. **Verifica Connessione (Metodo Affidabile)**
   - Usa il metodo `whatsappNumbers` per verificare
   - Più affidabile di `connectionState`

2. **Riavvia e Verifica**
   - Riavvia l'istanza Evolution
   - Attende 5 secondi
   - Verifica automaticamente

3. **Forza Stato Connesso (Temporaneo)**
   - Imposta manualmente lo stato come connesso
   - Utile per testing immediato
   - Si resetta al refresh

---

## ⚙️ CONFIGURAZIONE

### File di Configurazione Database

Le configurazioni WhatsApp sono salvate nella tabella `SystemConfig`:

```sql
-- Configurazione Evolution API
key: 'whatsapp_evolution_url'
value: 'http://37.27.89.35:8080'

key: 'whatsapp_evolution_apikey'
value: 'B6B615D7C87B2C8H-8CAC-BD4D-AJ97-F2JBE638G78D'

key: 'whatsapp_evolution_instance'
value: 'assistenza'
```

### Variabili d'Ambiente (.env)

```env
# WhatsApp Evolution API (opzionale se configurato nel DB)
EVOLUTION_API_URL=http://37.27.89.35:8080
EVOLUTION_API_KEY=B6B615D7C87B2C8H-8CAC-BD4D-AJ97-F2JBE638G78D
EVOLUTION_INSTANCE=assistenza
```

### Schema Database (Prisma)

```prisma
model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   @db.Text
  category  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model WhatsAppMessage {
  id           String   @id @default(cuid())
  instanceName String
  messageId    String   @unique
  remoteJid    String
  fromMe       Boolean  @default(false)
  recipient    String?
  sender       String?
  message      String   @db.Text
  mediaUrl     String?
  mediaType    String?
  status       String?
  timestamp    DateTime
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@index([instanceName])
  @@index([remoteJid])
  @@index([timestamp])
}
```

---

## 📖 GUIDA OPERATIVA

### Prima Configurazione

#### 1. Verifica Configurazione Database
```sql
-- Verifica configurazioni
SELECT * FROM "SystemConfig" WHERE key LIKE 'whatsapp_%';
```

#### 2. Avvia Backend
```bash
cd backend
npm run dev
# Backend disponibile su http://localhost:3200
```

#### 3. Avvia Frontend
```bash
npm run dev
# Frontend disponibile su http://localhost:5193
```

#### 4. Accedi all'Admin
- Vai a: http://localhost:5193/admin/whatsapp
- Effettua login con credenziali admin

#### 5. Crea/Verifica Istanza
- Se non esiste istanza, viene creata automaticamente "assistenza"
- Verifica stato nella tab "Stato Connessione"

#### 6. Connetti WhatsApp
**Metodo 1: QR Code**
1. Clicca "Genera QR Code" nella tab "Gestione Istanza"
2. Apri WhatsApp sul telefono
3. Vai in Impostazioni → Dispositivi collegati → Collega dispositivo
4. Scansiona il QR code

**Metodo 2: Codice Accoppiamento**
1. Inserisci numero telefono nel campo
2. Clicca "Connetti"
3. Inserisci il codice mostrato su WhatsApp

#### 7. Verifica Connessione
- Badge verde con numero nell'header
- Stato "Connesso" in verde
- Check verde nella tab stato

### Invio Messaggi

#### Invio Singolo
1. Vai alla tab "Invia Messaggio"
2. Inserisci numero (es: 3331234567)
3. Scrivi messaggio
4. (Opzionale) Imposta delay
5. Clicca "Invia Messaggio"

#### Invio con Template
1. Seleziona template dal menu a tendina
2. Modifica il testo se necessario
3. Inserisci numero destinatario
4. Invia

#### Invio Multiplo (Test)
1. Inserisci numeri uno per riga nell'area test
2. Scrivi messaggio comune
3. Clicca "Invia a Tutti"

### Configurazione Webhook

Per ricevere messaggi:

1. Vai alla tab "Info Sistema"
2. Scorri a "Configurazione Webhook"
3. Inserisci URL del tuo server (es: https://tuodominio.com/api/whatsapp/webhook/assistenza)
4. Seleziona eventi da ricevere:
   - MESSAGES_UPSERT (nuovi messaggi)
   - MESSAGES_UPDATE (aggiornamenti messaggi)
   - CONNECTION_UPDATE (stato connessione)
5. Abilita webhook con checkbox
6. Clicca "Configura Webhook"

### Gestione Impostazioni

1. Tab "Info Sistema" → "Configurazione Istanza"
2. Modifica le opzioni desiderate:
   - **Sempre Online**: WhatsApp sempre online
   - **Leggi Messaggi**: Invia conferme lettura
   - **Rifiuta Chiamate**: Rifiuta automaticamente
   - **Ignora Gruppi**: Non riceve messaggi gruppi
3. Clicca "Salva Configurazione"

---

## 🔧 TROUBLESHOOTING

### Problema: Stato "Connecting" persistente

**Sintomo:** WhatsApp connesso su Evolution ma mostra "connecting" nell'admin

**Soluzioni:**
1. Clicca "Verifica Connessione (Metodo Affidabile)"
2. Se non funziona, "Riavvia e Verifica"
3. Come ultima risorsa, "Forza Stato Connesso"

### Problema: QR Code non si genera

**Sintomo:** Errore nel generare QR code

**Soluzioni:**
1. Verifica che l'istanza esista
2. Controlla logs backend per errori Evolution API
3. Verifica connettività con Evolution API:
```bash
curl http://37.27.89.35:8080/instance/connectionState/assistenza \
  -H "apikey: B6B615D7C87B2C8H-8CAC-BD4D-AJ97-F2JBE638G78D"
```

### Problema: Messaggi non si inviano

**Sintomo:** Errore nell'invio messaggi

**Verifiche:**
1. WhatsApp è connesso? (badge verde)
2. Numero ha prefisso corretto? (+39 per Italia)
3. Messaggio non supera 4096 caratteri?
4. Controlla logs per errori specifici

### Problema: Webhook non riceve eventi

**Verifiche:**
1. URL webhook è pubblicamente accessibile?
2. Eventi sono selezionati nella configurazione?
3. Webhook è abilitato?
4. Verifica logs Evolution API

### Problema: Istanza non si crea

**Sintomo:** Errore creazione istanza

**Soluzioni:**
1. Verifica che il nome non sia già in uso
2. Controlla API key Evolution sia valida
3. Verifica spazio disponibile su server Evolution

### Logs Utili

**Backend Logs:**
```bash
# Vedi tutti i log WhatsApp
tail -f logs/application.log | grep -i whatsapp

# Vedi errori
tail -f logs/error.log | grep -i whatsapp
```

**Evolution API Logs:**
Accedi a http://37.27.89.35:8080/manager con le credenziali

---

## 🚀 ROADMAP E SVILUPPI FUTURI

### ✅ Completato (v1.0)
- [x] Integrazione base Evolution API
- [x] Invio messaggi testo
- [x] Gestione istanze
- [x] Configurazione webhook
- [x] Verifica numeri WhatsApp
- [x] UI admin completa
- [x] Sistema di verifica connessione affidabile

### 🔄 In Sviluppo (v1.1)
- [ ] Invio media (immagini, documenti, audio, video)
- [ ] Gestione gruppi WhatsApp
- [ ] Broadcast lists
- [ ] Templates con variabili dinamiche

### 📅 Pianificato (v1.2)
- [ ] Ricezione e gestione messaggi in arrivo
- [ ] Chat interface nel frontend
- [ ] Integrazione con richieste assistenza
- [ ] Auto-risponder configurabile
- [ ] Statistiche messaggi

### 🎯 Futuro (v2.0)
- [ ] Multi-account management
- [ ] Campagne marketing via WhatsApp
- [ ] Chatbot AI integrato
- [ ] Analytics avanzate
- [ ] Backup conversazioni
- [ ] Export chat in PDF

### Integrazioni Future
- [ ] Integrazione CRM
- [ ] Webhook per notifiche real-time
- [ ] API pubblica per sviluppatori
- [ ] Plugin WordPress/WooCommerce
- [ ] App mobile dedicata

---

## 📞 SUPPORTO

Per assistenza sul sistema WhatsApp:

**Email:** supporto@lmtecnologie.it  
**Documentazione Evolution API:** https://doc.evolution-api.com  
**GitHub Progetto:** https://github.com/241luca/Richiesta-Assistenza

---

## 📝 NOTE DI VERSIONE

### v1.0.0 - 10 Gennaio 2025
- Prima release completa sistema WhatsApp
- Integrazione Evolution API
- UI admin completa
- Sistema invio messaggi
- Verifica connessione affidabile
- Gestione profili
- Configurazione webhook
- Templates messaggi

---

**Fine Documento**

Ultimo aggiornamento: 10 Gennaio 2025  
Autore: Team Sviluppo LM Tecnologie
