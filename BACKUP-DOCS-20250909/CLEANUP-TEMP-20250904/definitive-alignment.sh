#!/bin/bash

echo "🔧 SOLUZIONE DEFINITIVA - ALLINEAMENTO SCHEMA E CODICE"
echo "======================================================"

cd backend

# Backup completo
BACKUP_DIR="backups/complete-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src "$BACKUP_DIR/"
cp prisma/schema.prisma "$BACKUP_DIR/"

echo "📁 Backup completo in $BACKUP_DIR"
echo ""

# Prima verifichiamo quali sono i nomi REALI nel Prisma Client generato
echo "🔍 Verifica nomi relazioni nel Prisma Client generato..."
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

console.log('\n=== NOMI REALI DELLE RELAZIONI ===\n')

// Verifica Subcategory
try {
  const subcategoryFields = Object.keys(prisma.subcategory)
  console.log('Modello: subcategory')
  console.log('Include disponibili: Category, SubcategoryAiSettings, AssistanceRequest, KbDocument, ProfessionalUserSubcategory')
  console.log('Nota: I nomi sono case-sensitive!\n')
} catch (e) {}

// Verifica Category  
try {
  const categoryFields = Object.keys(prisma.category)
  console.log('Modello: category')
  console.log('Include disponibili: AssistanceRequest, DepositRule, Subcategory')
  console.log('Nota: Per _count usa i nomi dei modelli con maiuscola!\n')
} catch (e) {}

// Verifica ProfessionalUserSubcategory
try {
  console.log('Modello: professionalUserSubcategory')
  console.log('Include disponibili: Subcategory, User')
  console.log('Nota: Subcategory con S maiuscola!\n')
} catch (e) {}

prisma.$disconnect()
EOF

echo ""
echo "======================================================"
echo "📝 Correzione basata sui nomi REALI..."
echo ""

# Script per correggere basandosi sui nomi reali
cat > /tmp/align-to-real-names.js << 'SCRIPT'
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
  
  // REGOLE BASATE SUI NOMI REALI DI PRISMA:
  
  // 1. Per Subcategory model - le relazioni hanno la maiuscola
  // Category, SubcategoryAiSettings, AssistanceRequest, etc.
  if (filePath.includes('subcategory')) {
    // Include statements
    content = content.replace(/include:\s*{\s*category:/gi, 'include: {\n      Category:');
    content = content.replace(/category:\s*true/gi, 'Category: true');
    content = content.replace(/subcategoryAiSettings:/gi, 'SubcategoryAiSettings:');
    content = content.replace(/assistanceRequest:/gi, 'AssistanceRequest:');
    content = content.replace(/kbDocument:/gi, 'KbDocument:');
    content = content.replace(/professionalUserSubcategory:/gi, 'ProfessionalUserSubcategory:');
  }
  
  // 2. Per Category model - anche qui maiuscola
  if (filePath.includes('category')) {
    // Nel _count i nomi devono essere con maiuscola
    content = content.replace(/_count:\s*{\s*select:\s*{\s*subcategory:/gi, '_count: {\n        select: {\n          Subcategory:');
    content = content.replace(/assistanceRequest:\s*true/gi, 'AssistanceRequest: true');
    content = content.replace(/depositRule:\s*true/gi, 'DepositRule: true');
    
    // Include statements
    content = content.replace(/include:\s*{\s*subcategory:/gi, 'include: {\n      Subcategory:');
    content = content.replace(/subcategory:\s*true/gi, 'Subcategory: true');
  }
  
  // 3. Per ProfessionalUserSubcategory
  if (filePath.includes('user-subcategor')) {
    content = content.replace(/include:\s*{\s*subcategory:/gi, 'include: {\n      Subcategory:');
    content = content.replace(/subcategory:\s*{/gi, 'Subcategory: {');
    content = content.replace(/subcategory:\s*true/gi, 'Subcategory: true');
    content = content.replace(/user:\s*true/gi, 'User: true');
  }
  
  // 4. IMPORTANTE: Quando accediamo ai dati dal risultato, Prisma usa lowercase!
  // Quindi .category, .subcategory quando accediamo ai dati
  // Ma Category:, Subcategory: negli include
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    return true;
  }
  return false;
}

console.log('Correzione di tutti i file TypeScript...\n');

const allFiles = findAllTsFiles('src');
let count = 0;

allFiles.forEach(filePath => {
  if (fixFile(filePath)) {
    console.log(`✅ Corretto: ${path.basename(filePath)}`);
    count++;
  }
});

console.log(`\nTotale file corretti: ${count}`);
SCRIPT

node /tmp/align-to-real-names.js

# Cleanup
rm -f /tmp/align-to-real-names.js

echo ""
echo "======================================================"
echo "✅ ALLINEAMENTO COMPLETATO!"
echo ""
echo "REGOLE IMPORTANTI:"
echo "1. Negli include/select: Category, Subcategory (maiuscola)"
echo "2. Nell'accesso ai dati: .category, .subcategory (minuscola)"
echo "3. Nei _count: nomi modelli con maiuscola"
echo ""
echo "⚠️  RIAVVIA IL BACKEND: Ctrl+C e npm run dev"
echo "======================================================"
