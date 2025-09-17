# 🔐 Sistema di Autenticazione - Documentazione Completa

> **Ultimo aggiornamento**: 25 Agosto 2025  
> **Versione**: 2.0

## 📋 Indice

1. [Panoramica del Sistema](#panoramica-del-sistema)
2. [Come Funziona l'Autenticazione](#come-funziona-lautenticazione)
3. [Componenti Principali](#componenti-principali)
4. [Flusso di Login Passo-Passo](#flusso-di-login-passo-passo)
5. [Sistema di Token JWT](#sistema-di-token-jwt)
6. [Autenticazione WebSocket](#autenticazione-websocket)
7. [Sicurezza e Protezioni](#sicurezza-e-protezioni)
8. [Autenticazione a Due Fattori (2FA)](#autenticazione-a-due-fattori-2fa)
9. [Gestione Sessioni](#gestione-sessioni)
10. [API Endpoints](#api-endpoints)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Panoramica del Sistema

Il Sistema di Richiesta Assistenza utilizza un **sistema di autenticazione moderno e sicuro** che combina:

- 🔑 **JWT (JSON Web Tokens)** per l'autenticazione stateless
- 🔐 **Autenticazione a due fattori (2FA)** opzionale per maggiore sicurezza
- 🔌 **WebSocket autenticati** per comunicazioni in tempo reale
- 🛡️ **Sistema di protezione** contro attacchi brute force
- 📊 **Tracking delle sessioni** e storico accessi

### In Parole Semplici

Quando accedi al sistema:
1. **Inserisci email e password** → Il sistema verifica che siano corrette
2. **Ricevi dei "token" speciali** → Sono come dei pass temporanei che ti identificano
3. **I token vengono salvati nel browser** → Così non devi fare login ogni volta
4. **Ogni richiesta al server include il token** → Il server sa sempre chi sei
5. **Il WebSocket usa lo stesso token** → Per le notifiche in tempo reale

---

## 🔄 Come Funziona l'Autenticazione

### Architettura Generale

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   BROWSER   │ ──(1)── │   BACKEND   │ ──(2)── │   DATABASE   │
│   (React)   │ ←─(4)── │  (Express)  │ ←─(3)── │ (PostgreSQL) │
└─────────────┘         └─────────────┘         └──────────────┘
       │                        │
       │                        │
    ┌──▼──┐                ┌───▼───┐
    │Token│                │JWT Key│
    │Store│                │Secret │
    └─────┘                └───────┘
```

**Flusso Base:**
1. Browser invia credenziali (email + password)
2. Backend verifica nel database
3. Database conferma l'utente
4. Backend genera token e li invia al browser

### Tipi di Utenti

Il sistema supporta 4 tipi di utenti con permessi diversi:

| Ruolo | Descrizione | Permessi |
|-------|-------------|----------|
| **CLIENT** | Cliente che richiede assistenza | Creare richieste, vedere preventivi |
| **PROFESSIONAL** | Professionista che fornisce servizi | Gestire richieste assegnate, creare preventivi |
| **ADMIN** | Amministratore del sistema | Gestire utenti e richieste |
| **SUPER_ADMIN** | Super amministratore | Accesso completo al sistema |

---

## 🧩 Componenti Principali

### 1. Frontend Components

#### `AuthContext.tsx` - Gestione Stato Autenticazione
```typescript
// Percorso: src/contexts/AuthContext.tsx

// Cosa fa:
- Gestisce lo stato dell'utente loggato
- Fornisce funzioni per login/logout
- Salva i token nel localStorage
- Gestisce il refresh automatico dei token
```

#### `SocketContext.tsx` - Connessione WebSocket
```typescript
// Percorso: src/contexts/SocketContext.tsx

// Cosa fa:
- Si connette al server WebSocket usando il token
- Gestisce riconnessioni automatiche
- Invia/riceve messaggi in tempo reale
- Si disconnette quando l'utente fa logout
```

### 2. Backend Components

#### `auth.routes.ts` - Gestione Login/Registrazione
```typescript
// Percorso: backend/src/routes/auth.routes.ts

// Endpoints principali:
POST /api/auth/register  - Registrazione nuovo utente
POST /api/auth/login     - Login utente
POST /api/auth/logout    - Logout utente
POST /api/auth/refresh   - Rinnovo token
```

#### `auth.middleware.ts` - Protezione Routes
```typescript
// Percorso: backend/src/middleware/auth.ts

// Cosa fa:
- Verifica il token JWT in ogni richiesta
- Blocca accessi non autorizzati
- Aggiunge info utente alla richiesta
```

#### `socket.server.ts` - Autenticazione WebSocket
```typescript
// Percorso: backend/src/websocket/socket.server.ts

// Cosa fa:
- Autentica connessioni WebSocket
- Gestisce rooms per utenti/ruoli
- Invia notifiche in tempo reale
```

---

## 📝 Flusso di Login Passo-Passo

### 1️⃣ Utente Compila il Form

```javascript
// L'utente inserisce:
Email: mario.rossi@email.com
Password: ********
```

### 2️⃣ Frontend Invia Richiesta

```javascript
// Il browser invia al backend:
POST http://localhost:3200/api/auth/login
{
  "email": "mario.rossi@email.com",
  "password": "password123"
}
```

### 3️⃣ Backend Verifica Credenziali

```javascript
// Il server:
1. Cerca l'utente nel database per email
2. Verifica che la password sia corretta (confronta hash)
3. Controlla se l'account è bloccato
4. Verifica se serve 2FA
```

### 4️⃣ Generazione Token

```javascript
// Se tutto è OK, genera:
{
  "accessToken": "eyJhbGc...",  // Token principale (dura 7 giorni)
  "refreshToken": "eyJhbGc...", // Token di rinnovo (dura 30 giorni)
  "user": {
    "id": "uuid-123",
    "email": "mario.rossi@email.com",
    "firstName": "Mario",
    "lastName": "Rossi",
    "role": "CLIENT"
  }
}
```

### 5️⃣ Frontend Salva i Token

```javascript
// Nel browser (localStorage):
localStorage.setItem('accessToken', 'eyJhbGc...')
localStorage.setItem('refreshToken', 'eyJhbGc...')
localStorage.setItem('user', JSON.stringify(user))
```

### 6️⃣ WebSocket si Connette

```javascript
// Automaticamente dopo il login:
1. SocketContext rileva il nuovo token
2. Si connette al server WebSocket
3. Invia il token per autenticazione
4. Riceve conferma di connessione
```

---

## 🎫 Sistema di Token JWT

### Cos'è un Token JWT?

Un **JWT (JSON Web Token)** è come un **badge digitale** che contiene:
- Chi sei (ID utente)
- Quando è stato creato
- Quando scade
- Una firma digitale per verificare che sia autentico

### Struttura del Token

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1dWlkLTEyMyIsImlhdCI6MTcyNDU5MjAwMCwiZXhwIjoxNzI1MTk2ODAwfQ.signature
```

Questo token contiene 3 parti separate da punti:
1. **Header**: Tipo di token e algoritmo
2. **Payload**: Dati dell'utente (userId, scadenza)
3. **Signature**: Firma per verificare autenticità

### Come Vengono Usati i Token

```javascript
// In ogni richiesta al server:
fetch('http://localhost:3200/api/requests', {
  headers: {
    'Authorization': 'Bearer eyJhbGc...'  // Il token va qui
  }
})

// Il server verifica:
1. Il token è valido?
2. Non è scaduto?
3. La firma è corretta?
4. L'utente esiste ancora?
```

### Durata dei Token

| Tipo | Durata | Uso |
|------|--------|-----|
| **Access Token** | 7 giorni | Per tutte le richieste API |
| **Refresh Token** | 30 giorni | Per ottenere nuovi access token |

---

## 🔌 Autenticazione WebSocket

### Come Funziona

Il WebSocket permette comunicazione **bidirezionale in tempo reale** tra browser e server.

```javascript
// 1. Frontend si connette con il token
const socket = io('http://localhost:3200', {
  auth: {
    token: localStorage.getItem('accessToken')
  }
})

// 2. Backend verifica il token
async function authenticateSocket(socket, next) {
  const token = socket.handshake.auth.token
  const decoded = jwt.verify(token, JWT_SECRET)
  const user = await findUserById(decoded.userId)
  
  if (user) {
    socket.userId = user.id
    socket.userRole = user.role
    next() // Connessione autorizzata
  }
}

// 3. Connessione stabilita
socket.on('connected', (data) => {
  console.log('WebSocket connesso!', data)
})
```

### Rooms e Canali

Ogni utente viene automaticamente aggiunto a delle "stanze" (rooms):

```javascript
// Rooms automatiche per ogni utente:
`user:${userId}`     // Messaggi personali
`role:${userRole}`   // Messaggi per ruolo (es: tutti i CLIENT)
`org:default`        // Messaggi globali
```

### Eventi WebSocket

| Evento | Direzione | Descrizione |
|--------|-----------|-------------|
| `connect` | Client → Server | Richiesta connessione |
| `connected` | Server → Client | Conferma autenticazione |
| `notification:new` | Server → Client | Nuova notifica |
| `message:new` | Bidirezionale | Nuovo messaggio chat |
| `disconnect` | Bidirezionale | Disconnessione |

---

## 🛡️ Sicurezza e Protezioni

### 1. Password Hashing

Le password **non vengono mai salvate in chiaro**:

```javascript
// Registrazione:
password: "miaPassword123"
  ↓ (bcrypt con 12 rounds)
saved: "$2b$12$KIXxPf3g..." // Hash irreversibile

// Login:
passwordInserita vs hashSalvato
  ↓ (bcrypt.compare)
true/false
```

### 2. Protezione Brute Force

Dopo **5 tentativi falliti**, l'account viene bloccato per 30 minuti:

```javascript
// Sistema di protezione:
1° tentativo fallito → loginAttempts = 1
2° tentativo fallito → loginAttempts = 2
3° tentativo fallito → loginAttempts = 3
4° tentativo fallito → loginAttempts = 4
5° tentativo fallito → loginAttempts = 5
                      → lockedUntil = now + 30 minuti
                      → Errore 423: Account bloccato
```

### 3. Rate Limiting

Limite di richieste per prevenire abusi:

```javascript
// Configurazione:
- Max 5 tentativi di login ogni 15 minuti per IP
- Max 100 richieste API ogni 15 minuti per IP
```

### 4. Storico Accessi

Ogni login viene registrato:

```sql
-- Tabella loginHistory:
userId     | ipAddress    | userAgent     | success | timestamp
-----------+--------------+---------------+---------+-----------
uuid-123   | 192.168.1.1  | Chrome/120... | true    | 2025-08-25
uuid-123   | 192.168.1.1  | Chrome/120... | false   | 2025-08-24
```

---

## 🔐 Autenticazione a Due Fattori (2FA)

### Setup 2FA

1. **Genera Secret**
```javascript
POST /api/auth/2fa/setup
Response: {
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,..."
}
```

2. **Scansiona QR Code** con app authenticator (Google Authenticator, Authy)

3. **Verifica Codice**
```javascript
POST /api/auth/2fa/verify
Body: { "code": "123456" }
```

### Login con 2FA

```javascript
// 1. Login normale
POST /api/auth/login
{ "email": "...", "password": "..." }

// 2. Risposta richiede 2FA
{ "requiresTwoFactor": true }

// 3. Reinvia con codice 2FA
POST /api/auth/login
{ "email": "...", "password": "...", "twoFactorCode": "123456" }

// 4. Login completato
{ "accessToken": "...", "user": {...} }
```

---

## 📊 Gestione Sessioni

### Dove Vengono Salvati i Dati

| Dato | Posizione | Durata |
|------|-----------|--------|
| Access Token | localStorage | 7 giorni o logout |
| Refresh Token | localStorage | 30 giorni o logout |
| User Info | localStorage | Fino a logout |
| Socket Connection | Memoria RAM | Durata sessione |

### Refresh Automatico Token

```javascript
// Quando l'access token sta per scadere:
async function refreshToken() {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    body: { refreshToken: localStorage.getItem('refreshToken') }
  })
  
  const { accessToken, refreshToken } = await response.json()
  localStorage.setItem('accessToken', accessToken)
  localStorage.setItem('refreshToken', refreshToken)
}
```

### Logout

```javascript
// Cosa succede al logout:
1. Rimuove token dal localStorage
2. Disconnette WebSocket
3. Pulisce stato utente in React
4. Redirect a pagina login
5. (Opzionale) Notifica server per log
```

---

## 🔗 API Endpoints

### Endpoints Pubblici (No Auth)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrazione nuovo utente |
| POST | `/api/auth/login` | Login utente |
| POST | `/api/auth/forgot-password` | Richiesta reset password |
| POST | `/api/auth/reset-password` | Reset password con token |

### Endpoints Protetti (Auth Required)

| Metodo | Endpoint | Descrizione | Ruolo Richiesto |
|--------|----------|-------------|-----------------|
| POST | `/api/auth/logout` | Logout utente | Tutti |
| POST | `/api/auth/refresh` | Rinnova token | Tutti |
| POST | `/api/auth/2fa/setup` | Configura 2FA | Tutti |
| POST | `/api/auth/2fa/verify` | Verifica 2FA | Tutti |
| POST | `/api/auth/2fa/disable` | Disabilita 2FA | Tutti |
| GET | `/api/users/profile` | Profilo utente | Tutti |
| GET | `/api/admin/*` | Routes admin | ADMIN, SUPER_ADMIN |

### Headers Richiesti

```javascript
// Per endpoints protetti:
{
  "Authorization": "Bearer eyJhbGc...",  // Token JWT
  "Content-Type": "application/json"
}
```

---

## 🔧 Troubleshooting

### Problemi Comuni e Soluzioni

#### 1. "Authentication failed" su WebSocket

**Problema**: WebSocket non si connette dopo login  
**Causa**: Token non presente o non valido  
**Soluzione**:
```javascript
// Verifica nel browser console:
localStorage.getItem('accessToken')  // Deve esistere
// Controlla network tab per vedere se il token viene inviato
```

#### 2. "Invalid credentials" al login

**Problema**: Login fallisce anche con credenziali corrette  
**Possibili Cause**:
- Password errata (case sensitive)
- Account bloccato per troppi tentativi
- Email non verificata
- Account non esistente

#### 3. "Token expired"

**Problema**: Richieste API falliscono con errore token  
**Soluzione**:
```javascript
// Forza refresh token:
await refreshToken()
// O fai logout e login di nuovo
```

#### 4. Account Bloccato

**Problema**: "Account locked" dopo troppi tentativi  
**Soluzione**: Attendere 30 minuti o contattare admin per sblocco

#### 5. 2FA Non Funziona

**Problema**: Codice 2FA sempre errato  
**Possibili Cause**:
- Orologio del telefono non sincronizzato
- App authenticator non configurata correttamente
- Secret non salvato correttamente

### Log e Debug

#### Frontend (Browser Console)
```javascript
// Controlla stato auth:
console.log(localStorage.getItem('accessToken'))
console.log(localStorage.getItem('user'))

// Controlla WebSocket:
// Cerca messaggi che iniziano con 🔌
```

#### Backend (Terminal)
```bash
# Cerca nei log:
tail -f backend/logs/app.log | grep "auth"
tail -f backend/logs/app.log | grep "WebSocket"
```

---

## 📚 Best Practices

### Per gli Sviluppatori

1. **Mai salvare password in chiaro**
2. **Sempre usare HTTPS in produzione**
3. **Token con scadenze appropriate**
4. **Rate limiting su endpoints sensibili**
5. **Log di tutti i tentativi di accesso**
6. **2FA per account amministrativi**

### Per gli Utenti

1. **Password complesse** (min 8 caratteri, mix di lettere/numeri/simboli)
2. **Non condividere credenziali**
3. **Attivare 2FA quando disponibile**
4. **Logout da dispositivi pubblici**
5. **Segnalare attività sospette**

---

## 🆘 Supporto

Per problemi con l'autenticazione:

1. **Controlla questa documentazione**
2. **Verifica i log del sistema**
3. **Contatta il supporto tecnico**
4. **In emergenza**: Un admin può resettare manualmente l'account

---

## 📝 Note Tecniche

### Variabili Ambiente Richieste

```bash
# Backend (.env)
JWT_SECRET=assistenza_jwt_secret_2024_secure_key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=assistenza_jwt_refresh_secret_2024_secure
JWT_REFRESH_EXPIRE=30d
TWO_FACTOR_APP_NAME=Sistema Richiesta Assistenza

# Frontend (.env)
VITE_API_URL=http://localhost:3200
```

### Database Schema (Campi Auth)

```sql
-- Tabella users
id              UUID PRIMARY KEY
email           VARCHAR UNIQUE
password        VARCHAR (hash bcrypt)
twoFactorSecret VARCHAR NULLABLE
twoFactorEnabled BOOLEAN DEFAULT false
loginAttempts   INTEGER DEFAULT 0
lockedUntil     TIMESTAMP NULLABLE
lastLoginAt     TIMESTAMP
status          VARCHAR (online/offline/away/busy)
```

---

*Documentazione aggiornata il 25 Agosto 2025 - Versione 2.0*
