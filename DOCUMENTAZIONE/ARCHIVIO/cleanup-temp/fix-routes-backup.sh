#!/bin/bash

echo "🔧 FIX ROUTES.TSX - RIMOZIONE BACKUP MANAGEMENT"
echo "=============================================="
echo ""

# Backup routes.tsx
cp src/routes.tsx src/routes.tsx.backup-fix-$(date +%Y%m%d-%H%M%S)

# Correggi il file
cat > /tmp/fix-routes.js << 'EOF'
const fs = require('fs');

let content = fs.readFileSync('src/routes.tsx', 'utf8');

// Rimuovi import di BackupManagement se presente
content = content.replace(/import BackupManagement.*;\n/g, '');

// Sostituisci tutte le occorrenze di BackupManagement con SimpleBackupPage
content = content.replace(/BackupManagement/g, 'SimpleBackupPage');

// Assicurati che l'import di SimpleBackupPage sia presente
if (!content.includes("import SimpleBackupPage")) {
    // Aggiungi dopo l'ultimo import
    const lastImport = content.lastIndexOf('import');
    const endOfImport = content.indexOf('\n', lastImport);
    content = content.slice(0, endOfImport) +
              "\nimport SimpleBackupPage from './pages/admin/SimpleBackupPage';" +
              content.slice(endOfImport);
}

fs.writeFileSync('src/routes.tsx', content);
console.log('✅ routes.tsx corretto');
EOF

node /tmp/fix-routes.js

echo ""
echo "✅ CORREZIONE COMPLETATA!"
echo "Il frontend dovrebbe ricaricarsi automaticamente."
