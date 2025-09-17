-- Aggiungi tabelle per professionisti

-- Tabella Tariffe Professionisti
CREATE TABLE IF NOT EXISTS "ProfessionalPricing" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "hourlyRate" DOUBLE PRECISION NOT NULL DEFAULT 50.00,
    "minimumRate" DOUBLE PRECISION NOT NULL DEFAULT 30.00,
    "costPerKm" DOUBLE PRECISION NOT NULL DEFAULT 0.50,
    "freeKm" INTEGER NOT NULL DEFAULT 10,
    "supplements" JSONB NOT NULL DEFAULT '{"weekend": 20, "notturno": 30, "festivo": 50, "urgente": 30}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    
    CONSTRAINT "ProfessionalPricing_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProfessionalPricing_userId_key" UNIQUE ("userId"),
    CONSTRAINT "ProfessionalPricing_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabella AI Settings per Professionisti/Sottocategorie
CREATE TABLE IF NOT EXISTS "ProfessionalAiSettings" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "modelName" TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
    "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2000,
    "responseStyle" TEXT NOT NULL DEFAULT 'formal',
    "detailLevel" TEXT NOT NULL DEFAULT 'intermediate',
    "useKnowledgeBase" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    
    CONSTRAINT "ProfessionalAiSettings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProfessionalAiSettings_userId_subcategoryId_key" UNIQUE ("userId", "subcategoryId"),
    CONSTRAINT "ProfessionalAiSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProfessionalAiSettings_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabella Skills Professionisti
CREATE TABLE IF NOT EXISTS "ProfessionalSkill" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'intermediate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    
    CONSTRAINT "ProfessionalSkill_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProfessionalSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Tabella Certificazioni Professionisti
CREATE TABLE IF NOT EXISTS "ProfessionalCertification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    
    CONSTRAINT "ProfessionalCertification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProfessionalCertification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Aggiungi campo experienceLevel a ProfessionalUserSubcategory se non esiste
ALTER TABLE "ProfessionalUserSubcategory" 
ADD COLUMN IF NOT EXISTS "experienceLevel" TEXT DEFAULT 'INTERMEDIATE';

-- Indici per performance
CREATE INDEX IF NOT EXISTS "ProfessionalPricing_userId_idx" ON "ProfessionalPricing"("userId");
CREATE INDEX IF NOT EXISTS "ProfessionalAiSettings_userId_idx" ON "ProfessionalAiSettings"("userId");
CREATE INDEX IF NOT EXISTS "ProfessionalAiSettings_subcategoryId_idx" ON "ProfessionalAiSettings"("subcategoryId");
CREATE INDEX IF NOT EXISTS "ProfessionalSkill_userId_idx" ON "ProfessionalSkill"("userId");
CREATE INDEX IF NOT EXISTS "ProfessionalCertification_userId_idx" ON "ProfessionalCertification"("userId");
