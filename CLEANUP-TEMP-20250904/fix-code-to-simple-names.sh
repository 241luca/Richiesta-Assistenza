#!/bin/bash

echo "🔧 AGGIORNAMENTO COMPLETO CODICE PER USARE NOMI SEMPLICI"
echo "========================================================"

cd backend

# Backup di tutti i file che verranno modificati
mkdir -p backups/fix-simple-names-$(date +%Y%m%d-%H%M%S)
cp -r src backups/fix-simple-names-$(date +%Y%m%d-%H%M%S)/

echo "📁 Backup creato in backups/fix-simple-names-$(date +%Y%m%d-%H%M%S)/"
echo ""

# Script Node.js per correggere TUTTI i file
cat > /tmp/fix-to-simple-names.js << 'SCRIPT'
const fs = require('fs');
const path = require('path');

// Funzione per trovare tutti i file TypeScript
function findAllTsFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.includes('node_modules') && !file.name.includes('backups')) {
      results = results.concat(findAllTsFiles(filePath));
    } else if (file.name.endsWith('.ts')) {
      results.push(filePath);
    }
  }
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // 1. CORREZIONE INCLUDE/SELECT STATEMENTS
  // Da User_AssistanceRequest_clientIdToUser a client
  content = content.replace(/User_AssistanceRequest_clientIdToUser/g, 'client');
  content = content.replace(/User_AssistanceRequest_professionalIdToUser/g, 'professional');
  
  // Correggi anche i plurali per le relazioni array
  content = content.replace(/AssistanceRequest_AssistanceRequest_clientIdToUser/g, 'clientRequests');
  content = content.replace(/AssistanceRequest_AssistanceRequest_professionalIdToUser/g, 'professionalRequests');
  
  // Altri nomi di relazioni
  content = content.replace(/Message_Message_recipientIdToUser/g, 'receivedMessages');
  content = content.replace(/Message_Message_senderIdToUser/g, 'sentMessages');
  content = content.replace(/User_Message_recipientIdToUser/g, 'recipient');
  content = content.replace(/User_Message_senderIdToUser/g, 'sender');
  
  content = content.replace(/Notification_Notification_recipientIdToUser/g, 'receivedNotifications');
  content = content.replace(/Notification_Notification_senderIdToUser/g, 'sentNotifications');
  content = content.replace(/User_Notification_recipientIdToUser/g, 'recipient');
  content = content.replace(/User_Notification_senderIdToUser/g, 'sender');
  
  // Fix Category, Subcategory (dovrebbero essere lowercase)
  // Solo quando usati come field di include/select
  content = content.replace(/Category:\s*{/g, 'category: {');
  content = content.replace(/Category:\s*true/g, 'category: true');
  content = content.replace(/Subcategory:\s*{/g, 'subcategory: {');
  content = content.replace(/Subcategory:\s*true/g, 'subcategory: true');
  content = content.replace(/Quote:\s*{/g, 'quotes: {');
  content = content.replace(/Quote:\s*true/g, 'quotes: true');
  content = content.replace(/RequestAttachment:\s*{/g, 'attachments: {');
  content = content.replace(/RequestAttachment:\s*true/g, 'attachments: true');
  content = content.replace(/RequestChatMessage:\s*{/g, 'chatMessages: {');
  content = content.replace(/RequestChatMessage:\s*true/g, 'chatMessages: true');
  
  // 2. CORREZIONE ACCESSO AI DATI
  // Quando accediamo ai dati dal risultato della query
  content = content.replace(/\.Category\?/g, '.category?');
  content = content.replace(/\.Category\./g, '.category.');
  content = content.replace(/\.Category\b/g, '.category');
  
  content = content.replace(/\.Subcategory\?/g, '.subcategory?');
  content = content.replace(/\.Subcategory\./g, '.subcategory.');
  content = content.replace(/\.Subcategory\b/g, '.subcategory');
  
  content = content.replace(/\.Quote\?/g, '.quotes?');
  content = content.replace(/\.Quote\./g, '.quotes.');
  content = content.replace(/\.Quote\b/g, '.quotes');
  
  content = content.replace(/\.RequestAttachment\?/g, '.attachments?');
  content = content.replace(/\.RequestAttachment\./g, '.attachments.');
  content = content.replace(/\.RequestAttachment\b/g, '.attachments');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Aggiornato: ${filePath}`);
    return true;
  }
  return false;
}

console.log('🔍 Ricerca di tutti i file TypeScript...\n');

const allFiles = findAllTsFiles('src');
console.log(`Trovati ${allFiles.length} file TypeScript\n`);

let updatedCount = 0;
let skippedCount = 0;

allFiles.forEach(filePath => {
  if (fixFile(filePath)) {
    updatedCount++;
  } else {
    skippedCount++;
  }
});

console.log('\n======================================================');
console.log(`✅ File aggiornati: ${updatedCount}`);
console.log(`⏭️  File non modificati: ${skippedCount}`);
console.log('======================================================');
SCRIPT

node /tmp/fix-to-simple-names.js

echo ""
echo "========================================================"
echo "✅ AGGIORNAMENTO COMPLETATO!"
echo ""
echo "Ora il codice usa i nomi semplici:"
echo "  - client (invece di User_AssistanceRequest_clientIdToUser)"
echo "  - professional (invece di User_AssistanceRequest_professionalIdToUser)"
echo "  - category, subcategory, quotes, attachments, etc."
echo ""
echo "⚠️  ADESSO RIAVVIA IL BACKEND:"
echo "   Ctrl+C e poi npm run dev"
echo ""
echo "========================================================"

# Cleanup
rm -f /tmp/fix-to-simple-names.js
