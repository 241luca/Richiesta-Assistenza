import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testNotifications() {
  try {
    const userId = '525304b0-88b7-4c57-8fee-090220953b10'; // Il tuo ID SUPER_ADMIN
    
    console.log('🧪 TEST SISTEMA NOTIFICHE DOPO FIX\n');
    console.log('=' .repeat(50));
    
    // 1. Crea una notifica di test
    console.log('\n📝 Creazione notifica di test...');
    const testNotification = await prisma.notification.create({
      data: {
        id: require('crypto').randomUUID(),
        type: 'TEST_NOTIFICATION',
        title: 'Test Notifica - Sistema Riparato!',
        content: 'Se vedi questa notifica, il sistema funziona! 🎉', // USA CONTENT!
        recipientId: userId,
        priority: 'HIGH',
        isRead: false
      }
    });
    
    console.log('✅ Notifica creata con successo!');
    console.log('   ID:', testNotification.id);
    console.log('   Titolo:', testNotification.title);
    console.log('   Contenuto:', testNotification.content);
    
    // 2. Verifica che si possa leggere
    console.log('\n📖 Lettura notifiche...');
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        type: true,
        title: true,
        content: true, // USA CONTENT!
        isRead: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Trovate ${notifications.length} notifiche:`);
    notifications.forEach((n, i) => {
      console.log(`\n   ${i + 1}. ${n.title}`);
      console.log(`      Contenuto: ${n.content}`);
      console.log(`      Letta: ${n.isRead ? 'Sì' : 'NO'}`);
    });
    
    console.log('\n🎉 SISTEMA NOTIFICHE FUNZIONANTE!');
    console.log('   Ora prova a creare una richiesta e dovresti vedere le notifiche!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();
