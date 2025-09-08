-- Script per pulire i record di backup orfani dal database
-- Questi sono backup vecchi con path errati che non esistono più fisicamente

-- Prima vediamo quanti ce ne sono
SELECT COUNT(*) as orphan_backups 
FROM backups 
WHERE filepath LIKE '%/backend/backend/%';

-- Poi li eliminiamo
DELETE FROM backups 
WHERE filepath LIKE '%/backend/backend/%';

-- Verifichiamo che siano stati eliminati
SELECT COUNT(*) as remaining_backups 
FROM backups;
