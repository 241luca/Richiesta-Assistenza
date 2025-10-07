import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllNotifications() {
  try {
    console.log('📊 STATO COMPLETO SISTEMA NOTIFICHE\n');
    console.log('=' .repeat(50));
    
    // Conta totale notifiche
    const total = await prisma.notification.count();
    const unread = await prisma.notification.count({
      where: { isRead: false }
    });
    
    console.log(`\n📈 STATISTICHE:`);
    console.log(`   Notifiche totali: ${total}`);
    console.log(`   Non lette: ${unread}`);
    
    // Mostra ultime 10 notifiche
    console.log(`\n📬 ULTIME NOTIFICHE CREATE:`);
    const recent = await prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        recipient: {
          select: {
            email: true,
            role: true
          }
        }
      }
    });
    
    recent.forEach((n, i) => {
      console.log(`\n${i + 1}. [${n.type}] ${n.title}`);
      console.log(`   Per: ${n.recipient.email} (${n.recipient.role})`);
      console.log(`   Contenuto: ${n.content?.substring(0, 100)}...`);
      console.log(`   Priorità: ${n.priority} | Letta: ${n.isRead ? '✅' : '❌'}`);
      console.log(`   Creata: ${n.createdAt.toLocaleString()}`);
    });
    
    // Verifica notifiche per tipo
    console.log(`\n📋 NOTIFICHE PER TIPO:`);
    const types = await prisma.notification.groupBy({
      by: ['type'],
      _count: true
    });
    
    types.forEach(t => {
      console.log(`   ${t.type}: ${t._count} notifiche`);
    });
    
    console.log('\n✅ Sistema notifiche operativo!');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllNotifications();
