#!/usr/bin/env node

/**
 * Script per sistemare gli errori TypeScript più comuni
 * Focus su errori facili da correggere automaticamente
 */

const fs = require('fs');
const path = require('path');

let totalFixes = 0;

// Fix 1: ResponseFormatter con numeri invece di stringhe
function fixResponseFormatterNumbers(content, filePath) {
  let modified = false;
  const patterns = [
    // ResponseFormatter.error con status code numerico
    { 
      regex: /ResponseFormatter\.error\(([^,]+),\s*(\d{3})\)/g,
      replacement: 'ResponseFormatter.error($1, \'$2\')'
    },
    // ResponseFormatter.success con status code numerico  
    {
      regex: /ResponseFormatter\.success\(([^,]+),\s*([^,]+),\s*(\d{3})\)/g,
      replacement: 'ResponseFormatter.success($1, $2, \'$3\')'
    }
  ];

  patterns.forEach(pattern => {
    if (pattern.regex.test(content)) {
      content = content.replace(pattern.regex, pattern.replacement);
      modified = true;
      totalFixes++;
    }
  });

  return { content, modified };
}

// Fix 2: Include names (subcategory -> Subcategory, user -> User)
function fixPrismaIncludes(content, filePath) {
  let modified = false;
  const includePatterns = [
    { old: 'subcategory:', new: 'Subcategory:' },
    { old: 'user:', new: 'User:' },
    { old: 'professional:', new: 'Professional:' },
    { old: 'client:', new: 'Client:' },
    { old: 'category:', new: 'Category:' },
    // Nelle include
    { old: 'include: {\n    subcategory:', new: 'include: {\n    Subcategory:' },
    { old: 'include: {\n      subcategory:', new: 'include: {\n      Subcategory:' },
    { old: 'include: {\n        subcategory:', new: 'include: {\n        Subcategory:' },
  ];

  includePatterns.forEach(pattern => {
    if (content.includes(pattern.old)) {
      content = content.replace(new RegExp(pattern.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), pattern.new);
      modified = true;
      totalFixes++;
    }
  });

  return { content, modified };
}

// Fix 3: Case sensitivity per status values
function fixStatusValues(content, filePath) {
  let modified = false;
  const statusPatterns = [
    // Status values
    { old: '"pending"', new: '"PENDING"' },
    { old: '"accepted"', new: '"ACCEPTED"' },
    { old: '"rejected"', new: '"REJECTED"' },
    { old: '"draft"', new: '"DRAFT"' },
    { old: '"expired"', new: '"EXPIRED"' },
    { old: '"assigned"', new: '"ASSIGNED"' },
    { old: '"completed"', new: '"COMPLETED"' },
    { old: '"in_progress"', new: '"IN_PROGRESS"' },
    // Priority values
    { old: '"high"', new: '"HIGH"' },
    { old: '"normal"', new: '"NORMAL"' },
    { old: '"low"', new: '"LOW"' },
    { old: '"urgent"', new: '"URGENT"' }
  ];

  // Solo in contesti di status/priority
  statusPatterns.forEach(pattern => {
    const regex = new RegExp(`(status|priority|Status|Priority)([:\\s=]+)${pattern.old}`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1$2${pattern.new}`);
      modified = true;
      totalFixes++;
    }
  });

  return { content, modified };
}

// Fix 4: Rimuovi import di file non esistenti
function fixMissingImports(content, filePath) {
  let modified = false;
  const linesToRemove = [
    "import phrasesRoutes from './phrases.routes'",
    "import materialsRoutes from './materials.routes'",
    "import templatesRoutes from './templates.routes'",
    "import settingsRoutes from './settings.routes'",
    "router.use('/phrases', phrasesRoutes)",
    "router.use('/materials', materialsRoutes)",
    "router.use('/templates', templatesRoutes)",
    "router.use('/settings', settingsRoutes)"
  ];

  linesToRemove.forEach(line => {
    if (content.includes(line)) {
      content = content.replace(line, `// ${line} // REMOVED - File doesn't exist`);
      modified = true;
      totalFixes++;
    }
  });

  return { content, modified };
}

// Processa un file
function processFile(filePath) {
  if (!filePath.endsWith('.ts') || filePath.includes('.backup') || filePath.includes('node_modules')) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Applica tutti i fix
  let result;
  
  result = fixResponseFormatterNumbers(content, filePath);
  if (result.modified) {
    content = result.content;
    modified = true;
  }

  result = fixPrismaIncludes(content, filePath);
  if (result.modified) {
    content = result.content;
    modified = true;
  }

  result = fixStatusValues(content, filePath);
  if (result.modified) {
    content = result.content;
    modified = true;
  }

  result = fixMissingImports(content, filePath);
  if (result.modified) {
    content = result.content;
    modified = true;
  }

  if (modified) {
    // Backup
    const backupPath = filePath + '.quickfix-' + Date.now();
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

console.log('🚀 Quick TypeScript fixes...\n');

// Processa routes e services
const dirs = [
  'src/routes',
  'src/services',
  'src/middleware',
  'src/websocket'
];

dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    console.log(`📁 Processing ${dir}...`);
    processDirectory(fullPath);
  }
});

console.log(`\n✅ Total fixes applied: ${totalFixes}`);
console.log('Run "npx tsc --noEmit" to check remaining errors.');
