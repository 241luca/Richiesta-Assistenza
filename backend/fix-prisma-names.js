#!/usr/bin/env node

/**
 * Script per correggere i nomi dei modelli Prisma
 * Da PascalCase a camelCase come richiesto dalla nuova versione
 */

const fs = require('fs');
const path = require('path');

// Mappatura dei nomi da correggere
const replacements = {
  // Modelli principali
  'prisma.Category': 'prisma.category',
  'prisma.Subcategory': 'prisma.subcategory',
  'prisma.SubcategoryAiSettings': 'prisma.subcategoryAiSettings',
  'prisma.systemSettings': 'prisma.systemSetting',
  'prisma.professionalPhrase': 'prisma.professionalReportPhrase',
  'prisma.aiConversationLog': 'prisma.aiConversation',
  
  // Include/Select
  'Category:': 'category:',
  'Subcategory:': 'subcategory:',
  'User_AssistanceRequest_clientIdToUser': 'client',
  'User_AssistanceRequest_professionalIdToUser': 'professional',
  'User_AssistanceRequest_clientIdTouser': 'client',
  'User_AssistanceRequest_professionalIdTouser': 'professional',
  
  // Property access
  '.Category': '.category',
  '.Subcategory': '.subcategory',
  '.SubcategoryAiSettings': '.subcategoryAiSettings',
  '.AssistanceRequest': '.assistanceRequest',
  
  // Campi rinominati
  'assignedDate': 'assignedAt',
  'notificationPreference:': 'NotificationPreference:',
  
  // Status values (lowercase to uppercase)
  'status: "pending"': 'status: "PENDING"',
  'status: "accepted"': 'status: "ACCEPTED"',
  'status: "rejected"': 'status: "REJECTED"',
  'status: "draft"': 'status: "DRAFT"',
  'status: "expired"': 'status: "EXPIRED"',
  'status: "assigned"': 'status: "ASSIGNED"',
  
  // Priority values
  'priority: "high"': 'priority: "HIGH"',
  'priority: "normal"': 'priority: "NORMAL"',
  'priority: "low"': 'priority: "LOW"',
  'priority: "urgent"': 'priority: "URGENT"'
};

// Directory da processare
const routesDir = path.join(__dirname, 'src/routes');
const servicesDir = path.join(__dirname, 'src/services');

function processFile(filePath) {
  if (!filePath.endsWith('.ts') || filePath.includes('.backup')) {
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const [oldText, newText] of Object.entries(replacements)) {
    if (content.includes(oldText)) {
      content = content.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newText);
      modified = true;
      console.log(`✅ Fixed: ${oldText} → ${newText} in ${path.basename(filePath)}`);
    }
  }
  
  if (modified) {
    // Backup del file originale
    const backupPath = filePath + '.backup-' + Date.now();
    fs.copyFileSync(filePath, backupPath);
    
    // Scrivi il file corretto
    fs.writeFileSync(filePath, content);
    console.log(`📝 Updated: ${filePath}`);
    console.log(`💾 Backup: ${backupPath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      processDirectory(filePath);
    } else if (stat.isFile()) {
      processFile(filePath);
    }
  }
}

console.log('🔧 Fixing Prisma model names...\n');

// Processa routes e services
if (fs.existsSync(routesDir)) {
  console.log('📁 Processing routes...');
  processDirectory(routesDir);
}

if (fs.existsSync(servicesDir)) {
  console.log('📁 Processing services...');
  processDirectory(servicesDir);
}

console.log('\n✅ Done! Run "npx tsc --noEmit" to check remaining errors.');
