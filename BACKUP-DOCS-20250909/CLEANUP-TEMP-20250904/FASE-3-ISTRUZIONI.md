# 📘 FASE 3: FRONTEND REFACTORING
## Rimozione Multi-tenancy - Frontend React

---

## 📋 PROMPT PER CLAUDE - FASE 3

```
Sono un assistente che deve completare la FASE 3 della rimozione del multi-tenancy dal sistema Richiesta Assistenza.

CONTESTO:
- La FASE 1 è completata: database migrato senza organizationId
- La FASE 2 è completata: backend refactored senza organizationId
- Ora il frontend React deve essere aggiornato per rimuovere tutti i riferimenti a organizationId

OBIETTIVO FASE 3:
Refactoring completo del frontend React per rimuovere ogni riferimento a organization e organizationId.

DEVO:
1. Identificare tutti i file TypeScript/JavaScript con "organizationId"
2. Aggiornare AuthContext per rimuovere organizationId da User
3. Aggiornare tutti i service API calls
4. Aggiornare tutti i componenti che usano organizationId
5. Aggiornare types e interfaces
6. Testare che il frontend compili e funzioni
7. Verificare tutte le pagine principali
8. Aggiornare documentazione e PIANO-MASTER

FILE PRINCIPALI DA MODIFICARE:
- /src/contexts/AuthContext.tsx
- /src/services/api.ts
- /src/types/*.ts
- /src/components/**/*.tsx (dove necessario)
- /src/pages/**/*.tsx (dove necessario)

IMPORTANTE:
- Il frontend usa React Query (@tanstack/react-query) per le API
- Il frontend usa Tailwind CSS e @heroicons/react
- Non modificare la logica UI, solo rimuovere organizationId
- Testare ogni pagina dopo le modifiche
```

---

## 🔧 ISTRUZIONI DETTAGLIATE FASE 3

### STEP 3.1: IDENTIFICAZIONE FILE DA MODIFICARE
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Crea backup della directory src
cp -r src src.backup.$(date +%Y%m%d_%H%M%S)

# Identifica tutti i file con organizationId
grep -r "organizationId" src/ --include="*.tsx" --include="*.ts" > frontend_files_with_organizationId.txt

# Identifica tutti i file con Organization type
grep -r "Organization" src/ --include="*.tsx" --include="*.ts" | grep -v "organizationId" > frontend_files_with_organization.txt

# Lista unica dei file
echo "File frontend da modificare:"
cat frontend_files_with_organizationId.txt | cut -d: -f1 | sort | uniq
```

### STEP 3.2: AGGIORNAMENTO AUTH CONTEXT

```typescript
// File: src/contexts/AuthContext.tsx

// PRIMA:
interface User {
  id: string;
  email: string;
  role: Role;
  organizationId: string; // RIMUOVERE
  organization?: { // RIMUOVERE
    id: string;
    name: string;
    slug: string;
  };
}

// DOPO:
interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: Role;
  // Campi profilo senza organization
}

// RIMUOVERE anche da:
// - Login response handling
// - User state management
// - Local storage serialization
```

### STEP 3.3: AGGIORNAMENTO API SERVICE

```typescript
// File: src/services/api.ts o simile

// PRIMA:
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Organization-Id': localStorage.getItem('organizationId') // RIMUOVERE
  }
});

// DOPO:
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Rimuovere anche interceptors che aggiungono organizationId
```

### STEP 3.4: AGGIORNAMENTO TYPES

```typescript
// File: src/types/index.ts o src/types/models.ts

// RIMUOVERE Organization interface completamente
// interface Organization { ... } // ELIMINARE

// Aggiornare tutti i types che hanno organizationId:
// - User
// - Category
// - AssistanceRequest
// - Quote
// - Notification
// etc.
```

### STEP 3.5: AGGIORNAMENTO COMPONENTI

#### Pattern comuni da cercare e rimuovere:
```typescript
// RIMUOVERE filtri organizationId nelle query
const { data } = useQuery({
  queryKey: ['categories', user?.organizationId], // Rimuovere organizationId
  queryFn: () => api.getCategories(user?.organizationId) // Rimuovere parametro
});

// DOPO:
const { data } = useQuery({
  queryKey: ['categories'],
  queryFn: () => api.getCategories()
});
```

### STEP 3.6: AGGIORNAMENTO REACT QUERY HOOKS

```typescript
// Cercare e aggiornare tutti gli hooks custom
// File: src/hooks/useCategories.ts (esempio)

// PRIMA:
export function useCategories(organizationId?: string) {
  return useQuery({
    queryKey: ['categories', organizationId],
    queryFn: () => categoryService.getAll(organizationId),
    enabled: !!organizationId
  });
}

// DOPO:
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll()
  });
}
```

### STEP 3.7: TEST COMPILAZIONE FRONTEND
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Test TypeScript compilation
npx tsc --noEmit

# Build di prova
npm run build

# Se ci sono errori, risolverli uno alla volta
```

### STEP 3.8: TEST FUNZIONALE COMPLETO
```bash
# Avvia backend (deve essere già aggiornato dalla FASE 2)
cd backend
npm run dev

# In nuovo terminale, avvia frontend
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza
npm run dev

# Testare manualmente:
# 1. Login page - http://localhost:5193/login
# 2. Dashboard - http://localhost:5193/dashboard
# 3. Requests - http://localhost:5193/requests
# 4. Quotes - http://localhost:5193/quotes
# 5. Admin panel - http://localhost:5193/admin (se admin)
```

### STEP 3.9: CHECKLIST PAGINE DA TESTARE

- [ ] `/login` - Login funzionante
- [ ] `/register` - Registrazione funzionante
- [ ] `/dashboard` - Dashboard carica correttamente
- [ ] `/requests` - Lista richieste visibile
- [ ] `/requests/new` - Creazione nuova richiesta
- [ ] `/quotes` - Lista preventivi
- [ ] `/quotes/new` - Creazione preventivo
- [ ] `/admin` - Pannello admin (solo per admin)
- [ ] `/profile` - Profilo utente

---

## 📝 CHECKLIST FILE PRINCIPALI

### Contexts:
- [ ] `AuthContext.tsx` - Rimuovere organizationId da User type
- [ ] Altri context che usano User

### Services:
- [ ] `api.ts` - Rimuovere header X-Organization-Id
- [ ] `auth.service.ts` - Aggiornare login/register responses
- [ ] `request.service.ts` - Rimuovere parametri organizationId
- [ ] `quote.service.ts` - Rimuovere parametri organizationId

### Hooks:
- [ ] `useAuth.ts` - Aggiornare User type
- [ ] `useCategories.ts` - Rimuovere organizationId
- [ ] `useRequests.ts` - Rimuovere organizationId
- [ ] `useQuotes.ts` - Rimuovere organizationId

### Components:
- [ ] Header/Navbar - Rimuovere display organization name
- [ ] Sidebar - Rimuovere organization selector
- [ ] Forms - Rimuovere hidden organizationId fields

---

## 🔄 ROLLBACK FASE 3 (SE NECESSARIO)

```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Ripristina backup del codice frontend
rm -rf src
cp -r src.backup.[TIMESTAMP] src

# Reinstalla dipendenze se necessario
npm install

# Ricompila
npm run build
```

---

## ✅ CRITERI DI COMPLETAMENTO FASE 3

La FASE 3 è considerata COMPLETA quando:
- ✅ Nessun file frontend contiene "organizationId"
- ✅ AuthContext aggiornato senza organization
- ✅ API calls non inviano organizationId
- ✅ TypeScript compila senza errori
- ✅ Build production completata con successo
- ✅ Tutte le pagine principali funzionanti
- ✅ Login/Logout funzionante
- ✅ CRUD operations funzionanti
- ✅ Documentazione aggiornata

---

## 📊 SCRIPT DI VALIDAZIONE

```bash
#!/bin/bash
# File: validate-fase3.sh

echo "=== VALIDAZIONE FASE 3 ==="

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# 1. Check organizationId nel frontend
echo "Checking for organizationId in frontend..."
grep -r "organizationId" src/ --include="*.tsx" --include="*.ts" | grep -v "backup" | grep -v "node_modules"

# 2. Test TypeScript
echo "Testing TypeScript compilation..."
npx tsc --noEmit

# 3. Test build
echo "Testing production build..."
npm run build

# 4. Check for Organization type
echo "Checking for Organization type..."
grep -r "interface Organization" src/ --include="*.ts"

echo "Se tutti i check sono vuoti/passati, FASE 3 COMPLETATA ✅"
```

---

## 🎯 TEST END-TO-END FINALE

Dopo il completamento, testare il flusso completo:

1. **Registrazione nuovo utente**
   - Registrare un CLIENT
   - Registrare un PROFESSIONAL

2. **Login e navigazione**
   - Login come CLIENT
   - Login come PROFESSIONAL
   - Login come ADMIN

3. **Operazioni CRUD**
   - CLIENT: Creare nuova richiesta
   - PROFESSIONAL: Creare preventivo
   - ADMIN: Gestire categorie

4. **Verifica dati**
   - I dati esistenti sono ancora visibili
   - Le nuove operazioni funzionano

---

**NOTA PER L'ESECUTORE**: 
- Tempo stimato: 2 ore
- Testare frequentemente durante le modifiche
- Usare React Developer Tools per debug
- Controllare la console del browser per errori
