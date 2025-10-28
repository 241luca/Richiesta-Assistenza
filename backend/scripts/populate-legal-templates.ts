import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function populateLegalTemplates() {
  console.log('🔄 Popolamento template documenti legali...\n');

  try {
    // Get SUPER_ADMIN user
    const adminUser = await prisma.user.findFirst({
      where: { 
        role: 'SUPER_ADMIN',
        email: 'admin@assistenza.it'
      }
    });

    if (!adminUser) {
      console.log('⚠️ SUPER_ADMIN non trovato - impossibile continuare');
      return;
    }

    console.log(`✅ Utente admin trovato: ${adminUser.fullName}\n`);

    // Directory dei file HTML
    const legaliDir = path.join(__dirname, '../../legali');
    
    // Leggi i file HTML completi
    const privacyHtml = fs.readFileSync(
      path.join(legaliDir, 'PRIVACY-POLICY-COMPLETA.html'), 
      'utf-8'
    );
    const termsHtml = fs.readFileSync(
      path.join(legaliDir, 'TERMINI-SERVIZIO-COMPLETO.html'), 
      'utf-8'
    );
    const cookieHtml = fs.readFileSync(
      path.join(legaliDir, 'COOKIE-POLICY-COMPLETO.html'), 
      'utf-8'
    );

    console.log(`📄 File HTML letti:`);
    console.log(`   - Privacy Policy: ${Math.round(privacyHtml.length / 1024)} KB`);
    console.log(`   - Terms of Service: ${Math.round(termsHtml.length / 1024)} KB`);
    console.log(`   - Cookie Policy: ${Math.round(cookieHtml.length / 1024)} KB\n`);

    // Template Privacy Policy
    console.log('📝 Creazione template Privacy Policy...');
    const existingPrivacy = await prisma.documentTemplate.findFirst({
      where: {
        type: 'PRIVACY_POLICY',
        name: 'Privacy Policy Completa GDPR 2025'
      }
    });

    const privacyTemplate = existingPrivacy
      ? await prisma.documentTemplate.update({
          where: { id: existingPrivacy.id },
          data: {
            content: privacyHtml,
            description: 'Template completo Privacy Policy conforme GDPR 2025 con tutte le sezioni richieste dalla normativa italiana ed europea',
            metadata: {
              tags: ['gdpr', 'privacy', 'dati personali', 'italia', '2025'],
              category: 'LEGAL',
              isPublic: true,
              version: '1.0.0',
              language: 'it'
            },
            updatedAt: new Date()
          }
        })
      : await prisma.documentTemplate.create({
          data: {
            id: uuidv4(),
            name: 'Privacy Policy Completa GDPR 2025',
            type: 'PRIVACY_POLICY',
            content: privacyHtml,
            description: 'Template completo Privacy Policy conforme GDPR 2025 con tutte le sezioni richieste dalla normativa italiana ed europea',
            metadata: {
              tags: ['gdpr', 'privacy', 'dati personali', 'italia', '2025'],
              category: 'LEGAL',
              isPublic: true,
              version: '1.0.0',
              language: 'it'
            },
            User: { connect: { id: adminUser.id } },
            updatedAt: new Date()
          }
        });
    console.log(`   ✅ Privacy Policy template: ${privacyTemplate.id}\n`);

    // Template Terms of Service
    console.log('📝 Creazione template Termini di Servizio...');
    const existingTerms = await prisma.documentTemplate.findFirst({
      where: {
        type: 'TERMS_SERVICE',
        name: 'Termini e Condizioni Completi 2025'
      }
    });

    const termsTemplate = existingTerms
      ? await prisma.documentTemplate.update({
          where: { id: existingTerms.id },
          data: {
            content: termsHtml,
            description: 'Template completo Termini e Condizioni di Servizio con tutte le clausole contrattuali, limitazioni di responsabilità e diritti degli utenti',
            metadata: {
              tags: ['contratto', 'termini', 'condizioni', 'servizio', '2025'],
              category: 'LEGAL',
              isPublic: true,
              version: '1.0.0',
              language: 'it'
            },
            updatedAt: new Date()
          }
        })
      : await prisma.documentTemplate.create({
          data: {
            id: uuidv4(),
            name: 'Termini e Condizioni Completi 2025',
            type: 'TERMS_SERVICE',
            content: termsHtml,
            description: 'Template completo Termini e Condizioni di Servizio con tutte le clausole contrattuali, limitazioni di responsabilità e diritti degli utenti',
            metadata: {
              tags: ['contratto', 'termini', 'condizioni', 'servizio', '2025'],
              category: 'LEGAL',
              isPublic: true,
              version: '1.0.0',
              language: 'it'
            },
            User: { connect: { id: adminUser.id } },
            updatedAt: new Date()
          }
        });
    console.log(`   ✅ Terms of Service template: ${termsTemplate.id}\n`);

    // Template Cookie Policy
    console.log('📝 Creazione template Cookie Policy...');
    const existingCookie = await prisma.documentTemplate.findFirst({
      where: {
        type: 'COOKIE_POLICY',
        name: 'Cookie Policy Completa 2025'
      }
    });

    const cookieTemplate = existingCookie
      ? await prisma.documentTemplate.update({
          where: { id: existingCookie.id },
          data: {
            content: cookieHtml,
            description: 'Template completo Cookie Policy con dettagli su tutti i cookie utilizzati, gestione consenso e diritti degli utenti',
            metadata: {
              tags: ['cookie', 'privacy', 'tracciamento', 'consenso', '2025'],
              category: 'LEGAL',
              isPublic: true,
              version: '1.0.0',
              language: 'it'
            },
            updatedAt: new Date()
          }
        })
      : await prisma.documentTemplate.create({
          data: {
            id: uuidv4(),
            name: 'Cookie Policy Completa 2025',
            type: 'COOKIE_POLICY',
            content: cookieHtml,
            description: 'Template completo Cookie Policy con dettagli su tutti i cookie utilizzati, gestione consenso e diritti degli utenti',
            metadata: {
              tags: ['cookie', 'privacy', 'tracciamento', 'consenso', '2025'],
              category: 'LEGAL',
              isPublic: true,
              version: '1.0.0',
              language: 'it'
            },
            User: { connect: { id: adminUser.id } },
            updatedAt: new Date()
          }
        });
    console.log(`   ✅ Cookie Policy template: ${cookieTemplate.id}\n`);

    // Verifica risultati
    console.log('🔍 Verifica template creati...\n');
    const allTemplates = await prisma.documentTemplate.findMany({
      where: {
        type: { in: ['PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY'] }
      },
      select: {
        id: true,
        name: true,
        type: true,
        content: true,
        createdAt: true
      }
    });

    console.log('📊 Template nel database:');
    allTemplates.forEach(t => {
      console.log(`   - ${t.name} (${t.type}): ${Math.round(t.content.length / 1024)} KB`);
    });

    console.log('\n✅ Popolamento template completato con successo!');
    console.log('\n📌 Prossimi passi:');
    console.log('   1. Vai su http://localhost:5193/admin/legal-documents/templates');
    console.log('   2. Verifica i template importati');
    console.log('   3. Usa i template nell\'Editor o quando crei nuove versioni');

  } catch (error) {
    console.error('❌ Errore durante il popolamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the script
populateLegalTemplates()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
