-- 1. Verifica se esiste un'organizzazione
SELECT id, name FROM organizations LIMIT 1;

-- 2. Se non esiste, creane una
INSERT INTO organizations (id, name, slug, "createdAt", "updatedAt")
SELECT gen_random_uuid(), 'Default Organization', 'default-org', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM organizations);

-- 3. Aggiorna tutti gli utenti senza organizationId
UPDATE users 
SET "organizationId" = (SELECT id FROM organizations LIMIT 1)
WHERE "organizationId" IS NULL;

-- 4. Aggiorna tutti i preventivi senza organizationId
UPDATE quotes 
SET "organizationId" = (SELECT id FROM organizations LIMIT 1)
WHERE "organizationId" IS NULL;

-- 5. Verifica il risultato
SELECT 'Users with organizationId:' as info, COUNT(*) FROM users WHERE "organizationId" IS NOT NULL;
SELECT 'Quotes with organizationId:' as info, COUNT(*) FROM quotes WHERE "organizationId" IS NOT NULL;
