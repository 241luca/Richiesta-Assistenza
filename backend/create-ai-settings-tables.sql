-- Crea le tabelle per le impostazioni AI personalizzate

-- Tabella per impostazioni professionisti
CREATE TABLE IF NOT EXISTS "professionalAISettings" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "professionalId" TEXT NOT NULL,
  "subcategoryId" TEXT NOT NULL,
  "modelName" TEXT DEFAULT 'gpt-3.5-turbo',
  "temperature" DECIMAL(3,2) DEFAULT 0.7,
  "maxTokens" INTEGER DEFAULT 2000,
  "systemPrompt" TEXT,
  "responseStyle" TEXT DEFAULT 'technical',
  "includeExamples" BOOLEAN DEFAULT true,
  "includePricing" BOOLEAN DEFAULT true,
  "includeWarnings" BOOLEAN DEFAULT true,
  "customInstructions" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("professionalId", "subcategoryId"),
  FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE
);

-- Tabella per impostazioni clienti
CREATE TABLE IF NOT EXISTS "professionalAISettingsClient" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "professionalId" TEXT NOT NULL,
  "subcategoryId" TEXT NOT NULL,
  "modelName" TEXT DEFAULT 'gpt-3.5-turbo',
  "temperature" DECIMAL(3,2) DEFAULT 0.7,
  "maxTokens" INTEGER DEFAULT 1500,
  "systemPrompt" TEXT,
  "responseStyle" TEXT DEFAULT 'simple',
  "includeExamples" BOOLEAN DEFAULT true,
  "includePricing" BOOLEAN DEFAULT false,
  "includeWarnings" BOOLEAN DEFAULT true,
  "customInstructions" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("professionalId", "subcategoryId"),
  FOREIGN KEY ("professionalId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE
);

-- Crea indici per performance
CREATE INDEX IF NOT EXISTS "idx_professional_ai_settings_professional" ON "professionalAISettings"("professionalId");
CREATE INDEX IF NOT EXISTS "idx_professional_ai_settings_subcategory" ON "professionalAISettings"("subcategoryId");
CREATE INDEX IF NOT EXISTS "idx_professional_ai_settings_client_professional" ON "professionalAISettingsClient"("professionalId");
CREATE INDEX IF NOT EXISTS "idx_professional_ai_settings_client_subcategory" ON "professionalAISettingsClient"("subcategoryId");
