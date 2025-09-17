#!/bin/bash

echo "🔍 Verificando presenza WhatsApp nel database..."

cd backend

# Crea uno script TypeScript per verificare
cat > check-whatsapp.ts << 'EOF'
import { prisma } from './src/config/database';

async function checkWhatsApp() {
  try {
    console.log('\n📊 Verificando tabella ApiKey...\n');
    
    // Conta tutti i record
    const totalCount = await prisma.apiKey.count();
    console.log(`Totale API Keys nel database: ${totalCount}`);
    
    // Cerca WhatsApp
    const whatsappRecord = await prisma.apiKey.findFirst({
      where: { service: 'whatsapp' }
    });
    
    if (whatsappRecord) {
      console.log('\n✅ WhatsApp TROVATO nel database:');
      console.log('- ID:', whatsappRecord.id);
      console.log('- Service:', whatsappRecord.service);
      console.log('- Name:', whatsappRecord.name);
      console.log('- Active:', whatsappRecord.isActive);
      console.log('- Has Key:', !!whatsappRecord.key);
    } else {
      console.log('\n❌ WhatsApp NON trovato nel database');
      console.log('Creazione record WhatsApp...');
      
      // Crea il record
      const newRecord = await prisma.apiKey.create({
        data: {
          id: `whatsapp_${Date.now()}`,
          service: 'whatsapp',
          key: '',
          name: 'WhatsApp Integration (SendApp)',
          permissions: {
            baseURL: 'https://app.sendapp.cloud/api',
            instanceId: '',
            webhookUrl: ''
          },
          isActive: false,
          rateLimit: 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
      
      console.log('✅ WhatsApp creato con ID:', newRecord.id);
    }
    
    // Lista tutti i servizi
    console.log('\n📋 Tutti i servizi presenti:');
    const allServices = await prisma.apiKey.findMany({
      select: { service: true, name: true, isActive: true }
    });
    
    allServices.forEach(s => {
      console.log(`- ${s.service}: ${s.name} (${s.isActive ? 'Attivo' : 'Non attivo'})`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkWhatsApp();
EOF

# Esegui lo script
npx ts-node check-whatsapp.ts

# Pulisci
rm check-whatsapp.ts

echo "✅ Verifica completata!"
