#!/bin/bash

echo "🔧 FIX TABELLA BACKUPS - UUID AUTOMATICO"
echo "========================================"
echo ""

echo "1️⃣ Ricreazione tabella con UUID automatico..."

psql "postgresql://postgres:postgres@localhost:5432/richiesta_assistenza" << 'EOF'
-- Elimina vecchia tabella
DROP TABLE IF EXISTS backups CASCADE;

-- Crea tabella con UUID automatico
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('DATABASE', 'CODE', 'UPLOADS')),
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by VARCHAR(100)
);

-- Crea indici
CREATE INDEX idx_backups_type ON backups(type);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

-- Verifica struttura
\d backups

-- Test inserimento
INSERT INTO backups (type, filename, filepath, file_size, created_by)
VALUES ('DATABASE', 'test.sql', '/test/path', 1024, 'test-user')
RETURNING *;

-- Elimina test
DELETE FROM backups WHERE filename = 'test.sql';

SELECT 'Tabella backups creata con successo!' as status;
EOF

echo ""
echo "✅ TABELLA CORRETTA!"
echo ""
echo "Ora prova di nuovo a fare un backup!"
