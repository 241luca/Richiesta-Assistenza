#!/bin/bash

echo "🔧 CORREZIONE SERVER.TS - RIMOZIONE LINEA DUPLICATA"
echo "=================================================="
echo ""

# Backup del server.ts
cp backend/src/server.ts backend/src/server.ts.backup-fix-$(date +%Y%m%d-%H%M%S)

# Correggi il server.ts
cat > /tmp/fix-server.js << 'EOF'
const fs = require('fs');

let content = fs.readFileSync('backend/src/server.ts', 'utf8');

// Rimuovi la linea problematica che usa backupRoutes non definito
content = content.replace(
  /app\.use\('\/api\/backup',\s*authenticate,\s*requireRole\(\['ADMIN',\s*'SUPER_ADMIN'\]\),\s*backupRoutes\);?\n/g,
  ''
);

// Assicuriamoci che ci sia solo una route per /api/backup
// e che usi simpleBackupRoutes
if (!content.includes("app.use('/api/backup', simpleBackupRoutes)")) {
  // Se non c'è, aggiungila prima di app.listen
  const listenIndex = content.indexOf('app.listen');
  if (listenIndex > -1) {
    const insertPoint = content.lastIndexOf('\n', listenIndex);
    content = content.slice(0, insertPoint) +
              "\n  app.use('/api/backup', simpleBackupRoutes);" +
              content.slice(insertPoint);
  }
}

fs.writeFileSync('backend/src/server.ts', content);
console.log('✅ Server.ts corretto');
EOF

node /tmp/fix-server.js

echo ""
echo "✅ CORREZIONE COMPLETATA!"
echo ""
echo "Il server dovrebbe riavviarsi automaticamente."
