#!/bin/bash

echo "🔧 INTEGRAZIONE NUOVO SISTEMA BACKUP"
echo "===================================="
echo ""

# 1. Aggiorna il server per includere le nuove route
echo "1️⃣ Aggiornando server.ts per includere nuove route..."

# Trova la linea dove importare le route
SERVER_FILE="backend/src/server.ts"

# Crea backup del server.ts
cp "$SERVER_FILE" "$SERVER_FILE.backup-$(date +%Y%m%d-%H%M%S)"

# Aggiungi import e route nel server.ts
cat > /tmp/add-backup-routes.js << 'EOF'
const fs = require('fs');

let content = fs.readFileSync('backend/src/server.ts', 'utf8');

// Aggiungi import se non esiste
if (!content.includes("simple-backup.routes")) {
  // Trova ultimo import di routes
  const lastImport = content.lastIndexOf('import');
  const endOfLine = content.indexOf('\n', lastImport);
  
  const importLine = "\nimport simpleBackupRoutes from './routes/simple-backup.routes';";
  content = content.slice(0, endOfLine) + importLine + content.slice(endOfLine);
}

// Aggiungi route se non esiste
if (!content.includes("app.use('/api/backup'")) {
  // Trova dove aggiungere la route (dopo altre route API)
  const apiRoutesSection = content.indexOf("// API Routes");
  if (apiRoutesSection > -1) {
    const nextLine = content.indexOf('\n', apiRoutesSection);
    const routeLine = "\n  app.use('/api/backup', simpleBackupRoutes);";
    content = content.slice(0, nextLine) + routeLine + content.slice(nextLine);
  } else {
    // Aggiungi prima di app.listen
    const appListen = content.indexOf("app.listen");
    const prevLine = content.lastIndexOf('\n', appListen);
    const routeLine = "\n  // Backup routes\n  app.use('/api/backup', simpleBackupRoutes);\n";
    content = content.slice(0, prevLine) + routeLine + content.slice(prevLine);
  }
}

fs.writeFileSync('backend/src/server.ts', content);
console.log('✅ Server updated with backup routes');
EOF

node /tmp/add-backup-routes.js

echo ""
echo "2️⃣ Aggiornando App.tsx per la nuova pagina backup..."

# Aggiorna App.tsx
cat > /tmp/update-app-routes.js << 'EOF'
const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Aggiungi import se non esiste
if (!content.includes("SimpleBackupPage")) {
  // Trova dove aggiungere import (dopo altri import di pages)
  const lastPageImport = content.lastIndexOf("from './pages/admin");
  if (lastPageImport > -1) {
    const endOfLine = content.indexOf('\n', lastPageImport);
    const importLine = "\nimport SimpleBackupPage from './pages/admin/SimpleBackupPage';";
    content = content.slice(0, endOfLine) + importLine + content.slice(endOfLine);
  }
}

// Sostituisci la vecchia route con la nuova
content = content.replace(
  /<Route path="\/admin\/backup" element={<BackupPage \/>} \/>/g,
  '<Route path="/admin/backup" element={<SimpleBackupPage />} />'
);

// Se non trova la route, aggiungila
if (!content.includes('path="/admin/backup"')) {
  // Trova dove aggiungere (dopo altre route admin)
  const adminRoutes = content.indexOf('path="/admin/');
  if (adminRoutes > -1) {
    const endOfRoute = content.indexOf('/>', adminRoutes) + 2;
    const newRoute = '\n            <Route path="/admin/backup" element={<SimpleBackupPage />} />';
    content = content.slice(0, endOfRoute) + newRoute + content.slice(endOfRoute);
  }
}

fs.writeFileSync('src/App.tsx', content);
console.log('✅ App.tsx updated with new backup page');
EOF

node /tmp/update-app-routes.js

echo ""
echo "3️⃣ Creando migrazione database per nuova tabella..."

# Crea file di migrazione
cat > backend/prisma/migrations/create_simple_backups_table.sql << 'EOF'
-- Crea nuova tabella semplificata per backup
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
CREATE INDEX IF NOT EXISTS idx_backups_type ON backups(type);
CREATE INDEX IF NOT EXISTS idx_backups_created_at ON backups(created_at DESC);

-- Commento
COMMENT ON TABLE backups IS 'Sistema di backup semplificato v2.0';
EOF

echo "✅ Migration file created"

echo ""
echo "4️⃣ Aggiornando Prisma schema..."

# Aggiorna schema.prisma
cat >> backend/prisma/schema.prisma << 'EOF'

// Nuovo modello semplificato per backup
model Backup {
  id        String   @id @default(uuid())
  type      String   @db.VarChar(20)
  filename  String   @db.VarChar(255)
  filepath  String   @db.VarChar(500)
  file_size BigInt
  created_at DateTime @default(now())
  created_by String?
  
  @@map("backups")
  @@index([type])
  @@index([created_at])
}
EOF

echo "✅ Prisma schema updated"

echo ""
echo "5️⃣ Installando dipendenze necessarie..."

cd backend
npm install date-fns archiver @types/archiver --save

echo ""
echo "===================================="
echo "✅ INTEGRAZIONE COMPLETATA!"
echo "===================================="
echo ""
echo "📋 Prossimi passi:"
echo ""
echo "1. Esegui la migrazione database:"
echo "   cd backend && npx prisma db push"
echo ""
echo "2. Riavvia il backend:"
echo "   npm run dev"
echo ""
echo "3. Il nuovo sistema backup è disponibile su:"
echo "   http://localhost:5193/admin/backup"
echo ""
echo "✨ Il nuovo sistema è pronto all'uso!"
