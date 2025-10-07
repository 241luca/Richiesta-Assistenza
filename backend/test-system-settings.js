import { prisma } from './src/config/database';

async function testSystemSettings() {
  console.log('🔍 Testing SystemSettings table...\n');
  
  try {
    // 1. Verifica che la tabella esista
    console.log('1. Checking if table exists...');
    const count = await prisma.systemSettings.count();
    console.log(`   ✅ Table exists with ${count} records\n`);
    
    // 2. Prova a creare un record di test
    console.log('2. Creating test record...');
    const testSetting = await prisma.systemSettings.create({
      data: {
        key: 'test_setting',
        value: 'test_value',
        type: 'string',
        category: 'Test',
        description: 'Test setting',
        isActive: true,
        isEditable: true
      }
    });
    console.log('   ✅ Test record created:', testSetting.key, '\n');
    
    // 3. Lista tutti i records
    console.log('3. Listing all records:');
    const allSettings = await prisma.systemSettings.findMany();
    allSettings.forEach(setting => {
      console.log(`   - ${setting.key}: ${setting.value} (${setting.category})`);
    });
    
    // 4. Cleanup
    console.log('\n4. Cleaning up test record...');
    await prisma.systemSettings.delete({
      where: { id: testSetting.id }
    });
    console.log('   ✅ Test record deleted');
    
    console.log('\n✅ All tests passed! SystemSettings table is working correctly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'P2021') {
      console.error('\n⚠️  Table does not exist in the database!');
      console.error('Run: npx prisma db push');
    } else if (error.code === 'P2002') {
      console.error('\n⚠️  Duplicate key error - test_setting already exists');
    } else {
      console.error('\nFull error:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testSystemSettings();
