#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 AUTO-FIX: Express Route Parameters');
console.log('=====================================\n');

const DRY_RUN = process.argv.includes('--dry-run');
const BACKUP_DIR = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/.autofix-backups';
const SRC_DIR = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/backend/src';

let totalFiles = 0;
let totalFixes = 0;
let filesModified = 0;

if (!DRY_RUN && !fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Pattern per routes Express
const PATTERNS = [
  {
    name: 'Express route: (req, res)',
    regex: /\(req,\s*res\)\s*=>/g,
    replacement: '(req: any, res: any) =>',
    safe: true
  },
  {
    name: 'Express route: (req, res, next)',
    regex: /\(req,\s*res,\s*next\)\s*=>/g,
    replacement: '(req: any, res: any, next: any) =>',
    safe: true
  },
  {
    name: 'Express async route: async (req, res)',
    regex: /async\s+\(req,\s*res\)\s*=>/g,
    replacement: 'async (req: any, res: any) =>',
    safe: true
  },
  {
    name: 'Express async route: async (req, res, next)',
    regex: /async\s+\(req,\s*res,\s*next\)\s*=>/g,
    replacement: 'async (req: any, res: any, next: any) =>',
    safe: true
  }
];

function processFile(filePath) {
  // Solo processa file nelle routes o middleware
  const relativePath = path.relative(SRC_DIR, filePath);
  if (!relativePath.includes('routes') && !relativePath.includes('middleware')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content;
  let fileHasFixes = false;
  const fixesInFile = [];

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
    
    console.log(`\n📝 ${relativePath}`);
    fixesInFile.forEach(fix => {
      console.log(`   ✅ ${fix.pattern}: ${fix.count} fix`);
    });

    if (!DRY_RUN) {
      const backupPath = path.join(
        BACKUP_DIR,
        relativePath + `.backup-${Date.now()}`
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
console.log('🔧 Processing routes and middleware...');

allFiles.forEach(processFile);

console.log('\n');
console.log('📊 SUMMARY');
console.log('==========');
console.log(`Files scanned: ${totalFiles}`);
console.log(`Files modified: ${filesModified}`);
console.log(`Total fixes applied: ${totalFixes}`);

if (DRY_RUN) {
  console.log('\n⚠️  DRY-RUN MODE');
  console.log('💡 Run: node scripts/autofix-express-params.cjs');
} else {
  console.log(`\n✅ Done! Backups in: ${BACKUP_DIR}`);
}

process.exit(0);
