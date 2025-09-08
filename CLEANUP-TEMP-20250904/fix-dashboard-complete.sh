#!/bin/bash

echo "🔧 FIX DEFINITIVO DASHBOARD ROUTES"
echo "=================================="

cd backend

# Crea backup
cp src/routes/dashboard/user-dashboard.routes.ts src/routes/dashboard/user-dashboard.routes.ts.backup-$(date +%Y%m%d-%H%M%S)

# Correggi tutte le relazioni errate nel file
cat > /tmp/fix-dashboard.js << 'SCRIPT'
const fs = require('fs');

const filePath = 'src/routes/dashboard/user-dashboard.routes.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Fix per CLIENT queries
// Sostituisci 'professional:' con 'User_AssistanceRequest_professionalIdToUser:'
content = content.replace(/professional:\s*{/g, 'User_AssistanceRequest_professionalIdToUser: {');

// Fix per PROFESSIONAL queries  
// Sostituisci 'client:' con 'User_AssistanceRequest_clientIdToUser:'
content = content.replace(/client:\s*{/g, 'User_AssistanceRequest_clientIdToUser: {');

// Fix Category (potrebbe essere già corretto ma assicuriamoci)
content = content.replace(/category:\s*{/g, 'Category: {');

// Fix per accesso ai dati nel mapping
// Sostituisci '.professional' con '.User_AssistanceRequest_professionalIdToUser'
content = content.replace(/request\.professional\?/g, 'request.User_AssistanceRequest_professionalIdToUser?');
content = content.replace(/request\.professional\s+&&/g, 'request.User_AssistanceRequest_professionalIdToUser &&');
content = content.replace(/request\.professional\s+\?/g, 'request.User_AssistanceRequest_professionalIdToUser ?');
content = content.replace(/request\.professional\./g, 'request.User_AssistanceRequest_professionalIdToUser.');

// Sostituisci '.client' con '.User_AssistanceRequest_clientIdToUser'
content = content.replace(/request\.client\?/g, 'request.User_AssistanceRequest_clientIdToUser?');
content = content.replace(/request\.client\s+&&/g, 'request.User_AssistanceRequest_clientIdToUser &&');
content = content.replace(/request\.client\s+\?/g, 'request.User_AssistanceRequest_clientIdToUser ?');
content = content.replace(/request\.client\./g, 'request.User_AssistanceRequest_clientIdToUser.');

// Fix per Category
content = content.replace(/request\.category\?/g, 'request.Category?');
content = content.replace(/request\.category\./g, 'request.Category.');

// Scrivi il file corretto
fs.writeFileSync(filePath, content);
console.log('✅ File corretto con successo!');
SCRIPT

node /tmp/fix-dashboard.js

echo ""
echo "Verifica correzioni applicate:"
echo "------------------------------"
echo ""
echo "1. Relazioni corrette (dovrebbero usare User_AssistanceRequest_...):"
grep -n "User_AssistanceRequest_clientIdToUser:" src/routes/dashboard/user-dashboard.routes.ts | head -2
grep -n "User_AssistanceRequest_professionalIdToUser:" src/routes/dashboard/user-dashboard.routes.ts | head -2

echo ""
echo "2. Accesso ai dati nel mapping (dovrebbero usare i nomi lunghi):"
grep -n "User_AssistanceRequest_professionalIdToUser\?" src/routes/dashboard/user-dashboard.routes.ts | head -2
grep -n "User_AssistanceRequest_clientIdToUser\?" src/routes/dashboard/user-dashboard.routes.ts | head -2

echo ""
echo "=================================="
echo "✅ CORREZIONI APPLICATE!"
echo "⚠️  RIAVVIA IL BACKEND con Ctrl+C e npm run dev"

# Cleanup
rm -f /tmp/fix-dashboard.js
