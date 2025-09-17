#!/bin/bash

echo "🗺️ AGGIORNAMENTO COMPLETO COORDINATE"
echo "===================================="

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

async function aggiornaCoordinateComplete() {
  try {
    console.log('🔧 AGGIORNAMENTO COMPLETO COORDINATE\n')
    
    // 1. Aggiorna TUTTE le richieste senza coordinate
    console.log('1️⃣ AGGIORNAMENTO RICHIESTE:')
    console.log('----------------------------')
    
    const richiesteSenzaCoordinate = await prisma.assistanceRequest.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    })
    
    console.log(`Trovate ${richiesteSenzaCoordinate.length} richieste da aggiornare`)
    
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
      
      // Pausa per rispettare i limiti API
      if (i < richiesteSenzaCoordinate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    console.log(`\nRisultato: ${successCount} aggiornate, ${failCount} fallite`)
    
    // 2. Aggiorna TUTTI i professionisti senza coordinate
    console.log('\n2️⃣ AGGIORNAMENTO PROFESSIONISTI:')
    console.log('--------------------------------')
    
    const professionisti = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL',
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    })
    
    console.log(`Trovati ${professionisti.length} professionisti da aggiornare`)
    
    successCount = 0
    failCount = 0
    
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
      
      if (i < professionisti.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    console.log(`\nRisultato: ${successCount} aggiornati, ${failCount} falliti`)
    
    // 3. RIEPILOGO FINALE
    console.log('\n📊 RIEPILOGO FINALE:')
    console.log('===================')
    
    const stats = {
      richiesteConCoordinate: await prisma.assistanceRequest.count({
        where: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } }
          ]
        }
      }),
      totaleRichieste: await prisma.assistanceRequest.count(),
      profConCoordinate: await prisma.user.count({
        where: {
          role: 'PROFESSIONAL',
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } }
          ]
        }
      }),
      totaleProf: await prisma.user.count({
        where: { role: 'PROFESSIONAL' }
      })
    }
    
    console.log(`✅ Richieste con coordinate: ${stats.richiesteConCoordinate}/${stats.totaleRichieste} (${Math.round(stats.richiesteConCoordinate/stats.totaleRichieste*100)}%)`)
    console.log(`✅ Professionisti con coordinate: ${stats.profConCoordinate}/${stats.totaleProf} (${Math.round(stats.profConCoordinate/stats.totaleProf*100)}%)`)
    
    console.log('\n🎉 AGGIORNAMENTO COMPLETATO!')
    
  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

aggiornaCoordinateComplete()
EOF
