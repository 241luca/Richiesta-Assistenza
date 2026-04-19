# 🧪 TESTING GUIDE - Worker v2

**Purpose**: Verify all fixes work correctly in real conditions  
**Difficulty**: 🟢 Easy  
**Time**: ~30 minutes

---

## TEST 1: Verificare che worker sia partito correttamente

**Obiettivo**: Worker v2 legge la configurazione e si connette al DB

**Step-by-step**:
```bash
# 1. Guarda i log iniziali
tail -50 logs/smartdocs.log | head -20

# Dovresti vedere:
# ╔════════════════════════════════════════════════════════╗
# ║  🧠 SmartDocs Enterprise Worker v2 (FIXED)    ║
# ║  Semantic Chunking + Knowledge Graph + Retry  ║
# ╚════════════════════════════════════════════════════════╝
#
# 📊 Polling interval: 5000ms
# 💾 Database: [your-host]:5433
# 🤖 OpenAI: configured
# 🔄 Batch size: 5 jobs per poll
# 🔁 Max retries: 3 per job
#
# ✅ Worker v2 ready and polling for jobs...
```

**Expected**: Vedi il banner di Worker v2 e il messaggio "ready"

**If fails**:
- Controlla DATABASE_URL in .env
- Controlla che il database sia raggiungibile: `psql $DATABASE_URL -c "SELECT 1"`
- Se non funziona, ferma il worker e riavvia

---

## TEST 2: Verificare il retry logic

**Obiettivo**: Quando una chiamata OpenAI fallisce, il worker riprova 3 volte

**Setup**:
```bash
# Simuliamo un'API key scaduta o invalida
# Modifica il .env temporaneamente:
OPENAI_API_KEY=invalid-key-for-testing-retry

# Riavvia il worker
npm run worker
```

**Add a test job**:
```bash
psql $DATABASE_URL << 'EOF'
INSERT INTO smartdocs.sync_jobs (
  id, container_id, entity_type, entity_id, source_type, 
  status, content, metadata, retry_count
) VALUES (
  'test-retry-001', 
  'test-container',
  'request',
  'req-test-001',
  'manual',
  'pending',
  'Test content for retry logic',
  '{"title": "Retry Test"}',
  0
);
EOF

# Verifica che il job è stato creato
psql $DATABASE_URL -c "SELECT id, status, retry_count FROM smartdocs.sync_jobs WHERE id = 'test-retry-001';"
```

**Watch the logs**:
```bash
tail -f logs/smartdocs.log | grep -E "(Attempt|Retry|exhausted)"

# Dovresti vedere:
# [Worker] Attempt 1/3 for embedding_chunk_0
# [Worker] Retry attempt 1 failed for embedding_chunk_0, waiting 2000ms...
# [Worker] Attempt 2/3 for embedding_chunk_0
# [Worker] Retry attempt 2 failed for embedding_chunk_0, waiting 4000ms...
# [Worker] Attempt 3/3 for embedding_chunk_0
# [Worker] ❌ All 3 retries exhausted for embedding_chunk_0
```

**Expected**: 
- Vedi "Attempt 1/3", "Attempt 2/3", "Attempt 3/3"
- Vedi attese crescenti (1s, 2s, 4s, 8s, etc)
- Dopo 3 tentativi, viene marcato come failed

**If fails**:
- Job non viene processato? Controlla se il polling funziona
- Non vedi i retry? Controlla se stai guardando il log giusto

**Cleanup**:
```bash
# Ripristina la API key corretta
# Modificare .env con la key giusta

# Cancella il test job
psql $DATABASE_URL -c "DELETE FROM smartdocs.sync_jobs WHERE id = 'test-retry-001';"

# Riavvia il worker
```

---

## TEST 3: Verificare batch limit (memoria)

**Obiettivo**: Worker elabora solo 5 job per ciclo, non di più

**Setup**:
```bash
# Aggiungi 20 job di test
psql $DATABASE_URL << 'EOF'
WITH job_batch AS (
  SELECT 
    'test-batch-' || i::TEXT as id,
    'test-container' as container_id,
    'request' as entity_type,
    'entity-' || i::TEXT as entity_id,
    'manual' as source_type,
    'pending' as status,
    'Test content ' || i::TEXT as content,
    '{"batch_number": ' || i::TEXT || '}' as metadata
  FROM generate_series(1, 20) as t(i)
)
INSERT INTO smartdocs.sync_jobs (id, container_id, entity_type, entity_id, source_type, status, content, metadata)
SELECT id, container_id, entity_type, entity_id, source_type, status, content, metadata::jsonb FROM job_batch;
EOF

# Verifica che i job siano stati creati
psql $DATABASE_URL -c "SELECT COUNT(*) FROM smartdocs.sync_jobs WHERE status = 'pending' AND id LIKE 'test-batch-%';"
# Dovrebbe output: 20
```

**Watch the logs**:
```bash
tail -f logs/smartdocs.log | grep -i "found.*pending"

# Nel primo ciclo dovresti vedere:
# [Worker] Found 5 pending jobs (batch limit reached)

# Nel secondo ciclo (dopo ~5-10 secondi):
# [Worker] Found 5 pending jobs (batch limit reached)

# E così via...
```

**Expected**:
- Primo ciclo: 5 job
- Secondo ciclo: 5 job
- Terzo ciclo: 5 job
- Quarto ciclo: 5 job
- Quinto ciclo: 0 job (tutti completati)

**Monitor memory**:
```bash
# Apri un'altra finestra terminal e monitora la memoria
tail -f logs/smartdocs.log | grep "Memory Status"

# Dovresti vedere ogni 60 secondi:
# [Worker] Memory Status { heap_used_mb: 45, heap_total_mb: 256, rss_mb: 120, external_mb: 1 }
# heap_used_mb dovrebbe rimanere < 100MB
```

**If fails**:
- Memory cresce oltre 100MB? Possibile memory leak ancora presente
- Non vedi "batch limit reached"? Controlla se BATCH_SIZE è impostato a 5
- Job non vengono elaborati? Controlla se OpenAI API key è corretta

**Cleanup**:
```bash
# Cancella i test job
psql $DATABASE_URL -c "DELETE FROM smartdocs.sync_jobs WHERE id LIKE 'test-batch-%';"
```

---

## TEST 4: Verificare error tracking

**Obiettivo**: Errori vengono tracciati con fase e dettagli

**Setup**:
```bash
# Crea un job con contenuto vuoto (causerà errore)
psql $DATABASE_URL << 'EOF'
INSERT INTO smartdocs.sync_jobs (
  id, container_id, entity_type, entity_id, source_type,
  status, content, metadata
) VALUES (
  'test-error-001',
  'test-container',
  'request',
  'req-error-001',
  'manual',
  'pending',
  '', -- ← Contenuto VUOTO causa errore
  '{"title": "Error Test"}'
);
EOF
```

**Watch the logs**:
```bash
tail -f logs/smartdocs.log | grep -E "(failed|ERROR|❌)" | head -20
```

**Verify database error tracking**:
```bash
# Dopo che il job è stato processato (~5-10 secondi):
psql $DATABASE_URL -c "SELECT id, status, retry_count, error_message, metadata FROM smartdocs.sync_jobs WHERE id = 'test-error-001';"

# Dovresti vedere:
# status: 'failed' (dopo 3 tentativi)
# retry_count: 3
# error_message: "No text content to process (Phase: TEXT_EXTRACTION, Attempt: 3/3)"
# metadata: {"last_error": {"phase": "TEXT_EXTRACTION", ...}}
```

**Expected**:
- Job diventa 'failed' dopo 3 tentativi
- error_message contiene nome fase (TEXT_EXTRACTION)
- error_message contiene numero tentativo (Attempt: 3/3)
- metadata contiene full error details

**If fails**:
- error_message è generico? Controlla se il codice è stato aggiornato correttamente
- retry_count è 0? Controlla se il retry logic funziona
- metadata è vuoto? Controlla se il JSON viene salvato correttamente

**Cleanup**:
```bash
psql $DATABASE_URL -c "DELETE FROM smartdocs.sync_jobs WHERE id = 'test-error-001';"
```

---

## TEST 5: Verificare stuck job recovery

**Obiettivo**: Job stuck > 5 minuti viene ripreso e ritentato

**Setup** (Questo è manuale, non automatico):
```bash
# Crea un job e marcalo come processing (simulando stuck)
psql $DATABASE_URL << 'EOF'
INSERT INTO smartdocs.sync_jobs (
  id, container_id, entity_type, entity_id, source_type,
  status, started_at, content, metadata
) VALUES (
  'test-stuck-001',
  'test-container',
  'request',
  'req-stuck-001',
  'manual',
  'processing',
  NOW() - INTERVAL '6 minutes', -- ← 6 minuti fa (stuck!)
  'Test content',
  '{"title": "Stuck Test"}'
);
EOF

# Verifica che il job è in stato processing e stuck
psql $DATABASE_URL -c "
SELECT id, status, started_at, 
  EXTRACT(EPOCH FROM (NOW() - started_at)) as seconds_elapsed
FROM smartdocs.sync_jobs WHERE id = 'test-stuck-001';
"
# Dovrebbe mostrare: status = 'processing', seconds_elapsed = ~360
```

**Attendi il prossimo polling**:
```bash
# Il worker controlla stuck jobs ogni ciclo
# Dovresti vedere nei log (entro 5-10 secondi):
tail -f logs/smartdocs.log | grep -i "stuck"

# Dovresti vedere:
# [Worker] Found 1 stuck jobs, attempting recovery...
# [Worker] Stuck job test-stuck-001 exceeded max retries
```

**Verify database**:
```bash
# Il job dovrebbe essere tornato in stato pending o failed
psql $DATABASE_URL -c "SELECT id, status, retry_count FROM smartdocs.sync_jobs WHERE id = 'test-stuck-001';"

# Se è la prima volta:
# status: pending (verrà ritentato)
# retry_count: 1

# Dopo vari cicli (3+ volte stuck):
# status: failed
# retry_count: 3
```

**Expected**:
- Job non rimane stuck per sempre
- Viene marcato come failed dopo 3 volte
- Log mostra il recovery attempt

**If fails**:
- Job rimane in stato processing? Controlla il polling di stuck jobs
- retry_count non incrementa? Controlla se il codice di recovery è eseguito

**Cleanup**:
```bash
psql $DATABASE_URL -c "DELETE FROM smartdocs.sync_jobs WHERE id = 'test-stuck-001';"
```

---

## TEST 6: Verificare audit logging

**Obiettivo**: Tutti i retry e i fallimenti vengono registrati nella tabella di audit

**Setup**: Usa i dati dai test precedenti

**Query audit table**:
```bash
# Vedi tutti gli eventi di un job
psql $DATABASE_URL << 'EOF'
SELECT 
  id,
  event_type,
  previous_status,
  new_status,
  retry_count,
  phase_failed,
  error_message,
  created_at
FROM smartdocs.sync_jobs_audit
WHERE job_id = 'test-error-001' -- ← Usa ID da test precedente
ORDER BY created_at;
EOF
```

**Expected output**:
```
id                                 | event_type      | previous_status | new_status | retry_count | phase_failed  | created_at
------------------------------------|-----------------|-----------------|------------|-------------|---------------|---
xxxxxxxx-xxxx-xxxx-xxxx-xxxx        | retry           | processing      | pending    | 1           | EMBEDDING     | 2025-10-26...
xxxxxxxx-xxxx-xxxx-xxxx-xxxx        | retry           | processing      | pending    | 2           | EMBEDDING     | 2025-10-26...
xxxxxxxx-xxxx-xxxx-xxxx-xxxx        | failed          | processing      | failed     | 3           | EMBEDDING     | 2025-10-26...
```

**Expected**:
- Vedi una riga per ogni retry
- Vedi il nome della fase che è fallita
- Vedi il retry count incrementare

**If fails**:
- Audit table è vuota? Controlla se il trigger è stato creato
- Vedi solo una riga? Controlla se tutti i retry vengono registrati

---

## TEST 7: Verify monitoring queries work

**Obiettivo**: Le views di monitoring ritornano dati corretti

**Query 1: Retry stats**
```sql
SELECT * FROM smartdocs.v_job_retry_stats;

-- Dovresti vedere per ogni status:
-- status | total_jobs | jobs_with_retries | avg_retries | max_retries
```

**Query 2: Active retries**
```sql
SELECT * FROM smartdocs.v_active_retries;

-- Dovresti vedere i job che stanno facendo retry con:
-- id | entity_id | status | retry_count | phase_failed
```

**Expected**:
- Dati non NULL
- Numeri ragionevoli (max_retries <= 3)
- Se non hai job con retry, una volta che li aggiungi dovresti vederli

---

## FINAL CHECKLIST

Dopo completare tutti i test, verifica:

- [ ] Worker v2 parte correttamente
- [ ] Retry logic riprova 3 volte con backoff
- [ ] Batch limit: massimo 5 job per ciclo
- [ ] Memory usage < 100MB
- [ ] Error messages contengono fase e tentativo
- [ ] Stuck jobs vengono ripresi dopo 5 minuti
- [ ] Audit table registra tutti gli eventi
- [ ] Monitoring queries ritornano dati
- [ ] Log sono chiari e facilmente debuggabili

**If all ✅**: Worker v2 è pronto per la produzione! 🚀

---

## PERFORMANCE BASELINE

Misura questi numeri per future comparazioni:

```bash
# Memoria dopo 1 ora
ps aux | grep "worker\|ts-node" | grep -v grep
# heap_used_mb dovrebbe essere < 100MB

# Job processing rate
# Aggiorna un batch di 50 job
# Conta quanto tempo ci vuole
# Dovrebbe essere ~10 minuti (50 job / 5 per ciclo * 5sec polling + processing)

# Error recovery rate
# Crea 10 job con API key invalida
# Conta quanti vengono marcati como 'failed' dopo 3 tentativi
# Dovrebbe essere 100% (tutti 10)
```

---

**Test completed**: _________________ (data)  
**Tester name**: _________________ (nome)  
**Overall result**: ✅ PASS / ❌ FAIL

If FAIL, describe issues and next steps.
