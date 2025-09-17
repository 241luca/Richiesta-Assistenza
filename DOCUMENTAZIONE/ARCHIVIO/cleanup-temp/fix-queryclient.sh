#!/bin/bash

echo "🔧 FIX QUERYCLIENT IMPORT"
echo "========================"

cd /Users/lucamambelli/Desktop/richiesta-assistenza

echo "1. Sistemo gli import in App.tsx:"

cat > /tmp/fix-queryclient.js << 'SCRIPT'
const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf8');

// Trova la prima riga di import
const lines = content.split('\n');
const newLines = [];
let foundTanstackImport = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Se troviamo l'import di tanstack/react-query, assicuriamoci che abbia QueryClient
  if (line.includes('@tanstack/react-query')) {
    if (!line.includes('QueryClient')) {
      // Aggiungi QueryClient e QueryClientProvider
      newLines.push("import { QueryClient, QueryClientProvider } from '@tanstack/react-query';");
      foundTanstackImport = true;
    } else {
      newLines.push(line);
      foundTanstackImport = true;
    }
  } else {
    newLines.push(line);
  }
}

// Se non abbiamo trovato l'import di tanstack, aggiungilo all'inizio
if (!foundTanstackImport) {
  // Aggiungi dopo React import
  for (let i = 0; i < newLines.length; i++) {
    if (newLines[i].includes("import React") || newLines[i].includes("from 'react'")) {
      newLines.splice(i + 1, 0, "import { QueryClient, QueryClientProvider } from '@tanstack/react-query';");
      break;
    }
  }
}

fs.writeFileSync('src/App.tsx', newLines.join('\n'));
console.log('✅ Import corretto aggiunto');
SCRIPT

node /tmp/fix-queryclient.js

echo ""
echo "2. Verifica tutti gli import necessari:"
echo "---"
head -15 src/App.tsx | grep "^import"
echo "---"

rm -f /tmp/fix-queryclient.js

echo ""
echo "========================"
echo "RIAVVIA IL FRONTEND!"
