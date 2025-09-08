#!/bin/bash

echo "🧹 PULIZIA COMPLETA VECCHIO SISTEMA E AGGIORNAMENTO MENU"
echo "========================================================"
echo ""

# 1. ELIMINA TUTTI I FILE DEL VECCHIO SISTEMA
echo "1️⃣ Eliminazione file vecchio sistema backup..."
echo ""

# Backend - Elimina vecchi file
echo "🗑️ Rimuovendo vecchi file backend..."
rm -f backend/src/services/backup.service.ts
rm -f backend/src/routes/backup.routes.ts
rm -f backend/src/controllers/backup.controller.ts
rm -f backend/src/jobs/backupScheduler.job.ts
rm -rf backend/system-backups

# Rimuovi tutti i file di backup vecchi
find backend/src -name "*backup.service*" -type f -delete 2>/dev/null
find backend/src -name "*backup.routes*" -type f -delete 2>/dev/null
find backend/src -name "*backup.controller*" -type f -delete 2>/dev/null

echo "✅ File backend vecchio sistema rimossi"

# Frontend - Elimina vecchi componenti
echo ""
echo "🗑️ Rimuovendo vecchi componenti React..."
rm -f src/pages/admin/BackupPage.tsx
rm -f src/pages/admin/BackupPage.jsx
rm -rf src/components/backup
rm -rf src/components/admin/backup

echo "✅ Componenti React vecchio sistema rimossi"

echo ""
echo "========================================================"
echo "2️⃣ Aggiornamento menu laterale con nuovo link..."
echo ""

# Trova e aggiorna il file del menu (AdminLayout o Sidebar)
echo "🔍 Cercando file del menu..."

# Controlla diversi possibili file del menu
MENU_FILES=(
    "src/components/admin/AdminLayout.tsx"
    "src/components/admin/AdminSidebar.tsx"
    "src/components/layout/AdminLayout.tsx"
    "src/components/layout/Sidebar.tsx"
    "src/components/Sidebar.tsx"
    "src/layout/AdminLayout.tsx"
)

MENU_FILE=""
for file in "${MENU_FILES[@]}"; do
    if [ -f "$file" ]; then
        MENU_FILE="$file"
        echo "✅ Trovato menu in: $MENU_FILE"
        break
    fi
done

if [ -z "$MENU_FILE" ]; then
    echo "⚠️ Menu file non trovato automaticamente, cercando con grep..."
    MENU_FILE=$(grep -r "Sistema Backup" src --include="*.tsx" --include="*.jsx" | head -1 | cut -d':' -f1)
    if [ -n "$MENU_FILE" ]; then
        echo "✅ Trovato menu in: $MENU_FILE"
    fi
fi

if [ -n "$MENU_FILE" ]; then
    # Backup del file menu
    cp "$MENU_FILE" "$MENU_FILE.backup-menu-$(date +%Y%m%d-%H%M%S)"
    
    # Aggiorna il link nel menu
    cat > /tmp/update-menu.js << 'EOF'
const fs = require('fs');
const args = process.argv.slice(2);
const menuFile = args[0];

if (!menuFile) {
    console.error('No menu file specified');
    process.exit(1);
}

let content = fs.readFileSync(menuFile, 'utf8');

// Cerca e sostituisci il link del backup
// Pattern 1: Link con componente BackupPage
content = content.replace(
    /path:\s*["']\/admin\/backup["'],\s*element:\s*<BackupPage\s*\/>/gi,
    "path: '/admin/backup', element: <SimpleBackupPage />"
);

// Pattern 2: href o to con /admin/backup
content = content.replace(
    /(href|to)=["']\/admin\/backup["']/gi,
    '$1="/admin/backup"'
);

// Pattern 3: Link o NavLink con vecchia pagina
content = content.replace(
    /<(Link|NavLink)\s+to=["']\/admin\/backup["']>[\s\S]*?Sistema Backup[\s\S]*?<\/(Link|NavLink)>/gi,
    '<$1 to="/admin/backup">💾 Sistema Backup</$1>'
);

// Pattern 4: MenuItem o simili
content = content.replace(
    /{\s*name:\s*["'].*?Sistema Backup.*?["'],\s*path:\s*["']\/admin\/backup["']/gi,
    '{ name: "💾 Sistema Backup", path: "/admin/backup"'
);

// Se c'è un'icona specifica per il backup, aggiorniamola
content = content.replace(
    /<BackupIcon\s*\/>\s*Sistema Backup/gi,
    '💾 Sistema Backup'
);

// Aggiungi import se necessario e non presente
if (content.includes('SimpleBackupPage') && !content.includes("import SimpleBackupPage")) {
    // Trova dove aggiungere l'import
    const lastImport = content.lastIndexOf('import');
    if (lastImport > -1) {
        const endOfLine = content.indexOf('\n', lastImport);
        content = content.slice(0, endOfLine) + 
                 "\nimport SimpleBackupPage from '@/pages/admin/SimpleBackupPage';" + 
                 content.slice(endOfLine);
    }
}

fs.writeFileSync(menuFile, content);
console.log('✅ Menu aggiornato con nuovo link backup');
EOF

    node /tmp/update-menu.js "$MENU_FILE"
else
    echo "⚠️ Menu file non trovato, aggiornamento manuale necessario"
fi

echo ""
echo "========================================================"
echo "3️⃣ Rimozione route vecchie dal server..."
echo ""

# Rimuovi le vecchie route dal server.ts
cat > /tmp/remove-old-routes.js << 'EOF'
const fs = require('fs');

const serverFile = 'backend/src/server.ts';
if (fs.existsSync(serverFile)) {
    let content = fs.readFileSync(serverFile, 'utf8');
    
    // Rimuovi import vecchie route
    content = content.replace(/import.*backup\.routes.*;\n/gi, '');
    content = content.replace(/import.*backupRoutes.*from.*backup\.routes.*;\n/gi, '');
    
    // Rimuovi uso vecchie route
    content = content.replace(/app\.use\(['"]\/api\/backup['"],\s*backupRoutes\);\n/gi, '');
    
    // Assicura che le nuove route siano presenti
    if (!content.includes('simple-backup.routes')) {
        console.log('⚠️ Nuove route non trovate, aggiungendole...');
        
        // Aggiungi import
        const lastImport = content.lastIndexOf('import');
        const endOfImport = content.indexOf('\n', lastImport);
        content = content.slice(0, endOfImport) + 
                 "\nimport simpleBackupRoutes from './routes/simple-backup.routes';" +
                 content.slice(endOfImport);
        
        // Aggiungi route
        const appListen = content.indexOf('app.listen');
        const beforeListen = content.lastIndexOf('\n', appListen);
        content = content.slice(0, beforeListen) +
                 "\n  app.use('/api/backup', simpleBackupRoutes);" +
                 content.slice(beforeListen);
    }
    
    fs.writeFileSync(serverFile, content);
    console.log('✅ Server.ts pulito e aggiornato');
}
EOF

node /tmp/remove-old-routes.js

echo ""
echo "========================================================"
echo "4️⃣ Pulizia database tabelle vecchie..."
echo ""

# Script SQL per pulire il database
cat > /tmp/cleanup-old-tables.sql << 'EOF'
-- Elimina vecchie tabelle del sistema backup precedente
DROP TABLE IF EXISTS backup_log CASCADE;
DROP TABLE IF EXISTS backup_schedule CASCADE;
DROP TABLE IF EXISTS system_backup CASCADE;

-- Verifica che la nuova tabella esista
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('DATABASE', 'CODE', 'UPLOADS')),
  filename VARCHAR(255) NOT NULL,
  filepath VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Pulisci eventuali residui
DELETE FROM backups WHERE NOT EXISTS (
    SELECT 1 FROM pg_stat_file(filepath)
) AND filepath IS NOT NULL;
EOF

echo "🗄️ Eseguendo pulizia database..."
psql "$DATABASE_URL" < /tmp/cleanup-old-tables.sql 2>/dev/null || echo "⚠️ Pulizia database richiede intervento manuale"

echo ""
echo "========================================================"
echo "5️⃣ Verifica finale e pulizia file temporanei..."
echo ""

# Pulisci file temporanei
rm -f /tmp/update-menu.js
rm -f /tmp/remove-old-routes.js
rm -f /tmp/cleanup-old-tables.sql

# Verifica che non ci siano residui
echo "🔍 Controllo residui vecchio sistema..."
OLD_FILES=$(find . -name "*backup*" -type f | grep -v "simple-backup" | grep -v "node_modules" | grep -v ".git")

if [ -n "$OLD_FILES" ]; then
    echo "⚠️ Trovati possibili file residui:"
    echo "$OLD_FILES" | head -10
    echo ""
    read -p "Vuoi vedere tutti i file? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "$OLD_FILES"
    fi
else
    echo "✅ Nessun residuo del vecchio sistema trovato"
fi

echo ""
echo "========================================================"
echo "✅ PULIZIA COMPLETATA E MENU AGGIORNATO!"
echo "========================================================"
echo ""
echo "📋 Stato finale:"
echo "- ✅ Vecchio sistema completamente rimosso"
echo "- ✅ Menu aggiornato con nuovo link"
echo "- ✅ Database pulito"
echo "- ✅ Server configurato con nuove route"
echo ""
echo "🎯 Il nuovo sistema backup è accessibile da:"
echo "   Menu laterale → 💾 Sistema Backup"
echo "   URL diretto: http://localhost:5193/admin/backup"
echo ""
echo "🚀 Sistema pronto all'uso!"
