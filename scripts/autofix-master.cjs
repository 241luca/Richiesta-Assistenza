#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const readline = require('readline');

console.log('╔════════════════════════════════════════════════╗');
console.log('║   🤖 MASTER AUTO-FIX - TypeScript Strict      ║');
console.log('╚════════════════════════════════════════════════╝');
console.log();

const DRY_RUN = process.argv.includes('--dry-run');
const SCRIPT_DIR = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/scripts';

console.log(`🔧 Mode: ${DRY_RUN ? '🔍 DRY-RUN (Preview Only)' : '✅ APPLY FIXES'}`);
console.log();

async function main() {
  if (DRY_RUN) {
    console.log('⚠️  DRY-RUN MODE - No files will be modified');
    console.log('💡 This will show you what WOULD be changed\n');
  } else {
    console.log('⚠️  LIVE MODE - Files will be modified');
    console.log('💾 Automatic backups will be created\n');
    
    // Conferma dall'utente
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise(resolve => {
      rl.question('Continue? (yes/no): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('\n❌ Aborted by user');
      process.exit(0);
    }
    
    console.log();
  }

  // Script da eseguire in ordine
  const AUTO_FIX_SCRIPTS = [
    {
      name: 'Catch Blocks (error: unknown)',
      script: 'autofix-catch-blocks.cjs',
      estimatedFixes: '40-60',
      risk: 'SAFE ✅'
    },
    {
      name: 'Express Parameters (req, res, next)',
      script: 'autofix-express-params.cjs',
      estimatedFixes: '20-40',
      risk: 'SAFE ✅'
    },
    {
      name: 'Typed Empty Arrays',
      script: 'autofix-array-types.cjs',
      estimatedFixes: '30-50',
      risk: 'SAFE ✅'
    }
  ];

  console.log('📋 Auto-Fix Scripts to Run:');
  console.log('============================\n');

  AUTO_FIX_SCRIPTS.forEach((script, index) => {
    console.log(`${index + 1}. ${script.name}`);
    console.log(`   Estimated fixes: ${script.estimatedFixes}`);
    console.log(`   Risk level: ${script.risk}`);
    console.log();
  });

  console.log('🚀 Starting Auto-Fix Process...\n');
  console.log('═'.repeat(50));
  console.log();

  let totalFixesApplied = 0;
  const results = [];

  // Conta errori PRIMA degli auto-fix
  console.log('📊 Counting TypeScript errors BEFORE auto-fix...');
  try {
    const errorsBefore = execSync(
      'cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l',
      { encoding: 'utf-8' }
    ).trim();
    console.log(`   Initial errors: ${errorsBefore}\n`);
  } catch (e) {
    console.log('   (Could not count - continuing anyway)\n');
  }

  // Esegui ogni script
  for (let index = 0; index < AUTO_FIX_SCRIPTS.length; index++) {
    const scriptInfo = AUTO_FIX_SCRIPTS[index];
    
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`📦 STEP ${index + 1}/${AUTO_FIX_SCRIPTS.length}: ${scriptInfo.name}`);
    console.log('═'.repeat(50));
    console.log();

    try {
      const scriptPath = `${SCRIPT_DIR}/${scriptInfo.script}`;
      const dryRunFlag = DRY_RUN ? '--dry-run' : '';
      
      const output = execSync(
        `node ${scriptPath} ${dryRunFlag}`,
        { encoding: 'utf-8' }
      );
      
      console.log(output);
      
      // Parse output per contare fix
      const fixMatch = output.match(/Total fixes applied: (\d+)/);
      const fixes = fixMatch ? parseInt(fixMatch[1]) : 0;
      totalFixesApplied += fixes;
      
      results.push({
        name: scriptInfo.name,
        fixes: fixes,
        success: true
      });
      
    } catch (error) {
      console.log(`❌ Error running ${scriptInfo.name}`);
      console.log(error.message);
      
      results.push({
        name: scriptInfo.name,
        fixes: 0,
        success: false,
        error: error.message
      });
    }
  }

  // Conta errori DOPO gli auto-fix (solo se non dry-run)
  if (!DRY_RUN) {
    console.log('\n📊 Counting TypeScript errors AFTER auto-fix...');
    try {
      const errorsAfter = execSync(
        'cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l',
        { encoding: 'utf-8' }
      ).trim();
      console.log(`   Final errors: ${errorsAfter}\n`);
    } catch (e) {
      console.log('   (Could not count)\n');
    }
  }

  // Report finale
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║           📊 FINAL SUMMARY REPORT              ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log();

  console.log('📋 Results by Script:');
  console.log('━'.repeat(50));
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}: ${result.fixes} fixes`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log();
  console.log('📊 Statistics:');
  console.log('━'.repeat(50));
  console.log(`Total fixes: ${totalFixesApplied}`);
  console.log(`Scripts run: ${results.filter(r => r.success).length}/${results.length}`);

  console.log();

  if (DRY_RUN) {
    console.log('⚠️  DRY-RUN MODE - No changes were made');
    console.log();
    console.log('💡 To apply these fixes, run:');
    console.log('   node scripts/autofix-master.cjs');
    console.log();
  } else {
    console.log('✅ Auto-fix completed successfully!');
    console.log();
    console.log('📂 Backups saved in:');
    console.log('   backend/.autofix-backups/');
    console.log();
    console.log('🔍 Next steps:');
    console.log('   1. Review changes: git diff');
    console.log('   2. Test backend: cd backend && npm test');
    console.log('   3. Check progress: ./scripts/ts-progress.sh');
    console.log('   4. Commit: git add . && git commit -m "Auto-fix TypeScript errors"');
    console.log();
  }

  console.log('═'.repeat(50));
  console.log();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
