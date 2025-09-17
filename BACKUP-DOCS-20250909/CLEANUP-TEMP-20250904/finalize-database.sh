#!/bin/bash

echo "🗄️ FINALIZZAZIONE DATABASE PER NUOVO SISTEMA BACKUP"
echo "=================================================="
echo ""

# Connessione database
DB_URL="postgresql://postgres:postgres@localhost:5432/richiesta_assistenza"

echo "1️⃣ Eliminazione vecchie tabelle..."
psql "$DB_URL" << 'EOF'
-- Elimina vecchie tabelle se esistono
DROP TABLE IF EXISTS backup_log CASCADE;
DROP TABLE IF EXISTS backup_schedule CASCADE;
DROP TABLE IF EXISTS system_backup CASCADE;

-- Mostra tabelle eliminate
SELECT 'Vecchie tabelle eliminate' as status;
EOF

echo ""
echo "2️⃣ Creazione nuova tabella backups..."
psql "$DB_URL" << 'EOF'
-- Crea nuova tabella semplificata
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('DATABASE', 'CODE', 'UPLOADS')),
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

-- Crea indici
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(type);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);

-- Verifica creazione
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM 
    information_schema.columns
WHERE 
    table_name = 'backups';
EOF

echo ""
echo "3️⃣ Verifica struttura database..."
psql "$DB_URL" << 'EOF'
-- Mostra tutte le tabelle che contengono 'backup' nel nome
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%backup%';
EOF

echo ""
echo "=================================================="
echo "✅ DATABASE PRONTO PER IL NUOVO SISTEMA!"
echo "=================================================="
echo ""
echo "📋 Stato finale:"
echo "- ✅ Vecchie tabelle rimosse"
echo "- ✅ Nuova tabella 'backups' creata"
echo "- ✅ Indici ottimizzati creati"
echo ""
echo "🚀 Il sistema è pronto all'uso!"
echo "   Vai su: http://localhost:5193/admin/backup"
