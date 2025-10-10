#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 AUTO-FIX: Catch Blocks with TypeScript');
console.log('=========================================\n');

// Configurazione
const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP_DIR = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.autofix-backups';
const SRC_DIR = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src';

let totalFiles = 0;
let totalFixes = 0;
let filesModified = 0;

// Crea directory backup
if (!DRY_RUN && !fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Pattern da fixare
const PATTERNS = [
  {
    name: 'Catch block - error parameter',
    regex: /catch\s*\(\s*error\s*\)/g,
    replacement: 'catch (error: unknown)',
    safe: true
  },
  {
    name: 'Catch block - err parameter',
    regex: /catch\s*\(\s*err\s*\)/g,
    replacement: 'catch (err: unknown)',
    safe: true
  },
  {
    name: 'Catch block - e parameter',
    regex: /catch\s*\(\s*e\s*\)\s*{/g,
    replacement: 'catch (e: unknown) {',
    safe: true
  }
];

// Funzione per processare un file
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileHasFixes = false;
  const fixesInFile = [];

  // Applica ogni pattern
  PATTERNS.forEach(pattern => {
    const matches = content.match(pattern.regex);
    if (matches) {
      newContent = newContent.replace(pattern.regex, pattern.replacement);
      fileHasFixes = true;
      fixesInFile.push({
        pattern: pattern.name,
        count: matches.length
      });
      totalFixes += matches.length;
    }
  });

  if (fileHasFixes) {
    filesModified++;
    
    console.log(`\n📝 ${path.relative(SRC_DIR, filePath)}`);
    fixesInFile.forEach(fix => {
      console.log(`   ✅ ${fix.pattern}: ${fix.count} fix`);
    });

    if (!DRY_RUN) {
      // Crea backup
      const backupPath = path.join(
        BACKUP_DIR,
        path.relative(SRC_DIR, filePath) + `.backup-${Date.now()}`
      );
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.writeFileSync(backupPath, content);

      // Scrivi nuova versione
      fs.writeFileSync(filePath, newContent);
    }
  }
}

// Funzione per cercare file ricorsivamente
function findFiles(dir, extension = '.ts') {
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDir(fullPath);
      } else if (stat.isFile() && item.endsWith(extension)) {
        files.push(fullPath);
      }
    });
  }
  
  scanDir(dir);
  return files;
}

// Main
console.log(`📂 Directory: ${SRC_DIR}`);
console.log(`🔍 Mode: ${DRY_RUN ? 'DRY-RUN (no changes)' : 'APPLY FIXES'}\n`);

if (!DRY_RUN) {
  console.log(`💾 Backup directory: ${BACKUP_DIR}\n`);
}

console.log('🔍 Scanning files...\n');

const allFiles = findFiles(SRC_DIR);
totalFiles = allFiles.length;

console.log(`📊 Found ${totalFiles} TypeScript files\n`);
console.log('🔧 Processing...');

allFiles.forEach(processFile);

console.log('\n');
console.log('📊 SUMMARY');
console.log('==========');
console.log(`Files scanned: ${totalFiles}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total fixes applied: ${totalFixes}`);

if (DRY_RUN) {
  console.log('\n⚠️  DRY-RUN MODE: No files were modified');
  console.log('💡 Run without --dry-run to apply changes:');
  console.log('   node scripts/autofix-catch-blocks.cjs');
} else {
  console.log(`\n✅ Fixes applied! Backups saved in:`);
  console.log(`   ${BACKUP_DIR}`);
  console.log('\n💡 Next steps:');
  console.log('   1. Run: cd backend && npx tsc --noEmit');
  console.log('   2. Check: ./scripts/ts-progress.sh');
  console.log('   3. Test: npm test');
}

process.exit(0);
