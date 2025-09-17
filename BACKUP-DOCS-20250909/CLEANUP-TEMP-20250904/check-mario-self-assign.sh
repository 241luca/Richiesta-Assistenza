#!/bin/bash
echo "🔍 Verifica stato canSelfAssign di Mario Rossi nel database"
echo "=========================================="

psql postgresql://lucamambelli@localhost:5432/assistenza_db << EOF
SELECT 
  id,
  "fullName",
  email,
  "canSelfAssign"
FROM "User"
WHERE email = 'mario.rossi@assistenza.it';
EOF