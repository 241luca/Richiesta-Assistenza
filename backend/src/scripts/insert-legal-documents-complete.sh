#!/bin/bash

echo "📜 Inserimento Documenti Legali nel Database"
echo "==========================================="
echo ""

# Colori per output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

cd /Users/lucamambelli/Desktop/Richiesta-Assistenza/backend

# Step 1: Ottieni un User ID admin valido
echo "1️⃣ Recupero ID utente admin..."
ADMIN_ID=$(echo "SELECT id FROM \"User\" WHERE role IN ('ADMIN', 'SUPER_ADMIN') LIMIT 1;" | npx prisma db execute --stdin 2>/dev/null | grep -o '[a-zA-Z0-9-]*' | tail -1)

if [ -z "$ADMIN_ID" ]; then
    echo -e "${RED}❌ Nessun utente admin trovato. Uso ID di fallback.${NC}"
    ADMIN_ID="system-admin"
else
    echo -e "${GREEN}✅ Admin ID trovato: $ADMIN_ID${NC}"
fi

# Step 2: Pulisci eventuali documenti esistenti
echo ""
echo "2️⃣ Pulizia documenti esistenti..."
cat << EOF | npx prisma db execute --stdin 2>/dev/null
DELETE FROM "UserLegalAcceptance";
DELETE FROM "LegalDocumentVersion";
DELETE FROM "LegalDocument";
EOF
echo -e "${GREEN}✅ Database pulito${NC}"

# Step 3: Inserisci i documenti principali
echo ""
echo "3️⃣ Inserimento documenti principali..."

# Privacy Policy
cat << EOF | npx prisma db execute --stdin
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "icon",
    "isActive", 
    "isRequired", 
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-privacy-2025',
    'PRIVACY_POLICY',
    'privacy-policy-2025',
    'Informativa sulla Privacy',
    'Informativa sul trattamento dei dati personali ai sensi del GDPR e del Codice Privacy italiano',
    'ShieldCheckIcon',
    true,
    true,
    1,
    NOW(),
    NOW(),
    '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Privacy Policy inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento Privacy Policy${NC}"
fi

# Terms of Service
cat << EOF | npx prisma db execute --stdin
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "icon",
    "isActive", 
    "isRequired", 
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-terms-2025',
    'TERMS_SERVICE',
    'terms-service-2025',
    'Termini e Condizioni',
    'Termini e condizioni di utilizzo del servizio di Richiesta Assistenza',
    'DocumentTextIcon',
    true,
    true,
    2,
    NOW(),
    NOW(),
    '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Terms of Service inseriti${NC}"
else
    echo -e "${RED}❌ Errore inserimento Terms of Service${NC}"
fi

# Cookie Policy
cat << EOF | npx prisma db execute --stdin
INSERT INTO "LegalDocument" (
    "id", 
    "type", 
    "internalName", 
    "displayName", 
    "description", 
    "icon",
    "isActive", 
    "isRequired", 
    "sortOrder", 
    "createdAt", 
    "updatedAt",
    "createdBy"
) VALUES (
    'doc-cookie-2025',
    'COOKIE_POLICY',
    'cookie-policy-2025',
    'Politica sui Cookie',
    'Informativa sull''utilizzo dei cookie e tecnologie simili',
    'CakeIcon',
    true,
    false,
    3,
    NOW(),
    NOW(),
    '$ADMIN_ID'
);
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cookie Policy inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento Cookie Policy${NC}"
fi

# Step 4: Inserisci le versioni pubblicate
echo ""
echo "4️⃣ Inserimento versioni pubblicate..."

# Versione Privacy Policy
cat << 'SQLEOF' | npx prisma db execute --stdin
INSERT INTO "LegalDocumentVersion" (
    "id",
    "documentId",
    "version",
    "title",
    "content",
    "contentPlain",
    "summary",
    "effectiveDate",
    "language",
    "status",
    "requiresAccept",
    "notifyUsers",
    "createdAt",
    "updatedAt",
    "createdBy",
    "publishedAt",
    "publishedBy"
) VALUES (
    'ver-privacy-1-0-0',
    'doc-privacy-2025',
    '1.0.0',
    'Informativa sulla Privacy - Versione 1.0',
    '<div class="legal-document">
<h1>Informativa sulla Privacy</h1>
<p class="subtitle">Ai sensi del Regolamento UE 2016/679 (GDPR) e del D.Lgs. 196/2003</p>
<p class="last-update">Ultimo aggiornamento: 16 Settembre 2025</p>

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
<li><strong>Erogazione del servizio:</strong> gestione delle richieste di assistenza e collegamento con professionisti</li>
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

<h2>5. Modalità di Trattamento</h2>
<p>I dati sono trattati con strumenti elettronici e procedure di sicurezza adeguate per garantire:</p>
<ul>
<li>Riservatezza e integrità dei dati</li>
<li>Protezione da accessi non autorizzati</li>
<li>Backup periodici e disaster recovery</li>
<li>Crittografia delle informazioni sensibili</li>
</ul>

<h2>6. Comunicazione e Diffusione</h2>
<p>I suoi dati potranno essere comunicati a:</p>
<ul>
<li><strong>Professionisti:</strong> solo i dati necessari per l''erogazione del servizio richiesto</li>
<li><strong>Provider tecnologici:</strong> hosting, email, pagamenti (tutti con accordi GDPR)</li>
<li><strong>Autorità competenti:</strong> su richiesta legittima</li>
<li><strong>Consulenti:</strong> commercialisti, avvocati (vincolati da segreto professionale)</li>
</ul>
<p>I dati non saranno mai venduti o ceduti a terzi per scopi di marketing.</p>

<h2>7. Trasferimento Dati Extra-UE</h2>
<p>Alcuni nostri fornitori di servizi potrebbero essere ubicati fuori dall''UE. In tal caso, garantiamo che il trasferimento avvenga solo verso paesi con decisione di adeguatezza o con garanzie appropriate (clausole contrattuali standard UE).</p>

<h2>8. Periodo di Conservazione</h2>
<p>I dati saranno conservati per:</p>
<ul>
<li><strong>Dati contrattuali:</strong> 10 anni dalla cessazione del rapporto (obbligo fiscale)</li>
<li><strong>Dati di navigazione:</strong> 6 mesi</li>
<li><strong>Dati di marketing:</strong> fino a revoca del consenso o 2 anni di inattività</li>
<li><strong>Backup di sicurezza:</strong> massimo 30 giorni</li>
</ul>

<h2>9. I Suoi Diritti</h2>
<p>In qualità di interessato, Lei ha diritto di:</p>
<ul>
<li><strong>Accesso:</strong> ottenere conferma e informazioni sul trattamento</li>
<li><strong>Rettifica:</strong> correggere dati inesatti o incompleti</li>
<li><strong>Cancellazione:</strong> richiedere la cancellazione nei casi previsti</li>
<li><strong>Limitazione:</strong> limitare il trattamento in determinate circostanze</li>
<li><strong>Portabilità:</strong> ricevere i dati in formato strutturato</li>
<li><strong>Opposizione:</strong> opporsi al trattamento per motivi legittimi</li>
<li><strong>Revoca del consenso:</strong> in qualsiasi momento, senza pregiudicare la liceità del trattamento basata sul consenso prima della revoca</li>
</ul>

<h2>10. Come Esercitare i Diritti</h2>
<p>Per esercitare i suoi diritti, può contattarci:</p>
<ul>
<li>Email: privacy@richiesta-assistenza.it</li>
<li>PEC: privacy@pec.richiesta-assistenza.it</li>
<li>Posta: Via Example 123, 00100 Roma</li>
</ul>
<p>Risponderemo entro 30 giorni dalla richiesta.</p>

<h2>11. Reclamo all''Autorità di Controllo</h2>
<p>Se ritiene che il trattamento violi il GDPR, ha diritto di proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it).</p>

<h2>12. Modifiche all''Informativa</h2>
<p>Questa informativa potrebbe essere aggiornata. La versione aggiornata sarà sempre disponibile su questa pagina con indicazione della data di ultimo aggiornamento.</p>

<h2>13. Cookie Policy</h2>
<p>Per informazioni sui cookie utilizzati, consulti la nostra <a href="/legal/cookie-policy">Cookie Policy</a>.</p>
</div>',
    'Informativa sulla Privacy completa e dettagliata...',
    'Prima versione dell''informativa privacy GDPR compliant',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    true,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    '$ADMIN_ID',
    NOW() - INTERVAL '30 days',
    '$ADMIN_ID'
);
SQLEOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Privacy Policy inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento versione Privacy Policy${NC}"
fi

# Versione Terms of Service
cat << 'SQLEOF' | npx prisma db execute --stdin
INSERT INTO "LegalDocumentVersion" (
    "id",
    "documentId",
    "version",
    "title",
    "content",
    "contentPlain",
    "summary",
    "effectiveDate",
    "language",
    "status",
    "requiresAccept",
    "notifyUsers",
    "createdAt",
    "updatedAt",
    "createdBy",
    "publishedAt",
    "publishedBy"
) VALUES (
    'ver-terms-1-0-0',
    'doc-terms-2025',
    '1.0.0',
    'Termini e Condizioni di Servizio - Versione 1.0',
    '<div class="legal-document">
<h1>Termini e Condizioni di Servizio</h1>
<p class="last-update">Ultimo aggiornamento: 16 Settembre 2025</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando il servizio "Richiesta Assistenza", accetti di essere vincolato dai presenti Termini e Condizioni. Se non accetti questi termini, non utilizzare il servizio.</p>

<h2>2. Descrizione del Servizio</h2>
<p>Richiesta Assistenza è una piattaforma che mette in contatto clienti che necessitano di servizi di assistenza tecnica con professionisti qualificati. Il servizio include:</p>
<ul>
<li>Pubblicazione di richieste di assistenza</li>
<li>Matching con professionisti qualificati</li>
<li>Gestione preventivi e pagamenti</li>
<li>Comunicazione tra clienti e professionisti</li>
<li>Valutazione e recensioni</li>
</ul>

<h2>3. Registrazione Account</h2>
<h3>3.1 Requisiti</h3>
<ul>
<li>Devi avere almeno 18 anni</li>
<li>Fornire informazioni accurate e complete</li>
<li>Mantenere aggiornati i tuoi dati</li>
<li>Proteggere le credenziali di accesso</li>
</ul>

<h3>3.2 Tipologie di Account</h3>
<ul>
<li><strong>Cliente:</strong> per richiedere servizi di assistenza</li>
<li><strong>Professionista:</strong> per offrire servizi (richiede verifica documenti)</li>
</ul>

<h2>4. Utilizzo del Servizio</h2>
<h3>4.1 Usi Consentiti</h3>
<p>Puoi utilizzare il servizio per:</p>
<ul>
<li>Richiedere assistenza tecnica legittima</li>
<li>Offrire servizi professionali se sei qualificato</li>
<li>Comunicare in modo professionale e rispettoso</li>
</ul>

<h3>4.2 Usi Vietati</h3>
<p>È vietato:</p>
<ul>
<li>Fornire informazioni false o ingannevoli</li>
<li>Utilizzare il servizio per attività illegali</li>
<li>Molestare o intimidire altri utenti</li>
<li>Violare diritti di proprietà intellettuale</li>
<li>Tentare di aggirare le commissioni della piattaforma</li>
<li>Creare account multipli senza autorizzazione</li>
<li>Utilizzare bot o sistemi automatizzati</li>
</ul>

<h2>5. Pagamenti e Commissioni</h2>
<h3>5.1 Per i Clienti</h3>
<ul>
<li>I prezzi sono indicati inclusivi di IVA</li>
<li>Il pagamento avviene tramite metodi sicuri</li>
<li>Possibilità di deposito cauzionale per alcuni servizi</li>
</ul>

<h3>5.2 Per i Professionisti</h3>
<ul>
<li>Commissione piattaforma: 15% sul valore del servizio</li>
<li>Pagamenti ricevuti entro 7 giorni lavorativi</li>
<li>Obbligo di emissione fattura</li>
</ul>

<h2>6. Cancellazione e Rimborsi</h2>
<ul>
<li>Cancellazione gratuita entro 24 ore dalla richiesta</li>
<li>Penale del 30% per cancellazioni tardive</li>
<li>Rimborso completo se il servizio non viene erogato</li>
<li>Procedura di contestazione entro 48 ore</li>
</ul>

<h2>7. Responsabilità e Garanzie</h2>
<h3>7.1 Limitazione di Responsabilità</h3>
<p>La piattaforma agisce solo come intermediario. Non siamo responsabili per:</p>
<ul>
<li>Qualità del servizio erogato dai professionisti</li>
<li>Danni diretti o indiretti derivanti dai servizi</li>
<li>Controversie tra clienti e professionisti</li>
</ul>

<h3>7.2 Garanzie dei Professionisti</h3>
<p>I professionisti garantiscono di:</p>
<ul>
<li>Essere qualificati e autorizzati</li>
<li>Avere assicurazione RC professionale</li>
<li>Rispettare normative di settore</li>
</ul>

<h2>8. Proprietà Intellettuale</h2>
<p>Tutti i contenuti della piattaforma (logo, testi, grafica, software) sono protetti da copyright. È vietata la riproduzione senza autorizzazione.</p>

<h2>9. Privacy e Dati Personali</h2>
<p>Il trattamento dei dati personali è regolato dalla nostra <a href="/legal/privacy-policy">Informativa sulla Privacy</a>.</p>

<h2>10. Modifiche ai Termini</h2>
<p>Ci riserviamo il diritto di modificare questi termini. Le modifiche saranno comunicate con 30 giorni di anticipo via email.</p>

<h2>11. Risoluzione Controversie</h2>
<ul>
<li>Tentativo di risoluzione amichevole entro 30 giorni</li>
<li>Mediazione presso organismo accreditato</li>
<li>Foro competente: Tribunale di Roma</li>
</ul>

<h2>12. Sospensione e Terminazione</h2>
<p>Possiamo sospendere o terminare il tuo account per:</p>
<ul>
<li>Violazione dei presenti termini</li>
<li>Attività fraudolente o illegali</li>
<li>Mancato pagamento</li>
<li>Comportamento inappropriato</li>
</ul>

<h2>13. Legge Applicabile</h2>
<p>Questi termini sono regolati dalla legge italiana.</p>

<h2>14. Contatti</h2>
<p>Per domande sui Termini di Servizio:</p>
<ul>
<li>Email: legal@richiesta-assistenza.it</li>
<li>PEC: legal@pec.richiesta-assistenza.it</li>
<li>Telefono: +39 06 12345678</li>
</ul>
</div>',
    'Termini e Condizioni di Servizio completi...',
    'Prima versione dei termini di servizio',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    true,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    '$ADMIN_ID',
    NOW() - INTERVAL '30 days',
    '$ADMIN_ID'
);
SQLEOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Terms of Service inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento versione Terms of Service${NC}"
fi

# Versione Cookie Policy
cat << 'SQLEOF' | npx prisma db execute --stdin
INSERT INTO "LegalDocumentVersion" (
    "id",
    "documentId",
    "version",
    "title",
    "content",
    "contentPlain",
    "summary",
    "effectiveDate",
    "language",
    "status",
    "requiresAccept",
    "notifyUsers",
    "createdAt",
    "updatedAt",
    "createdBy",
    "publishedAt",
    "publishedBy"
) VALUES (
    'ver-cookie-1-0-0',
    'doc-cookie-2025',
    '1.0.0',
    'Cookie Policy - Versione 1.0',
    '<div class="legal-document">
<h1>Cookie Policy</h1>
<p class="last-update">Ultimo aggiornamento: 16 Settembre 2025</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che i siti web salvano sul tuo computer o dispositivo mobile quando li visiti. Servono a far funzionare i siti web, o a migliorarne l''efficienza, così come a fornire informazioni ai proprietari del sito.</p>

<h2>2. Come Utilizziamo i Cookie</h2>
<p>Utilizziamo i cookie per:</p>
<ul>
<li>Ricordare le tue preferenze e impostazioni</li>
<li>Permetterti di navigare tra le pagine in modo efficiente</li>
<li>Migliorare la tua esperienza di navigazione</li>
<li>Analizzare come viene utilizzato il nostro sito</li>
</ul>

<h2>3. Tipi di Cookie che Utilizziamo</h2>

<h3>3.1 Cookie Strettamente Necessari</h3>
<p>Questi cookie sono essenziali per il funzionamento del sito. Includono:</p>
<table class="cookie-table">
<tr>
<th>Nome</th>
<th>Scopo</th>
<th>Durata</th>
</tr>
<tr>
<td>session_id</td>
<td>Mantenere la sessione utente</td>
<td>Sessione</td>
</tr>
<tr>
<td>csrf_token</td>
<td>Sicurezza - prevenzione CSRF</td>
<td>Sessione</td>
</tr>
<tr>
<td>auth_token</td>
<td>Autenticazione utente</td>
<td>7 giorni</td>
</tr>
</table>

<h3>3.2 Cookie di Prestazione</h3>
<p>Ci aiutano a capire come i visitatori interagiscono con il sito:</p>
<table class="cookie-table">
<tr>
<th>Nome</th>
<th>Provider</th>
<th>Scopo</th>
<th>Durata</th>
</tr>
<tr>
<td>_ga</td>
<td>Google Analytics</td>
<td>Distinguere gli utenti</td>
<td>2 anni</td>
</tr>
<tr>
<td>_gid</td>
<td>Google Analytics</td>
<td>Distinguere gli utenti</td>
<td>24 ore</td>
</tr>
</table>

<h3>3.3 Cookie Funzionali</h3>
<p>Permettono al sito di ricordare le scelte che fai:</p>
<table class="cookie-table">
<tr>
<th>Nome</th>
<th>Scopo</th>
<th>Durata</th>
</tr>
<tr>
<td>language</td>
<td>Lingua preferita</td>
<td>1 anno</td>
</tr>
<tr>
<td>timezone</td>
<td>Fuso orario</td>
<td>1 anno</td>
</tr>
<tr>
<td>theme</td>
<td>Tema chiaro/scuro</td>
<td>1 anno</td>
</tr>
</table>

<h3>3.4 Cookie di Marketing</h3>
<p>Utilizzati per tracciare i visitatori attraverso i siti web:</p>
<table class="cookie-table">
<tr>
<th>Nome</th>
<th>Provider</th>
<th>Scopo</th>
<th>Durata</th>
</tr>
<tr>
<td>fbp</td>
<td>Facebook</td>
<td>Pubblicità mirata</td>
<td>3 mesi</td>
</tr>
<tr>
<td>IDE</td>
<td>Google</td>
<td>Pubblicità mirata</td>
<td>1 anno</td>
</tr>
</table>

<h2>4. Cookie di Terze Parti</h2>
<p>Alcuni servizi di terze parti potrebbero impostare i propri cookie:</p>
<ul>
<li><strong>Google Analytics:</strong> per analisi del traffico</li>
<li><strong>Google Maps:</strong> per servizi di geolocalizzazione</li>
<li><strong>Stripe:</strong> per elaborazione pagamenti</li>
<li><strong>Facebook Pixel:</strong> per remarketing (solo con consenso)</li>
</ul>

<h2>5. Gestione dei Cookie</h2>

<h3>5.1 Consenso</h3>
<p>Al primo accesso al sito, ti verrà richiesto il consenso per i cookie non essenziali. Puoi modificare le tue preferenze in qualsiasi momento.</p>

<h3>5.2 Come Controllare i Cookie</h3>
<p>Puoi controllare e/o eliminare i cookie attraverso le impostazioni del browser:</p>
<ul>
<li><a href="https://support.google.com/chrome/answer/95647">Chrome</a></li>
<li><a href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie">Firefox</a></li>
<li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac">Safari</a></li>
<li><a href="https://support.microsoft.com/it-it/help/17442">Internet Explorer</a></li>
<li><a href="https://help.opera.com/en/latest/web-preferences/#cookies">Opera</a></li>
</ul>

<h3>5.3 Disabilitazione dei Cookie</h3>
<p>Nota che disabilitando i cookie, alcune funzionalità del sito potrebbero non essere disponibili o non funzionare correttamente.</p>

<h2>6. Cookie e Dati Personali</h2>
<p>Alcuni cookie possono raccogliere dati personali. Per maggiori informazioni su come trattiamo i tuoi dati personali, consulta la nostra <a href="/legal/privacy-policy">Informativa sulla Privacy</a>.</p>

<h2>7. Modifiche a questa Policy</h2>
<p>Potremmo aggiornare periodicamente questa Cookie Policy. Ti informeremo di eventuali modifiche pubblicando la nuova policy su questa pagina.</p>

<h2>8. Contatti</h2>
<p>Per domande sulla Cookie Policy:</p>
<ul>
<li>Email: privacy@richiesta-assistenza.it</li>
<li>Telefono: +39 06 12345678</li>
<li>Indirizzo: Via Example 123, 00100 Roma</li>
</ul>

<h2>9. Maggiori Informazioni sui Cookie</h2>
<p>Per maggiori informazioni sui cookie in generale, visita:</p>
<ul>
<li><a href="https://www.garanteprivacy.it/cookie">Garante Privacy - Cookie</a></li>
<li><a href="https://www.youronlinechoices.com/it/">Your Online Choices</a></li>
<li><a href="https://www.allaboutcookies.org/">All About Cookies</a></li>
</ul>
</div>',
    'Cookie Policy completa e dettagliata...',
    'Prima versione della cookie policy',
    NOW() - INTERVAL '30 days',
    'it',
    'PUBLISHED',
    false,
    false,
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    '$ADMIN_ID',
    NOW() - INTERVAL '30 days',
    '$ADMIN_ID'
);
SQLEOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Versione Cookie Policy inserita${NC}"
else
    echo -e "${RED}❌ Errore inserimento versione Cookie Policy${NC}"
fi

# Step 5: Verifica inserimento
echo ""
echo "5️⃣ Verifica finale..."
echo ""

# Conta documenti
DOC_COUNT=$(echo "SELECT COUNT(*) FROM \"LegalDocument\";" | npx prisma db execute --stdin 2>/dev/null | grep -o '[0-9]*' | tail -1)
echo "📊 Documenti inseriti: ${YELLOW}$DOC_COUNT${NC}"

# Conta versioni
VER_COUNT=$(echo "SELECT COUNT(*) FROM \"LegalDocumentVersion\";" | npx prisma db execute --stdin 2>/dev/null | grep -o '[0-9]*' | tail -1)
echo "📄 Versioni inserite: ${YELLOW}$VER_COUNT${NC}"

# Lista documenti
echo ""
echo "📋 Documenti nel database:"
echo "SELECT type, displayName, isActive FROM \"LegalDocument\" ORDER BY sortOrder;" | npx prisma db execute --stdin 2>/dev/null | tail -n +3

echo ""
echo -e "${GREEN}✅ Inserimento completato con successo!${NC}"
echo ""
echo "📌 Prossimi passi:"
echo "1. Vai su http://localhost:5193/admin/legal-documents per gestire i documenti"
echo "2. Vai su http://localhost:5193/legal per vedere la pagina pubblica"
echo "3. Clicca su ogni documento per vedere il dettaglio"
echo ""
echo "🧪 Test API endpoints:"
echo "   curl http://localhost:3200/api/public/legal/all"
echo "   curl http://localhost:3200/api/public/legal/privacy-policy"
echo "   curl http://localhost:3200/api/public/legal/terms-service"
echo "   curl http://localhost:3200/api/public/legal/cookie-policy"
