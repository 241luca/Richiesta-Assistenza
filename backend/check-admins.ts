import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    console.log('🔍 Verifica presenza ADMIN nel sistema...\n');
    
    // Conta gli admin
    const adminCount = await prisma.user.count({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] }
      }
    });
    
    console.log(`📊 Admin trovati: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('❌ NESSUN ADMIN NEL SISTEMA!');
      console.log('   Le notifiche non vengono inviate perché non ci sono admin.');
      console.log('\n💡 SOLUZIONE: Crea un utente admin o promuovi un utente esistente.');
      
      // Mostra utenti esistenti
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          firstName: true,
          lastName: true
        }
      });
      
      console.log('\n👥 Utenti esistenti:');
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ID: ${user.id}`);
      });
      
      if (users.length > 0) {
        console.log('\n🔧 Per promuovere un utente ad ADMIN, esegui:');
        console.log(`   npx prisma studio`);
        console.log(`   Poi cambia il role in ADMIN o SUPER_ADMIN`);
      }
    } else {
      // Mostra gli admin
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPER_ADMIN'] }
        },
        select: {
          email: true,
          role: true,
          firstName: true,
          lastName: true
        }
      });
      
      console.log('\n✅ Admin presenti nel sistema:');
      admins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.role})`);
      });
    }
    
    // Verifica anche le notifiche esistenti
    const notificationCount = await prisma.notification.count();
    console.log(`\n📬 Notifiche totali nel database: ${notificationCount}`);
    
    // Mostra ultime 5 notifiche
    const recentNotifications = await prisma.notification.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        title: true,
        recipientId: true,
        isRead: true,
        createdAt: true
      }
    });
    
    if (recentNotifications.length > 0) {
      console.log('\n📋 Ultime notifiche:');
      recentNotifications.forEach(notif => {
        console.log(`   - ${notif.title} (${notif.type}) - ${notif.isRead ? 'Letta' : 'Non letta'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();
