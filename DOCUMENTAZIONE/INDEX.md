# 📚 INDICE DOCUMENTAZIONE SISTEMA RICHIESTA ASSISTENZA

**Ultimo aggiornamento**: 11 Settembre 2025  
**Versione Sistema**: 4.3.2

> 🆕 **AGGIORNAMENTO 11/09/2025 - SISTEMA REGISTRAZIONE DIFFERENZIATA**
> - Implementato sistema registrazione separato CLIENT/PROFESSIONAL
> - Aggiornato schema database con 20+ nuovi campi
> - Risolti problemi loop login e Google Maps
> - Creati componenti form avanzati con validazione

---

## 🗂️ STRUTTURA DOCUMENTAZIONE

La documentazione è organizzata in due sezioni principali:

### 📌 **ATTUALE** - Documentazione valida e aggiornata
Questa è la documentazione ufficiale del sistema, sempre aggiornata e da consultare per lo sviluppo.

### 📦 **ARCHIVIO** - Documentazione storica
Documentazione delle versioni precedenti e materiale storico per riferimento.

### 📝 **REPORT-SESSIONI** - Cronologia modifiche
Report dettagliati di ogni sessione di sviluppo con Claude.

#### Report Recenti (Settembre 2025):
- **[11-registrazione-completa.md](REPORT-SESSIONI/2025-09-11-registrazione-completa.md)** 🆕
  - Sistema registrazione differenziata CLIENT/PROFESSIONAL
  - Form completi con tutti i dati aziendali
  - Integrazione Google Maps (temporaneamente disabilitata)
  - Privacy e consensi con date

- **[11-fix-google-maps-loop.md](REPORT-SESSIONI/2025-09-11-fix-google-maps-loop.md)** 🆕
  - Risolto loop login causato da GoogleMapsProvider
  - Creato AddressAutocompleteSimple come fallback
  - Sistema stabilizzato

- **[11-fix-checkbox-conformita.md](REPORT-SESSIONI/2025-09-11-fix-checkbox-conformita.md)** 🆕  
  - Fix checkbox privacy non funzionanti
  - Verifica conformità specifiche progetto
  - TailwindCSS, Heroicons, React Query

- **[11-aggiornamento-documentazione-sistema.md](REPORT-SESSIONI/2025/09-settembre/11-aggiornamento-documentazione-sistema.md)**
  - Aggiornamento massiccio documentazione
  - Scoperte 85+ tabelle database
  - Creati documenti QUICK-REFERENCE e PIANO-MIGLIORAMENTO
  - Identificate mancanze documentazione

---

## 📌 DOCUMENTAZIONE ATTUALE

### 00-ESSENZIALI 🔴
**File critici da leggere SEMPRE prima di iniziare qualsiasi lavoro**

#### 📍 File nella ROOT del progetto:
- **[ISTRUZIONI-PROGETTO.md](../ISTRUZIONI-PROGETTO.md)** ⚠️
  - Regole tecniche VINCOLANTI
  - Pattern obbligatori
  - Stack tecnologico consolidato
  - Errori comuni da evitare

- **[README.md](../README.md)**
  - Overview generale del progetto
  - Quick start
  - Informazioni base

- **[CHANGELOG.md](../CHANGELOG.md)**
  - Storia delle modifiche v4.3.1
  - Versioni rilasciate
  - Breaking changes

#### 📁 File in questa sezione:
- **[QUICK-REFERENCE.md](ATTUALE/00-ESSENZIALI/QUICK-REFERENCE.md)** 🆕
  - Riferimento rapido sistema
  - Numeri chiave verificati
  - Comandi essenziali
  - Tech stack completo

- **[ARCHITETTURA-SISTEMA-COMPLETA.md](ATTUALE/00-ESSENZIALI/ARCHITETTURA-SISTEMA-COMPLETA.md)** ✅
  - Architettura completa v4.3.0
  - 85+ tabelle database documentate
  - Tutti i 15+ sistemi mappati
  - Verificata con analisi codice

- **[CHECKLIST-FUNZIONALITA-SISTEMA.md](ATTUALE/00-ESSENZIALI/CHECKLIST-FUNZIONALITA-SISTEMA.md)** ✅
  - Stato reale di TUTTE le funzionalità
  - 85+ tabelle mappate per categoria
  - Problemi noti e mancanze
  - Aggiornato alla v4.3.0

- **[PIANO-MIGLIORAMENTO-DOCUMENTAZIONE.md](ATTUALE/00-ESSENZIALI/PIANO-MIGLIORAMENTO-DOCUMENTAZIONE.md)** 🆕
  - Roadmap documentazione mancante
  - Timeline 4 settimane
  - Template per nuovi documenti
  - KPI e metriche successo

- **[COLLEGAMENTI.md](ATTUALE/00-ESSENZIALI/COLLEGAMENTI.md)**
  - Collegamenti ai file nella root
  - Spiegazione della struttura

### 01-ARCHITETTURA 🏗️
**Documentazione tecnica dell'architettura**

- **[RESPONSEFORMATTER.md](ATTUALE/01-ARCHITETTURA/RESPONSEFORMATTER.md)** 🔥
  - Pattern CRITICO del sistema
  - Regole di utilizzo
  - Esempi corretti vs sbagliati

- **Database**
  - Schema completo Prisma
  - Relazioni tra tabelle
  - Best practices query

- **Backend**
  - Struttura Express/TypeScript
  - Services e Routes
  - Middleware e Security

- **Frontend**
  - Componenti React
  - State management
  - Routing

- **Integrazioni**
  - Google Maps
  - OpenAI
  - Stripe
  - Brevo Email

### 02-FUNZIONALITÀ 🚀
**Documentazione per ogni feature del sistema**

#### **Registrazione** 👤 🆕
- **[PIANO-REGISTRAZIONE-MIGLIORATA.md](ATTUALE/PIANO-REGISTRAZIONE-MIGLIORATA.md)**
  - Sistema differenziato CLIENT/PROFESSIONAL
  - Form avanzati con validazione Zod
  - Gestione dati aziendali completi
  - Privacy e consensi tracciati

#### **Notifiche** 📔
- Sistema completo email + in-app
- Template personalizzabili
- WebSocket real-time

#### **Preventivi** 💰
- Versioning automatico
- Calcolo costi
- Accettazione/rifiuto

#### **Rapporti Intervento** 📋
- Template personalizzabili
- Firma digitale
- Export PDF

#### **Chat** 💬
- Real-time con Socket.io
- File sharing
- Storia conversazioni

#### **Health Check** 🏥
- Monitoraggio automatico
- Auto-remediation
- Dashboard admin

#### **Audit Log** 📊
- Tracciamento completo
- Dashboard analytics
- Export reports

#### **Backup System** 💾
- Backup automatici
- Retention policy
- Recovery points

### 03-API 🔌
**Documentazione completa delle API**

- Endpoints REST (70+)
- WebSocket events
- Autenticazione JWT
- Rate limiting
- Response format

### 04-GUIDE 📖
**Guide pratiche per sviluppo**

- Setup ambiente
- Sviluppo locale
- Testing
- Deployment
- Best practices

### 05-TROUBLESHOOTING 🔧
**Soluzioni a problemi comuni**

- Errori frequenti
- Fix conosciuti
- Debug tips
- Performance tuning

---

## 📝 REPORT SESSIONI

### Struttura Report
I report sono organizzati per anno e mese:

```
REPORT-SESSIONI/
├── 2024/
│   ├── 08-agosto/     # Sviluppo iniziale
│   ├── 09-settembre/  # Implementazioni core
│   └── 12-dicembre/   # Features avanzate
└── 2025/
    └── 01-gennaio/    # Ottimizzazioni e fix
```

### Report Recenti Importanti

#### Settembre 2025 (Report Spostati da root)
- **11-gestione-documentazione** - Riorganizzazione completa documentazione
- **09-cleanup-fix** - Fix pulizia sistema
- **09-tab-documentazione** - Documentazione tab sistema
- **Health Check Reports** (vari) - Spostati in ARCHIVIO/report-vari/

#### Gennaio 2025
- **07-sistema-interventi-multipli-COMPLETO** - Sistema pianificazione interventi
- **07-implementazione-audit-log** - Sistema audit completo
- **06-gestione-utenti-super-professionale** - Gestione utenti avanzata

#### Dicembre 2024
- **31-implementazione-modifica-cancellazione-preventivi** - CRUD preventivi

#### Settembre 2024
- **07-audit-log-complete** - Prima implementazione audit
- **09-sistema-backup-v2** - Sistema backup migliorato

#### Agosto 2024
- **31-sistema-notifiche-debug** - Debug sistema notifiche
- **30-google-maps-implementation-complete** - Integrazione Maps

---

## 📦 ARCHIVIO

L'archivio contiene:

- **Versioni precedenti** (v1.0, v2.0, v3.0)
- **Piani di sviluppo** storici
- **Fix e workaround** obsoleti
- **Documentazione superata** ma consultabile

---

## 🔍 COME NAVIGARE

### Per iniziare un nuovo lavoro:
1. Leggere **ISTRUZIONI-PROGETTO.md**
2. Consultare **CHECKLIST-FUNZIONALITA**
3. Verificare la sezione specifica in **02-FUNZIONALITÀ**

### Per risolvere un problema:
1. Controllare **05-TROUBLESHOOTING**
2. Cercare nei **REPORT-SESSIONI** recenti
3. Verificare l'**ARCHIVIO** per soluzioni passate

### Per capire l'architettura:
1. Studiare **ARCHITETTURA-SISTEMA-COMPLETA**
2. Esplorare **01-ARCHITETTURA**
3. Consultare **03-API** per i dettagli

---

## ⚠️ NOTE IMPORTANTI

1. **NUOVA REGOLA (v4.2)**: Solo 4 file .md possono stare nella root:
   - ISTRUZIONI-PROGETTO.md
   - README.md 
   - CHANGELOG.md
   - LEGGIMI-DOCUMENTAZIONE.md
   **TUTTI GLI ALTRI** devono essere in DOCUMENTAZIONE/

2. **Le date nei file potrebbero essere sbagliate** - Verificare sempre il contenuto
3. **I file in ATTUALE sono quelli validi** - Usare sempre questi per sviluppo
4. **L'ARCHIVIO è solo per riferimento** - Non basarsi su documentazione archiviata
5. **Ogni sessione deve creare un report** - In REPORT-SESSIONI con data corretta

---

## 🔄 Manutenzione Documentazione

### Regole v4.2 (VINCOLANTI):
- **❌ MAI salvare .md nella root** (eccetto i 4 autorizzati)
- **✅ SEMPRE in DOCUMENTAZIONE/** per nuovi documenti
- **📁 Report sessioni** in REPORT-SESSIONI/YYYY-MM-DD-descrizione.md
- **🔄 Aggiornare INDEX.md** quando si aggiunge documentazione

### Workflow:
- **Aggiornare sempre** i file in ATTUALE dopo modifiche
- **Non modificare** i file in ARCHIVIO
- **Creare report** per ogni sessione di lavoro
- **Consolidare duplicati** periodicamente
- **Verificare link** che non siano rotti

### Script di controllo:
- `./scripts/pre-commit-check.sh` - Verifica struttura documentazione
- `./scripts/validate-work.sh` - Controlla file .md nella posizione corretta

---

**Fine Indice** - Per domande consultare ISTRUZIONI-PROGETTO.md
