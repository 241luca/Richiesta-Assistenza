#!/bin/bash

echo "=== Verifica utente cliente esistente ==="
psql -U lucamambelli -d assistenza_db << 'EOF'
-- Trova il cliente Luigi Bianchi
SELECT id, email, "fullName", role, "organizationId" 
FROM "User" 
WHERE "fullName" = 'Luigi Bianchi' AND role = 'CLIENT';

-- Se non esiste, mostra qualsiasi cliente
SELECT id, email, "fullName", role, "organizationId" 
FROM "User" 
WHERE role = 'CLIENT'
LIMIT 5;
EOF

echo "Done!"
