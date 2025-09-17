# 📋 CHANGELOG - Sistema Richiesta Assistenza

> 📚 **Documentazione Completa**: Per navigare tutta la documentazione del progetto, consultare [DOCUMENTAZIONE/INDEX.md](DOCUMENTAZIONE/INDEX.md)

---

## [4.3.2] - 11 Settembre 2025 (ore 19:30)

### 🆕 SISTEMA REGISTRAZIONE DIFFERENZIATA

#### ✨ Nuove Funzionalità
- **Registrazione CLIENT/PROFESSIONAL separata**
  - Pagina scelta tipo account `/register`
  - Form dedicato clienti `/register/client`
  - Form completo professionisti `/register/professional`
  - Componenti riutilizzabili per privacy e indirizzi

#### 🛠️ Modifiche Backend
- **Schema Database Aggiornato** (20+ nuovi campi)
  - Dati aziendali: businessName, businessAddress, businessCity, businessProvince, businessPostalCode
  - Dati fiscali: businessPEC, businessSDI, businessCF, partitaIva
  - Privacy: privacyAccepted, termsAccepted, marketingAccepted con timestamp
  - Approvazione: approvalStatus, approvedBy, approvedAt, rejectionReason
  - Coordinate: businessLatitude, businessLongitude

- **Auth Routes Aggiornato**
  - Schema validazione Zod separato per CLIENT/PROFESSIONAL
  - Gestione completa nuovi campi
  - Stato PENDING automatico per professionisti

#### 🎨 Componenti Frontend
- **AddressAutocomplete.tsx** - Autocompletamento con Google Maps
- **AddressAutocompleteSimple.tsx** - Fallback senza Google Maps
- **PrivacyCheckboxes.tsx** - Gestione consensi riutilizzabile
- **RegisterChoicePage.tsx** - Scelta tipo registrazione
- **RegisterClientPage.tsx** - Form cliente semplificato
- **RegisterProfessionalPage.tsx** - Form professionista completo

#### 🐛 Bug Fix
- **Loop login risolto** - Corretto endpoint `/profile` (era `/users/profile`)
- **GoogleMapsProvider** - Temporaneamente disabilitato per stabilità
- **Checkbox privacy** - Fix con react-hook-form watch
- **API client** - Corretti endpoint profilo utente

#### 📚 Documentazione
- Creato PIANO-REGISTRAZIONE-MIGLIORATA.md
- 4 report sessione dettagliati
- Aggiornato INDEX.md
- Aggiornato CHANGELOG.md

---

## [4.3.1] - 11 Settembre 2025 (ore 14:00)

### 📚 MEGA AGGIORNAMENTO DOCUMENTAZIONE

#### ✨ Documenti Completamente Riscritti
- **CHECKLIST-FUNZIONALITA-SISTEMA.md** - Aggiornato alla v4.3.0
  - Documentate **85+ tabelle database** (erano solo 30!)
  - Aggiunti tutti i 15+ sistemi implementati
  - Corrette statistiche con numeri reali verificati
  - Aggiunta sezione "Mancanze Documentazione"
  
- **ARCHITETTURA-SISTEMA-COMPLETA.md** - Aggiornato alla v4.3.0
  - Mappate tutte le 85+ tabelle per categoria
  - Documentata architettura reale a 4 livelli
  - Dettagliato stack tecnologico verificato
  - Aggiunti tutti i sistemi enterprise implementati

#### 🆕 Nuovi Documenti Creati
- **QUICK-REFERENCE.md** - Riferimento rapido per sviluppatori
  - Numeri chiave del sistema
  - Comandi quick start
  - Errori comuni da evitare
  - Tech stack completo

- **PIANO-MIGLIORAMENTO-DOCUMENTAZIONE.md** - Roadmap documentazione
  - Timeline 4 settimane per completamento
  - Template per nuova documentazione
  - KPI e metriche successo
  - Strumenti consigliati

#### 🔍 Scoperte Importanti
- **Sistema molto più avanzato del documentato**:
  - 85+ tabelle database (non 30)
  - 200+ API endpoints attivi (non 70)
  - 15+ sistemi completi implementati
  - 8 tabelle Cleanup System (completamente nuovo)
  - 15 tabelle Intervention Reports (non documentato)
  - 12 tabelle Professional Management (non documentato)

#### ⚠️ Mancanze Documentazione Identificate
- **Critico**: API Documentation (Swagger) completamente mancante
- **Alta priorità**: Database ER Diagram, Deployment Guide
- **Media priorità**: WebSocket Events, User Manual
- **Da aggiornare**: README.md, ISTRUZIONI-PROGETTO.md

#### 📁 Organizzazione File
- File principali copiati nella root per accesso rapido
- Versioni master in DOCUMENTAZIONE/ATTUALE/00-ESSENZIALI/
- Report sessione creato in REPORT-SESSIONI/2025/09-settembre/

---

## [4.2.1] - 11 Settembre 2025

### 🔥 CRITICO - Gestione Documentazione Rigorosa
- **ISTRUZIONI-PROGETTO.md reso INEQUIVOCABILE**
  - Aggiunto box di WARNING prominente all'inizio
  - Aggiunta 8ª REGOLA D'ORO sulla documentazione
  - Aggiunto ERRORE #5 sui file .md nella root
  - Istruzioni obbligatorie per Claude ogni sessione
  - Template obbligatorio per report sessioni
  - Sezione documentazione resa "CRITICA" e "VINCOLANTE"

### 🔧 Migliorato
- **Script di controllo potenziati**
  - `pre-commit-check.sh`: Blocca commit con .md non autorizzati
  - `pre-commit-check.sh`: Avviso se manca report giornaliero
  - `validate-work.sh`: Controllo file documentazione

### 📚 Riorganizzato
- **Spostati 17 file .md dalla root**
  - 15 report Health Check → ARCHIVIO/report-vari/
  - 2 report sessione → REPORT-SESSIONI/2025-09-settembre/
  - Root ora contiene SOLO 4 file .md autorizzati

### 📝 Documentazione
- **INDEX.md aggiornato** con regole v4.2
- **Checklist finale** aggiornata con controlli documentazione prioritari
- **Multiple ripetizioni** delle regole per renderle impossibili da ignorare

---

## [4.3.0] - 10 Gennaio 2025

### 🆕 Aggiunto
- 🔥 **Pattern ResponseFormatter come standard di progetto**
  - Creato `/src/utils/responseFormatter.ts` per il frontend
  - Documentazione completa in ISTRUZIONI-PROGETTO.md
  - Gestione unificata di tutti gli errori API
  - Compatibilità totale con ResponseFormatter del backend

### 🔄 Modificato
- 📖 **ISTRUZIONI-PROGETTO.md aggiornato**
  - Aggiunta sezione critica "PATTERN RESPONSEFORMATTER - REGOLA FONDAMENTALE"
  - Documentato l'uso dei due ResponseFormatter (backend/frontend)
  - Aggiunti esempi completi di uso corretto e errori da evitare
  - Spiegata l'architettura e i vantaggi del pattern

### 🔧 Fix
- 🐛 **Risolto errore React "Objects are not valid as a React child"**
  - Errore causato dal rendering diretto di oggetti errore complessi
  - Implementato ResponseFormatter.getErrorMessage() per convertire sempre in stringa
  - Fix applicato a ProposeInterventions.tsx e utilizzabile ovunque

### 📚 Documentazione
- Aggiornata sezione SVILUPPO con pattern ResponseFormatter completo
- Aggiunti template corretti per routes e componenti
- Documentata struttura standard delle risposte API
- Aggiunte verifiche automatiche nel pre-commit check

---

## [4.2.0] - 9 Settembre 2025

### 🆕 Aggiunto
- 📚 **Nuova struttura documentazione** in `/DOCUMENTAZIONE/`
  - INDEX.md navigabile per accesso facile a tutta la documentazione
  - Organizzazione per argomenti (ATTUALE/ARCHIVIO/REPORT-SESSIONI)
  - File COLLEGAMENTI.md per evitare duplicazioni

### 🔄 Modificato  
- 📅 **Corrette date errate** nei report sessioni
  - "2025-08-AGOSTO" → 2024/08-agosto  
  - "2025-09-SETTEMBRE" → 2024/09-settembre
- 📦 **Riorganizzazione completa** della documentazione
  - File essenziali mantenuti solo nella root (README, CHANGELOG, ISTRUZIONI-PROGETTO)
  - Eliminazione di tutti i duplicati
  - Aggiornati tutti i riferimenti interni nei documenti

### 🗑️ Rimosso
- ❌ Cartella `Docs/` originale (ora in DOCUMENTAZIONE/ARCHIVIO/)
- ❌ Cartella `CLEANUP-TEMP-20250904/` (archiviata)
- ❌ Cartella `REPORT-SESSIONI-CLAUDE/` (riorganizzata con date corrette)
- ❌ File .md duplicati dalla root (ora organizzati in DOCUMENTAZIONE/)

### 📚 Documentazione
- Aggiornato ISTRUZIONI-PROGETTO.md con nuova struttura
- Aggiornato README.md con riferimenti corretti
- Creato LEGGIMI-DOCUMENTAZIONE.md come guida rapida
- Aggiornati tutti i percorsi interni nei documenti principali

---

## [4.1.0] - 8 Settembre 2025

### ✨ Nuove Funzionalità
- **Tab "Guida ai Test" nel Health Check System**
  - Documentazione completa integrata nella dashboard
  - 7 sezioni navigabili con spiegazioni user-friendly
  - FAQ con 8+ domande frequenti
  - Esempi pratici e configurazioni pronte all'uso

### 🔧 Miglioramenti
- **Health Check System**
  - Aggiunto supporto per tabelle database mancanti
  - Migliorata gestione errori con messaggi più chiari
  - Performance monitor ora completamente funzionante

- **Script Manager**
  - Consolidamento script in unica posizione `/backend/src/scripts/`
  - Eliminazione duplicazioni
  - Registry centralizzato per tutti gli script

### 🐛 Bug Fix
- Corretto problema metodi mancanti `getCurrentMetrics()` e `getHistory()` in performance-monitor
- Risolti tutti i percorsi API duplicati `/api/api/`
- Fix parametri route opzionali che causavano crash server
- Gestione corretta quando tabelle Health Check non esistono

### 📚 Documentazione
- Aggiornata documentazione Health Check System alla v4.1.0
- Aggiunta sezione "Guida Utente" completa
- Documentate tutte le nuove funzionalità UI
- Aggiunte note per amministratori non tecnici

---

## [4.0.0] - 8 Settembre 2025 (Mattina)

### ✨ Sistemi Implementati

#### 🏥 Health Check System (COMPLETO)
- **Orchestrator**: Coordinatore principale del sistema
- **Scheduler**: Esecuzione automatica con cron configurabile
- **Report Generator**: PDF automatici settimanali
- **Auto-Remediation**: Sistema intelligente di auto-riparazione
- **Performance Monitor**: Metriche real-time (CPU, Memory, API)
- **Dashboard UI**: Interfaccia completa con 5 tab

#### 🛠️ Script Manager (COMPLETO)
- Dashboard UI per esecuzione script senza terminale
- Categorizzazione: Database, Maintenance, Report, Security, Utility
- Parametri dinamici personalizzabili
- Output real-time via WebSocket
- Sandbox environment sicuro
- Registry centralizzato con 12+ script predefiniti

#### 📊 Audit Log System
- Tracciamento completo di tutte le operazioni API
- Categorie: AUTH, DATA, ADMIN, SYSTEM, SECURITY
- Dashboard con filtri avanzati
- Export in CSV, JSON, PDF
- Retention policy configurabile

### 🏗️ Architettura

#### Backend
- Nuovi servizi in `/backend/src/services/health-check-automation/`
- Script centralizzati in `/backend/src/scripts/`
- Routes admin in `/backend/src/routes/admin/`
- Middleware audit logging globale

#### Frontend
- Componenti Health Check in `/src/components/admin/health-check/`
- Script Manager UI in `/src/components/admin/script-manager/`
- Audit Log dashboard in `/src/components/admin/audit-log/`

#### Database
- Nuove tabelle: HealthCheckResult, PerformanceMetrics, AutoRemediationLog
- Script creazione: `create-health-tables.ts`

### 📊 Metriche
- **Moduli monitorati**: 8
- **Frequenza check**: 5 min - 6 ore (configurabile)
- **Report automatici**: Settimanali
- **Auto-remediation rules**: 6+ predefinite
- **Script disponibili**: 12+

---

## [3.0.0] - 6 Settembre 2025

### ✨ Funzionalità Principali
- Sistema completo di richieste assistenza
- Gestione preventivi e pagamenti
- Chat real-time
- Integrazione AI (OpenAI)
- Sistema notifiche avanzato

### 🔒 Sicurezza
- Autenticazione JWT + 2FA
- RBAC (Role-Based Access Control)
- Security headers OWASP compliant
- Rate limiting avanzato

### ⚡ Performance
- Compression Brotli/Gzip
- Redis caching
- Query optimization
- Circuit breaker pattern

---

## Versioni Precedenti

Per lo storico completo delle versioni precedenti, consultare:
- `/DOCUMENTAZIONE/ARCHIVIO/` - Documentazione storica
- `/DOCUMENTAZIONE/REPORT-SESSIONI/` - Report dettagliati di ogni sessione

---

**Ultimo aggiornamento**: 11 Settembre 2025  
**Versione corrente**: 4.3.1  
**Mantenuto da**: Team Sviluppo LM Tecnologie
