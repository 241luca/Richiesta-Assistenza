#!/bin/bash

echo "📋 LISTA UTENTI NEL DATABASE"
echo "============================"

# Query diretta al database per vedere gli utenti
psql -U lucamambelli -d assistenza_db -t << EOF
SELECT 
    email,
    role,
    "firstName",
    "lastName"
FROM "User"
WHERE role IN ('SUPER_ADMIN', 'ADMIN')
ORDER BY role, email;
EOF

echo ""
echo "Per testare l'API, prova con uno di questi utenti."
echo "La password di default è probabilmente 'password123' o 'admin123'"
