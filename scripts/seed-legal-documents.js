const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedLegalDocuments() {
  console.log('🌱 Seeding legal documents...\n');
  
  try {
    // Pulisci prima i dati esistenti
    console.log('🧹 Pulizia dati esistenti...');
    await prisma.userLegalAcceptance.deleteMany();
    await prisma.legalDocumentVersion.deleteMany();
    await prisma.legalDocument.deleteMany();
    console.log('✅ Database pulito\n');
    
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
      
      // Cerca se esiste almeno un utente qualsiasi
      adminUser = await prisma.user.findFirst();
      
      if (!adminUser) {
        console.log('📝 Creazione utente admin di sistema...');
        // Crea un utente admin di sistema
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
      }
    } else {
      console.log('✅ Admin user trovato:', adminUser.email);
    }
    
    console.log('\n📄 Creazione documenti legali...\n');
    
    // 1. Privacy Policy
    console.log('1️⃣  Creazione Privacy Policy...');
    const privacyDoc = await prisma.legalDocument.create({
      data: {
        type: 'PRIVACY_POLICY',
        internalName: 'privacy-policy-2025',
        displayName: 'Informativa sulla Privacy',
        description: 'Informativa sul trattamento dei dati personali ai sensi del GDPR',
        isActive: true,
        isRequired: true,
        sortOrder: 1,
        createdBy: adminUser.id
      }
    });
    
    const privacyVersion = await prisma.legalDocumentVersion.create({
      data: {
        documentId: privacyDoc.id,
        version: '1.0.0',
        title: 'Informativa sulla Privacy - v1.0',
        content: `
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
<li><strong>Dati di pagamento:</strong> coordinate bancarie, transazioni (tramite provider sicuri)</li>
<li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, sistema operativo</li>
</ul>

<h2>3. Finalità del Trattamento</h2>
<p>I suoi dati personali saranno trattati per le seguenti finalità:</p>
<ol>
<li><strong>Erogazione del servizio:</strong> gestione delle richieste di assistenza</li>
<li><strong>Gestione contrattuale:</strong> fatturazione, pagamenti, assistenza clienti</li>
<li><strong>Comunicazioni di servizio:</strong> notifiche relative alle sue richieste</li>
<li><strong>Sicurezza:</strong> prevenzione frodi e protezione del sistema</li>
<li><strong>Miglioramento del servizio:</strong> analisi statistiche anonime</li>
<li><strong>Marketing:</strong> solo previo consenso esplicito</li>
</ol>

<h2>4. Base Giuridica del Trattamento</h2>
<p>Il trattamento dei suoi dati si basa su:</p>
<ul>
<li><strong>Esecuzione del contratto:</strong> per fornire i servizi richiesti</li>
<li><strong>Consenso:</strong> per marketing e comunicazioni promozionali</li>
<li><strong>Obbligo legale:</strong> per adempimenti fiscali e normativi</li>
<li><strong>Interesse legittimo:</strong> per sicurezza e prevenzione frodi</li>
</ul>

<h2>5. Diritti dell'Interessato</h2>
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

<h2>6. Contatti</h2>
<p>Per esercitare i suoi diritti: privacy@richiesta-assistenza.it</p>
</div>`,
        contentPlain: 'Informativa sulla Privacy completa...',
        summary: 'Prima versione dell\'informativa privacy GDPR compliant',
        effectiveDate: new Date(),
        language: 'it',
        status: 'PUBLISHED',
        requiresAccept: true,
        notifyUsers: false,
        createdBy: adminUser.id,
        publishedAt: new Date(),
        publishedBy: adminUser.id
      }
    });
    console.log('✅ Privacy Policy creata e pubblicata');
    
    // 2. Terms of Service
    console.log('2️⃣  Creazione Terms of Service...');
    const termsDoc = await prisma.legalDocument.create({
      data: {
        type: 'TERMS_SERVICE',
        internalName: 'terms-service-2025',
        displayName: 'Termini e Condizioni',
        description: 'Termini e condizioni di utilizzo del servizio',
        isActive: true,
        isRequired: true,
        sortOrder: 2,
        createdBy: adminUser.id
      }
    });
    
    const termsVersion = await prisma.legalDocumentVersion.create({
      data: {
        documentId: termsDoc.id,
        version: '1.0.0',
        title: 'Termini e Condizioni - v1.0',
        content: `
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

<h2>4. Utilizzo del Servizio</h2>
<h3>Usi Consentiti:</h3>
<ul>
<li>Richiedere assistenza tecnica legittima</li>
<li>Offrire servizi professionali se qualificato</li>
<li>Comunicare in modo professionale</li>
</ul>

<h3>Usi Vietati:</h3>
<ul>
<li>Fornire informazioni false</li>
<li>Attività illegali</li>
<li>Molestare altri utenti</li>
<li>Violare diritti di proprietà intellettuale</li>
</ul>

<h2>5. Pagamenti e Commissioni</h2>
<p>Per i Clienti:</p>
<ul>
<li>Prezzi inclusivi di IVA</li>
<li>Pagamento tramite metodi sicuri</li>
</ul>

<p>Per i Professionisti:</p>
<ul>
<li>Commissione piattaforma: 15%</li>
<li>Pagamenti entro 7 giorni lavorativi</li>
</ul>

<h2>6. Limitazione di Responsabilità</h2>
<p>La piattaforma agisce solo come intermediario. Non siamo responsabili per la qualità del servizio erogato dai professionisti.</p>

<h2>7. Privacy</h2>
<p>Il trattamento dei dati è regolato dalla nostra <a href="/legal/privacy-policy">Informativa sulla Privacy</a>.</p>

<h2>8. Modifiche ai Termini</h2>
<p>Ci riserviamo il diritto di modificare questi termini con preavviso di 30 giorni.</p>

<h2>9. Legge Applicabile</h2>
<p>Questi termini sono regolati dalla legge italiana.</p>

<h2>10. Contatti</h2>
<p>Per domande: legal@richiesta-assistenza.it</p>
</div>`,
        contentPlain: 'Termini e Condizioni di Servizio...',
        summary: 'Prima versione dei termini di servizio',
        effectiveDate: new Date(),
        language: 'it',
        status: 'PUBLISHED',
        requiresAccept: true,
        notifyUsers: false,
        createdBy: adminUser.id,
        publishedAt: new Date(),
        publishedBy: adminUser.id
      }
    });
    console.log('✅ Terms of Service creati e pubblicati');
    
    // 3. Cookie Policy
    console.log('3️⃣  Creazione Cookie Policy...');
    const cookieDoc = await prisma.legalDocument.create({
      data: {
        type: 'COOKIE_POLICY',
        internalName: 'cookie-policy-2025',
        displayName: 'Politica sui Cookie',
        description: 'Informativa sull\'utilizzo dei cookie e tecnologie simili',
        isActive: true,
        isRequired: false,
        sortOrder: 3,
        createdBy: adminUser.id
      }
    });
    
    const cookieVersion = await prisma.legalDocumentVersion.create({
      data: {
        documentId: cookieDoc.id,
        version: '1.0.0',
        title: 'Cookie Policy - v1.0',
        content: `
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

<h3>Cookie Necessari</h3>
<p>Essenziali per il funzionamento del sito:</p>
<ul>
<li><strong>session_id:</strong> Mantenere la sessione utente</li>
<li><strong>auth_token:</strong> Autenticazione</li>
<li><strong>csrf_token:</strong> Sicurezza</li>
</ul>

<h3>Cookie Analitici</h3>
<p>Per capire come viene utilizzato il sito:</p>
<ul>
<li><strong>Google Analytics:</strong> Statistiche di utilizzo</li>
</ul>

<h3>Cookie Funzionali</h3>
<p>Per ricordare le tue preferenze:</p>
<ul>
<li><strong>language:</strong> Lingua preferita</li>
<li><strong>theme:</strong> Tema chiaro/scuro</li>
</ul>

<h2>4. Gestione dei Cookie</h2>
<p>Puoi controllare i cookie tramite le impostazioni del browser:</p>
<ul>
<li>Chrome: Impostazioni > Privacy e sicurezza > Cookie</li>
<li>Firefox: Impostazioni > Privacy e sicurezza</li>
<li>Safari: Preferenze > Privacy</li>
</ul>

<h2>5. Cookie di Terze Parti</h2>
<p>Alcuni servizi esterni potrebbero impostare cookie:</p>
<ul>
<li>Google Analytics</li>
<li>Google Maps</li>
<li>Stripe (pagamenti)</li>
</ul>

<h2>6. Disabilitazione Cookie</h2>
<p>Nota: disabilitando i cookie, alcune funzionalità potrebbero non essere disponibili.</p>

<h2>7. Maggiori Informazioni</h2>
<p>Per la privacy policy completa: <a href="/legal/privacy-policy">Informativa Privacy</a></p>

<h2>8. Contatti</h2>
<p>Per domande sui cookie: privacy@richiesta-assistenza.it</p>
</div>`,
        contentPlain: 'Cookie Policy...',
        summary: 'Prima versione della cookie policy',
        effectiveDate: new Date(),
        language: 'it',
        status: 'PUBLISHED',
        requiresAccept: false,
        notifyUsers: false,
        createdBy: adminUser.id,
        publishedAt: new Date(),
        publishedBy: adminUser.id
      }
    });
    console.log('✅ Cookie Policy creata e pubblicata');
    
    // Verifica finale
    console.log('\n📊 Riepilogo finale:');
    const docCount = await prisma.legalDocument.count();
    const verCount = await prisma.legalDocumentVersion.count();
    
    console.log(`✅ Documenti creati: ${docCount}`);
    console.log(`✅ Versioni pubblicate: ${verCount}`);
    
    // Mostra i documenti
    const docs = await prisma.legalDocument.findMany({
      select: {
        type: true,
        displayName: true,
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });
    
    console.log('\n📋 Documenti nel database:');
    docs.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.displayName} (${doc.type}) - Attivo: ${doc.isActive ? '✅' : '❌'}`);
    });
    
    console.log('\n🎉 Seed completato con successo!');
    console.log('\nℹ️  Credenziali admin (se create):');
    console.log('   Email: admin@richiesta-assistenza.it');
    console.log('   Password: Admin123!');
    
  } catch (error) {
    console.error('❌ Errore durante il seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui il seed
seedLegalDocuments()
  .catch((e) => {
    console.error('Errore fatale:', e);
    process.exit(1);
  });
