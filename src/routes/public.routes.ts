import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';
import { prisma } from '../config/database';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/public/health
 * Health check pubblico
 */
router.get('/health', (req, res) => {
  return res.json(ResponseFormatter.success(
    {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    'Service is healthy'
  ));
});

/**
 * GET /api/public/info
 * Informazioni pubbliche sistema
 */
router.get('/info', (req, res) => {
  return res.json(ResponseFormatter.success(
    {
      name: 'Sistema Richiesta Assistenza',
      version: '1.0.0',
      description: 'Piattaforma professionale per gestione richieste assistenza'
    },
    'System info'
  ));
});

/**
 * GET /api/public/legal/all
 * Ottieni tutti i documenti legali pubblici
 */
router.get('/legal/all', async (req, res) => {
  try {
    // Cerca prima i documenti configurati nel sistema
    const documentTypes = await prisma.documentTypeConfig.findMany({
      where: {
        category: 'Legal',
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    // Se non ci sono tipi configurati, usa quelli di default
    if (documentTypes.length === 0) {
      const defaultDocs = [
        {
          id: 'privacy-policy',
          type: 'PRIVACY_POLICY',
          code: 'PRIVACY_POLICY',
          displayName: 'Privacy Policy',
          name: 'Privacy Policy',
          description: 'Come gestiamo e proteggiamo i tuoi dati personali',
          icon: 'ShieldCheckIcon',
          color: 'blue'
        },
        {
          id: 'terms-service',
          type: 'TERMS_SERVICE',
          code: 'TERMS_SERVICE',
          displayName: 'Termini di Servizio',
          name: 'Termini di Servizio',
          description: 'I termini e le condizioni per l\'utilizzo del servizio',
          icon: 'DocumentTextIcon',
          color: 'green'
        },
        {
          id: 'cookie-policy',
          type: 'COOKIE_POLICY',
          code: 'COOKIE_POLICY',
          displayName: 'Cookie Policy',
          name: 'Cookie Policy',
          description: 'Come utilizziamo i cookie sul nostro sito',
          icon: 'CakeIcon',
          color: 'yellow'
        }
      ];
      
      return res.json(ResponseFormatter.success(defaultDocs));
    }

    // Per ogni tipo, cerca se esiste un documento legale pubblicato
    const documentsWithStatus = await Promise.all(
      documentTypes.map(async (type) => {
        const legalDoc = await prisma.legalDocument.findFirst({
          where: {
            type: type.code,
            isActive: true
          },
          include: {
            versions: {
              where: {
                status: 'PUBLISHED',
                effectiveDate: {
                  lte: new Date()
                }
              },
              orderBy: {
                publishedAt: 'desc'
              },
              take: 1
            }
          }
        });

        return {
          ...type,
          type: type.code,
          hasPublishedVersion: legalDoc && legalDoc.versions.length > 0,
          currentVersion: legalDoc?.versions[0] || null,
          lastUpdated: legalDoc?.versions[0]?.publishedAt || null
        };
      })
    );

    return res.json(ResponseFormatter.success(documentsWithStatus));
  } catch (error: any) {
    logger.error('Error fetching public legal documents:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to fetch documents', 'FETCH_ERROR')
    );
  }
});

/**
 * GET /api/public/legal/:type
 * Ottieni un documento legale pubblico specifico
 */
router.get('/legal/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const documentType = type.toUpperCase().replace(/-/g, '_');

    // Cerca il documento
    const document = await prisma.legalDocument.findFirst({
      where: {
        type: documentType,
        isActive: true
      },
      include: {
        versions: {
          where: {
            status: 'PUBLISHED',
            effectiveDate: {
              lte: new Date()
            }
          },
          orderBy: {
            publishedAt: 'desc'
          },
          take: 1
        }
      }
    });

    // Se non esiste documento nel DB, crea uno di default con HTML
    if (!document || document.versions.length === 0) {
      const defaultDocuments: Record<string, any> = {
        'PRIVACY_POLICY': {
          type: 'PRIVACY_POLICY',
          displayName: 'Privacy Policy',
          description: 'Informativa sul trattamento dei dati personali',
          currentVersion: {
            id: 'default-privacy',
            version: '1.0',
            title: 'Informativa sulla Privacy',
            content: `
              <h1>Informativa sulla Privacy</h1>
              <p><em>Ai sensi del Regolamento UE 2016/679 (GDPR)</em></p>
              <p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>
              
              <h2>1. Titolare del Trattamento</h2>
              <p>Il Titolare del trattamento dei dati personali è <strong>LM Tecnologie</strong>, con sede legale in Via Example, 123.</p>
              
              <h2>2. Tipologie di Dati Raccolti</h2>
              <p>Raccogliamo le seguenti categorie di dati personali:</p>
              <ul>
                <li><strong>Dati anagrafici</strong>: nome, cognome, data di nascita</li>
                <li><strong>Dati di contatto</strong>: indirizzo email, numero di telefono</li>
                <li><strong>Dati di navigazione</strong>: indirizzo IP, browser utilizzato</li>
                <li><strong>Dati di utilizzo del servizio</strong>: preferenze, cronologia richieste</li>
              </ul>
              
              <h2>3. Finalità del Trattamento</h2>
              <p>I dati personali sono trattati per le seguenti finalità:</p>
              <ul>
                <li>Erogazione del servizio richiesto</li>
                <li>Adempimento degli obblighi contrattuali</li>
                <li>Adempimento degli obblighi di legge</li>
                <li>Marketing diretto (previo consenso)</li>
              </ul>
              
              <h2>4. Base Giuridica del Trattamento</h2>
              <p>Il trattamento dei dati si fonda sulle seguenti basi giuridiche:</p>
              <ul>
                <li>Esecuzione di un contratto (art. 6.1.b GDPR)</li>
                <li>Obbligo legale (art. 6.1.c GDPR)</li>
                <li>Consenso dell'interessato (art. 6.1.a GDPR)</li>
                <li>Legittimo interesse (art. 6.1.f GDPR)</li>
              </ul>
              
              <h2>5. Periodo di Conservazione</h2>
              <p>I dati personali saranno conservati per il periodo necessario al conseguimento delle finalità per cui sono stati raccolti e comunque:</p>
              <ul>
                <li>Dati contrattuali: 10 anni dalla cessazione del contratto</li>
                <li>Dati di navigazione: 6 mesi</li>
                <li>Dati di marketing: fino a revoca del consenso</li>
              </ul>
              
              <h2>6. Diritti dell'Interessato</h2>
              <p>L'interessato ha diritto di:</p>
              <ul>
                <li><strong>Accesso</strong> ai propri dati personali</li>
                <li><strong>Rettifica</strong> dei dati inesatti</li>
                <li><strong>Cancellazione</strong> dei dati (diritto all'oblio)</li>
                <li><strong>Limitazione</strong> del trattamento</li>
                <li><strong>Portabilità</strong> dei dati</li>
                <li><strong>Opposizione</strong> al trattamento</li>
              </ul>
              
              <h2>7. Contatti</h2>
              <p>Per esercitare i propri diritti o per qualsiasi domanda relativa alla privacy, è possibile contattare:</p>
              <ul>
                <li>Email: privacy@lmtecnologie.it</li>
                <li>Telefono: +39 123 456 7890</li>
                <li>Indirizzo: Via Example, 123</li>
              </ul>
            `,
            contentPlain: 'Informativa Privacy',
            summary: 'Informativa sul trattamento dei dati personali ai sensi del GDPR',
            effectiveDate: new Date(),
            language: 'it'
          },
          lastUpdated: new Date()
        },
        'TERMS_SERVICE': {
          type: 'TERMS_SERVICE',
          displayName: 'Termini e Condizioni',
          description: 'Termini e condizioni di utilizzo del servizio',
          currentVersion: {
            id: 'default-terms',
            version: '1.0',
            title: 'Termini e Condizioni di Servizio',
            content: `
              <h1>Termini e Condizioni di Servizio</h1>
              <p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>
              
              <h2>1. Accettazione dei Termini</h2>
              <p>Utilizzando i nostri servizi, l'utente accetta di essere vincolato dai presenti termini e condizioni. Se non si accettano questi termini, si prega di non utilizzare il servizio.</p>
              
              <h2>2. Descrizione del Servizio</h2>
              <p>Il nostro servizio fornisce una piattaforma per la gestione delle richieste di assistenza tecnica, mettendo in contatto clienti e professionisti qualificati.</p>
              
              <h2>3. Registrazione Account</h2>
              <p>Per utilizzare alcune funzionalità del servizio è necessario registrare un account. L'utente si impegna a:</p>
              <ul>
                <li>Fornire informazioni accurate, complete e aggiornate</li>
                <li>Mantenere la sicurezza del proprio account e password</li>
                <li>Notificare immediatamente qualsiasi uso non autorizzato</li>
                <li>Assumersi la responsabilità delle attività svolte con il proprio account</li>
              </ul>
              
              <h2>4. Obblighi dell'Utente</h2>
              <p>L'utente si impegna a:</p>
              <ul>
                <li>Non utilizzare il servizio per scopi illegali o non autorizzati</li>
                <li>Non violare diritti di proprietà intellettuale</li>
                <li>Non trasmettere virus o codice dannoso</li>
                <li>Non tentare di accedere a sistemi o dati non autorizzati</li>
                <li>Rispettare tutti gli altri utenti della piattaforma</li>
              </ul>
              
              <h2>5. Servizi Professionali</h2>
              <p>La piattaforma facilita il contatto tra clienti e professionisti, ma:</p>
              <ul>
                <li>Non siamo responsabili della qualità dei servizi forniti dai professionisti</li>
                <li>Non garantiamo la disponibilità di professionisti in tutte le aree</li>
                <li>Gli accordi tra clienti e professionisti sono responsabilità delle parti</li>
              </ul>
              
              <h2>6. Pagamenti</h2>
              <p>Per alcuni servizi potrebbero essere richiesti pagamenti:</p>
              <ul>
                <li>I prezzi sono indicati in Euro e includono l'IVA dove applicabile</li>
                <li>Il pagamento deve essere effettuato secondo le modalità indicate</li>
                <li>Le politiche di rimborso sono specificate separatamente</li>
              </ul>
              
              <h2>7. Limitazione di Responsabilità</h2>
              <p>Nella misura massima consentita dalla legge:</p>
              <ul>
                <li>Il servizio è fornito "così com'è" senza garanzie di alcun tipo</li>
                <li>Non siamo responsabili per danni indiretti o consequenziali</li>
                <li>La nostra responsabilità totale non supererà l'importo pagato dall'utente</li>
              </ul>
              
              <h2>8. Modifiche ai Termini</h2>
              <p>Ci riserviamo il diritto di modificare questi termini in qualsiasi momento. Le modifiche entreranno in vigore al momento della pubblicazione. L'uso continuato del servizio costituisce accettazione delle modifiche.</p>
              
              <h2>9. Legge Applicabile</h2>
              <p>Questi termini sono regolati dalla legge italiana. Per qualsiasi controversia, il foro competente è quello di Roma.</p>
              
              <h2>10. Contatti</h2>
              <p>Per domande sui presenti termini, contattare:</p>
              <ul>
                <li>Email: legal@lmtecnologie.it</li>
                <li>Telefono: +39 123 456 7890</li>
              </ul>
            `,
            contentPlain: 'Termini e Condizioni',
            summary: 'Termini e condizioni di utilizzo del servizio',
            effectiveDate: new Date(),
            language: 'it'
          },
          lastUpdated: new Date()
        },
        'COOKIE_POLICY': {
          type: 'COOKIE_POLICY',
          displayName: 'Cookie Policy',
          description: 'Informativa sull\'utilizzo dei cookie',
          currentVersion: {
            id: 'default-cookie',
            version: '1.0',
            title: 'Cookie Policy',
            content: `
              <h1>Cookie Policy</h1>
              <p>Ultimo aggiornamento: ${new Date().toLocaleDateString('it-IT')}</p>
              
              <h2>1. Cosa sono i Cookie</h2>
              <p>I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell'utente quando visita il nostro sito web. Servono a migliorare l'esperienza di navigazione e a fornire funzionalità personalizzate.</p>
              
              <h2>2. Tipologie di Cookie Utilizzati</h2>
              
              <h3>2.1 Cookie Tecnici (Necessari)</h3>
              <p>Questi cookie sono essenziali per il corretto funzionamento del sito:</p>
              <ul>
                <li><strong>Cookie di sessione</strong>: mantengono l'utente connesso durante la navigazione</li>
                <li><strong>Cookie di preferenze</strong>: memorizzano le preferenze dell'utente (lingua, tema)</li>
                <li><strong>Cookie di sicurezza</strong>: garantiscono la sicurezza della navigazione</li>
              </ul>
              
              <h3>2.2 Cookie Analitici</h3>
              <p>Utilizziamo cookie analitici per comprendere come gli utenti interagiscono con il sito:</p>
              <ul>
                <li><strong>Google Analytics</strong>: per analisi statistiche anonime</li>
                <li><strong>Cookie interni</strong>: per monitorare le performance del sito</li>
              </ul>
              
              <h3>2.3 Cookie di Terze Parti</h3>
              <p>Alcuni servizi esterni potrebbero installare propri cookie:</p>
              <ul>
                <li><strong>Google Maps</strong>: per la visualizzazione delle mappe</li>
                <li><strong>Stripe</strong>: per la gestione dei pagamenti</li>
                <li><strong>Social Media</strong>: per i pulsanti di condivisione</li>
              </ul>
              
              <h2>3. Durata dei Cookie</h2>
              <ul>
                <li><strong>Cookie di sessione</strong>: eliminati alla chiusura del browser</li>
                <li><strong>Cookie persistenti</strong>: rimangono per il periodo specificato (max 12 mesi)</li>
              </ul>
              
              <h2>4. Gestione dei Cookie</h2>
              <p>L'utente può gestire le preferenze sui cookie in diversi modi:</p>
              
              <h3>4.1 Tramite il nostro Banner Cookie</h3>
              <p>Al primo accesso, viene mostrato un banner per accettare o rifiutare i cookie non essenziali.</p>
              
              <h3>4.2 Tramite le Impostazioni del Browser</h3>
              <p>Tutti i browser permettono di gestire i cookie nelle impostazioni:</p>
              <ul>
                <li><strong>Chrome</strong>: Impostazioni > Privacy e sicurezza > Cookie</li>
                <li><strong>Firefox</strong>: Opzioni > Privacy e sicurezza</li>
                <li><strong>Safari</strong>: Preferenze > Privacy</li>
                <li><strong>Edge</strong>: Impostazioni > Privacy e servizi</li>
              </ul>
              
              <h2>5. Conseguenze del Rifiuto dei Cookie</h2>
              <p>Il rifiuto dei cookie potrebbe comportare:</p>
              <ul>
                <li>Impossibilità di mantenere la sessione di login</li>
                <li>Perdita delle preferenze personalizzate</li>
                <li>Funzionalità limitate del sito</li>
              </ul>
              
              <h2>6. Aggiornamenti della Cookie Policy</h2>
              <p>Questa policy potrebbe essere aggiornata periodicamente. Le modifiche saranno pubblicate su questa pagina con la data di aggiornamento.</p>
              
              <h2>7. Contatti</h2>
              <p>Per domande sulla nostra Cookie Policy:</p>
              <ul>
                <li>Email: privacy@lmtecnologie.it</li>
                <li>Telefono: +39 123 456 7890</li>
              </ul>
            `,
            contentPlain: 'Cookie Policy',
            summary: 'Informativa sull\'utilizzo dei cookie sul nostro sito',
            effectiveDate: new Date(),
            language: 'it'
          },
          lastUpdated: new Date()
        }
      };

      const defaultDoc = defaultDocuments[documentType];
      if (defaultDoc) {
        return res.json(ResponseFormatter.success(defaultDoc));
      }

      // Se non è uno dei tipi standard, ritorna errore
      return res.json(ResponseFormatter.success({
        type: documentType,
        displayName: documentType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        description: 'Documento in preparazione',
        currentVersion: null,
        message: 'Questo documento è in fase di preparazione e sarà disponibile a breve.'
      }));
    }

    const currentVersion = document.versions[0];

    return res.json(ResponseFormatter.success({
      id: document.id,
      type: document.type,
      displayName: document.displayName,
      description: document.description,
      currentVersion: {
        id: currentVersion.id,
        version: currentVersion.version,
        title: currentVersion.title,
        content: currentVersion.content,
        contentPlain: currentVersion.contentPlain,
        summary: currentVersion.summary,
        effectiveDate: currentVersion.effectiveDate,
        language: currentVersion.language || 'it'
      },
      lastUpdated: currentVersion.publishedAt
    }));
  } catch (error: any) {
    logger.error('Error fetching public legal document:', error);
    return res.status(500).json(
      ResponseFormatter.error('Failed to fetch document', 'FETCH_ERROR')
    );
  }
});

export default router;
