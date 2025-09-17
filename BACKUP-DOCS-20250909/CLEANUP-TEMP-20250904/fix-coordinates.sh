#!/bin/bash

echo "🗺️ SISTEMA COORDINATE MANCANTI"
echo "=============================="

cd backend

npx tsx << 'EOF'
const { PrismaClient } = require('@prisma/client')
const axios = require('axios')
const prisma = new PrismaClient()

// Usa Google Maps API key dal .env
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

async function aggiornaCoordinate() {
  try {
    console.log('🔧 AGGIORNAMENTO COORDINATE IN CORSO...\n')
    
    // 1. Aggiorna richieste senza coordinate
    console.log('1️⃣ RICHIESTE DI ASSISTENZA:')
    console.log('----------------------------')
    
    const richiesteSenzaCoordinate = await prisma.assistanceRequest.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: {
        id: true,
        address: true,
        city: true,
        province: true,
        postalCode: true
      }
    })
    
    console.log(`Trovate ${richiesteSenzaCoordinate.length} richieste senza coordinate`)
    
    if (richiesteSenzaCoordinate.length > 0) {
      console.log('Aggiornamento in corso...')
      
      for (const richiesta of richiesteSenzaCoordinate.slice(0, 5)) { // Limite a 5 per test
        const indirizzo = `${richiesta.address}, ${richiesta.city}, ${richiesta.province}, ${richiesta.postalCode}`
        console.log(`  Geocoding: ${indirizzo}`)
        
        const coords = await geocodeAddress(indirizzo)
        
        if (coords) {
          await prisma.assistanceRequest.update({
            where: { id: richiesta.id },
            data: {
              latitude: coords.lat,
              longitude: coords.lng
            }
          })
          console.log(`    ✅ Aggiornato: ${coords.lat}, ${coords.lng}`)
        } else {
          console.log(`    ❌ Non trovato`)
        }
        
        // Pausa per non sovraccaricare API
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // 2. Verifica professionisti
    console.log('\n2️⃣ PROFESSIONISTI:')
    console.log('------------------')
    
    const professionisti = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL',
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      },
      select: {
        id: true,
        address: true,
        city: true,
        province: true,
        postalCode: true
      }
    })
    
    console.log(`Trovati ${professionisti.length} professionisti senza coordinate`)
    
    if (professionisti.length > 0) {
      console.log('Aggiornamento in corso...')
      
      for (const prof of professionisti.slice(0, 3)) { // Limite a 3 per test
        const indirizzo = `${prof.address}, ${prof.city}, ${prof.province}, ${prof.postalCode}`
        console.log(`  Geocoding: ${indirizzo}`)
        
        const coords = await geocodeAddress(indirizzo)
        
        if (coords) {
          await prisma.user.update({
            where: { id: prof.id },
            data: {
              latitude: coords.lat,
              longitude: coords.lng,
              // Usa stesse coordinate per lavoro se non specificate
              workLatitude: coords.lat,
              workLongitude: coords.lng
            }
          })
          console.log(`    ✅ Aggiornato: ${coords.lat}, ${coords.lng}`)
        } else {
          console.log(`    ❌ Non trovato`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    // 3. Riepilogo finale
    console.log('\n📊 RIEPILOGO FINALE:')
    console.log('-------------------')
    
    const richiesteConCoordinate = await prisma.assistanceRequest.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    })
    
    const totaleRichieste = await prisma.assistanceRequest.count()
    
    console.log(`Richieste con coordinate: ${richiesteConCoordinate}/${totaleRichieste}`)
    
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
    
    console.log(`Professionisti con coordinate: ${profConCoordinate}/${totaleProf}`)
    
    console.log('\n✅ AGGIORNAMENTO COMPLETATO!')
    console.log('Per aggiornare TUTTE le coordinate, rimuovi i limiti slice(0, 5) e slice(0, 3) dallo script')
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

aggiornaCoordinate()
EOF
