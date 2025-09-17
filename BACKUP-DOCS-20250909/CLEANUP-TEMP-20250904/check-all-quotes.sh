#!/bin/bash

echo "=== Verifica preventivi esistenti ==="
psql -U lucamambelli -d assistenza_db << 'EOF'
-- Conta tutti i preventivi
SELECT COUNT(*) as total_quotes FROM "Quote";

-- Mostra tutti i preventivi
SELECT 
  q.id,
  q.title,
  q.status,
  q."totalAmount"/100.0 as amount_euro,
  q."organizationId"
FROM "Quote" q
ORDER BY q."createdAt" DESC;

-- Verifica l'organizzazione dell'admin
SELECT id, "organizationId", email, role 
FROM "User" 
WHERE email = 'admin@test.com';
EOF

echo "Done!"
