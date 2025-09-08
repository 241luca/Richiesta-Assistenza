const bcrypt = require('bcrypt');

async function generateHashes() {
  // Genera hash per le password di test
  const admin123 = await bcrypt.hash('admin123', 12);
  const password123 = await bcrypt.hash('password123', 12);
  
  console.log('Hash per admin123:', admin123);
  console.log('Hash per password123:', password123);
}

generateHashes();
