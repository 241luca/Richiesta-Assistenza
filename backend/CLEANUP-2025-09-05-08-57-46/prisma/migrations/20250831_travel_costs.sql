-- Tabella per i costi di trasferimento
-- Supporta tariffe complesse con scaglioni e supplementi

CREATE TABLE IF NOT EXISTS "TravelCostRules" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Tariffa base
  baseCallCost INTEGER NOT NULL DEFAULT 0, -- Costo chiamata base in centesimi
  
  -- Scaglioni chilometrici (in centesimi per km)
  kmRange1End FLOAT NOT NULL DEFAULT 10, -- Fino a X km
  kmRange1Rate INTEGER NOT NULL DEFAULT 50, -- Tariffa per questo scaglione (es: 50 = €0.50/km)
  
  kmRange2End FLOAT NOT NULL DEFAULT 30, -- Da X a Y km  
  kmRange2Rate INTEGER NOT NULL DEFAULT 40, -- Tariffa per questo scaglione
  
  kmRange3End FLOAT NOT NULL DEFAULT 50, -- Da Y a Z km
  kmRange3Rate INTEGER NOT NULL DEFAULT 35, -- Tariffa per questo scaglione
  
  kmRangeOverRate INTEGER NOT NULL DEFAULT 30, -- Oltre Z km
  
  -- Supplementi in percentuale
  weekendSupplement FLOAT NOT NULL DEFAULT 20, -- Supplemento weekend in %
  nightSupplement FLOAT NOT NULL DEFAULT 30, -- Supplemento notturno in % (20:00-08:00)
  urgencySupplement FLOAT NOT NULL DEFAULT 50, -- Supplemento urgenza in %
  
  -- Zone speciali (JSON con città e supplementi)
  zoneSupplements JSONB, -- Es: {"Milano": 500, "Roma": 800} supplementi in centesimi
  
  -- Configurazione
  isActive BOOLEAN NOT NULL DEFAULT true,
  isDefault BOOLEAN NOT NULL DEFAULT false, -- Una sola può essere default
  
  -- Associazioni
  categoryId TEXT REFERENCES "Category"(id), -- Tariffa specifica per categoria
  professionalId TEXT REFERENCES "User"(id), -- Tariffa personalizzata per professionista
  
  -- Metadata
  metadata JSONB,
  createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
  updatedAt TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_travel_cost_rules_active ON "TravelCostRules"(isActive);
CREATE INDEX IF NOT EXISTS idx_travel_cost_rules_default ON "TravelCostRules"(isDefault);
CREATE INDEX IF NOT EXISTS idx_travel_cost_rules_category ON "TravelCostRules"(categoryId);
CREATE INDEX IF NOT EXISTS idx_travel_cost_rules_professional ON "TravelCostRules"(professionalId);

-- Inserisci tariffa default
INSERT INTO "TravelCostRules" (
  name,
  description,
  baseCallCost,
  kmRange1End, kmRange1Rate,
  kmRange2End, kmRange2Rate,
  kmRange3End, kmRange3Rate,
  kmRangeOverRate,
  weekendSupplement,
  nightSupplement,
  urgencySupplement,
  isActive,
  isDefault
) VALUES (
  'Tariffa Standard',
  'Tariffa base per tutti i servizi',
  0, -- €0 chiamata base
  10, 50, -- €0.50/km fino a 10km
  30, 40, -- €0.40/km da 10 a 30km
  50, 35, -- €0.35/km da 30 a 50km
  30, -- €0.30/km oltre 50km
  20, -- +20% weekend
  30, -- +30% notte
  50, -- +50% urgenza
  true,
  true
) ON CONFLICT DO NOTHING;

-- Esempi di tariffe per categorie specifiche
INSERT INTO "TravelCostRules" (
  name,
  description,
  baseCallCost,
  kmRange1End, kmRange1Rate,
  kmRange2End, kmRange2Rate,
  kmRange3End, kmRange3Rate,
  kmRangeOverRate,
  weekendSupplement,
  nightSupplement,
  urgencySupplement,
  zoneSupplements,
  categoryId,
  isActive,
  isDefault
) 
SELECT 
  'Tariffa Idraulici',
  'Tariffa speciale per servizi idraulici',
  1500, -- €15 chiamata base
  10, 60, -- €0.60/km fino a 10km
  25, 50, -- €0.50/km da 10 a 25km
  40, 45, -- €0.45/km da 25 a 40km
  40, -- €0.40/km oltre 40km
  25, -- +25% weekend
  40, -- +40% notte
  75, -- +75% urgenza
  '{"Milano": 1000, "Roma": 1200, "Napoli": 800}'::jsonb,
  (SELECT id FROM "Category" WHERE slug = 'idraulico' LIMIT 1),
  true,
  false
WHERE EXISTS (SELECT 1 FROM "Category" WHERE slug = 'idraulico');

-- Aggiungi colonna per salvare i costi calcolati nelle richieste
ALTER TABLE "AssistanceRequest" 
ADD COLUMN IF NOT EXISTS calculatedTravelCost INTEGER, -- Costo viaggio calcolato in centesimi
ADD COLUMN IF NOT EXISTS travelCostRuleId TEXT REFERENCES "TravelCostRules"(id),
ADD COLUMN IF NOT EXISTS travelDistance FLOAT, -- Distanza in km
ADD COLUMN IF NOT EXISTS travelDuration INTEGER; -- Durata in minuti

-- Commento sulle colonne per documentazione
COMMENT ON COLUMN "TravelCostRules".baseCallCost IS 'Costo base della chiamata in centesimi (es: 1500 = €15.00)';
COMMENT ON COLUMN "TravelCostRules".kmRange1Rate IS 'Tariffa per km nel primo scaglione in centesimi (es: 50 = €0.50/km)';
COMMENT ON COLUMN "TravelCostRules".weekendSupplement IS 'Supplemento weekend in percentuale (es: 20 = +20%)';
COMMENT ON COLUMN "TravelCostRules".zoneSupplements IS 'Supplementi per zone speciali in JSON (città->centesimi)';
COMMENT ON COLUMN "AssistanceRequest".calculatedTravelCost IS 'Costo viaggio totale calcolato in centesimi';
