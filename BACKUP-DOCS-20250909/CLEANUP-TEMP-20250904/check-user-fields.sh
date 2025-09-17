#!/bin/bash

echo "🔍 VERIFICA STRUTTURA TABELLA USER"
echo "=================================="

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verificaCampi() {
  try {
    // Prendi un utente professional per vedere i campi disponibili
    const prof = await prisma.user.findFirst({
      where: { role: 'PROFESSIONAL' }
    })
    
    if (prof) {
      console.log('Campi disponibili nella tabella User:')
      console.log('=====================================')
      Object.keys(prof).forEach(key => {
        console.log(`- ${key}: ${typeof prof[key]}`)
      })
    }
    
    // Verifica se ci sono campi simili a coordinate
    console.log('\nCampi che potrebbero contenere coordinate:')
    console.log('==========================================')
    if (prof) {
      Object.keys(prof).forEach(key => {
        if (key.toLowerCase().includes('lat') || 
            key.toLowerCase().includes('lon') || 
            key.toLowerCase().includes('coord') ||
            key.toLowerCase().includes('work')) {
          console.log(`- ${key}: ${prof[key]}`)
        }
      })
    }
    
  } catch (error) {
    console.error('Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verificaCampi()
EOF
