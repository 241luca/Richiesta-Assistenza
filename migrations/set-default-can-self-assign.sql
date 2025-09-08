-- Imposta canSelfAssign a true per tutti i professionisti esistenti
UPDATE "User" 
SET "canSelfAssign" = true 
WHERE role = 'PROFESSIONAL' 
  AND "canSelfAssign" IS NULL;

-- Verifica il risultato
SELECT 
  id,
  "fullName",
  email,
  role,
  "canSelfAssign"
FROM "User"
WHERE role = 'PROFESSIONAL';
