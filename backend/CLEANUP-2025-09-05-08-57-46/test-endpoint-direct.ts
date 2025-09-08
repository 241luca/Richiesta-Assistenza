// Test diretto dell'endpoint
import axios from 'axios';

async function testEndpoint() {
  try {
    console.log('🔍 Test endpoint /api/users/:id\n');
    
    // Simula una richiesta all'endpoint
    const response = await axios.get('http://localhost:3200/api/users/348ba304-26ff-4c43-9fa7-6ea7b414d67b', {
      headers: {
        // Aggiungi qui il tuo token se necessario
        // 'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    console.log('✅ Risposta ricevuta:\n');
    console.log('Status:', response.status);
    console.log('\n📊 Dati utente:');
    console.log('   ID:', response.data.data?.id || response.data.id);
    console.log('   Nome:', response.data.data?.firstName || response.data.firstName, response.data.data?.lastName || response.data.lastName);
    console.log('   Profession (testo):', response.data.data?.profession || response.data.profession);
    console.log('   ProfessionId:', response.data.data?.professionId || response.data.professionId);
    console.log('\n🔍 ProfessionData:');
    if (response.data.data?.professionData || response.data.professionData) {
      const pd = response.data.data?.professionData || response.data.professionData;
      console.log('   ✅ Presente!');
      console.log('   Nome:', pd.name);
      console.log('   ID:', pd.id);
    } else {
      console.log('   ❌ NON PRESENTE nell\'endpoint!');
    }
    
    console.log('\n📝 Raw response (primi 500 caratteri):');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 500));
    
  } catch (error: any) {
    console.error('❌ Errore:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEndpoint();
