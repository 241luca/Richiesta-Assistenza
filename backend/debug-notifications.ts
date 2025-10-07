import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugNotifications() {
  try {
    const userId = '525304b0-88b7-4c57-8fee-090220953b10';
    
    console.log('🔍 DEBUG COMPLETO NOTIFICHE PER SUPER_ADMIN\n');
    console.log('=' .repeat(50));
    
    // 1. Verifica utente
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        role: true,
        firstName: true,
        lastName: true
      }
    });
    
    console.log('\n👤 TUO ACCOUNT:');
    console.log(`   Email: ${user?.email}`);
    console.log(`   Ruolo: ${user?.role} ✅`);
    console.log(`   Nome: ${user?.firstName} ${user?.lastName}`);
    
    // 2. Controlla TUTTE le notifiche nel database
    console.log('\n📊 NOTIFICHE NEL DATABASE:');
    const allNotifications = await prisma.notification.count();
    const yourNotifications = await prisma.notification.count({
      where: { recipientId: userId }
    });
    
    console.log(`   Totali nel sistema: ${allNotifications}`);
    console.log(`   Tue notifiche: ${yourNotifications}`);
    
    // 3. Mostra le tue ultime notifiche
    if (yourNotifications > 0) {
      console.log('\n📬 LE TUE ULTIME NOTIFICHE:');
      const notifications = await prisma.notification.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true,
          priority: true
        }
      });
      
      notifications.forEach((n, i) => {
        console.log(`\n   ${i + 1}. ${n.title}`);
        console.log(`      Tipo: ${n.type}`);
        console.log(`      Messaggio: ${n.message?.substring(0, 100)}...`);
        console.log(`      Priorità: ${n.priority}`);
        console.log(`      Letta: ${n.isRead ? 'Sì' : 'NO'}`);
        console.log(`      Creata: ${n.createdAt.toLocaleString()}`);
      });
    }
    
    // 4. Verifica l'ultima richiesta creata
    console.log('\n📋 ULTIME RICHIESTE CREATE:');
    const recentRequests = await prisma.assistanceRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: {
        id: true,
        title: true,
        clientId: true,
        createdAt: true,
        client: {
          select: {
            email: true
          }
        }
      }
    });
    
    if (recentRequests.length > 0) {
      recentRequests.forEach((r, i) => {
        console.log(`\n   ${i + 1}. "${r.title}"`);
        console.log(`      ID: ${r.id}`);
        console.log(`      Cliente: ${r.client.email}`);
        console.log(`      Creata: ${r.createdAt.toLocaleString()}`);
        console.log(`      Da te: ${r.clientId === userId ? 'SÌ' : 'NO'}`);
      });
      
      // 5. Verifica se le notifiche sono state create per l'ultima richiesta
      const lastRequestId = recentRequests[0].id;
      console.log('\n🔍 VERIFICA NOTIFICHE PER ULTIMA RICHIESTA:');
      
      const notificationsForRequest = await prisma.notification.findMany({
        where: {
          OR: [
            { entityId: lastRequestId },
            { message: { contains: recentRequests[0].title } }
          ]
        },
        select: {
          recipientId: true,
          type: true,
          title: true,
          recipient: {
            select: {
              email: true,
              role: true
            }
          }
        }
      });
      
      if (notificationsForRequest.length > 0) {
        console.log(`   Trovate ${notificationsForRequest.length} notifiche per questa richiesta:`);
        notificationsForRequest.forEach(n => {
          console.log(`   - ${n.title} → ${n.recipient.email} (${n.recipient.role})`);
        });
      } else {
        console.log('   ❌ NESSUNA NOTIFICA CREATA PER QUESTA RICHIESTA!');
        console.log('   Questo è il problema!');
      }
    }
    
    // 6. Test query che usa il service
    console.log('\n🧪 TEST QUERY DIRETTA:');
    const testNotifications = await prisma.notification.findMany({
      where: {
        recipientId: userId,
        type: 'NEW_REQUEST'
      },
      select: {
        id: true,
        title: true,
        createdAt: true
      }
    });
    
    console.log(`   Notifiche NEW_REQUEST per te: ${testNotifications.length}`);
    
    // 7. Verifica errori nei log
    console.log('\n💡 POSSIBILI CAUSE:');
    if (yourNotifications === 0) {
      console.log('   1. Il notification.service.ts potrebbe avere errori');
      console.log('   2. Le notifiche potrebbero non essere salvate nel DB');
      console.log('   3. Il campo recipientId potrebbe essere sbagliato');
    } else {
      console.log('   1. Le notifiche esistono nel DB');
      console.log('   2. Potrebbe essere un problema del frontend');
      console.log('   3. O del WebSocket per il real-time');
    }
    
  } catch (error) {
    console.error('❌ ERRORE:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugNotifications();
