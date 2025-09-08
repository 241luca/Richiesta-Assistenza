-- Migrazione per aggiungere tabella api_keys
-- Eseguire questo SQL nel database

-- Tabella per memorizzare le API keys in modo sicuro
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    service VARCHAR(50) NOT NULL UNIQUE, -- 'google_maps', 'brevo', 'openai'
    api_key TEXT NOT NULL, -- Encrypted in production
    is_active BOOLEAN DEFAULT true,
    last_verified_at TIMESTAMP,
    verification_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'valid', 'invalid'
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP,
    monthly_limit INTEGER, -- Limite mensile di utilizzo
    current_month_usage INTEGER DEFAULT 0,
    settings JSONB, -- Configurazioni aggiuntive specifiche per servizio
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX idx_api_keys_service ON api_keys(service);
CREATE INDEX idx_api_keys_is_active ON api_keys(is_active);

-- Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE
    ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserimento valori di default (con placeholder)
INSERT INTO api_keys (service, api_key, settings) VALUES 
('google_maps', 'YOUR_GOOGLE_MAPS_API_KEY', '{"apis": ["maps", "geocoding", "places"], "restrictions": "http://localhost:*"}'),
('brevo', 'YOUR_BREVO_API_KEY', '{"sender_email": "noreply@assistenza.it", "sender_name": "Sistema Assistenza"}'),
('openai', 'YOUR_OPENAI_API_KEY', '{"model": "gpt-3.5-turbo", "max_tokens": 2048, "temperature": 0.7}')
ON CONFLICT (service) DO NOTHING;
