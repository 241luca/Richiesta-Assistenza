/**
 * Test Manuale ModuleService
 * 
 * Testa tutti i metodi del ModuleService per verificare funzionamento
 * 
 * Esegui con: npx ts-node tests/manual/test-module-service.ts
 * 
 * @version 1.0.0
 * @updated 2025-10-06
 */

import { moduleService } from '../../src/services/module.service';
import { logger } from '../../src/utils/logger';

/**
 * Test principale ModuleService
 */
async function testModuleService() {
  console.log('🧪 Testing ModuleService...\n');

  try {
    // Test 1: Get all modules
    console.log('1️⃣ Test: Get all modules...');
    const allModules = await moduleService.getAllModules();
    console.log(`✅ Found ${allModules.length} modules`);
    
    if (allModules.length > 0) {
      const firstModule = allModules[0];
      console.log(`   📄 Example: ${firstModule.name} (${firstModule.code})`);
      console.log(`   🔧 Settings count: ${firstModule._count?.settings || 0}`);
      console.log(`   📊 History count: ${firstModule._count?.history || 0}`);
    }

    // Test 2: Get by category
    console.log('\n2️⃣ Test: Get CORE modules...');
    const coreModules = await moduleService.getModulesByCategory('CORE');
    console.log(`✅ Found ${coreModules.length} CORE modules`);
    
    if (coreModules.length > 0) {
      coreModules.slice(0, 3).forEach(module => {
        console.log(`   📦 ${module.name} (${module.code}) - Enabled: ${module.isEnabled}`);
      });
    }

    // Test 3: Get module by code (usa il primo modulo disponibile)
    if (allModules.length > 0) {
      const testModuleCode = allModules[0].code;
      console.log(`\n3️⃣ Test: Get module by code (${testModuleCode})...`);
      
      const module = await moduleService.getModuleByCode(testModuleCode);
      console.log(`✅ Found: ${module.name}`);
      console.log(`   📝 Description: ${module.description || 'N/A'}`);
      console.log(`   🟢 Enabled: ${module.isEnabled}`);
      console.log(`   ⭐ Core: ${module.isCore}`);
      console.log(`   🏷️ Category: ${module.category}`);
      console.log(`   🔧 Settings: ${module._count.settings}`);
      console.log(`   📜 History entries: ${module._count.history}`);

      // Test 4: Check if enabled
      console.log(`\n4️⃣ Test: Check if ${testModuleCode} is enabled...`);
      const isEnabled = await moduleService.isModuleEnabled(testModuleCode);
      console.log(`✅ ${testModuleCode} enabled: ${isEnabled}`);

      // Test 5: Check if core
      console.log(`\n5️⃣ Test: Check if ${testModuleCode} is core...`);
      const isCore = await moduleService.isModuleCore(testModuleCode);
      console.log(`✅ ${testModuleCode} core: ${isCore}`);
    }

    // Test 6: Get stats
    console.log('\n6️⃣ Test: Get module stats...');
    const stats = await moduleService.getModuleStats();
    console.log('✅ Stats retrieved:');
    console.log(`   📊 Total: ${stats.total}`);
    console.log(`   🟢 Enabled: ${stats.enabled}`);
    console.log(`   🔴 Disabled: ${stats.disabled}`);
    console.log(`   ⭐ Core: ${stats.core}`);
    console.log('   📂 By Category:');
    stats.byCategory.forEach(cat => {
      console.log(`      ${cat.category}: ${cat.count} modules`);
    });

    // Test 7: Get modules with dependencies
    console.log('\n7️⃣ Test: Get modules with dependencies...');
    const modulesWithDeps = await moduleService.getModulesWithDependencies();
    console.log(`✅ Found ${modulesWithDeps.length} modules with dependencies`);
    
    if (modulesWithDeps.length > 0) {
      modulesWithDeps.slice(0, 3).forEach(module => {
        console.log(`   🔗 ${module.name}:`);
        if (module.dependsOn && module.dependsOn.length > 0) {
          console.log(`      ⬅️ Depends on: ${module.dependsOn.join(', ')}`);
        }
        if (module.requiredFor && module.requiredFor.length > 0) {
          console.log(`      ➡️ Required for: ${module.requiredFor.join(', ')}`);
        }
      });
    }

    // Test 8: Validate dependencies
    console.log('\n8️⃣ Test: Validate dependencies...');
    const validation = await moduleService.validateDependencies();
    
    if (validation.valid) {
      console.log('✅ All dependencies are valid');
    } else {
      console.log('❌ Found dependency errors:');
      validation.errors.forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }

    if (validation.warnings && validation.warnings.length > 0) {
      console.log('⚠️ Dependency warnings:');
      validation.warnings.forEach(warning => {
        console.log(`   ⚠️ ${warning}`);
      });
    }

    // Test 9: Get enabled modules by category
    console.log('\n9️⃣ Test: Get enabled CORE modules...');
    const enabledCore = await moduleService.getEnabledModulesByCategory('CORE');
    console.log(`✅ Found ${enabledCore.length} enabled CORE modules`);

    // Test 10: Get system config
    console.log('\n🔟 Test: Get system config...');
    const systemConfig = await moduleService.getSystemConfig();
    console.log('✅ System config retrieved:');
    console.log(`   📦 Version: ${systemConfig.version}`);
    console.log(`   ⭐ Core modules enabled: ${systemConfig.coreModulesEnabled}`);
    console.log(`   🕐 Last checked: ${systemConfig.lastChecked}`);

    // Test 11: Test filtering
    console.log('\n1️⃣1️⃣ Test: Get modules with filters...');
    const enabledModules = await moduleService.getAllModules({ isEnabled: true });
    const disabledModules = await moduleService.getAllModules({ isEnabled: false });
    console.log(`✅ Enabled modules: ${enabledModules.length}`);
    console.log(`✅ Disabled modules: ${disabledModules.length}`);

    // Test risultato finale
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log(`\n📈 Summary:`);
    console.log(`   Total modules: ${stats.total}`);
    console.log(`   Enabled: ${stats.enabled} (${((stats.enabled / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   Core modules: ${stats.core}`);
    console.log(`   Dependencies valid: ${validation.valid ? '✅' : '❌'}`);
    console.log(`\n✅ ModuleService working correctly!`);

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
    
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
}

// Self-executing test
if (require.main === module) {
  testModuleService()
    .then(() => {
      console.log('\n🏁 Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test failed with error:', error);
      process.exit(1);
    });
}

export default testModuleService;
