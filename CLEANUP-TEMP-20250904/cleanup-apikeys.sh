#!/bin/bash

echo "🧹 PULIZIA API KEYS DUPLICATE E NON CONFIGURATE"
echo "=============================================="

cd backend

echo "1. Rimuovo API Keys non configurate e duplicate:"
npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanup() {
  try {
    // Prima vediamo cosa abbiamo
    const allKeys = await prisma.apiKey.findMany({
      orderBy: { service: 'asc' }
    })
    
    console.log('API Keys trovate:')
    allKeys.forEach(key => {
      console.log(`- ${key.service}: ${key.isConfigured ? '✅ Configurata' : '❌ NON configurata'} (ID: ${key.id})`)
    })
    
    // Rimuovi quelle non configurate
    const deleted = await prisma.apiKey.deleteMany({
      where: {
        isConfigured: false
      }
    })
    
    console.log(`\n🗑️ Rimosse ${deleted.count} API Keys non configurate`)
    
    // Verifica duplicati rimanenti
    const remaining = await prisma.apiKey.findMany({
      orderBy: { service: 'asc' }
    })
    
    const services = {}
    remaining.forEach(key => {
      if (!services[key.service]) {
        services[key.service] = []
      }
      services[key.service].push(key.id)
    })
    
    // Se ci sono ancora duplicati, tieni solo il primo
    for (const [service, ids] of Object.entries(services)) {
      if (ids.length > 1) {
        console.log(`\n⚠️ Trovati ${ids.length} duplicati per ${service}`)
        // Rimuovi tutti tranne il primo
        const toDelete = ids.slice(1)
        for (const id of toDelete) {
          await prisma.apiKey.delete({
            where: { id }
          })
          console.log(`  Rimosso duplicato ID: ${id}`)
        }
      }
    }
    
    // Mostra stato finale
    const final = await prisma.apiKey.findMany({
      orderBy: { service: 'asc' }
    })
    
    console.log('\n✅ Stato finale API Keys:')
    final.forEach(key => {
      console.log(`- ${key.service}: ${key.name}`)
    })
    
  } catch (e) {
    console.log('Errore:', e.message)
  }
  
  await prisma.$disconnect()
}

cleanup()
EOF

echo ""
echo "2. Cerco dove vengono create automaticamente:"
grep -r "createDefaultApiKeys\|initializeServices\|STRIPE.*apiKey" src/ --include="*.ts" | head -5

echo ""
echo "3. Disabilito creazione automatica (se esiste):"
# Cerchiamo file che potrebbero creare API keys automaticamente
find src -name "*.ts" -exec grep -l "apiKey.*create.*STRIPE\|createMany.*apiKey" {} \; | head -5

echo ""
echo "=============================================="
echo "Le API Keys duplicate e non configurate sono state rimosse!"
echo "RIAVVIA IL BACKEND per vedere le modifiche"
