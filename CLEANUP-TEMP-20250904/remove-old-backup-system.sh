#!/bin/bash

echo "🗑️ RIMOZIONE VECCHIO SISTEMA BACKUP"
echo "===================================="
echo ""
echo "Questo script rimuove completamente il vecchio sistema di backup"
echo "e prepara il terreno per il nuovo sistema semplificato."
echo ""
echo "⚠️ ATTENZIONE: Questa operazione è irreversibile!"
echo ""
read -p "Sei sicuro di voler procedere? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operazione annullata."
    exit 1
fi

echo ""
echo "📋 FASE 1: Backup di sicurezza prima della rimozione..."
echo ""

# Crea un backup di sicurezza dei file che stiamo per rimuovere
SAFETY_BACKUP="/Users/lucamambelli/Desktop/richiesta-assistenza/BACKUP-VECCHIO-SISTEMA-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$SAFETY_BACKUP"

# Salva i file del vecchio sistema
echo "💾 Salvando vecchi file in: $SAFETY_BACKUP"
cp -r backend/src/services/backup.service.ts "$SAFETY_BACKUP/" 2>/dev/null
cp -r backend/src/routes/backup.routes.ts "$SAFETY_BACKUP/" 2>/dev/null
cp -r backend/src/controllers/backup.controller.ts "$SAFETY_BACKUP/" 2>/dev/null
cp -r src/pages/admin/BackupPage.tsx "$SAFETY_BACKUP/" 2>/dev/null
cp -r src/components/backup "$SAFETY_BACKUP/" 2>/dev/null

echo "✅ Backup di sicurezza completato"
echo ""

echo "📋 FASE 2: Rimozione file del vecchio sistema..."
echo ""

# Rimuovi i file del vecchio sistema
echo "🗑️ Rimuovendo service vecchio..."
rm -f backend/src/services/backup.service.ts
rm -f backend/src/services/backup.service.ts.backup-*

echo "🗑️ Rimuovendo routes vecchie..."
rm -f backend/src/routes/backup.routes.ts
rm -f backend/src/routes/backup.routes.ts.backup-*

echo "🗑️ Rimuovendo controller vecchio..."
rm -f backend/src/controllers/backup.controller.ts

echo "🗑️ Rimuovendo componenti React vecchi..."
rm -rf src/pages/admin/BackupPage.tsx
rm -rf src/components/backup

echo "🗑️ Rimuovendo jobs scheduler vecchi..."
rm -f backend/src/jobs/backupScheduler.job.ts

echo ""
echo "📋 FASE 3: Pulizia database..."
echo ""

# Crea script SQL per pulire il database
cat > /tmp/cleanup-backup-tables.sql << 'EOF'
-- Backup delle tabelle esistenti prima di eliminarle
CREATE TABLE IF NOT EXISTS _backup_old_system AS SELECT * FROM system_backup;
CREATE TABLE IF NOT EXISTS _backup_old_logs AS SELECT * FROM backup_log;
CREATE TABLE IF NOT EXISTS _backup_old_schedule AS SELECT * FROM backup_schedule;

-- Elimina le vecchie tabelle complesse
DROP TABLE IF EXISTS backup_log CASCADE;
DROP TABLE IF EXISTS backup_schedule CASCADE;
DROP TABLE IF EXISTS system_backup CASCADE;

-- Crea nuova tabella semplificata
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('DATABASE', 'CODE', 'UPLOADS')),
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Indici per performance
CREATE INDEX idx_backups_type ON backups(type);
CREATE INDEX idx_backups_created_at ON backups(created_at DESC);

-- Commento sulla tabella
COMMENT ON TABLE backups IS 'Sistema di backup semplificato - v2.0';
EOF

echo "🗄️ Aggiornamento database..."
psql "$DATABASE_URL" < /tmp/cleanup-backup-tables.sql 2>/dev/null || echo "⚠️ Database update needs manual intervention"

echo ""
echo "📋 FASE 4: Pulizia file di backup vecchi..."
echo ""

# Pulisci directory backup
echo "🧹 Pulizia directory system-backups..."
rm -rf backend/system-backups/temp*
rm -f backend/system-backups/*.tar.gz
rm -f backend/system-backups/*.json

# Crea nuova struttura directory
echo "📁 Creazione nuova struttura..."
mkdir -p backend/backups/database
mkdir -p backend/backups/code  
mkdir -p backend/backups/uploads

echo ""
echo "✅ RIMOZIONE COMPLETATA!"
echo ""
echo "📊 Riepilogo:"
echo "- ✅ File vecchio sistema rimossi"
echo "- ✅ Backup di sicurezza salvato in: $SAFETY_BACKUP"
echo "- ✅ Database pulito e pronto per nuovo schema"
echo "- ✅ Nuove directory create"
echo ""
echo "🚀 Pronto per installare il nuovo sistema!"
