# 🚀 Quick Start - Sistema Richiesta Assistenza

## 📋 Prerequisiti

Prima di iniziare, assicurati di avere installato:

- **Node.js** 20.0 o superiore
- **PostgreSQL** 15.0 o superiore
- **Redis** 7.0 o superiore
- **Git**
- **npm** o **yarn**

## 🔧 Installazione Completa

### 1. Clone del Repository

```bash
git clone https://github.com/241luca/richiesta-assistenza.git
cd richiesta-assistenza
```

### 2. Installazione Dipendenze

```bash
# Installa dipendenze frontend (dalla root)
npm install

# Installa dipendenze backend
cd backend
npm install
cd ..
```

### 3. Configurazione Environment

```bash
# Copia il file di esempio
cp .env.example .env

# Modifica il file .env con le tue configurazioni
# IMPORTANTE: Configura almeno DATABASE_URL
```

### 4. Setup Database

```bash
cd backend

# Opzione 1: Reset completo con dati di test
npm run db:reset

# Opzione 2: Solo migrazione (mantiene dati esistenti)
npm run prisma:push

# Opzione 3: Solo seed (popola dati di test)
npm run prisma:seed
```

### 5. Avvio Servizi

Apri 3 terminali separati:

**Terminal 1 - Redis:**
```bash
redis-server
```

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
# Server in ascolto su http://localhost:3200
```

**Terminal 3 - Frontend:**
```bash
npm run dev
# Applicazione disponibile su http://localhost:5193
```

## 👤 Utenti di Test

Il sistema viene popolato con 4 utenti di test:

### 1. Super Admin
- **Email**: admin@assistenza.it
- **Password**: password123
- **Ruolo**: Accesso completo al sistema
- **Funzionalità**: Gestione utenti, categorie, configurazioni

### 2. Professional
- **Email**: mario.rossi@assistenza.it
- **Password**: password123
- **Ruolo**: Professionista
- **Funzionalità**: Gestione richieste, creazione preventivi

### 3. Client
- **Email**: luigi.bianchi@gmail.com
- **Password**: password123
- **Ruolo**: Cliente
- **Funzionalità**: Creazione richieste, accettazione preventivi

### 4. Staff
- **Email**: staff@assistenza.it
- **Password**: staff123
- **Ruolo**: Staff operativo
- **Funzionalità**: Supporto, gestione operativa

## 🎯 Quick Login

Nella pagina di login (http://localhost:5193/login) sono presenti 4 pulsanti di accesso rapido per testare velocemente il sistema con i diversi ruoli.

## 📦 Script NPM Utili

### Backend Scripts

```bash
cd backend

# Development
npm run dev                 # Avvia server in modalità development

# Database
npm run db:reset           # Reset completo database + seed
npm run prisma:push        # Sincronizza schema con database
npm run prisma:seed        # Popola database con dati di test
npm run prisma:studio      # Apre Prisma Studio (GUI database)
npm run prisma:generate    # Genera Prisma Client

# Testing
npm test                   # Esegue test
npm run test:ui           # Interfaccia test

# Build
npm run build             # Compila TypeScript
npm start                 # Avvia server compilato
```

### Frontend Scripts

```bash
# Dalla root del progetto

npm run dev               # Avvia frontend in development
npm run build            # Build per produzione
npm run preview          # Preview build produzione
npm run lint             # Linting codice
npm run format           # Formattazione codice
```

## 🔍 Verifica Installazione

### 1. Backend Health Check
```bash
curl http://localhost:3200/health
# Dovrebbe restituire: {"status":"ok","timestamp":"..."}
```

### 2. Database Connection
```bash
cd backend
npx prisma studio
# Si aprirà il browser con Prisma Studio
```

### 3. Frontend
Apri http://localhost:5193 nel browser. Dovresti vedere la pagina di login.

## ⚠️ Troubleshooting

### Problema: "Database connection failed"
**Soluzione**: 
- Verifica che PostgreSQL sia in esecuzione
- Controlla DATABASE_URL nel file .env
- Assicurati che il database esista

### Problema: "Redis connection refused"
**Soluzione**:
- Avvia Redis con `redis-server`
- Verifica che Redis sia sulla porta 6379

### Problema: "Port already in use"
**Soluzione**:
- Backend: Cambia PORT nel .env (default: 3200)
- Frontend: Modifica vite.config.ts

### Problema: "Login non funziona"
**Soluzione**:
- Esegui `npm run db:reset` nel backend
- Verifica che Redis sia attivo
- Controlla i log del backend per errori

## 📚 Prossimi Passi

1. **Esplora le funzionalità**: Accedi con i diversi ruoli per esplorare le funzionalità
2. **Leggi la documentazione**: Consulta la documentazione completa in `/Docs`
3. **Personalizza**: Modifica configurazioni e aggiungi nuove funzionalità
4. **Deploy**: Segui la guida di deployment per la produzione

## 🆘 Supporto

Per problemi o domande:
- Consulta la [Documentazione Completa](../README.md)
- Apri una issue su [GitHub](https://github.com/241luca/richiesta-assistenza/issues)
- Contatta il team di sviluppo

---

**Ultimo aggiornamento**: 24 Gennaio 2025
