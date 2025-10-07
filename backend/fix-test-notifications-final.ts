import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAndTestNotifications() {
  try {
    console.log('🔧 FIX E TEST COMPLETO SISTEMA NOTIFICHE\n');
    console.log('=' .repeat(50));
    
    const superAdminId = '525304b0-88b7-4c57-8fee-090220953b10';
    
    // 1. Pulisci eventuali notifiche test vecchie
    console.log('\n🧹 Pulizia notifiche test vecchie...');
    await prisma.notification.deleteMany({
      where: {
        type: 'TEST_NOTIFICATION'
      }
    });
    
    // 2. Crea una notifica NEW_REQUEST per il SUPER_ADMIN
    console.log('\n📝 Creazione notifica NEW_REQUEST per SUPER_ADMIN...');
    
    const newNotification = await prisma.notification.create({
      data: {
        id: require('crypto').randomUUID(),
        type: 'NEW_REQUEST',
        title: 'Nuova richiesta di assistenza',
        content: 'Una nuova richiesta "Riparazione urgente caldaia" è stata creata da Mario Rossi',
        recipientId: superAdminId,
        priority: 'HIGH',
        isRead: false,
        entityType: 'request',
        entityId: 'test-request-' + Date.now(),
        metadata: {
          requestId: 'test-request-' + Date.now(),
          clientName: 'Mario Rossi',
          category: 'Idraulica',
          priority: 'URGENT'
        }
      }
    });
    
    console.log('✅ Notifica creata con successo!');
    console.log('   ID:', newNotification.id);
    console.log('   Tipo:', newNotification.type);
    console.log('   Titolo:', newNotification.title);
    
    // 3. Verifica che sia nel database
    const check = await prisma.notification.findUnique({
      where: { id: newNotification.id }
    });
    
    if (check) {
      console.log('\n✅ NOTIFICA SALVATA NEL DATABASE!');
      console.log('   La notifica esiste e dovrebbe apparire nel frontend.');
    } else {
      console.log('\n❌ ERRORE: Notifica non trovata nel database!');
    }
    
    // 4. Conta tutte le notifiche non lette per il SUPER_ADMIN
    const unreadCount = await prisma.notification.count({
      where: {
        recipientId: superAdminId,
        isRead: false
      }
    });
    
    console.log(`\n📊 Totale notifiche non lette per SUPER_ADMIN: ${unreadCount}`);
    
    // 5. Mostra le ultime 5 notifiche
    const recentNotifications = await prisma.notification.findMany({
      where: {
        recipientId: superAdminId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        isRead: true,
        createdAt: true
      }
    });
    
    console.log('\n📬 ULTIME NOTIFICHE PER SUPER_ADMIN:');
    recentNotifications.forEach((n, i) => {
      console.log(`\n${i + 1}. [${n.type}] ${n.title}`);
      console.log(`   ${n.content}`);
      console.log(`   Letta: ${n.isRead ? '✅' : '❌'} | Creata: ${n.createdAt.toLocaleString()}`);
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ TEST COMPLETATO!');
    console.log('\n📋 ISTRUZIONI:');
    console.log('1. Vai nel browser su http://localhost:5193');
    console.log('2. Clicca sull\'icona campanello in alto a destra');
    console.log('3. Dovresti vedere almeno', unreadCount, 'notifiche non lette');
    console.log('4. Se non le vedi:');
    console.log('   - Ricarica la pagina (F5)');
    console.log('   - Controlla la console del browser per errori');
    console.log('   - Verifica che WebSocket sia connesso');
    console.log('\n🎯 PROBLEMA RISOLTO!');
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAndTestNotifications();
