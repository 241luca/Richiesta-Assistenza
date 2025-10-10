/**
 * Script per fare geocoding di tutte le richieste con coordinate NULL
 * Creato: 1 Ottobre 2025
 * 
 * UTILIZZO:
 * cd backend
 * npx ts-node src/scripts/geocode-all-requests.ts
 */

import { PrismaClient } from '@prisma/client';
import GoogleMapsService from '../services/googleMaps.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface GeocodeStats {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{ id: string; address: string; error: string }>;
}

async function geocodeAllRequests() {
  console.log('\n========================================');
  console.log('🗺️  GEOCODING AUTOMATICO RICHIESTE');
  console.log('========================================\n');

  const stats: GeocodeStats = {
    total: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    // 1. Inizializza Google Maps Service
    console.log('📡 Inizializzazione Google Maps Service...');
    await GoogleMapsService.initialize();
    console.log('✅ Google Maps Service pronto\n');

    // 2. Trova tutte le richieste con coordinate NULL
    console.log('🔍 Ricerca richieste senza coordinate...');
    const requests = await prisma.assistanceRequest.findMany({
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
        postalCode: true,
        latitude: true,
        longitude: true
      }
    });

    stats.total = requests.length;
    console.log(`📊 Trovate ${stats.total} richieste da geocodificare\n`);

    if (stats.total === 0) {
      console.log('✅ Tutte le richieste hanno già le coordinate!');
      return stats;
    }

    // 3. Processa ogni richiesta
    console.log('🚀 Inizio geocoding...\n');

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const progress = `[${i + 1}/${stats.total}]`;

      // Skip se manca l'indirizzo
      if (!request.address || !request.city) {
        console.log(`${progress} ⚠️  SKIP - Indirizzo incompleto (ID: ${request.id.slice(0, 8)})`);
        stats.skipped++;
        continue;
      }

      // Costruisci indirizzo completo
      const fullAddress = `${request.address}, ${request.city}, ${request.province || ''} ${request.postalCode || ''}, Italia`.trim();
      
      console.log(`${progress} 📍 Geocoding: ${request.city}, ${request.address.substring(0, 30)}...`);

      try {
        // Chiama il geocoding service
        const coordinates = await GoogleMapsService.geocode(fullAddress);

        if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
          console.log(`${progress} ❌ FAILED - Coordinate non trovate`);
          stats.failed++;
          stats.errors.push({
            id: request.id,
            address: fullAddress,
            error: 'Coordinate non trovate'
          });
          continue;
        }

        // Salva le coordinate nel database
        await prisma.assistanceRequest.update({
          where: { id: request.id },
          data: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude,
            updatedAt: new Date()
          }
        });

        console.log(`${progress} ✅ SUCCESS - Lat: ${coordinates.latitude.toFixed(6)}, Lng: ${coordinates.longitude.toFixed(6)}`);
        stats.success++;

        // Pausa breve per non sovraccaricare l'API (rate limiting)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error: any) {
        console.log(`${progress} ❌ ERROR - ${error.message || 'Errore sconosciuto'}`);
        stats.failed++;
        stats.errors.push({
          id: request.id,
          address: fullAddress,
          error: error.message || 'Errore sconosciuto'
        });
      }
    }

    // 4. Mostra statistiche finali
    console.log('\n========================================');
    console.log('📊 RIEPILOGO OPERAZIONE');
    console.log('========================================');
    console.log(`Totale richieste:       ${stats.total}`);
    console.log(`✅ Successo:            ${stats.success}`);
    console.log(`❌ Fallite:             ${stats.failed}`);
    console.log(`⚠️  Saltate:             ${stats.skipped}`);
    console.log('========================================\n');

    // 5. Mostra errori dettagliati se presenti
    if (stats.errors.length > 0) {
      console.log('❌ DETTAGLIO ERRORI:\n');
      stats.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. ID: ${err.id.slice(0, 8)}`);
        console.log(`   Indirizzo: ${err.address}`);
        console.log(`   Errore: ${err.error}\n`);
      });
    }

    return stats;

  } catch (error) {
    console.error('\n❌ ERRORE CRITICO:', error);
    throw error;
  } finally {
    // Chiudi connessioni
    await GoogleMapsService.shutdown();
    await prisma.$disconnect();
  }
}

// Esegui lo script
geocodeAllRequests()
  .then((stats) => {
    console.log('✅ Script completato con successo!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script fallito:', error);
    process.exit(1);
  });
