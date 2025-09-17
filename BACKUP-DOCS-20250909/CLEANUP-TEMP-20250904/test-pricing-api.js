// Test per verificare che le API delle tariffe funzionino

async function testPricingAPI() {
  const professionalId = '4a0add7b-787b-4b13-8f8a-ea38abbca068';
  const baseUrl = 'http://localhost:3200';
  
  console.log('=== TEST API TARIFFE PROFESSIONISTA ===\n');
  
  try {
    // 1. Test GET - Recupera tariffe esistenti
    console.log('1. Recupero tariffe esistenti...');
    const getResponse = await fetch(`${baseUrl}/api/professionals/${professionalId}/pricing`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        // Nota: In produzione servirebbe il token di autenticazione
      }
    });
    
    if (!getResponse.ok) {
      const error = await getResponse.text();
      console.log('❌ Errore GET:', error);
    } else {
      const data = await getResponse.json();
      console.log('✅ Tariffe recuperate:', JSON.stringify(data.data, null, 2));
    }
    
    // 2. Test PUT - Salva nuove tariffe con scaglioni
    console.log('\n2. Salvataggio nuove tariffe con scaglioni...');
    const newPricing = {
      hourlyRate: 60,
      minimumRate: 35,
      baseCost: 15,
      freeKm: 10,
      costRanges: [
        { fromKm: 0, toKm: 10, costPerKm: 100 },    // €1.00/km in centesimi
        { fromKm: 10, toKm: 50, costPerKm: 80 },    // €0.80/km in centesimi
        { fromKm: 50, toKm: null, costPerKm: 60 }   // €0.60/km in centesimi
      ],
      supplements: [
        { type: 'weekend', name: 'Weekend', percentage: 25, fixedAmount: 0, isActive: true },
        { type: 'notturno', name: 'Notturno', percentage: 30, fixedAmount: 0, isActive: true },
        { type: 'festivo', name: 'Festivi', percentage: 50, fixedAmount: 0, isActive: true },
        { type: 'urgente', name: 'Urgente', percentage: 0, fixedAmount: 2500, isActive: true } // €25 in centesimi
      ]
    };
    
    const putResponse = await fetch(`${baseUrl}/api/professionals/${professionalId}/pricing`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPricing)
    });
    
    if (!putResponse.ok) {
      const error = await putResponse.text();
      console.log('❌ Errore PUT:', error);
    } else {
      const data = await putResponse.json();
      console.log('✅ Tariffe salvate con successo!');
    }
    
    // 3. Test calcolo viaggio
    console.log('\n3. Test calcolo costi di viaggio...');
    // Questo richiederebbe una richiesta esistente, quindi saltiamo per ora
    console.log('⚠️  Test calcolo viaggio richiede una richiesta esistente');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
  
  console.log('\n=== FINE TEST ===');
}

// Esegui il test
testPricingAPI();
