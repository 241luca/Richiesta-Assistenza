# 📱 DOCUMENTAZIONE WHATSAPP WPPCONNECT
**Versione**: 1.0.0  
**Data**: 24 Settembre 2025  
**Stato**: ✅ Production Ready

---

## 📋 INDICE

1. [Panoramica](#1-panoramica)
2. [Architettura Sistema](#2-architettura-sistema)
3. [Configurazione](#3-configurazione)
4. [API Endpoints](#4-api-endpoints)
5. [Componenti Frontend](#5-componenti-frontend)
6. [Database Schema](#6-database-schema)
7. [Servizi Backend](#7-servizi-backend)
8. [Gestione Sessione](#8-gestione-sessione)
9. [Troubleshooting](#9-troubleshooting)
10. [Best Practices](#10-best-practices)

---

## 1. PANORAMICA

### 🎯 Descrizione
Il sistema WhatsApp del progetto Richiesta Assistenza utilizza **WPPConnect** come provider principale per l'integrazione con WhatsApp Web. Permette l'invio e la ricezione di messaggi, gestione contatti e template messaggi.

### 🔧 Stack Tecnologico
- **Backend**: Node.js + Express + TypeScript
- **WhatsApp Library**: @wppconnect-team/wppconnect
- **Database**: PostgreSQL con Prisma ORM
- **Frontend**: React + TypeScript + TanStack Query
- **Real-time**: Socket.io per aggiornamenti live

### ✨ Funzionalità Principali
- ✅ Connessione WhatsApp Web tramite QR Code
- ✅ Invio/ricezione messaggi
- ✅ Gestione contatti
- ✅ Template messaggi
- ✅ Invio massivo (bulk)
- ✅ Validazione numeri telefono
- ✅ Sistema di error handling avanzato
- ✅ Dashboard amministrativa completa
- ✅ Persistenza sessione

---

## 2. ARCHITETTURA SISTEMA

### 🏗️ Struttura Generale

```
┌─────────────────────────────────────────────────┐
│                   FRONTEND                       │
│  ┌──────────────────────────────────────────┐   │
│  │  WhatsAppWPPManager.tsx (Main Component) │   │
│  │  ├── WhatsAppConnection.tsx              │   │
│  │  ├── WhatsAppMessages.tsx                │   │
│  │  ├── WhatsAppContacts.tsx                │   │
│  │  └── WhatsAppTemplates.tsx               │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                        ↕ API
┌─────────────────────────────────────────────────┐
│                   BACKEND                        │
│  ┌──────────────────────────────────────────┐   │
│  │  whatsapp.routes.ts (API Endpoints)      │   │
│  │         ↓                                 │   │
│  │  wppconnect.service.ts (Business Logic)  │   │
│  │         ↓                                 │   │
│  │  WPPConnect Library                       │   │
│  │         ↓                                 │   │
│  │  WhatsApp Web                             │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────┐
│                  DATABASE                        │
│  ┌──────────────────────────────────────────┐   │
│  │  WhatsAppMessage                         │   │
│  │  WhatsAppContact                         │   │
│  │  WhatsAppTemplate                        │   │
│  │  SystemSetting (per config)              │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 3. CONFIGURAZIONE

### 🔐 Variabili Ambiente (.env)

```bash
# Backend .env
# ===== WHATSAPP CONFIGURATION (WPPCONNECT) =====
WHATSAPP_PROVIDER=wppconnect
WPPCONNECT_SESSION_NAME=assistenza
WPPCONNECT_AUTO_CLOSE=false
WPPCONNECT_HEADLESS=false  # false per vedere browser durante debug
```

### 📦 Dipendenze NPM

```json
{
  "dependencies": {
    "@wppconnect-team/wppconnect": "^1.32.0",
    "qrcode": "^1.5.3",
    "sharp": "^0.33.0"
  }
}
```

### 🗂️ Struttura File

```
backend/
├── src/
│   ├── routes/
│   │   └── whatsapp.routes.ts          # Tutti gli endpoint API
│   ├── services/
│   │   ├── wppconnect.service.ts       # Servizio principale
│   │   ├── whatsapp-validation.service.ts  # Validazione numeri
│   │   ├── whatsapp-template.service.ts    # Gestione template
│   │   └── whatsapp-error-handler.service.ts # Error handling
│   └── types/
│       └── whatsapp.types.ts           # TypeScript types
├── tokens/                              # Directory sessioni WhatsApp
│   └── assistenza/                     # Sessione salvata
└── prisma/
    └── schema.prisma                    # Schema database
```

---

## 4. API ENDPOINTS

### 📡 Endpoints Disponibili

#### Gestione Connessione

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| GET | `/api/whatsapp/status` | Stato connessione | ✅ |
| POST | `/api/whatsapp/initialize` | Inizializza sessione | ✅ Admin |
| GET | `/api/whatsapp/qrcode` | Ottieni QR Code | ✅ |
| POST | `/api/whatsapp/disconnect` | Disconnetti sessione | ✅ Admin |
| POST | `/api/whatsapp/reconnect` | Riconnetti sessione | ✅ Admin |

#### Messaggistica

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| POST | `/api/whatsapp/send` | Invia messaggio | ✅ |
| POST | `/api/whatsapp/send-bulk` | Invio multiplo | ✅ Admin |
| GET | `/api/whatsapp/messages` | Lista messaggi | ✅ |
| GET | `/api/whatsapp/messages/:phoneNumber` | Messaggi di un numero | ✅ |
| POST | `/api/whatsapp/messages/:id/read` | Segna come letto | ✅ |

#### Template

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| GET | `/api/whatsapp/templates` | Lista template | ✅ |
| POST | `/api/whatsapp/templates` | Crea template | ✅ Admin |
| PUT | `/api/whatsapp/templates/:id` | Aggiorna template | ✅ Admin |
| DELETE | `/api/whatsapp/templates/:id` | Elimina template | ✅ Admin |
| POST | `/api/whatsapp/templates/:id/send` | Invia da template | ✅ |
| POST | `/api/whatsapp/templates/:id/send-bulk` | Invio bulk da template | ✅ Admin |
| POST | `/api/whatsapp/templates/:id/clone` | Clona template | ✅ Admin |

#### Validazione

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| POST | `/api/whatsapp/validate-number` | Valida singolo numero | ✅ |
| POST | `/api/whatsapp/validate-batch` | Valida multipli numeri | ✅ |
| POST | `/api/whatsapp/extract-numbers` | Estrai numeri da testo | ✅ |

#### Statistiche e Info

| Metodo | Endpoint | Descrizione | Autenticazione |
|--------|----------|-------------|----------------|
| GET | `/api/whatsapp/stats` | Statistiche generali | ✅ |
| GET | `/api/whatsapp/system-info` | Info sistema | ✅ |
| GET | `/api/whatsapp/detailed-stats` | Statistiche dettagliate | ✅ |
| GET | `/api/whatsapp/error-stats` | Statistiche errori | ✅ Admin |
| POST | `/api/whatsapp/error-stats/reset` | Reset contatori errori | ✅ SuperAdmin |

### 📝 Esempi di Utilizzo

#### Invio Messaggio Semplice
```javascript
// POST /api/whatsapp/send
{
  "phoneNumber": "3931234567",  // o "recipient"
  "message": "Ciao, questo è un messaggio di test"
}

// Response
{
  "success": true,
  "data": {
    "messageId": "true_39...",
    "status": "SENT"
  },
  "message": "Messaggio inviato con successo"
}
```

#### Invio Bulk
```javascript
// POST /api/whatsapp/send-bulk
{
  "recipients": ["3931234567", "3939876543"],
  "message": "Messaggio a tutti"
}

// Response
{
  "success": true,
  "data": {
    "sent": ["3931234567", "3939876543"],
    "failed": [],
    "invalid": []
  }
}
```

#### Validazione Numero
```javascript
// POST /api/whatsapp/validate-number
{
  "number": "393 123 4567",
  "country": "IT"
}

// Response
{
  "success": true,
  "data": {
    "isValid": true,
    "formatted": "393931234567",
    "country": "IT",
    "hasWhatsApp": true,
    "displayFormat": "+39 393 123 4567"
  }
}
```

---

## 5. COMPONENTI FRONTEND

### 🎨 Componente Principale: WhatsAppWPPManager

#### Struttura Tab
1. **Stato Connessione**: Mostra stato istanza e controlli
2. **QR Code**: Generazione e visualizzazione QR
3. **Invia Messaggio**: Form invio messaggi
4. **Informazioni**: Info sistema e statistiche

#### Hook React Query Utilizzati

```typescript
// Status con refresh automatico
const { data: status } = useQuery({
  queryKey: ['whatsapp', 'status'],
  queryFn: () => api.get('/whatsapp/status'),
  refetchInterval: 5000 // Ogni 5 secondi
});

// QR Code con refresh
const { data: qrData } = useQuery({
  queryKey: ['whatsapp', 'qr'],
  queryFn: () => api.get('/whatsapp/qrcode'),
  enabled: showQRCode && !status?.connected,
  refetchInterval: 3000 // Ogni 3 secondi
});

// Mutation per invio
const sendMessageMutation = useMutation({
  mutationFn: (data) => api.post('/whatsapp/send', data),
  onSuccess: () => {
    toast.success('Messaggio inviato!');
    queryClient.invalidateQueries(['whatsapp', 'stats']);
  }
});
```

### 📱 Componente WhatsAppMessages

Gestisce la visualizzazione e l'invio di messaggi con interfaccia chat-like.

**Funzionalità**:
- Lista chat raggruppate per numero
- Visualizzazione messaggi in tempo reale
- Indicatori di stato (sent, delivered, read)
- Form invio con validazione
- Ricerca messaggi

---

## 6. DATABASE SCHEMA

### 📊 Modelli Prisma

#### WhatsAppMessage
```prisma
model WhatsAppMessage {
  id          String   @id @default(cuid())
  messageId   String   @unique
  phoneNumber String
  message     String?  @db.Text
  direction   String   // 'incoming' | 'outgoing'
  status      String?  // 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'
  senderName  String?
  timestamp   DateTime @default(now())
  
  // Campi media
  mediaUrl    String?
  mediaPath   String?
  mimetype    String?
  caption     String?
  
  // Metadati
  fromMe      Boolean  @default(false)
  isGroupMsg  Boolean  @default(false)
  chatId      String?
  
  // Relazioni
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### WhatsAppContact
```prisma
model WhatsAppContact {
  id          String   @id @default(cuid())
  phoneNumber String   @unique
  name        String?
  pushname    String?
  isUser      Boolean  @default(false)
  isBusiness  Boolean  @default(false)
  isFavorite  Boolean  @default(false)
  profilePic  String?
  
  // Relazioni
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  messages    WhatsAppMessage[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### WhatsAppTemplate
```prisma
model WhatsAppTemplate {
  id          String   @id @default(cuid())
  name        String   @unique
  category    String   // 'greeting' | 'notification' | 'marketing' | 'support'
  content     String   @db.Text
  variables   Json?    // Array di variabili: [{key: 'nome', description: 'Nome cliente'}]
  isActive    Boolean  @default(true)
  usageCount  Int      @default(0)
  tags        String[]
  
  // Audit
  createdBy   String
  updatedBy   String?
  creator     User     @relation("TemplateCreator", fields: [createdBy], references: [id])
  updater     User?    @relation("TemplateUpdater", fields: [updatedBy], references: [id])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

---

## 7. SERVIZI BACKEND

### 🔧 wppconnect.service.ts

Servizio principale che gestisce l'istanza WPPConnect.

#### Metodi Principali

```typescript
class WPPConnectService {
  private client: Whatsapp | null = null;
  private sessionName = 'assistenza';
  private isInitializing = false;
  
  // Inizializzazione con gestione QR
  async initialize(): Promise<boolean> {
    if (this.isInitializing) return false;
    
    this.isInitializing = true;
    
    try {
      this.client = await create({
        session: this.sessionName,
        catchQR: (qrCode) => {
          this.currentQRCode = qrCode;
          this.emitQRCode(qrCode);
        },
        statusFind: (status) => {
          this.handleStatusChange(status);
        },
        headless: true,
        devtools: false,
        useChrome: true,
        debug: false,
        logQR: false,
        browserArgs: ['--no-sandbox'],
        autoClose: 60000,
        createPathFileToken: true,
        tokenStore: 'file'
      });
      
      return true;
    } catch (error) {
      this.isInitializing = false;
      throw error;
    }
  }
  
  // Invio messaggio con retry
  async sendMessage(to: string, message: string): Promise<any> {
    if (!this.client) throw new Error('WhatsApp non connesso');
    
    const formattedNumber = this.formatPhoneNumber(to);
    
    try {
      const result = await this.client.sendText(
        formattedNumber,
        message
      );
      
      // Salva nel database
      await this.saveMessage({
        messageId: result.id,
        phoneNumber: to,
        message,
        direction: 'outgoing',
        status: 'SENT'
      });
      
      return result;
    } catch (error) {
      // Retry logic
      if (this.shouldRetry(error)) {
        await this.delay(2000);
        return this.sendMessage(to, message);
      }
      throw error;
    }
  }
}
```

### 🔍 whatsapp-validation.service.ts

Servizio per validazione e formattazione numeri telefono.

```typescript
class WhatsAppValidationService {
  // Validazione con controllo paese
  async validatePhoneNumber(number: string, options?: {
    country?: string;
    checkWhatsApp?: boolean;
    strict?: boolean;
  }): Promise<ValidationResult> {
    const cleaned = this.cleanNumber(number);
    const country = options?.country || 'IT';
    
    // Applica prefisso paese se mancante
    let formatted = cleaned;
    if (!formatted.startsWith(this.countryPrefixes[country])) {
      formatted = this.countryPrefixes[country] + formatted;
    }
    
    // Verifica lunghezza per paese
    const expectedLength = this.getExpectedLength(country);
    if (formatted.length !== expectedLength) {
      return {
        isValid: false,
        error: `Numero deve essere di ${expectedLength} cifre per ${country}`,
        formatted
      };
    }
    
    // Check WhatsApp se richiesto
    if (options?.checkWhatsApp && this.wppService.client) {
      const hasWhatsApp = await this.checkWhatsApp(formatted);
      return {
        isValid: true,
        formatted,
        country,
        hasWhatsApp
      };
    }
    
    return { isValid: true, formatted, country };
  }
}
```

### 📝 whatsapp-template.service.ts

Gestione template messaggi con variabili.

```typescript
class WhatsAppTemplateService {
  // Invio da template con sostituzione variabili
  async sendFromTemplate(
    templateId: string,
    to: string,
    variables?: Record<string, string>,
    userId?: string
  ): Promise<any> {
    const template = await this.getTemplate(templateId);
    if (!template) throw new Error('Template non trovato');
    
    // Sostituisci variabili nel contenuto
    let content = template.content;
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        content = content.replace(
          new RegExp(`{{${key}}}`, 'g'),
          value
        );
      }
    }
    
    // Valida che non ci siano variabili non sostituite
    const unreplaced = content.match(/{{.*?}}/g);
    if (unreplaced) {
      throw new Error(`Variabili mancanti: ${unreplaced.join(', ')}`);
    }
    
    // Invia messaggio
    const result = await this.wppService.sendMessage(to, content);
    
    // Incrementa contatore utilizzo
    await this.incrementUsage(templateId);
    
    return result;
  }
}
```

### 🚨 whatsapp-error-handler.service.ts

Sistema avanzato di gestione errori.

```typescript
enum WhatsAppErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_NUMBER = 'INVALID_NUMBER',
  NOT_WHATSAPP = 'NOT_WHATSAPP',
  BLOCKED = 'BLOCKED',
  UNKNOWN = 'UNKNOWN'
}

class WhatsAppErrorHandler {
  private errorCounts = new Map<string, number>();
  
  async handleError(error: any, context: string): Promise<WhatsAppError> {
    const errorType = this.identifyErrorType(error);
    
    // Incrementa contatore
    this.incrementErrorCount(errorType);
    
    // Log strutturato
    logger.error(`WhatsApp Error [${context}]`, {
      type: errorType,
      message: error.message,
      stack: error.stack,
      timestamp: new Date()
    });
    
    // Determina se retry
    const shouldRetry = this.shouldRetry(errorType);
    
    // Suggerimenti per l'utente
    const suggestions = this.getSuggestions(errorType);
    
    return {
      type: errorType,
      message: error.message,
      userMessage: this.getUserMessage(errorType),
      retry: shouldRetry,
      suggestions,
      details: error.details || {}
    };
  }
  
  private identifyErrorType(error: any): WhatsAppErrorType {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('not connected') || 
        message.includes('disconnected')) {
      return WhatsAppErrorType.CONNECTION_ERROR;
    }
    
    if (message.includes('invalid number') ||
        message.includes('invalid phone')) {
      return WhatsAppErrorType.INVALID_NUMBER;
    }
    
    if (message.includes('rate limit') ||
        message.includes('too many')) {
      return WhatsAppErrorType.RATE_LIMIT;
    }
    
    if (message.includes('blocked')) {
      return WhatsAppErrorType.BLOCKED;
    }
    
    return WhatsAppErrorType.UNKNOWN;
  }
}
```

---

## 8. GESTIONE SESSIONE

### 💾 Persistenza Sessione

La sessione WhatsApp viene salvata automaticamente nella cartella `backend/tokens/assistenza/`:

```
tokens/
└── assistenza/
    ├── Default/
    │   ├── Cache/
    │   ├── Code Cache/
    │   ├── Cookies
    │   ├── Cookies-journal
    │   ├── GPUCache/
    │   ├── IndexedDB/
    │   ├── Local Storage/
    │   ├── Network/
    │   ├── Preferences
    │   ├── Service Worker/
    │   ├── Session Storage/
    │   ├── Shared Dictionary/
    │   └── WebStorage/
    └── assistenza.data.json
```

### 🔄 Ciclo di Vita Sessione

1. **Prima Connessione**
   - L'utente accede a `/admin/whatsapp`
   - Clicca su "Genera QR Code"
   - Scansiona con WhatsApp
   - La sessione viene salvata in `tokens/`

2. **Riconnessioni Successive**
   - Il sistema cerca la sessione in `tokens/assistenza/`
   - Se esiste, si riconnette automaticamente
   - Se è scaduta, genera nuovo QR

3. **Disconnessione**
   - L'utente clicca "Disconnetti"
   - La sessione viene terminata ma i file restano
   - Per pulizia totale: eliminare cartella `tokens/assistenza/`

---

## 9. TROUBLESHOOTING

### ❌ Problemi Comuni e Soluzioni

#### 1. "WhatsApp già connesso" ma non funziona
```bash
# Soluzione: Pulire sessione e riavviare
cd backend
rm -rf tokens/assistenza
# Riavvia backend
npm run dev
```

#### 2. QR Code non appare
```javascript
// Verificare in console browser:
// 1. Controllare Network tab per /api/whatsapp/qrcode
// 2. Verificare response

// Se 404:
// - Controllare che endpoint usi /whatsapp/qrcode non /whatsapp/qr

// Se timeout:
// - Aumentare timeout in initialize()
```

#### 3. Errore "Invalid token"
```bash
# Token JWT scaduto o non valido
# Soluzione: Re-login nell'app
```

#### 4. Messaggi non si inviano
```javascript
// Verificare:
// 1. Stato connessione: /api/whatsapp/status
// 2. Formato numero: deve essere 393XXXXXXXXX per Italia
// 3. Log backend per errori specifici
```

#### 5. Errore 500 su /messages/:id/read
```javascript
// Il modello WhatsAppMessage non ha campi readAt/readBy
// Usa solo: status: 'READ'
```

### 🔍 Debug Mode

Per debug dettagliato, modificare `.env`:
```bash
WPPCONNECT_HEADLESS=false  # Mostra browser
LOG_LEVEL=debug            # Log dettagliati
```

---

## 10. BEST PRACTICES

### ✅ Raccomandazioni

#### 1. Gestione Numeri
```javascript
// SEMPRE validare prima di inviare
const validated = await whatsAppValidation.validatePhoneNumber(number, {
  country: 'IT',
  strict: true
});

if (!validated.isValid) {
  // Gestire errore
}

// Usare numero validato
await sendMessage(validated.formatted, message);
```

#### 2. Invio Bulk
```javascript
// Usa delay tra invii per evitare ban
for (const number of numbers) {
  await sendMessage(number, message);
  await delay(1000); // 1 secondo tra invii
}
```

#### 3. Gestione Errori
```javascript
// Sempre wrappare in try-catch con error handler
try {
  const result = await wppConnectService.sendMessage(to, message);
} catch (error) {
  const whatsAppError = await whatsAppErrorHandler.handleError(
    error,
    'sendMessage'
  );
  
  if (whatsAppError.retry) {
    // Retry logic
  } else {
    // Show error to user
  }
}
```

#### 4. Template con Variabili
```javascript
// Definire template con placeholder chiari
const template = `
Ciao {{nome}},
Il tuo appuntamento è confermato per {{data}} alle {{ora}}.
Indirizzo: {{indirizzo}}
`;

// Validare che tutte le variabili siano fornite
const requiredVars = ['nome', 'data', 'ora', 'indirizzo'];
const missing = requiredVars.filter(v => !variables[v]);
if (missing.length > 0) {
  throw new Error(`Variabili mancanti: ${missing.join(', ')}`);
}
```

#### 5. Monitoraggio
```javascript
// Controllare periodicamente:
- Stato connessione ogni 5 minuti
- Statistiche errori giornaliere
- Performance invio messaggi
- Spazio disco per sessioni
```

### 🚫 Da Evitare

1. **NON** inviare più di 5 messaggi al secondo
2. **NON** salvare password o dati sensibili nei messaggi
3. **NON** usare per spam o marketing non autorizzato
4. **NON** condividere la sessione tra più istanze
5. **NON** modificare manualmente i file in `tokens/`

---

## 📊 METRICHE E MONITORING

### KPI da Monitorare
- **Uptime sessione**: Target > 95%
- **Success rate invio**: Target > 98%
- **Tempo risposta API**: Target < 500ms
- **Messaggi/giorno**: Monitorare trend
- **Errori/giorno**: Alert se > 5%

### Dashboard Monitoring
Accessibile da: `/admin/whatsapp`

Mostra:
- Stato real-time connessione
- Statistiche invii (oggi/totale)
- Ultimi errori
- Performance sistema
- Grafici trend

---

## 🔐 SICUREZZA

### Misure Implementate
- ✅ Autenticazione JWT su tutti gli endpoint
- ✅ Rate limiting per prevenire abusi
- ✅ Validazione input con Zod
- ✅ Sanitizzazione messaggi
- ✅ Audit log di tutte le operazioni
- ✅ Crittografia sessione WhatsApp
- ✅ RBAC (Role-Based Access Control)

### Permessi per Ruolo

| Funzione | CLIENT | PROFESSIONAL | ADMIN | SUPER_ADMIN |
|----------|--------|--------------|-------|-------------|
| Visualizzare stato | ❌ | ✅ | ✅ | ✅ |
| Inviare messaggi | ❌ | ✅ | ✅ | ✅ |
| Invio bulk | ❌ | ❌ | ✅ | ✅ |
| Gestire connessione | ❌ | ❌ | ✅ | ✅ |
| Gestire template | ❌ | ❌ | ✅ | ✅ |
| Reset errori | ❌ | ❌ | ❌ | ✅ |

---

## 🚀 ROADMAP FUTURA

### Prossime Implementazioni
- [ ] Invio media (immagini, documenti)
- [ ] Ricezione media
- [ ] Gruppi WhatsApp
- [ ] Scheduled messages
- [ ] Webhook per eventi
- [ ] Multi-device support
- [ ] Backup automatico sessioni
- [ ] Dashboard analytics avanzata

---

## 📞 SUPPORTO

Per problemi o domande:
1. Controllare questa documentazione
2. Verificare i log in `backend/logs/`
3. Contattare il team sviluppo

---

**Documento mantenuto da**: Team Sviluppo Richiesta Assistenza  
**Ultima revisione**: 24 Settembre 2025
