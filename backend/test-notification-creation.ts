import { PrismaClient } from '@prisma/client';
import { notificationService } from '../src/services/notification.service';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function testDirectNotificationCreation() {
  try {
    console.log('🧪 TEST DIRETTO CREAZIONE NOTIFICA PER ADMIN\n');
    console.log('=' .repeat(50));
    
    // 1. Trova gli admin
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });
    
    console.log(`\n📊 Admin trovati: ${admins.length}`);
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`);
    });
    
    // 2. Simula creazione richiesta
    console.log('\n🔧 Simulo invio notifiche come farebbe request.service.ts...');
    
    for (const admin of admins) {
      console.log(`\n📤 Invio notifica a ${admin.email}...`);
      
      try {
        await notificationService.sendToUser({
          userId: admin.id,
          type: 'NEW_REQUEST',
          title: 'Nuova richiesta di assistenza',
          message: `TEST: Una nuova richiesta "Test Request" è stata creata da Test Client`,
          priority: 'normal',
          data: {
            requestId: 'test-request-id',
            clientName: 'Test Client',
            category: 'Test Category',
            priority: 'MEDIUM'
          },
          channels: ['websocket']
        });
        
        console.log(`   ✅ Notifica inviata con successo!`);
      } catch (error: any) {
        console.log(`   ❌ ERRORE: ${error.message}`);
        console.log(`      Stack:`, error.stack?.split('\n').slice(0, 3).join('\n'));
      }
    }
    
    // 3. Verifica che le notifiche siano state create
    console.log('\n📬 Verifica notifiche create nel database:');
    
    const recentNotifications = await prisma.notification.findMany({
      where: {
        type: 'NEW_REQUEST',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Ultimi 60 secondi
        }
      },
      include: {
        recipient: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });
    
    console.log(`\n   Trovate ${recentNotifications.length} notifiche NEW_REQUEST recenti:`);
    recentNotifications.forEach(n => {
      console.log(`   - Per: ${n.recipient.email} (${n.recipient.role})`);
      console.log(`     Titolo: ${n.title}`);
      console.log(`     Contenuto: ${n.content}`);
      console.log(`     Creata: ${n.createdAt.toLocaleString()}`);
    });
    
    if (recentNotifications.length > 0) {
      console.log('\n✅ NOTIFICHE CREATE CON SUCCESSO!');
      console.log('   Controlla nel frontend se le vedi.');
    } else {
      console.log('\n❌ NESSUNA NOTIFICA CREATA!');
      console.log('   C\'è un problema nel notification service.');
    }
    
  } catch (error: any) {
    console.error('\n❌ ERRORE GENERALE:', error);
    console.log('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il test
testDirectNotificationCreation();
