#!/bin/bash

echo "🗺️ VERIFICA E AGGIORNAMENTO COORDINATE"
echo "======================================"

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function verificaCoordinate() {
  try {
    console.log('📍 ANALISI COORDINATE NEL DATABASE\n')
    
    // 1. Verifica richieste
    console.log('1️⃣ RICHIESTE DI ASSISTENZA:')
    console.log('-----------------------------')
    const richieste = await prisma.assistanceRequest.findMany({
      select: {
        id: true,
        title: true,
        address: true,
        city: true,
        province: true,
        latitude: true,
        longitude: true
      }
    })
    
    const richiesteSenzaCoordinate = richieste.filter(r => !r.latitude || !r.longitude)
    const richiesteConCoordinate = richieste.filter(r => r.latitude && r.longitude)
    
    console.log(`✅ Con coordinate: ${richiesteConCoordinate.length}`)
    console.log(`❌ Senza coordinate: ${richiesteSenzaCoordinate.length}`)
    
    if (richiesteSenzaCoordinate.length > 0) {
      console.log('\nRichieste senza coordinate (prime 5):')
      richiesteSenzaCoordinate.slice(0, 5).forEach(r => {
        console.log(`  - ID: ${r.id.substring(0,8)}... | ${r.address}, ${r.city} (${r.province})`)
      })
    }
    
    // 2. Verifica professionisti
    console.log('\n2️⃣ PROFESSIONISTI:')
    console.log('-------------------')
    const professionisti = await prisma.user.findMany({
      where: { role: 'PROFESSIONAL' },
      select: {
        id: true,
        fullName: true,
        address: true,
        city: true,
        province: true,
        latitude: true,
        longitude: true,
        workLatitude: true,
        workLongitude: true
      }
    })
    
    const profSenzaCoordinate = professionisti.filter(p => !p.latitude || !p.longitude)
    const profSenzaCoordinateLavoro = professionisti.filter(p => !p.workLatitude || !p.workLongitude)
    
    console.log(`Totale professionisti: ${professionisti.length}`)
    console.log(`✅ Con coordinate residenza: ${professionisti.length - profSenzaCoordinate.length}`)
    console.log(`❌ Senza coordinate residenza: ${profSenzaCoordinate.length}`)
    console.log(`✅ Con coordinate lavoro: ${professionisti.length - profSenzaCoordinateLavoro.length}`)
    console.log(`❌ Senza coordinate lavoro: ${profSenzaCoordinateLavoro.length}`)
    
    if (profSenzaCoordinate.length > 0) {
      console.log('\nProfessionisti senza coordinate residenza (primi 3):')
      profSenzaCoordinate.slice(0, 3).forEach(p => {
        console.log(`  - ${p.fullName}: ${p.address}, ${p.city} (${p.province})`)
      })
    }
    
    // 3. Verifica campi coordinate nel database
    console.log('\n3️⃣ VERIFICA STRUTTURA DATABASE:')
    console.log('----------------------------------')
    
    // Test se i campi esistono
    const testUser = await prisma.user.findFirst()
    const userFields = Object.keys(testUser || {})
    
    console.log('Campi coordinate in User:')
    const coordFields = ['latitude', 'longitude', 'workLatitude', 'workLongitude']
    coordFields.forEach(field => {
      if (userFields.includes(field)) {
        console.log(`  ✅ ${field} presente`)
      } else {
        console.log(`  ❌ ${field} MANCANTE`)
      }
    })
    
    const testRequest = await prisma.assistanceRequest.findFirst()
    const requestFields = Object.keys(testRequest || {})
    
    console.log('\nCampi coordinate in AssistanceRequest:')
    const reqCoordFields = ['latitude', 'longitude']
    reqCoordFields.forEach(field => {
      if (requestFields.includes(field)) {
        console.log(`  ✅ ${field} presente`)
      } else {
        console.log(`  ❌ ${field} MANCANTE`)
      }
    })
    
  } catch (error) {
    console.error('❌ Errore:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

verificaCoordinate()
EOF
