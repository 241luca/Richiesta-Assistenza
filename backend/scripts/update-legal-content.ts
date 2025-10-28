import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function updateLegalDocumentContent() {
  console.log('🔄 Aggiornamento contenuto documenti legali...\n');

  try {
    // Read the HTML files
    const legaliDir = path.join(__dirname, '../../legali');
    
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

    console.log(`📄 File letti:`);
    console.log(`   - Privacy Policy: ${Math.round(privacyHtml.length / 1024)} KB`);
    console.log(`   - Terms of Service: ${Math.round(termsHtml.length / 1024)} KB`);
    console.log(`   - Cookie Policy: ${Math.round(cookieHtml.length / 1024)} KB\n`);

    // Find the documents by type  
    const privacyDoc: any = await prisma.legalDocument.findFirst({
      where: { type: 'PRIVACY_POLICY' },
      include: { LegalDocumentVersion: { where: { status: 'PUBLISHED' } } }
    });

    const termsDoc: any = await prisma.legalDocument.findFirst({
      where: { type: 'TERMS_SERVICE' },
      include: { LegalDocumentVersion: { where: { status: 'PUBLISHED' } } }
    });

    const cookieDoc: any = await prisma.legalDocument.findFirst({
      where: { type: 'COOKIE_POLICY' },
      include: { LegalDocumentVersion: { where: { status: 'PUBLISHED' } } }
    });

    // Update Privacy Policy
    const privacyVersions = privacyDoc?.LegalDocumentVersion || [];
    if (privacyDoc && privacyVersions[0]) {
      console.log('✏️  Aggiornamento Privacy Policy...');
      await prisma.legalDocumentVersion.update({
        where: { id: privacyVersions[0].id },
        data: { content: privacyHtml }
      });
      console.log('   ✅ Privacy Policy aggiornata\n');
    } else {
      console.log('   ⚠️  Privacy Policy non trovata\n');
    }

    // Update Terms of Service
    const termsVersions = termsDoc?.LegalDocumentVersion || [];
    if (termsDoc && termsVersions[0]) {
      console.log('✏️  Aggiornamento Termini di Servizio...');
      await prisma.legalDocumentVersion.update({
        where: { id: termsVersions[0].id },
        data: { content: termsHtml }
      });
      console.log('   ✅ Termini di Servizio aggiornati\n');
    } else {
      console.log('   ⚠️  Termini di Servizio non trovati\n');
    }

    // Update Cookie Policy
    const cookieVersions = cookieDoc?.LegalDocumentVersion || [];
    if (cookieDoc && cookieVersions[0]) {
      console.log('✏️  Aggiornamento Cookie Policy...');
      await prisma.legalDocumentVersion.update({
        where: { id: cookieVersions[0].id },
        data: { content: cookieHtml }
      });
      console.log('   ✅ Cookie Policy aggiornata\n');
    } else {
      console.log('   ⚠️  Cookie Policy non trovata\n');
    }

    // Verify the updates
    console.log('🔍 Verifica aggiornamenti...\n');
    
    const updatedPrivacy = await prisma.legalDocumentVersion.findFirst({
      where: { documentId: privacyDoc?.id },
      select: { 
        version: true, 
        content: true,
        updatedAt: true
      }
    });

    const updatedTerms = await prisma.legalDocumentVersion.findFirst({
      where: { documentId: termsDoc?.id },
      select: { 
        version: true, 
        content: true,
        updatedAt: true
      }
    });

    const updatedCookie = await prisma.legalDocumentVersion.findFirst({
      where: { documentId: cookieDoc?.id },
      select: { 
        version: true, 
        content: true,
        updatedAt: true
      }
    });

    console.log('📊 Risultati:');
    console.log(`   Privacy Policy v${updatedPrivacy?.version}: ${Math.round((updatedPrivacy?.content?.length || 0) / 1024)} KB`);
    console.log(`   Terms Service v${updatedTerms?.version}: ${Math.round((updatedTerms?.content?.length || 0) / 1024)} KB`);
    console.log(`   Cookie Policy v${updatedCookie?.version}: ${Math.round((updatedCookie?.content?.length || 0) / 1024)} KB`);

    console.log('\n✅ Aggiornamento completato con successo!');

  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the update
updateLegalDocumentContent()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
