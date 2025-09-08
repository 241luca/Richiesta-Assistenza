#!/bin/bash

echo "🔧 FIX FINALE - TUTTI I NOMI IN MINUSCOLO"
echo "========================================="

cd backend

# Backup
mkdir -p backups/lowercase-fix-$(date +%Y%m%d-%H%M%S)
cp -r src backups/lowercase-fix-$(date +%Y%m%d-%H%M%S)/

cat > /tmp/lowercase-all.js << 'SCRIPT'
const fs = require('fs');
const path = require('path');

function findAllTsFiles(dir) {
  let results = [];
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory() && !file.name.includes('node_modules') && !file.name.includes('backups')) {
        results = results.concat(findAllTsFiles(filePath));
      } else if (file.name.endsWith('.ts')) {
        results.push(filePath);
      }
    }
  } catch (e) {}
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // CONVERSIONE COMPLETA A MINUSCOLO per include/select
  
  // Category -> category
  content = content.replace(/Category:\s*{/g, 'category: {');
  content = content.replace(/Category:\s*true/g, 'category: true');
  content = content.replace(/Category:\s*false/g, 'category: false');
  
  // Subcategory -> subcategory  
  content = content.replace(/Subcategory:\s*{/g, 'subcategory: {');
  content = content.replace(/Subcategory:\s*true/g, 'subcategory: true');
  content = content.replace(/Subcategory:\s*false/g, 'subcategory: false');
  
  // SubcategoryAiSettings -> subcategoryAiSettings
  content = content.replace(/SubcategoryAiSettings:\s*{/g, 'subcategoryAiSettings: {');
  content = content.replace(/SubcategoryAiSettings:\s*true/g, 'subcategoryAiSettings: true');
  content = content.replace(/SubcategoryAiSettings:\s*false/g, 'subcategoryAiSettings: false');
  
  // AssistanceRequest -> assistanceRequest
  content = content.replace(/AssistanceRequest:\s*{/g, 'assistanceRequest: {');
  content = content.replace(/AssistanceRequest:\s*true/g, 'assistanceRequest: true');
  content = content.replace(/AssistanceRequest:\s*false/g, 'assistanceRequest: false');
  
  // ProfessionalUserSubcategory -> professionalUserSubcategory
  content = content.replace(/ProfessionalUserSubcategory:\s*{/g, 'professionalUserSubcategory: {');
  content = content.replace(/ProfessionalUserSubcategory:\s*true/g, 'professionalUserSubcategory: true');
  content = content.replace(/ProfessionalUserSubcategory:\s*false/g, 'professionalUserSubcategory: false');
  
  // KbDocument -> kbDocument
  content = content.replace(/KbDocument:\s*{/g, 'kbDocument: {');
  content = content.replace(/KbDocument:\s*true/g, 'kbDocument: true');
  content = content.replace(/KbDocument:\s*false/g, 'kbDocument: false');
  
  // DepositRule -> depositRule
  content = content.replace(/DepositRule:\s*{/g, 'depositRule: {');
  content = content.replace(/DepositRule:\s*true/g, 'depositRule: true');
  content = content.replace(/DepositRule:\s*false/g, 'depositRule: false');
  
  // User -> user (quando usato in include)
  content = content.replace(/User:\s*{/g, 'user: {');
  content = content.replace(/User:\s*true/g, 'user: true');
  content = content.replace(/User:\s*false/g, 'user: false');
  
  // Quote -> quotes
  content = content.replace(/Quote:\s*{/g, 'quotes: {');
  content = content.replace(/Quote:\s*true/g, 'quotes: true');
  content = content.replace(/Quote:\s*false/g, 'quotes: false');
  
  // RequestAttachment -> attachments
  content = content.replace(/RequestAttachment:\s*{/g, 'attachments: {');
  content = content.replace(/RequestAttachment:\s*true/g, 'attachments: true');
  content = content.replace(/RequestAttachment:\s*false/g, 'attachments: false');
  
  // RequestChatMessage -> chatMessages
  content = content.replace(/RequestChatMessage:\s*{/g, 'chatMessages: {');
  content = content.replace(/RequestChatMessage:\s*true/g, 'chatMessages: true');
  content = content.replace(/RequestChatMessage:\s*false/g, 'chatMessages: false');
  
  // IMPORTANTE: Nei _count devono rimanere maiuscoli!
  // Quindi riconvertiamo solo nei _count
  content = content.replace(/_count:\s*{\s*select:\s*{\s*subcategory:/g, '_count: {\n        select: {\n          Subcategory:');
  content = content.replace(/_count:\s*{\s*select:\s*{\s*assistanceRequest:/g, '_count: {\n        select: {\n          AssistanceRequest:');
  content = content.replace(/_count:\s*{\s*select:\s*{\s*professionalUserSubcategory:/g, '_count: {\n        select: {\n          ProfessionalUserSubcategory:');
  content = content.replace(/_count:\s*{\s*select:\s*{\s*depositRule:/g, '_count: {\n        select: {\n          DepositRule:');
  
  // Fix anche per accesso ai dati (già minuscolo)
  // Non serve fare nulla, l'accesso è già minuscolo
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

console.log('Conversione a minuscolo di tutti i file...\n');

const allFiles = findAllTsFiles('src');
let count = 0;

allFiles.forEach(filePath => {
  if (fixFile(filePath)) {
    console.log(`✅ ${path.basename(filePath)}`);
    count++;
  }
});

console.log(`\n✅ Totale file corretti: ${count}`);
SCRIPT

node /tmp/lowercase-all.js

# Cleanup
rm -f /tmp/lowercase-all.js

echo ""
echo "========================================="
echo "✅ CONVERSIONE COMPLETATA!"
echo ""
echo "Regole applicate:"
echo "- Include/select: tutto minuscolo (category, subcategory, etc.)"
echo "- _count: rimane maiuscolo (Subcategory, AssistanceRequest)"
echo "- Accesso dati: minuscolo (.category, .subcategory)"
echo ""
echo "⚠️  RIAVVIA IL BACKEND: Ctrl+C e npm run dev"
echo "========================================="
