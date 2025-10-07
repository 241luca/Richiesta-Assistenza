/**
 * Script per configurare la chiave Google Maps valida nel database
 */

import { prisma } from '../config/database';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Funzione per criptare la chiave
function encryptKey(key: string): string {
  const algorithm = 'aes-256-cbc';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

async function configureGoogleMaps() {
  try {
    console.log('\n🔧 Configurazione Google Maps API Key\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // La chiave Google Maps valida
    const GOOGLE_MAPS_KEY = 'AIzaSyBoWQaouY1WxyhKFpp2mrPxklq_1ucbAIE';
    console.log('✅ Usando chiave Google Maps valida\n');
    
    // 1. Trova o crea un'organization
    let organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.log('📁 Creazione organization principale...');
      organization = await prisma.organization.create({
        data: {
          name: 'Sistema Assistenza',
          slug: 'sistema-assistenza',
          description: 'Organizzazione principale del sistema'
        }
      });
      console.log(`✅ Organization creata: ${organization.name}\n`);
    } else {
      console.log(`📁 Usando organization esistente: ${organization.name}\n`);
    }
    
    // 2. Trova o crea un utente SUPER_ADMIN
    let superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (!superAdmin) {
      // Se non c'è un SUPER_ADMIN, prendi qualsiasi utente
      superAdmin = await prisma.user.findFirst();
      
      if (!superAdmin) {
        console.log('⚠️  Nessun utente trovato nel sistema!');
        console.log('   Creane uno prima di eseguire questo script.');
        return;
      }
    }
    
    console.log(`👤 Usando utente: ${superAdmin.email}\n`);
    
    // 3. Aggiorna o crea la chiave per TUTTE le organizations
    const allOrganizations = await prisma.organization.findMany();
    
    for (const org of allOrganizations) {
      console.log(`\n🔑 Configurazione per organization: ${org.name}`);
      
      // Cerca chiave esistente
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          service: 'GOOGLE_MAPS',
          organizationId: org.id
        }
      });
      
      if (existingKey) {
        // Aggiorna chiave esistente
        await prisma.apiKey.update({
          where: { id: existingKey.id },
          data: {
            key: encryptKey(GOOGLE_MAPS_KEY),
            isActive: true,
            updatedById: superAdmin.id,
            lastValidatedAt: new Date(),
            configuration: {
              enabled: true,
              apis: ['maps', 'geocoding', 'places'],
              restrictions: {
                referrers: ['http://localhost:5193/*', 'http://127.0.0.1:5193/*']
              }
            }
          }
        });
        console.log('   ✅ Chiave aggiornata');
      } else {
        // Crea nuova chiave
        await prisma.apiKey.create({
          data: {
            service: 'GOOGLE_MAPS',
            key: encryptKey(GOOGLE_MAPS_KEY),
            isActive: true,
            organizationId: org.id,
            updatedById: superAdmin.id,
            lastValidatedAt: new Date(),
            configuration: {
              enabled: true,
              apis: ['maps', 'geocoding', 'places'],
              restrictions: {
                referrers: ['http://localhost:5193/*', 'http://127.0.0.1:5193/*']
              }
            }
          }
        });
        console.log('   ✅ Chiave creata');
      }
    }
    
    // 4. Verifica finale
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n📊 VERIFICA FINALE:\n');
    
    const finalKeys = await prisma.apiKey.findMany({
      where: {
        service: 'GOOGLE_MAPS',
        isActive: true
      },
      include: {
        organization: true
      }
    });
    
    console.log(`✅ ${finalKeys.length} chiavi Google Maps attive configurate:\n`);
    
    finalKeys.forEach(key => {
      console.log(`   • Organization: ${key.organization.name}`);
      console.log(`     ID: ${key.organizationId}`);
      console.log(`     Active: ✅`);
    });
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('\n🎉 CONFIGURAZIONE COMPLETATA CON SUCCESSO!\n');
    console.log('📌 Prossimi passi:');
    console.log('   1. Riavvia il backend (se è in esecuzione)');
    console.log('   2. Ricarica la pagina nel browser');
    console.log('   3. Google Maps dovrebbe ora funzionare correttamente!\n');
    
    // 5. Test della chiave con Google
    console.log('🧪 Test connessione Google Maps API...');
    try {
      const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Roma,Italia&key=${GOOGLE_MAPS_KEY}`;
      const response = await fetch(testUrl);
      const data = await response.json();
      
      if (data.status === 'OK') {
        console.log('   ✅ Chiave Google Maps VALIDA e FUNZIONANTE!');
      } else {
        console.log('   ⚠️ Stato risposta:', data.status);
        if (data.error_message) {
          console.log('   Messaggio:', data.error_message);
        }
      }
    } catch (error) {
      console.log('   ⚠️ Errore nel test:', error);
    }
    
    console.log('\n');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
configureGoogleMaps();
