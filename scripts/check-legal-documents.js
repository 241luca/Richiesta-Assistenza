#!/usr/bin/env node

/**
 * Script per verificare il contenuto dei documenti legali nel database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDocuments() {
  try {
    console.log('🔍 Verifica documenti legali...\n');

    // Trova tutti i documenti legali
    const documents = await prisma.legalDocument.findMany({
      where: {
        type: {
          in: ['PRIVACY_POLICY', 'TERMS_SERVICE', 'COOKIE_POLICY']
        }
      },
      include: {
        versions: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    for (const doc of documents) {
      console.log('📄 DOCUMENTO:', doc.displayName);
      console.log('   Tipo:', doc.type);
      console.log('   ID:', doc.id);
      console.log('   Attivo:', doc.isActive ? '✅' : '❌');
      
      if (doc.versions && doc.versions.length > 0) {
        const version = doc.versions[0];
        console.log('   📌 VERSIONE:', version.version);
        console.log('   Stato:', version.status);
        console.log('   Creata:', version.createdAt);
        
        // Controlla il contenuto
        const hasHtml = version.content && version.content.includes('<');
        const contentLength = version.content ? version.content.length : 0;
        
        console.log('   Contenuto HTML:', hasHtml ? '✅' : '❌');
        console.log('   Lunghezza contenuto:', contentLength, 'caratteri');
        
        // Mostra i primi tag HTML
        if (version.content) {
          const firstTags = version.content.substring(0, 200);
          console.log('   Primi 200 caratteri:');
          console.log('   ', firstTags.replace(/\n/g, ' '));
        }
        
        // Conta i tag HTML principali
        if (version.content) {
          const h1Count = (version.content.match(/<h1/gi) || []).length;
          const h2Count = (version.content.match(/<h2/gi) || []).length;
          const h3Count = (version.content.match(/<h3/gi) || []).length;
          const pCount = (version.content.match(/<p/gi) || []).length;
          const ulCount = (version.content.match(/<ul/gi) || []).length;
          const strongCount = (version.content.match(/<strong/gi) || []).length;
          
          console.log('   📊 ANALISI TAG HTML:');
          console.log('      H1:', h1Count);
          console.log('      H2:', h2Count);
          console.log('      H3:', h3Count);
          console.log('      P:', pCount);
          console.log('      UL:', ulCount);
          console.log('      Strong:', strongCount);
        }
      } else {
        console.log('   ⚠️  NESSUNA VERSIONE');
      }
      
      console.log('\n' + '─'.repeat(60) + '\n');
    }

    // Verifica specificamente i Termini di Servizio
    console.log('🔎 VERIFICA SPECIFICA TERMINI DI SERVIZIO:\n');
    
    const termsDoc = await prisma.legalDocument.findFirst({
      where: { type: 'TERMS_SERVICE' },
      include: {
        versions: {
          where: {
            status: 'PUBLISHED'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    });

    if (termsDoc && termsDoc.versions.length > 0) {
      const version = termsDoc.versions[0];
      console.log('✅ Trovata versione pubblicata dei Termini');
      console.log('Versione:', version.version);
      console.log('Status:', version.status);
      
      // Salva il contenuto in un file per analisi
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, 'terms-content-debug.html');
      fs.writeFileSync(filePath, version.content || '');
      console.log('\n📁 Contenuto salvato in:', filePath);
      console.log('   Puoi aprirlo per verificare la formattazione HTML');
    } else {
      console.log('❌ Nessuna versione pubblicata trovata per i Termini di Servizio');
    }

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
checkDocuments();
