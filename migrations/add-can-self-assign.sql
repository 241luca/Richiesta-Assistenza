-- Aggiungi campo per controllo auto-assegnazione
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "canSelfAssign" BOOLEAN DEFAULT true;

-- Aggiungi commento per documentazione
COMMENT ON COLUMN "User"."canSelfAssign" IS 'Permette al professionista di auto-assegnarsi richieste. Controllato da admin.';

-- Verifica il campo aggiunto
SELECT id, "fullName", role, "canSelfAssign" 
FROM "User" 
WHERE role = 'PROFESSIONAL' 
LIMIT 5;