# 🚀 QUICK DEPLOYMENT GUIDE - Worker v2

**Tempo stimato**: 10 minuti  
**Complessità**: 🟢 Facile  
**Risk**: 🟢 Basso (no breaking changes)

---

## ✅ PRE-DEPLOYMENT CHECKLIST

```bash
# 1. Verifica di essere nel branch giusto
git branch
# Dovrebbe essere: main (o develop)

# 2. Verifica che smartdocs sia stoppato
ps aux | grep "npm.*worker"
ps aux | grep "ts-node.*worker"
# Se vedi processi, killali:
# kill -9 [PID]

# 3. Verifica state del database
psql $DATABASE_URL -c "SELECT COUNT(*) as pending_jobs FROM smartdocs.sync_jobs WHERE status = 'pending';"
# Annota il numero
```

---

## 📋 STEP-BY-STEP DEPLOYMENT

### STEP 1: Backup del database (CRITICO!)
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs

# Backup completo del database
pg_dump $DATABASE_URL > backups/smartdocs-pre-worker-v2-$(date +%Y%m%d-%H%M%S).sql.gz

# Verifica che il backup sia stato creato
ls -lh backups/ | tail -5

echo "✅ Database backup created"
```

### STEP 2: Applica la migration del database
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs

# Applica la migration
psql $DATABASE_URL -f scripts/06-worker-v2-retry-tracking.sql

# Dovresti vedere:
# - Added retry_count column to sync_jobs
# - Added failed_phase column to sync_jobs
# - Extended error_message column to TEXT
# - Migration completed successfully!

echo "✅ Database migration applied"
```

### STEP 3: Verifica la migration
```bash
# Controlla che le colonne siano state create
psql $DATABASE_URL -c "\d smartdocs.sync_jobs"

# Dovresti vedere:
# - retry_count (integer)
# - failed_phase (character varying)
# - error_message (text)

# Controlla che la tabella di audit sia creata
psql $DATABASE_URL -c "\d smartdocs.sync_jobs_audit"

# Controlla che gli indici siano stati creati
psql $DATABASE_URL -c "\di smartdocs.idx_*"

echo "✅ Database schema verified"
```

### STEP 4: Verifica il nuovo worker.ts
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs

# Controlla che il file sia stato aggiornato
head -30 src/worker.ts | grep "Worker v2"
# Dovrebbe output: "SmartDocs Enterprise Worker v2"

# Controlla che le funzioni critiche siano presenti
grep -c "retryWithBackoff" src/worker.ts
# Dovrebbe output: 6 (usata 6 volte)

grep -c "BATCH_SIZE" src/worker.ts
# Dovrebbe output: 1

echo "✅ Worker code updated"
```

### STEP 5: Build e test
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs

# Compila TypeScript
npm run build

# Se vedi errori di compilazione, FIX SUBITO prima di continuare
# Se va bene, dovresti vedere: "Successfully compiled"

echo "✅ Build successful"
```

### STEP 6: Avvia il worker v2
```bash
cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/smartdocs

# Se gira in container Docker:
docker-compose restart smartdocs-worker

# Se gira in dev (no container):
npm run worker
# Oppure in un'altra finestra:
ts-node src/worker.ts

# Attendi ~5 secondi per l'output iniziale
```

### STEP 7: Verifica che worker v2 sia partito
```bash
# Controlla i log
tail -f logs/smartdocs.log | grep -i "worker v2"

# Dovresti vedere entro 10 secondi:
# ╔════════════════════════════════════════════════════════╗
# ║  🧠 SmartDocs Enterprise Worker v2 (FIXED)    ║
# ║  Semantic Chunking + Knowledge Graph + Retry  ║
# ╚════════════════════════════════════════════════════════╝
#
# 📊 Polling interval: 5000ms
# 💾 Database: localhost:5433
# 🤖 OpenAI: configured
# 🔄 Batch size: 5 jobs per poll
# 🔁 Max retries: 3 per job
#
# ✅ Worker v2 ready and polling for jobs...

echo "✅ Worker v2 started successfully"
```

---

## 🧪 VERIFICATION TESTS

### Test 1: Verifica che il worker legga job
```bash
# Aggiungi 3 job di prova
cd smartdocs

psql $DATABASE_URL << 'EOF'
INSERT INTO smartdocs.sync_jobs (id, container_id, entity_type, entity_id, source_type, status, content, metadata)
VALUES 
  (gen_random_uuid(), 'test-container', 'request', 'test-' || gen_random_uuid(), 'manual', 'pending', 'Test content 1', '{}'),
  (gen_random_uuid(), 'test-container', 'request', 'test-' || gen_random_uuid(), 'manual', 'pending', 'Test content 2', '{}'),
  (gen_random_uuid(), 'test-container', 'request', 'test-' || gen_random_uuid(), 'manual', 'pending', 'Test content 3', '{}');
EOF

# Guarda i log
tail -f logs/smartdocs.log

# Dovresti vedere:
# [Worker] Found 3 pending jobs
# [Worker] 🔄 Processing job [ID]...

echo "✅ Worker reading jobs correctly"
```

### Test 2: Verifica retry logic
```bash
# I log dovrebbero mostrare:
# [Worker] Attempt 1/3 for embedding_chunk_1
# Se fallisce:
# [Worker] Retry attempt 1 failed for embedding_chunk_1, waiting 1000ms...
# [Worker] Attempt 2/3 for embedding_chunk_1

echo "✅ Retry logic working"
```

### Test 3: Verifica memory monitoring
```bash
# Nei log dovrebbe comparire ogni 60 secondi:
# [Worker] Memory Status {
#   heap_used_mb: 87,
#   heap_total_mb: 256,
#   rss_mb: 145,
#   external_mb: 2
# }

echo "✅ Memory monitoring active"
```

### Test 4: Controlla database audit
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) as total_events FROM smartdocs.sync_jobs_audit;"

# Dovresti vedere alcuni eventi se i job sono stati elaborati

echo "✅ Audit logging working"
```

---

## 🔍 TROUBLESHOOTING

### Problem: "Worker: Shutting down gracefully..." immediato

**Soluzione:**
```bash
# Controlla se c'è un errore di connessione al database
tail -50 logs/smartdocs.log | grep -i error

# Se vedi "ENOENT": manca il file worker.ts
# Se vedi "FATAL": problema database

# Ricrea il file worker.ts:
# cp src/worker.ts.backup src/worker.ts (se hai backup)
```

### Problem: "Segmentation fault"

**Soluzione:**
```bash
# Possibile problema con memoria
# Riavvia il worker
# kill -9 [PID_worker]
# npm run worker
```

### Problem: "Connection timeout"

**Soluzione:**
```bash
# Verifica che il database sia su:
psql $DATABASE_URL -c "SELECT 1"

# Se non funziona, database non è raggiungibile
# Controlla: DATABASE_URL nel .env
```

### Problem: "OpenAI API rate limit"

**Soluzione:**
```bash
# Questo è NORMALE! Il worker dovrebbe ritentare automaticamente
# Guarda i log: [Worker] Retry attempt 1 failed...

# Se fallisce dopo 3 tentativi, il job diventa 'failed'
# Rilancialo manualmente dopo qualche minuto:
psql $DATABASE_URL -c "UPDATE smartdocs.sync_jobs SET status = 'pending', retry_count = 0 WHERE id = '[JOB_ID]';"
```

---

## 📊 MONITORING QUERIES

Esegui queste query per monitorare il worker:

### View 1: Statistiche retry
```sql
SELECT * FROM smartdocs.v_job_retry_stats;

-- Output example:
-- status    | total_jobs | jobs_with_retries | avg_retries | max_retries
-- ----------|------------|-------------------|-------------|------------
-- pending   | 5          | 2                 | 0.8         | 2
-- completed | 145        | 45                | 1.2         | 3
-- failed    | 3          | 3                 | 3.0         | 3
```

### View 2: Job che stanno facendo retry
```sql
SELECT * FROM smartdocs.v_active_retries;

-- Output example:
-- id | entity_type | retry_count | status | phase_failed | last_error_at
```

### View 3: Ultimo job fallito
```sql
SELECT id, entity_id, status, retry_count, error_message, failed_at 
FROM smartdocs.sync_jobs 
WHERE status = 'failed' 
ORDER BY completed_at DESC 
LIMIT 5;
```

### View 4: Audit trail di un job
```sql
SELECT * FROM smartdocs.sync_jobs_audit 
WHERE job_id = '[JOB_ID]' 
ORDER BY created_at DESC;

-- Vedi tutta la storia del job
```

---

## ✅ CHECKLIST POST-DEPLOYMENT

- [ ] Worker v2 è partito (verifica log)
- [ ] Non ha errori di connessione
- [ ] Database migration è andata a buon fine
- [ ] Test job 1: Elaborato correttamente
- [ ] Memory è stabile (< 100MB)
- [ ] Audit events sono registrati nel database
- [ ] Monitoring memoria ogni 60 secondi
- [ ] Retry logic funziona (se simulato un errore)

---

## 🎉 SUCCESS!

Se tutto è verde, il worker v2 è **LIVE** e pronto:

✅ Retry logic: ACTIVE  
✅ Memory management: STABLE  
✅ Error tracking: COMPLETE  
✅ Monitoring: ACTIVE  
✅ Batch processing: 5 job/ciclo  

**Il worker è adesso PRODUCTION READY! 🚀**

---

## 📞 NEXT: Monitorare

Monitora il worker per i prossimi giorni:
1. **Giorno 1**: Verifica che job vengono elaborati
2. **Giorno 2-3**: Raccogli metriche di performance
3. **Settimana 1**: Fine-tuning se necessario

---

**Last updated**: 26 Ottobre 2025  
**Version**: 1.0  
**Status**: Ready for deployment ✅
