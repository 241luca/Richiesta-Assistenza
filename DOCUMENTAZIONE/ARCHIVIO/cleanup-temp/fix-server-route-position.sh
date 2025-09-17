#!/bin/bash

echo "🔧 FIX POSIZIONE ROUTE BACKUP NEL SERVER.TS"
echo "==========================================="
echo ""

# Backup del server.ts
cp backend/src/server.ts backend/src/server.ts.backup-fix-route-$(date +%Y%m%d-%H%M%S)

# Correggi la posizione della route
cat > /tmp/fix-server-route.js << 'EOF'
const fs = require('fs');

let content = fs.readFileSync('backend/src/server.ts', 'utf8');

// Rimuovi la linea fuori posto alla fine del file
content = content.replace(/\n\s*app\.use\('\/api\/backup', simpleBackupRoutes\);[\s\n]*$/, '');

// Trova dove sono registrate le altre route API (cerca pattern di route simili)
const routePatterns = [
  "app.use('/api/travel",
  "app.use('/api/notification-templates",
  "app.use('/api/user"
];

let insertPosition = -1;
for (const pattern of routePatterns) {
  const pos = content.lastIndexOf(pattern);
  if (pos > -1) {
    insertPosition = content.indexOf('\n', pos) + 1;
    break;
  }
}

// Se non trovato, inserisci prima di httpServer.listen
if (insertPosition === -1) {
  insertPosition = content.indexOf('const httpServer = app.listen');
  if (insertPosition > -1) {
    insertPosition = content.lastIndexOf('\n', insertPosition);
  }
}

// Inserisci la route nel posto giusto
if (insertPosition > -1) {
  // Aggiungi un commento e la route
  const routeToAdd = "\n  // Backup routes\n  app.use('/api/backup', simpleBackupRoutes);\n";
  content = content.slice(0, insertPosition) + routeToAdd + content.slice(insertPosition);
  console.log('✅ Route inserita nella posizione corretta');
} else {
  console.log('❌ Non riesco a trovare dove inserire la route');
}

// Assicurati che l'import sia presente
if (!content.includes("import simpleBackupRoutes from './routes/simple-backup.routes'")) {
  // Trova l'ultimo import
  const lastImport = content.lastIndexOf('import');
  const endOfImport = content.indexOf('\n', lastImport);
  content = content.slice(0, endOfImport) +
            "\nimport simpleBackupRoutes from './routes/simple-backup.routes';" +
            content.slice(endOfImport);
}

fs.writeFileSync('backend/src/server.ts', content);
console.log('✅ Server.ts corretto');
EOF

node /tmp/fix-server-route.js

echo ""
echo "✅ CORREZIONE COMPLETATA!"
echo "Il backend dovrebbe riavviarsi automaticamente."
