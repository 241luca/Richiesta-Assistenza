# 📋 PROMPT FASE 3 - FRONTEND REFACTORING

Copia questo prompt in una nuova sessione Claude:

---

Sono un assistente che deve completare la **FASE 3** della rimozione del multi-tenancy dal sistema Richiesta Assistenza.

## PREREQUISITI
⚠️ **VERIFICARE PRIMA DI INIZIARE**:
- La FASE 1 deve essere COMPLETATA (database migrato)
- La FASE 2 deve essere COMPLETATA (backend refactored)
- Verificare stati in PIANO-MASTER-RIMOZIONE-MULTITENANCY.md

## DOCUMENTI DA LEGGERE PRIMA DI INIZIARE
1. **LEGGERE OBBLIGATORIAMENTE**: `/Users/lucamambelli/Desktop/Richiesta-Assistenza/FASE-3-ISTRUZIONI.md`
   - Contiene TUTTE le istruzioni dettagliate per il refactoring frontend
   - Include esempi di codice React/TypeScript
   - Ha checklist componente per componente
   - Spiega come testare ogni pagina

2. **CONSULTARE**: `/Users/lucamambelli/Desktop/Richiesta-Assistenza/PIANO-MASTER-RIMOZIONE-MULTITENANCY.md`
   - Per verificare che FASE 1 e 2 siano completate
   - Per aggiornare lo stato di avanzamento FASE 3

## CONTESTO
- FASE 1 completata: database migrato senza organizationId
- FASE 2 completata: backend completamente refactored
- Ora il frontend React deve essere aggiornato per rimuovere tutti i riferimenti a organizationId

## OBIETTIVO FASE 3
Refactoring completo del frontend React/TypeScript per rimuovere ogni riferimento a organization e organizationId.

## TASK DA COMPLETARE
1. ✅ Leggere completamente FASE-3-ISTRUZIONI.md
2. ✅ Identificare tutti i file React/TypeScript con "organizationId"
3. ✅ Fare backup della directory src
4. ✅ Aggiornare AuthContext rimuovendo organizationId da User
5. ✅ Aggiornare services API (rimuovere headers organization)
6. ✅ Aggiornare tutti i custom hooks
7. ✅ Aggiornare tutti i componenti che usano organizationId
8. ✅ Aggiornare types e interfaces
9. ✅ Testare compilazione TypeScript
10. ✅ Testare build production
11. ✅ Testare manualmente tutte le pagine principali
12. ✅ Aggiornare PIANO-MASTER con stato completamento
13. ✅ Creare report in `/REPORT-SESSIONI-CLAUDE/2025-01-GENNAIO/fase3-frontend-refactoring.md`

## FILE PRINCIPALI DA MODIFICARE
Le istruzioni dettagliate specificano tutti i file, ma i principali sono:
- `/src/contexts/AuthContext.tsx` - Rimuovere organizationId da User type
- `/src/services/api.ts` - Rimuovere header X-Organization-Id
- `/src/types/*.ts` - Rimuovere Organization interface
- `/src/hooks/*.ts` - Aggiornare tutti i custom hooks
- Componenti con query React Query - Rimuovere organizationId dai queryKey

## TECNOLOGIE FRONTEND
Il frontend usa:
- **React 18** con TypeScript
- **Vite** come build tool (NON Webpack)
- **@tanstack/react-query v5** per state management (NON Redux)
- **TailwindCSS** per styling
- **@heroicons/react** per icone
- **React Router v6** per routing

## PATTERN DA SEGUIRE
Le istruzioni dettagliate includono esempi. Pattern generale per React Query:

**PRIMA** (con organizationId):
```typescript
const { data } = useQuery({
  queryKey: ['categories', user?.organizationId],
  queryFn: () => api.getCategories(user?.organizationId)
});
```

**DOPO** (senza organizationId):
```typescript
const { data } = useQuery({
  queryKey: ['categories'],
  queryFn: () => api.getCategories()
});
```

## PAGINE DA TESTARE
Dopo le modifiche, testare manualmente:
- `/login` - Login funzionante
- `/register` - Registrazione funzionante
- `/dashboard` - Dashboard carica correttamente
- `/requests` - Lista richieste visibile
- `/requests/new` - Creazione nuova richiesta
- `/quotes` - Lista preventivi
- `/admin` - Pannello admin (solo per admin)

## VALIDAZIONE FINALE
La FASE 3 sarà completa quando:
- ✅ Nessun file frontend contiene "organizationId"
- ✅ AuthContext aggiornato senza organization
- ✅ TypeScript compila senza errori
- ✅ Build production completata
- ✅ Tutte le pagine funzionanti
- ✅ Login/Logout funzionante
- ✅ CRUD operations funzionanti
- ✅ PIANO-MASTER aggiornato
- ✅ Report di sessione creato

## COME INIZIARE
1. Verificare che FASE 1 e 2 siano completate
2. Avviare il backend: `cd backend && npm run dev`
3. Leggere completamente `/Users/lucamambelli/Desktop/Richiesta-Assistenza/FASE-3-ISTRUZIONI.md`
4. Seguire le istruzioni STEP by STEP
5. Testare frontend: `npm run dev` (porta 5193)

**INIZIA LEGGENDO IL FILE FASE-3-ISTRUZIONI.md**
