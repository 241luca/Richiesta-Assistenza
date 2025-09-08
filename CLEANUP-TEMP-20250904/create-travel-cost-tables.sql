-- Migrazione per il sistema di gestione tariffe trasferimento
-- Data: 31/08/2025

-- Tabella principale per le impostazioni dei costi di viaggio
CREATE TABLE IF NOT EXISTS travel_cost_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    base_cost INTEGER NOT NULL DEFAULT 1000, -- in cents (€10.00)
    free_distance_km INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(professional_id)
);

-- Tabella per gli scaglioni di costo per chilometro
CREATE TABLE IF NOT EXISTS travel_cost_ranges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings_id UUID NOT NULL REFERENCES travel_cost_settings(id) ON DELETE CASCADE,
    from_km INTEGER NOT NULL,
    to_km INTEGER, -- NULL significa infinito
    cost_per_km INTEGER NOT NULL, -- in cents
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per i supplementi (weekend, notturno, etc.)
CREATE TABLE IF NOT EXISTS travel_supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings_id UUID NOT NULL REFERENCES travel_cost_settings(id) ON DELETE CASCADE,
    supplement_type VARCHAR(20) NOT NULL CHECK (supplement_type IN ('WEEKEND', 'NIGHT', 'HOLIDAY', 'URGENT')),
    percentage INTEGER NOT NULL DEFAULT 0,
    fixed_amount INTEGER NOT NULL DEFAULT 0, -- in cents
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(settings_id, supplement_type)
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_travel_cost_settings_professional ON travel_cost_settings(professional_id);
CREATE INDEX IF NOT EXISTS idx_travel_cost_ranges_settings ON travel_cost_ranges(settings_id);
CREATE INDEX IF NOT EXISTS idx_travel_supplements_settings ON travel_supplements(settings_id);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop del trigger se esiste (per evitare errori di duplicazione)
DROP TRIGGER IF EXISTS update_travel_cost_settings_updated_at ON travel_cost_settings;

-- Crea il trigger
CREATE TRIGGER update_travel_cost_settings_updated_at 
    BEFORE UPDATE ON travel_cost_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Inserisci alcune impostazioni di esempio per test
-- Questo è opzionale e può essere commentato in produzione
/*
INSERT INTO travel_cost_settings (professional_id, base_cost, free_distance_km, is_active)
SELECT id, 1000, 0, true 
FROM users 
WHERE role = 'PROFESSIONAL' 
LIMIT 1
ON CONFLICT (professional_id) DO NOTHING;
*/

-- Query di verifica
-- Puoi eseguire questa query per verificare che le tabelle siano state create correttamente
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'travel_%';