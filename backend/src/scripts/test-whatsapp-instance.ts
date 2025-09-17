/**
 * Script per testare la creazione istanza WhatsApp
 */

import axios from 'axios';
import { prisma } from '../config/database';

async function testWhatsAppInstance() {
  try {
    console.log('🔧 Test creazione istanza WhatsApp...\n');
    
    // 1. Verifica configurazione
    const config = await prisma.apiKey.findUnique({
      where: { service: 'whatsapp' }
    });
    
    if (!config) {
      console.error('❌ Configurazione WhatsApp non trovata nel database!');
      console.log('Esegui prima: npx tsx src/scripts/setup-whatsapp-config.ts');
      return;
    }
    
    console.log('✅ Configurazione trovata:');
    console.log('- Token:', config.key.substring(0, 10) + '...');
    console.log('- Permissions:', JSON.stringify(config.permissions, null, 2));
    
    // 2. Chiama API SendApp per creare istanza
    const baseURL = (config.permissions as any)?.baseURL || 'https://app.sendapp.cloud/api';
    const accessToken = config.key;
    
    console.log('\n📡 Chiamata API SendApp...');
    console.log('URL:', `${baseURL}/create_instance`);
    
    try {
      const response = await axios.get(`${baseURL}/create_instance`, {
        params: {
          access_token: accessToken
        }
      });
      
      console.log('\n✅ Risposta SendApp:');
      console.log(JSON.stringify(response.data, null, 2));
      
      // 3. Salva Instance ID nel database
      if (response.data?.instance_id) {
        const updatedConfig = {
          ...(config.permissions as any),
          instanceId: response.data.instance_id
        };
        
        await prisma.apiKey.update({
          where: { service: 'whatsapp' },
          data: {
            permissions: updatedConfig,
            updatedAt: new Date()
          }
        });
        
        console.log('\n✅ Instance ID salvato nel database:', response.data.instance_id);
        console.log('\n🎯 PROSSIMI PASSI:');
        console.log('1. Vai su http://localhost:5193/admin/whatsapp');
        console.log('2. Clicca su "Genera QR Code"');
        console.log('3. Scansiona con WhatsApp');
      } else {
        console.log('\n⚠️ Risposta senza instance_id. Verifica il formato della risposta.');
      }
      
    } catch (apiError: any) {
      console.error('\n❌ Errore chiamata API SendApp:');
      console.error('Status:', apiError.response?.status);
      console.error('Data:', apiError.response?.data);
      console.error('Message:', apiError.message);
      
      if (apiError.response?.status === 401) {
        console.log('\n⚠️ Token non valido o scaduto. Verifica il token su SendApp.');
      }
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il test
testWhatsAppInstance();
