-- ============================================
-- INSERIMENTO DOCUMENTI LEGALI CON CONTENUTO COMPLETO
-- Parte 3: I documenti effettivi
-- ============================================

-- Pulisce solo le tabelle dei documenti legali
DELETE FROM "LegalDocumentVersion";
DELETE FROM "LegalDocument";

-- ============================================
-- 1. CREAZIONE DOCUMENTI BASE
-- ============================================

-- Privacy Policy
INSERT INTO "LegalDocument" (
    id, 
    type, 
    "internalName", 
    "displayName", 
    description,
    "isActive", 
    "isRequired", 
    "requiresAcceptance", 
    "sortOrder",
    "createdAt", 
    "updatedAt"
) VALUES (
    'legal-privacy-2025', 
    'PRIVACY_POLICY', 
    'privacy-policy-2025',
    'Informativa sulla Privacy e Protezione dei Dati',
    'Informativa completa sul trattamento dei dati personali ai sensi del GDPR e della normativa italiana sulla privacy',
    true, 
    true, 
    true, 
    1, 
    NOW(), 
    NOW()
);

-- Termini di Servizio
INSERT INTO "LegalDocument" (
    id, 
    type, 
    "internalName", 
    "displayName", 
    description,
    "isActive", 
    "isRequired", 
    "requiresAcceptance", 
    "sortOrder",
    "createdAt", 
    "updatedAt"
) VALUES (
    'legal-terms-2025',
    'TERMS_SERVICE',
    'terms-service-2025', 
    'Termini e Condizioni di Servizio',
    'Termini e condizioni complete per utilizzo della piattaforma Richiesta Assistenza',
    true,
    true,
    true,
    2,
    NOW(),
    NOW()
);

-- Cookie Policy
INSERT INTO "LegalDocument" (
    id, 
    type, 
    "internalName", 
    "displayName", 
    description,
    "isActive", 
    "isRequired", 
    "requiresAcceptance", 
    "sortOrder",
    "createdAt", 
    "updatedAt"
) VALUES (
    'legal-cookie-2025',
    'COOKIE_POLICY',
    'cookie-policy-2025',
    'Cookie Policy',
    'Informativa completa sui cookie e tecnologie simili utilizzate dalla piattaforma',
    true,
    true,
    true,
    3,
    NOW(),
    NOW()
);

-- ============================================
-- 2. VERSIONI CON CONTENUTO HTML COMPLETO
-- ============================================

-- PRIVACY POLICY COMPLETA
INSERT INTO "LegalDocumentVersion" (
    id, 
    "documentId", 
    version, 
    title, 
    content, 
    "contentPlain",
    summary, 
    "effectiveDate", 
    status, 
    language, 
    "requiresAccept",
    "createdAt", 
    "updatedAt"
) VALUES (
    'ver-privacy-full-2025',
    'legal-privacy-2025',
    '1.0.0',
    'Informativa sulla Privacy - GDPR 2025',
    E'<div class="legal-document privacy-policy">
<style>
.legal-document { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; line-height: 1.6; color: #333; }
.legal-document h1 { color: #1976d2; border-bottom: 3px solid #1976d2; padding-bottom: 10px; }
.legal-document h2 { color: #333; margin-top: 40px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
.legal-document h3 { color: #555; margin-top: 25px; margin-bottom: 15px; }
.table-of-contents { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0; }
.highlight-box { background: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 20px 0; }
.warning-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
.info-box { background: #f3e5f5; border-left: 4px solid #9c27b0; padding: 15px; margin: 20px 0; }
.legal-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
.legal-table th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
.legal-table td { padding: 10px 12px; border-bottom: 1px solid #eee; }
</style>

<h1>Informativa sulla Privacy e Protezione dei Dati Personali</h1>
<p class="last-updated"><strong>Ultimo aggiornamento:</strong> Gennaio 2025 • <strong>Versione:</strong> 1.0.0</p>

<div class="table-of-contents">
<h2>Indice</h2>
<ol>
<li><a href="#intro">Introduzione e Titolare del Trattamento</a></li>
<li><a href="#dati">Quali Dati Raccogliamo</a></li>
<li><a href="#finalita">Finalità e Base Giuridica</a></li>
<li><a href="#modalita">Modalità di Trattamento</a></li>
<li><a href="#destinatari">Destinatari dei Dati</a></li>
<li><a href="#trasferimenti">Trasferimenti Internazionali</a></li>
<li><a href="#conservazione">Periodo di Conservazione</a></li>
<li><a href="#diritti">I Tuoi Diritti</a></li>
<li><a href="#sicurezza">Misure di Sicurezza</a></li>
<li><a href="#cookie">Cookie e Tecnologie Simili</a></li>
<li><a href="#minori">Protezione dei Minori</a></li>
<li><a href="#modifiche">Modifiche all\'Informativa</a></li>
<li><a href="#contatti">Contatti e DPO</a></li>
</ol>
</div>

<section id="intro">
<h2>1. Introduzione e Titolare del Trattamento</h2>
<p>La presente Informativa sulla Privacy descrive come <strong>LM Tecnologie S.r.l.</strong> ("noi", "nostro/a/i/e", la "Società" o "Richiesta Assistenza") raccoglie, utilizza, condivide e protegge i dati personali degli utenti che utilizzano la nostra piattaforma di intermediazione per servizi di assistenza tecnica.</p>

<div class="info-box">
<p><strong>Titolare del Trattamento:</strong><br>
LM Tecnologie S.r.l.<br>
Sede Legale: Via Roma 1, 00100 Roma<br>
P.IVA: IT12345678901<br>
Email: privacy@richiesta-assistenza.it<br>
PEC: lmtecnologie@pec.it<br>
Telefono: +39 06 12345678</p>
</div>

<p>Ci impegniamo a proteggere la tua privacy e a trattare i tuoi dati personali in conformità con:</p>
<ul>
<li>Regolamento UE 2016/679 (GDPR)</li>
<li>D.Lgs. 196/2003 (Codice Privacy) come modificato dal D.Lgs. 101/2018</li>
<li>Provvedimenti del Garante per la Protezione dei Dati Personali</li>
<li>Linee guida EDPB (European Data Protection Board)</li>
</ul>
</section>

<section id="dati">
<h2>2. Quali Dati Raccogliamo</h2>

<h3>2.1 Dati forniti direttamente dall\'utente</h3>
<table class="legal-table">
<thead>
<tr>
<th>Categoria</th>
<th>Tipi di Dati</th>
<th>Obbligatorio</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Dati anagrafici</strong></td>
<td>Nome, cognome, data di nascita, codice fiscale</td>
<td>Sì</td>
</tr>
<tr>
<td><strong>Dati di contatto</strong></td>
<td>Email, numero di telefono, indirizzo</td>
<td>Sì</td>
</tr>
<tr>
<td><strong>Dati account</strong></td>
<td>Username, password (criptata), preferenze</td>
<td>Sì</td>
</tr>
<tr>
<td><strong>Dati professionali</strong></td>
<td>P.IVA, qualifiche, certificazioni, curriculum</td>
<td>Solo professionisti</td>
</tr>
<tr>
<td><strong>Dati pagamento</strong></td>
<td>IBAN, dati carta (tramite Stripe)</td>
<td>Per transazioni</td>
</tr>
<tr>
<td><strong>Dati servizio</strong></td>
<td>Richieste assistenza, preventivi, chat</td>
<td>Per utilizzo</td>
</tr>
</tbody>
</table>

<h3>2.2 Dati raccolti automaticamente</h3>
<ul>
<li><strong>Dati di navigazione:</strong> Indirizzo IP, browser, sistema operativo, pagine visitate</li>
<li><strong>Cookie e tecnologie simili:</strong> Cookie tecnici, funzionali, analitici (vedi Cookie Policy)</li>
<li><strong>Dati di geolocalizzazione:</strong> Posizione approssimativa per matching servizi</li>
<li><strong>Log di sistema:</strong> Accessi, azioni, errori, performance</li>
<li><strong>Dati dispositivo:</strong> Tipo dispositivo, risoluzione schermo, lingua</li>
</ul>

<h3>2.3 Dati da fonti terze</h3>
<ul>
<li><strong>Servizi di pagamento (Stripe):</strong> Conferme transazioni, stato pagamenti</li>
<li><strong>Google Maps:</strong> Indirizzi verificati, distanze, percorsi</li>
<li><strong>Social login (se attivato):</strong> Nome, email, foto profilo</li>
<li><strong>Verifiche background:</strong> Controlli su professionisti (con consenso)</li>
</ul>
</section>

<section id="finalita">
<h2>3. Finalità e Base Giuridica del Trattamento</h2>

<table class="legal-table">
<thead>
<tr>
<th>Finalità</th>
<th>Base Giuridica</th>
<th>Periodo Conservazione</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Gestione account e servizio</strong><br>
Creazione account, autenticazione, gestione profilo</td>
<td>Esecuzione contratto<br>(Art. 6.1.b GDPR)</td>
<td>Durata rapporto + 1 anno</td>
</tr>
<tr>
<td><strong>Fornitura servizi piattaforma</strong><br>
Matching clienti-professionisti, gestione richieste</td>
<td>Esecuzione contratto<br>(Art. 6.1.b GDPR)</td>
<td>Durata rapporto + 5 anni</td>
</tr>
<tr>
<td><strong>Pagamenti e fatturazione</strong><br>
Processamento pagamenti, commissioni, fatture</td>
<td>Esecuzione contratto + Obbligo legale<br>(Art. 6.1.b/c GDPR)</td>
<td>10 anni (fiscale)</td>
</tr>
<tr>
<td><strong>Comunicazioni di servizio</strong><br>
Notifiche transazionali, aggiornamenti sistema</td>
<td>Esecuzione contratto<br>(Art. 6.1.b GDPR)</td>
<td>Durata rapporto</td>
</tr>
<tr>
<td><strong>Marketing diretto</strong><br>
Newsletter, promozioni, offerte personalizzate</td>
<td>Consenso<br>(Art. 6.1.a GDPR)</td>
<td>Fino a revoca consenso</td>
</tr>
<tr>
<td><strong>Sicurezza e prevenzione frodi</strong><br>
Monitoraggio accessi, rilevamento anomalie</td>
<td>Legittimo interesse<br>(Art. 6.1.f GDPR)</td>
<td>90 giorni (log)</td>
</tr>
<tr>
<td><strong>Supporto clienti</strong><br>
Assistenza tecnica, gestione reclami</td>
<td>Esecuzione contratto<br>(Art. 6.1.b GDPR)</td>
<td>3 anni</td>
</tr>
<tr>
<td><strong>Miglioramento servizi</strong><br>
Analytics, A/B testing, ricerche mercato</td>
<td>Legittimo interesse<br>(Art. 6.1.f GDPR)</td>
<td>Dati aggregati: illimitato</td>
</tr>
<tr>
<td><strong>Conformità legale</strong><br>
Adempimenti fiscali, antiriciclaggio, ordini autorità</td>
<td>Obbligo legale<br>(Art. 6.1.c GDPR)</td>
<td>Secondo normativa</td>
</tr>
</tbody>
</table>
</section>

<section id="modalita">
<h2>4. Modalità di Trattamento</h2>

<p>Il trattamento dei dati personali avviene mediante:</p>
<ul>
<li><strong>Strumenti informatici:</strong> Server sicuri, database criptati, backup automatici</li>
<li><strong>Strumenti telematici:</strong> API sicure, connessioni HTTPS/TLS 1.3</li>
<li><strong>Strumenti manuali:</strong> Accesso limitato, procedure documentate</li>
</ul>

<div class="highlight-box">
<h3>Principi applicati al trattamento:</h3>
<ul>
<li><strong>Liceità:</strong> Trattamento basato su basi giuridiche valide</li>
<li><strong>Correttezza:</strong> Trasparenza e rispetto dei diritti</li>
<li><strong>Trasparenza:</strong> Informazioni chiare e accessibili</li>
<li><strong>Limitazione finalità:</strong> Dati usati solo per scopi dichiarati</li>
<li><strong>Minimizzazione:</strong> Solo dati necessari</li>
<li><strong>Esattezza:</strong> Dati aggiornati e corretti</li>
<li><strong>Limitazione conservazione:</strong> Tempi definiti</li>
<li><strong>Integrità e riservatezza:</strong> Sicurezza tecnica e organizzativa</li>
<li><strong>Responsabilizzazione:</strong> Documentazione e conformità</li>
</ul>
</div>
</section>

<section id="destinatari">
<h2>5. Destinatari dei Dati</h2>

<h3>5.1 Categorie di destinatari interni</h3>
<ul>
<li><strong>Personale autorizzato:</strong> Dipendenti e collaboratori sotto vincolo di riservatezza</li>
<li><strong>Amministratori sistema:</strong> Per manutenzione tecnica</li>
<li><strong>Supporto clienti:</strong> Per assistenza utenti</li>
</ul>

<h3>5.2 Categorie di destinatari esterni</h3>
<table class="legal-table">
<thead>
<tr>
<th>Categoria</th>
<th>Esempi</th>
<th>Finalità</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Professionisti piattaforma</strong></td>
<td>Idraulici, elettricisti, etc.</td>
<td>Erogazione servizi richiesti</td>
</tr>
<tr>
<td><strong>Fornitori servizi IT</strong></td>
<td>AWS, Google Cloud, hosting</td>
<td>Infrastruttura tecnologica</td>
</tr>
<tr>
<td><strong>Servizi pagamento</strong></td>
<td>Stripe, PayPal, banche</td>
<td>Processamento transazioni</td>
</tr>
<tr>
<td><strong>Servizi comunicazione</strong></td>
<td>Brevo, WhatsApp Business</td>
<td>Invio notifiche e messaggi</td>
</tr>
<tr>
<td><strong>Servizi analytics</strong></td>
<td>Google Analytics, Hotjar</td>
<td>Analisi utilizzo piattaforma</td>
</tr>
<tr>
<td><strong>Consulenti professionali</strong></td>
<td>Commercialisti, avvocati</td>
<td>Adempimenti legali/fiscali</td>
</tr>
<tr>
<td><strong>Autorità pubbliche</strong></td>
<td>Agenzia Entrate, Autorità giudiziaria</td>
<td>Obblighi di legge</td>
</tr>
</tbody>
</table>

<div class="warning-box">
<p><strong>Importante:</strong> Non vendiamo, affittiamo o condividiamo i tuoi dati personali con terze parti per loro finalità di marketing senza il tuo consenso esplicito.</p>
</div>
</section>

<section id="trasferimenti">
<h2>6. Trasferimenti Internazionali</h2>

<p>Alcuni fornitori di servizi hanno sede fuori dall\'UE/SEE. In questi casi garantiamo protezione adeguata tramite:</p>

<ul>
<li><strong>Decisioni di adeguatezza</strong> della Commissione Europea</li>
<li><strong>Clausole Contrattuali Standard (SCC)</strong> 2021/914</li>
<li><strong>Certificazioni specifiche</strong> (es. Data Privacy Framework per USA)</li>
<li><strong>Misure supplementari</strong> secondo raccomandazioni EDPB 01/2020</li>
</ul>

<table class="legal-table">
<thead>
<tr>
<th>Fornitore</th>
<th>Paese</th>
<th>Garanzia</th>
</tr>
</thead>
<tbody>
<tr>
<td>Stripe</td>
<td>USA</td>
<td>SCC + DPF</td>
</tr>
<tr>
<td>Google (Maps, Analytics)</td>
<td>USA</td>
<td>SCC + misure supplementari</td>
</tr>
<tr>
<td>OpenAI</td>
<td>USA</td>
<td>SCC + crittografia</td>
</tr>
<tr>
<td>WhatsApp Business</td>
<td>USA</td>
<td>SCC + DPF</td>
</tr>
</tbody>
</table>
</section>

<section id="conservazione">
<h2>7. Periodo di Conservazione</h2>

<p>I dati sono conservati per il tempo necessario alle finalità per cui sono stati raccolti:</p>

<div class="info-box">
<h3>Criteri di determinazione:</h3>
<ul>
<li><strong>Durata contrattuale:</strong> Per tutta la durata del rapporto</li>
<li><strong>Obblighi legali:</strong> Secondo termini di legge (es. 10 anni fiscale)</li>
<li><strong>Contenzioso:</strong> Fino a definizione delle controversie</li>
<li><strong>Consenso:</strong> Fino a revoca per dati marketing</li>
<li><strong>Legittimo interesse:</strong> Bilanciato con diritti interessato</li>
</ul>
</div>

<table class="legal-table">
<thead>
<tr>
<th>Tipo Dato</th>
<th>Periodo</th>
<th>Note</th>
</tr>
</thead>
<tbody>
<tr>
<td>Account attivo</td>
<td>Durata rapporto</td>
<td>Cancellazione su richiesta</td>
</tr>
<tr>
<td>Account inattivo</td>
<td>24 mesi</td>
<td>Poi cancellazione automatica</td>
</tr>
<tr>
<td>Documenti fiscali</td>
<td>10 anni</td>
<td>Obbligo legale</td>
</tr>
<tr>
<td>Log sicurezza</td>
<td>90 giorni</td>
<td>Rotazione automatica</td>
</tr>
<tr>
<td>Chat/messaggi</td>
<td>5 anni</td>
<td>Per eventuali contestazioni</td>
</tr>
<tr>
<td>Cookie tecnici</td>
<td>Sessione</td>
<td>Eliminati a chiusura browser</td>
</tr>
<tr>
<td>Cookie analytics</td>
<td>12 mesi</td>
<td>Rinnovo con consenso</td>
</tr>
<tr>
<td>Backup</td>
<td>30 giorni</td>
<td>Rotazione automatica</td>
</tr>
</tbody>
</table>
</section>

<section id="diritti">
<h2>8. I Tuoi Diritti</h2>

<p>In qualità di interessato, hai i seguenti diritti garantiti dal GDPR:</p>

<div class="highlight-box">
<h3>Diritti esercitabili:</h3>

<h4>➤ Diritto di accesso (Art. 15 GDPR)</h4>
<p>Ottenere conferma del trattamento e accesso ai tuoi dati personali</p>

<h4>➤ Diritto di rettifica (Art. 16 GDPR)</h4>
<p>Correggere dati inesatti o completare quelli incompleti</p>

<h4>➤ Diritto alla cancellazione - "oblio" (Art. 17 GDPR)</h4>
<p>Richiedere cancellazione quando:</p>
<ul>
<li>I dati non sono più necessari</li>
<li>Revochi il consenso</li>
<li>Ti opponi al trattamento</li>
<li>Trattamento illecito</li>
</ul>

<h4>➤ Diritto di limitazione (Art. 18 GDPR)</h4>
<p>Limitare il trattamento in caso di contestazione</p>

<h4>➤ Diritto alla portabilità (Art. 20 GDPR)</h4>
<p>Ricevere i dati in formato strutturato e trasferirli</p>

<h4>➤ Diritto di opposizione (Art. 21 GDPR)</h4>
<p>Opporti al trattamento per legittimo interesse o marketing</p>

<h4>➤ Diritto a non essere sottoposto a decisioni automatizzate (Art. 22 GDPR)</h4>
<p>Richiedere intervento umano nelle decisioni automatiche</p>

<h4>➤ Diritto di revoca del consenso (Art. 7 GDPR)</h4>
<p>Revocare il consenso in qualsiasi momento</p>

<h4>➤ Diritto di reclamo (Art. 77 GDPR)</h4>
<p>Proporre reclamo al Garante Privacy</p>
</div>

<h3>Come esercitare i diritti</h3>
<p>Puoi esercitare i tuoi diritti contattando:</p>
<ul>
<li><strong>Email:</strong> privacy@richiesta-assistenza.it</li>
<li><strong>PEC:</strong> lmtecnologie@pec.it</li>
<li><strong>Modulo web:</strong> <a href="/privacy/rights">Esercizio diritti privacy</a></li>
<li><strong>Posta:</strong> Via Roma 1, 00100 Roma</li>
</ul>

<p>Risponderemo entro 30 giorni dalla richiesta (estendibili a 90 in casi complessi).</p>
</section>

<section id="sicurezza">
<h2>9. Misure di Sicurezza</h2>

<p>Implementiamo misure tecniche e organizzative appropriate per proteggere i dati:</p>

<h3>9.1 Misure tecniche</h3>
<ul>
<li><strong>Crittografia:</strong> TLS 1.3 in transito, AES-256 at rest</li>
<li><strong>Hashing password:</strong> bcrypt con salt rounds ≥ 10</li>
<li><strong>Firewall:</strong> WAF e network firewall</li>
<li><strong>Backup:</strong> Automatici, criptati, georidondanti</li>
<li><strong>Monitoraggio:</strong> IDS/IPS, log analysis, SIEM</li>
<li><strong>Patching:</strong> Aggiornamenti di sicurezza regolari</li>
<li><strong>Testing:</strong> Penetration test annuali, vulnerability assessment</li>
<li><strong>2FA:</strong> Autenticazione a due fattori disponibile</li>
</ul>

<h3>9.2 Misure organizzative</h3>
<ul>
<li><strong>Accesso limitato:</strong> Principio del minimo privilegio</li>
<li><strong>Formazione:</strong> Training privacy/sicurezza per staff</li>
<li><strong>NDA:</strong> Accordi di riservatezza</li>
<li><strong>Procedure:</strong> Incident response, data breach</li>
<li><strong>Audit:</strong> Verifiche periodiche conformità</li>
<li><strong>DPO:</strong> Data Protection Officer nominato</li>
<li><strong>DPIA:</strong> Valutazioni d\'impatto quando necessario</li>
<li><strong>Privacy by design:</strong> Protezione dati dalla progettazione</li>
</ul>

<div class="warning-box">
<h3>Notifica Data Breach</h3>
<p>In caso di violazione dei dati personali con rischio per i diritti e libertà:</p>
<ul>
<li>Notifica al Garante entro 72 ore</li>
<li>Comunicazione agli interessati senza ritardo se rischio elevato</li>
<li>Documentazione completa dell\'incidente</li>
</ul>
</div>
</section>

<section id="cookie">
<h2>10. Cookie e Tecnologie Simili</h2>

<p>Utilizziamo cookie e tecnologie simili per migliorare l\'esperienza utente. Per informazioni dettagliate consulta la nostra <a href="/legal/cookie-policy">Cookie Policy completa</a>.</p>

<h3>Categorie principali:</h3>
<ul>
<li><strong>Cookie necessari:</strong> Essenziali per il funzionamento (sempre attivi)</li>
<li><strong>Cookie funzionali:</strong> Migliorano funzionalità e personalizzazione</li>
<li><strong>Cookie analitici:</strong> Ci aiutano a capire come usi il sito</li>
<li><strong>Cookie marketing:</strong> Per mostrarti contenuti pertinenti</li>
</ul>

<p>Puoi gestire le preferenze cookie tramite il banner cookie o le impostazioni del browser.</p>
</section>

<section id="minori">
<h2>11. Protezione dei Minori</h2>

<div class="warning-box">
<p><strong>Importante:</strong> Il nostro servizio non è destinato a minori di 18 anni.</p>
</div>

<p>Non raccogliamo consapevolmente dati personali di minori. Se veniamo a conoscenza di aver raccolto dati di minori, provvederemo a:</p>
<ul>
<li>Cancellare immediatamente tali dati</li>
<li>Terminare l\'account associato</li>
<li>Notificare i genitori/tutori se possibile</li>
</ul>

<p>Se sei un genitore/tutore e ritieni che tuo figlio ci abbia fornito dati, contattaci immediatamente.</p>
</section>

<section id="modifiche">
<h2>12. Modifiche all\'Informativa</h2>

<p>Potremmo aggiornare periodicamente questa Informativa per riflettere:</p>
<ul>
<li>Modifiche alle nostre pratiche</li>
<li>Nuove funzionalità del servizio</li>
<li>Requisiti legali o regolamentari</li>
<li>Feedback degli utenti</li>
</ul>

<div class="info-box">
<h3>Processo di notifica:</h3>
<ol>
<li>Pubblicazione della nuova versione sul sito</li>
<li>Aggiornamento data "Ultimo aggiornamento"</li>
<li>Email notifica per modifiche sostanziali</li>
<li>Periodo di preavviso di 30 giorni quando possibile</li>
<li>Richiesta nuovo consenso se necessario</li>
</ol>
</div>

<p>Ti consigliamo di rivedere periodicamente questa Informativa. L\'uso continuato del servizio dopo le modifiche costituisce accettazione.</p>
</section>

<section id="contatti">
<h2>13. Contatti e Data Protection Officer</h2>

<div class="highlight-box">
<h3>Per questioni privacy contatta:</h3>

<h4>Titolare del Trattamento</h4>
<p><strong>LM Tecnologie S.r.l.</strong><br>
Via Roma 1, 00100 Roma<br>
Email: privacy@richiesta-assistenza.it<br>
PEC: lmtecnologie@pec.it<br>
Tel: +39 06 12345678</p>

<h4>Data Protection Officer (DPO)</h4>
<p>Nome: [Nome DPO]<br>
Email: dpo@richiesta-assistenza.it<br>
PEC: dpo.lmtecnologie@pec.it</p>

<h4>Garante per la Protezione dei Dati Personali</h4>
<p>Piazza Venezia 11, 00187 Roma<br>
Email: protocollo@gpdp.it<br>
PEC: protocollo@pec.gpdp.it<br>
Centralino: +39 06 696771<br>
Web: <a href="https://www.garanteprivacy.it" target="_blank">www.garanteprivacy.it</a></p>
</div>

<h3>Tempi di risposta</h3>
<ul>
<li><strong>Richieste informazioni:</strong> 5 giorni lavorativi</li>
<li><strong>Esercizio diritti:</strong> 30 giorni (estendibili a 90)</li>
<li><strong>Reclami:</strong> 15 giorni lavorativi</li>
<li><strong>Data breach:</strong> Immediata valutazione</li>
</ul>
</section>

<div class="document-footer" style="margin-top: 60px; padding-top: 30px; border-top: 2px solid #e0e0e0;">
<p style="text-align: center; color: #666;">
<strong>Versione:</strong> 1.0.0<br>
<strong>Data di entrata in vigore:</strong> 1 Gennaio 2025<br>
<strong>Ultimo aggiornamento:</strong> Gennaio 2025<br>
<br>
© 2025 LM Tecnologie S.r.l. - Tutti i diritti riservati
</p>
</div>
</div>',
    'Privacy Policy - Versione testuale semplificata per accessibilità',
    'Informativa completa sul trattamento dei dati personali conforme al GDPR 2025',
    '2025-01-01',
    'PUBLISHED',
    'it',
    true,
    NOW(),
    NOW()
);

-- CONTINUA NEL FILE SUCCESSIVO PER TERMINI E COOKIE POLICY
-- (Il contenuto è troppo lungo per un singolo file)

-- ============================================
-- VERIFICA INSERIMENTO
-- ============================================
SELECT 
    ld.type,
    ld."displayName",
    ld."isActive",
    ldv.version,
    ldv.status,
    LENGTH(ldv.content) as content_length
FROM "LegalDocument" ld
LEFT JOIN "LegalDocumentVersion" ldv ON ldv."documentId" = ld.id
ORDER BY ld."sortOrder";
