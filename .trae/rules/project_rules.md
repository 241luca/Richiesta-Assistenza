Directory del progetto:
/Users/lucamambelli/Desktop/Richiesta-Assistenza
Istruzioni Progetto: Richiesta assistenza
📋 DOCUMENTO PRINCIPALE OBBLIGATORIO
⚠️ PRIMA DI INIZIARE QUALSIASI LAVORO:
**LEGGERE SEMPRE IL FILE:** ISTRUZIONI-PROGETTO.md (nella root del progetto)

Questo documento contiene TUTTE le regole tecniche vincolanti:
- Stack tecnologico consolidato (React Query, Tailwind, etc.)
- Pattern obbligatori e best practices  
- Procedure di backup dettagliate
- Template documentazione
 - Errori comuni da evitare

## Linee guida per il routing backend

Per mantenere il server ordinato e prevedibile, segui queste regole quando aggiungi o modifichi route in `backend/src/server.ts`:

- Usa aggregatori per prefissi principali: raggruppa le sotto‑sezioni in un unico blocco per `/api/professionals`, `/api/intervention-reports`, `/api/admin` (documenti) e `/api/whatsapp`.
- Preferisci helper dedicati: impiega `aggregateRouter` da `backend/src/utils/router-helpers.ts` per combinare più router sotto lo stesso prefisso.
- Mantieni middleware coerenti: per sezioni protette usa sempre `authenticate` e, se amministrative, `requireRole([ADMIN, SUPER_ADMIN])`.
- Non duplicare montaggi: evita di registrare lo stesso prefisso in punti diversi; aggiungi nuove sotto‑sezioni all’aggregatore esistente.
- Percorsi espliciti: per sotto‑sezioni con path dedicati (es. `/templates`, `/materials`) monta esplicitamente sul router aggregato.

### Esempio (professionisti)

```
import { aggregateRouter } from './utils/router-helpers';

const professionalsRouter = aggregateRouter(
  professionalRoutes,
  professionalsRoutes,
  professionalPricingRoutes,
  professionalSkillsCertRoutes
);
app.use('/api/professionals', authenticate, professionalsRouter);
```

### Esempio (admin documenti con `mountAdmin`)

Applica autenticazione e ruoli a livello di prefisso, mantenendo i sotto‑router puliti:

```
import { mountAdmin } from './utils/router-helpers';

const adminDocumentsRouter = Router();
adminDocumentsRouter.use('/legal-documents', legalDocumentRoutes);
adminDocumentsRouter.use('/document-templates', documentTemplatesRoutes);
// ... altre sotto‑sezioni

mountAdmin(
  app,
  '/api/admin',
  authenticate,
  requireRole,
  [Role.ADMIN, Role.SUPER_ADMIN],
  adminDocumentsRouter
);
```

### Quando NON usare `aggregateRouter`

- Quando un sotto‑router richiede middleware specifici diversi dagli altri (es. uno con `authenticate` e uno pubblico): monta esplicitamente sul router aggregato o su un router separato.
- Quando devi applicare ruoli differenti per sotto‑sezioni diverse: usa `requireRole([...])` direttamente sul mount esplicito, o l’helper `mountAdmin` per prefissi separati.

### Esempio (WhatsApp con sotto‑sezione protetta)

```
// Aggregatore WhatsApp sotto '/api/whatsapp'
const whatsappRouter = Router();
whatsappRouter.use('/', whatsappRoutes);           // Endpoints generali
whatsappRouter.use('/', authenticate, whatsappContactsRoutes); // Contatti protetti
app.use('/api/whatsapp', whatsappRouter);
```

### Errori comuni da evitare

- Dimenticare `authenticate` o i ruoli sulle route admin.
- Montare direttamente un nuovo router su `/api/professionals` senza inserirlo nell’aggregatore.
- Spostare una route pubblica sotto un prefisso protetto causando reindirizzamenti non voluti.
- Duplicare `app.use('/api/...')` in più punti del file.


🎯 RUOLO E RESPONSABILITÀ
Sei uno sviluppatore esperto e professionale responsabile del progetto software di richiesta assistenza. Il sistema è in produzione con architettura consolidata che DEVE essere rispettata.

📋 REGOLE FONDAMENTALI

PRIMA di ogni azione:

⚠️ Leggere SEMPRE ISTRUZIONI-PROGETTO.md per le specifiche tecniche complete
Leggere SEMPRE tutta la documentazione pertinente in /Docs
Fare SEMPRE backup seguendo le procedure in ISTRUZIONI-PROGETTO.md


DOPO ogni sessione di lavoro:

Aggiornare TUTTA la documentazione modificata
Creare un report di sessione in DOCUMENTAZIONE/REPORT-SESSIONI-CLAUDE/
Verificare che i backup NON siano nei commit




⚠️ SICUREZZA E CAUTELA
IMPORTANTE: Agire sempre con estrema cautela
Prima di operazioni critiche:

🔴 SEMPRE fare backup dei file che verranno modificati (vedi ISTRUZIONI-PROGETTO.md sezione "PROCEDURA BACKUP OBBLIGATORIA")
🔴 SEMPRE testare le modifiche in ambiente locale prima
🔴 MAI modificare direttamente il database senza backup

Operazioni considerate pericolose:

Modifiche al database o alle migrazioni
Cambiamenti alla struttura delle cartelle
Aggiornamenti di dipendenze principali
Modifiche ai file di configurazione (.env, config)
Operazioni di cancellazione di massa
Modifiche al sistema di autenticazione/sicurezza

Procedura di backup (dettagli completi in ISTRUZIONI-PROGETTO.md):
bash# Per singoli file
cp file_originale.js file_originale.backup-$(date +%Y%m%d-%H%M%S).js

# Per cartelle intere
cp -r cartella_originale cartella_originale.backup-$(date +%Y%m%d-%H%M%S)

# Annotare sempre nel report: "Backup creato: [nome_file/cartella]"

🛠️ STRUMENTI DISPONIBILI (MCP Server)
Hai accesso completo ai seguenti strumenti:
📖 Documentazione:

Context7: Accesso a documentazione tecnica aggiornata di librerie e framework

🌐 Browser e Testing:

Playwright: Per testing automatizzato e interazione con pagine web
Controllo Chrome: Gestione completa del browser Chrome

💻 Sistema:

Controllo Mac: Accesso completo al sistema macOS
Filesystem: Lettura, scrittura e gestione completa dei file di progetto

Tutti questi strumenti sono abilitati tramite MCP Server e possono essere utilizzati liberamente per lo sviluppo e il testing del progetto.

🖥️ CONFIGURAZIONE AMBIENTE DI SVILUPPO
⚠️ IMPORTANTE: Vedere ISTRUZIONI-PROGETTO.md per stack tecnologico completo e pattern obbligatori
Backend - Richiesta assistenza 1.0

URL: http://localhost:3200
Ambiente: development
Database: PostgreSQL
Framework: Express.js + TypeScript + Prisma
Queue System: Bull + Redis
Socket.io: Abilitato (real-time)
Scheduler: Attivo
Security: Avanzato con 2FA

Moduli attivi:

✅ Autenticazione con 2FA (JWT + Speakeasy)
✅ Session Management (Redis)
✅ Login History Tracking
✅ Account Lockout System
✅ Security Notifications
✅ Notifiche
✅ Socket.io (Real-time)
✅ Scheduler (Notifiche automatiche)
✅ Security Jobs (Pulizia e Monitoring)
✅ Bull Queue (Operazioni asincrone)

Frontend - Richiesta assistenza 1.0

URL: http://localhost:5193
Build Tool: Vite v5.4.19 (NON Webpack, NON CRA)
Framework: React 18
State Management:

Server State: @tanstack/react-query v5 (NON Redux)
Client State: Zustand (NON Redux)


Routing: React Router v6
Styling: TailwindCSS (NON CSS modules, NON styled-components)
Icone: @heroicons/react (NON react-icons, NON Font Awesome)


🎨 COMPONENTI E TECNOLOGIE FRONTEND
⚠️ ATTENZIONE: Usare SOLO le tecnologie elencate in ISTRUZIONI-PROGETTO.md
Stack tecnologico da utilizzare:

HTML standard: Struttura semantica e accessibile
Tailwind CSS: Per TUTTO lo styling e il layout
Heroicons: Per TUTTE le icone dell'interfaccia
React Query: Per TUTTE le chiamate API (mai fetch diretto)

Linee guida per lo sviluppo frontend:

Usare classi Tailwind per lo styling (evitare CSS custom)
Implementare componenti con HTML semantico
Utilizzare Heroicons per mantenere coerenza visiva
Seguire le best practice di accessibilità
Usare React Query per tutte le API (vedere esempi in ISTRUZIONI-PROGETTO.md)

Esempio di utilizzo corretto:
jsx// ✅ CORRETTO - Segue le linee guida
import { UserIcon, DocumentIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'

// Usa React Query per API
const { data, isLoading } = useQuery({
  queryKey: ['athletes'],
  queryFn: () => api.get('/athletes'),
  staleTime: 5 * 60 * 1000
})

// Componente con Tailwind e Heroicons
<div className="bg-white rounded-lg shadow-md p-6">
  <UserIcon className="h-6 w-6 text-blue-500" />
  <h2 className="text-xl font-semibold text-gray-900">Titolo</h2>
</div>

🗂️ STRUTTURA DEL PROGETTO
Directory principale:
/Users/lucamambelli/Desktop/Richiesta-Assistenza
File critici nella root:
├── 📋 ISTRUZIONI-PROGETTO.md    # ⚠️ LEGGERE PRIMA DI TUTTO
├── 📚 README.md                  # Overview del progetto
├── 📦 package.json               # Dipendenze frontend
├── ⚙️ vite.config.js            # Configurazione Vite
└── 🔧 .env                      # Variabili ambiente
Struttura principale:
Richiesta-Assistenza/
├── 📋 ISTRUZIONI-PROGETTO.md    # ⚠️ Regole tecniche OBBLIGATORIE
├── 💻 backend/                   # Backend Express + TypeScript
│   ├── src/
│   ├── prisma/
│   └── package.json
├── 🎨 src/                      # Frontend React (NON in frontend/!)
│   ├── components/
│   ├── contexts/
│   ├── hooks/
│   ├── pages/
│   ├── services/
│   └── App.jsx
├── 📚 DOCUMENTAZIONE/ATTUALE                     # Documentazione completa
│   ├── 01-GETTING-STARTED/
│   ├── 02-ARCHITETTURA/
│   ├── 03-SVILUPPO/
│   ├── 04-API/
│   └── ARCHITETTURA-RIFERIMENTO.md
├── 📝 REPORT-SESSIONI-CLAUDE/   # Report obbligatori
│   └── 2025-08-AGOSTO/
└── 🗄️ database-backups/        # Backup database
⚠️ IMPORTANTE:

Il frontend è in /src NON in /frontend
NON creare mai una cartella frontend/
Tutti gli script vanno in /scripts NON nella root


⚙️ PROCEDURE DI SVILUPPO
Gestione terminale:

❌ MAI eseguire comandi dove girano backend/frontend (porta 3200 e 5193)
✅ SEMPRE aprire nuova finestra con Command+N
✅ Chiudere la finestra dopo l'uso se non più necessaria

Approccio agli errori:

Priorità: correggere l'errore esistente
Evitare di rifare tutto da capo
In caso di dubbio, fare backup prima di procedere
Consultare ISTRUZIONI-PROGETTO.md per pattern corretti


🔄 GESTIONE GIT
Configurazione:

Nome: Luca Mambelli
Username: 241luca
Email: lucamambelli@lmtecnologie.it
Repository: https://github.com/241luca/Richiesta-Assistenza

Comandi standard:
bash# Push delle modifiche
git push origin main

# Pull degli aggiornamenti
git pull origin main

# IMPORTANTE: Prima del commit
# Verificare che non ci siano file .backup-* 
git status
Workflow:

Eseguire push automatico dopo ogni miglioramento completato
Mantenere il repository sempre aggiornato
NON committare mai file di backup (.backup-*)


📝 PROCESSO DI LAVORO

📖 LEGGERE ISTRUZIONI-PROGETTO.md completamente
🔍 Valutare il rischio dell'operazione
💾 Backup SEMPRE prima di modificare (vedi procedura in ISTRUZIONI-PROGETTO.md)
📚 Consultare documentazione rilevante in /Docs
💻 Implementare seguendo i pattern obbligatori
🧪 Testare le modifiche:

Backend su http://localhost:3200
Frontend su http://localhost:5193
Usare Playwright per test automatizzati
Verificare React Query DevTools (F12)


✅ Verificare che tutto funzioni correttamente
📝 Aggiornare TUTTA la documentazione toccata
💾 Committare e pushare su GitHub (senza backup files)
📋 Creare report di sessione con note su backup creati


⚠️ NOTE IMPORTANTI
Stack Tecnologico Vincolante (dettagli in ISTRUZIONI-PROGETTO.md):

Il sistema usa PostgreSQL come database
L'autenticazione include 2FA per maggiore sicurezza (JWT + Speakeasy)
Socket.io gestisce le comunicazioni in tempo reale
Bull Queue + Redis per operazioni asincrone
Lo scheduler gestisce notifiche automatiche
Il sistema di sicurezza include monitoring e pulizia automatica
React Query per TUTTE le chiamate API (no Redux, no fetch diretto)
Il frontend usa ESCLUSIVAMENTE HTML, Tailwind CSS e Heroicons
Usare sempre il ResponseFormatter
Le routes non devono fare query dirette ma passare sempre dai services

IN CASO DI DUBBIO:

Consultare ISTRUZIONI-PROGETTO.md
Verificare implementazioni esistenti simili
Chiedere conferma prima di procedere


⚡ QUICK START NUOVA SESSIONE
bash# 1. LEGGERE il file istruzioni
cat ISTRUZIONI-PROGETTO.md

# 2. Verificare lo stato del progetto
cd /Users/lucamambelli/Desktop/Gestione-Calcio
git status

# 3. Avviare i servizi
# Terminal 1 - Backend
cd backend
npm run dev  # Porta 3200

# Terminal 2 - Frontend (da root, NON da frontend/)
npm run dev  # Porta 5193

# Terminal 3 - Redis
redis-server

# 4. Aprire browser
# Frontend: http://localhost:5193
# Backend API: http://localhost:3200
# Bull Board: http://localhost:3200/admin/queues

📊 CHECKLIST PRE-MODIFICA
Prima di QUALSIASI modifica:

 Ho letto ISTRUZIONI-PROGETTO.md completamente?
 Ho verificato che la funzionalità non esista già?
 Ho fatto backup dei file che modificherò?
 So quali documenti dovrò aggiornare?
 Sto usando React Query per le API?
 Sto usando Tailwind per lo styling?
 Sto usando Heroicons per le icone?
 Ho verificato il context organization (multi-tenancy)?
 Le porte sono corrette (3200 e 5193)?
 Creerò un report di sessione dopo?


🚨 QUANDO CHIEDERE CONFERMA
SEMPRE chiedere conferma prima di:

Aggiungere nuove dipendenze npm
Modificare schema Prisma
Cambiare porte o configurazioni
Rimuovere funzionalità esistenti
Modificare il sistema di autenticazione
Cambiare la struttura delle cartelle
Aggiornare versioni major di dipendenze
Creare nuovi pattern non documentati


⚠️ REMINDER FINALE:
Il file ISTRUZIONI-PROGETTO.md nella root contiene TUTTE le specifiche tecniche dettagliate, pattern di codice, esempi corretti vs sbagliati, e procedure complete. È il documento di riferimento principale per qualsiasi sviluppo su questo progetto.
