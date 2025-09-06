/**
 * Script SEMPLIFICATO per validare tutti gli indirizzi delle richieste
 * Versione standalone che non dipende dal GoogleMapsService
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Colori per output console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Funzione per chiedere conferma
function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Funzione helper per sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Funzione per ottenere la API key
async function getGoogleMapsApiKey(): Promise<string | null> {
  try {
    // Prima prova dal database
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        provider: 'google_maps',
        isActive: true
      }
    });

    if (apiKeyRecord && apiKeyRecord.key) {
      return apiKeyRecord.key;
    }

    // Fallback su variabile d'ambiente
    const envKey = process.env.GOOGLE_MAPS_API_KEY;
    if (envKey) {
      return envKey;
    }

    return null;
  } catch (error) {
    // Se la tabella non esiste, usa solo env
    const envKey = process.env.GOOGLE_MAPS_API_KEY;
    return envKey || null;
  }
}

// Funzione per geocoding diretta
async function geocodeAddress(address: string, apiKey: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json`;
    const params = new URLSearchParams({
      address: address,
      key: apiKey,
      language: 'it',
      region: 'IT'
    });

    const response = await fetch(`${url}?${params}`);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }

    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

// Funzione principale
async function validateAllAddresses() {
  console.log(`${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║     VALIDAZIONE INDIRIZZI RICHIESTE CON GOOGLE MAPS       ║${colors.reset}`);
  console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

  let totalCount = 0;
  let validated = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // 1. Ottieni API key
    const apiKey = await getGoogleMapsApiKey();
    
    if (!apiKey) {
      console.log(`${colors.red}❌ API Key Google Maps non trovata!${colors.reset}`);
      console.log(`${colors.yellow}Configura la chiave nel file .env come GOOGLE_MAPS_API_KEY${colors.reset}`);
      console.log(`${colors.yellow}o nel database nella tabella api_keys${colors.reset}`);
      return;
    }

    console.log(`${colors.green}✅ API Key Google Maps trovata${colors.reset}\n`);

    // 2. Conta le richieste
    totalCount = await prisma.assistanceRequest.count();
    console.log(`${colors.blue}📊 Trovate ${totalCount} richieste totali nel database${colors.reset}\n`);

    if (totalCount === 0) {
      console.log(`${colors.yellow}⚠️  Nessuna richiesta trovata${colors.reset}`);
      return;
    }

    // 3. Conta quante NON hanno coordinate
    const withoutCoords = await prisma.assistanceRequest.count({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    });

    console.log(`${colors.yellow}📍 Richieste SENZA coordinate: ${withoutCoords}${colors.reset}`);
    console.log(`${colors.green}✅ Richieste CON coordinate: ${totalCount - withoutCoords}${colors.reset}\n`);

    if (withoutCoords === 0) {
      console.log(`${colors.green}✨ Tutte le richieste hanno già le coordinate!${colors.reset}`);
      
      // Chiedi se vuole rivalidare comunque
      const revalidate = await askQuestion(
        `${colors.yellow}Vuoi rivalidare comunque TUTTE le richieste? (s/n): ${colors.reset}`
      );

      if (revalidate.toLowerCase() !== 's' && revalidate.toLowerCase() !== 'si') {
        console.log(`${colors.blue}👍 Perfetto, niente da fare!${colors.reset}`);
        return;
      }
    } else {
      // 4. Chiedi conferma per validare solo quelle senza coordinate
      const answer = await askQuestion(
        `${colors.yellow}⚠️  Vuoi validare ${withoutCoords} indirizzi? (s/n): ${colors.reset}`
      );

      if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'si') {
        console.log(`${colors.red}❌ Operazione annullata${colors.reset}`);
        return;
      }
    }

    console.log(`\n${colors.blue}🚀 Inizio validazione...${colors.reset}\n`);

    // 5. Recupera le richieste da processare
    const requests = withoutCoords > 0 
      ? await prisma.assistanceRequest.findMany({
          where: {
            OR: [
              { latitude: null },
              { longitude: null }
            ]
          },
          orderBy: { createdAt: 'desc' }
        })
      : await prisma.assistanceRequest.findMany({
          orderBy: { createdAt: 'desc' }
        });

    // 6. Processa ogni richiesta
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const progress = `[${i + 1}/${requests.length}]`;
      
      // Costruisci l'indirizzo completo
      const fullAddress = `${request.address}, ${request.city}, ${request.province} ${request.postalCode}, Italia`;
      
      console.log(`${colors.cyan}${progress} Richiesta #${request.id.substring(0, 8)}...${colors.reset}`);
      console.log(`   📍 ${fullAddress}`);

      // Se ha già coordinate e non stiamo rivalidando, salta
      if (request.latitude && request.longitude && withoutCoords > 0) {
        console.log(`   ${colors.yellow}⏭️  Ha già coordinate, saltata${colors.reset}\n`);
        skipped++;
        continue;
      }

      try {
        // 7. Geocoding con Google Maps
        const coordinates = await geocodeAddress(fullAddress, apiKey);

        if (!coordinates) {
          console.log(`   ${colors.red}❌ Non trovato${colors.reset}`);
          
          // Prova con indirizzo semplificato
          const simpleAddress = `${request.city}, ${request.province}, Italia`;
          console.log(`   🔄 Riprovo con: ${simpleAddress}`);
          
          const simpleCoords = await geocodeAddress(simpleAddress, apiKey);
          if (simpleCoords) {
            // Aggiorna con coordinate città
            await prisma.assistanceRequest.update({
              where: { id: request.id },
              data: {
                latitude: simpleCoords.lat,
                longitude: simpleCoords.lng,
                updatedAt: new Date()
              }
            });
            console.log(`   ${colors.green}✅ Aggiornato con coordinate città${colors.reset}`);
            console.log(`   📍 Lat: ${simpleCoords.lat.toFixed(6)}, Lng: ${simpleCoords.lng.toFixed(6)}\n`);
            validated++;
          } else {
            console.log(`   ${colors.red}❌ Fallito anche con indirizzo semplificato${colors.reset}\n`);
            failed++;
          }
        } else {
          // 8. Aggiorna con coordinate precise
          await prisma.assistanceRequest.update({
            where: { id: request.id },
            data: {
              latitude: coordinates.lat,
              longitude: coordinates.lng,
              updatedAt: new Date()
            }
          });
          
          console.log(`   ${colors.green}✅ Validato con successo!${colors.reset}`);
          console.log(`   📍 Lat: ${coordinates.lat.toFixed(6)}, Lng: ${coordinates.lng.toFixed(6)}\n`);
          validated++;
        }

        // 9. Pausa per non sovraccaricare Google (importante!)
        if (i < requests.length - 1) {
          await sleep(200); // 200ms tra richieste
        }

      } catch (error) {
        console.log(`   ${colors.red}❌ Errore: ${error}${colors.reset}\n`);
        failed++;
      }
    }

    // 10. Report finale
    console.log(`\n${colors.cyan}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║                      REPORT FINALE                        ║${colors.reset}`);
    console.log(`${colors.cyan}╚════════════════════════════════════════════════════════════╝${colors.reset}\n`);

    console.log(`${colors.blue}📊 Risultati:${colors.reset}`);
    console.log(`   • Richieste processate: ${requests.length}`);
    console.log(`   ${colors.green}• Validate con successo: ${validated}${colors.reset}`);
    if (skipped > 0) {
      console.log(`   ${colors.yellow}• Saltate (già validate): ${skipped}${colors.reset}`);
    }
    console.log(`   ${colors.red}• Fallite: ${failed}${colors.reset}`);

    const successRate = (requests.length - skipped) > 0 
      ? ((validated / (requests.length - skipped)) * 100).toFixed(1)
      : 100;
    
    console.log(`\n${colors.green}✅ Tasso di successo: ${successRate}%${colors.reset}`);

    // Verifica finale
    const stillWithoutCoords = await prisma.assistanceRequest.count({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    });

    if (stillWithoutCoords > 0) {
      console.log(`\n${colors.yellow}⚠️  Rimangono ${stillWithoutCoords} richieste senza coordinate${colors.reset}`);
      console.log(`${colors.yellow}   Potrebbero avere indirizzi non validi o incompleti${colors.reset}`);
    } else {
      console.log(`\n${colors.green}🎉 PERFETTO! Tutte le richieste ora hanno le coordinate GPS!${colors.reset}`);
      console.log(`${colors.green}   Le mappe funzioneranno correttamente per tutte le richieste${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}❌ Errore critico:${colors.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
console.log(`${colors.blue}🔧 Inizializzazione script...${colors.reset}\n`);

validateAllAddresses()
  .then(() => {
    console.log(`\n${colors.green}✨ Script completato con successo!${colors.reset}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${colors.red}❌ Script terminato con errore:${colors.reset}`, error);
    process.exit(1);
  });
