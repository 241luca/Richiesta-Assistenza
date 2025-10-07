#!/bin/bash

echo "📜 Aggiornamento Documenti Legali con Contenuti COMPLETI"
echo "========================================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Prima verifica che i documenti esistano
echo "1️⃣ Verifica documenti esistenti..."
DOC_COUNT=$(psql assistenza_db -t -c "SELECT COUNT(*) FROM \"LegalDocument\";" | xargs)

if [ "$DOC_COUNT" -eq "0" ]; then
    echo -e "${RED}❌ Nessun documento trovato! Prima esegui insert-legal-docs-corrected.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Trovati $DOC_COUNT documenti${NC}"
echo ""

# Aggiorna il contenuto delle versioni con HTML completo
echo "2️⃣ Aggiornamento contenuti HTML completi..."

# Privacy Policy - Contenuto COMPLETO (apostrofi raddoppiati)
echo "Aggiornamento Privacy Policy..."
psql assistenza_db << 'EOF'
UPDATE "LegalDocumentVersion"
SET content = '<div class="legal-document privacy-policy">
<h1>Informativa sulla Privacy e Protezione dei Dati Personali</h1>
<p class="last-updated"><strong>Ultimo aggiornamento:</strong> 20 Gennaio 2025 • <strong>Versione:</strong> 1.0.0</p>

<h2>1. Titolare del Trattamento</h2>
<p><strong>LM Tecnologie S.r.l.</strong><br>
Sede Legale: Via Roma 123, 00100 Roma<br>
P.IVA: 12345678901<br>
Email: privacy@richiesta-assistenza.it<br>
PEC: lmtecnologie@pec.it<br>
Telefono: +39 06 12345678</p>

<h2>2. Responsabile Protezione Dati (DPO)</h2>
<p>Email DPO: dpo@richiesta-assistenza.it</p>

<h2>3. Tipologie di Dati Raccolti</h2>

<h3>3.1 Dati forniti volontariamente</h3>
<ul>
<li><strong>Dati anagrafici:</strong> nome, cognome, data e luogo di nascita, codice fiscale</li>
<li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo di residenza/domicilio</li>
<li><strong>Dati professionali:</strong> partita IVA, qualifiche professionali, certificazioni, iscrizioni albi</li>
<li><strong>Dati di pagamento:</strong> coordinate bancarie, dati carte di credito (tramite Stripe)</li>
<li><strong>Dati relativi ai servizi:</strong> richieste di assistenza, preventivi, interventi effettuati</li>
<li><strong>Comunicazioni:</strong> messaggi chat, email, feedback e recensioni</li>
</ul>

<h3>3.2 Dati raccolti automaticamente</h3>
<ul>
<li><strong>Dati di navigazione:</strong> indirizzo IP, browser, sistema operativo, pagine visitate</li>
<li><strong>Cookie:</strong> cookie tecnici e analitici (vedi Cookie Policy)</li>
<li><strong>Dati di utilizzo:</strong> log di accesso, azioni sulla piattaforma, tempi di utilizzo</li>
<li><strong>Dati di geolocalizzazione:</strong> posizione per calcolo distanze (previo consenso)</li>
</ul>

<h2>4. Finalità del Trattamento e Base Giuridica</h2>
<table>
<tr>
<th>Finalità</th>
<th>Base Giuridica</th>
<th>Periodo Conservazione</th>
</tr>
<tr>
<td>Gestione account e fornitura servizi</td>
<td>Esecuzione contratto (Art. 6.1.b GDPR)</td>
<td>Durata del rapporto + 10 anni</td>
</tr>
<tr>
<td>Fatturazione e pagamenti</td>
<td>Obbligo legale (Art. 6.1.c GDPR)</td>
<td>10 anni (normativa fiscale)</td>
</tr>
<tr>
<td>Marketing diretto</td>
<td>Consenso (Art. 6.1.a GDPR) o Legittimo interesse (Art. 6.1.f GDPR)</td>
<td>24 mesi o revoca consenso</td>
</tr>
<tr>
<td>Sicurezza e prevenzione frodi</td>
<td>Legittimo interesse (Art. 6.1.f GDPR)</td>
<td>6 mesi</td>
</tr>
<tr>
<td>Assistenza clienti</td>
<td>Esecuzione contratto (Art. 6.1.b GDPR)</td>
<td>3 anni dalla risoluzione</td>
</tr>
</table>

<h2>5. Destinatari dei Dati</h2>
<h3>5.1 Categorie di destinatari</h3>
<ul>
<li><strong>Professionisti della piattaforma:</strong> solo dati necessari per erogazione servizio</li>
<li><strong>Fornitori di servizi:</strong> hosting, email, pagamenti, analytics (tutti con DPA firmato)</li>
<li><strong>Consulenti:</strong> commercialisti, avvocati, revisori (vincolati da segreto professionale)</li>
<li><strong>Autorità:</strong> su richiesta legittima o obbligo di legge</li>
</ul>

<h3>5.2 Fornitori principali</h3>
<ul>
<li><strong>Stripe Inc.:</strong> gestione pagamenti (Privacy Shield / SCC)</li>
<li><strong>Google LLC:</strong> Maps API, Analytics (SCC + misure supplementari)</li>
<li><strong>OpenAI:</strong> AI Assistant (DPA + SCC)</li>
<li><strong>Brevo:</strong> invio email transazionali (server EU)</li>
<li><strong>AWS/Vercel:</strong> hosting infrastruttura (server EU)</li>
</ul>

<h2>6. Trasferimenti Extra-UE</h2>
<p>Alcuni fornitori hanno sede negli USA. Garantiamo protezione adeguata tramite:</p>
<ul>
<li>Clausole Contrattuali Standard (SCC) della Commissione Europea</li>
<li>Misure supplementari tecniche (crittografia, pseudonimizzazione)</li>
<li>Valutazione rischio paese (TIA - Transfer Impact Assessment)</li>
</ul>

<h2>7. I Tuoi Diritti</h2>
<p>Ai sensi degli artt. 15-22 GDPR, hai diritto di:</p>
<ul>
<li><strong>Accesso (Art. 15):</strong> ottenere conferma e copia dei dati</li>
<li><strong>Rettifica (Art. 16):</strong> correggere dati inesatti</li>
<li><strong>Cancellazione (Art. 17):</strong> diritto all''oblio nei casi previsti</li>
<li><strong>Limitazione (Art. 18):</strong> limitare il trattamento</li>
<li><strong>Portabilità (Art. 20):</strong> ricevere dati in formato strutturato</li>
<li><strong>Opposizione (Art. 21):</strong> opporsi al trattamento</li>
<li><strong>Revoca consenso (Art. 7):</strong> revocare il consenso in qualsiasi momento</li>
<li><strong>Reclamo:</strong> proporre reclamo al Garante Privacy</li>
</ul>

<h2>8. Modalità di Esercizio dei Diritti</h2>
<p>Puoi esercitare i tuoi diritti inviando richiesta a:</p>
<ul>
<li>Email: privacy@richiesta-assistenza.it</li>
<li>PEC: lmtecnologie@pec.it</li>
<li>Modulo online: <a href="/privacy/rights">Esercizio diritti privacy</a></li>
</ul>
<p>Risponderemo entro 30 giorni, prorogabili di ulteriori 60 giorni in casi complessi.</p>

<h2>9. Misure di Sicurezza</h2>
<p>Implementiamo misure tecniche e organizzative appropriate:</p>
<ul>
<li>Crittografia dati in transito (TLS 1.3) e a riposo (AES-256)</li>
<li>Autenticazione forte e 2FA disponibile</li>
<li>Backup automatici e disaster recovery</li>
<li>Monitoraggio accessi e audit log</li>
<li>Formazione periodica del personale</li>
<li>Test di sicurezza e penetration test regolari</li>
</ul>

<h2>10. Cookie e Tecnologie Simili</h2>
<p>Utilizziamo cookie e tecnologie simili come descritto nella <a href="/legal/cookie-policy">Cookie Policy</a>.</p>

<h2>11. Minori</h2>
<p>Il servizio non è destinato a minori di 18 anni. Non raccogliamo consapevolmente dati di minori.</p>

<h2>12. Modifiche all''Informativa</h2>
<p>Potremmo aggiornare questa informativa. Modifiche sostanziali saranno notificate via email o tramite avviso sulla piattaforma.</p>

<h2>13. Contatti</h2>
<p><strong>LM Tecnologie S.r.l.</strong><br>
Email: privacy@richiesta-assistenza.it<br>
PEC: lmtecnologie@pec.it</p>

<p><strong>Garante per la Protezione dei Dati Personali</strong><br>
Piazza Venezia 11, 00187 Roma<br>
Email: garante@gpdp.it<br>
Web: www.garanteprivacy.it</p>
</div>',
"contentPlain" = 'Informativa sulla Privacy e Protezione dei Dati Personali completa. Titolare: LM Tecnologie S.r.l. Tipologie di dati: anagrafici, contatto, professionali, pagamento. Finalità: gestione servizi, fatturazione, marketing. Base giuridica: contratto, obbligo legale, consenso, legittimo interesse. Diritti: accesso, rettifica, cancellazione, limitazione, portabilità, opposizione. Contatti: privacy@richiesta-assistenza.it'
WHERE "documentId" = 'doc-privacy-2025';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Privacy Policy aggiornata${NC}"
else
    echo -e "${RED}❌ Errore aggiornamento Privacy Policy${NC}"
fi

# Terms of Service - Contenuto COMPLETO (apostrofi raddoppiati)
echo "Aggiornamento Terms of Service..."
psql assistenza_db << 'EOF'
UPDATE "LegalDocumentVersion"
SET content = '<div class="legal-document terms-service">
<h1>Termini e Condizioni di Servizio</h1>
<p class="last-updated"><strong>Ultimo aggiornamento:</strong> 20 Gennaio 2025 • <strong>Versione:</strong> 1.0.0</p>

<h2>1. Accettazione dei Termini</h2>
<p>Utilizzando la piattaforma Richiesta Assistenza ("Servizio"), accetti di essere vincolato da questi Termini e Condizioni. Se non accetti questi termini, non utilizzare il Servizio.</p>

<h2>2. Descrizione del Servizio</h2>
<p>Richiesta Assistenza è una piattaforma di intermediazione che mette in contatto clienti che necessitano di assistenza tecnica con professionisti qualificati.</p>

<h2>3. Registrazione Account</h2>
<h3>3.1 Requisiti</h3>
<ul>
<li>Età minima 18 anni</li>
<li>Informazioni accurate e veritiere</li>
<li>Email valida e verificata</li>
<li>Per professionisti: P.IVA e documentazione richiesta</li>
</ul>

<h2>4. Utilizzo del Servizio</h2>
<h3>4.1 Usi Consentiti</h3>
<ul>
<li>Richiedere/fornire servizi legittimi</li>
<li>Comunicazioni pertinenti</li>
<li>Transazioni autorizzate</li>
</ul>

<h3>4.2 Usi Vietati</h3>
<ul>
<li>Attività illegali o fraudolente</li>
<li>Violazione diritti di terzi</li>
<li>Spam o contenuti offensivi</li>
<li>Tentativi di hacking</li>
<li>Circumvenzione del sistema di pagamento</li>
</ul>

<h2>5. Pagamenti e Commissioni</h2>
<ul>
<li>Pagamenti gestiti tramite Stripe</li>
<li>Commissione piattaforma: 15% (standard) o 10% (premium)</li>
<li>IVA e tasse a carico dell''utente</li>
</ul>

<h2>6. Proprietà Intellettuale</h2>
<p>Tutti i contenuti della piattaforma sono proprietà di LM Tecnologie S.r.l. o dei rispettivi proprietari.</p>

<h2>7. Limitazione di Responsabilità</h2>
<p>LM Tecnologie non è responsabile per:</p>
<ul>
<li>Qualità dei servizi dei professionisti</li>
<li>Danni indiretti o consequenziali</li>
<li>Perdita di dati o profitti</li>
</ul>

<h2>8. Modifiche ai Termini</h2>
<p>Ci riserviamo il diritto di modificare questi termini. Le modifiche saranno notificate con 30 giorni di anticipo.</p>

<h2>9. Legge Applicabile</h2>
<p>Questi termini sono regolati dalla legge italiana. Foro competente: Roma.</p>

<h2>10. Contatti</h2>
<p>Per questioni legali: legal@richiesta-assistenza.it</p>
</div>',
"contentPlain" = 'Termini e Condizioni di Servizio. Piattaforma di intermediazione per servizi di assistenza tecnica. Requisiti: 18 anni, informazioni veritiere. Usi consentiti: servizi legittimi. Usi vietati: attività illegali, spam. Commissioni: 15% standard. Responsabilità limitata. Legge italiana, Foro di Roma.'
WHERE "documentId" = 'doc-terms-2025';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Terms of Service aggiornati${NC}"
else
    echo -e "${RED}❌ Errore aggiornamento Terms of Service${NC}"
fi

# Cookie Policy - Contenuto COMPLETO  
echo "Aggiornamento Cookie Policy..."
psql assistenza_db << 'EOF'
UPDATE "LegalDocumentVersion"
SET content = '<div class="legal-document cookie-policy">
<h1>Cookie Policy</h1>
<p class="last-updated"><strong>Ultimo aggiornamento:</strong> 20 Gennaio 2025 • <strong>Versione:</strong> 1.0.0</p>

<h2>1. Cosa sono i Cookie</h2>
<p>I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti un sito web.</p>

<h2>2. Cookie che Utilizziamo</h2>

<h3>2.1 Cookie Necessari</h3>
<ul>
<li>Autenticazione e sessione</li>
<li>Sicurezza (CSRF token)</li>
<li>Preferenze essenziali</li>
</ul>

<h3>2.2 Cookie Funzionali</h3>
<ul>
<li>Lingua e localizzazione</li>
<li>Preferenze interfaccia</li>
<li>Impostazioni utente</li>
</ul>

<h3>2.3 Cookie Analitici</h3>
<ul>
<li>Google Analytics (anonimizzato)</li>
<li>Statistiche di utilizzo</li>
<li>Performance del sito</li>
</ul>

<h3>2.4 Cookie di Marketing</h3>
<ul>
<li>Remarketing</li>
<li>Conversioni</li>
<li>Social media</li>
</ul>

<h2>3. Gestione dei Cookie</h2>
<p>Puoi gestire le preferenze cookie tramite:</p>
<ul>
<li>Il nostro pannello preferenze cookie</li>
<li>Le impostazioni del browser</li>
</ul>

<h2>4. Cookie di Terze Parti</h2>
<table>
<tr>
<th>Servizio</th>
<th>Finalità</th>
<th>Durata</th>
</tr>
<tr>
<td>Google Analytics</td>
<td>Analisi traffico</td>
<td>2 anni</td>
</tr>
<tr>
<td>Stripe</td>
<td>Pagamenti</td>
<td>Sessione</td>
</tr>
<tr>
<td>Google Maps</td>
<td>Mappe</td>
<td>6 mesi</td>
</tr>
</table>

<h2>5. Contatti</h2>
<p>Per domande sui cookie: privacy@richiesta-assistenza.it</p>
</div>',
"contentPlain" = 'Cookie Policy. Utilizziamo cookie necessari, funzionali, analitici e di marketing. Cookie necessari: autenticazione, sicurezza. Cookie analitici: Google Analytics. Puoi gestire le preferenze tramite pannello cookie o browser. Contatti: privacy@richiesta-assistenza.it'
WHERE "documentId" = 'doc-cookie-2025';
EOF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Cookie Policy aggiornata${NC}"
else
    echo -e "${RED}❌ Errore aggiornamento Cookie Policy${NC}"
fi

# Verifica finale
echo ""
echo "3️⃣ Verifica contenuti aggiornati..."
echo ""

# Mostra un'anteprima del contenuto aggiornato
echo "Preview Privacy Policy:"
psql assistenza_db -t -c "SELECT LEFT(content, 200) FROM \"LegalDocumentVersion\" WHERE \"documentId\" = 'doc-privacy-2025';" | head -3

echo ""
echo -e "${GREEN}✅ Aggiornamento completato!${NC}"
echo ""
echo "🔗 Verifica i documenti su:"
echo "   http://localhost:5193/legal/privacy-policy"
echo "   http://localhost:5193/legal/terms-service"
echo "   http://localhost:5193/legal/cookie-policy"
