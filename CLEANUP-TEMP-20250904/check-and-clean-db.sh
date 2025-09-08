#!/bin/bash

echo "=== Verifica preventivi nel database ==="
psql -U postgres -d assistenza_db << 'EOF'
-- Controlla se ci sono preventivi
SELECT COUNT(*) as total_quotes FROM quotes;

-- Mostra i preventivi se esistono
SELECT 
  q.id,
  q.title,
  q.status,
  q."totalAmount",
  q."organizationId",
  u."fullName" as professional,
  ar.title as request_title
FROM quotes q
LEFT JOIN users u ON q."professionalId" = u.id
LEFT JOIN "assistanceRequests" ar ON q."requestId" = ar.id
LIMIT 5;

-- Verifica le organizzazioni
SELECT id, name, slug FROM organizations;

-- Cancella l'organizzazione vuota (quella senza nome o con nome vuoto)
DELETE FROM organizations 
WHERE name IS NULL OR name = '' OR name = 'Default Organization';

-- Mostra le organizzazioni rimaste
SELECT id, name, slug FROM organizations;
EOF

echo "Done!"
