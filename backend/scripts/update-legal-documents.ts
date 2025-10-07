// Script per verificare e aggiornare i documenti legali nel database
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAndUpdateLegalDocuments() {
  try {
    // 1. Verifica documenti esistenti
    console.log('🔍 Verifico documenti esistenti nel database...');
    
    const documents = await prisma.legalDocument.findMany({
      include: {
        versions: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    console.log(`\n📊 Trovati ${documents.length} documenti nel database`);
    
    for (const doc of documents) {
      console.log(`\n📄 Documento: ${doc.type}`);
      console.log(`   - Display Name: ${doc.displayName}`);
      console.log(`   - Active: ${doc.isActive}`);
      console.log(`   - Versions: ${doc.versions.length}`);
      
      if (doc.versions.length > 0) {
        const version = doc.versions[0];
        console.log(`   - Version: ${version.version}`);
        console.log(`   - Has HTML content: ${version.content?.includes('<h1>') || false}`);
        console.log(`   - Content length: ${version.content?.length || 0} characters`);
        
        // Se il contenuto non è HTML, aggiornalo
        if (version.content && !version.content.includes('<')) {
          console.log('   ⚠️ CONTENUTO NON È HTML - Necessario aggiornamento!');
        }
      }
    }

    // 2. Aggiorna documenti con contenuto HTML
    console.log('\n\n🔄 Aggiorno documenti con contenuto HTML formattato...');
    
    const documentsToUpdate = [
      {
        type: 'TERMS_SERVICE',
        displayName: 'Termini e Condizioni',
        description: 'Termini e condizioni di utilizzo del servizio',
        content: `<h1>Termini e Condizioni di Servizio</h1>
<p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando i nostri servizi, l'utente accetta di essere vincolato dai presenti termini e condizioni. Se non si accettano questi termini, si prega di non utilizzare il servizio.</p>

<h2>2. Descrizione del Servizio</h2>
<p>Il nostro servizio fornisce una piattaforma per la gestione delle richieste di assistenza tecnica, mettendo in contatto clienti e professionisti qualificati per servizi di:</p>
<ul>
  <li>Idraulica e impianti idraulici</li>
  <li>Elettricità e impianti elettrici</li>
  <li>Condizionamento e climatizzazione</li>
  <li>Riparazioni domestiche</li>
  <li>Altri servizi di assistenza tecnica</li>
</ul>

<h2>3. Registrazione Account</h2>
<p>Per utilizzare alcune funzionalità del servizio è necessario registrare un account. L'utente si impegna a:</p>
<ul>
  <li>Fornire informazioni accurate, complete e aggiornate durante la registrazione</li>
  <li>Mantenere la sicurezza del proprio account e password</li>
  <li>Notificare immediatamente qualsiasi uso non autorizzato del proprio account</li>
  <li>Assumersi la responsabilità di tutte le attività svolte con il proprio account</li>
</ul>

<h2>4. Obblighi dell'Utente</h2>
<p>L'utente si impegna a:</p>
<ul>
  <li>Non utilizzare il servizio per scopi illegali o non autorizzati</li>
  <li>Non violare diritti di proprietà intellettuale di terzi</li>
  <li>Non trasmettere virus, malware o codice dannoso</li>
  <li>Non tentare di accedere a sistemi o dati non autorizzati</li>
  <li>Rispettare tutti gli altri utenti della piattaforma</li>
  <li>Non pubblicare contenuti offensivi, discriminatori o inappropriati</li>
</ul>

<h2>5. Servizi Professionali</h2>
<p>La piattaforma facilita il contatto tra clienti e professionisti. Tuttavia:</p>
<ul>
  <li>Non siamo responsabili della qualità dei servizi forniti dai professionisti</li>
  <li>Non garantiamo la disponibilità di professionisti in tutte le aree geografiche</li>
  <li>Gli accordi contrattuali tra clienti e professionisti sono responsabilità delle parti</li>
  <li>Non siamo parte del contratto tra cliente e professionista</li>
</ul>

<h2>6. Pagamenti e Tariffe</h2>
<p>Per alcuni servizi potrebbero essere richiesti pagamenti:</p>
<ul>
  <li>I prezzi sono indicati in Euro e includono l'IVA dove applicabile</li>
  <li>Il pagamento deve essere effettuato secondo le modalità indicate sulla piattaforma</li>
  <li>Le commissioni di servizio sono chiaramente indicate prima del pagamento</li>
  <li>Le politiche di rimborso sono specificate nella sezione dedicata</li>
</ul>

<h2>7. Proprietà Intellettuale</h2>
<p>Tutti i contenuti presenti sulla piattaforma, inclusi ma non limitati a:</p>
<ul>
  <li>Logo, marchi e segni distintivi</li>
  <li>Testi, immagini e grafica</li>
  <li>Software e codice sorgente</li>
  <li>Database e contenuti</li>
</ul>
<p>sono di proprietà esclusiva di LM Tecnologie o dei rispettivi proprietari e sono protetti dalle leggi sulla proprietà intellettuale.</p>

<h2>8. Limitazione di Responsabilità</h2>
<p>Nella misura massima consentita dalla legge applicabile:</p>
<ul>
  <li>Il servizio è fornito "così com'è" senza garanzie di alcun tipo</li>
  <li>Non garantiamo che il servizio sia sempre disponibile o privo di errori</li>
  <li>Non siamo responsabili per danni indiretti, incidentali o consequenziali</li>
  <li>La nostra responsabilità totale non supererà l'importo pagato dall'utente negli ultimi 12 mesi</li>
</ul>

<h2>9. Indennizzo</h2>
<p>L'utente accetta di manlevare e tenere indenne LM Tecnologie, i suoi dirigenti, dipendenti e partner da qualsiasi richiesta, perdita, responsabilità, reclamo o spesa derivante da:</p>
<ul>
  <li>Violazione di questi termini da parte dell'utente</li>
  <li>Violazione di diritti di terzi</li>
  <li>Uso improprio del servizio</li>
</ul>

<h2>10. Modifiche ai Termini</h2>
<p>Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche saranno efficaci al momento della pubblicazione sulla piattaforma. L'uso continuato del servizio dopo le modifiche costituisce accettazione dei nuovi termini.</p>

<h2>11. Risoluzione</h2>
<p>Possiamo sospendere o terminare l'account dell'utente in caso di:</p>
<ul>
  <li>Violazione di questi termini</li>
  <li>Comportamento fraudolento o illegale</li>
  <li>Inattività prolungata</li>
</ul>

<h2>12. Legge Applicabile e Foro Competente</h2>
<p>Questi termini sono regolati dalla legge italiana. Per qualsiasi controversia derivante da o relativa a questi termini, il foro competente esclusivo sarà quello di Roma.</p>

<h2>13. Contatti</h2>
<p>Per qualsiasi domanda relativa a questi termini, è possibile contattarci:</p>
<ul>
  <li>Email: legal@lmtecnologie.it</li>
  <li>Telefono: +39 123 456 7890</li>
  <li>Indirizzo: Via Example, 123 - 00100 Roma (RM)</li>
</ul>`
      },
      {
        type: 'PRIVACY_POLICY',
        displayName: 'Privacy Policy',
        description: 'Informativa sul trattamento dei dati personali',
        content: `<h1>Informativa sulla Privacy</h1>
<p><em>Ai sensi del Regolamento UE 2016/679 (GDPR)</em></p>
<p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Titolare del Trattamento</h2>
<p>Il Titolare del trattamento dei dati personali è:</p>
<ul>
  <li><strong>Ragione Sociale:</strong> LM Tecnologie S.r.l.</li>
  <li><strong>Sede Legale:</strong> Via Example, 123 - 00100 Roma (RM)</li>
  <li><strong>P.IVA:</strong> 12345678901</li>
  <li><strong>Email:</strong> privacy@lmtecnologie.it</li>
  <li><strong>PEC:</strong> lmtecnologie@pec.it</li>
</ul>

<h2>2. Tipologie di Dati Raccolti</h2>
<p>Nell'ambito del servizio, trattiamo le seguenti categorie di dati personali:</p>

<h3>2.1 Dati Anagrafici e di Contatto</h3>
<ul>
  <li>Nome e cognome</li>
  <li>Data e luogo di nascita</li>
  <li>Codice fiscale</li>
  <li>Indirizzo di residenza/domicilio</li>
  <li>Numero di telefono</li>
  <li>Indirizzo email</li>
</ul>

<h3>2.2 Dati di Navigazione</h3>
<ul>
  <li>Indirizzo IP</li>
  <li>Tipo di browser e dispositivo</li>
  <li>Pagine visitate e tempo di permanenza</li>
  <li>Data e ora di accesso</li>
</ul>

<h3>2.3 Dati di Utilizzo del Servizio</h3>
<ul>
  <li>Richieste di assistenza effettuate</li>
  <li>Preferenze di servizio</li>
  <li>Storico interventi</li>
  <li>Feedback e valutazioni</li>
</ul>

<h2>3. Finalità del Trattamento</h2>
<p>I dati personali sono trattati per le seguenti finalità:</p>

<h3>3.1 Finalità Necessarie (base giuridica: contratto)</h3>
<ul>
  <li>Gestione della registrazione e dell'account utente</li>
  <li>Erogazione dei servizi richiesti</li>
  <li>Gestione delle richieste di assistenza</li>
  <li>Comunicazioni relative al servizio</li>
  <li>Fatturazione e pagamenti</li>
</ul>

<h3>3.2 Finalità Legali (base giuridica: obbligo di legge)</h3>
<ul>
  <li>Adempimenti fiscali e contabili</li>
  <li>Risposta a richieste delle autorità</li>
  <li>Gestione del contenzioso</li>
</ul>

<h3>3.3 Finalità Facoltative (base giuridica: consenso)</h3>
<ul>
  <li>Marketing diretto</li>
  <li>Newsletter e comunicazioni promozionali</li>
  <li>Analisi statistiche e profilazione</li>
</ul>

<h2>4. Modalità del Trattamento</h2>
<p>Il trattamento dei dati avviene:</p>
<ul>
  <li>Con strumenti elettronici e informatici</li>
  <li>Con misure di sicurezza adeguate</li>
  <li>Da personale autorizzato e formato</li>
  <li>Nel rispetto dei principi di minimizzazione</li>
</ul>

<h2>5. Comunicazione e Diffusione dei Dati</h2>
<p>I dati potranno essere comunicati a:</p>
<ul>
  <li>Professionisti registrati sulla piattaforma (per l'erogazione del servizio)</li>
  <li>Fornitori di servizi IT e hosting</li>
  <li>Consulenti fiscali e legali</li>
  <li>Istituti bancari e di pagamento</li>
  <li>Autorità competenti (su richiesta)</li>
</ul>
<p>I dati non saranno oggetto di diffusione.</p>

<h2>6. Trasferimento dei Dati</h2>
<p>I dati sono conservati su server ubicati nell'Unione Europea. In caso di trasferimento extra-UE, saranno adottate le garanzie appropriate previste dal GDPR.</p>

<h2>7. Periodo di Conservazione</h2>
<p>I dati saranno conservati per i seguenti periodi:</p>
<ul>
  <li><strong>Dati contrattuali:</strong> 10 anni dalla cessazione del rapporto</li>
  <li><strong>Dati fiscali:</strong> secondo i termini di legge</li>
  <li><strong>Dati di navigazione:</strong> 6 mesi</li>
  <li><strong>Dati di marketing:</strong> fino a revoca del consenso o 24 mesi dall'ultimo contatto</li>
</ul>

<h2>8. Diritti dell'Interessato</h2>
<p>Ai sensi degli articoli 15-22 del GDPR, l'interessato ha diritto di:</p>
<ul>
  <li><strong>Accesso:</strong> ottenere conferma e accesso ai propri dati</li>
  <li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
  <li><strong>Cancellazione:</strong> richiedere la cancellazione dei dati</li>
  <li><strong>Limitazione:</strong> limitare il trattamento</li>
  <li><strong>Portabilità:</strong> ricevere i dati in formato strutturato</li>
  <li><strong>Opposizione:</strong> opporsi al trattamento</li>
  <li><strong>Revoca del consenso:</strong> revocare il consenso in qualsiasi momento</li>
</ul>

<h2>9. Modalità di Esercizio dei Diritti</h2>
<p>Per esercitare i propri diritti, l'interessato può:</p>
<ul>
  <li>Inviare una email a: privacy@lmtecnologie.it</li>
  <li>Inviare una PEC a: lmtecnologie@pec.it</li>
  <li>Inviare una raccomandata a: LM Tecnologie S.r.l., Via Example 123, 00100 Roma</li>
</ul>

<h2>10. Reclamo all'Autorità di Controllo</h2>
<p>L'interessato ha diritto di proporre reclamo al Garante per la Protezione dei Dati Personali:</p>
<ul>
  <li>Sito web: www.garanteprivacy.it</li>
  <li>Email: garante@gpdp.it</li>
  <li>Indirizzo: Piazza Venezia 11, 00187 Roma</li>
</ul>

<h2>11. Modifiche all'Informativa</h2>
<p>La presente informativa può essere soggetta a modifiche. Le modifiche saranno pubblicate su questa pagina con indicazione della data di aggiornamento.</p>`
      },
      {
        type: 'COOKIE_POLICY',
        displayName: 'Cookie Policy',
        description: 'Informativa sull\'utilizzo dei cookie',
        content: `<h1>Cookie Policy</h1>
<p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell'utente quando visita il nostro sito web. Questi file contengono informazioni che vengono lette dal sito nelle visite successive.</p>

<h2>2. Come Utilizziamo i Cookie</h2>
<p>Utilizziamo i cookie per:</p>
<ul>
  <li>Mantenere l'utente connesso al proprio account</li>
  <li>Ricordare le preferenze dell'utente</li>
  <li>Analizzare l'utilizzo del sito per migliorare i nostri servizi</li>
  <li>Personalizzare l'esperienza di navigazione</li>
</ul>

<h2>3. Tipologie di Cookie Utilizzati</h2>

<h3>3.1 Cookie Tecnici Necessari</h3>
<p>Questi cookie sono essenziali per il funzionamento del sito e non possono essere disabilitati:</p>
<table>
  <tr>
    <th>Nome Cookie</th>
    <th>Durata</th>
    <th>Finalità</th>
  </tr>
  <tr>
    <td>session_id</td>
    <td>Sessione</td>
    <td>Mantiene la sessione utente</td>
  </tr>
  <tr>
    <td>auth_token</td>
    <td>7 giorni</td>
    <td>Autenticazione utente</td>
  </tr>
  <tr>
    <td>cookie_consent</td>
    <td>12 mesi</td>
    <td>Memorizza le preferenze sui cookie</td>
  </tr>
</table>

<h3>3.2 Cookie Analitici</h3>
<p>Utilizziamo questi cookie per comprendere come gli utenti interagiscono con il sito:</p>
<table>
  <tr>
    <th>Nome Cookie</th>
    <th>Provider</th>
    <th>Durata</th>
    <th>Finalità</th>
  </tr>
  <tr>
    <td>_ga</td>
    <td>Google Analytics</td>
    <td>2 anni</td>
    <td>Distingue gli utenti</td>
  </tr>
  <tr>
    <td>_gid</td>
    <td>Google Analytics</td>
    <td>24 ore</td>
    <td>Distingue gli utenti</td>
  </tr>
  <tr>
    <td>_gat</td>
    <td>Google Analytics</td>
    <td>1 minuto</td>
    <td>Limita il tasso di richieste</td>
  </tr>
</table>

<h3>3.3 Cookie di Marketing</h3>
<p>Questi cookie possono essere impostati dai nostri partner pubblicitari:</p>
<ul>
  <li>Google Ads per il remarketing</li>
  <li>Facebook Pixel per pubblicità mirata</li>
  <li>LinkedIn Insight Tag per analisi delle campagne</li>
</ul>

<h2>4. Cookie di Terze Parti</h2>
<p>Alcuni servizi esterni potrebbero impostare propri cookie:</p>
<ul>
  <li><strong>Google Maps:</strong> per visualizzare mappe e calcolare percorsi</li>
  <li><strong>Stripe:</strong> per processare pagamenti in sicurezza</li>
  <li><strong>YouTube:</strong> per incorporare video</li>
  <li><strong>Social Media:</strong> per i pulsanti di condivisione</li>
</ul>

<h2>5. Gestione dei Cookie</h2>

<h3>5.1 Attraverso il Banner Cookie</h3>
<p>Al primo accesso al sito, viene mostrato un banner che permette di:</p>
<ul>
  <li>Accettare tutti i cookie</li>
  <li>Rifiutare i cookie non necessari</li>
  <li>Personalizzare le preferenze</li>
</ul>

<h3>5.2 Attraverso le Impostazioni del Browser</h3>
<p>È possibile gestire i cookie dalle impostazioni del proprio browser:</p>
<ul>
  <li><strong>Chrome:</strong> chrome://settings/cookies</li>
  <li><strong>Firefox:</strong> about:preferences#privacy</li>
  <li><strong>Safari:</strong> Preferenze > Privacy</li>
  <li><strong>Edge:</strong> edge://settings/privacy</li>
</ul>

<h2>6. Conseguenze della Disabilitazione dei Cookie</h2>
<p>La disabilitazione di alcuni cookie potrebbe:</p>
<ul>
  <li>Impedire l'accesso ad aree riservate del sito</li>
  <li>Limitare alcune funzionalità</li>
  <li>Rendere meno personalizzata l'esperienza di navigazione</li>
  <li>Richiedere il re-inserimento delle preferenze ad ogni visita</li>
</ul>

<h2>7. Diritti dell'Utente</h2>
<p>In relazione ai cookie, l'utente ha diritto di:</p>
<ul>
  <li>Essere informato sull'uso dei cookie</li>
  <li>Accettare o rifiutare i cookie</li>
  <li>Modificare le preferenze in qualsiasi momento</li>
  <li>Richiedere informazioni sui dati raccolti</li>
</ul>

<h2>8. Aggiornamenti della Cookie Policy</h2>
<p>Questa Cookie Policy potrebbe essere aggiornata periodicamente. Le modifiche saranno pubblicate su questa pagina con la nuova data di aggiornamento.</p>

<h2>9. Contatti</h2>
<p>Per qualsiasi domanda relativa all'uso dei cookie:</p>
<ul>
  <li>Email: privacy@lmtecnologie.it</li>
  <li>Telefono: +39 123 456 7890</li>
  <li>Indirizzo: Via Example, 123 - 00100 Roma</li>
</ul>`
      }
    ];

    for (const docData of documentsToUpdate) {
      // Cerca se il documento esiste
      let document = await prisma.legalDocument.findFirst({
        where: { type: docData.type }
      });

      if (!document) {
        // Crea il documento se non esiste
        console.log(`\n✅ Creo nuovo documento: ${docData.type}`);
        document = await prisma.legalDocument.create({
          data: {
            type: docData.type,
            displayName: docData.displayName,
            description: docData.description,
            category: 'LEGAL',
            isActive: true,
            isRequired: docData.type === 'TERMS_SERVICE' || docData.type === 'PRIVACY_POLICY',
            requiresAcceptance: true,
            requiresSignature: false,
            createdBy: 'system',
            createdAt: new Date()
          }
        });
      }

      // Cerca se esiste una versione
      const existingVersion = await prisma.legalDocumentVersion.findFirst({
        where: {
          documentId: document.id,
          status: 'PUBLISHED'
        }
      });

      if (existingVersion && !existingVersion.content?.includes('<')) {
        // Aggiorna la versione esistente con HTML
        console.log(`\n🔄 Aggiorno versione esistente per: ${docData.type}`);
        await prisma.legalDocumentVersion.update({
          where: { id: existingVersion.id },
          data: {
            content: docData.content,
            contentPlain: docData.content.replace(/<[^>]*>/g, '').substring(0, 500),
            title: docData.displayName,
            summary: docData.description
          }
        });
        console.log(`   ✅ Versione aggiornata con contenuto HTML`);
      } else if (!existingVersion) {
        // Crea una nuova versione con HTML
        console.log(`\n➕ Creo nuova versione per: ${docData.type}`);
        await prisma.legalDocumentVersion.create({
          data: {
            documentId: document.id,
            version: '1.0',
            title: docData.displayName,
            content: docData.content,
            contentPlain: docData.content.replace(/<[^>]*>/g, '').substring(0, 500),
            summary: docData.description,
            language: 'it',
            status: 'PUBLISHED',
            effectiveDate: new Date(),
            publishedAt: new Date(),
            publishedBy: 'system',
            createdBy: 'system'
          }
        });
        console.log(`   ✅ Nuova versione creata con contenuto HTML`);
      } else {
        console.log(`   ℹ️ Documento ${docData.type} già ha contenuto HTML`);
      }
    }

    console.log('\n\n✅ Aggiornamento completato!');
    console.log('📌 I documenti legali ora hanno contenuto HTML formattato.');
    
  } catch (error) {
    console.error('❌ Errore:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Esegui lo script
checkAndUpdateLegalDocuments();