// Test script per verificare l'hook useImageModule
// Questo script può essere eseguito nella console del browser

console.log('🔍 Testing useImageModule hook...');

// Simula una chiamata API per ottenere le impostazioni del modulo
async function testImageModuleAPI() {
  try {
    const response = await fetch('http://localhost:3200/api/modules/image-management/settings', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      
      // Verifica la struttura dei dati
      if (data.success && data.data) {
        console.log('✅ Modulo abilitato:', data.data.isEnabled);
        console.log('✅ Impostazioni:', data.data.settings);
      }
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Testa anche l'endpoint per verificare se il modulo è abilitato
async function testModuleStatus() {
  try {
    const response = await fetch('http://localhost:3200/api/modules/image-management', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Module Status:', data);
    } else {
      console.log('❌ Module Status Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Module Status Network Error:', error);
  }
}

// Esegui i test
testImageModuleAPI();
testModuleStatus();

console.log('📝 Per testare manualmente:');
console.log('1. Apri la console del browser (F12)');
console.log('2. Incolla questo script e premi Enter');
console.log('3. Verifica che le API rispondano correttamente');
console.log('4. Controlla che i componenti ImageReminders e ProfileImageUpload rispettino lo stato del modulo');