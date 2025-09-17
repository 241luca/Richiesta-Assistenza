# ISTRUZIONI SISTEMAZIONE ERRORI TYPESCRIPT - Sistema Richiesta Assistenza

## SITUAZIONE ATTUALE

Il sistema ha 335+ errori TypeScript causati da:
1. **Modifiche al seed.ts** che hanno alterato relazioni database
2. **ResponseFormatter inserito ovunque** senza controllo sistematico  
3. **Incoerenza tra schema.prisma e codice esistente**

## OBIETTIVO DELLA SESSIONE

Sistemare il codice seguendo gli standard definiti in ISTRUZIONI-PROGETTO.md per ottenere:
- Zero errori TypeScript
- Sistema funzionante (backend + frontend)
- Codice pulito e consistente

## SEQUENZA OPERATIVA OBBLIGATORIA

### FASE 1: ANALISI STATO ATTUALE (10 min)

```bash
# 1.1 Verificare schema database attuale
cd backend
npx prisma db pull --schema=./prisma/schema.prisma
git diff prisma/schema.prisma

# 1.2 Rigenerare client Prisma aggiornato
npx prisma generate

# 1.3 Catalogare errori TypeScript per categoria
npx tsc --noEmit | tee typescript-errors.log
grep "error TS" typescript-errors.log | cut -d: -f4 | sort | uniq -c | sort -nr
```

**Output atteso**: Lista errori per tipologia (es: TS2339 Property does not exist, TS2322 Type not assignable)

### FASE 2: BACKUP PREVENTIVO COMPLETO (5 min)

```bash
# 2.1 Backup schema database
cp backend/prisma/schema.prisma backend/prisma/schema.backup-$(date +%Y%m%d-%H%M%S).prisma

# 2.2 Backup cartelle critiche che verranno modificate
cp -r backend/src/routes backend/src/routes.backup-$(date +%Y%m%d-%H%M%S)
cp -r backend/src/services backend/src/services.backup-$(date +%Y%m%d-%H%M%S)
cp -r backend/src/middleware backend/src/middleware.backup-$(date +%Y%m%d-%H%M%S)

# 2.3 Annotare backup creati
echo "## Backup Creati - $(date)" >> SISTEMAZIONE-LOG.md
echo "- schema.prisma" >> SISTEMAZIONE-LOG.md
echo "- routes/, services/, middleware/" >> SISTEMAZIONE-LOG.md
```

### FASE 3: PULIZIA FILE BACKUP OBSOLETI (5 min)

```bash
# 3.1 Identificare file backup esistenti
find . -name "*.backup-*" -type f | head -20

# 3.2 Rimuovere backup obsoleti (oltre 7 giorni)
find . -name "*.backup-*" -mtime +7 -delete

# 3.3 Catalogare backup recenti da mantenere
find . -name "*.backup-*" -mtime -7 > backup-files-to-keep.log
echo "File backup mantenuti: $(wc -l < backup-files-to-keep.log)" >> SISTEMAZIONE-LOG.md
```

### FASE 4: CORREZIONE SISTEMATICA ERRORI (45 min)

**IMPORTANTE**: Seguire rigorosamente questo ordine per evitare cascata di errori.

#### 4.1 Correggere Relazioni Database (15 min)

**Problema**: Errori tipo `Property 'client' does not exist`, `Property 'professional' does not exist`, `Property 'items' does not exist`

**Azioni**:
```bash
# Identificare tutti i file con relazioni problematiche
grep -r "\.client\." backend/src/ 
grep -r "\.professional\." backend/src/
grep -r "\.items\." backend/src/
grep -r "\.request\." backend/src/
```

**Correzioni da applicare**:
- Sostituire `.client.` con `clientId` dove appropriato
- Sostituire `.professional.` con `professionalId` dove appropriato  
- Aggiornare tutti gli `include:` e `select:` secondo schema attuale
- Rimuovere relazioni inesistenti dalle query Prisma

**Validazione step**: `npx tsc --noEmit | grep -c "Property.*does not exist"` deve diminuire significativamente

#### 4.2 Correggere Uso ResponseFormatter (15 min)

**Problema**: ResponseFormatter usato nei services invece che solo nelle routes

**Azioni**:
```bash
# Identificare uso scorretto
grep -r "ResponseFormatter" backend/src/services/
```

**Correzioni da applicare**:
- **RIMUOVERE** ResponseFormatter da TUTTI i file in `services/`
- I services devono `return` dati diretti o `throw Error`
- **MANTENERE** ResponseFormatter SOLO in `routes/`
- Pattern corretto nei services:
```typescript
// CORRETTO nei services
export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error('User not found');
  return user;
}

// CORRETTO nelle routes  
export async function getUserRoute(req: Request, res: Response) {
  try {
    const user = await userService.getUser(req.params.id);
    return ResponseFormatter.success(user);
  } catch (error) {
    return ResponseFormatter.error(error.message);
  }
}
```

**Validazione step**: `grep -r "ResponseFormatter" backend/src/services/` deve ritornare 0 risultati

#### 4.3 Correggere Campi Mancanti nelle Operazioni Database (15 min)

**Problema**: Errori `missing properties from type`: id, updatedAt, organizationId, totalAmount

**Azioni**:
```bash
# Identificare operazioni create/update problematiche
grep -r "\.create\(" backend/src/ | grep -E "(User|Quote|Request)"
grep -r "\.update\(" backend/src/ | grep -E "(User|Quote|Request)"
```

**Correzioni da applicare**:
- Rimuovere campi `id` e `updatedAt` dalle operazioni `create` (auto-generati)
- Aggiungere campi obbligatori mancanti secondo schema
- Verificare che `organizationId` sia gestito correttamente se multi-tenant
- Correggere nomi campi (es: `totalAmount` vs `total_amount`)

**Validazione step**: `npx tsc --noEmit | grep -c "missing.*properties"` deve essere 0

### FASE 5: VALIDAZIONE TECNICA (15 min)

#### 5.1 Zero Errori TypeScript (OBBLIGATORIO)
```bash
npx tsc --noEmit
echo "Exit code: $?"  # Deve essere 0
```

#### 5.2 Server Backend Si Avvia
```bash
cd backend
npm run dev &
SERVER_PID=$!
sleep 10
curl -s http://localhost:3200/api/health || echo "ERRORE: Server non risponde"
kill $SERVER_PID
```

#### 5.3 Frontend Si Avvia  
```bash
npm run dev &
FRONTEND_PID=$!
sleep 10
curl -s http://localhost:5193 || echo "ERRORE: Frontend non accessibile"
kill $FRONTEND_PID
```

### FASE 6: TEST FUNZIONALI MINIMI (10 min)

**Test obbligatori da completare manualmente**:
1. **Login/Logout**: Accesso con credenziali valide
2. **Get User Profile**: Endpoint profilo utente
3. **List Requests**: Endpoint lista richieste  
4. **Create Request**: Creazione nuova richiesta base
5. **Admin Panel Access**: Se ruolo admin disponibile

**Per ogni test annotare in SISTEMAZIONE-LOG.md**:
- URL testato
- Metodo HTTP
- Status code ricevuto
- Eventuali errori

### FASE 7: PULIZIA E DOCUMENTAZIONE (5 min)

#### 7.1 Pulire File di Debug
```bash
rm -f typescript-errors.log backup-files-to-keep.log
```

#### 7.2 Report Finale
Completare il file `SISTEMAZIONE-LOG.md` con:
- Numero errori corretti per categoria
- File modificati (lista completa)
- Test superati
- Eventuali problemi residui
- Backup creati e loro ubicazione

#### 7.3 Commit delle Modifiche
```bash
git add .
git commit -m "fix: risolti errori TypeScript - schema/code consistency

- Corrette relazioni database secondo schema attuale  
- ResponseFormatter rimosso dai services, mantenuto solo in routes
- Campi mancanti aggiunti alle operazioni database
- Pulizia file backup obsoleti

Errori corretti: 335+ -> 0
Test: login/logout, user profile, requests CRUD"
```

## REGOLE OPERATIVE CRITICHE

### SEMPRE seguire questo ordine:
1. Database/Schema → 2. Services → 3. Routes → 4. Middleware → 5. Test

### MAI modificare senza:
- Backup preventivo del file/cartella
- Verifica `npx tsc --noEmit` dopo step significativo
- Annotazione in SISTEMAZIONE-LOG.md

### SEMPRE verificare dopo ogni correzione:
```bash
npx tsc --noEmit
echo "Errori rimanenti: $(npx tsc --noEmit 2>&1 | grep -c "error TS")"
```

### PATTERN DI CORREZIONE STANDARD

#### Per errori "Property does not exist":
1. Verificare schema.prisma attuale
2. Aggiornare include/select
3. Sostituire relazione con campo diretto se necessario

#### Per errori "Type not assignable":
1. Verificare tipi generati da Prisma
2. Aggiornare interfacce TypeScript
3. Correggere operazioni create/update

#### Per errori ResponseFormatter:
1. Rimuovere da services
2. Mantenere solo in routes
3. Services ritornano dati o throw Error

## DELIVERABLE RICHIESTI

Al termine della sessione devono essere garantiti:

1. **Zero errori TypeScript** (`npx tsc --noEmit` pulito)
2. **Backend funzionante** (si avvia su porta 3200)
3. **Frontend funzionante** (si avvia su porta 5193)
4. **Test funzionali base superati** (login + 2 endpoint)
5. **Report completo** in SISTEMAZIONE-LOG.md
6. **File backup catalogati** e mantenuti per rollback
7. **Commit con messaggio descrittivo** delle modifiche

## IN CASO DI BLOCCO

Se dopo 60 minuti di lavoro non si raggiunge l'obiettivo:

1. **Salvare lo stato attuale** in SISTEMAZIONE-LOG.md
2. **Identificare blocco principale** (categoria errori più numerosa)
3. **Ripristinare backup** se necessario
4. **Chiedere supporto** con dettagli specifici del problema
5. **NON** fare commit di codice non funzionante

## RISORSE DI RIFERIMENTO

- **ISTRUZIONI-PROGETTO.md**: Sezioni Schema-First Development, ResponseFormatter Guidelines, Gestione Relazioni Prisma
- **Schema Database**: `backend/prisma/schema.prisma`
- **Errori TypeScript**: Output di `npx tsc --noEmit`
- **Pattern Corretti**: Esempi in ISTRUZIONI-PROGETTO.md sezione "Pattern Specifici"

---

**CREATO**: 28 Agosto 2025  
**VERSIONE**: 1.0  
**UTILIZZO**: Sessione sistemazione errori TypeScript