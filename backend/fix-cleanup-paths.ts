// fix-cleanup-paths.ts
// Corregge i percorsi delle directory escluse per WhatsApp

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixCleanupPaths() {
  console.log('🔧 Correzione percorsi directory WhatsApp nel cleanup...');

  try {
    // Mappa delle directory con i percorsi CORRETTI relativi dalla root
    const correctPaths = [
      // Directory che ESISTONO GIÀ
      { 
        oldPath: 'tokens',
        newPath: 'backend/tokens',  // Percorso relativo dalla root
        reason: 'Token sessioni WPPConnect',
        description: 'CRITICO: Directory con token WhatsApp in backend/tokens'
      },
      
      // Directory che SI CREANO quando usi WhatsApp (ma mettiamo già i percorsi corretti)
      { 
        oldPath: '.wwebjs_auth',
        newPath: 'backend/.wwebjs_auth',  // Si creerà in backend
        reason: 'Sessione WhatsApp Web.js',
        description: 'CRITICO: Si crea in backend quando usi WhatsApp Web.js'
      },
      { 
        oldPath: '.wppconnect',
        newPath: 'backend/.wppconnect',  // Si creerà in backend
        reason: 'Sessioni WPPConnect',
        description: 'CRITICO: Directory principale WPPConnect in backend'
      },
      { 
        oldPath: 'ChromeProfile',
        newPath: 'backend/ChromeProfile',  // Si creerà in backend
        reason: 'Profilo Chrome per WPPConnect',
        description: 'CRITICO: Profilo browser per mantenere sessione'
      },
      { 
        oldPath: 'userDataDir',
        newPath: 'backend/userDataDir',  // Si creerà in backend
        reason: 'Dati utente Puppeteer',
        description: 'CRITICO: Dati browser Puppeteer'
      },
      { 
        oldPath: 'whatsapp-sessions',
        newPath: 'backend/whatsapp-sessions',  // Si creerà in backend
        reason: 'Backup sessioni WhatsApp',
        description: 'CRITICO: Backup delle sessioni WhatsApp'
      },
      { 
        oldPath: 'puppeteer_cache',
        newPath: 'backend/puppeteer_cache',  // Si creerà in backend
        reason: 'Cache Puppeteer',
        description: 'Cache del browser Chromium'
      },
      { 
        oldPath: '.puppeteer',
        newPath: 'backend/.puppeteer',  // Si creerà in backend
        reason: 'Config Puppeteer',
        description: 'Configurazioni Puppeteer'
      }
    ];

    // Aggiorna ogni directory con il percorso corretto
    for (const path of correctPaths) {
      // Prima prova ad aggiornare se esiste con il vecchio nome
      const existing = await prisma.cleanupExcludeDirectory.findFirst({
        where: { directory: path.oldPath }
      });

      if (existing) {
        // Aggiorna con il nuovo percorso
        await prisma.cleanupExcludeDirectory.update({
          where: { id: existing.id },
          data: {
            directory: path.newPath,
            reason: path.reason,
            description: path.description,
            recursive: true,
            isActive: true
          }
        });
        console.log(`✅ Aggiornato: ${path.oldPath} → ${path.newPath}`);
      } else {
        // Se non esiste con il vecchio nome, cerca con il nuovo
        const existingNew = await prisma.cleanupExcludeDirectory.findFirst({
          where: { directory: path.newPath }
        });

        if (!existingNew) {
          // Crea nuovo record con percorso corretto
          await prisma.cleanupExcludeDirectory.create({
            data: {
              directory: path.newPath,
              reason: path.reason,
              description: path.description,
              recursive: true,
              isActive: true
            }
          });
          console.log(`✅ Creato nuovo: ${path.newPath}`);
        } else {
          console.log(`⏭️  Già corretto: ${path.newPath}`);
        }
      }
    }

    // Aggiungi anche alcuni percorsi file specifici con percorsi corretti
    const fileExclusions = [
      {
        fileName: 'backend/session.json',
        reason: 'File sessione WhatsApp principale',
        criticality: 'critical' as const
      },
      {
        fileName: 'backend/session-*.json',
        reason: 'File sessioni multiple',
        criticality: 'critical' as const
      },
      {
        fileName: 'backend/wppconnect-*.json',
        reason: 'Config WPPConnect',
        criticality: 'critical' as const
      }
    ];

    for (const file of fileExclusions) {
      const existing = await prisma.cleanupExcludeFile.findFirst({
        where: { 
          OR: [
            { fileName: file.fileName },
            { fileName: file.fileName.replace('backend/', '') }
          ]
        }
      });

      if (!existing) {
        await prisma.cleanupExcludeFile.create({
          data: {
            ...file,
            description: file.reason,
            isActive: true
          }
        });
        console.log(`✅ File escluso aggiunto: ${file.fileName}`);
      }
    }

    console.log('\n✅ Percorsi corretti!');
    console.log('\n📋 RIEPILOGO PROTEZIONI:');
    console.log('   - backend/tokens (ESISTE GIÀ)');
    console.log('   - backend/.wwebjs_auth (si creerà quando usi WhatsApp Web.js)');
    console.log('   - backend/.wppconnect (si creerà quando usi WPPConnect)');
    console.log('   - backend/ChromeProfile (si creerà con WPPConnect)');
    console.log('   - backend/userDataDir (si creerà con Puppeteer)');
    console.log('\n⚠️  IMPORTANTE:');
    console.log('   Il cleanup ora salterà TUTTE le directory in backend/ che contengono dati WhatsApp');

  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui
fixCleanupPaths();
