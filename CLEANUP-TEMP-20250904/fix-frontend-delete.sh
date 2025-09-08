#!/bin/bash

echo "🔧 FIX FRONTEND PER USARE SERVICE"
echo "================================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Aggiorno il frontend per mandare service invece di id:"
cat > /tmp/fix-frontend-delete.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/pages/admin/api-keys/ApiKeysOverview.tsx', 'utf8');

// Cambia deleteKeyMutation per usare service invece di id
content = content.replace(
  /mutationFn: async \(id: string\) => \{/,
  'mutationFn: async (service: string) => {'
);

content = content.replace(
  /const response = await apiClient\.delete\(`\/admin\/api-keys\/\$\{id\}`\);/,
  'const response = await apiClient.delete(`/admin/api-keys/${service}`);'
);

// Cambia handleDelete per passare service invece di id
content = content.replace(
  /deleteKeyMutation\.mutate\(apiKey\.id\)/,
  'deleteKeyMutation.mutate(apiKey.service)'
);

fs.writeFileSync('src/pages/admin/api-keys/ApiKeysOverview.tsx', content);
console.log('✅ Frontend aggiornato');
SCRIPT

node /tmp/fix-frontend-delete.js
rm -f /tmp/fix-frontend-delete.js

echo ""
echo "================================"
echo "RIAVVIA FRONTEND e BACKEND!"
echo ""
echo "Ora il pulsante elimina dovrebbe funzionare"
