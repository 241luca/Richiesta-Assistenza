#!/bin/bash

echo "🔧 FIX SISTEMA BACKUP - CREAZIONE TABELLA E CORREZIONE SERVICE"
echo "============================================================="
echo ""

echo "1️⃣ Creazione tabella backups nel database..."
echo ""

# Crea la tabella nel database
psql "postgresql://postgres:postgres@localhost:5432/richiesta_assistenza" << 'EOF'
-- Elimina tabella se esiste (per ricominciare puliti)
DROP TABLE IF EXISTS backups CASCADE;

-- Crea nuova tabella backups
CREATE TABLE backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('DATABASE', 'CODE', 'UPLOADS')),
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID
);

-- Crea indici per performance
CREATE INDEX idx_backups_type ON backups(type);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

-- Verifica creazione
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'backups';
EOF

echo ""
echo "✅ Tabella creata nel database"

echo ""
echo "2️⃣ Creazione directory backup..."
mkdir -p backend/backups/database
mkdir -p backend/backups/code
mkdir -p backend/backups/uploads
echo "✅ Directory create"

echo ""
echo "============================================================="
echo "✅ DATABASE CONFIGURATO!"
echo ""
echo "Ora il sistema dovrebbe funzionare."
echo "Prova a ricaricare la pagina!"
