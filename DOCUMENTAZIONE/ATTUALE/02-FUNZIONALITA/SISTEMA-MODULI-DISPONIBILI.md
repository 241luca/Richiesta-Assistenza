# 📦 Sistema Moduli - Moduli Disponibili v1.0

**Versione**: 1.0.0  
**Totale Moduli**: 66  
**Categorie**: 9  
**Data**: 05/10/2025

## 🎯 Overview Sistema Moduli

Il sistema di gestione moduli permette di abilitare/disabilitare funzionalità del sistema in modo granulare. Ogni modulo rappresenta una funzionalità specifica e può avere dipendenze da altri moduli.

### Caratteristiche Principali
- **66 moduli** organizzati in 9 categorie
- **Sistema dipendenze** per controlli di sicurezza
- **12 moduli CORE** non disabilitabili
- **Settings configurabili** per ogni modulo
- **Tracking modifiche** completo con ModuleHistory
- **UI pronta** con icon, colori e ordinamento

---

## 🔴 CORE - Funzioni Essenziali (6 moduli)

Moduli fondamentali del sistema che non possono essere disabilitati.

### auth
- **Nome**: Autenticazione Base
- **Descrizione**: Login JWT, refresh token, session management
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Config**: `jwtExpiry: 30 giorni, sessionDuration: 24 ore`

### auth-2fa
- **Nome**: Autenticazione 2FA
- **Descrizione**: 2FA TOTP con Speakeasy, codici backup
- **Status**: ✅ Attivo
- **Dipendenze**: auth
- **Features**: TOTP, backup codes, recovery

### users
- **Nome**: Gestione Utenti
- **Descrizione**: 4 ruoli: CLIENT, PROFESSIONAL, ADMIN, SUPER_ADMIN
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: RBAC, profili, gestione ruoli

### profiles
- **Nome**: Profili Utente
- **Descrizione**: Profili dettagliati con campi professionali
- **Status**: ✅ Attivo
- **Dipendenze**: users
- **Features**: Profili professionali, skills, certificazioni

### security
- **Nome**: Sistema Sicurezza
- **Descrizione**: Account lockout, login history, IP tracking
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: Lockout progressivo, IP tracking, audit

### session-management
- **Nome**: Session Management
- **Descrizione**: Session Redis con multi-device support
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: auth
- **Features**: Redis sessions, multi-device, logout remoto

---

## 🟢 BUSINESS - Logica Business (8 moduli)

Moduli per la gestione del business principale del sistema.

### requests
- **Nome**: Richieste Assistenza
- **Descrizione**: Sistema completo gestione richieste, 6 stati, 4 priorità
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: users, categories
- **Features**: Workflow completo, stati, priorità, allegati

### request-workflow
- **Nome**: Workflow Richieste
- **Descrizione**: Assegnazione manuale/automatica, filtri avanzati
- **Status**: ✅ Attivo
- **Dipendenze**: requests
- **Features**: Auto-assegnazione, filtri, notifiche

### quotes
- **Nome**: Sistema Preventivi
- **Descrizione**: Quote builder drag-drop, items illimitati, versioning
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: requests
- **Features**: Builder, versioning, accettazione, PDF

### quote-templates
- **Nome**: Template Preventivi
- **Descrizione**: 20+ template predefiniti per categoria
- **Status**: ✅ Attivo
- **Dipendenze**: quotes
- **Features**: Template riutilizzabili, categorizzati

### quotes-advanced
- **Nome**: Preventivi Avanzati
- **Descrizione**: Confronto preventivi, scaglioni km, deposit rules
- **Status**: ✅ Attivo
- **Dipendenze**: quotes
- **Features**: Confronto, scaglioni, acconti

### categories
- **Nome**: Categorie e Sottocategorie
- **Descrizione**: Gestione gerarchica categorie servizi
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: Gerarchia, filtri, organizzazione

### calendar
- **Nome**: Calendario Interventi
- **Descrizione**: Calendario con Google Calendar sync bidirezionale
- **Status**: ✅ Attivo
- **Dipendenze**: requests
- **Features**: Vista calendario, Google sync, conflict detection

### scheduled-interventions
- **Nome**: Interventi Programmati
- **Descrizione**: Scheduling, conferme cliente, conflict detection
- **Status**: ✅ Attivo
- **Dipendenze**: calendar, requests
- **Features**: Scheduling, conferme, tracking durata

---

## 💳 PAYMENTS - Gestione Pagamenti (5 moduli)

Moduli per la gestione completa dei pagamenti e fatturazione.

### payments
- **Nome**: Sistema Pagamenti
- **Descrizione**: Stripe integration, 11 tabelle DB, gestione completa
- **Status**: ✅ Attivo
- **Dipendenze**: quotes
- **Config**: `provider: stripe, testMode: true, currency: EUR`
- **Features**: Stripe, webhooks, multi-metodo

### invoices
- **Nome**: Sistema Fatturazione
- **Descrizione**: Fatture automatiche, numerazione progressiva
- **Status**: ✅ Attivo
- **Dipendenze**: payments
- **Features**: Fatture automatiche, numerazione, PDF

### payouts
- **Nome**: Payout Professionisti
- **Descrizione**: Gestione pagamenti ai professionisti, schedule automatici
- **Status**: ✅ Attivo
- **Dipendenze**: payments
- **Features**: Payout automatici, scheduling, tracking

### payment-splits
- **Nome**: Payment Splitting
- **Descrizione**: Divisione automatica pagamenti con commissioni
- **Status**: ❌ Disabilitato (Premium feature)
- **Dipendenze**: payments
- **Features**: Split automatico, commissioni configurabili

### refunds
- **Nome**: Sistema Rimborsi
- **Descrizione**: Gestione rimborsi totali e parziali
- **Status**: ✅ Attivo
- **Dipendenze**: payments
- **Features**: Rimborsi parziali/totali, tracking, motivi

---

## 💬 COMMUNICATION - Comunicazione (9 moduli)

Moduli per tutti i canali di comunicazione del sistema.

### notifications
- **Nome**: Sistema Notifiche
- **Descrizione**: 8 modelli DB, 4 canali: Email, WebSocket, In-app, WhatsApp
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: Multi-canale, template, priorità

### notification-templates
- **Nome**: Template Notifiche
- **Descrizione**: Template Editor WYSIWYG, 50+ eventi trigger
- **Status**: ✅ Attivo
- **Dipendenze**: notifications
- **Features**: Editor WYSIWYG, variabili dinamiche

### notification-queue
- **Nome**: Queue Management
- **Descrizione**: Priorità, scheduling, retry logic
- **Status**: ✅ Attivo
- **Dipendenze**: notifications
- **Features**: Queue, retry, scheduling, priorità

### chat
- **Nome**: Chat Real-time
- **Descrizione**: WebSocket Socket.io, messaggi per richiesta
- **Status**: ✅ Attivo
- **Dipendenze**: requests
- **Features**: Real-time, WebSocket, allegati

### chat-advanced
- **Nome**: Chat Avanzata
- **Descrizione**: File sharing, read receipts, typing indicators
- **Status**: ✅ Attivo
- **Dipendenze**: chat
- **Features**: File sharing, read receipts, typing

### email-system
- **Nome**: Sistema Email
- **Descrizione**: Brevo integration, template personalizzati
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: Brevo, template, tracking delivery

### whatsapp
- **Nome**: WhatsApp Business
- **Descrizione**: WppConnect locale, QR pairing, messaggi/gruppi
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Config**: `provider: wppconnect, sessionName: default, autoReconnect: true`
- **Features**: QR pairing, messaggi, media

### whatsapp-groups
- **Nome**: WhatsApp Gruppi
- **Descrizione**: Gestione gruppi, broadcast lists, admin
- **Status**: ✅ Attivo
- **Dipendenze**: whatsapp
- **Features**: Gruppi, broadcast, amministrazione

### whatsapp-media
- **Nome**: WhatsApp Media
- **Descrizione**: Invio immagini, PDF, audio con compressione
- **Status**: ✅ Attivo
- **Dipendenze**: whatsapp
- **Features**: Media upload, compressione, formati multipli

---

## 🤖 ADVANCED - Funzioni Avanzate (10 moduli)

Moduli per funzionalità avanzate e premium del sistema.

### reviews
- **Nome**: Sistema Recensioni
- **Descrizione**: Recensioni 1-5 stelle, commenti, rating medio
- **Status**: ✅ Attivo
- **Dipendenze**: requests
- **Features**: Rating 1-5, commenti, media recensioni

### portfolio
- **Nome**: Portfolio Lavori
- **Descrizione**: Foto prima/dopo, gallery professionisti
- **Status**: ✅ Attivo
- **Dipendenze**: requests
- **Features**: Prima/dopo, gallery, showcase lavori

### certifications
- **Nome**: Certificazioni
- **Descrizione**: Badge certificazioni professionisti verificate
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: Badge verificati, scadenze, validazione

### verified-badge
- **Nome**: Badge Verificato
- **Descrizione**: Sistema verifica professionisti, documenti, background check
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: Verifica documenti, background check, badge

### ai-assistant
- **Nome**: AI Assistant
- **Descrizione**: Chat AI dual config (Professional + Client)
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Config**: `provider: openai, defaultModel: gpt-3.5-turbo, maxTokens: 2048`
- **Features**: GPT integration, dual config, knowledge base

### ai-categorization
- **Nome**: AI Auto-Categorization
- **Descrizione**: Categorizzazione automatica richieste con GPT
- **Status**: ✅ Attivo
- **Dipendenze**: ai-assistant, requests
- **Features**: Auto-categorizzazione, learning, accuracy

### ai-knowledge-base
- **Nome**: Knowledge Base AI
- **Descrizione**: 10k+ documenti indicizzati, embeddings
- **Status**: ✅ Attivo
- **Dipendenze**: ai-assistant
- **Features**: Embeddings, search semantico, 10k+ docs

### referral
- **Nome**: Sistema Referral
- **Descrizione**: Invita amico, codici referral, rewards
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: Codici referral, tracking, rewards

### loyalty-points
- **Nome**: Punti Fedeltà
- **Descrizione**: Sistema punti, transazioni, rewards
- **Status**: ✅ Attivo
- **Dipendenze**: referral
- **Features**: Punti, transazioni, catalogo premi

### price-range
- **Nome**: Range Prezzi Indicativi
- **Descrizione**: Calcolo automatico range prezzi da storico
- **Status**: ✅ Attivo
- **Dipendenze**: quotes
- **Features**: Range automatico, machine learning prezzi

---

## 📊 REPORTING - Report e Analytics (7 moduli)

Moduli per la generazione di report e analytics.

### intervention-reports
- **Nome**: Rapporti di Intervento
- **Descrizione**: 15+ modelli DB, template builder, 50+ campi
- **Status**: ✅ Attivo
- **Dipendenze**: requests
- **Features**: Template builder, 50+ campi, PDF

### report-templates
- **Nome**: Template Rapporti
- **Descrizione**: 10 tipi intervento, sezioni personalizzabili
- **Status**: ✅ Attivo
- **Dipendenze**: intervention-reports
- **Features**: 10 tipi, sezioni custom, drag-drop

### report-materials
- **Nome**: Catalogo Materiali
- **Descrizione**: 500+ materiali con prezzi, codici
- **Status**: ✅ Attivo
- **Dipendenze**: intervention-reports
- **Features**: 500+ materiali, prezzi, codici, barcode

### report-signatures
- **Nome**: Firma Digitale
- **Descrizione**: Firma touch/mouse con timestamp
- **Status**: ✅ Attivo
- **Dipendenze**: intervention-reports
- **Features**: Touch/mouse, timestamp, validità legale

### report-export
- **Nome**: Export PDF Rapporti
- **Descrizione**: PDF A4 con intestazione, logo, watermark
- **Status**: ✅ Attivo
- **Dipendenze**: intervention-reports
- **Features**: PDF A4, logo, watermark, brand

### analytics
- **Nome**: Analytics & KPI
- **Descrizione**: 20+ metriche, dashboard real-time
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: 20+ KPI, real-time, grafici

### reports-scheduled
- **Nome**: Report Automatici
- **Descrizione**: Email report giornalieri/settimanali
- **Status**: ✅ Attivo
- **Dipendenze**: analytics
- **Features**: Scheduling, email automatiche, formati

---

## ⚙️ AUTOMATION - Automazione (6 moduli)

Moduli per l'automazione e manutenzione del sistema.

### backup-system
- **Nome**: Sistema Backup
- **Descrizione**: 6 tipi backup, scheduling, encryption AES-256
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: 6 tipi, encryption, compression

### backup-scheduling
- **Nome**: Backup Scheduling
- **Descrizione**: Cron scheduling, retention automatica
- **Status**: ✅ Attivo
- **Dipendenze**: backup-system
- **Features**: Cron, retention, cleanup automatico

### cleanup-system
- **Nome**: Sistema Cleanup
- **Descrizione**: 8 modelli DB, pattern matching, exclude rules
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: Pattern matching, exclude rules, safety

### cleanup-scheduling
- **Nome**: Cleanup Automatico
- **Descrizione**: Cron scheduling pulizia automatica
- **Status**: ✅ Attivo
- **Dipendenze**: cleanup-system
- **Features**: Scheduling automatico, dry-run, sicurezza

### scheduler
- **Nome**: Sistema Scheduler
- **Descrizione**: Cron jobs, notifiche automatiche, security jobs
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: Cron jobs, notifiche auto, security

### queue-system
- **Nome**: Bull Queue
- **Descrizione**: Queue operazioni asincrone, 5 worker paralleli
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: Bull Queue, Redis, worker paralleli

---

## 🔗 INTEGRATIONS - Integrazioni (5 moduli)

Moduli per integrazioni con servizi esterni.

### google-maps
- **Nome**: Google Maps
- **Descrizione**: Places, Geocoding, Directions, Distance Matrix
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Config**: `provider: google, cacheEnabled: true, cacheTTL: 86400`
- **Features**: Full API Google Maps, cache, optimization

### google-calendar
- **Nome**: Google Calendar
- **Descrizione**: Sync bidirezionale calendario
- **Status**: ✅ Attivo
- **Dipendenze**: calendar
- **Features**: Sync bidirezionale, OAuth, eventi

### stripe
- **Nome**: Stripe Payments
- **Descrizione**: Gateway pagamenti, webhook
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Config**: `testMode: true, webhookSecret: null`
- **Features**: Gateway completo, webhook, SCA

### brevo-email
- **Nome**: Brevo Email Service
- **Descrizione**: SMTP email service provider
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: SMTP, template, delivery tracking

### openai
- **Nome**: OpenAI API
- **Descrizione**: GPT models, embeddings
- **Status**: ✅ Attivo
- **Dipendenze**: ai-assistant
- **Features**: GPT-4, embeddings, fine-tuning

---

## 🛠️ ADMIN - Amministrazione (10 moduli)

Moduli per l'amministrazione e gestione del sistema.

### admin-dashboard
- **Nome**: Dashboard Admin
- **Descrizione**: 15+ tab organizzate per funzione
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: 15+ tab, organizzazione, overview

### user-management
- **Nome**: Gestione Utenti Admin
- **Descrizione**: CRUD utenti, role management
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: CRUD completo, ruoli, bulk actions

### system-settings
- **Nome**: System Settings
- **Descrizione**: 50+ configurazioni sistema
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: 50+ settings, validazione, backup

### script-manager
- **Nome**: Script Manager
- **Descrizione**: Esecuzione sicura script sistema
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: Esecuzione sicura, logs, timeout

### health-monitor
- **Nome**: Health Monitor
- **Descrizione**: 15 moduli monitorati, check ogni 5min
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: 15 moduli, auto-remediation, alerts

### audit-log
- **Nome**: Audit Log System
- **Descrizione**: 40+ azioni tracciate, compliance GDPR
- **Status**: ✅ Attivo, 🔒 CORE
- **Dipendenze**: Nessuna
- **Features**: 40+ azioni, GDPR, retention

### api-keys
- **Nome**: API Keys Management
- **Descrizione**: Gestione chiavi API, rate limiting
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: CRUD keys, rate limiting, scadenze

### legal-documents
- **Nome**: Documenti Legali
- **Descrizione**: Privacy policy, terms, cookie policy, versioning
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: Versioning, approval workflow, tracking

### enum-manager
- **Nome**: Enum Manager
- **Descrizione**: Gestione configurazioni sistema
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: Enum configurabili, validazione, UI

### test-history
- **Nome**: Test History
- **Descrizione**: Tracking esecuzione test, coverage 75%
- **Status**: ✅ Attivo
- **Dipendenze**: Nessuna
- **Features**: Tracking test, coverage, report

---

## 🎯 Matrice Dipendenze Completa

```
🔴 CORE
auth
├── auth-2fa
└── session-management

users
└── profiles

security (standalone)

🟢 BUSINESS
categories (standalone)

requests
├── request-workflow
├── chat
│   └── chat-advanced
└── scheduled-interventions (also depends on calendar)

quotes
├── quote-templates
├── quotes-advanced
├── payments
│   ├── invoices
│   ├── payouts
│   ├── payment-splits
│   └── refunds
└── price-range

calendar
└── scheduled-interventions

💬 COMMUNICATION
notifications
├── notification-templates
└── notification-queue

email-system (standalone)

whatsapp
├── whatsapp-groups
└── whatsapp-media

🤖 ADVANCED
reviews (depends on requests)
portfolio (depends on requests)
certifications (standalone)
verified-badge (standalone)

ai-assistant
├── ai-categorization (also depends on requests)
└── ai-knowledge-base

referral
└── loyalty-points

📊 REPORTING
intervention-reports (depends on requests)
├── report-templates
├── report-materials
├── report-signatures
└── report-export

analytics
└── reports-scheduled

⚙️ AUTOMATION
backup-system
└── backup-scheduling

cleanup-system
└── cleanup-scheduling

scheduler (standalone)
queue-system (standalone)

🔗 INTEGRATIONS
google-maps (standalone)
google-calendar (depends on calendar)
stripe (standalone)
brevo-email (standalone)
openai (depends on ai-assistant)

🛠️ ADMIN
admin-dashboard (standalone)
user-management (standalone)
system-settings (standalone)
script-manager (standalone)
health-monitor (standalone)
audit-log (standalone)
api-keys (standalone)
legal-documents (standalone)
enum-manager (standalone)
test-history (standalone)
```

---

## 📋 Checklist Abilitazione per Deployment

### ✅ Configurazione Minima (Sistema Base)
**Moduli Obbligatori CORE (sempre attivi):**
- auth, users, security, session-management
- requests, quotes, categories
- notifications, email-system
- backup-system, scheduler, queue-system
- admin-dashboard, user-management, system-settings, health-monitor, audit-log

### 🔧 Configurazione Tipica Produzione
**Aggiungere ai CORE:**
- auth-2fa (sicurezza)
- request-workflow (automazione)
- quote-templates (efficienza)
- notification-templates (comunicazione)
- intervention-reports (documenti)
- analytics (metriche)

### 🚀 Configurazione Enterprise Completa
**Tutti i 66 moduli attivi** per funzionalità complete.

### 🎛️ Configurazione Custom
Abilitare solo moduli necessari per caso d'uso specifico seguendo la matrice dipendenze.

---

## 🔧 Settings Predefiniti per Configurazione

### 🔑 API Keys da Configurare
- `google-maps.api_key` - Google Maps API Key
- `ai-assistant.openai_api_key` - OpenAI API Key  
- `stripe.secret_key` - Stripe Secret Key
- `stripe.webhook_secret` - Stripe Webhook Secret

### ⚙️ Settings Configurabili
- `whatsapp.qr_refresh_interval` - Intervallo refresh QR (30000ms)
- `backup-system.retention_days` - Giorni retention backup (30)
- `reviews.min_reviews_for_rating` - Min recensioni rating (5)
- `google-maps.cache_ttl` - Cache TTL geocoding (86400s)

---

**Ultimo aggiornamento**: 05/10/2025  
**Verificato**: ✅ Database seeded con 66 moduli  
**Prossimo step**: Implementazione backend service  
**Status**: 🚀 Pronto per sviluppo service layer
