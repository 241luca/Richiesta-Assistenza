# 📚 DOCUMENTAZIONE SISTEMA SOTTOCATEGORIE
**Ultimo aggiornamento:** 24 Agosto 2025  
**Versione:** 2.0

---

## 🎯 PANORAMICA

Il sistema delle sottocategorie permette una classificazione granulare dei servizi offerti, consentendo:
- Matching preciso tra richieste e professionisti
- Configurazione AI personalizzata per tipo di servizio
- Gestione requisiti e competenze specifiche
- Analytics dettagliate per area di competenza

---

## 🏗️ ARCHITETTURA

### Schema Database

```sql
-- Tabella principale sottocategorie
Subcategory {
  id: UUID (PK)
  name: String
  slug: String (unique)
  description: Text
  categoryId: UUID (FK -> Category)
  requirements: Text
  color: String
  textColor: String
  isActive: Boolean
  displayOrder: Integer
  metadata: JSONB
  createdAt: Timestamp
  updatedAt: Timestamp
}

-- Configurazioni AI per sottocategoria
SubcategoryAiSettings {
  id: UUID (PK)
  subcategoryId: UUID (FK -> Subcategory, unique)
  modelName: String
  temperature: Float
  maxTokens: Integer
  systemPrompt: Text
  responseStyle: Enum
  detailLevel: Enum
  useKnowledgeBase: Boolean
  isActive: Boolean
}

-- Relazione professionisti-sottocategorie
ProfessionalUserSubcategory {
  userId: UUID (FK -> User)
  subcategoryId: UUID (FK -> Subcategory)
  experienceYears: Integer
  skillLevel: String
  certifications: JSONB
  isActive: Boolean
  PRIMARY KEY (userId, subcategoryId)
}
```

### Relazioni
- **Category** (1) → (N) **Subcategory**
- **Subcategory** (1) → (0..1) **AiSettings**
- **Subcategory** (N) ← → (N) **Professional**
- **Subcategory** (1) → (N) **AssistanceRequest**

---

## 🔌 API ENDPOINTS

### Endpoints Pubblici (Autenticati)

#### GET /api/subcategories
Ottieni lista sottocategorie con filtri opzionali

**Query Parameters:**
- `categoryId` (string): Filtra per categoria
- `isActive` (boolean): Mostra solo attive
- `includeAiSettings` (boolean): Include configurazioni AI

**Response:**
```json
{
  "subcategories": [
    {
      "id": "uuid",
      "name": "Riparazione perdite",
      "slug": "riparazione-perdite",
      "description": "Riparazione di perdite d'acqua",
      "category": {
        "id": "uuid",
        "name": "Idraulica"
      },
      "isActive": true,
      "_count": {
        "professionals": 5,
        "assistanceRequests": 12
      }
    }
  ]
}
```

#### GET /api/subcategories/by-category/:categoryId
Ottieni sottocategorie di una specifica categoria

**Response:** Array di sottocategorie filtrate

### Endpoints Admin (ADMIN/SUPER_ADMIN)

#### POST /api/subcategories
Crea nuova sottocategoria

**Body:**
```json
{
  "name": "Nome Sottocategoria",
  "categoryId": "uuid",
  "description": "Descrizione",
  "requirements": "Requisiti richiesti",
  "color": "#E5E7EB",
  "textColor": "#1F2937",
  "displayOrder": 0,
  "isActive": true
}
```

#### PUT /api/subcategories/:id
Aggiorna sottocategoria esistente

#### DELETE /api/subcategories/:id
Elimina sottocategoria (solo se non ha richieste attive)

#### POST /api/subcategories/:id/ai-settings
Configura impostazioni AI per sottocategoria

**Body:**
```json
{
  "modelName": "gpt-3.5-turbo",
  "temperature": 0.7,
  "maxTokens": 2048,
  "systemPrompt": "Sei un esperto...",
  "responseStyle": "FORMAL",
  "detailLevel": "INTERMEDIATE",
  "useKnowledgeBase": true,
  "isActive": true
}
```

---

## 🎨 COMPONENTI FRONTEND

### CategorySelector
Componente per selezione categoria e sottocategoria nelle richieste

**Props:**
```typescript
interface CategorySelectorProps {
  value?: {
    category?: string;
    subcategory?: string;
  };
  onChange: (selection: { 
    category?: string; 
    subcategory?: string 
  }) => void;
  required?: boolean;
  disabled?: boolean;
}
```

**Utilizzo:**
```tsx
<CategorySelector
  value={{ 
    category: selectedCategoryId,
    subcategory: selectedSubcategoryId 
  }}
  onChange={(selection) => {
    setSelectedCategoryId(selection.category);
    setSelectedSubcategoryId(selection.subcategory);
  }}
  required={true}
/>
```

### SubcategoriesPage (Admin)
Pagina completa di gestione sottocategorie con:
- Lista filtrata e paginata
- CRUD completo
- Configurazione AI
- Gestione stato attivo/inattivo

**Features:**
- Modal creazione/modifica
- Modal configurazione AI
- Filtri per categoria
- Toggle mostra inattive
- Contatori professionisti e richieste

---

## 🔧 CONFIGURAZIONE AI

### Parametri Configurabili

| Parametro | Tipo | Range | Default | Descrizione |
|-----------|------|-------|---------|-------------|
| modelName | string | gpt-3.5-turbo, gpt-4 | gpt-3.5-turbo | Modello OpenAI |
| temperature | float | 0-2 | 0.7 | Creatività risposte |
| maxTokens | integer | 100-4096 | 2048 | Lunghezza max risposta |
| topP | float | 0-1 | 1 | Nucleus sampling |
| frequencyPenalty | float | -2 to 2 | 0 | Penalità ripetizioni |
| presencePenalty | float | -2 to 2 | 0 | Penalità argomenti |
| responseStyle | enum | FORMAL, INFORMAL, TECHNICAL, EDUCATIONAL | FORMAL | Stile comunicazione |
| detailLevel | enum | BASIC, INTERMEDIATE, ADVANCED | INTERMEDIATE | Livello dettaglio |
| useKnowledgeBase | boolean | - | false | Usa documenti KB |

### System Prompt Template
```
Sei un assistente esperto specializzato in {subcategory.name}. 
La tua area di competenza include {subcategory.description}.
Fornisci risposte {responseStyle} con un livello di dettaglio {detailLevel}.
```

---

## 📊 DATI ATTUALI

### Distribuzione Sottocategorie (Agosto 2025)

| Categoria | Sottocategorie | Totale |
|-----------|---------------|--------|
| Idraulica | Riparazione perdite, Installazione sanitari, Sblocco scarichi, Emergenze, Impianti | 5 |
| Elettricista | Riparazioni, Certificazioni, Automazione, Impianti, Illuminazione | 5 |
| Falegnameria | Tinteggiature, Decorazioni, Rasature, Antimuffa, Verniciatura | 5 |
| Muratura | Ristrutturazioni, Piccoli lavori, Posa pavimenti, Isolamento, Cartongesso | 5 |
| Pulizie | Domestiche, Uffici, Sanificazione, Post cantiere, Vetri | 5 |
| **TOTALE** | | **25** |

---

## 🚀 UTILIZZO NEL FLUSSO APPLICATIVO

### 1. Creazione Richiesta (Cliente)
```
1. Cliente seleziona categoria (es. "Idraulica")
2. Sistema carica sottocategorie correlate via API
3. Cliente seleziona sottocategoria (es. "Riparazione perdite")
4. Richiesta salvata con categoryId e subcategoryId
```

### 2. Matching Professionisti
```
1. Sistema cerca professionisti con subcategoryId match
2. Ordina per skillLevel e experienceYears
3. Considera isActive e disponibilità geografica
4. Notifica professionisti qualificati
```

### 3. Assistenza AI
```
1. Cliente avvia chat assistenza
2. Sistema recupera AiSettings per subcategoryId
3. Applica configurazioni (model, temperature, prompt)
4. Se useKnowledgeBase=true, include documenti correlati
5. Genera risposta contestualizzata
```

---

## 🛠️ MANUTENZIONE

### Comandi Utili

```bash
# Verifica sottocategorie nel database
curl http://localhost:3200/api/test/subcategories | python3 -m json.tool

# Crea sottocategorie mancanti
curl -X POST http://localhost:3200/api/test/create-subcategories

# Test endpoint by-category
curl http://localhost:3200/api/subcategories/by-category/[CATEGORY_ID]
```

### Troubleshooting

| Problema | Causa | Soluzione |
|----------|-------|-----------|
| Sottocategorie non visibili | categoryId mancante o errato | Verificare che categoryId sia UUID valido |
| Errore creazione | Slug duplicato | Lasciare vuoto per auto-generazione |
| AI non risponde | AiSettings non configurato | Configurare via admin panel |
| Professionisti non trovati | Nessuna associazione | Assegnare professionisti a sottocategorie |

---

## 📈 BEST PRACTICES

### Naming Convention
- **Nome**: Chiaro e descrittivo (es. "Riparazione perdite")
- **Slug**: kebab-case auto-generato (es. "riparazione-perdite")
- **Descrizione**: Breve ma completa del servizio offerto

### Organizzazione
- Massimo 10 sottocategorie per categoria
- Usare displayOrder per priorità visualizzazione
- Disattivare invece di eliminare se temporaneo
- Mantenere requisiti aggiornati

### Performance
- Cachare sottocategorie lato client (5 min)
- Lazy load solo quando categoria selezionata
- Includere _count solo quando necessario
- Usare pagination per liste lunghe

---

## 🔒 SICUREZZA

### Autorizzazioni
- **Lettura**: Tutti gli utenti autenticati
- **Creazione/Modifica/Eliminazione**: Solo ADMIN/SUPER_ADMIN
- **Configurazione AI**: Solo SUPER_ADMIN
- **Associazione professionisti**: ADMIN o professionista stesso

### Validazione
- Nome: 1-100 caratteri, required
- Slug: 1-100 caratteri, unique per organization
- CategoryId: UUID valido, deve esistere
- Color/TextColor: Formato hex valido
- DisplayOrder: Integer >= 0

---

## 📝 CHANGELOG

### v2.0 (24 Agosto 2025)
- ✅ Implementato sistema completo sottocategorie
- ✅ Aggiunto endpoint by-category
- ✅ Creata pagina admin gestione
- ✅ Implementata configurazione AI
- ✅ Corretto bug update richieste
- ✅ Popolato database con 25 sottocategorie

### v1.0 (Agosto 2025)
- Schema database iniziale
- CRUD base sottocategorie
- Integrazione con richieste

---

## 📞 SUPPORTO

Per problemi o domande sul sistema sottocategorie:
1. Consultare questa documentazione
2. Verificare logs in `/logs/subcategories.log`
3. Contattare team sviluppo

---

*Documentazione generata e mantenuta dal team di sviluppo*  
*Ultimo aggiornamento: 24/08/2025 - Claude AI Assistant*
