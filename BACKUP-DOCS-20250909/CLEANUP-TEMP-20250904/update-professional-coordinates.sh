#!/bin/bash

echo "🗺️ AGGIORNA COORDINATE PROFESSIONISTI"
echo "====================================="

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const prisma = new PrismaClient()

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyB7zix_8OrL9ks3d6XcjHShHIQDDhI1lCI'

async function geocodeAddress(address) {
  try {
    const fullAddress = `${address}, Italia`
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${GOOGLE_MAPS_API_KEY}`
    
    const response = await axios.get(url)
    
    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng
      }
    }
    return null
  } catch (error) {
    console.error('Errore geocoding:', error.message)
    return null
  }
}

async function aggiornaCoordinateProfessionisti() {
  try {
    console.log('🔧 AGGIORNAMENTO COORDINATE PROFESSIONISTI\n')
    
    // Verifica se i campi esistono
    const testUser = await prisma.user.findFirst()
    
    if (!testUser || !('latitude' in testUser)) {
      console.log('❌ I campi coordinate non esistono ancora nella tabella User')
      console.log('   Esegui prima: ./apply-user-coordinates-migration.sh')
      return
    }
    
    // Trova professionisti senza coordinate
    const professionisti = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL',
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    })
    
    console.log(`Trovati ${professionisti.length} professionisti senza coordinate`)
    
    if (professionisti.length === 0) {
      console.log('✅ Tutti i professionisti hanno già le coordinate!')
      return
    }
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < professionisti.length; i++) {
      const prof = professionisti[i]
      const indirizzo = `${prof.address}, ${prof.city}, ${prof.province}, ${prof.postalCode}`
      
      process.stdout.write(`[${i+1}/${professionisti.length}] ${prof.fullName} - ${indirizzo.substring(0, 40)}...`)
      
      const coords = await geocodeAddress(indirizzo)
      
      if (coords) {
        await prisma.user.update({
          where: { id: prof.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng,
            workLatitude: coords.lat,
            workLongitude: coords.lng
          }
        })
        successCount++
        console.log(' ✅')
      } else {
        failCount++
        console.log(' ❌')
      }
      
      // Pausa per rispettare i limiti API
      if (i < professionisti.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    console.log(`\nRisultato: ${successCount} aggiornati, ${failCount} falliti`)
    
    // Riepilogo finale
    console.log('\n📊 RIEPILOGO FINALE:')
    console.log('===================')
    
    const profConCoordinate = await prisma.user.count({
      where: {
        role: 'PROFESSIONAL',
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    })
    
    const totaleProf = await prisma.user.count({
      where: { role: 'PROFESSIONAL' }
    })
    
    console.log(`✅ Professionisti con coordinate: ${profConCoordinate}/${totaleProf}`)
    
    if (profConCoordinate > 0) {
      console.log('\n📍 Esempi di professionisti con coordinate:')
      const esempi = await prisma.user.findMany({
        where: {
          role: 'PROFESSIONAL',
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } }
          ]
        },
        take: 3,
        select: {
          fullName: true,
          profession: true,
          address: true,
          city: true,
          latitude: true,
          longitude: true
        }
      })
      
      esempi.forEach(p => {
        console.log(`  - ${p.fullName} (${p.profession}): ${p.address}, ${p.city}`)
        console.log(`    📍 Lat: ${p.latitude}, Lng: ${p.longitude}`)
      })
    }
    
    console.log('\n🎉 AGGIORNAMENTO COMPLETATO!')
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

aggiornaCoordinateProfessionisti()
EOF
