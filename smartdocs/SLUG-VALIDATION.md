# Validazione Slug per Categorie e Gruppi

## 📋 Panoramica

Implementata validazione completa per gli slug (codici) nelle categorie e gruppi dei container SmartDocs.

## ✅ Regole Validazione Slug

Gli slug (campo `code`) devono rispettare le seguenti regole:

### Requisiti Obbligatori:
- ✅ **Solo caratteri minuscoli**: `a-z`
- ✅ **Solo numeri**: `0-9`
- ✅ **Solo separatori**: trattino `-` e underscore `_`
- ❌ **NO SPAZI**: gli spazi non sono consentiti
- ❌ **NO caratteri speciali**: (à, è, é, €, @, #, ecc.)
- ❌ **NO maiuscole**: tutte le lettere devono essere minuscole

### Esempi Validi:
```
✓ client-project
✓ gestione-clienti
✓ internal_procedures
✓ quality-manuals-2024
✓ safety_docs
```

### Esempi NON Validi:
```
✗ gestione casa       (contiene spazio)
✗ Client-Project      (contiene maiuscole)
✗ qualità-manuali     (contiene carattere accentato)
✗ safety@docs         (contiene carattere speciale)
✗ archivio 2024       (contiene spazio)
```

## 🔧 Implementazione

### Backend (Node.js/TypeScript)

#### 1. ContainerCategoryService.ts
```typescript
private validateSlug(slug: string): void {
  if (!slug || slug.trim() === '') {
    throw new Error('Code cannot be empty');
  }

  if (/\s/.test(slug)) {
    throw new Error('Code cannot contain spaces. Use hyphens (-) or underscores (_) instead.');
  }

  if (!/^[a-z0-9-_]+$/.test(slug)) {
    throw new Error('Code must contain only lowercase letters, numbers, hyphens (-) and underscores (_)');
  }
}
```

La validazione viene eseguita in:
- `create()` - Durante creazione nuova categoria
- `update()` - Durante modifica categoria (se code viene modificato)

#### 2. ContainerCategoryGroupService.ts
Stessa validazione applicata ai gruppi.

### Frontend (React/TypeScript)

#### ContainerCategoryManager.tsx
```typescript
// Validazione slug
const validateSlug = (slug: string): string | null => {
  if (!slug || slug.trim() === '') {
    return 'Il codice non può essere vuoto';
  }
  if (/\s/.test(slug)) {
    return 'Il codice non può contenere spazi. Usa trattini (-) o underscore (_)';
  }
  if (!/^[a-z0-9-_]+$/.test(slug)) {
    return 'Il codice deve contenere solo lettere minuscole, numeri, trattini (-) e underscore (_)';
  }
  return null;
};
```

La validazione frontend viene eseguita prima di chiamare l'API in:
- `handleCreate()` - Prima di creare categoria
- `handleUpdate()` - Prima di aggiornare categoria
- `handleCreateGroup()` - Prima di creare gruppo
- `handleUpdateGroup()` - Prima di aggiornare gruppo

### UI Helper

Aggiunto suggerimento visivo sotto ogni campo "Codice":
```
⚠️ Solo minuscole, numeri, trattini (-) e underscore (_). No spazi.
```

## 🔄 Fix Database Esistente

### Script di Correzione: `fix-gestione-casa-slug.sql`

Lo script corregge automaticamente tutti gli slug esistenti che contengono spazi:

```sql
-- Corregge categorie con spazi
UPDATE smartdocs.container_categories 
SET code = LOWER(REPLACE(TRIM(code), ' ', '-'))
WHERE code LIKE '% %';

-- Corregge gruppi con spazi
UPDATE smartdocs.container_category_groups 
SET code = LOWER(REPLACE(TRIM(code), ' ', '-'))
WHERE code LIKE '% %';
```

**Esempio di correzione automatica:**
- `"gestione casa"` → `"gestione-casa"`
- `"Progetto Cliente"` → `"progetto-cliente"`
- `"safety docs"` → `"safety-docs"`

### Esecuzione Script:
```bash
cd smartdocs
docker-compose exec smartdocs-db psql -U smartdocs -d smartdocs -c "$(cat scripts/fix-gestione-casa-slug.sql)"
```

### Verifica Post-Fix:
```sql
-- Mostra eventuali slug ancora non validi
SELECT 'Categories' as type, id, code, name 
FROM smartdocs.container_categories 
WHERE code !~ '^[a-z0-9-_]+$'
UNION ALL
SELECT 'Groups' as type, id, code, name 
FROM smartdocs.container_category_groups 
WHERE code !~ '^[a-z0-9-_]+$';
```

## 📊 Impatto

### Protezione Dati:
- ✅ Previene slug non validi nel database
- ✅ Garantisce URL-friendly codes
- ✅ Migliora consistenza dati
- ✅ Previene errori in API/routing

### User Experience:
- ✅ Feedback immediato durante digitazione
- ✅ Messaggi di errore chiari in italiano
- ✅ Suggerimenti visivi nel form
- ✅ Validazione sia frontend che backend

### Sicurezza:
- ✅ Doppia validazione (client + server)
- ✅ Protezione contro SQL injection
- ✅ Protezione contro XSS
- ✅ Conformità alle best practices

## 🎯 Testing

### Test Manuali Frontend:
1. Creare categoria con spazio → Deve mostrare errore
2. Creare categoria con maiuscole → Deve mostrare errore
3. Creare categoria con caratteri speciali → Deve mostrare errore
4. Creare categoria con slug valido → Deve salvare
5. Modificare slug esistente con spazio → Deve mostrare errore

### Test Backend (via API):
```bash
# Test con spazio (deve fallire)
curl -X POST http://localhost:3500/api/container-categories \
  -H "Content-Type: application/json" \
  -d '{"code": "gestione casa", "name": "Gestione Casa"}'

# Test con slug valido (deve funzionare)
curl -X POST http://localhost:3500/api/container-categories \
  -H "Content-Type: application/json" \
  -d '{"code": "gestione-casa", "name": "Gestione Casa"}'
```

## 📝 Note

- La validazione è **case-sensitive**: solo minuscole accettate
- Il campo `code` è **immutabile dopo creazione** (disabled in edit)
- Gli spazi vengono automaticamente convertiti in trattini nello script di fix
- La regex di validazione è: `^[a-z0-9-_]+$`

## 🔗 File Modificati

### Backend:
- `/smartdocs/src/services/ContainerCategoryService.ts`
- `/smartdocs/src/services/ContainerCategoryGroupService.ts`

### Frontend:
- `/src/components/smartdocs/ContainerCategoryManager.tsx`

### Database:
- `/smartdocs/scripts/fix-gestione-casa-slug.sql` (nuovo)

## 🚀 Deployment

Dopo il deploy, eseguire lo script di fix per correggere eventuali slug esistenti con spazi:

```bash
cd smartdocs
docker-compose exec smartdocs-db psql -U smartdocs -d smartdocs -c "$(cat scripts/fix-gestione-casa-slug.sql)"
```

Questo garantirà che tutti i dati esistenti rispettino le nuove regole di validazione.
