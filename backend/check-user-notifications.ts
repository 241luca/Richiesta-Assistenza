import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function checkUserAndNotifications() {
  try {
    // Token dal localStorage
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1MjUzMDRiMC04OGI3LTRjNTctOGZlZS0wOTAyMjA5NTNiMTAiLCJpYXQiOjE3NTcxOTQ4ODgsImV4cCI6MTc1Nzc5OTY4OH0.D8GEA1BlemPXJtqc3d_sPaHx9UXiZjvz3CGI4e9EcE4';
    
    // Decodifica il token (senza verificare la firma per ora)
    const decoded = jwt.decode(token) as any;
    console.log('🔐 TOKEN DECODIFICATO:');
    console.log('   User ID:', decoded.userId);
    console.log('   Creato:', new Date(decoded.iat * 1000).toLocaleString());
    console.log('   Scade:', new Date(decoded.exp * 1000).toLocaleString());
    
    const userId = decoded.userId; // "525304b0-88b7-4c57-8fee-090220953b10"
    
    // Trova l'utente
    console.log('\n👤 INFORMAZIONI UTENTE:');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      }
    });
    
    if (user) {
      console.log('   Email:', user.email);
      console.log('   Nome:', user.firstName, user.lastName);
      console.log('   Ruolo:', user.role);
      console.log('   Registrato:', user.createdAt.toLocaleString());
      
      // Se è CLIENT, non riceverà notifiche admin
      if (user.role === 'CLIENT') {
        console.log('\n⚠️  SEI LOGGATO COME CLIENT!');
        console.log('   I client ricevono solo notifiche di conferma.');
        console.log('   Le notifiche "nuova richiesta" vanno solo agli ADMIN.');
      } else if (user.role === 'PROFESSIONAL') {
        console.log('\n⚠️  SEI LOGGATO COME PROFESSIONAL!');
        console.log('   I professionisti ricevono notifiche solo per richieste assegnate.');
      } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        console.log('\n✅ SEI UN ADMIN!');
        console.log('   Dovresti ricevere notifiche per nuove richieste.');
      }
    } else {
      console.log('❌ Utente non trovato!');
    }
    
    // Controlla se ci sono ADMIN nel sistema
    console.log('\n📊 VERIFICA ADMIN NEL SISTEMA:');
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
    
    if (admins.length === 0) {
      console.log('   ❌ NESSUN ADMIN NEL SISTEMA!');
      console.log('   Questo è il problema: le notifiche non vengono inviate.');
      console.log('\n💡 SOLUZIONE:');
      console.log('   1. Apri Prisma Studio: npx prisma studio');
      console.log('   2. Vai nella tabella User');
      console.log('   3. Cambia il tuo role da', user?.role, 'a ADMIN');
      console.log('   4. Salva e ricarica la pagina');
      console.log('   5. Fai logout e login di nuovo');
    } else {
      console.log(`   ✅ Trovati ${admins.length} admin:`);
      admins.forEach(admin => {
        console.log(`      - ${admin.email} (${admin.role})`);
      });
    }
    
    // Controlla le notifiche dell'utente
    console.log('\n📬 TUE NOTIFICHE:');
    const notifications = await prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        isRead: true,
        createdAt: true
      }
    });
    
    if (notifications.length === 0) {
      console.log('   Nessuna notifica trovata.');
    } else {
      console.log(`   Trovate ${notifications.length} notifiche:`);
      notifications.forEach(notif => {
        console.log(`   - ${notif.title}`);
        console.log(`     Tipo: ${notif.type} | ${notif.isRead ? 'Letta' : 'Non letta'}`);
        console.log(`     Creata: ${notif.createdAt.toLocaleString()}`);
      });
    }
    
    // Controlla l'ultima richiesta creata
    console.log('\n📋 ULTIMA RICHIESTA CREATA:');
    const lastRequest = await prisma.assistanceRequest.findFirst({
      where: { clientId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true
      }
    });
    
    if (lastRequest) {
      console.log('   Titolo:', lastRequest.title);
      console.log('   Stato:', lastRequest.status);
      console.log('   Creata:', lastRequest.createdAt.toLocaleString());
    } else {
      console.log('   Nessuna richiesta trovata per questo utente.');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAndNotifications();
