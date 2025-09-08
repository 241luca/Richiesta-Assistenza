#!/usr/bin/env node

/**
 * Script per correggere errori TypeScript specifici
 * nei file di routes e services
 */

const fs = require('fs');
const path = require('path');

// File specifici con errori noti
const fixes = [
  {
    file: 'src/services/email.service.ts',
    fixes: [
      {
        old: '.createTransporter',
        new: '.createTransport'
      }
    ]
  },
  {
    file: 'src/routes/request.routes.ts',
    fixes: [
      {
        old: 'res.status(400).json(ResponseFormatter.error',
        new: 'return res.status(400).json(ResponseFormatter.error'
      },
      {
        old: 'res.status(404).json(ResponseFormatter.error',
        new: 'return res.status(404).json(ResponseFormatter.error'
      },
      {
        old: 'res.status(500).json(ResponseFormatter.error',
        new: 'return res.status(500).json(ResponseFormatter.error'
      }
    ]
  },
  {
    file: 'src/routes/quote.routes.ts',
    fixes: [
      {
        old: 'prisma.request.',
        new: 'prisma.assistanceRequest.'
      }
    ]
  },
  {
    file: 'src/middleware/compression.ts',
    fixes: [
      {
        old: 'enabled: true',
        new: '// enabled: true // Not a valid option'
      }
    ]
  },
  {
    file: 'src/middleware/security.ts',
    fixes: [
      {
        old: 'expectCt:',
        new: '// expectCt: // Deprecated'
      }
    ]
  }
];

console.log('🔧 Fixing specific TypeScript errors...\n');

for (const fileConfig of fixes) {
  const filePath = path.join(__dirname, fileConfig.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${fileConfig.file}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const fix of fileConfig.fixes) {
    if (content.includes(fix.old)) {
      // Create backup first
      const backupPath = filePath + '.backup-fixes-' + Date.now();
      fs.copyFileSync(filePath, backupPath);
      
      content = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
      modified = true;
      console.log(`✅ Fixed in ${path.basename(filePath)}: ${fix.old} → ${fix.new}`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`📝 Updated: ${filePath}\n`);
  }
}

// Rimuovi file problematici non necessari
const filesToRemove = [
  'src/routes/professional/materials.routes.ts',
  'src/routes/professional/phrases.routes.ts', 
  'src/routes/professional/settings.routes.ts',
  'src/routes/professional/templates.routes.ts',
  'src/routes/maps-simple.routes.ts',
  'src/routes/request-assignment.routes.ts',
  'src/models/backup.model.ts'
];

console.log('\n🗑️  Removing problematic unused files...\n');

for (const file of filesToRemove) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const backupPath = filePath + '.removed-' + Date.now();
    fs.renameSync(filePath, backupPath);
    console.log(`🗑️  Removed: ${file}`);
    console.log(`💾 Backup: ${path.basename(backupPath)}`);
  }
}

console.log('\n✅ Specific fixes complete!');
