import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Encryption settings
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.scryptSync('default-encryption-key', 'salt', 32);
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

async function updateGoogleMapsApiKey() {
  try {
    console.log('🔄 Updating Google Maps API Key in database...\n');
    
    // La nuova chiave API che funziona
    const newApiKey = 'AIzaSyB7zix_8OrL9ks3d6XcjHShHIQDDhI1lCI';
    
    // Encrypt the API key
    const encryptedKey = encrypt(newApiKey);
    
    // Get admin users (they manage API keys)
    const adminUsers = await prisma.user.findMany({
      where: {
        role: {
          in: ['ADMIN', 'SUPER_ADMIN']
        }
      }
    });
    
    if (adminUsers.length === 0) {
      console.log('⚠️ No admin users found. Creating API key for system-wide use...');
      
      // Create a system-wide API key (not tied to a specific user)
      const existingSystemKey = await prisma.apiKey.findFirst({
        where: {
          service: 'GOOGLE_MAPS',
          userId: null // System-wide key
        }
      });
      
      if (existingSystemKey) {
        // Update existing key
        await prisma.apiKey.update({
          where: { id: existingSystemKey.id },
          data: {
            encryptedKey: encryptedKey,
            isActive: true,
            configuration: {
              enabled: true,
              apis: ['maps', 'geocoding', 'places', 'distancematrix'],
              lastUpdated: new Date().toISOString()
            }
          }
        });
        console.log('✅ Updated existing system-wide Google Maps API key');
      } else {
        // Create new system-wide key
        await prisma.apiKey.create({
          data: {
            service: 'GOOGLE_MAPS',
            encryptedKey: encryptedKey,
            isActive: true,
            configuration: {
              enabled: true,
              apis: ['maps', 'geocoding', 'places', 'distancematrix'],
              createdAt: new Date().toISOString()
            }
            // Note: userId is not set, making it system-wide
          }
        });
        console.log('✅ Created new system-wide Google Maps API key');
      }
    } else {
      // Update or create API key for the first admin user
      const adminUser = adminUsers[0];
      console.log(`📍 Setting API key for admin user: ${adminUser.email}`);
      
      // Check if Google Maps API key exists for this user
      const existingKey = await prisma.apiKey.findFirst({
        where: {
          userId: adminUser.id,
          service: 'GOOGLE_MAPS'
        }
      });
      
      if (existingKey) {
        // Update existing key
        await prisma.apiKey.update({
          where: { id: existingKey.id },
          data: {
            encryptedKey: encryptedKey,
            isActive: true,
            configuration: {
              enabled: true,
              apis: ['maps', 'geocoding', 'places', 'distancematrix'],
              lastUpdated: new Date().toISOString()
            }
          }
        });
        console.log('✅ Updated existing Google Maps API key');
      } else {
        // Create new key
        await prisma.apiKey.create({
          data: {
            userId: adminUser.id,
            service: 'GOOGLE_MAPS',
            encryptedKey: encryptedKey,
            isActive: true,
            configuration: {
              enabled: true,
              apis: ['maps', 'geocoding', 'places', 'distancematrix'],
              createdAt: new Date().toISOString()
            }
          }
        });
        console.log('✅ Created new Google Maps API key');
      }
    }
    
    console.log('\n✅ Google Maps API key successfully updated!');
    console.log('📌 The key is now stored encrypted in the database');
    console.log('🔐 The system will use this key for all Google Maps operations');
    console.log('\n📝 Note: The system will also fallback to .env file if needed\n');
    
  } catch (error) {
    console.error('❌ Error updating Google Maps API key:', error);
    
    // If the ApiKey table doesn't exist, show helpful message
    if (error instanceof Error && error.message.includes('ApiKey')) {
      console.log('\n📌 It looks like the ApiKey table might not exist.');
      console.log('Run these commands to update the database schema:');
      console.log('  npx prisma generate');
      console.log('  npx prisma db push');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateGoogleMapsApiKey();
