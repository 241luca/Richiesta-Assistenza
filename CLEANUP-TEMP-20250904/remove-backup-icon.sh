#!/bin/bash

echo "🔧 RIMOZIONE ICONA DAL MENU BACKUP"
echo "=================================="
echo ""

# Backup del file Layout.tsx
cp src/components/Layout.tsx src/components/Layout.tsx.backup-remove-icon-$(date +%Y%m%d-%H%M%S)

# Rimuovi l'icona dal menu
cat > /tmp/remove-icon.js << 'EOF'
const fs = require('fs');

let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

// Rimuovi l'icona 💾 dal nome del menu
content = content.replace(/name:\s*'💾\s*Sistema Backup'/g, "name: 'Sistema Backup'");

// Se ci sono altre occorrenze con varianti
content = content.replace(/'💾 Sistema Backup'/g, "'Sistema Backup'");
content = content.replace(/"💾 Sistema Backup"/g, '"Sistema Backup"');

fs.writeFileSync('src/components/Layout.tsx', content);
console.log('✅ Icona rimossa dal menu');
EOF

node /tmp/remove-icon.js

echo ""
echo "✅ FATTO!"
echo ""
echo "L'icona 💾 è stata rimossa dal menu."
echo "Ora il menu mostra solo: 'Sistema Backup'"
