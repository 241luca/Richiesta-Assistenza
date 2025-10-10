/**
 * Test delle correzioni al sistema di notifiche
 * Esegui con: npx ts-node backend/src/scripts/test-notifications-fix.ts
 */

import { PrismaClient } from '@prisma/client';
import { notificationService } from '../services/notification.service';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Colori per output console
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

async function testNotificationsFix() {
  console.log(`${colors.blue}=================================`);
  console.log('🧪 TEST CORREZIONI NOTIFICHE');
  console.log(`=================================${colors.reset}\n`);

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Creazione notifica con UUID
  console.log(`${colors.yellow}Test 1: Creazione notifica con UUID${colors.reset}`);
  try {
    const testUser = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    if (!testUser) {
      console.log(`${colors.red}❌ Nessun utente di test trovato${colors.reset}`);
      testsFailed++;
    } else {
      const notification = await prisma.notification.create({
        data: {
          id: uuidv4(), // ✅ UUID generato
          type: 'TEST',
          title: 'Test notifica con UUID',
          content: 'Questo è un test del campo content', // ✅ Campo corretto
          recipientId: testUser.id,
          priority: 'HIGH', // ✅ MAIUSCOLO
          isRead: false,
          metadata: { test: true }
        }
      });

      console.log(`${colors.green}✅ Notifica creata con successo:${colors.reset}`);
      console.log(`   ID: ${notification.id}`);
      console.log(`   Priority: ${notification.priority}`);
      console.log(`   Content: ${notification.content}\n`);
      testsPassed++;

      // Cleanup
      await prisma.notification.delete({
        where: { id: notification.id }
      });
    }
  } catch (error) {
    console.log(`${colors.red}❌ Errore: ${error.message}${colors.reset}\n`);
    testsFailed++;
  }

  // Test 2: Invio notifica tramite servizio
  console.log(`${colors.yellow}Test 2: Invio notifica tramite servizio${colors.reset}`);
  try {
    const testUser = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    if (!testUser) {
      console.log(`${colors.red}❌ Nessun utente di test trovato${colors.reset}`);
      testsFailed++;
    } else {
      await notificationService.sendToUser({
        userId: testUser.id,
        type: 'TEST_SERVICE',
        title: 'Test servizio notifiche',
        message: 'Questo test verifica il servizio completo',
        priority: 'urgent', // minuscolo, verrà convertito
        data: {
          testData: 'valore di test',
          timestamp: new Date()
        },
        channels: ['websocket'] // Solo websocket per il test
      });

      // Verifica che sia stata salvata
      const savedNotification = await prisma.notification.findFirst({
        where: {
          recipientId: testUser.id,
          type: 'TEST_SERVICE'
        },
        orderBy: { createdAt: 'desc' }
      });

      if (savedNotification) {
        console.log(`${colors.green}✅ Notifica inviata e salvata:${colors.reset}`);
        console.log(`   ID: ${savedNotification.id}`);
        console.log(`   Priority: ${savedNotification.priority} (convertita in MAIUSCOLO)`);
        console.log(`   Content: ${savedNotification.content}\n`);
        testsPassed++;

        // Cleanup
        await prisma.notification.delete({
          where: { id: savedNotification.id }
        });
      } else {
        console.log(`${colors.red}❌ Notifica non trovata nel database${colors.reset}\n`);
        testsFailed++;
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ Errore: ${error.message}${colors.reset}\n`);
    testsFailed++;
  }

  // Test 3: Verifica conversione priorità
  console.log(`${colors.yellow}Test 3: Conversione priorità${colors.reset}`);
  try {
    const testUser = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    if (!testUser) {
      console.log(`${colors.red}❌ Nessun utente di test trovato${colors.reset}`);
      testsFailed++;
    } else {
      const priorities = ['low', 'normal', 'high', 'urgent'];
      const expectedPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];
      let allCorrect = true;

      for (let i = 0; i < priorities.length; i++) {
        await notificationService.sendToUser({
          userId: testUser.id,
          type: `TEST_PRIORITY_${i}`,
          title: `Test priorità ${priorities[i]}`,
          message: `Test conversione da ${priorities[i]} a ${expectedPriorities[i]}`,
          priority: priorities[i] as any,
          channels: ['websocket']
        });

        const saved = await prisma.notification.findFirst({
          where: {
            recipientId: testUser.id,
            type: `TEST_PRIORITY_${i}`
          },
          orderBy: { createdAt: 'desc' }
        });

        if (saved) {
          if (saved.priority !== expectedPriorities[i]) {
            console.log(`${colors.red}   ❌ ${priorities[i]} → ${saved.priority} (atteso: ${expectedPriorities[i]})${colors.reset}`);
            allCorrect = false;
          } else {
            console.log(`${colors.green}   ✅ ${priorities[i]} → ${saved.priority}${colors.reset}`);
          }
          
          // Cleanup
          await prisma.notification.delete({
            where: { id: saved.id }
          });
        }
      }

      if (allCorrect) {
        console.log(`${colors.green}✅ Tutte le priorità convertite correttamente\n${colors.reset}`);
        testsPassed++;
      } else {
        console.log(`${colors.red}❌ Alcune priorità non sono state convertite correttamente\n${colors.reset}`);
        testsFailed++;
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ Errore: ${error.message}${colors.reset}\n`);
    testsFailed++;
  }

  // Test 4: Verifica che i vecchi campi errati non funzionino più
  console.log(`${colors.yellow}Test 4: Verifica che i campi errati falliscano${colors.reset}`);
  try {
    const testUser = await prisma.user.findFirst({
      where: { role: 'CLIENT' }
    });

    if (!testUser) {
      console.log(`${colors.red}❌ Nessun utente di test trovato${colors.reset}`);
      testsFailed++;
    } else {
      try {
        // Questo dovrebbe fallire perché 'message' non esiste
        await prisma.notification.create({
          data: {
            id: uuidv4(),
            type: 'TEST_WRONG_FIELD',
            title: 'Test campo errato',
            message: 'Questo campo non esiste!', // ❌ Campo sbagliato
            recipientId: testUser.id,
            priority: 'HIGH',
            isRead: false
          } as any
        });
        
        console.log(`${colors.red}❌ Il campo 'message' non dovrebbe funzionare!${colors.reset}\n`);
        testsFailed++;
      } catch (error) {
        if (error.message.includes('Unknown arg `message`') || 
            error.message.includes('Unknown field') ||
            error.message.includes('Unknown argument')) {
          console.log(`${colors.green}✅ Corretto: il campo 'message' non esiste, errore atteso${colors.reset}\n`);
          testsPassed++;
        } else {
          console.log(`${colors.red}❌ Errore inatteso: ${error.message}${colors.reset}\n`);
          testsFailed++;
        }
      }
    }
  } catch (error) {
    console.log(`${colors.red}❌ Errore generale: ${error.message}${colors.reset}\n`);
    testsFailed++;
  }

  // Risultati finali
  console.log(`${colors.blue}=================================`);
  console.log('📊 RISULTATI TEST');
  console.log(`=================================${colors.reset}`);
  console.log(`${colors.green}✅ Test passati: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Test falliti: ${testsFailed}${colors.reset}`);
  
  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 TUTTE LE CORREZIONI FUNZIONANO CORRETTAMENTE!${colors.reset}`);
  } else {
    console.log(`\n${colors.red}⚠️ ALCUNI TEST SONO FALLITI. VERIFICA I PROBLEMI.${colors.reset}`);
  }

  await prisma.$disconnect();
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Esegui i test
testNotificationsFix().catch(error => {
  console.error(`${colors.red}Errore critico:${colors.reset}`, error);
  process.exit(1);
});
