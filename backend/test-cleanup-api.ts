// Test dell'API cleanup
import axios from 'axios';

async function testCleanupAPI() {
  try {
    // Test endpoint configurazione
    console.log('Testing GET /api/backup/cleanup-config...');
    const configResponse = await axios.get('http://localhost:3200/api/backup/cleanup-config');
    console.log('✅ Config API:', configResponse.status === 200 ? 'FUNZIONA' : '❌ ERRORE');
    
    // Test endpoint pattern
    console.log('\nTesting GET /api/backup/cleanup-patterns...');
    const patternsResponse = await axios.get('http://localhost:3200/api/backup/cleanup-patterns');
    console.log('✅ Patterns API:', patternsResponse.status === 200 ? 'FUNZIONA' : '❌ ERRORE');
    
    // Test endpoint directory cleanup
    console.log('\nTesting GET /api/backup/cleanup-directories...');
    const dirsResponse = await axios.get('http://localhost:3200/api/backup/cleanup-directories');
    console.log('✅ Directories API:', dirsResponse.status === 200 ? 'FUNZIONA' : '❌ ERRORE');
    
    console.log('\n✅ SISTEMA CLEANUP API: FUNZIONANTE');
    
  } catch (error: any) {
    console.error('❌ ERRORE API:', error.response?.data || error.message);
    console.log('\n❌ SISTEMA CLEANUP API: NON FUNZIONA');
  }
}

testCleanupAPI();
