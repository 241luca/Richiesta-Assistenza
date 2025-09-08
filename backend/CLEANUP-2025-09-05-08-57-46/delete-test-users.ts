import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestUsers() {
  console.log('\n============================================');
  console.log('   ELIMINAZIONE UTENTI TEST DAL DATABASE');
  console.log('============================================\n');
  
  try {
    // Prima mostra gli utenti che verranno eliminati
    console.log('🔍 Cerco utenti test da eliminare...\n');
    
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: 'client.test@example.com' },
          { email: 'prof.test@example.com' }
        ]
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    });
    
    if (testUsers.length === 0) {
      console.log('✅ Nessun utente test trovato nel database.');
      console.log('   Gli utenti 5 e 6 sono già stati eliminati o non esistono.');
      return;
    }
    
    console.log(`📋 Trovati ${testUsers.length} utenti test da eliminare:`);
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.fullName}`);
      console.log(`      ID: ${user.id}`);
    });
    
    console.log('\n⚠️  ATTENZIONE: Questa operazione eliminerà anche:');
    console.log('   - Tutte le richieste associate a questi utenti');
    console.log('   - Tutti i preventivi associati');
    console.log('   - Tutte le notifiche associate');
    console.log('   - Tutti i messaggi e allegati\n');
    
    // Elimina prima tutti i dati collegati per evitare errori di foreign key
    console.log('🗑️  Eliminazione in corso...\n');
    
    for (const user of testUsers) {
      console.log(`   Elimino dati per ${user.email}...`);
      
      // Elimina notifiche (usa i campi corretti: recipientId e senderId)
      const deletedNotifications = await prisma.notification.deleteMany({
        where: {
          OR: [
            { recipientId: user.id },
            { senderId: user.id }
          ]
        }
      });
      if (deletedNotifications.count > 0) {
        console.log(`     - Eliminate ${deletedNotifications.count} notifiche`);
      }
      
      // Elimina preferenze notifiche
      const deletedNotificationPrefs = await prisma.notificationPreference.deleteMany({
        where: { userId: user.id }
      });
      if (deletedNotificationPrefs.count > 0) {
        console.log(`     - Eliminate preferenze notifiche`);
      }
      
      // Elimina preventivi (se è un professionista)
      if (user.role === 'PROFESSIONAL') {
        // Prima elimina gli items dei preventivi
        const quotes = await prisma.quote.findMany({
          where: { professionalId: user.id },
          select: { id: true }
        });
        
        for (const quote of quotes) {
          await prisma.quoteItem.deleteMany({
            where: { quoteId: quote.id }
          });
          await prisma.quoteRevision.deleteMany({
            where: { quoteId: quote.id }
          });
        }
        
        const deletedQuotes = await prisma.quote.deleteMany({
          where: { professionalId: user.id }
        });
        if (deletedQuotes.count > 0) {
          console.log(`     - Eliminati ${deletedQuotes.count} preventivi`);
        }
      }
      
      // Elimina allegati delle richieste associate all'utente
      const userRequests = await prisma.assistanceRequest.findMany({
        where: {
          OR: [
            { clientId: user.id },
            { professionalId: user.id }
          ]
        },
        select: { id: true }
      });
      
      for (const request of userRequests) {
        await prisma.requestAttachment.deleteMany({
          where: { requestId: request.id }
        });
        await prisma.requestUpdate.deleteMany({
          where: { requestId: request.id }
        });
      }
      
      // Elimina richieste (sia come cliente che come professionista)
      const deletedAsClient = await prisma.assistanceRequest.deleteMany({
        where: { clientId: user.id }
      });
      if (deletedAsClient.count > 0) {
        console.log(`     - Eliminate ${deletedAsClient.count} richieste come cliente`);
      }
      
      const deletedAsProfessional = await prisma.assistanceRequest.deleteMany({
        where: { professionalId: user.id }
      });
      if (deletedAsProfessional.count > 0) {
        console.log(`     - Eliminate ${deletedAsProfessional.count} richieste come professionista`);
      }
      
      // Elimina login history
      const deletedLoginHistory = await prisma.loginHistory.deleteMany({
        where: { userId: user.id }
      });
      if (deletedLoginHistory.count > 0) {
        console.log(`     - Eliminati ${deletedLoginHistory.count} log di accesso`);
      }
      
      // Elimina messaggi
      const deletedSentMessages = await prisma.message.deleteMany({
        where: { senderId: user.id }
      });
      const deletedReceivedMessages = await prisma.message.deleteMany({
        where: { recipientId: user.id }
      });
      const totalMessages = deletedSentMessages.count + deletedReceivedMessages.count;
      if (totalMessages > 0) {
        console.log(`     - Eliminati ${totalMessages} messaggi`);
      }
      
      // Elimina allegati caricati dall'utente
      const deletedAttachments = await prisma.requestAttachment.deleteMany({
        where: { userId: user.id }
      });
      if (deletedAttachments.count > 0) {
        console.log(`     - Eliminati ${deletedAttachments.count} allegati`);
      }
      
      // Elimina API keys se esistono
      try {
        const deletedApiKeys = await prisma.apiKey.deleteMany({
          where: { userId: user.id }
        });
        if (deletedApiKeys.count > 0) {
          console.log(`     - Eliminate ${deletedApiKeys.count} API keys`);
        }
      } catch (e) {
        // ApiKey potrebbe non esistere nello schema
      }
      
      // Elimina pagamenti se esistono
      try {
        const deletedPayments = await prisma.payment.deleteMany({
          where: { userId: user.id }
        });
        if (deletedPayments.count > 0) {
          console.log(`     - Eliminati ${deletedPayments.count} pagamenti`);
        }
      } catch (e) {
        // Payment potrebbe non esistere nello schema
      }
      
      // Infine elimina l'utente
      await prisma.user.delete({
        where: { id: user.id }
      });
      console.log(`   ✅ Utente ${user.email} eliminato completamente\n`);
    }
    
    console.log('============================================');
    console.log('✅ ELIMINAZIONE COMPLETATA CON SUCCESSO');
    console.log('============================================\n');
    
    // Mostra il conteggio finale degli utenti
    const remainingUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        fullName: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log('📊 UTENTI RIMANENTI NEL DATABASE:');
    console.log('───────────────────────────────────────');
    remainingUsers.forEach((user, index) => {
      const roleEmoji = 
        user.role === 'SUPER_ADMIN' ? '🔴' :
        user.role === 'ADMIN' ? '🟡' :
        user.role === 'PROFESSIONAL' ? '🟢' : '🔵';
      console.log(`  ${index + 1}. ${roleEmoji} ${user.email.padEnd(35)} - ${user.fullName}`);
    });
    console.log('───────────────────────────────────────');
    console.log(`  Totale: ${remainingUsers.length} utenti\n`);
    
  } catch (error) {
    console.error('❌ Errore durante l\'eliminazione:', error);
    console.log('\n💡 Suggerimento: Potrebbe esserci un problema con le foreign key.');
    console.log('   Assicurati che il server sia spento prima di eseguire questo script.');
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui l'eliminazione
deleteTestUsers();
