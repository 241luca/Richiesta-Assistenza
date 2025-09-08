-- Tabella per gestire gli indirizzi di lavoro dei professionisti
-- Permette di salvare multiple sedi operative per ogni professionista

CREATE TABLE IF NOT EXISTS work_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Informazioni indirizzo
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  province CHAR(2) NOT NULL,
  postal_code CHAR(5) NOT NULL,
  country CHAR(2) DEFAULT 'IT',
  
  -- Coordinate geografiche (calcolate tramite geocoding)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Metadati
  name VARCHAR(100), -- Nome opzionale della sede (es. "Ufficio principale", "Magazzino")
  is_default BOOLEAN DEFAULT false, -- Indirizzo predefinito per calcoli
  notes TEXT, -- Note aggiuntive
  
  -- Configurazione costi viaggio
  cost_per_km INTEGER DEFAULT 100, -- Costo per km in centesimi (default 1€/km)
  base_cost INTEGER DEFAULT 500, -- Costo base trasferta in centesimi (default 5€)
  free_distance_km INTEGER DEFAULT 0, -- Km gratuiti inclusi
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_work_addresses_user_id ON work_addresses(user_id);
CREATE INDEX idx_work_addresses_default ON work_addresses(user_id, is_default) WHERE is_default = true;
CREATE INDEX idx_work_addresses_coordinates ON work_addresses(latitude, longitude);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_work_addresses_updated_at 
  BEFORE UPDATE ON work_addresses 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Vincolo: solo un indirizzo di default per utente
CREATE UNIQUE INDEX idx_work_addresses_one_default 
  ON work_addresses(user_id) 
  WHERE is_default = true;

-- Commenti per documentazione
COMMENT ON TABLE work_addresses IS 'Indirizzi di lavoro/operative dei professionisti per calcolo distanze e costi trasferta';
COMMENT ON COLUMN work_addresses.user_id IS 'ID del professionista proprietario dell''indirizzo';
COMMENT ON COLUMN work_addresses.is_default IS 'Indica se questo è l''indirizzo predefinito per i calcoli';
COMMENT ON COLUMN work_addresses.cost_per_km IS 'Costo per kilometro in centesimi di euro';
COMMENT ON COLUMN work_addresses.base_cost IS 'Costo base della trasferta in centesimi di euro';
COMMENT ON COLUMN work_addresses.free_distance_km IS 'Kilometri gratuiti inclusi nel servizio';
