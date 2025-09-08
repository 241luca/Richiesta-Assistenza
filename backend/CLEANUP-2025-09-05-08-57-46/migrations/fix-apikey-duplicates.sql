-- =====================================================
-- FIX DUPLICATI APIKEY PRIMA DELLA RIMOZIONE MULTI-TENANCY
-- Data: 25 Agosto 2025
-- =====================================================

BEGIN;

-- Mostra i duplicati attuali
SELECT service, COUNT(*) as count 
FROM "ApiKey" 
GROUP BY service 
HAVING COUNT(*) > 1;

-- Backup della tabella ApiKey
CREATE TABLE IF NOT EXISTS "ApiKey_backup_duplicates" AS SELECT * FROM "ApiKey";

-- Opzione 1: Mantieni solo il primo record per ogni service (quello con organizationId minore)
DELETE FROM "ApiKey" a
USING "ApiKey" b
WHERE a.service = b.service 
  AND a."organizationId" > b."organizationId";

-- Verifica che non ci siano più duplicati
SELECT service, COUNT(*) as count 
FROM "ApiKey" 
GROUP BY service 
HAVING COUNT(*) > 1;

-- Se il risultato sopra è vuoto, procedi con il commit
-- Altrimenti fai ROLLBACK

COMMIT;
