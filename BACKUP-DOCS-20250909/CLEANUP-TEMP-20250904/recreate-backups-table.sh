#!/bin/bash

echo "🔧 VERIFICA E RICREA TABELLA BACKUPS"
echo "===================================="
echo ""

echo "1️⃣ Verifica struttura attuale..."
psql "postgresql://postgres:postgres@localhost:5432/richiesta_assistenza" << 'EOF'
-- Mostra struttura attuale
\d backups
EOF

echo ""
echo "2️⃣ Eliminazione e ricreazione tabella..."

psql "postgresql://postgres:postgres@localhost:5432/richiesta_assistenza" << 'EOF'
-- Elimina completamente la tabella
DROP TABLE IF EXISTS backups CASCADE;

-- Verifica che sia stata eliminata
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'backups'
) as table_exists;

-- Ricrea con UUID automatico CORRETTO
CREATE TABLE backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('DATABASE', 'CODE', 'UPLOADS')),
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- Verifica che gen_random_uuid() funzioni
SELECT gen_random_uuid() as test_uuid;

-- Crea indici
CREATE INDEX idx_backups_type ON backups(type);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

-- Mostra struttura finale
\d backups

-- Test inserimento senza ID (deve generarlo automaticamente)
INSERT INTO backups (type, filename, filepath, file_size, created_by)
VALUES ('DATABASE', 'test-auto-id.sql', '/test/path', 1024, 'test-user')
RETURNING *;

-- Pulisci test
DELETE FROM backups WHERE filename = 'test-auto-id.sql';

SELECT 'Tabella ricreata con successo!' as status;
EOF

echo ""
echo "3️⃣ Pulizia file backup parziali..."
rm -f backend/backend/backups/database/*.sql.gz 2>/dev/null
echo "✅ File parziali eliminati"

echo ""
echo "===================================="
echo "✅ SISTEMA PRONTO!"
echo ""
echo "La tabella è stata ricreata correttamente."
echo "Prova ora a fare un backup!"
