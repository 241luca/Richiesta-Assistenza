/**
 * Script per verificare le configurazioni API nel database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkApiKeys() {
  try {
    console.log('🔍 Verifica configurazioni API Keys nel database\n');
    console.log('===========================================\n');
    
    // Trova TUTTE le API keys
    const allKeys = await prisma.apiKey.findMany({
      include: {
        user: {
          select: {
            email: true
          }
        }
      }
    });
    
    if (allKeys.length === 0) {
      console.log('❌ Nessuna API Key trovata nel database');
    } else {
      console.log(`✅ Trovate ${allKeys.length} configurazioni:\n`);
      
      allKeys.forEach((key, index) => {
        console.log(`📌 Configurazione ${index + 1}:`);
        console.log(`   ID: ${key.id}`);
        console.log(`   Nome: ${key.name || 'N/A'}`);
        console.log(`   Service: "${key.service}"`);
        console.log(`   User: ${key.user?.email || 'N/A'}`);
        console.log(`   Key/Token: ${key.key ? key.key.substring(0,8) + '****' : 'Non configurato'}`);
        console.log(`   Attiva: ${key.isActive ? '✅' : '❌'}`);
        
        // Estrai dati dalle permissions JSON
        const permissions = key.permissions as any;
        if (permissions) {
          console.log(`   Permissions (JSON):`);
          if (permissions.instanceId) {
            console.log(`     - Instance ID: ${permissions.instanceId}`);
          }
          if (permissions.webhookUrl) {
            console.log(`     - Webhook URL: ${permissions.webhookUrl}`);
          }
          if (Array.isArray(permissions)) {
            console.log(`     - Array: ${permissions.join(', ')}`);
          } else if (typeof permissions === 'object') {
            Object.keys(permissions).forEach(perm => {
              if (perm !== 'instanceId' && perm !== 'webhookUrl') {
                console.log(`     - ${perm}: ${JSON.stringify(permissions[perm])}`);
              }
            });
          }
        }
        
        console.log('---\n');
      });
    }
    
    // Cerca specificamente configurazioni WhatsApp
    console.log('🔍 Ricerca configurazioni WhatsApp:\n');
    
    const whatsappKeys = await prisma.apiKey.findMany({
      where: {
        OR: [
          { service: 'whatsapp' },
          { service: 'WHATSAPP' },
          { service: 'WhatsApp' },
          { name: { contains: 'whatsapp', mode: 'insensitive' } },
          { key: { startsWith: '68c575' } },
          { key: { startsWith: '64833d' } }
        ]
      }
    });
    
    if (whatsappKeys.length > 0) {
      console.log(`✅ Trovate ${whatsappKeys.length} possibili configurazioni WhatsApp:`);
      whatsappKeys.forEach(key => {
        console.log(`\n   ID: ${key.id}`);
        console.log(`   Service (esatto): "${key.service}"`);
        console.log(`   Nome: ${key.name}`);
        console.log(`   Token: ${key.key?.substring(0,12)}****`);
        
        const permissions = key.permissions as any;
        if (permissions && typeof permissions === 'object') {
          console.log(`   Instance ID: ${permissions.instanceId || 'Non configurato'}`);
          console.log(`   Webhook URL: ${permissions.webhookUrl || 'Non configurato'}`);
        }
      });
      
      console.log('\n💡 Usa il valore esatto di "Service" mostrato sopra per aggiornare');
    } else {
      console.log('❌ Nessuna configurazione WhatsApp trovata\n');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
checkApiKeys();
