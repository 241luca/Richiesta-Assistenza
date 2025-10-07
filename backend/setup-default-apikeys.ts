import { prisma } from './src/config/database';
import { apiKeyService } from './src/services/apiKey.service';
import { logger } from './src/utils/logger';

async function setupDefaultApiKeys() {
  try {
    console.log('🔧 Setting up default API keys...\n');
    
    // 1. Trova la prima organizzazione
    const org = await prisma.organization.findFirst();
    if (!org) {
      console.error('❌ No organization found. Please create an organization first.');
      return;
    }
    
    console.log(`Using organization: ${org.name} (${org.id})\n`);
    
    // 2. Trova un utente SUPER_ADMIN
    const admin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });
    
    if (!admin) {
      console.error('❌ No SUPER_ADMIN user found.');
      return;
    }
    
    console.log(`Using admin user: ${admin.email}\n`);
    
    // 3. Crea o aggiorna le chiavi API di default
    const defaultKeys = [
      {
        service: 'GOOGLE_MAPS' as const,
        key: 'AIzaSyB-default-google-maps-key-change-me',
        configuration: {
          libraries: ['places', 'geometry'],
          region: 'IT',
          language: 'it'
        }
      },
      {
        service: 'BREVO' as const,
        key: 'xkeysib-default-brevo-key-change-me',
        configuration: {
          sender_email: 'noreply@example.com',
          sender_name: 'Richiesta Assistenza'
        }
      },
      {
        service: 'OPENAI' as const,
        key: 'sk-default-openai-key-change-me',
        configuration: {
          model: 'gpt-3.5-turbo',
          max_tokens: 2048
        }
      }
    ];
    
    for (const keyData of defaultKeys) {
      try {
        console.log(`Setting up ${keyData.service}...`);
        
        // Verifica se esiste già
        const existing = await prisma.apiKey.findFirst({
          where: {
            service: keyData.service,
            organizationId: org.id
          }
        });
        
        if (existing) {
          console.log(`  ✅ ${keyData.service} already exists (ID: ${existing.id})`);
        } else {
          // Crea nuova chiave
          const newKey = await prisma.apiKey.create({
            data: {
              service: keyData.service,
              key: keyData.key,
              configuration: keyData.configuration,
              isActive: true,
              organizationId: org.id,
              updatedById: admin.id
            }
          });
          console.log(`  ✅ Created ${keyData.service} (ID: ${newKey.id})`);
        }
      } catch (error: any) {
        console.error(`  ❌ Error with ${keyData.service}:`, error.message);
      }
    }
    
    // 4. Verifica che tutte le chiavi siano presenti
    console.log('\n📊 Final check:');
    const allKeys = await prisma.apiKey.findMany({
      where: { organizationId: org.id },
      select: {
        service: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log(`Total API keys for ${org.name}: ${allKeys.length}`);
    allKeys.forEach(key => {
      console.log(`  - ${key.service}: ${key.isActive ? '✅ Active' : '❌ Inactive'}`);
    });
    
    console.log('\n🎉 Setup complete!');
    console.log('You can now access the API keys at:');
    console.log('  http://localhost:5193/admin/api-keys\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup
setupDefaultApiKeys().catch(console.error);
