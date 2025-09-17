# 📘 FASE 1: MIGRAZIONE DATABASE
## Rimozione Multi-tenancy - Database Migration

---

## 📋 PROMPT PER CLAUDE - FASE 1

```
Sono un assistente che deve completare la FASE 1 della rimozione del multi-tenancy dal sistema Richiesta Assistenza.

CONTESTO:
- Il sistema attualmente ha un campo organizationId in tutte le tabelle che deve essere rimosso
- È già stato preparato un nuovo schema Prisma in /backend/prisma/schema-new.prisma
- È già stato preparato uno script SQL in /backend/migrations/remove-multitenancy.sql
- I backup sono stati già creati in /backups/2025-01-25-pre-removal/

OBIETTIVO FASE 1:
Applicare la migrazione al database PostgreSQL e aggiornare Prisma per rimuovere completamente il multi-tenancy.

DEVO:
1. Verificare lo stato attuale del database
2. Applicare la migrazione SQL
3. Sostituire lo schema Prisma
4. Sincronizzare Prisma con il database
5. Verificare che tutto funzioni
6. Aggiornare la documentazione
7. Aggiornare il PIANO-MASTER con lo stato di completamento

IMPORTANTE:
- Fare backup incrementali prima di ogni operazione critica
- Documentare ogni comando eseguito
- In caso di errore, eseguire rollback immediato
- Aggiornare il file PIANO-MASTER-RIMOZIONE-MULTITENANCY.md con i progressi
```

---

## 🔧 ISTRUZIONI DETTAGLIATE FASE 1

### STEP 1.1: VERIFICA PRE-MIGRAZIONE
```bash
# Terminal 1 - Verifica stato database
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# Controlla che il backend NON stia girando
ps aux | grep "npm run dev"
# Se ci sono processi, terminarli

# Backup database attuale
pg_dump assistenza_db > backups/2025-01-25-pre-removal/db_backup_pre_fase1_$(date +%Y%m%d_%H%M%S).sql

# Verifica presenza tabella Organization
psql assistenza_db -c "SELECT COUNT(*) FROM \"Organization\";"

# Conta record principali
psql assistenza_db -c "SELECT 'Users:', COUNT(*) FROM \"User\";"
psql assistenza_db -c "SELECT 'Categories:', COUNT(*) FROM \"Category\";"
psql assistenza_db -c "SELECT 'Requests:', COUNT(*) FROM \"AssistanceRequest\";"
```

### STEP 1.2: APPLICAZIONE MIGRAZIONE SQL
```bash
# Applica migrazione SQL
psql assistenza_db < backend/migrations/remove-multitenancy.sql

# Verifica che Organization non esista più
psql assistenza_db -c "\dt" | grep Organization
# Non dovrebbe restituire nulla

# Verifica che organizationId sia stato rimosso
psql assistenza_db -c "\d \"User\"" | grep organizationId
# Non dovrebbe restituire nulla
```

### STEP 1.3: AGGIORNAMENTO SCHEMA PRISMA
```bash
cd backend

# Backup schema attuale
cp prisma/schema.prisma prisma/schema.backup.$(date +%Y%m%d_%H%M%S).prisma

# Sostituisci con nuovo schema
cp prisma/schema-new.prisma prisma/schema.prisma

# Sincronizza Prisma con database
npx prisma db pull

# Genera client Prisma
npx prisma generate

# Verifica che non ci siano errori
npx prisma validate
```

### STEP 1.4: VERIFICA POST-MIGRAZIONE
```bash
# Test Prisma Studio per verificare visivamente
npx prisma studio --port 5555
# Aprire browser su http://localhost:5555
# Verificare che:
# 1. Organization non esista
# 2. User non abbia organizationId
# 3. I dati siano ancora presenti

# Test query di base
npx ts-node -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function test() {
  const users = await prisma.user.count();
  const categories = await prisma.category.count();
  console.log('Users:', users);
  console.log('Categories:', categories);
}
test();
"
```

### STEP 1.5: DOCUMENTAZIONE
Aggiornare i seguenti file:
1. `/PIANO-MASTER-RIMOZIONE-MULTITENANCY.md` - Segnare FASE 1 come ✅ Completata
2. `/REPORT-SESSIONI-CLAUDE/2025-01-GENNAIO/fase1-migrazione-db.md` - Creare report dettagliato
3. `/backend/prisma/README.md` - Documentare il nuovo schema

### STEP 1.6: VALIDAZIONE FINALE
```bash
# Checklist validazione
echo "FASE 1 - CHECKLIST VALIDAZIONE"
echo "[ ] Database migrato con successo"
echo "[ ] Tabella Organization eliminata"
echo "[ ] organizationId rimosso da tutte le tabelle"
echo "[ ] Schema Prisma aggiornato"
echo "[ ] Prisma Client rigenerato"
echo "[ ] Prisma Studio funzionante"
echo "[ ] Nessuna perdita di dati"
echo "[ ] Backup disponibili per rollback"
echo "[ ] Documentazione aggiornata"
```

---

## 🔄 ROLLBACK FASE 1 (SE NECESSARIO)

```bash
# In caso di problemi
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza

# 1. Ripristina database
psql assistenza_db < backups/2025-01-25-pre-removal/db_backup_pre_fase1_[TIMESTAMP].sql

# 2. Ripristina schema Prisma
cd backend
cp prisma/schema.backup.[TIMESTAMP].prisma prisma/schema.prisma

# 3. Rigenera Prisma
npx prisma generate

# 4. Verifica
npx prisma studio --port 5555
```

---

## ✅ CRITERI DI COMPLETAMENTO FASE 1

La FASE 1 è considerata COMPLETA quando:
- ✅ Database migrato senza errori
- ✅ Tabella Organization non esiste più
- ✅ Campo organizationId rimosso da tutte le tabelle
- ✅ Schema Prisma sincronizzato con nuovo database
- ✅ Prisma Client funzionante
- ✅ Tutti i dati preservati
- ✅ Documentazione aggiornata
- ✅ Report di sessione creato

---

## 📝 OUTPUT ATTESI FASE 1

Al termine della FASE 1, dovranno essere presenti:
1. Database PostgreSQL senza multi-tenancy
2. Schema Prisma aggiornato e funzionante
3. Report in `/REPORT-SESSIONI-CLAUDE/2025-01-GENNAIO/fase1-migrazione-db.md`
4. `/PIANO-MASTER-RIMOZIONE-MULTITENANCY.md` aggiornato con FASE 1 ✅
5. Backup completi per eventuale rollback

---

**NOTA PER L'ESECUTORE**: 
- Tempo stimato: 2 ore
- Lavorare con calma e precisione
- Documentare OGNI comando eseguito
- In caso di dubbi, fermarsi e chiedere
