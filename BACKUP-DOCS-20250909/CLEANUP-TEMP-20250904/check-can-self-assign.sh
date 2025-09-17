#!/bin/bash
echo "🔍 Verifica campo canSelfAssign per professionisti"
echo "=========================================="

psql postgresql://lucamambelli@localhost:5432/assistenza_db << EOF
SELECT 
  id,
  "fullName",
  email,
  role,
  "canSelfAssign"
FROM "User"
WHERE role = 'PROFESSIONAL'
LIMIT 10;
EOF