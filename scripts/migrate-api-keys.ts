/**
 * Script di Migrazione API Keys da .env a Database
 * 
 * IMPORTANTE: Questo script legge le keys dall'archivio backup
 * e le salva nel database in modo sicuro
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Path del backup dove ci sono le keys vere
const BACKUP_ENV_PATH = '/Users/lucamambelli/Desktop/Richiesta-Assistenza/DOCUMENTAZIONE/ARCHIVIO/cleanup-temp/BACKUP-EMERGENZA/config-20250903-085723/backend.env';

interface ApiKeyConfig {
  id: string;
  key: string;
  name: string;
  service: string;
  permissions?: any;
  isActive: boolean;
}

async function readEnvFile(filePath: string): Promise<Record<string, string>> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const env: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

async function migrateApiKeys() {
  console.log('🔑 Inizio migrazione API Keys da .env a Database\n');

  try {
    // Leggi le keys dal backup
    console.log('📖 Lettura keys dal backup...');
    const backupEnv = await readEnvFile(BACKUP_ENV_PATH);
    
    const keysToMigrate: ApiKeyConfig[] = [
      {
        id: 'google-maps-api',
        key: backupEnv.GOOGLE_MAPS_API_KEY || '',
        name: 'Google Maps API Key',
        service: 'GOOGLE_MAPS',
        permissions: {
          apis: ['geocoding', 'directions', 'places', 'maps-javascript']
        },
        isActive: true
      },
      {
        id: 'openai-api',
        key: backupEnv.OPENAI_API_KEY || '',
        name: 'OpenAI API Key',
        service: 'OPENAI',
        permissions: {
          models: ['gpt-4', 'gpt-3.5-turbo', 'text-embedding-3-small']
        },
        isActive: true
      },
      {
        id: 'stripe-secret',
        key: backupEnv.STRIPE_SECRET_KEY || '',
        name: 'Stripe Secret Key',
        service: 'STRIPE',
        permissions: {
          webhookUrl: 'http://localhost:3200/api/payments/stripe-webhook'
        },
        isActive: true
      },
      {
        id: 'stripe-webhook',
        key: backupEnv.STRIPE_WEBHOOK_SECRET || '',
        name: 'Stripe Webhook Secret',
        service: 'STRIPE_WEBHOOK',
        isActive: true
      },
      {
        id: 'brevo-api',
        key: backupEnv.BREVO_API_KEY || '',
        name: 'Brevo Email API Key',
        service: 'BREVO',
        permissions: {
          email: true,
          smtp: true
        },
        isActive: true
      },
      {
        id: 'google-oauth-client',
        key: backupEnv.GOOGLE_CLIENT_ID || '',
        name: 'Google OAuth Client ID',
        service: 'GOOGLE_OAUTH',
        isActive: true
      },
      {
        id: 'google-oauth-secret',
        key: backupEnv.GOOGLE_CLIENT_SECRET || '',
        name: 'Google OAuth Client Secret',
        service: 'GOOGLE_OAUTH_SECRET',
        isActive: true
      }
    ];

    console.log(`\n📋 Keys da migrare: ${keysToMigrate.length}\n`);

    let migrated = 0;
    let skipped = 0;

    for (const keyConfig of keysToMigrate) {
      // Salta se è un placeholder
      if (!keyConfig.key || 
          keyConfig.key.includes('your_') || 
          keyConfig.key.includes('INSERISCI') ||
          keyConfig.key.includes('_here')) {
        console.log(`⚠️  Skipping ${keyConfig.name} - placeholder o vuota`);
        skipped++;
        continue;
      }

      try {
        // Controlla se esiste già
        const existing = await prisma.apiKey.findUnique({
          where: { service: keyConfig.service }
        });

        if (existing) {
          // Aggiorna
          await prisma.apiKey.update({
            where: { service: keyConfig.service },
            data: {
              key: keyConfig.key,
              name: keyConfig.name,
              permissions: keyConfig.permissions,
              isActive: keyConfig.isActive,
              updatedAt: new Date()
            }
          });
          console.log(`✅ Aggiornata: ${keyConfig.name}`);
        } else {
          // Crea nuova
          await prisma.apiKey.create({
            data: {
              id: keyConfig.id,
              key: keyConfig.key,
              name: keyConfig.name,
              service: keyConfig.service,
              permissions: keyConfig.permissions,
              isActive: keyConfig.isActive
            }
          });
          console.log(`✅ Creata: ${keyConfig.name}`);
        }
        
        migrated++;
      } catch (error: any) {
        console.error(`❌ Errore migrando ${keyConfig.name}:`, error.message);
      }
    }

    console.log(`\n📊 Riepilogo migrazione:`);
    console.log(`   ✅ Migrate: ${migrated}`);
    console.log(`   ⚠️  Saltate: ${skipped}`);
    console.log(`   📦 Totale: ${keysToMigrate.length}`);

    // Verifica le keys migrate
    console.log(`\n🔍 Verifica keys nel database:`);
    const allKeys = await prisma.apiKey.findMany({
      select: {
        service: true,
        name: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { service: 'asc' }
    });

    console.log(`\n📋 Keys nel database (${allKeys.length}):`);
    allKeys.forEach(key => {
      const status = key.isActive ? '🟢' : '🔴';
      console.log(`   ${status} ${key.service.padEnd(25)} - ${key.name}`);
    });

    console.log('\n✅ Migrazione completata con successo!');
    console.log('\n⚠️  PROSSIMO STEP:');
    console.log('   1. Verifica che tutto funzioni');
    console.log('   2. Rimuovi le keys dal .env (lascia solo placeholder)');
    console.log('   3. Aggiorna i services per usare il DB');
    
  } catch (error: any) {
    console.error('\n❌ Errore durante la migrazione:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui migrazione
migrateApiKeys()
  .then(() => {
    console.log('\n🎉 Script completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script fallito:', error);
    process.exit(1);
  });
