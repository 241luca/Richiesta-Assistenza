// Script per verificare e correggere lo stato di approvazione dei professionisti
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndFixProfessionals() {
  try {
    // 1. Trova tutti i professionisti
    const professionals = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        approvalStatus: true,
        emailVerified: true,
        createdAt: true
      }
    });

    console.log(`\nTrovati ${professionals.length} professionisti:\n`);
    
    for (const prof of professionals) {
      console.log(`${prof.firstName} ${prof.lastName} (${prof.email})`);
      console.log(`  - Stato attuale: ${prof.approvalStatus || 'NULL'}`);
      console.log(`  - Email verificata: ${prof.emailVerified ? 'SI' : 'NO'}`);
      console.log(`  - Registrato: ${prof.createdAt.toLocaleDateString('it-IT')}\n`);
    }

    // 2. Chiedi conferma per aggiornare
    console.log('\n=================================');
    console.log('CORREZIONE STATI');
    console.log('=================================\n');
    
    // 3. Aggiorna tutti i professionisti con email verificata o registrati da più di 7 giorni
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const toApprove = professionals.filter(prof => {
      const shouldApprove = (
        prof.approvalStatus !== 'APPROVED' && 
        prof.approvalStatus !== 'REJECTED' &&
        (prof.emailVerified || prof.createdAt < sevenDaysAgo)
      );
      return shouldApprove;
    });

    if (toApprove.length > 0) {
      console.log(`Professionisti da approvare automaticamente: ${toApprove.length}`);
      
      for (const prof of toApprove) {
        console.log(`- ${prof.firstName} ${prof.lastName}`);
      }
      
      console.log('\nApprovazione in corso...\n');
      
      // Aggiorna in batch
      const result = await prisma.user.updateMany({
        where: {
          id: {
            in: toApprove.map(p => p.id)
          }
        },
        data: {
          approvalStatus: 'APPROVED',
          approvedAt: new Date(),
          approvedBy: 'SYSTEM_AUTO_APPROVAL'
        }
      });
      
      console.log(`✅ Aggiornati ${result.count} professionisti a stato APPROVED\n`);
    } else {
      console.log('Nessun professionista da aggiornare.\n');
    }
    
    // 4. Mostra lo stato finale
    const updatedProfessionals = await prisma.user.findMany({
      where: {
        role: 'PROFESSIONAL'
      },
      select: {
        firstName: true,
        lastName: true,
        approvalStatus: true
      }
    });
    
    console.log('=================================');
    console.log('STATO FINALE');
    console.log('=================================\n');
    
    for (const prof of updatedProfessionals) {
      const statusEmoji = prof.approvalStatus === 'APPROVED' ? '✅' : 
                         prof.approvalStatus === 'REJECTED' ? '❌' : '⏳';
      console.log(`${statusEmoji} ${prof.firstName} ${prof.lastName}: ${prof.approvalStatus || 'NULL'}`);
    }
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
checkAndFixProfessionals();
