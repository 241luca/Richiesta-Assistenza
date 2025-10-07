import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugRequestCreation() {
  try {
    console.log('🔍 DEBUG CREAZIONE RICHIESTA E NOTIFICHE\n');
    console.log('=' .repeat(50));
    
    const superAdminId = '525304b0-88b7-4c57-8fee-090220953b10';
    
    // 1. Verifica ultima richiesta creata
    console.log('\n📋 ULTIMA RICHIESTA CREATA:');
    const lastRequest = await prisma.assistanceRequest.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        },
        category: true
      }
    });
    
    if (lastRequest) {
      console.log(`   ID: ${lastRequest.id}`);
      console.log(`   Titolo: "${lastRequest.title}"`);
      console.log(`   Cliente: ${lastRequest.client.email}`);
      console.log(`   Creata: ${lastRequest.createdAt.toLocaleString()}`);
      
      // 2. Cerca notifiche per questa richiesta
      console.log('\n🔍 NOTIFICHE PER QUESTA RICHIESTA:');
      
      // Cerca per tipo NEW_REQUEST
      const newRequestNotifs = await prisma.notification.findMany({
        where: {
          type: 'NEW_REQUEST',
          createdAt: {
            gte: new Date(lastRequest.createdAt.getTime() - 60000) // Ultimi 60 secondi dalla creazione
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
      
      if (newRequestNotifs.length > 0) {
        console.log(`   ✅ Trovate ${newRequestNotifs.length} notifiche NEW_REQUEST:`);
        newRequestNotifs.forEach(n => {
          console.log(`      - Per: ${n.recipient.email} (${n.recipient.role})`);
          console.log(`        Contenuto: ${n.content}`);
        });
      } else {
        console.log('   ❌ NESSUNA NOTIFICA NEW_REQUEST TROVATA!');
      }
      
      // Cerca notifiche con il titolo della richiesta nel contenuto
      const notifsByContent = await prisma.notification.findMany({
        where: {
          content: {
            contains: lastRequest.title
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
      
      if (notifsByContent.length > 0) {
        console.log(`\n   📝 Notifiche che menzionano "${lastRequest.title}":`);
        notifsByContent.forEach(n => {
          console.log(`      - ${n.type} per ${n.recipient.email}`);
        });
      }
      
      // 3. Verifica se il SUPER_ADMIN ha ricevuto notifiche
      console.log('\n👤 NOTIFICHE PER SUPER_ADMIN:');
      const superAdminNotifs = await prisma.notification.findMany({
        where: {
          recipientId: superAdminId,
          createdAt: {
            gte: new Date(lastRequest.createdAt.getTime() - 60000)
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      if (superAdminNotifs.length > 0) {
        console.log(`   Trovate ${superAdminNotifs.length} notifiche recenti:`);
        superAdminNotifs.forEach(n => {
          console.log(`      - [${n.type}] ${n.title}`);
          console.log(`        ${n.content}`);
        });
      } else {
        console.log('   ❌ Nessuna notifica recente per SUPER_ADMIN!');
      }
      
      // 4. Verifica chi ha creato la richiesta
      console.log('\n🤔 CHI HA CREATO LA RICHIESTA?');
      if (lastRequest.clientId === superAdminId) {
        console.log('   ⚠️  LA RICHIESTA È STATA CREATA DAL SUPER_ADMIN STESSO!');
        console.log('   Questo potrebbe essere il problema.');
        console.log('   Il sistema potrebbe non inviare notifiche a chi crea la richiesta.');
      } else {
        console.log('   ✅ Creata da un altro utente');
      }
      
    } else {
      console.log('   Nessuna richiesta trovata');
    }
    
    // 5. Verifica gli admin nel sistema
    console.log('\n👥 ADMIN NEL SISTEMA:');
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
    
    admins.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role})`);
      console.log(`     ID: ${admin.id}`);
      if (admin.id === superAdminId) {
        console.log(`     ^ Questo sei tu!`);
      }
    });
    
    // 6. Test invio notifica diretta
    console.log('\n🧪 TEST: Creo notifica diretta per SUPER_ADMIN...');
    try {
      const testNotif = await prisma.notification.create({
        data: {
          id: require('crypto').randomUUID(),
          type: 'NEW_REQUEST',
          title: 'Test: Nuova richiesta di assistenza',
          content: 'Questa è una notifica di test per verificare il sistema',
          recipientId: superAdminId,
          priority: 'HIGH',
          isRead: false
        }
      });
      console.log('   ✅ Notifica di test creata con successo!');
      console.log('   Controlla nel frontend se la vedi.');
    } catch (error) {
      console.log('   ❌ Errore creazione notifica:', error);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRequestCreation();
