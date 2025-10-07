# 📊 SISTEMA HEALTH CHECK - DOCUMENTAZIONE COMPLETA
## Versione: 5.1 (FIXED)
## Data Ultimo Aggiornamento: 11 Gennaio 2025
## ✅ SISTEMA COMPLETAMENTE FUNZIONANTE

---

## 🎯 PANORAMICA

Il **Sistema Health Check** è un modulo avanzato per il monitoraggio in tempo reale dello stato di salute dell'applicazione. Fornisce una dashboard interattiva che controlla 8 moduli principali del sistema attraverso 33 test automatici.

### Caratteristiche Principali:
- **33 test automatici** distribuiti su 8 moduli
- **Dashboard interattiva** completamente in italiano
- **Monitoraggio real-time** con aggiornamento automatico
- **Box cliccabili** per vedere i dettagli dei test
- **Sistema di avvisi** per problemi critici
- **Auto-remediation** per problemi comuni (configurabile)

---

## 📋 MODULI MONITORATI

### 1. Sistema Autenticazione
- **4 test eseguiti**:
  - JWT Secret Configuration
  - Session Store (Redis)
  - Failed Login Attempts (24h)
  - 2FA Adoption Rate

### 2. Sistema Database
- **5 test eseguiti**:
  - Database Connection Speed
  - Active Database Connections
  - Database Size
  - Database Statistics
  - Slow Query Detection

### 3. Sistema Notifiche
- **4 test eseguiti**:
  - Email Service Configuration (Brevo)
  - Notification Delivery Rate (24h)
  - Unread Notifications Count
  - WebSocket Server Status

### 4. Sistema Backup
- **4 test eseguiti**:
  - Last Backup Time
  - Failed Backups Count
  - Backup Storage Files
  - Backup Schedule Configuration

### 5. Sistema Chat
- **4 test eseguiti**:
  - Chat Messages Volume (24h)
  - Active Chats Count
  - Average Response Time
  - Unread Messages Count

### 6. Sistema Pagamenti
- **3 test eseguiti**:
  - Stripe API Configuration
  - Payment Success Rate (24h)
  - Pending Payments

### 7. Sistema AI
- **4 test eseguiti**:
  - OpenAI API Configuration
  - AI Conversations (24h)
  - Token Usage (24h)
  - AI Response Time

### 8. Sistema Richieste
- **5 test eseguiti**:
  - Active Requests Count
  - Completed Requests (24h)
  - Pending Assignment Queue
  - Average Completion Time
  - Quote Acceptance Rate (24h)

**TOTALE: 33 TEST**

---

## 🖥️ INTERFACCIA UTENTE

### Dashboard Principale

#### Sezione "Stato Generale del Sistema"
Mostra tre metriche principali:

1. **Punteggio Salute (89%)**
   - Media ponderata dello stato di tutti i moduli
   - Verde (>80%): OTTIMO
   - Giallo (60-80%): ATTENZIONE
   - Rosso (<60%): CRITICO

2. **Moduli Disponibili (7 su 8 - 88%)**
   - Numero di moduli funzionanti sul totale
   - Mostra chiaramente che si tratta di MODULI del sistema

3. **Test Superati (25 su 33 - 76%)**
   - Numero di test passati sul totale
   - Mostra chiaramente che si tratta di singoli TEST

#### Sezione "Riepilogo Test Eseguiti"
4 box interattivi e cliccabili:

- **📋 Test Totali**: Mostra tutti i 33 test eseguiti
- **✅ Passati**: Mostra solo i test superati (verde)
- **⚠️ Warning**: Mostra solo i test con avvisi (giallo)
- **❌ Falliti**: Mostra solo i test falliti (rosso)

**Cliccando su ogni box** si apre una lista dettagliata con:
- Nome del modulo (es: Sistema Database)
- Descrizione del test
- Messaggio specifico del risultato

#### Card dei Moduli
8 card, una per ogni modulo, che mostrano:

- **Nome del modulo** (senza emoji)
- **Health Score** del modulo (0-100%)
- **Stato** (Healthy/Warning/Critical)
- **Griglia con contatori**:
  - Test Passati (verde)
  - Test Warning (giallo)
  - Test Falliti (rosso)
- **Problemi principali** sempre visibili
- **Pulsante "Mostra tutti i dettagli"** per lista completa
- **Pulsante refresh** per aggiornare solo quel modulo

---

## 🔧 FUNZIONALITÀ

### 1. Esecuzione Test

#### Test Completo
- **Pulsante**: "Esegui Tutti i Test"
- **Durata**: ~5-10 secondi
- **Risultato**: Aggiorna tutti i 33 test

#### Test Singolo Modulo
- **Pulsante**: Icona refresh su ogni card
- **Durata**: ~1-2 secondi
- **Risultato**: Aggiorna solo i test di quel modulo

### 2. Aggiornamento Automatico
- **Checkbox**: "Aggiornamento automatico"
- **Frequenza**: Ogni 30 secondi
- **Comportamento**: Ricarica tutti i dati senza interazione

### 3. Visualizzazione Dettagli
- **Click su card**: Apre modal con dettagli completi
- **Click su box riepilogo**: Mostra lista filtrata dei test
- **Hover su problemi**: Mostra tooltip con info aggiuntive

---

## 🛠️ ARCHITETTURA TECNICA

### Backend

#### Servizio Principal
**File**: `backend/src/services/healthCheck.service.ts`

Responsabile di:
- Esecuzione dei 33 test
- Calcolo degli score
- Gestione della cache dei risultati
- Salvataggio nel database

#### API Endpoints
**Base**: `/api/admin/health-check/`

- `GET /status` - Ottiene il summary completo
- `GET /modules` - Lista dei moduli disponibili
- `POST /run` - Esegue check (singolo o tutti)
- `GET /history` - Storico dei check
- `GET /performance` - Metriche di performance

#### Database Tables
- `HealthCheckResult` - Risultati dei singoli check
- `HealthCheckSummary` - Summary generale del sistema
- `PerformanceMetrics` - Metriche di performance
- `AutoRemediationLog` - Log delle auto-correzioni

### Frontend

#### Componenti Principali
- `HealthCheckDashboard.tsx` - Dashboard principale
- `CheckSummarySection.tsx` - Sezione riepilogo con box cliccabili
- `HealthCheckCard.tsx` - Card per singolo modulo
- `ModuleStatus.tsx` - Modal dettagli modulo
- `HealthCheckAutomation.tsx` - Tab automazione

#### Servizi
- `health.service.ts` - Chiamate API
- React Query per cache e sincronizzazione
- WebSocket per aggiornamenti real-time (quando attivo)

---

## 📊 METRICHE E CALCOLI

### Health Score Modulo
```
Score = 100 - (penalità per check falliti)
- Check critico fallito: -30 punti
- Check warning: -10/15 punti
- Check basso impatto: -5 punti
```

### Overall System Score
```
Overall Score = Media(Score di tutti i moduli)
```

### System Availability
```
Availability = (Moduli Healthy / Totale Moduli) * 100
```

### Check Success Rate
```
Success Rate = (Test Passati / Totale Test) * 100
```

---

## 🚀 GUIDA ALL'USO

### Per Amministratori

1. **Accesso Dashboard**
   - URL: `/admin/health`
   - Richiede ruolo: ADMIN o SUPER_ADMIN

2. **Controllo Rapido**
   - Verificare il Punteggio Salute generale
   - Controllare se ci sono moduli in Warning o Critical
   - Guardare il riepilogo test per avere i numeri totali

3. **Analisi Dettagliata**
   - Cliccare sui box del riepilogo per vedere quali test hanno problemi
   - Cliccare sulle card dei moduli per dettagli specifici
   - Usare "Mostra tutti i dettagli" per lista completa

4. **Azioni Correttive**
   - Per problemi di backup: eseguire backup manuale
   - Per problemi di notifiche: verificare configurazione Brevo
   - Per problemi database: controllare connessioni e query lente
   - Per problemi chat: verificare WebSocket

### Per Sviluppatori

1. **Aggiungere un Nuovo Test**
   ```typescript
   // In healthCheck.service.ts, nel metodo del modulo
   checks.push({
     description: 'Nome del Test',
     status: risultato ? 'pass' : 'fail',
     message: 'Dettagli del risultato',
     severity: 'medium'
   });
   ```

2. **Modificare Soglie**
   ```typescript
   // Nel metodo checkXxxSystem()
   if (valore > SOGLIA) {
     score -= 10; // Penalità
     warnings.push('Messaggio di warning');
   }
   ```

3. **Debug**
   - Controllare i log: `[HealthCheck]` nel backend
   - Verificare console browser per errori frontend
   - Usare React Query DevTools (F12)

---

## ⚠️ PROBLEMI NOTI

1. **Aggiornamento Pannello Riepilogo**
   - Quando si esegue un test singolo, il pannello "Riepilogo Test Eseguiti" potrebbe non aggiornarsi immediatamente
   - Workaround: Cliccare "Esegui Tutti i Test" per aggiornamento completo

2. **WebSocket Status**
   - Il test WebSocket potrebbe mostrare "not initialized" se Socket.io non è attivo
   - Non critico per il funzionamento

3. **Slow Query Detection**
   - Richiede pg_stat_statements abilitato in PostgreSQL
   - Se non disponibile, mostra "pg_stat_statements not enabled"

---

## 🔒 SICUREZZA

- **Autenticazione**: Richiede JWT valido
- **Autorizzazione**: Solo ADMIN e SUPER_ADMIN
- **Rate Limiting**: Max 10 richieste/minuto per utente
- **Audit Log**: Tutte le esecuzioni sono tracciate
- **Sanitizzazione**: Input validati con Zod

---

## 📈 PERFORMANCE

- **Tempo Esecuzione Test Completo**: ~5-10 secondi
- **Tempo Test Singolo Modulo**: ~1-2 secondi
- **Cache**: Risultati cachati per 1 minuto
- **Database**: Query ottimizzate con indici
- **Frontend**: React Query per ottimizzazione richieste

---

## 🔄 CHANGELOG

### v5.1 (11 Gennaio 2025) - FIX COMPLETO ✅
- **FIX**: Test singolo modulo ora funziona correttamente
- **FIX**: WebSocket detection corretta (usa getIO() invece di global.io)
- **FIX**: UI icone non sovrapposte (aggiunto gap-2)
- **FIX**: Salvataggio database corretto (campi schema corretti)
- **FIX**: Pannello mostra "(Nome Modulo)" per test singoli
- **NUOVO**: Documentazione completa dei fix

### v5.0 (10 Gennaio 2025)
- Traduzione completa in italiano
- Aggiunta distinzione chiara tra moduli e test
- Rimozione emoji dai titoli moduli
- Fix conteggio test (ora 33 totali)
- Miglioramento UI box cliccabili

### v4.0 (8 Gennaio 2025)
- Implementazione Health Check System
- 8 moduli con 33 test totali
- Dashboard interattiva
- Sistema di automazione e avvisi

---

## 📞 SUPPORTO

Per problemi o domande:
- **Email**: support@lmtecnologie.it
- **Documentazione**: `/Docs/04-SISTEMI/HEALTH-CHECK-SYSTEM.md`
- **Issue Tracker**: GitHub Issues

---

**Fine Documentazione**

Sistema Health Check v5.0 - LM Tecnologie © 2025
