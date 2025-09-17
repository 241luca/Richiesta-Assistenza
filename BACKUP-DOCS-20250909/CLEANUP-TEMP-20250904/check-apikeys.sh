#!/bin/bash

echo "🔍 CONTROLLO API KEYS DUPLICATE"
echo "==============================="

cd backend

echo "1. Verifica nel database:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function check() {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { service: 'asc' }
    })
    
    console.log('API Keys nel database:')
    console.log('----------------------')
    
    const services = {}
    apiKeys.forEach(key => {
      if (!services[key.service]) {
        services[key.service] = 0
      }
      services[key.service]++
      console.log(`- ${key.service}: ${key.name || 'No name'} (ID: ${key.id})`)
    })
    
    console.log('\nRiepilogo:')
    Object.entries(services).forEach(([service, count]) => {
      if (count > 1) {
        console.log(`⚠️ ${service}: ${count} chiavi (DUPLICATO!)`);
      } else {
        console.log(`✅ ${service}: ${count} chiave`);
      }
    })
    
  } catch (e) {
    console.log('Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

check()
EOF

echo ""
echo "2. Cerco dove vengono create/inizializzate:"
grep -r "STRIPE" src/ --include="*.ts" | grep -i "apikey\|service" | head -5

echo ""
echo "3. Cerco inizializzazione API Keys:"
grep -r "initializeApiKeys\|seedApiKeys\|createDefaultApiKeys" src/ --include="*.ts" | head -5

echo ""
echo "==============================="
echo "Dimmi cosa mostra così possiamo:"
echo "1. Rimuovere i duplicati"
echo "2. Capire perché Stripe appare se non l'hai inserito"
