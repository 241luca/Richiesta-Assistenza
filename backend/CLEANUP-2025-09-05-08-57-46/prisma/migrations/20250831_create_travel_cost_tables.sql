-- Migrazione per creare le tabelle dei costi di viaggio personalizzati
-- Queste tabelle permettono configurazioni più flessibili rispetto a TravelCostRules

-- Tabella principale per le impostazioni dei costi
CREATE TABLE IF NOT EXISTS "travel_cost_settings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  base_cost INTEGER NOT NULL DEFAULT 0, -- Costo base in centesimi
  free_distance_km INTEGER NOT NULL DEFAULT 0, -- Km gratuiti
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(professional_id)
);

-- Tabella per gli scaglioni di costo per km
CREATE TABLE IF NOT EXISTS "travel_cost_ranges" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_id UUID NOT NULL REFERENCES "travel_cost_settings"(id) ON DELETE CASCADE,
  from_km INTEGER NOT NULL,
  to_km INTEGER, -- NULL significa "infinito"
  cost_per_km INTEGER NOT NULL, -- Costo per km in centesimi
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Tabella per i supplementi (weekend, notte, urgenza, etc)
CREATE TABLE IF NOT EXISTS "travel_supplements" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings_id UUID NOT NULL REFERENCES "travel_cost_settings"(id) ON DELETE CASCADE,
  supplement_type VARCHAR(50) NOT NULL CHECK (supplement_type IN ('WEEKEND', 'NIGHT', 'HOLIDAY', 'URGENT')),
  percentage INTEGER NOT NULL DEFAULT 0, -- Percentuale di supplemento
  fixed_amount INTEGER NOT NULL DEFAULT 0, -- Importo fisso in centesimi
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_travel_cost_settings_professional ON "travel_cost_settings"(professional_id);
CREATE INDEX IF NOT EXISTS idx_travel_cost_settings_active ON "travel_cost_settings"(is_active);
CREATE INDEX IF NOT EXISTS idx_travel_cost_ranges_settings ON "travel_cost_ranges"(settings_id);
CREATE INDEX IF NOT EXISTS idx_travel_cost_ranges_order ON "travel_cost_ranges"(order_index);
CREATE INDEX IF NOT EXISTS idx_travel_supplements_settings ON "travel_supplements"(settings_id);
CREATE INDEX IF NOT EXISTS idx_travel_supplements_type ON "travel_supplements"(supplement_type);

-- Commenti per documentazione
COMMENT ON TABLE "travel_cost_settings" IS 'Impostazioni principali dei costi di viaggio per professionista';
COMMENT ON TABLE "travel_cost_ranges" IS 'Scaglioni chilometrici con costi differenziati';
COMMENT ON TABLE "travel_supplements" IS 'Supplementi applicabili (weekend, notte, urgenza, etc)';

COMMENT ON COLUMN "travel_cost_settings".base_cost IS 'Costo base della chiamata in centesimi (es: 1000 = €10.00)';
COMMENT ON COLUMN "travel_cost_settings".free_distance_km IS 'Primi km non addebitati al cliente';
COMMENT ON COLUMN "travel_cost_ranges".cost_per_km IS 'Costo per km in centesimi (es: 100 = €1.00/km)';
COMMENT ON COLUMN "travel_supplements".percentage IS 'Supplemento percentuale sul totale';
COMMENT ON COLUMN "travel_supplements".fixed_amount IS 'Supplemento fisso in centesimi';

-- Funzione per aggiornare updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger per aggiornare updated_at
DROP TRIGGER IF EXISTS update_travel_cost_settings_updated_at ON "travel_cost_settings";
CREATE TRIGGER update_travel_cost_settings_updated_at
    BEFORE UPDATE ON "travel_cost_settings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
