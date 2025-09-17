#!/bin/bash

echo "🔍 VERIFICA QUERY INSERT NEL SERVICE"
echo "===================================="
echo ""

# Verifica che la query non includa l'id
grep -n "INSERT INTO backups" backend/src/services/simple-backup.service.ts | head -5

echo ""
echo "La query NON deve includere 'id' nella lista delle colonne."
echo "Deve essere solo: (type, filename, filepath, file_size, created_by)"
echo ""

# Test diretto nel database
echo "Test inserimento diretto nel database..."
psql "postgresql://postgres:postgres@localhost:5432/richiesta_assistenza" << 'EOF'
-- Test inserimento senza specificare id
INSERT INTO backups (type, filename, filepath, file_size, created_by)
VALUES ('DATABASE', 'test-direct.sql', '/test/direct', 2048, '525304b0-88b7-4c57-8fee-090220953b10')
RETURNING id, type, filename;

-- Verifica inserimento
SELECT id, type, filename FROM backups WHERE filename = 'test-direct.sql';

-- Pulisci
DELETE FROM backups WHERE filename = 'test-direct.sql';
EOF

echo ""
echo "===================================="
echo "Se il test sopra ha funzionato, il problema è nel service."
echo "Altrimenti è nel database."
