-- Script per aggiungere le colonne mancanti alla tabella Notification

-- Aggiungi la colonna message con un valore di default
ALTER TABLE "Notification" 
ADD COLUMN IF NOT EXISTS "message" TEXT;

-- Aggiorna tutte le righe esistenti con un messaggio di default
UPDATE "Notification" 
SET "message" = COALESCE("content", "title", 'Notifica di sistema')
WHERE "message" IS NULL;

-- Ora rendi la colonna NOT NULL
ALTER TABLE "Notification" 
ALTER COLUMN "message" SET NOT NULL;

-- Aggiungi la colonna userId se non esiste
ALTER TABLE "Notification" 
ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Assegna un userId di default (dobbiamo prima trovare un utente valido)
DO $$
DECLARE
    default_user_id TEXT;
BEGIN
    -- Trova il primo utente disponibile
    SELECT id INTO default_user_id FROM "User" LIMIT 1;
    
    IF default_user_id IS NOT NULL THEN
        -- Aggiorna tutte le notifiche senza userId
        UPDATE "Notification" 
        SET "userId" = default_user_id
        WHERE "userId" IS NULL;
    END IF;
END $$;

-- Rendi userId NOT NULL solo se abbiamo utenti nel database
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "User" LIMIT 1) THEN
        ALTER TABLE "Notification" 
        ALTER COLUMN "userId" SET NOT NULL;
    END IF;
END $$;

-- Mostra il risultato
SELECT 
    column_name, 
    data_type, 
    is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Notification' 
ORDER BY ordinal_position;
