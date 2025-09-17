# 📋 PROMPT FASE 2 - BACKEND REFACTORING

Copia questo prompt in una nuova sessione Claude:

---

Sono un assistente che deve completare la **FASE 2** della rimozione del multi-tenancy dal sistema Richiesta Assistenza.

## PREREQUISITI
⚠️ **VERIFICARE PRIMA DI INIZIARE**:
- La FASE 1 deve essere COMPLETATA (verificare in PIANO-MASTER-RIMOZIONE-MULTITENANCY.md)
- Il database deve essere già migrato senza organizationId

## DOCUMENTI DA LEGGERE PRIMA DI INIZIARE
1. **LEGGERE OBBLIGATORIAMENTE**: `/Users/lucamambelli/Desktop/Richiesta-Assistenza/FASE-2-ISTRUZIONI.md`
   - Contiene TUTTE le istruzioni dettagliate per il refactoring backend
   - Include pattern di codice da seguire
   - Ha checklist file per file
   - Spiega procedure di test e rollback

2. **CONSULTARE**: `/Users/lucamambelli/Desktop/Richiesta-Assistenza/PIANO-MASTER-RIMOZIONE-MULTITENANCY.md`
   - Per verificare che FASE 1 sia completata
   - Per aggiornare lo stato di avanzamento FASE 2

## CONTESTO
- La FASE 1 è stata completata: il database non ha più organizationId
- Lo schema Prisma è stato aggiornato e sincronizzato
- Ora il backend TypeScript deve essere aggiornato per rimuovere tutti i riferimenti a organizationId

## OBIETTIVO FASE 2
Refactoring completo del backend Node.js/Express/TypeScript per rimuovere ogni riferimento a organization e organizationId.

## TASK DA COMPLETARE
1. ✅ Leggere completamente FASE-2-ISTRUZIONI.md
2. ✅ Identificare tutti i file che contengono "organizationId"
3. ✅ Fare backup della directory src del backend
4. ✅ Eliminare organization.middleware.ts
5. ✅ Aggiornare tutti i services rimuovendo filtri organizationId
6. ✅ Aggiornare tutti i routes rimuovendo controlli organization
7. ✅ Aggiornare types e interfaces
8. ✅ Testare compilazione TypeScript
9. ✅ Testare avvio backend
10. ✅ Testare endpoint principali
11. ✅ Aggiornare PIANO-MASTER con stato completamento
12. ✅ Creare report in `/REPORT-SESSIONI-CLAUDE/2025-01-GENNAIO/fase2-backend-refactoring.md`

## FILE PRINCIPALI DA MODIFICARE
Le istruzioni dettagliate specificano tutti i file, ma i principali sono:
- `/backend/src/middleware/organization.middleware.ts` - DA ELIMINARE
- `/backend/src/services/*.service.ts` - TUTTI da aggiornare
- `/backend/src/routes/*.routes.ts` - TUTTI da aggiornare
- `/backend/src/types/index.ts` - Rimuovere Organization types

## STRUMENTI DISPONIBILI
Hai accesso completo a:
- Filesystem (lettura/scrittura file)
- Terminal (esecuzione comandi)
- TypeScript compiler (tsc)
- Node.js e npm
- Git per versioning

## REGOLE IMPORTANTI
- **SEGUIRE ESATTAMENTE** le istruzioni in FASE-2-ISTRUZIONI.md
- **FARE BACKUP** di ogni file prima di modificarlo
- **TESTARE** la compilazione dopo ogni gruppo di modifiche
- **NON MODIFICARE** la logica business, solo rimuovere organizationId
- **DOCUMENTARE** tutti i file modificati nel report

## PATTERN DA SEGUIRE
Le istruzioni dettagliate includono esempi di codice. Pattern generale:

**PRIMA** (con organizationId):
```typescript
async getAll(organizationId: string, filters?: any) {
  return await prisma.model.findMany({
    where: { organizationId, ...filters }
  });
}
```

**DOPO** (senza organizationId):
```typescript
async getAll(filters?: any) {
  return await prisma.model.findMany({
    where: filters
  });
}
```

## VALIDAZIONE FINALE
La FASE 2 sarà completa quando:
- ✅ Nessun file contiene "organizationId"
- ✅ organization.middleware.ts eliminato
- ✅ TypeScript compila senza errori
- ✅ Backend avviabile con npm run dev
- ✅ API endpoints funzionanti
- ✅ PIANO-MASTER aggiornato
- ✅ Report di sessione creato

## COME INIZIARE
1. Verificare che FASE 1 sia completata in PIANO-MASTER
2. Leggere completamente `/Users/lucamambelli/Desktop/Richiesta-Assistenza/FASE-2-ISTRUZIONI.md`
3. Seguire le istruzioni STEP by STEP
4. Testare frequentemente durante le modifiche

**INIZIA LEGGENDO IL FILE FASE-2-ISTRUZIONI.md**
