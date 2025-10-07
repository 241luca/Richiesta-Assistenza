-- Script per aggiornare la chiave Google Maps API
-- Eseguilo con: psql -U tuousername -d tuodatabase -f update-google-key.sql

-- IMPORTANTE: Sostituisci 'TUA_NUOVA_CHIAVE_API_QUI' con la tua chiave valida!

UPDATE "ApiKey" 
SET 
  key = 'TUA_NUOVA_CHIAVE_API_QUI',
  "updatedAt" = NOW()
WHERE service = 'GOOGLE_MAPS';

-- Verifica che sia stata aggiornata
SELECT service, key, "isActive" 
FROM "ApiKey" 
WHERE service = 'GOOGLE_MAPS';
