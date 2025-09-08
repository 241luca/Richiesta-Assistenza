/**
 * Script per inserire o aggiornare Google Maps API Key
 */

import { prisma } from '../config/database';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Funzione per criptare la chiave (deve corrispondere a quella nel servizio)
function encryptKey(key: string): string {
  const algorithm = 'aes-256-cbc';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

async function setupGoogleMapsKey() {
  try {
    console.log('\n🔧 Setup Google Maps API Key\n');
    
    // 1. Trova la prima organization
    const organization = await prisma.organization.findFirst();
    
    if (!organization) {
      console.error('❌ Nessuna organization trovata nel database!');
      console.log('Creazione organization di default...');
      
      // Crea un'organization di default
      const newOrg = await prisma.organization.create({
        data: {
          name: 'Organizzazione Principale',
          slug: 'main-org',
          description: 'Organizzazione principale del sistema'
        }
      });
      
      console.log(`✅ Organization creata: ${newOrg.name} (ID: ${newOrg.id})`);
      return;
    }
    
    console.log(`📍 Usando organization: ${organization.name} (ID: ${organization.id})`);
    
    // 2. Trova un utente SUPER_ADMIN
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (!superAdmin) {
      console.error('❌ Nessun utente SUPER_ADMIN trovato!');
      return;
    }
    
    console.log(`👤 Usando utente: ${superAdmin.email}`);
    
    // 3. Chiave Google Maps (usa quella dal .env o una di esempio)
    const googleMapsKey = process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyB_FAKE_KEY_FOR_DEVELOPMENT_ONLY';
    
    if (googleMapsKey === 'AIzaSyB_FAKE_KEY_FOR_DEVELOPMENT_ONLY' || googleMapsKey === 'your_google_maps_api_key_here') {
      console.log('\n⚠️  ATTENZIONE: Stai usando una chiave FAKE!');
      console.log('   Per usare Google Maps realmente, inserisci una chiave valida nel file .env');
      console.log('   GOOGLE_MAPS_API_KEY=la_tua_chiave_qui\n');
    }
    
    // 4. Verifica se esiste già una chiave per questa organization
    const existingKey = await prisma.apiKey.findFirst({
      where: {
        service: 'GOOGLE_MAPS',
        organizationId: organization.id
      }
    });
    
    if (existingKey) {
      console.log('\n📍 Chiave Google Maps già presente per questa organization');
      console.log('   Aggiornamento in corso...');
      
      // Aggiorna la chiave esistente
      const updated = await prisma.apiKey.update({
        where: { id: existingKey.id },
        data: {
          key: encryptKey(googleMapsKey),
          isActive: true,
          updatedById: superAdmin.id,
          lastValidatedAt: new Date(),
          configuration: {
            enabled: true,
            apis: ['maps', 'geocoding', 'places']
          }
        }
      });
      
      console.log('✅ Chiave Google Maps aggiornata con successo!');
    } else {
      console.log('\n📍 Creazione nuova chiave Google Maps...');
      
      // Crea una nuova chiave
      const created = await prisma.apiKey.create({
        data: {
          service: 'GOOGLE_MAPS',
          key: encryptKey(googleMapsKey),
          isActive: true,
          organizationId: organization.id,
          updatedById: superAdmin.id,
          lastValidatedAt: new Date(),
          configuration: {
            enabled: true,
            apis: ['maps', 'geocoding', 'places']
          }
        }
      });
      
      console.log('✅ Chiave Google Maps creata con successo!');
    }
    
    // 5. Verifica finale
    const finalCheck = await prisma.apiKey.findFirst({
      where: {
        service: 'GOOGLE_MAPS',
        organizationId: organization.id,
        isActive: true
      }
    });
    
    if (finalCheck) {
      console.log('\n✅ Setup completato con successo!');
      console.log(`   Organization: ${organization.name}`);
      console.log(`   Service: GOOGLE_MAPS`);
      console.log(`   Active: ${finalCheck.isActive}`);
      console.log('\n🚀 Ora riavvia il backend e riprova!');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
setupGoogleMapsKey();
