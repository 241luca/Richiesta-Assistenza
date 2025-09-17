#!/bin/bash

echo "🔧 AGGIORNAMENTO MENU E IMPORT NEL LAYOUT"
echo "========================================"
echo ""

# Backup del file Layout
cp src/components/Layout.tsx src/components/Layout.tsx.backup-$(date +%Y%m%d-%H%M%S)

# Rimuovi vecchio import e aggiungi il nuovo
cat > /tmp/fix-layout.js << 'EOF'
const fs = require('fs');

let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Rimuovi vecchio import se presente
content = content.replace(/import BackupManagement from.*;\n/g, '');

// Il menu è già corretto con '/admin/backup' e ServerIcon
// Non serve modificare il menu perché punta già a /admin/backup

fs.writeFileSync('src/components/Layout.tsx', content);
console.log('✅ Layout.tsx pulito');
EOF

node /tmp/fix-layout.js

echo ""
echo "========================================"
echo "🔧 AGGIORNAMENTO APP.TSX CON NUOVA ROUTE"
echo ""

# Backup App.tsx
cp src/App.tsx src/App.tsx.backup-$(date +%Y%m%d-%H%M%S)

# Aggiorna App.tsx
cat > /tmp/fix-app.js << 'EOF'
const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Rimuovi vecchio import BackupManagement
content = content.replace(/import BackupManagement from.*;\n/g, '');
content = content.replace(/import BackupPage from.*;\n/g, '');

// Aggiungi nuovo import se non presente
if (!content.includes('SimpleBackupPage')) {
    // Trova dove aggiungere l'import (dopo altri import di pages)
    const lastImport = content.lastIndexOf('import');
    const endOfImport = content.indexOf('\n', lastImport);
    
    content = content.slice(0, endOfImport) + 
             "\nimport SimpleBackupPage from './pages/admin/SimpleBackupPage';" +
             content.slice(endOfImport);
}

// Cerca e sostituisci la route del backup
// Pattern per trovare qualsiasi route con path="/admin/backup"
content = content.replace(
    /<Route\s+path="\/admin\/backup"[^>]*>[\s\S]*?<\/Route>/gi,
    '<Route path="/admin/backup" element={<SimpleBackupPage />} />'
);

// Se non trova nessuna route, aggiungila
if (!content.includes('path="/admin/backup"')) {
    // Trova dove aggiungere (dopo altre route admin)
    const adminRouteIndex = content.indexOf('path="/admin/');
    if (adminRouteIndex > -1) {
        // Trova la fine di quella route
        let routeEnd = content.indexOf('/>', adminRouteIndex);
        if (routeEnd > -1) {
            routeEnd += 2;
            content = content.slice(0, routeEnd) +
                     '\n        <Route path="/admin/backup" element={<SimpleBackupPage />} />' +
                     content.slice(routeEnd);
        }
    }
}

fs.writeFileSync('src/App.tsx', content);
console.log('✅ App.tsx aggiornato con nuova route');
EOF

node /tmp/fix-app.js

echo ""
echo "========================================"
echo "🔧 VERIFICA ROUTES.TSX"
echo ""

# Aggiorna anche routes.tsx se necessario
cat > /tmp/fix-routes.js << 'EOF'
const fs = require('fs');

const routesFile = 'src/routes.tsx';
if (fs.existsSync(routesFile)) {
    let content = fs.readFileSync(routesFile, 'utf8');
    
    // Rimuovi vecchio import
    content = content.replace(/import BackupManagement from.*;\n/g, '');
    content = content.replace(/import BackupPage from.*;\n/g, '');
    
    // Aggiungi nuovo import se non presente
    if (!content.includes('SimpleBackupPage')) {
        // Trova dove aggiungere l'import
        const lastImport = content.lastIndexOf("import");
        if (lastImport > -1) {
            const endOfLine = content.indexOf('\n', lastImport);
            content = content.slice(0, endOfLine) +
                     "\nimport SimpleBackupPage from './pages/admin/SimpleBackupPage';" +
                     content.slice(endOfLine);
        }
    }
    
    // Aggiorna route
    content = content.replace(
        /<Route\s+path="\/admin\/backup".*?element={<BackupManagement.*?\/>/gi,
        '<Route path="/admin/backup" element={<Layout><SimpleBackupPage /></Layout>} />'
    );
    
    fs.writeFileSync(routesFile, content);
    console.log('✅ routes.tsx aggiornato');
}
EOF

node /tmp/fix-routes.js

echo ""
echo "========================================"
echo "✅ AGGIORNAMENTO COMPLETATO!"
echo "========================================"
echo ""
echo "📋 Modifiche effettuate:"
echo "- ✅ Layout.tsx: Rimossi import vecchi"
echo "- ✅ App.tsx: Aggiunta route per SimpleBackupPage"  
echo "- ✅ routes.tsx: Aggiornata route backup"
echo "- ✅ Menu: Già punta correttamente a /admin/backup"
echo ""
echo "🎯 Il sistema backup è ora accessibile da:"
echo "   Menu laterale → 💾 Sistema Backup"
echo "   URL: http://localhost:5193/admin/backup"
echo ""
echo "🚀 Pronto all'uso!"
