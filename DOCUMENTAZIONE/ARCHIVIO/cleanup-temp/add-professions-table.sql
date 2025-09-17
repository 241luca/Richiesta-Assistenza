-- Script per aggiungere la tabella Professions al database
-- e modificare il campo profession nella tabella User

-- 1. Creare la tabella Professions
CREATE TABLE IF NOT EXISTS "Profession" (
  id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  isActive BOOLEAN NOT NULL DEFAULT true,
  displayOrder INTEGER NOT NULL DEFAULT 0,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Inserire le professioni di base
INSERT INTO "Profession" (name, slug, description, displayOrder) VALUES 
('Idraulico', 'idraulico', 'Esperto in impianti idraulici e sanitari', 1),
('Elettricista', 'elettricista', 'Esperto in impianti elettrici e automazione', 2),
('Muratore', 'muratore', 'Esperto in costruzioni e ristrutturazioni edili', 3),
('Imbianchino', 'imbianchino', 'Esperto in tinteggiatura e decorazione', 4),
('Fabbro', 'fabbro', 'Esperto in lavorazioni metalliche e serramenti', 5),
('Falegname', 'falegname', 'Esperto in lavorazioni del legno', 6),
('Giardiniere', 'giardiniere', 'Esperto in manutenzione giardini e verde', 7),
('Tecnico Climatizzazione', 'tecnico-climatizzazione', 'Esperto in impianti di climatizzazione e riscaldamento', 8),
('Vetraio', 'vetraio', 'Esperto in lavorazione e installazione vetri', 9),
('Piastrellista', 'piastrellista', 'Esperto in posa pavimenti e rivestimenti', 10),
('Antennista', 'antennista', 'Esperto in impianti TV e satellitari', 11),
('Tecnico Informatico', 'tecnico-informatico', 'Esperto in assistenza informatica e reti', 12),
('Tecnico Elettrodomestici', 'tecnico-elettrodomestici', 'Esperto in riparazione elettrodomestici', 13),
('Serramentista', 'serramentista', 'Esperto in installazione porte e finestre', 14),
('Pulizie', 'pulizie', 'Esperto in servizi di pulizia professionale', 15);

-- 3. Aggiungere il campo professionId alla tabella User (se non esiste già)
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "professionId" VARCHAR(255);

-- 4. Aggiungere la foreign key
ALTER TABLE "User"
ADD CONSTRAINT "User_professionId_fkey" 
FOREIGN KEY ("professionId") 
REFERENCES "Profession"(id) 
ON DELETE SET NULL;

-- 5. Creare indice per performance
CREATE INDEX IF NOT EXISTS "User_professionId_idx" ON "User"("professionId");
CREATE INDEX IF NOT EXISTS "Profession_isActive_idx" ON "Profession"("isActive");
CREATE INDEX IF NOT EXISTS "Profession_slug_idx" ON "Profession"(slug);

-- 6. Migrare i dati esistenti (opzionale)
-- Se ci sono già dei valori nel campo profession, possiamo mapparli
UPDATE "User" u
SET "professionId" = p.id
FROM "Profession" p
WHERE LOWER(u.profession) = LOWER(p.name)
AND u."professionId" IS NULL;
