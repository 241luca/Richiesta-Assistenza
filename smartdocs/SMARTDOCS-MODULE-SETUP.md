# SmartDocs - Setup Modulo Sistema

## ✅ Completato

SmartDocs è stato aggiunto correttamente al sistema di gestione applicazioni.

## 📋 Dettagli Modulo

- **Code**: `smartdocs`
- **Nome**: SmartDocs  
- **Categoria**: INTEGRATIONS
- **Icona**: 📚
- **Colore**: #7C3AED (viola)
- **Stato Iniziale**: Disabilitato (deve essere abilitato dall'admin)
- **Core**: No (modulo opzionale)

## ⚙️ Settings Disponibili

### Gruppo: Connessione
1. **api_url** (TEXT, richiesto)
   - Default: `http://localhost:3500`
   - Descrizione: URL del servizio SmartDocs

### Gruppo: Automazione
2. **auto_ingest** (BOOLEAN)
   - Default: `false`
   - Descrizione: Carica automaticamente documenti in SmartDocs

### Gruppo: AI Configuration
3. **default_ai_model** (TEXT)
   - Default: `gpt-4`
   - Descrizione: Modello AI da utilizzare per RAG

4. **chunk_size** (NUMBER)
   - Default: `1000`
   - Range: 500-2000 tokens
   - Descrizione: Dimensione chunk per embeddings

5. **chunk_overlap** (NUMBER)
   - Default: `200`
   - Range: 0-500 tokens
   - Descrizione: Overlap tra chunk

## 🚀 Come Abilitare SmartDocs

### 1. Accedi a Gestione Applicazioni

Vai su: **Admin → Gestione Applicazioni** (`/admin/modules`)

### 2. Trova SmartDocs

- Cerca nella categoria **INTEGRATIONS** (🔗)
- Oppure usa la search bar: "SmartDocs"

### 3. Abilita il Modulo

- Click sul pulsante "Abilita"
- (Opzionale) Inserisci motivazione: es. "Abilitazione sistema gestione documentale"
- Conferma

### 4. Configura Settings

Dopo l'abilitazione:
- Click su "Impostazioni" nella card del modulo
- Verifica/modifica `api_url` se necessario
- Salva le modifiche

## 🔍 Verifica Abilitazione

### Backend Service

Il servizio `SmartDocsClientService` legge automaticamente lo stato del modulo:

```typescript
// backend/src/services/smartdocs-client.service.ts
this.enabled = await moduleService.isModuleEnabled('smartdocs');
```

### Frontend Check

```typescript
// Verifica se SmartDocs è abilitato
const { data: module } = useQuery({
  queryKey: ['module', 'smartdocs'],
  queryFn: async () => {
    const response = await api.get('/admin/modules/smartdocs');
    return response.data.data;
  }
});

if (module?.isEnabled) {
  // SmartDocs attivo
}
```

## 📁 File Modificati

### 1. Backend Seeds
**File**: `/backend/prisma/seeds/modules.seed.ts`

Aggiunto modulo SmartDocs nella sezione INTEGRATIONS (linea ~750):
```typescript
{
  code: 'smartdocs',
  name: 'SmartDocs',
  description: 'Sistema gestione documentale con RAG',
  category: ModuleCategory.INTEGRATIONS,
  isCore: false,
  isEnabled: false,  // Disabilitato di default
  icon: '📚',
  color: '#7C3AED',
  order: 75,
  config: {
    apiUrl: 'http://localhost:3500',
    autoIngest: false
  }
}
```

Aggiunti 5 settings (linea ~1170):
- `api_url`
- `auto_ingest`
- `default_ai_model`
- `chunk_size`
- `chunk_overlap`

### 2. Frontend Container Form
**File**: `/src/pages/admin/SmartDocsPage.tsx`

Aggiunto campo `ai_prompt` nel form di creazione container (linea ~390):
```typescript
<div className="space-y-2">
  <Label htmlFor="container-prompt">AI Prompt (opzionale)</Label>
  <TextArea
    id="container-prompt"
    value={newContainer.ai_prompt}
    onChange={(e) => setNewContainer({ ...newContainer, ai_prompt: e.target.value })}
    placeholder="es: Sei un assistente esperto..."
    rows={4}
  />
  <p className="text-xs text-muted-foreground">
    🤖 Il prompt personalizzato viene usato dall'AI quando interroga i documenti
  </p>
</div>
```

### 3. Services
**File**: `/src/services/smartdocs.service.ts`
**File**: `/backend/src/services/smartdocs-client.service.ts`

Aggiunto parametro `ai_prompt` all'interfaccia `createContainer()`.

## 🧪 Test

### 1. Verifica Modulo nel Database
```sql
SELECT code, name, isEnabled FROM "SystemModule" WHERE code = 'smartdocs';
```

### 2. Verifica Settings
```sql
SELECT moduleCode, key, value FROM "ModuleSetting" WHERE moduleCode = 'smartdocs';
```

### 3. Test API
```bash
# Get module status
curl http://localhost:3200/api/admin/modules/smartdocs \
  -H "Authorization: Bearer YOUR_TOKEN"

# Enable module
curl -X POST http://localhost:3200/api/admin/modules/smartdocs/enable \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test abilitazione"}'
```

## 📝 Note Importanti

1. **Il modulo è DISABILITATO di default**
   - Devi abilitarlo manualmente in Gestione Applicazioni
   - Questo permette di configurare SmartDocs prima dell'uso

2. **Il servizio backend controlla automaticamente lo stato**
   - Se disabilitato: `SmartDocsClientService` ritorna errori puliti
   - Se abilitato: Funziona normalmente

3. **I settings sono configurabili**
   - Ogni setting può essere modificato dall'admin
   - Le modifiche sono immediate (no restart necessario)

4. **Il campo `ai_prompt` è opzionale**
   - Se vuoto, SmartDocs usa il prompt di default
   - Utile per personalizzare il comportamento AI per container specifici

## 🔗 Collegamenti Utili

- **Gestione Applicazioni**: http://localhost:5193/admin/modules
- **SmartDocs Admin**: http://localhost:5193/admin/smartdocs
- **SmartDocs API Health**: http://localhost:3500/health
- **Settings API**: http://localhost:3200/api/admin/modules/smartdocs/settings

## ✅ Prossimi Passi

1. ✅ Modulo aggiunto al sistema
2. ✅ Settings configurati
3. ✅ Campo `ai_prompt` aggiunto al form
4. ⏳ **MANCA**: Riavviare backend per caricare il modulo
5. ⏳ **MANCA**: Abilitare SmartDocs in Gestione Applicazioni
6. ⏳ **MANCA**: Testare creazione container con prompt

## 🐛 Troubleshooting

### Errore "SmartDocs is not enabled"
**Causa**: Il modulo è disabilitato  
**Soluzione**: Abilitalo in Gestione Applicazioni

### Settings non visibili
**Causa**: Modulo non ancora seedato  
**Soluzione**: Esegui `npm run seed:modules` nel backend

### Backend non vede il modulo
**Causa**: Cache o backend non riavviato  
**Soluzione**: Riavvia il backend
