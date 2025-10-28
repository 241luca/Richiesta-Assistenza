# 🎯 Sistema Gestione Gruppi Categorie Container - SmartDocs

## ✅ Implementazione Completa

Sistema CRUD completo per gestire i gruppi delle categorie container, completamente configurabile tramite interfaccia admin.

---

## 📦 Componenti Creati

### 1️⃣ **Database** 
📁 `scripts/add-container-groups.sql`

**Tabella**: `smartdocs.container_category_groups`

**Campi**:
- `id` (UUID) - Primary key
- `code` (VARCHAR) - Slug univoco (es: `uso-aziendale`)
- `name` (VARCHAR) - Nome visualizzato (es: "Uso Aziendale")
- `description` (TEXT) - Descrizione gruppo
- `icon` (VARCHAR) - Nome icona Heroicons
- `color` (VARCHAR) - Colore per UI
- `sort_order` (INTEGER) - Ordinamento visualizzazione
- `is_active` (BOOLEAN) - Attivo/Disattivo
- `created_at`, `updated_at` (TIMESTAMP)

**Seed Data**: 4 gruppi predefiniti:
- **Uso Aziendale** (`uso-aziendale`)
- **Gestione Clienti** (`gestione-clienti`)
- **Tecnico** (`tecnico`)
- **Altro** (`altro`)

**Migration**: Aggiornate categorie esistenti per usare i code dei gruppi

---

### 2️⃣ **Backend Service**
📁 `src/services/ContainerCategoryGroupService.ts` (259 righe)

**Metodi disponibili**:
- `listAll(includeInactive)` - Lista tutti i gruppi
- `getById(id)` - Ottieni per ID
- `getByCode(code)` - Ottieni per codice
- `create(data)` - Crea nuovo gruppo
- `update(id, updates)` - Aggiorna gruppo
- `delete(id)` - Elimina gruppo (con controllo utilizzo)
- `toggleActive(id)` - Attiva/Disattiva
- `getCategoryCount(groupCode)` - Conta categorie per gruppo

**Features**:
- ✅ Validazione unicità codice
- ✅ Controllo utilizzo prima eliminazione (blocca se categorie usano il gruppo)
- ✅ Auto-update timestamp
- ✅ Error handling completo
- ✅ Logging operazioni

---

### 3️⃣ **API Routes**
📁 `src/api/routes/container-category-groups.ts` (191 righe)

**Endpoints**:

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/container-category-groups` | Lista tutti |
| GET | `/api/container-category-groups/:id` | Dettaglio |
| POST | `/api/container-category-groups` | Crea |
| PUT | `/api/container-category-groups/:id` | Aggiorna |
| POST | `/api/container-category-groups/:id/toggle` | Toggle attivo |
| DELETE | `/api/container-category-groups/:id` | Elimina |

**Query Parameters**:
- `?includeInactive=true` - Include gruppi disattivati

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
📁 `src/components/smartdocs/ContainerCategoryManager.tsx`

**Nuove Features**:
- ✅ **Tab System** - Categorie / Gruppi
- ✅ **CRUD Gruppi** completo
- ✅ **Form inline** per crea/modifica gruppo
- ✅ **Lista gruppi** con azioni
- ✅ **Select dinamico** gruppi nel form categorie
- ✅ **Validazioni** complete

**Campi Form Gruppo**:
- Codice (slug) - univoco, non modificabile dopo creazione
- Nome - display name
- Descrizione - opzionale
- Icona - nome icona Heroicons
- Colore - stringa colore per UI
- Ordine - numero per sorting
- Stato - attivo/disattivo

---

## 🚀 Come Usare

### 1. **Gestire Gruppi**

**Accedi al pannello**:
1. Login come SUPER_ADMIN
2. Menu → SmartDocs
3. Tab → **Settings** ⚙️
4. Tab interno → **Gruppi**

**Operazioni**:
- **Crea nuovo**: Click "Nuovo Gruppo" → Compila form → Salva
- **Modifica**: Click icona ✏️ → Modifica campi → Salva
- **Disattiva**: Click icona ⚡ (gruppo non appare nel select ma resta in DB)
- **Elimina**: Click icona 🗑️ (solo se non usato da categorie)

---

### 2. **Creare Categoria con Gruppo**

**Vai al tab Categorie**:
1. Click "Nuova Categoria"
2. Select "Gruppo" → Scegli gruppo (caricato da DB)
3. Compila altri campi
4. Click "Salva"

**Gruppi disponibili** = Solo quelli con `is_active = true`

---

### 3. **Workflow Completo**

#### Esempio: Aggiungere nuovo gruppo "Marketing"

1. **Tab Settings → Gruppi**
2. **Nuovo Gruppo**:
   ```
   Codice: marketing
   Nome: Marketing
   Descrizione: Documenti e materiali marketing
   Icona: megaphone
   Colore: pink
   Ordine: 5
   Stato: Attivo
   ```
3. **Salva** → Gruppo creato

4. **Tab Categorie**
5. **Nuova Categoria**:
   ```
   Gruppo: Marketing (ora disponibile nel select!)
   Codice: campagne
   Nome: Campagne Marketing
   Descrizione: Documentazione campagne
   ```
6. **Salva** → Categoria creata nel gruppo Marketing

---

## 📊 Struttura Dati

### Database Record Esempio

```sql
SELECT code, name, icon, color, is_active 
FROM smartdocs.container_category_groups;
```

| code | name | icon | color | is_active |
|------|------|------|-------|-----------|
| uso-aziendale | Uso Aziendale | building | blue | t |
| gestione-clienti | Gestione Clienti | users | green | t |
| tecnico | Tecnico | wrench | orange | t |
| altro | Altro | folder | gray | t |

---

### Relazione Gruppi → Categorie

```
Gruppo: "Uso Aziendale" (uso-aziendale)
├── Categoria: "Procedure Interne" (internal-procedures)
├── Categoria: "Manuali Qualità" (quality-manuals)
├── Categoria: "Normative e Regolamenti" (regulations)
└── ...

Gruppo: "Gestione Clienti" (gestione-clienti)
├── Categoria: "Progetto Cliente" (client-project)
├── Categoria: "Interventi Cliente" (client-interventions)
└── ...
```

Il campo `group_name` nelle categorie contiene il `code` del gruppo.

---

### API Response

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "code": "uso-aziendale",
      "name": "Uso Aziendale",
      "description": "Documenti per uso interno aziendale",
      "icon": "building",
      "color": "blue",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2025-10-24T...",
      "updated_at": "2025-10-24T..."
    }
  ]
}
```

---

## 🔒 Validazioni e Controlli

### Backend

1. **Unicità codice**: Non permette duplicati
2. **Campi obbligatori**: `code` e `name`
3. **Eliminazione**: Blocca se gruppo usato da categorie
   ```
   Error: "Cannot delete group: it is used by existing categories"
   ```
4. **Code immutabile**: Una volta creato, il code non può essere modificato in update

### Frontend

1. **Form validation**: Richiede code e name
2. **Code disabled** in edit: Previene modifica accidentale
3. **Conferma eliminazione**: Dialog conferma prima delete
4. **Error display**: Alert rosso per errori API
5. **Auto-reload**: Ricarica liste dopo modifiche

---

## 🎨 UI/UX Features

### Tab System
- ✅ **Tab Categorie**: Gestione categorie container
- ✅ **Tab Gruppi**: Gestione gruppi
- ✅ Bottoni switch tab visibili in header

### Lista Gruppi
- ✅ Card per ogni gruppo
- ✅ Badge codice gruppo
- ✅ Badge stato (Attivo/Disattivo)
- ✅ Visualizzazione metadata (icona, colore, ordine)
- ✅ Opacità ridotta per gruppi disattivati

### Form Inline Gruppi
- ✅ Border blu quando attivo
- ✅ Grid layout 2/3 colonne
- ✅ Tooltip info campi
- ✅ Bottoni Salva/Annulla

### Select Dinamico Categorie
- ✅ Carica gruppi da DB
- ✅ Mostra solo gruppi attivi
- ✅ Link "Gestisci i gruppi nel tab Gruppi"

---

## 🧪 Test API

```bash
# Lista tutti i gruppi
curl http://localhost:3500/api/container-category-groups

# Include disattivati
curl "http://localhost:3500/api/container-category-groups?includeInactive=true"

# Dettaglio gruppo
curl http://localhost:3500/api/container-category-groups/{id}

# Crea gruppo
curl -X POST http://localhost:3500/api/container-category-groups \
  -H "Content-Type: application/json" \
  -d '{
    "code": "mio-gruppo",
    "name": "Mio Gruppo",
    "description": "Descrizione",
    "icon": "folder",
    "color": "blue",
    "sort_order": 10,
    "is_active": true
  }'

# Aggiorna
curl -X PUT http://localhost:3500/api/container-category-groups/{id} \
  -H "Content-Type: application/json" \
  -d '{"name": "Nuovo Nome"}'

# Toggle attivo
curl -X POST http://localhost:3500/api/container-category-groups/{id}/toggle

# Elimina
curl -X DELETE http://localhost:3500/api/container-category-groups/{id}
```

---

## 📝 Esempi Pratici

### Esempio 1: Aggiungere gruppo "Legale"

```typescript
// 1. Tab Settings → Gruppi → Nuovo Gruppo
{
  code: "legale",
  name: "Legale",
  description: "Documenti legali e contratti",
  icon: "scale",
  color: "purple",
  sort_order: 6,
  is_active: true
}
```

→ Appare automaticamente nel select "Gruppo" nel form categorie

→ Puoi creare categorie come:
- "Contratti Clienti" (gruppo: legale)
- "Privacy e GDPR" (gruppo: legale)
- "Licenze Software" (gruppo: legale)

---

### Esempio 2: Riorganizzare ordine gruppi

**Obiettivo**: Mostrare "Gestione Clienti" prima di "Uso Aziendale"

1. Tab Settings → Gruppi
2. Click ✏️ su "Gestione Clienti"
3. Cambia `sort_order` da 2 a 0
4. Salva
5. Click ✏️ su "Uso Aziendale"
6. Cambia `sort_order` da 1 a 2
7. Salva

→ Nel select apparirà: Gestione Clienti, Uso Aziendale, Tecnico, Altro

---

### Esempio 3: Disattivare gruppo obsoleto

**Scenario**: Il gruppo "Altro" non serve più

1. Tab Settings → Gruppi
2. Trova gruppo "Altro"
3. Click icona ⚡ (Power)
4. Gruppo diventa grigio con badge "Disattivo"
5. **Scompare** dal select nel form categorie
6. **Categorie esistenti** con quel gruppo continuano a esistere
7. **Non eliminato** - può essere riattivato in futuro

---

## 🔧 Manutenzione

### Backup gruppi

```bash
# Esporta gruppi esistenti
docker exec smartdocs-db psql -U smartdocs -d smartdocs \
  -c "COPY smartdocs.container_category_groups TO STDOUT CSV HEADER" \
  > groups_backup.csv

# Ripristina
docker exec -i smartdocs-db psql -U smartdocs -d smartdocs \
  -c "COPY smartdocs.container_category_groups FROM STDIN CSV HEADER" \
  < groups_backup.csv
```

---

### Verifica integrità

```sql
-- Conta categorie per gruppo
SELECT 
  g.code AS gruppo,
  g.name AS nome_gruppo,
  COUNT(c.id) AS num_categorie
FROM smartdocs.container_category_groups g
LEFT JOIN smartdocs.container_categories c ON c.group_name = g.code
GROUP BY g.code, g.name
ORDER BY g.sort_order;
```

---

### Pulizia categorie orfane

```sql
-- Trova categorie con gruppo non esistente
SELECT c.* 
FROM smartdocs.container_categories c
WHERE c.group_name NOT IN (
  SELECT code FROM smartdocs.container_category_groups
);

-- Assegna a gruppo "altro"
UPDATE smartdocs.container_categories
SET group_name = 'altro'
WHERE group_name NOT IN (
  SELECT code FROM smartdocs.container_category_groups
);
```

---

## ✅ Checklist Implementazione

- [x] Database table creata
- [x] Seed data 4 gruppi
- [x] Backend service completo
- [x] API routes 6 endpoint
- [x] Frontend manager component
- [x] Tab system Categorie/Gruppi
- [x] CRUD completo gruppi
- [x] Select dinamico carica gruppi
- [x] Validazioni backend
- [x] Validazioni frontend
- [x] Error handling
- [x] Loading states
- [x] Conferme eliminazione
- [x] Controllo utilizzo gruppi
- [x] Badge stato attivo/disattivo
- [x] Link navigazione tra tab
- [x] Migration categorie esistenti
- [x] Documentazione completa

---

## 🎯 Risultato Finale

**Sistema 100% configurabile a 2 livelli** ✅

### Livello 1: Gruppi
- ❌ ~~Gruppi hardcoded nel codice~~
- ✅ Gruppi gestiti da database
- ✅ Interfaccia CRUD completa
- ✅ Nessuna modifica codice per nuovi gruppi

### Livello 2: Categorie
- ❌ ~~Categorie hardcoded nel codice~~
- ✅ Categorie gestite da database
- ✅ Select gruppi dinamico
- ✅ Gerarchia Gruppo → Categoria

### Workflow Utente
1. **Crea Gruppo** (es: "Marketing")
2. **Crea Categorie** nel gruppo (es: "Campagne", "Brochure")
3. **Crea Container** con categoria (es: "Campagna Primavera 2025")
4. **Aggiungi Documenti** nel container (PDF, DOCX, ecc.)

**Zero hardcoding, tutto gestibile!** 🚀

---

**Data implementazione**: 24 Ottobre 2025  
**Versione**: 2.0.0  
**Stato**: ✅ Production Ready
