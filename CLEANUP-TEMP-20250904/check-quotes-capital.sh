#!/bin/bash

echo "=== Verifica diretta nel database ==="
psql -U lucamambelli -d assistenza_db << 'EOF'
-- 1. Verifica se la tabella Quote esiste (con maiuscola)
SELECT COUNT(*) as total_quotes FROM "Quote";

-- 2. Mostra i preventivi se esistono
SELECT 
  q.id,
  q.title,
  q.status,
  q."totalAmount",
  q."organizationId"
FROM "Quote" q
LIMIT 5;

-- 3. Verifica l'organizzazione dell'admin
SELECT id, "organizationId", email, role 
FROM "User" 
WHERE email = 'admin@test.com';

-- 4. Conta preventivi per questa organizzazione
SELECT COUNT(*) as quotes_for_org 
FROM "Quote" 
WHERE "organizationId" = '2ee571bf-0aab-4fde-98ba-2fe3e17b9d60';
EOF

echo "Done!"
