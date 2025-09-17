#!/bin/bash

echo "🗺️ FIX COORDINATE - VERSIONE CORRETTA"
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
        lng: location.lng,
        formatted_address: response.data.results[0].formatted_address
      }
    }
    return null
  } catch (error) {
    console.error('Errore geocoding:', error.message)
    return null
  }
}

async function aggiornaCoordinateRichieste() {
  try {
    console.log('🔧 AGGIORNAMENTO COORDINATE RICHIESTE\n')
    
    // AGGIORNA SOLO LE RICHIESTE (che hanno i campi latitude/longitude)
    console.log('📍 RICHIESTE DI ASSISTENZA:')
    console.log('---------------------------')
    
    const richiesteSenzaCoordinate = await prisma.assistanceRequest.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    })
    
    console.log(`Trovate ${richiesteSenzaCoordinate.length} richieste senza coordinate`)
    
    if (richiesteSenzaCoordinate.length === 0) {
      console.log('✅ Tutte le richieste hanno già le coordinate!')
      return
    }
    
    let successCount = 0
    let failCount = 0
    
    for (let i = 0; i < richiesteSenzaCoordinate.length; i++) {
      const richiesta = richiesteSenzaCoordinate[i]
      const indirizzo = `${richiesta.address}, ${richiesta.city}, ${richiesta.province}, ${richiesta.postalCode}`
      
      process.stdout.write(`[${i+1}/${richiesteSenzaCoordinate.length}] ${indirizzo.substring(0, 50)}...`)
      
      const coords = await geocodeAddress(indirizzo)
      
      if (coords) {
        await prisma.assistanceRequest.update({
          where: { id: richiesta.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng
          }
        })
        successCount++
        console.log(' ✅')
      } else {
        failCount++
        console.log(' ❌')
      }
      
      // Pausa per rispettare i limiti API (2 richieste al secondo max)
      if (i < richiesteSenzaCoordinate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    console.log(`\nRisultato: ${successCount} aggiornate, ${failCount} fallite`)
    
    // RIEPILOGO FINALE
    console.log('\n📊 RIEPILOGO FINALE:')
    console.log('===================')
    
    const richiesteConCoordinate = await prisma.assistanceRequest.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    })
    
    const totaleRichieste = await prisma.assistanceRequest.count()
    
    console.log(`✅ Richieste con coordinate: ${richiesteConCoordinate}/${totaleRichieste} (${Math.round(richiesteConCoordinate/totaleRichieste*100)}%)`)
    
    // Mostra alcune richieste con coordinate per verifica
    console.log('\n📍 Esempi di richieste con coordinate:')
    const esempi = await prisma.assistanceRequest.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      },
      take: 3,
      select: {
        title: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true
      }
    })
    
    esempi.forEach(r => {
      console.log(`  - ${r.title}: ${r.address}, ${r.city}`)
      console.log(`    📍 Lat: ${r.latitude}, Lng: ${r.longitude}`)
    })
    
    console.log('\n🎉 AGGIORNAMENTO COMPLETATO!')
    console.log('Ora le richieste dovrebbero essere visibili sulla mappa!')
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

aggiornaCoordinateRichieste()
EOF
