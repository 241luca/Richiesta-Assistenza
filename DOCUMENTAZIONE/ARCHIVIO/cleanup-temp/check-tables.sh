#!/bin/bash

echo "=== Verifica tabelle esistenti ==="
psql -U lucamambelli -d assistenza_db << 'EOF'
-- Lista tutte le tabelle
\dt

-- Verifica se esistono le tabelle quotes e organizations
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
EOF

echo "Done!"
