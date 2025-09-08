/**
 * Script per verificare le API keys nel database
 */

import { prisma } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

async function checkApiKeys() {
  try {
    console.log('\n🔍 Verifica API Keys nel database...\n');
    
    // 1. Verifica tutte le API keys
    const apiKeys = await prisma.apiKey.findMany({
      include: {
        organization: true,
        updatedBy: true
      }
    });
    
    console.log(`📊 Trovate ${apiKeys.length} API keys totali:\n`);
    
    apiKeys.forEach(key => {
      console.log(`  Service: ${key.service}`);
      console.log(`  Organization: ${key.organization.name} (ID: ${key.organizationId})`);
      console.log(`  Active: ${key.isActive ? '✅' : '❌'}`);
      console.log(`  Last Validated: ${key.lastValidatedAt || 'Mai'}`);
      console.log(`  Updated By: ${key.updatedBy?.email || 'N/A'}`);
      console.log(`  Key (masked): ${key.key.substring(0, 20)}...`);
      console.log('  ---');
    });
    
    // 2. Verifica specificamente Google Maps
    console.log('\n🗺️  Google Maps Keys:');
    const googleMapsKeys = apiKeys.filter(k => k.service === 'GOOGLE_MAPS');
    
    if (googleMapsKeys.length === 0) {
      console.log('  ❌ Nessuna chiave Google Maps trovata nel database\n');
    } else {
      googleMapsKeys.forEach(key => {
        console.log(`  ✅ Trovata per organization: ${key.organization.name}`);
      });
    }
    
    // 3. Verifica organizations
    console.log('\n🏢 Organizations nel sistema:');
    const organizations = await prisma.organization.findMany();
    
    organizations.forEach(org => {
      console.log(`  - ${org.name} (ID: ${org.id})`);
    });
    
    // 4. Verifica utenti SUPER_ADMIN
    console.log('\n👤 Utenti SUPER_ADMIN:');
    const superAdmins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      include: { organization: true }
    });
    
    superAdmins.forEach(user => {
      console.log(`  - ${user.email}`);
      console.log(`    Organization: ${user.organization.name} (ID: ${user.organizationId})`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
checkApiKeys();
