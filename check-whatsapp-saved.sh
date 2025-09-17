#!/bin/bash

echo "🔍 Verificando WhatsApp nel database..."

cd backend

npx ts-node -e "
const { prisma } = require('./src/config/database');

async function checkWhatsApp() {
  try {
    const whatsapp = await prisma.apiKey.findFirst({
      where: { service: 'whatsapp' }
    });
    
    if (whatsapp) {
      console.log('✅ WhatsApp trovato nel database:');
      console.log('ID:', whatsapp.id);
      console.log('Service:', whatsapp.service);
      console.log('Name:', whatsapp.name);
      console.log('Key presente:', !!whatsapp.key);
      console.log('Key value:', whatsapp.key ? whatsapp.key.substring(0, 20) + '...' : 'VUOTO');
      console.log('IsActive:', whatsapp.isActive);
      console.log('Permissions:', JSON.stringify(whatsapp.permissions, null, 2));
      console.log('LastUsedAt:', whatsapp.lastUsedAt);
      console.log('UpdatedAt:', whatsapp.updatedAt);
    } else {
      console.log('❌ WhatsApp NON trovato nel database');
    }
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

checkWhatsApp();
"
