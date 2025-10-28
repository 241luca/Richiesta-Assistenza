# 🔑 API KEYS MANAGEMENT - SmartDocs

Sistema completo di gestione API keys per SmartDocs con storage sicuro nel database.

---

## ✅ COSA È STATO IMPLEMENTATO

### 1. **Database Schema** (`scripts/add-api-keys-table.sql`)
- ✅ Tabella `smartdocs.api_keys` con:
  - Chiavi criptate
  - Metadata JSON
  - Timestamp validazione
  - Status attivo/inattivo
- ✅ Seed iniziale servizi supportati

### 2. **Backend Service** (`src/services/ApiKeyService.ts`)
- ✅ Crittografia/decrittografia chiavi (AES-256-CBC)
- ✅ Mascheramento chiavi per visualizzazione sicura
- ✅ CRUD completo (create, read, update, delete)
- ✅ Test validazione API keys:
  - OpenAI
  - Anthropic
  - Qdrant
- ✅ Tracking ultimo utilizzo e validazione

### 3. **API Routes** (`src/api/routes/api-keys.ts`)
- ✅ `GET /api/api-keys` - Lista tutte le keys
- ✅ `GET /api/api-keys/:service` - Dettaglio key
- ✅ `POST /api/api-keys` - Crea/aggiorna key
- ✅ `PUT /api/api-keys/:service` - Aggiorna key
- ✅ `DELETE /api/api-keys/:service` - Elimina key
- ✅ `POST /api/api-keys/:service/test` - Testa validità
- ✅ `POST /api/api-keys/:service/toggle` - Attiva/disattiva

### 4. **Frontend Web App** (`frontend/`)
- ✅ Interface HTML moderna con TailwindCSS
- ✅ JavaScript vanilla (no framework)
- ✅ Features:
  - Dashboard con cards servizi
  - Modal configurazione
  - Test API keys in real-time
  - Toggle attivo/inattivo
  - Visualizzazione sicura chiavi (masked)
  - Gestione metadata JSON
  - Alert system

---

## 🚀 SETUP

### 1. **Inizializza Database**

```bash
cd smartdocs

# Connetti al database SmartDocs
docker exec -i smartdocs-db psql -U smartdocs -d smartdocs < scripts/add-api-keys-table.sql
```

Oppure usa il client PostgreSQL:

```bash
psql -h localhost -p 5433 -U smartdocs -d smartdocs -f scripts/add-api-keys-table.sql
```

### 2. **Configura Environment**

Assicurati di avere in `.env`:

```bash
# Encryption key per API keys (IMPORTANTE: cambiala in produzione!)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Database URL (già configurato)
DATABASE_URL=postgresql://smartdocs:smartdocs_secure_pwd@localhost:5433/smartdocs
```

### 3. **Avvia Backend**

Il backend è già attivo se SmartDocs è running:

```bash
docker-compose up -d
```

Le routes API keys sono automaticamente disponibili su `http://localhost:3500/api/api-keys`

### 4. **Apri Frontend**

Semplicemente apri il file HTML nel browser:

```bash
# macOS
open smartdocs/frontend/index.html

# Linux
xdg-open smartdocs/frontend/index.html

# Windows
start smartdocs/frontend/index.html
```

Oppure usa un server locale:

```bash
cd smartdocs/frontend
python3 -m http.server 8080
# Poi apri: http://localhost:8080
```

---

## 📖 USO

### **Da Frontend Web**

1. Apri `frontend/index.html` nel browser
2. Vedi dashboard con tutti i servizi disponibili
3. Clicca "Configure" su un servizio
4. Inserisci la API key
5. (Opzionale) Aggiungi metadata JSON per configurazioni avanzate
6. Salva
7. Testa la key con il pulsante "Test" (se disponibile)

### **Da API**

#### Lista tutte le keys

```bash
curl http://localhost:3500/api/api-keys
```

#### Crea/Aggiorna key

```bash
curl -X POST http://localhost:3500/api/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "service": "OPENAI",
    "name": "OpenAI API",
    "key_value": "sk-your-api-key-here",
    "description": "OpenAI API for embeddings and chat",
    "is_active": true,
    "metadata": {
      "org_id": "org-..."
    }
  }'
```

#### Testa key

```bash
curl -X POST http://localhost:3500/api/api-keys/OPENAI/test
```

#### Toggle attivo/inattivo

```bash
curl -X POST http://localhost:3500/api/api-keys/OPENAI/toggle
```

#### Elimina key

```bash
curl -X DELETE http://localhost:3500/api/api-keys/OPENAI
```

### **Da Codice (Backend)**

```typescript
import { ApiKeyService } from './services/ApiKeyService';

const apiKeyService = new ApiKeyService();

// Ottieni key (decriptata)
const openaiKey = await apiKeyService.getByService('OPENAI', true);
console.log(openaiKey.key_value); // Chiave decriptata

// Crea/aggiorna
await apiKeyService.upsert({
  service: 'OPENAI',
  name: 'OpenAI API',
  key_value: 'sk-...',
  is_active: true
});

// Testa
const result = await apiKeyService.test('OPENAI');
console.log(result.message);

// Aggiorna ultimo utilizzo
await apiKeyService.updateLastUsed('OPENAI');
```

---

## 🔐 SICUREZZA

### **Crittografia**
- ✅ Tutte le chiavi sono criptate con AES-256-CBC
- ✅ IV random per ogni chiave
- ✅ Chiave di crittografia da environment variable
- ⚠️ **IMPORTANTE**: Cambia `ENCRYPTION_KEY` in produzione!

### **Mascheramento**
Le chiavi sono sempre mascherate quando visualizzate:
- OpenAI: `sk-...xyz`
- Altre: `abcd1234...xyz`

### **Validazione**
- ✅ Test real-time delle chiavi
- ✅ Timestamp ultima validazione
- ✅ Status attivo/inattivo

---

## 📊 SERVIZI SUPPORTATI

| Servizio | Testable | Metadata | Descrizione |
|----------|----------|----------|-------------|
| **OPENAI** | ✅ | ❌ | ChatGPT, GPT-4, Embeddings |
| **ANTHROPIC** | ✅ | ❌ | Claude AI models |
| **AZURE_OPENAI** | ❌ | ✅ | Azure OpenAI Service |
| **OLLAMA** | ❌ | ✅ | Local LLM models |
| **QDRANT** | ✅ | ✅ | Vector database |
| **MINIO** | ❌ | ✅ | S3-compatible storage |
| **AWS_S3** | ❌ | ✅ | Amazon S3 storage |

### **Aggiungere Nuovi Servizi**

1. **Database**: Aggiungi in seed SQL
2. **Backend**: Implementa test in `ApiKeyService.ts`
3. **Frontend**: Aggiungi config in `app.js` → `SERVICES`

---

## 🎯 BEST PRACTICES

### **Development**
```bash
# Usa chiavi di test
OPENAI_API_KEY=sk-test-...
```

### **Production**
```bash
# Cambia encryption key!
ENCRYPTION_KEY=your-super-secure-32-char-key

# Usa chiavi reali
OPENAI_API_KEY=sk-prod-...
```

### **Backup**
Le chiavi sono nel database. Backup regolari:
```bash
docker exec smartdocs-db pg_dump -U smartdocs smartdocs > backup.sql
```

---

## 📝 FILE CREATI

```
smartdocs/
├── scripts/
│   └── add-api-keys-table.sql      # Schema database
├── src/
│   ├── services/
│   │   └── ApiKeyService.ts        # Service layer
│   └── api/routes/
│       └── api-keys.ts             # API routes
├── frontend/
│   ├── index.html                  # UI dashboard
│   └── app.js                      # Frontend logic
└── API-KEYS-MANAGEMENT.md          # Questa guida
```

---

## ✅ TEST RAPIDO

```bash
# 1. Setup database
docker exec -i smartdocs-db psql -U smartdocs -d smartdocs < scripts/add-api-keys-table.sql

# 2. Verifica tabella creata
docker exec -it smartdocs-db psql -U smartdocs -d smartdocs -c "\dt smartdocs.api_keys"

# 3. Test API
curl http://localhost:3500/api/api-keys

# 4. Apri frontend
open frontend/index.html
```

---

## 🎉 RISULTATO

**Sistema completo di gestione API keys pronto per l'uso!**

- ✅ Storage sicuro database
- ✅ Crittografia AES-256
- ✅ API REST complete
- ✅ Frontend web moderno
- ✅ Test validazione real-time
- ✅ Documentazione completa

**Ora puoi gestire tutte le API keys di SmartDocs da un'interfaccia centralizzata! 🔑**
