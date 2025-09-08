-- Creazione tabella per API Keys
CREATE TABLE IF NOT EXISTS "ApiKey" (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    service TEXT NOT NULL UNIQUE,
    key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB,
    last_validated_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by_id TEXT REFERENCES "User"(id),
    organization_id TEXT NOT NULL REFERENCES "Organization"(id)
);

-- Indici
CREATE INDEX idx_api_keys_service ON "ApiKey"(service);
CREATE INDEX idx_api_keys_organization ON "ApiKey"(organization_id);

-- Inserimento chiavi iniziali (con valori placeholder)
INSERT INTO "ApiKey" (service, key, organization_id, configuration) 
VALUES 
    ('GOOGLE_MAPS', 'AIza_placeholder', (SELECT id FROM "Organization" LIMIT 1), '{"enabled": false, "apis": ["maps", "geocoding", "places"]}'),
    ('BREVO', 'xkeysib_placeholder', (SELECT id FROM "Organization" LIMIT 1), '{"enabled": false, "sender_email": "", "sender_name": ""}'),
    ('OPENAI', 'sk_placeholder', (SELECT id FROM "Organization" LIMIT 1), '{"enabled": false, "model": "gpt-3.5-turbo", "max_tokens": 2048}')
ON CONFLICT (service) DO NOTHING;
