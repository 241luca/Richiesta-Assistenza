#!/bin/bash

echo "🔧 FIX COMPLETO DI TUTTI I FILE CON RELAZIONI ERRATE"
echo "===================================================="

cd backend

# Crea backup di tutti i file che verranno modificati
mkdir -p backups/$(date +%Y%m%d-%H%M%S)
cp -r src/routes backups/$(date +%Y%m%d-%H%M%S)/

echo "📁 Backup creato in backups/$(date +%Y%m%d-%H%M%S)/"
echo ""

# Script Node.js per correggere TUTTI i file
cat > /tmp/fix-all-relations.js << 'SCRIPT'
const fs = require('fs');
const path = require('path');

// Lista di tutti i file da controllare e correggere
const filesToFix = [
  'src/routes/request.routes.ts',
  'src/routes/dashboard/user-dashboard.routes.ts',
  'src/routes/quote.routes.ts',
  'src/routes/admin.routes.ts',
  'src/routes/payment.routes.ts',
  'src/routes/notification.routes.ts',
  'src/routes/chat.routes.ts'
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File non trovato: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Fix include statements
  content = content.replace(/client:\s*true/g, 'User_AssistanceRequest_clientIdToUser: true');
  content = content.replace(/professional:\s*true/g, 'User_AssistanceRequest_professionalIdToUser: true');
  content = content.replace(/category:\s*true/g, 'Category: true');
  content = content.replace(/subcategory:\s*true/g, 'Subcategory: true');
  content = content.replace(/quotes:\s*true/g, 'Quote: true');
  content = content.replace(/attachments:\s*true/g, 'RequestAttachment: true');

  // 2. Fix include con select/include annidati
  content = content.replace(/client:\s*{/g, 'User_AssistanceRequest_clientIdToUser: {');
  content = content.replace(/professional:\s*{/g, 'User_AssistanceRequest_professionalIdToUser: {');
  content = content.replace(/category:\s*{/g, 'Category: {');
  content = content.replace(/subcategory:\s*{/g, 'Subcategory: {');
  content = content.replace(/quotes:\s*{/g, 'Quote: {');
  content = content.replace(/attachments:\s*{/g, 'RequestAttachment: {');

  // 3. Fix accesso ai dati (più complesso, serve regex più specifico)
  // Per .client
  content = content.replace(/(\w+)\.client\?/g, '$1.User_AssistanceRequest_clientIdToUser?');
  content = content.replace(/(\w+)\.client\s+&&/g, '$1.User_AssistanceRequest_clientIdToUser &&');
  content = content.replace(/(\w+)\.client\s+\?/g, '$1.User_AssistanceRequest_clientIdToUser ?');
  content = content.replace(/(\w+)\.client\./g, '$1.User_AssistanceRequest_clientIdToUser.');
  content = content.replace(/(\w+)\.client\s*\|\|/g, '$1.User_AssistanceRequest_clientIdToUser ||');
  content = content.replace(/(\w+)\.client;/g, '$1.User_AssistanceRequest_clientIdToUser;');
  content = content.replace(/(\w+)\.client,/g, '$1.User_AssistanceRequest_clientIdToUser,');
  content = content.replace(/(\w+)\.client\)/g, '$1.User_AssistanceRequest_clientIdToUser)');

  // Per .professional
  content = content.replace(/(\w+)\.professional\?/g, '$1.User_AssistanceRequest_professionalIdToUser?');
  content = content.replace(/(\w+)\.professional\s+&&/g, '$1.User_AssistanceRequest_professionalIdToUser &&');
  content = content.replace(/(\w+)\.professional\s+\?/g, '$1.User_AssistanceRequest_professionalIdToUser ?');
  content = content.replace(/(\w+)\.professional\./g, '$1.User_AssistanceRequest_professionalIdToUser.');
  content = content.replace(/(\w+)\.professional\s*\|\|/g, '$1.User_AssistanceRequest_professionalIdToUser ||');
  content = content.replace(/(\w+)\.professional;/g, '$1.User_AssistanceRequest_professionalIdToUser;');
  content = content.replace(/(\w+)\.professional,/g, '$1.User_AssistanceRequest_professionalIdToUser,');
  content = content.replace(/(\w+)\.professional\)/g, '$1.User_AssistanceRequest_professionalIdToUser)');

  // Per .category
  content = content.replace(/(\w+)\.category\?/g, '$1.Category?');
  content = content.replace(/(\w+)\.category\./g, '$1.Category.');
  content = content.replace(/(\w+)\.category\s*\|\|/g, '$1.Category ||');
  content = content.replace(/(\w+)\.category;/g, '$1.Category;');
  content = content.replace(/(\w+)\.category,/g, '$1.Category,');
  content = content.replace(/(\w+)\.category\)/g, '$1.Category)');

  // Per .subcategory
  content = content.replace(/(\w+)\.subcategory\?/g, '$1.Subcategory?');
  content = content.replace(/(\w+)\.subcategory\./g, '$1.Subcategory.');

  // Per .quotes
  content = content.replace(/(\w+)\.quotes\?/g, '$1.Quote?');
  content = content.replace(/(\w+)\.quotes\./g, '$1.Quote.');
  content = content.replace(/(\w+)\.quotes\s/g, '$1.Quote ');

  // Per .attachments
  content = content.replace(/(\w+)\.attachments\?/g, '$1.RequestAttachment?');
  content = content.replace(/(\w+)\.attachments\./g, '$1.RequestAttachment.');
  content = content.replace(/(\w+)\.attachments\s/g, '$1.RequestAttachment ');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Corretto: ${filePath}`);
  } else {
    console.log(`⏭️  Nessuna modifica: ${filePath}`);
  }
}

console.log('Inizio correzione file...\n');

filesToFix.forEach(file => {
  fixFile(file);
});

// Cerca altri file che potrebbero avere lo stesso problema
const routesDir = 'src/routes';
const allFiles = fs.readdirSync(routesDir, { recursive: true })
  .filter(file => file.endsWith('.ts'))
  .map(file => path.join(routesDir, file));

console.log('\n🔍 Cerco altri file con potenziali problemi...\n');

allFiles.forEach(filePath => {
  if (!filesToFix.includes(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('client:') || content.includes('professional:') || 
        content.includes('category:') || content.includes('.client') || 
        content.includes('.professional')) {
      console.log(`⚠️  Potenziale problema in: ${filePath}`);
      fixFile(filePath);
    }
  }
});

console.log('\n✅ CORREZIONE COMPLETATA!');
SCRIPT

node /tmp/fix-all-relations.js

echo ""
echo "===================================================="
echo "✅ TUTTI I FILE SONO STATI CORRETTI!"
echo ""
echo "⚠️  IMPORTANTE: RIAVVIA IL BACKEND con:"
echo "   Ctrl+C e poi npm run dev"
echo ""
echo "📝 Per prevenire questo problema in futuro:"
echo "   Dopo ogni 'npx prisma db pull', controlla sempre"
echo "   i nomi delle relazioni nel file schema.prisma"
echo "===================================================="

# Cleanup
rm -f /tmp/fix-all-relations.js
