// Test diretto API Health Check
// Apri questo file nel browser per testare l'API

console.log('🔍 Testing Health Check API...');

// Test 1: API base (senza auth)
fetch('http://localhost:3200/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ Basic health:', data))
  .catch(err => console.error('❌ Basic health error:', err));

// Test 2: Token da localStorage
const token = localStorage.getItem('accessToken');
console.log('🔑 Token presente:', !!token);
console.log('🔑 Token valore:', token ? token.substring(0, 20) + '...' : 'NESSUN TOKEN');

if (token) {
  // Test 3: API admin con token
  fetch('http://localhost:3200/api/admin/health-check/status', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
    .then(r => {
      console.log('📡 Response status:', r.status);
      if (!r.ok) {
        throw new Error(`HTTP ${r.status}: ${r.statusText}`);
      }
      return r.json();
    })
    .then(data => {
      console.log('✅ Health status API funziona!');
      console.log('📊 Dati ricevuti:', data);
    })
    .catch(err => {
      console.error('❌ Health status error:', err);
    });
} else {
  console.error('❌ Nessun token di autenticazione trovato!');
  console.log('🔧 Fai login prima nella dashboard');
}
