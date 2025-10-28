# 🎯 Sistema CRUD Categorie Container - SmartDocs

## ✅ Implementazione Completa

Sistema di gestione dinamica delle categorie container completamente configurabile tramite interfaccia admin.

---

## 📦 Componenti Creati

### 1️⃣ **Database** 
📁 `scripts/add-container-categories.sql`

**Tabella**: `smartdocs.container_categories`

**Campi**:
- `id` (UUID) - Primary key
- `code` (VARCHAR) - Slug univoco (es: `client-project`)
- `name` (VARCHAR) - Nome visualizzato (es: "Progetto Cliente")
- `description` (TEXT) - Descrizione categoria
- `icon` (VARCHAR) - Nome icona Heroicons
- `color` (VARCHAR) - Colore per UI
- `group_name` (VARCHAR) - Raggruppamento (es: "Gestione Clienti")
- `sort_order` (INTEGER) - Ordinamento visualizzazione
- `is_active` (BOOLEAN) - Attivo/Disattivo
- `created_at`, `updated_at` (TIMESTAMP)

**Seed Data**: 17 categorie predefinite in 4 gruppi:
- **Uso Aziendale** (6 categorie)
- **Gestione Clienti** (5 categorie)  
- **Tecnico** (4 categorie)
- **Altro** (2 categorie)

---

### 2️⃣ **Backend Service**
📁 `src/services/ContainerCategoryService.ts` (269 righe)

**Metodi disponibili**:
- `listAll(includeInactive)` - Lista tutte le categorie
- `listGrouped(includeInactive)` - Lista raggruppate per gruppo
- `getById(id)` - Ottieni per ID
- `getByCode(code)` - Ottieni per codice
- `create(data)` - Crea nuova categoria
- `update(id, updates)` - Aggiorna categoria
- `delete(id)` - Elimina categoria (con controllo utilizzo)
- `toggleActive(id)` - Attiva/Disattiva

**Features**:
- ✅ Validazione unicità codice
- ✅ Controllo utilizzo prima eliminazione
- ✅ Auto-update timestamp
- ✅ Error handling completo
- ✅ Logging operazioni

---

### 3️⃣ **API Routes**
📁 `src/api/routes/container-categories.ts` (214 righe)

**Endpoints**:

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/container-categories` | Lista tutte |
| GET | `/api/container-categories/grouped` | Lista raggruppate |
| GET | `/api/container-categories/:id` | Dettaglio |
| POST | `/api/container-categories` | Crea |
| PUT | `/api/container-categories/:id` | Aggiorna |
| POST | `/api/container-categories/:id/toggle` | Toggle attivo |
| DELETE | `/api/container-categories/:id` | Elimina |

**Query Parameters**:
- `?includeInactive=true` - Include categorie disattivate

**Response Format**:
```json
{
  "success": true,
  "data": [...],
  "message": "..."
}
```

---

### 4️⃣ **Frontend Manager Component**
📁 `src/components/smartdocs/ContainerCategoryManager.tsx` (405 righe)

**Features UI**:
- ✅ **Lista categorie** raggruppate per gruppo
- ✅ **Form CRUD** inline con validazione
- ✅ **Modifica** categoria esistente
- ✅ **Eliminazione** con conferma
- ✅ **Toggle attivo/disattivo**
- ✅ **Badge** stato (attivo/disattivo)
- ✅ **Visualizzazione** metadata (icona, colore, ordine)
- ✅ **Error handling** con Alert UI

**Campi Form**:
- Codice (slug) - univoco, non modificabile dopo creazione
- Nome - display name
- Descrizione - opzionale
- Gruppo - select con 4 opzioni predefinite
- Icona - nome icona Heroicons
- Colore - stringa colore per UI
- Ordine - numero per sorting
- Stato - attivo/disattivo

---

### 5️⃣ **Integrazione SmartDocsPage**
📁 `src/pages/admin/SmartDocsPage.tsx`

**Modifiche**:
1. ✅ Aggiunto import `ContainerCategoryManager`
2. ✅ Aggiunto import `Settings` icon
3. ✅ Aggiunto stato `categories` e `groupedCategories`
4. ✅ Aggiunta funzione `loadCategories()`
5. ✅ Modificato `TabsList` da 5 a 6 colonne
6. ✅ Aggiunto tab "Settings" con icona ⚙️
7. ✅ **Select categorie dinamico** caricato da DB
8. ✅ Filtro solo categorie attive nel form
9. ✅ Raggruppamento per `group_name`
10. ✅ Link "Puoi gestire le categorie nel tab Settings"

**Caricamento Dinamico**:
```typescript
const loadCategories = async () => {
  const response = await api.get('http://localhost:3500/api/container-categories/grouped');
  if (response.data.success) {
    setGroupedCategories(response.data.data);
    // Flatten per select
    const allCats: any[] = [];
    Object.values(response.data.data).forEach((cats: any) => {
      allCats.push(...cats);
    });
    setCategories(allCats);
  }
};
```

**Select Dinamico**:
```tsx
<select>
  <option value="">-- Seleziona categoria --</option>
  {Object.entries(groupedCategories).map(([group, cats]) => (
    <optgroup key={group} label={group}>
      {(cats as any[]).filter(c => c.is_active).map((cat) => (
        <option key={cat.id} value={cat.code}>
          {cat.name}
        </option>
      ))}
    </optgroup>
  ))}
</select>
```

---

## 🚀 Come Usare

### 1. **Gestire Categorie**

**Accedi al pannello**:
1. Login come SUPER_ADMIN
2. Menu → SmartDocs
3. Tab → **Settings** ⚙️

**Operazioni**:
- **Crea nuova**: Click "Nuova Categoria" → Compila form → Salva
- **Modifica**: Click icona ✏️ → Modifica campi → Salva
- **Disattiva**: Click icona ⚡ (categoria non appare nel form ma resta in DB)
- **Elimina**: Click icona 🗑️ (solo se non usata da container)

---

### 2. **Creare Container con Categoria**

**Vai al tab Containers**:
1. Select "Categoria Container" → Scegli categoria (caricata da DB)
2. Nome → es: "Documentazione Cliente XYZ"
3. Descrizione → es: "Tutti i documenti relativi al cliente XYZ"
4. Click "Crea Container"

**Categorie disponibili** = Solo quelle con `is_active = true`

---

## 📊 Struttura Dati

### Database Record Esempio

```sql
SELECT code, name, group_name, is_active FROM smartdocs.container_categories LIMIT 3;
```

| code | name | group_name | is_active |
|------|------|------------|-----------|
| client-project | Progetto Cliente | Gestione Clienti | t |
| regulations | Normative e Regolamenti | Uso Aziendale | t |
| technical-docs | Documentazione Tecnica | Tecnico | t |

---

### API Response Grouped

```json
{
  "success": true,
  "data": {
    "Uso Aziendale": [
      {
        "id": "uuid-1",
        "code": "internal-procedures",
        "name": "Procedure Interne",
        "description": "Procedure e workflow aziendali",
        "icon": "clipboard-list",
        "color": "blue",
        "group_name": "Uso Aziendale",
        "sort_order": 1,
        "is_active": true
      }
    ],
    "Gestione Clienti": [...],
    "Tecnico": [...],
    "Altro": [...]
  }
}
```

---

## 🔒 Validazioni e Controlli

### Backend

1. **Unicità codice**: Non permette duplicati
2. **Campi obbligatori**: `code` e `name`
3. **Eliminazione**: Blocca se categoria usata da container
4. **Code immutabile**: Una volta creato, il code non può essere modificato in update

### Frontend

1. **Form validation**: Richiede code e name
2. **Code disabled** in edit: Previene modifica accidentale
3. **Conferma eliminazione**: Dialog conferma prima delete
4. **Error display**: Alert rosso per errori API

---

## 🎨 UI/UX Features

### Lista Categorie
- ✅ Raggruppate per `group_name`
- ✅ Badge codice categoria
- ✅ Badge stato (Attivo/Disattivo)
- ✅ Visualizzazione metadata (icona, colore, ordine)
- ✅ Opacità ridotta per categorie disattivate

### Form Inline
- ✅ Border blu quando attivo
- ✅ Grid layout 2/3 colonne
- ✅ Select per gruppo predefinito
- ✅ Tooltip info campi
- ✅ Bottoni Salva/Annulla

### Feedback Utente
- ✅ Loading spinner durante operazioni
- ✅ Alert errori in rosso
- ✅ Conferma eliminazione
- ✅ Auto-refresh lista dopo modifiche

---

## 🧪 Test API

```bash
# Lista tutte le categorie
curl http://localhost:3500/api/container-categories

# Lista raggruppate
curl http://localhost:3500/api/container-categories/grouped

# Include disattivate
curl "http://localhost:3500/api/container-categories?includeInactive=true"

# Dettaglio categoria
curl http://localhost:3500/api/container-categories/{id}

# Crea categoria
curl -X POST http://localhost:3500/api/container-categories \
  -H "Content-Type: application/json" \
  -d '{
    "code": "my-category",
    "name": "Mia Categoria",
    "description": "Descrizione",
    "group_name": "Altro",
    "is_active": true
  }'

# Aggiorna
curl -X PUT http://localhost:3500/api/container-categories/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Nuovo Nome"}'

# Toggle attivo
curl -X POST http://localhost:3500/api/container-categories/{id}/toggle

# Elimina
curl -X DELETE http://localhost:3500/api/container-categories/{id}
```

---

## 📝 Esempi Pratici

### Esempio 1: Aggiungere categoria "Fatturazione"

```typescript
// 1. Tab Settings → Nuova Categoria
{
  code: "invoicing",
  name: "Fatturazione",
  description: "Documenti relativi a fatturazione e contabilità",
  group_name: "Uso Aziendale",
  icon: "receipt",
  color: "green",
  sort_order: 7,
  is_active: true
}
```

→ Appare automaticamente nel select "Categoria Container" nel tab Containers

---

### Esempio 2: Disattivare categoria obsoleta

1. Tab Settings
2. Trova categoria "Archive"
3. Click icona ⚡ (Power)
4. Categoria diventa grigia con badge "Disattivo"
5. **Scompare** dal select nel form (non più selezionabile)
6. **Container esistenti** con quella categoria continuano a funzionare
7. **Non eliminata** - può essere riattivata in futuro

---

### Esempio 3: Modificare ordine visualizzazione

1. Tab Settings
2. Click ✏️ su categoria "Technical Docs"
3. Cambia `sort_order` da 20 a 5
4. Salva
5. Nel select, "Technical Docs" appare prima nella lista

---

## 🔧 Manutenzione

### Aggiungere nuovi gruppi

Modifica select in `ContainerCategoryManager.tsx`:

```tsx
<select id="group_name">
  <option value="Uso Aziendale">Uso Aziendale</option>
  <option value="Gestione Clienti">Gestione Clienti</option>
  <option value="Tecnico">Tecnico</option>
  <option value="Altro">Altro</option>
  <option value="Nuovo Gruppo">Nuovo Gruppo</option> {/* NUOVO */}
</select>
```

---

### Backup categorie

```bash
# Esporta categorie esistenti
docker exec smartdocs-db psql -U smartdocs -d smartdocs \
  -c "COPY smartdocs.container_categories TO STDOUT CSV HEADER" \
  > categories_backup.csv

# Ripristina
docker exec -i smartdocs-db psql -U smartdocs -d smartdocs \
  -c "COPY smartdocs.container_categories FROM STDIN CSV HEADER" \
  < categories_backup.csv
```

---

## ✅ Checklist Implementazione

- [x] Database table creata
- [x] Seed data 17 categorie
- [x] Backend service completo
- [x] API routes 7 endpoint
- [x] Frontend manager component
- [x] Integrazione SmartDocsPage
- [x] Tab Settings aggiunto
- [x] Select dinamico container form
- [x] Validazioni backend
- [x] Validazioni frontend
- [x] Error handling
- [x] Loading states
- [x] Conferme eliminazione
- [x] Controllo utilizzo categorie
- [x] Badge stato attivo/disattivo
- [x] Raggruppamento UI
- [x] Documentazione completa

---

## 🎯 Risultato Finale

**Sistema 100% configurabile** ✅

- ❌ ~~Categorie hardcoded nel codice~~
- ✅ Categorie gestite da database
- ✅ Interfaccia CRUD completa
- ✅ Nessuna modifica codice per nuove categorie
- ✅ Attivazione/Disattivazione dinamica
- ✅ Modifiche in tempo reale
- ✅ Controlli integrità dati

**Zero hardcoding, tutto gestibile!** 🚀

---

**Data implementazione**: 24 Ottobre 2025  
**Versione**: 1.0.0  
**Stato**: ✅ Production Ready
