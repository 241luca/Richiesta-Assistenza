/**
 * Script per ricalcolare le informazioni di viaggio
 * Usa tsx per eseguire TypeScript direttamente
 */

import { PrismaClient } from '@prisma/client';
import { Client } from '@googlemaps/google-maps-services-js';

const prisma = new PrismaClient();
const mapsClient = new Client({});

async function recalculateAllTravelInfo() {
  console.log('🚀 Avvio ricalcolo informazioni viaggio per tutte le richieste assegnate...\n');

  try {
    // Trova tutte le richieste assegnate senza informazioni viaggio
    const requests = await prisma.assistanceRequest.findMany({
      where: {
        professionalId: {
          not: null
        },
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS']
        },
        travelDistance: null
      },
      select: {
        id: true,
        title: true,
        professionalId: true,
        address: true,
        city: true,
        province: true,
        postalCode: true
      }
    });

    console.log(`📊 Trovate ${requests.length} richieste da processare\n`);

    if (requests.length === 0) {
      console.log('✅ Nessuna richiesta da processare!');
      return;
    }

    let success = 0;
    let failed = 0;

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const progress = Math.round(((i + 1) / requests.length) * 100);

      console.log(`[${i + 1}/${requests.length}] (${progress}%) Processando: ${request.title.substring(0, 50)}...`);
      console.log(`   📍 ${request.city}, ${request.address.substring(0, 30)}...`);

      try {
        // Recupera indirizzo professionista
        const professional = await prisma.user.findUnique({
          where: { id: request.professionalId! },
          select: {
            address: true,
            city: true,
            province: true,
            postalCode: true
          }
        });

        if (!professional || !professional.address || !professional.city) {
          console.log('   ⚠️  Professionista senza indirizzo\n');
          failed++;
          continue;
        }

        // Costruisci indirizzi
        const origin = `${professional.address}, ${professional.city}, ${professional.province} ${professional.postalCode}, Italia`;
        const destination = `${request.address}, ${request.city}, ${request.province} ${request.postalCode}, Italia`;

        // Chiama Google Maps API
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          throw new Error('GOOGLE_MAPS_API_KEY non configurata');
        }

        const response = await mapsClient.directions({
          params: {
            origin,
            destination,
            mode: 'driving',
            region: 'it',
            units: 'metric',
            key: apiKey,
          },
          timeout: 5000,
        });

        if (response.data.status !== 'OK' || !response.data.routes[0]) {
          console.log('   ❌ Errore Google Maps API\n');
          failed++;
          continue;
        }

        const route = response.data.routes[0];
        const leg = route.legs[0];

        // Calcola costo
        const distanceKm = leg.distance.value / 1000;
        const costPerKm = 0.50;
        const cost = Math.round(distanceKm * costPerKm * 100) / 100;

        // Salva nel database
        await prisma.assistanceRequest.update({
          where: { id: request.id },
          data: {
            travelDistance: leg.distance.value,
            travelDuration: leg.duration.value,
            travelDistanceText: leg.distance.text,
            travelDurationText: leg.duration.text,
            travelCost: cost,
            travelCalculatedAt: new Date(),
          },
        });

        success++;
        console.log(`   ✅ Successo (${leg.distance.text}, ${leg.duration.text}, €${cost})\n`);

        // Pausa per non sovraccaricare API
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error: any) {
        failed++;
        console.error(`   ❌ Errore: ${error.message}\n`);
      }
    }

    console.log('\n📊 RIEPILOGO FINALE:');
    console.log(`✅ Successi: ${success}`);
    console.log(`❌ Falliti: ${failed}`);
    console.log(`📈 Percentuale successo: ${Math.round((success / requests.length) * 100)}%`);
  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
recalculateAllTravelInfo()
  .then(() => {
    console.log('\n🎉 Script completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Errore fatale:', error);
    process.exit(1);
  });
