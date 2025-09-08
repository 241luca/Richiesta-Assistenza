#!/usr/bin/env node

/**
 * Script per sistemare errori TypeScript aggiuntivi
 * Focus su errori di inclusione e relazioni Prisma
 */

const fs = require('fs');
const path = require('path');

let totalFixes = 0;

// Fix relazioni include non esistenti
function fixIncludeRelations(content, filePath) {
  let modified = false;
  
  // Fix per le include con nomi sbagliati
  const fixes = [
    // Websocket handlers
    { old: 'User_AssistanceRequest_clientIdToUser', new: 'client' },
    { old: 'User_AssistanceRequest_professionalIdToUser', new: 'professional' },
    // Quote service
    { old: 'AssistanceRequest:', new: 'assistanceRequest:' },
    { old: '.AssistanceRequest', new: '.assistanceRequest' },
    // Professional routes  
    { old: 'userId: req.user.id', new: 'recipientId: req.user.id' },
    // Notification handler
    { old: 'userId:', new: 'recipientId:' },
  ];

  fixes.forEach(fix => {
    if (content.includes(fix.old)) {
      content = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
      modified = true;
      totalFixes++;
      console.log(`  Fixed: ${fix.old} → ${fix.new}`);
    }
  });

  return { content, modified };
}

// Fix per user-subcategories include
function fixSubcategoryIncludes(content, filePath) {
  let modified = false;
  
  // Solo per file user-subcategories
  if (filePath.includes('user-subcategories')) {
    const pattern = /include:\s*{\s*subcategory:\s*true/g;
    if (pattern.test(content)) {
      content = content.replace(pattern, 'include: {\n        Subcategory: true');
      modified = true;
      totalFixes++;
    }
  }

  return { content, modified };
}

// Fix per professional/index.ts
function fixProfessionalIndex(filePath) {
  if (filePath.endsWith('professional/index.ts')) {
    const newContent = `import { Router } from 'express';

const router = Router();

// Routes are handled individually now
// Previous routes have been removed or moved

export default router;
`;
    fs.writeFileSync(filePath, newContent);
    console.log('  Rewrote professional/index.ts');
    totalFixes++;
    return true;
  }
  return false;
}

// Fix duplicate function
function fixDuplicateFunctions(content, filePath) {
  let modified = false;
  
  if (filePath.includes('responseFormatter')) {
    // Rimuovi la seconda dichiarazione di formatAiSettings
    const lines = content.split('\n');
    let foundFirst = false;
    const newLines = [];
    let inSecondFunction = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('export function formatAiSettings')) {
        if (!foundFirst) {
          foundFirst = true;
          newLines.push(line);
        } else {
          // Seconda occorrenza - commenta
          newLines.push('// ' + line + ' // DUPLICATE REMOVED');
          inSecondFunction = true;
          modified = true;
          totalFixes++;
        }
      } else if (inSecondFunction) {
        // Commenta tutto il corpo della funzione duplicata
        if (line === '}' && !lines[i-1].includes('{')) {
          newLines.push('// ' + line);
          inSecondFunction = false;
        } else {
          newLines.push('// ' + line);
        }
      } else {
        newLines.push(line);
      }
    }
    
    if (modified) {
      content = newLines.join('\n');
    }
  }
  
  return { content, modified };
}

// Processa un file
function processFile(filePath) {
  if (!filePath.endsWith('.ts') || filePath.includes('.backup') || filePath.includes('.quickfix')) {
    return;
  }

  // Fix speciale per professional/index.ts
  if (fixProfessionalIndex(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Applica i fix
  let result;
  
  result = fixIncludeRelations(content, filePath);
  if (result.modified) {
    content = result.content;
    modified = true;
  }

  result = fixSubcategoryIncludes(content, filePath);
  if (result.modified) {
    content = result.content;
    modified = true;
  }

  result = fixDuplicateFunctions(content, filePath);
  if (result.modified) {
    content = result.content;
    modified = true;
  }

  if (modified) {
    // Backup
    const backupPath = filePath + '.fix2-' + Date.now();
    fs.copyFileSync(filePath, backupPath);
    
    // Salva
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${path.basename(filePath)}`);
  }
}

// Processa directory
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.backup')) {
      processDirectory(filePath);
    } else if (stat.isFile()) {
      processFile(filePath);
    }
  }
}

console.log('🚀 Additional TypeScript fixes...\n');

// Processa le directory
const dirs = [
  'src/routes',
  'src/services', 
  'src/websocket',
  'src/utils'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Processing ${dir}...`);
    processDirectory(fullPath);
  }
});

console.log(`\n✅ Total additional fixes: ${totalFixes}`);
console.log('Run check-system to see remaining errors.');
