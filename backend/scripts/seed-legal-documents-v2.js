const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script aggiornato che usa i tipi documento dal database
 * invece di valori hardcoded
 */
async function seedLegalDocuments() {
  console.log('🌱 Seeding legal documents (usando tipi da DB)...\n');
  
  try {
    // NON PULIRE PIÙ I DATI - manteniamo le configurazioni
    console.log('📋 Mantengo configurazioni esistenti...\n');
    
    // Trova o crea un admin user
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { role: 'ADMIN' },
          { role: 'SUPER_ADMIN' }
        ]
      }
    });
    
    if (!adminUser) {
      console.log('⚠️  Nessun utente admin trovato. Creo un admin di sistema...');
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Admin123!', 10);
      
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@richiesta-assistenza.it',
          password: hashedPassword,
          fullName: 'Admin Sistema',
          role: 'SUPER_ADMIN',
          emailVerified: true,
          isActive: true,
          phoneNumber: '+39 06 12345678'
        }
      });
      console.log('✅ Admin creato:', adminUser.email);
    } else {
      console.log('✅ Admin user trovato:', adminUser.email);
    }
    
    console.log('\n📄 Creazione documenti legali basati sui tipi configurati...\n');
    
    // IMPORTANTE: Ora leggiamo i tipi dal database!
    const documentTypes = await prisma.documentTypeConfig.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    });
    
    if (documentTypes.length === 0) {
      console.log('❌ Nessun tipo documento trovato nel database!');
      console.log('   Esegui prima: node scripts/populate-document-configs.js');
      return;
    }
    
    console.log(`📋 Trovati ${documentTypes.length} tipi documento nel database\n`);
    
    // Per ogni tipo documento configurato, crea il documento se non esiste
    for (const docType of documentTypes) {
      // Verifica se esiste già un documento di questo tipo
      const existingDoc = await prisma.legalDocument.findFirst({
        where: { 
          OR: [
            { type: docType.code },
            { typeConfigId: docType.id }
          ]
        }
      });
      
      if (existingDoc) {
        console.log(`⏭️  Documento già esistente per: ${docType.displayName}`);
        
        // Assicurati che sia collegato al tipo
        if (!existingDoc.typeConfigId) {
          await prisma.legalDocument.update({
            where: { id: existingDoc.id },
            data: { typeConfigId: docType.id }
          });
          console.log(`   ✅ Collegato al tipo configurato`);
        }
        continue;
      }
      
      // Crea il documento basandosi sulla configurazione
      console.log(`📝 Creazione documento: ${docType.displayName}...`);
      
      const newDoc = await prisma.legalDocument.create({
        data: {
          type: docType.code,
          typeConfigId: docType.id, // IMPORTANTE: Collega al tipo configurato
          internalName: `${docType.code.toLowerCase().replace(/_/g, '-')}-${new Date().getFullYear()}`,
          displayName: docType.displayName,
          description: docType.description,
          isActive: docType.isActive,
          isRequired: docType.isRequired,
          sortOrder: docType.sortOrder,
          createdBy: adminUser.id
        }
      });
      
      // Genera contenuto in base al tipo
      let content = '';
      let contentPlain = '';
      
      switch (docType.code) {
        case 'PRIVACY_POLICY':
          content = generatePrivacyPolicyContent();
          contentPlain = 'Informativa sulla Privacy completa...';
          break;
        case 'TERMS_SERVICE':
          content = generateTermsOfServiceContent();
          contentPlain = 'Termini e Condizioni di Servizio...';
          break;
        case 'COOKIE_POLICY':
          content = generateCookiePolicyContent();
          contentPlain = 'Cookie Policy...';
          break;
        default:
          // Per altri tipi, usa il template di default se presente
          content = docType.defaultTemplate || generateDefaultContent(docType);
          contentPlain = `${docType.displayName} - Contenuto documento`;
      }
      
      // Crea la versione iniziale
      await prisma.legalDocumentVersion.create({
        data: {
          documentId: newDoc.id,
          version: '1.0.0',
          title: `${docType.displayName} - v1.0`,
          content: content,
          contentPlain: contentPlain,
          summary: `Prima versione di ${docType.displayName}`,
          effectiveDate: new Date(),
          language: 'it',
          status: 'PUBLISHED',
          requiresAccept: docType.requiresSignature || docType.isRequired,
          notifyUsers: false,
          createdBy: adminUser.id,
          publishedAt: new Date(),
          publishedBy: adminUser.id
        }
      });
      
      console.log(`✅ Documento creato e pubblicato: ${docType.displayName}`);
    }
    
    // Verifica finale
    console.log('\n📊 Riepilogo finale:');
    const docCount = await prisma.legalDocument.count();
    const verCount = await prisma.legalDocumentVersion.count();
    const linkedCount = await prisma.legalDocument.count({
      where: { typeConfigId: { not: null } }
    });
    
    console.log(`✅ Documenti totali: ${docCount}`);
    console.log(`✅ Versioni pubblicate: ${verCount}`);
    console.log(`✅ Documenti collegati ai tipi: ${linkedCount}`);
    
    if (linkedCount < docCount) {
      console.log(`⚠️  ${docCount - linkedCount} documenti non collegati ai tipi`);
    }
    
    console.log('\n🎉 Seed completato con successo!');
    console.log('   I documenti ora usano i tipi configurati nel database');
    console.log('   NON più valori hardcoded!\n');
    
  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Funzioni helper per generare contenuto
function generatePrivacyPolicyContent() {
  return `
<div class="legal-document">
<h1>Informativa sulla Privacy</h1>
<p class="subtitle">Ai sensi del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003</p>
<p class="last-update">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Titolare del Trattamento</h2>
<p>Il Titolare del trattamento dei dati personali è <strong>Richiesta Assistenza S.r.l.</strong>, con sede legale in Via Example 123, 00100 Roma, Italia.</p>
<p>Email: privacy@richiesta-assistenza.it</p>

<h2>2. Tipologie di Dati Raccolti</h2>
<p>Raccogliamo le seguenti categorie di dati personali:</p>
<ul>
<li><strong>Dati anagrafici:</strong> nome, cognome, data di nascita, codice fiscale</li>
<li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo di residenza</li>
<li><strong>Dati di accesso:</strong> username, password (criptata), log di accesso</li>
<li><strong>Dati di utilizzo:</strong> preferenze, storico richieste, interazioni con il servizio</li>
</ul>

<h2>3. Finalità del Trattamento</h2>
<p>I suoi dati personali saranno trattati per le seguenti finalità:</p>
<ol>
<li><strong>Erogazione del servizio:</strong> gestione delle richieste di assistenza</li>
<li><strong>Gestione contrattuale:</strong> fatturazione, pagamenti, assistenza clienti</li>
<li><strong>Comunicazioni di servizio:</strong> notifiche relative alle sue richieste</li>
<li><strong>Sicurezza:</strong> prevenzione frodi e protezione del sistema</li>
</ol>

<h2>4. Diritti dell'Interessato</h2>
<p>Lei ha diritto di:</p>
<ul>
<li>Accedere ai suoi dati personali</li>
<li>Rettificare dati inesatti</li>
<li>Cancellare i dati (diritto all'oblio)</li>
<li>Limitare il trattamento</li>
<li>Portabilità dei dati</li>
<li>Opporsi al trattamento</li>
<li>Revocare il consenso</li>
</ul>

<h2>5. Contatti</h2>
<p>Per esercitare i suoi diritti: privacy@richiesta-assistenza.it</p>
</div>`;
}

function generateTermsOfServiceContent() {
  return `
<div class="legal-document">
<h1>Termini e Condizioni di Servizio</h1>
<p class="last-update">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando il servizio "Richiesta Assistenza", accetti di essere vincolato dai presenti Termini e Condizioni.</p>

<h2>2. Descrizione del Servizio</h2>
<p>Richiesta Assistenza è una piattaforma che mette in contatto clienti con professionisti qualificati per servizi di assistenza tecnica.</p>

<h2>3. Registrazione Account</h2>
<p>Per utilizzare il servizio è necessario:</p>
<ul>
<li>Avere almeno 18 anni</li>
<li>Fornire informazioni accurate</li>
<li>Mantenere aggiornati i dati</li>
<li>Proteggere le credenziali di accesso</li>
</ul>

<h2>4. Pagamenti e Commissioni</h2>
<p>Le transazioni sono gestite in modo sicuro. I dettagli sono disponibili nella sezione dedicata.</p>

<h2>5. Limitazione di Responsabilità</h2>
<p>La piattaforma agisce solo come intermediario.</p>

<h2>6. Modifiche ai Termini</h2>
<p>Ci riserviamo il diritto di modificare questi termini con preavviso di 30 giorni.</p>

<h2>7. Contatti</h2>
<p>Per domande: legal@richiesta-assistenza.it</p>
</div>`;
}

function generateCookiePolicyContent() {
  return `
<div class="legal-document">
<h1>Cookie Policy</h1>
<p class="last-update">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che i siti web salvano sul tuo dispositivo quando li visiti.</p>

<h2>2. Come Utilizziamo i Cookie</h2>
<p>Utilizziamo i cookie per:</p>
<ul>
<li>Ricordare le tue preferenze</li>
<li>Migliorare la navigazione</li>
<li>Analizzare l'utilizzo del sito</li>
<li>Fornire contenuti personalizzati</li>
</ul>

<h2>3. Tipi di Cookie</h2>
<ul>
<li><strong>Cookie Necessari:</strong> Essenziali per il funzionamento</li>
<li><strong>Cookie Analitici:</strong> Per statistiche di utilizzo</li>
<li><strong>Cookie Funzionali:</strong> Per ricordare le preferenze</li>
</ul>

<h2>4. Gestione dei Cookie</h2>
<p>Puoi controllare i cookie tramite le impostazioni del browser.</p>

<h2>5. Contatti</h2>
<p>Per domande sui cookie: privacy@richiesta-assistenza.it</p>
</div>`;
}

function generateDefaultContent(docType) {
  return `
<div class="legal-document">
<h1>${docType.displayName}</h1>
<p class="last-update">Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>Descrizione</h2>
<p>${docType.description || 'Questo documento contiene informazioni importanti.'}</p>

<h2>Contenuto</h2>
<p>Il contenuto di questo documento sarà personalizzato in base alle esigenze specifiche.</p>

<h2>Validità</h2>
<p>Questo documento è valido dalla data di pubblicazione.</p>

<h2>Contatti</h2>
<p>Per informazioni: info@richiesta-assistenza.it</p>
</div>`;
}

// Esegui il seed
seedLegalDocuments()
  .catch((e) => {
    console.error('Errore fatale:', e);
    process.exit(1);
  });
