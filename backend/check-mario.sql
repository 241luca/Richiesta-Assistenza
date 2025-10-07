-- Script SQL per verificare e sistemare i dati di Mario Rossi
-- Esegui con: psql -U user -d richiesta_assistenza -f check-mario.sql

-- 1. Verifica Mario Rossi
SELECT 
    id,
    "firstName",
    "lastName",
    email,
    address,
    city,
    "workAddress",
    "workCity",
    "workProvince",
    "workPostalCode"
FROM "User"
WHERE email = 'mario.rossi@assistenza.it';

-- 2. Conta richieste assegnate
SELECT 
    COUNT(*) as richieste_assegnate
FROM "AssistanceRequest"
WHERE "professionalId" = (
    SELECT id FROM "User" WHERE email = 'mario.rossi@assistenza.it'
)
AND status IN ('ASSIGNED', 'IN_PROGRESS');

-- 3. Mostra dettagli richieste con info viaggio
SELECT 
    ar.id,
    ar.title,
    ar.address,
    ar.city,
    ar."travelDistance",
    ar."travelDistanceText",
    ar."travelDurationText",
    ar."travelCost",
    ar."travelCalculatedAt"
FROM "AssistanceRequest" ar
WHERE ar."professionalId" = (
    SELECT id FROM "User" WHERE email = 'mario.rossi@assistenza.it'
)
AND ar.status IN ('ASSIGNED', 'IN_PROGRESS')
LIMIT 5;

-- 4. Aggiorna work address se manca
UPDATE "User" 
SET 
    "workAddress" = CASE 
        WHEN "workAddress" IS NULL THEN 'Via Milano 1'
        ELSE "workAddress" 
    END,
    "workCity" = CASE 
        WHEN "workCity" IS NULL THEN 'Milano'
        ELSE "workCity" 
    END,
    "workProvince" = CASE 
        WHEN "workProvince" IS NULL THEN 'MI'
        ELSE "workProvince" 
    END,
    "workPostalCode" = CASE 
        WHEN "workPostalCode" IS NULL THEN '20100'
        ELSE "workPostalCode" 
    END
WHERE email = 'mario.rossi@assistenza.it'
AND ("workAddress" IS NULL OR "workCity" IS NULL);

-- Mostra risultato finale
SELECT 
    'Mario Rossi ora ha:' as info,
    "workAddress",
    "workCity",
    "workProvince",
    "workPostalCode"
FROM "User"
WHERE email = 'mario.rossi@assistenza.it';