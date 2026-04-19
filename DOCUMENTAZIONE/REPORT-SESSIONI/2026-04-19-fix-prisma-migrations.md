# 📊 REPORT SESSIONE — Fix Migration Prisma + Allineamento Locale/VM

**Data**: 19 Aprile 2026  
**Autore**: Claude (su richiesta di Luca Mambelli)  
**Versione Sistema**: v6.2.0 → v6.2.1 (patch migration)

---

## 🎯 OBIETTIVO

1. Verificare e rimettere a posto le migration di Prisma (erano bloccate)
2. Investigare e risolvere il disallineamento tra database locale (Mac) e database VM 103 (produzione)

---

## 🔍 DIAGNOSI INIZIALE

### Problema 1 — Migration bloccate

La tabella interna di Prisma (`_prisma_migrations`) conteneva 4 record incoerenti, identici su locale e VM:

| # | Migration | Stato registro | Note |
|---|---|---|---|
| 1 | `20251022220647_init_database_schema` | ROLLED BACK | ⚠️ Ma il DB conteneva tutte le 151 tabelle |
| 2 | `20251023075000_add_custom_form_id_to_legal_document` | Applicata | ✅ OK |
| 3 | `0001_document_form_integration` | Applicata | ⚠️ File SQL vuoto (0 byte) |
| 4 | `20251022220647_init_database_schema` (duplicato) | **IN CORSO da mesi** | 🔴 Bloccava tutto |

`npx prisma migrate status` restituiva errore → impossibile applicare nuove migration.

### Problema 2 — Disallineamento locale vs VM

- **Database locale**: 151 tabelle
- **Database VM 103**: 161 tabelle (10 in più)

Investigazione:
- Le 10 tabelle extra erano tutte del modulo **SmartDocs** (gestione documenti con AI):  
  `DocumentClassification, DocumentContainer, DocumentContainerLink, DocumentContainerShare, DocumentEmbedding, DocumentExtraction, DocumentSection, DocumentSectionLink, DocumentShare, StorageConfig`
- **Tutte vuote sulla VM** (0 righe → nessun dato da preservare)
- **Presenti nello schema.prisma** (modificato il 27 ottobre 2025)
- **Nessuna migration le creava** → probabilmente applicate sulla VM con `prisma db push` (non la procedura corretta)

### Problema 3 — Cartella prisma piena di spazzatura

16 file di backup sparsi in `backend/prisma/` (schema vecchi con nomi tipo `CORROTTO`, `danneggiato`, `WITH-FANTASMA`, ecc.) che non dovevano stare lì.

---

## 🔧 INTERVENTI ESEGUITI

### FASE 1 — Backup di sicurezza

| Backup | Percorso | Dimensione |
|---|---|---|
| Cartella prisma | `backend/prisma.BACKUP-20260419-153757/` | copia completa |
| DB locale | `database-backups/locale-20260419-153830.sql` | 13 MB (20.987 righe) |
| DB VM 103 | `database-backups/vm103-20260419-153837.sql` | 13 MB (21.872 righe) |

### FASE 2 — Fix registro migration (locale + VM)

```sql
-- Eliminato il tentativo duplicato appeso
DELETE FROM "_prisma_migrations" 
WHERE id = 'b7f478dd-2e17-47ad-9ec6-453e48a30d3c';

-- Marcata la init come completata (era rolled_back)
UPDATE "_prisma_migrations" 
SET rolled_back_at = NULL,
    finished_at = started_at + interval '10 seconds',
    applied_steps_count = 1
WHERE id = '0fa09163-65e0-4c1a-a594-7179b019780c';

-- Rimossa la migration vuota
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '0001_document_form_integration';
```

Applicato su entrambi i database.

### FASE 3 — Creazione migration SmartDocs mancante

Generata con `prisma migrate diff` partendo dallo schema.prisma:

```bash
cd backend && npx prisma migrate diff \
  --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma \
  --script > migration.sql
```

**Migration creata**: `20260419160000_add_smartdocs_tables`
- 384 righe di SQL
- 2 enum: `ContainerOwnerType`, `StorageProvider`
- 10 tabelle (le stesse già esistenti sulla VM)
- 36 indici
- 16 foreign keys

**Verifica di pulizia**: la migration contiene SOLO `CREATE TABLE` (nessun `ALTER` su tabelle esistenti), quindi non tocca nulla di ciò che c'è già.

### FASE 4 — Applicazione migration

**Sul locale** (dove le tabelle NON esistevano):
```bash
cd backend && npx prisma migrate deploy
# Risultato: 10 nuove tabelle create (151 → 161) ✅
```

**Sulla VM** (dove le tabelle esistevano già): serviva "registrare" la migration come applicata senza rieseguirla.
```bash
# 1. Copiata migration.sql nel container via scp + docker cp
# 2. Marcata come applicata:
sudo docker exec assistenza-backend \
  npx prisma migrate resolve --applied 20260419160000_add_smartdocs_tables
# Risultato: registro allineato senza toccare le tabelle ✅
```

### FASE 5 — Pulizia cartella `backend/prisma/`

Spostati in `backend/prisma/_old_schemas/` (archivio, non cancellati):
- 16 file schema vecchi (.backup-*, .CORROTTO_*, .danneggiato-*, .SICUREZZA-*, .copia, _additions, _fixed, ecc.)
- Cartella `0001_document_form_integration/` (migration vuota)

**Risultato**: cartella `backend/prisma/` contiene ora solo:
```
├── _old_schemas/        (archivio file spazzatura — ignorato da Git)
├── migrations/          (3 migration + migration_lock.toml)
├── schema.prisma        ✅
├── seed.ts              ✅
└── seeds/               ✅
```

### FASE 6 — Aggiornato `.gitignore`

Aggiunte regole per escludere da Git:
- `backend/prisma/_old_schemas/`
- `backend/prisma.BACKUP-*`
- Pattern `schema.prisma.*` e simili (backup vari)
- `database-backups/` (i dump .sql non vanno su Git)

---

## ✅ RISULTATI FINALI

### Stato migration (identico su locale e VM)

```
3 migrations found in prisma/migrations
Database schema is up to date!
```

| Migration | Stato |
|---|---|
| `20251022220647_init_database_schema` | ✅ APPLICATA |
| `20251023075000_add_custom_form_id_to_legal_document` | ✅ APPLICATA |
| `20260419160000_add_smartdocs_tables` | ✅ APPLICATA |

### Allineamento database

| Metrica | Locale | VM 103 | Match |
|---|---|---|---|
| **Tabelle totali** | 161 | 161 | ✅ |
| **Migration registrate** | 3 applicate | 3 applicate | ✅ |
| **Schema Prisma** | sincronizzato | sincronizzato | ✅ |

---

## 📊 METRICHE SESSIONE

| Metrica | Valore |
|---|---|
| Tabelle riallineate | 10 (modulo SmartDocs) |
| Migration pulite/create | 1 eliminata vuota, 1 creata nuova |
| Record `_prisma_migrations` corretti | 4 (su locale + 4 su VM) |
| File spazzatura archiviati | 17 (16 schema + 1 cartella migration vuota) |
| Backup creati | 3 (cartella prisma + 2 DB) |
| Regole aggiunte a `.gitignore` | 13 pattern |

---

## ⚠️ COSE DA SAPERE

### 🔸 Nessuna perdita di dati
Tutte le operazioni hanno toccato solo:
- La tabella di servizio `_prisma_migrations` (registro interno di Prisma)
- Creazione di tabelle vuote sul locale
- File di organizzazione (schema di backup)

I dati applicativi (utenti, richieste, ecc.) **non sono mai stati toccati**.

### 🔸 Il modulo SmartDocs è ora pronto all'uso in locale
Le 10 tabelle ora esistono anche sul Mac. Se il codice dell'applicazione usa SmartDocs, funzionerà anche in sviluppo locale.

### 🔸 La cartella `_old_schemas/` può essere cancellata
I file sono anche nel backup `backend/prisma.BACKUP-20260419-153757/`. Se serve spazio, si possono eliminare entrambi senza rischio.

### 🔸 Prisma 7 disponibile (major update)
`npx prisma migrate status` segnala Prisma 6.16 → 7.0. **NON aggiornato** in questa sessione — è un cambiamento grosso da fare con calma, in una sessione dedicata.

### 🔸 Come creare correttamente migration in futuro
Per **evitare di ripetere gli stessi problemi**, d'ora in poi quando si modifica `schema.prisma`:

```bash
cd backend
# Crea una nuova migration pulita (NON usare più 'prisma db push' in produzione!)
npx prisma migrate dev --name descrizione_della_modifica

# Questo genera automaticamente la cartella migrations/<timestamp>_<nome>/migration.sql
# e la applica al locale. Poi sulla VM basta: prisma migrate deploy
```

❌ **Non usare più `prisma db push`** su nessun ambiente: applica lo schema senza lasciare traccia, creando i disallineamenti che abbiamo appena sistemato.

---

## 📋 PROSSIMI PASSI SUGGERITI

1. **Commit delle modifiche** su Git (nuovo `.gitignore`, nuova cartella migration, report)
2. **Testare l'applicazione in locale** per verificare che il modulo SmartDocs funzioni
3. **Valutare se eliminare `_old_schemas/`** dopo qualche giorno di sicurezza
4. **Pianificare upgrade a Prisma 7** in una sessione dedicata
5. **Comunicare al team** la regola: mai più `prisma db push`, sempre `prisma migrate dev`

---

## 🗂️ FILE TOCCATI

### Creati
- `backend/prisma/migrations/20260419160000_add_smartdocs_tables/migration.sql` (384 righe)
- `backend/prisma.BACKUP-20260419-153757/` (backup completo cartella prisma)
- `database-backups/locale-20260419-153830.sql` (13 MB)
- `database-backups/vm103-20260419-153837.sql` (13 MB)
- `DOCUMENTAZIONE/REPORT-SESSIONI/2026-04-19-fix-prisma-migrations.md` (questo report)

### Modificati
- `.gitignore` — aggiunte esclusioni per prisma backup e database-backups
- DB locale `_prisma_migrations` — operazioni SQL correttive
- DB VM 103 `_prisma_migrations` — stesse operazioni SQL correttive
- DB locale: aggiunte 10 tabelle SmartDocs (da 151 a 161)

### Spostati (archiviati, non persi)
- 16 file schema vecchi → `backend/prisma/_old_schemas/`
- Cartella `0001_document_form_integration/` → `_old_schemas/migration_vuota_0001_document_form_integration/`

---

**Esito sessione**: ✅ **SUCCESSO COMPLETO**  
**Tempo totale**: ~40 minuti  
**Rischio corso**: Minimo (backup completi, nessun dato applicativo toccato)  
**Allineamento locale/VM**: ✅ PERFETTO (161 tabelle su entrambi)
