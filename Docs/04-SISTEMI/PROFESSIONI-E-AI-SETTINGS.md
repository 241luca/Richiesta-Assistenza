# 📚 Sistema Professioni e AI Settings - Documentazione Completa
**Data Implementazione**: 15 Settembre 2025  
**Versione**: 1.0.0  
**Stato**: ✅ Completamente Funzionante

---

## 📋 Sommario

1. [Overview del Sistema](#overview-del-sistema)
2. [Funzionalità Implementate](#funzionalità-implementate)
3. [Architettura Tecnica](#architettura-tecnica)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Come Utilizzare il Sistema](#come-utilizzare-il-sistema)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview del Sistema

Il sistema gestisce le professioni dei professionisti e le loro impostazioni AI personalizzate per ogni sottocategoria di competenza.

### Caratteristiche Principali:
- **Professioni Tabellate**: Sistema centralizzato di gestione professioni (non più campo testo libero)
- **Relazione Professione-Categorie**: Ogni professione può lavorare in specifiche categorie
- **AI Settings Personalizzate**: Ogni professionista può configurare l'AI per ogni sua sottocategoria
- **Gestione Competenze**: Interfaccia completa per gestire le competenze del professionista

---

## ✅ Funzionalità Implementate

### 1. Sistema Professioni
- ✅ Tabella `Profession` nel database
- ✅ Collegamento `User.professionId` → `Profession.id`
- ✅ Relazione `professionData` popolata automaticamente
- ✅ Visualizzazione professione in tutto il sistema

### 2. Gestione Categorie Professione
- ✅ Tabella `ProfessionCategory` per relazioni molti-a-molti
- ✅ Visualizzazione categorie abilitate per ogni professione
- ✅ Filtro sottocategorie basato su categorie della professione

### 3. AI Settings per Sottocategoria
- ✅ Tabella `ProfessionalAISettings` nel database
- ✅ Configurazione personalizzata per ogni professionista/sottocategoria
- ✅ Parametri configurabili:
  - Modello AI (GPT-3.5, GPT-4, GPT-4 Turbo)
  - Temperatura (creatività)
  - Token massimi
  - Stile risposta
  - Livello di dettaglio
  - Prompt di sistema personalizzato
  - Uso Knowledge Base

### 4. Interfaccia Amministrativa
- ✅ Pagina Gestione Competenze
- ✅ Pagina AI Settings
- ✅ Dropdown professioni con selezione
- ✅ Visualizzazione categorie della professione
- ✅ Form completo impostazioni AI

---

## 🏗️ Architettura Tecnica

### Backend Structure

```
backend/
├── prisma/
│   └── schema.prisma           # Modelli: Profession, ProfessionCategory, ProfessionalAISettings
├── src/
│   ├── routes/
│   │   ├── professions.routes.ts
│   │   ├── profession-categories.routes.ts
│   │   └── professional-ai-settings.routes.ts
│   └── server.ts               # Registrazione routes
```

### Frontend Structure

```
src/
├── pages/admin/professionals/
│   ├── ProfessionalLayout.tsx
│   ├── competenze/
│   │   ├── ProfessionalCompetenze.tsx
│   │   └── AddSubcategoryModal.tsx
│   └── ProfessionalAI.tsx
└── services/
    └── api.ts                  # Client API con baseURL
```

---

## 🗄️ Database Schema

### Tabella Profession
```prisma
model Profession {
  id            String   @id @default(cuid())
  name          String   @unique
  slug          String   @unique
  description   String?
  isActive      Boolean  @default(true)
  displayOrder  Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // Relazioni
  users         User[]
  categories    ProfessionCategory[]
}
```

### Tabella ProfessionCategory
```prisma
model ProfessionCategory {
  id           String    @id @default(cuid())
  professionId String
  categoryId   String
  description  String?
  isDefault    Boolean   @default(false)
  isActive     Boolean   @default(true)
  createdAt    DateTime  @default(now())
  
  // Relazioni
  profession   Profession @relation(fields: [professionId], references: [id])
  category     Category   @relation(fields: [categoryId], references: [id])
  
  @@unique([professionId, categoryId])
}
```

### Tabella ProfessionalAISettings
```prisma
model ProfessionalAISettings {
  id                String      @id @default(cuid())
  professionalId    String
  subcategoryId     String
  
  // Impostazioni modello
  modelName         String      @default("gpt-3.5-turbo")
  temperature       Float       @default(0.7)
  maxTokens         Int         @default(2000)
  
  // Stile e comportamento
  responseStyle     String      @default("formal")
  detailLevel       String      @default("intermediate")
  systemPrompt      String?     @db.Text
  
  // Knowledge base
  useKnowledgeBase  Boolean     @default(true)
  
  // Metadata
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
  
  // Relazioni
  professional      User        @relation(fields: [professionalId], references: [id])
  subcategory       Subcategory @relation(fields: [subcategoryId], references: [id])
  
  @@unique([professionalId, subcategoryId])
}
```

---

## 🔌 API Endpoints

### Professioni
- `GET /api/professions` - Lista tutte le professioni
- `GET /api/professions/:id` - Dettaglio professione
- `POST /api/professions` - Crea professione (SUPER_ADMIN)
- `PUT /api/professions/:id` - Aggiorna professione (SUPER_ADMIN)

### Categorie Professione
- `GET /api/profession-categories` - Lista associazioni
- `GET /api/profession-categories/profession/:professionId` - Categorie di una professione
- `POST /api/profession-categories` - Crea associazione (SUPER_ADMIN)

### AI Settings
- `GET /api/professionals/:professionalId/ai-settings/:subcategoryId` - Recupera impostazioni
- `PUT /api/professionals/:professionalId/ai-settings/:subcategoryId` - Aggiorna impostazioni
- `DELETE /api/professionals/:professionalId/ai-settings/:subcategoryId` - Reset ai default
- `GET /api/professionals/:professionalId/ai-settings` - Lista tutte le impostazioni

---

## 🎨 Frontend Components

### ProfessionalCompetenze.tsx
Gestisce:
- Selezione professione tramite dropdown
- Visualizzazione categorie della professione
- Gestione sottocategorie/competenze
- Aggiunta/rimozione competenze

### ProfessionalAI.tsx
Gestisce:
- Selezione sottocategoria
- Configurazione parametri AI
- Salvataggio impostazioni
- Gestione Knowledge Base

### ProfessionalLayout.tsx
- Sidebar con navigazione
- Mostra nome professionista e professione
- Menu per accedere alle varie sezioni

---

## 📝 Come Utilizzare il Sistema

### Per l'Admin

#### 1. Assegnare una Professione
1. Vai in "Gestione Professionisti"
2. Clicca su "Competenze" per un professionista
3. Nella sezione "Professione Principale":
   - Clicca "Modifica"
   - Seleziona la professione dal dropdown
   - Clicca "Salva"

#### 2. Configurare le Competenze
1. Nella stessa pagina, sezione "Sottocategorie/Competenze"
2. Clicca "Aggiungi Sottocategoria"
3. Seleziona le competenze dalla lista filtrata
4. Clicca "Aggiungi"

#### 3. Configurare AI Settings
1. Vai nella sezione "AI Settings"
2. Seleziona una sottocategoria dal dropdown
3. Configura i parametri:
   - Modello AI
   - Temperatura (creatività)
   - Token massimi
   - Stile risposte
   - Livello dettaglio
   - Prompt di sistema
4. Clicca "Salva Impostazioni AI"

### Per il Professionista
Il professionista può vedere le sue competenze e impostazioni AI ma non modificarle (solo admin).

---

## 🔧 Troubleshooting

### Problema: "Nome non disponibile" nel dropdown sottocategorie
**Soluzione**: Verificare che l'endpoint `/user/subcategories/:id` includa la relazione `subcategory`

### Problema: Errore 500 su AI Settings
**Soluzione**: 
1. Verificare che il modello `ProfessionalAISettings` sia nel database
2. Eseguire `npx prisma generate` e `npx prisma db push`
3. Riavviare il backend

### Problema: Professione non viene visualizzata
**Soluzione**: Verificare che l'endpoint `/admin/users/:id` includa `professionData`

### Problema: Categorie non visibili
**Soluzione**: L'endpoint `/profession-categories/profession/:id` deve includere la relazione `category`

---

## 🚀 Miglioramenti Futuri

1. **Dashboard AI Analytics**
   - Statistiche utilizzo per modello
   - Token consumati per sottocategoria
   - Performance risposte AI

2. **Template Prompt**
   - Libreria prompt predefiniti
   - Condivisione prompt tra professionisti
   - Versionamento prompt

3. **A/B Testing**
   - Test diversi modelli/parametri
   - Metriche di efficacia
   - Ottimizzazione automatica

4. **Bulk Configuration**
   - Applicare stesse impostazioni a più sottocategorie
   - Import/Export configurazioni
   - Template di configurazione per professione

---

## 📊 Stato Attuale

| Componente | Stato | Note |
|------------|-------|------|
| Database Schema | ✅ Completo | Tutte le tabelle create |
| API Endpoints | ✅ Funzionanti | CRUD completo |
| Frontend UI | ✅ Completa | Tutte le pagine operative |
| Validazione | ✅ Implementata | Zod schemas |
| Autorizzazione | ✅ Attiva | Solo admin può modificare |
| Testing | ⚠️ Parziale | Da completare |
| Documentazione | ✅ Completa | Questo documento |

---

## 📌 Note Importanti

1. **Performance**: Le query includono sempre le relazioni necessarie per evitare N+1
2. **Cache**: React Query gestisce il caching con `staleTime: 0` per dati sempre freschi
3. **Sicurezza**: Solo ADMIN e SUPER_ADMIN possono modificare professioni e AI settings
4. **Backup**: Sempre fare backup del database prima di modifiche allo schema

---

**Ultimo aggiornamento**: 15 Settembre 2025  
**Autore**: Team Sviluppo  
**Versione**: 1.0.0
