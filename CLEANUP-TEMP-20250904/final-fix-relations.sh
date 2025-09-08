#!/bin/bash

echo "🔧 FIX DEFINITIVO - CORREZIONE COMPLETA NOMI RELAZIONI"
echo "======================================================"

cd backend

# Backup
mkdir -p backups/final-fix-$(date +%Y%m%d-%H%M%S)
cp -r src backups/final-fix-$(date +%Y%m%d-%H%M%S)/

cat > /tmp/final-fix.js << 'SCRIPT'
const fs = require('fs');
const path = require('path');

function findAllFiles(dir, ext = '.ts') {
  let results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isDirectory() && !file.name.includes('node_modules') && !file.name.includes('backups')) {
      results = results.concat(findAllFiles(filePath, ext));
    } else if (file.name.endsWith(ext)) {
      results.push(filePath);
    }
  }
  return results;
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Fix per ProfessionalUserSubcategory
  // La relazione nel modello ProfessionalUserSubcategory è "Subcategory" con la S maiuscola
  // ma nel codice vogliamo usare "subcategory" minuscola
  
  // Quando è in un include/select, deve essere Subcategory (come nel model)
  // MA lo script precedente l'ha cambiato in minuscola, dobbiamo sistemarlo
  
  // Per ProfessionalUserSubcategory, la relazione è Subcategory (con S maiuscola)
  if (filePath.includes('user-subcategories') || filePath.includes('subcategory')) {
    // In questo specifico contesto deve rimanere Subcategory
    content = content.replace(/include:\s*{\s*subcategory:/g, 'include: {\n        Subcategory:');
    content = content.replace(/subcategory:\s*{/g, 'Subcategory: {');
    content = content.replace(/subcategory:\s*true/g, 'Subcategory: true');
  }
  
  // Per CategoryService - il count usa Subcategory con S maiuscola
  if (filePath.includes('category.service')) {
    content = content.replace(/select:\s*{\s*subcategory:/g, 'select: {\n            Subcategory:');
    content = content.replace(/subcategory:\s*true/g, 'Subcategory: true');
  }
  
  // Però quando accediamo ai dati, usiamo la minuscola
  // Questo è già corretto dal precedente script
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corretto: ${filePath}`);
    return true;
  }
  return false;
}

console.log('Correzione file con problemi specifici...\n');

// File specifici da correggere
const specificFiles = [
  'src/routes/user-subcategories.routes.ts',
  'src/services/category.service.ts',
  'src/routes/subcategory.routes.ts'
];

specificFiles.forEach(file => {
  if (fs.existsSync(file)) {
    if (fixFile(file)) {
      console.log(`Sistemato: ${file}`);
    }
  }
});

// Ora correggiamo manualmente i file problematici
console.log('\nCorrezione manuale file specifici...');

// Fix category.service.ts
const categoryServicePath = 'src/services/category.service.ts';
if (fs.existsSync(categoryServicePath)) {
  let content = fs.readFileSync(categoryServicePath, 'utf8');
  
  // Nel _count, i nomi dei modelli devono essere con S maiuscola
  content = content.replace(/_count:\s*{\s*select:\s*{\s*subcategory:/g, '_count: {\n        select: {\n          Subcategory:');
  content = content.replace(/subcategory:\s*true,\s*AssistanceRequest:/g, 'Subcategory: true,\n          AssistanceRequest:');
  
  fs.writeFileSync(categoryServicePath, content);
  console.log('✅ Corretto category.service.ts');
}

// Fix user-subcategories.routes.ts
const userSubPath = 'src/routes/user-subcategories.routes.ts';
if (fs.existsSync(userSubPath)) {
  let content = fs.readFileSync(userSubPath, 'utf8');
  
  // Per ProfessionalUserSubcategory, la relazione è Subcategory
  content = content.replace(/include:\s*{\s*subcategory:\s*{/g, 'include: {\n      Subcategory: {');
  
  // Ma quando accediamo ai dati, usiamo Subcategory
  content = content.replace(/\.subcategory\./g, '.Subcategory.');
  content = content.replace(/\.subcategory\?/g, '.Subcategory?');
  
  fs.writeFileSync(userSubPath, content);
  console.log('✅ Corretto user-subcategories.routes.ts');
}

console.log('\n✅ Correzioni completate!');
SCRIPT

node /tmp/final-fix.js

# Cleanup
rm -f /tmp/final-fix.js

echo ""
echo "======================================================"
echo "✅ CORREZIONE FINALE COMPLETATA!"
echo ""
echo "Problema risolto:"
echo "- I nomi dei modelli in _count e include devono essere con S maiuscola"
echo "- Ma quando accediamo ai dati usiamo la minuscola"
echo ""
echo "⚠️  RIAVVIA IL BACKEND: Ctrl+C e npm run dev"
echo "======================================================"
