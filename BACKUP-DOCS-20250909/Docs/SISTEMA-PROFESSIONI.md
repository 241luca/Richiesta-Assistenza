# Sistema Gestione Professioni - Documentazione Completa

## 📋 Indice
1. [Panoramica](#panoramica)
2. [Architettura](#architettura)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Come Utilizzare](#come-utilizzare)
7. [Manutenzione](#manutenzione)

---

## 📌 Panoramica

Il **Sistema di Gestione Professioni** permette di standardizzare e gestire le professioni dei professionisti attraverso una tabella dedicata nel database, sostituendo il vecchio campo testo libero.

### Caratteristiche Principali:
- ✅ **Tabella Professioni**: Gestione centralizzata delle professioni disponibili
- ✅ **Assegnazione Professione**: Ogni professionista può essere associato a una professione dalla tabella
- ✅ **Interfaccia Admin**: Gestione completa delle professioni tramite interfaccia grafica
- ✅ **Backward Compatibility**: Supporto per il vecchio campo testo per compatibilità

### Vantaggi:
- **Standardizzazione**: Nomi uniformi delle professioni
- **Ricerca Migliorata**: Filtri e ricerche più efficienti
- **Statistiche**: Possibilità di analisi per professione
- **Manutenzione**: Gestione centralizzata senza modificare i singoli utenti

---

## 🏗️ Architettura

### Stack Tecnologico:
- **Database**: PostgreSQL con Prisma ORM
- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + TypeScript + TanStack Query
- **UI**: Tailwind CSS + Heroicons

### Flusso Dati:
```
Database (PostgreSQL)
    ↓
Prisma ORM
    ↓
Backend API (Express)
    ↓
ResponseFormatter (include professionData)
    ↓
Frontend (React)
    ↓
UI Components
```

---

## 💾 Database Schema

### Tabella: `Profession`

```prisma
model Profession {
  id           String   @id @default(uuid())
  name         String   @unique
  slug         String   @unique
  description  String?
  isActive     Boolean  @default(true)
  displayOrder Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // Relazioni
  users        User[]   @relation("UserProfession")
}
```

### Modifiche alla tabella `User`:

```prisma
model User {
  // ... altri campi ...
  
  // Campo legacy (testo libero)
  profession     String?
  
  // Nuovo campo relazionale
  professionId   String?
  professionData Profession? @relation("UserProfession", fields: [professionId], references: [id])
  
  // ... altri campi ...
}
```

### Professioni Predefinite:
1. Idraulico
2. Elettricista
3. Falegname
4. Muratore
5. Imbianchino
6. Fabbro
7. Tecnico Climatizzazione
8. Tecnico Elettrodomestici
9. Giardiniere
10. Tecnico Informatico
11. Serramentista
12. Piastrellista
13. Decoratore
14. Tecnico Allarmi
15. Pulizie Professionali

---

## 🔌 API Endpoints

### 1. GET /api/professions
**Descrizione**: Ottiene la lista di tutte le professioni
**Autorizzazione**: Pubblica
**Query Parameters**:
- `isActive` (boolean): Filtra solo professioni attive

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Idraulico",
      "slug": "idraulico",
      "description": "Professionista specializzato...",
      "isActive": true,
      "displayOrder": 1,
      "_count": {
        "users": 5
      }
    }
  ]
}
```

### 2. POST /api/professions
**Descrizione**: Crea una nuova professione
**Autorizzazione**: Solo ADMIN/SUPER_ADMIN
**Body**:
```json
{
  "name": "Nome Professione",
  "slug": "nome-professione",
  "description": "Descrizione opzionale",
  "displayOrder": 10,
  "isActive": true
}
```

### 3. PUT /api/professions/:id
**Descrizione**: Aggiorna una professione esistente
**Autorizzazione**: Solo ADMIN/SUPER_ADMIN
**Body**: Come POST

### 4. DELETE /api/professions/:id
**Descrizione**: Elimina una professione
**Autorizzazione**: Solo ADMIN/SUPER_ADMIN
**Note**: Non permessa se ci sono utenti associati

### 5. PUT /api/professions/user/:userId
**Descrizione**: Assegna una professione a un utente
**Autorizzazione**: Solo ADMIN/SUPER_ADMIN
**Body**:
```json
{
  "professionId": "uuid-professione"
}
```

---

## 🎨 Frontend Components

### 1. Tabelle Sistema (`/admin/system-enums`)

**Percorso**: Menu → Tabelle Sistema → Tab Professioni

**Funzionalità**:
- Lista completa delle professioni
- Aggiunta nuove professioni
- Modifica inline
- Eliminazione (se non in uso)
- Badge con numero professionisti per professione
- Ordinamento e stato attivo/inattivo

**File**: `/src/pages/admin/SystemEnumsPage.tsx`

### 2. Gestione Competenze Professionista

**Percorso**: Menu → Gestione Professionisti → [Professionista] → Competenze

**Funzionalità**:
- Visualizzazione professione attuale
- Dropdown per selezione nuova professione
- Salvataggio immediato
- Indicatore visivo per professioni non tabellate

**File**: `/src/pages/admin/professionals/competenze/ProfessionalCompetenze.tsx`

### 3. Visualizzazioni

La professione viene mostrata in:
- Lista professionisti
- Dettaglio professionista
- Dettaglio richiesta
- Confronto preventivi
- Menu laterale professionista

---

## 📖 Come Utilizzare

### Per Amministratori

#### Aggiungere una Nuova Professione:
1. Vai in **Tabelle Sistema**
2. Seleziona tab **Professioni**
3. Clicca **"Aggiungi Professione"**
4. Compila:
   - Nome (es: "Antennista")
   - Slug (generato automaticamente)
   - Descrizione (opzionale)
   - Ordine visualizzazione
5. Clicca **"Crea Professione"**

#### Assegnare Professione a Professionista:
1. Vai in **Gestione Professionisti**
2. Clicca **"Gestisci"** sul professionista
3. Vai alla tab **"Competenze"**
4. Nella sezione **"Professione/Qualifica"**:
   - Clicca **"Modifica"**
   - Seleziona la professione dal dropdown
   - Clicca **"Salva"**

#### Modificare una Professione:
1. In **Tabelle Sistema → Professioni**
2. Clicca l'icona **matita** sulla professione
3. Modifica i campi inline
4. Clicca il **check verde** per salvare

### Per Sviluppatori

#### Aggiungere Nuove Professioni via Script:

```typescript
// script: add-profession.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addProfession() {
  await prisma.profession.create({
    data: {
      name: "Antennista",
      slug: "antennista",
      description: "Specialista in installazione e manutenzione antenne",
      displayOrder: 16,
      isActive: true
    }
  });
}
```

#### Migrare Professioni da Campo Testo:

```typescript
// Trova professionisti con professione testo ma senza professionId
const professionals = await prisma.user.findMany({
  where: {
    role: 'PROFESSIONAL',
    profession: { not: null },
    professionId: null
  }
});

// Assegna professione basandosi sul testo
for (const prof of professionals) {
  const matchingProfession = await prisma.profession.findFirst({
    where: {
      name: { contains: prof.profession, mode: 'insensitive' }
    }
  });
  
  if (matchingProfession) {
    await prisma.user.update({
      where: { id: prof.id },
      data: { professionId: matchingProfession.id }
    });
  }
}
```

---

## 🔧 Manutenzione

### Backup Professioni

```bash
# Esporta professioni
pg_dump -t profession $DATABASE_URL > professions_backup.sql

# Importa professioni
psql $DATABASE_URL < professions_backup.sql
```

### Controllo Integrità

```sql
-- Professionisti senza professione tabellata
SELECT COUNT(*) 
FROM "User" 
WHERE role = 'PROFESSIONAL' 
AND "professionId" IS NULL;

-- Professioni non utilizzate
SELECT p.name, COUNT(u.id) as users_count
FROM "Profession" p
LEFT JOIN "User" u ON p.id = u."professionId"
GROUP BY p.id, p.name
HAVING COUNT(u.id) = 0;
```

### Risoluzione Problemi Comuni

#### Problema: Professione non visibile nel frontend
**Soluzione**:
1. Verificare che il backend sia riavviato
2. Controllare che `formatUser` includa `professionData`
3. Verificare che l'endpoint includa `professionData: true`

#### Problema: Impossibile eliminare professione
**Soluzione**: Verificare che non ci siano utenti associati
```sql
SELECT COUNT(*) FROM "User" WHERE "professionId" = 'id-professione';
```

#### Problema: Dropdown vuoto nelle competenze
**Soluzione**: Verificare che ci siano professioni attive
```sql
SELECT * FROM "Profession" WHERE "isActive" = true;
```

---

## 📊 Statistiche e Report

### Query Utili

```sql
-- Top 5 professioni più utilizzate
SELECT 
  p.name,
  COUNT(u.id) as professionisti,
  ROUND(COUNT(u.id) * 100.0 / (SELECT COUNT(*) FROM "User" WHERE role = 'PROFESSIONAL'), 2) as percentuale
FROM "Profession" p
JOIN "User" u ON p.id = u."professionId"
GROUP BY p.id, p.name
ORDER BY professionisti DESC
LIMIT 5;

-- Professionisti per città e professione
SELECT 
  u.city,
  p.name as professione,
  COUNT(*) as totale
FROM "User" u
JOIN "Profession" p ON u."professionId" = p.id
WHERE u.role = 'PROFESSIONAL'
GROUP BY u.city, p.name
ORDER BY u.city, totale DESC;
```

---

## 🚀 Miglioramenti Futuri

1. **Multi-professione**: Permettere a un professionista di avere più professioni
2. **Certificazioni**: Associare certificazioni richieste per professione
3. **Tariffe Standard**: Definire range di tariffe per professione
4. **Specializzazioni**: Sotto-categorie per ogni professione
5. **Validazione Automatica**: Verifica automatica delle competenze

---

## 📝 Changelog

### Versione 1.0.0 (04/09/2025)
- ✅ Implementazione iniziale sistema professioni
- ✅ Migrazione da campo testo a tabella
- ✅ Interfaccia admin per gestione
- ✅ Integrazione con sistema esistente
- ✅ Backward compatibility con campo profession legacy

---

## 📞 Supporto

Per problemi o domande:
- **Email**: support@assistenza.it
- **Documentazione Tecnica**: `/docs/DOCUMENTAZIONE_TECNICA_COMPLETA.md`
- **Repository**: [GitHub - Richiesta Assistenza](https://github.com/yourusername/richiesta-assistenza)

---

*Ultimo aggiornamento: 04/09/2025*
