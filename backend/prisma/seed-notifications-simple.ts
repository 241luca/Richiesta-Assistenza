import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function seedNotifications() {
  console.log('📧 POPOLAMENTO SISTEMA NOTIFICHE...\n')

  try {
    // 1. CHANNELS - con struttura CORRETTA dello schema esistente
    console.log('📡 Creazione canali...')
    
    const channels = [
      { 
        code: 'email', 
        name: 'Email', 
        type: 'email',
        provider: 'smtp',
        configuration: { host: 'smtp.example.com', port: 587 },
        isActive: true 
      },
      { 
        code: 'websocket', 
        name: 'WebSocket', 
        type: 'websocket',
        provider: null,
        configuration: {},
        isActive: true 
      },
      { 
        code: 'sms', 
        name: 'SMS', 
        type: 'sms',
        provider: 'twilio',
        configuration: {},
        isActive: false 
      },
      { 
        code: 'push', 
        name: 'Push', 
        type: 'push',
        provider: 'firebase',
        configuration: {},
        isActive: false 
      }
    ]

    for (const ch of channels) {
      await prisma.notificationChannel.upsert({
        where: { code: ch.code },
        update: {},
        create: {
          id: uuidv4(),
          code: ch.code,
          name: ch.name,
          type: ch.type,
          provider: ch.provider,
          configuration: ch.configuration,
          isActive: ch.isActive,
          isDefault: ch.code === 'email',
          priority: 0,
          updatedAt: new Date()
        }
      })
      console.log(`✅ Canale: ${ch.name} (${ch.type})`)
    }

    // REPORT
    const totals = {
      channels: await prisma.notificationChannel.count()
    }

    console.log(`
===========================================
📊 NOTIFICHE CONFIGURATE:
- Canali: ${totals.channels}
===========================================
`)

  } catch (error) {
    console.error('❌ Errore:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui
seedNotifications()
