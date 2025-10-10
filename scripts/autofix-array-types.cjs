#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 AUTO-FIX: Typed Empty Arrays');
console.log('=================================\n');

const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP_DIR = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.autofix-backups';
const SRC_DIR = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src';

let totalFiles = 0;
let totalFixes = 0;
let filesModified = 0;

if (!DRY_RUN && !fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Pattern sicuri per array con nomi comuni
const ARRAY_PATTERNS = [
  // Arrays con nomi che indicano il tipo
  { regex: /const\s+results\s*=\s*\[\]/g, replacement: 'const results: any[] = []', name: 'results array' },
  { regex: /const\s+errors\s*=\s*\[\]/g, replacement: 'const errors: string[] = []', name: 'errors array' },
  { regex: /const\s+items\s*=\s*\[\]/g, replacement: 'const items: any[] = []', name: 'items array' },
  { regex: /const\s+data\s*=\s*\[\]/g, replacement: 'const data: any[] = []', name: 'data array' },
  { regex: /const\s+list\s*=\s*\[\]/g, replacement: 'const list: any[] = []', name: 'list array' },
  { regex: /const\s+messages\s*=\s*\[\]/g, replacement: 'const messages: string[] = []', name: 'messages array' },
  { regex: /const\s+ids\s*=\s*\[\]/g, replacement: 'const ids: string[] = []', name: 'ids array' },
  { regex: /const\s+files\s*=\s*\[\]/g, replacement: 'const files: string[] = []', name: 'files array' },
  { regex: /const\s+paths\s*=\s*\[\]/g, replacement: 'const paths: string[] = []', name: 'paths array' },
];

function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileHasFixes = false;
  const fixesInFile = [];

  ARRAY_PATTERNS.forEach(pattern => {
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
      const backupPath = path.join(
        BACKUP_DIR,
        path.relative(SRC_DIR, filePath) + `.backup-${Date.now()}`
      );
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.writeFileSync(backupPath, content);
      fs.writeFileSync(filePath, newContent);
    }
  }
}

function findFiles(dir) {
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        scanDir(fullPath);
      } else if (stat.isFile() && item.endsWith('.ts')) {
        files.push(fullPath);
      }
    });
  }
  
  scanDir(dir);
  return files;
}

console.log(`📂 Directory: ${SRC_DIR}`);
console.log(`🔍 Mode: ${DRY_RUN ? 'DRY-RUN' : 'APPLY FIXES'}\n`);

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
  console.log('\n⚠️  DRY-RUN MODE');
  console.log('💡 Run: node scripts/autofix-array-types.cjs');
} else {
  console.log(`\n✅ Done! Backups in: ${BACKUP_DIR}`);
}

process.exit(0);
