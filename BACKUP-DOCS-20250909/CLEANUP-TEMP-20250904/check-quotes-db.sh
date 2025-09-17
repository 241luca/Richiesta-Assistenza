#!/bin/bash

echo "=== Checking Quotes in Database ==="
echo ""

# Connect to PostgreSQL and check quotes
psql -U postgres -d assistenza_db << EOF
SELECT 
  q.id,
  q.title,
  q.status,
  q."totalAmount",
  q."professionalId",
  q."requestId",
  q."organizationId",
  q."createdAt"
FROM quotes q
ORDER BY q."createdAt" DESC
LIMIT 10;
EOF

echo ""
echo "=== Checking if there are any quotes at all ==="
psql -U postgres -d assistenza_db << EOF
SELECT COUNT(*) as total_quotes FROM quotes;
EOF

echo ""
echo "=== Checking organization IDs in users ==="
psql -U postgres -d assistenza_db << EOF
SELECT 
  id, 
  email, 
  role, 
  "organizationId",
  "fullName"
FROM users 
WHERE email IN ('admin@test.com', 'mario.rossi@professional.com', 'client@test.com')
LIMIT 10;
EOF

echo ""
echo "=== Done ==="
