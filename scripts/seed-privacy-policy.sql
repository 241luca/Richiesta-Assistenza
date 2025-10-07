-- ============================================
-- PRIVACY POLICY - Documento completo per Richiesta Assistenza
-- Conforme a GDPR (Regolamento UE 2016/679) e Codice Privacy italiano
-- Data: Gennaio 2025
-- ============================================

-- Inserimento documento Privacy Policy
INSERT INTO "LegalDocument" (
  id,
  type,
  "internalName",
  "displayName",
  description,
  "isRequired",
  "isActive",
  "requiresAcceptance",
  "sortOrder",
  "createdAt",
  "updatedAt"
) VALUES (
  'privacy-policy-2025',
  'PRIVACY_POLICY',
  'privacy-policy-2025',
  'Informativa sulla Privacy e Protezione dei Dati',
  'Informativa completa sul trattamento dei dati personali ai sensi del GDPR e della normativa italiana',
  true,
  true,
  true,
  1,
  NOW(),
  NOW()
);

-- Inserimento versione Privacy Policy
INSERT INTO "LegalDocumentVersion" (
  id,
  "documentId",
  version,
  title,
  content,
  "contentPlain",
  summary,
  "versionNotes",
  "effectiveDate",
  status,
  language,
  "createdAt",
  "updatedAt"
) VALUES (
  'privacy-policy-v1-2025',
  'privacy-policy-2025',
  '1.0.0',
  'Informativa sulla Privacy e Protezione dei Dati Personali',
  E'
<div class="legal-document privacy-policy">
  <h1>Informativa sulla Privacy e Protezione dei Dati Personali</h1>
  <p class="last-updated">Ultimo aggiornamento: Gennaio 2025 • Versione 1.0.0</p>

  <div class="table-of-contents">
    <h2>Indice</h2>
    <ol>
      <li><a href="#intro">Introduzione e Titolare del Trattamento</a></li>
      <li><a href="#dati-raccolti">Quali Dati Raccogliamo</a></li>
      <li><a href="#finalita">Finalità e Base Giuridica del Trattamento</a></li>
      <li><a href="#modalita">Modalità di Trattamento</a></li>
      <li><a href="#destinatari">Destinatari dei Dati</a></li>
      <li><a href="#trasferimenti">Trasferimenti Internazionali</a></li>
      <li><a href="#conservazione">Periodo di Conservazione</a></li>
      <li><a href="#diritti">I Tuoi Diritti</a></li>
      <li><a href="#sicurezza">Misure di Sicurezza</a></li>
      <li><a href="#minori">Protezione dei Minori</a></li>
      <li><a href="#modifiche">Modifiche all''Informativa</a></li>
      <li><a href="#contatti">Contatti e DPO</a></li>
    </ol>
  </div>

  <section id="intro">
    <h2>1. Introduzione e Titolare del Trattamento</h2>
    <p>
      La presente Informativa sulla Privacy (<strong>"Informativa"</strong>) descrive come <strong>Richiesta Assistenza</strong> 
      ("noi", "nostro/a/i/e" o la "Società") raccoglie, utilizza, condivide e protegge i dati personali degli utenti 
      (<strong>"tu"</strong>, <strong>"tuo/a/i/e"</strong> o <strong>"Utente"</strong>) che utilizzano la nostra piattaforma 
      di gestione richieste di assistenza tecnica (<strong>"Servizio"</strong>).
    </p>
    
    <div class="highlight-box">
      <h3>Titolare del Trattamento</h3>
      <p><strong>LM Tecnologie S.r.l.</strong><br>
      Via [Indirizzo Completo]<br>
      P.IVA: [Numero P.IVA]<br>
      Email: privacy@richiesta-assistenza.it<br>
      PEC: lmtecnologie@pec.it</p>
    </div>

    <p>
      Ci impegniamo a proteggere la tua privacy e a trattare i tuoi dati personali in conformità con:
    </p>
    <ul>
      <li>Il Regolamento Generale sulla Protezione dei Dati (GDPR) - Regolamento UE 2016/679</li>
      <li>Il Codice in materia di protezione dei dati personali (D.Lgs. 196/2003 come modificato dal D.Lgs. 101/2018)</li>
      <li>Le linee guida del Garante per la protezione dei dati personali</li>
      <li>La Direttiva ePrivacy (2002/58/CE) e relative implementazioni nazionali</li>
    </ul>
  </section>

  <section id="dati-raccolti">
    <h2>2. Quali Dati Raccogliamo</h2>
    
    <h3>2.1 Dati forniti direttamente dall''utente</h3>
    
    <h4>a) Dati di registrazione e profilo:</h4>
    <ul>
      <li><strong>Dati anagrafici:</strong> nome, cognome, data di nascita</li>
      <li><strong>Dati di contatto:</strong> email, numero di telefono, indirizzo di residenza/domicilio</li>
      <li><strong>Dati professionali</strong> (per professionisti): partita IVA, codice fiscale, qualifiche, certificazioni, documenti di identità</li>
      <li><strong>Credenziali di accesso:</strong> username, password (criptata con bcrypt)</li>
      <li><strong>Preferenze:</strong> lingua, notifiche, impostazioni del profilo</li>
    </ul>

    <h4>b) Dati relativi alle richieste di assistenza:</h4>
    <ul>
      <li>Descrizione del problema tecnico</li>
      <li>Indirizzo dell''intervento e coordinate geografiche</li>
      <li>Fotografie e documenti allegati</li>
      <li>Comunicazioni tramite chat interna</li>
      <li>Valutazioni e recensioni del servizio</li>
    </ul>

    <h4>c) Dati di pagamento:</h4>
    <ul>
      <li>Dati della carta di credito/debito (gestiti tramite Stripe - non conservati sui nostri server)</li>
      <li>IBAN per bonifici</li>
      <li>Storico transazioni e fatture</li>
    </ul>

    <h3>2.2 Dati raccolti automaticamente</h3>
    
    <h4>a) Dati di navigazione e dispositivo:</h4>
    <ul>
      <li><strong>Informazioni del dispositivo:</strong> tipo di dispositivo, sistema operativo, browser, risoluzione schermo</li>
      <li><strong>Dati di log:</strong> indirizzo IP, data e ora di accesso, pagine visitate, tempo di permanenza</li>
      <li><strong>Cookie e tecnologie simili:</strong> come descritto nella nostra <a href="/legal/cookie-policy">Cookie Policy</a></li>
      <li><strong>Dati di geolocalizzazione:</strong> posizione approssimativa basata su IP, posizione precisa (solo con consenso)</li>
    </ul>

    <h4>b) Dati di utilizzo del servizio:</h4>
    <ul>
      <li>Interazioni con l''interfaccia (click, scroll, tap)</li>
      <li>Funzionalità utilizzate e frequenza d''uso</li>
      <li>Performance del sistema e errori</li>
      <li>Metriche di engagement</li>
    </ul>

    <h3>2.3 Dati da terze parti</h3>
    <ul>
      <li><strong>Google Maps:</strong> dati di geolocalizzazione e navigazione</li>
      <li><strong>OpenAI:</strong> interazioni con l''assistente AI (anonimizzate)</li>
      <li><strong>Stripe:</strong> conferme di pagamento e stato transazioni</li>
      <li><strong>WhatsApp Business API:</strong> messaggi e stato consegna (se attivato)</li>
    </ul>

    <div class="warning-box">
      <p><strong>⚠️ Categorie particolari di dati:</strong> Non raccogliamo intenzionalmente dati sensibili 
      (origine razziale/etnica, opinioni politiche, convinzioni religiose, dati genetici/biometrici, 
      dati sulla salute, vita/orientamento sessuale). Se tali dati vengono forniti involontariamente, 
      verranno immediatamente eliminati.</p>
    </div>
  </section>

  <section id="finalita">
    <h2>3. Finalità e Base Giuridica del Trattamento</h2>
    
    <table class="legal-table">
      <thead>
        <tr>
          <th>Finalità</th>
          <th>Base Giuridica</th>
          <th>Periodo di Conservazione</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Gestione dell''account e autenticazione</strong><br>
          Creazione e gestione del tuo account, autenticazione sicura con 2FA</td>
          <td>Esecuzione del contratto (Art. 6.1.b GDPR)</td>
          <td>Durata del rapporto + 10 anni</td>
        </tr>
        <tr>
          <td><strong>Fornitura del servizio</strong><br>
          Gestione richieste di assistenza, matching con professionisti, comunicazioni di servizio</td>
          <td>Esecuzione del contratto (Art. 6.1.b GDPR)</td>
          <td>Durata del rapporto + 10 anni per obblighi fiscali</td>
        </tr>
        <tr>
          <td><strong>Pagamenti e fatturazione</strong><br>
          Processamento pagamenti, emissione fatture, gestione contabile</td>
          <td>Esecuzione del contratto e obbligo legale (Art. 6.1.b e 6.1.c GDPR)</td>
          <td>10 anni dalla transazione</td>
        </tr>
        <tr>
          <td><strong>Comunicazioni di marketing</strong><br>
          Newsletter, offerte promozionali, aggiornamenti sui servizi</td>
          <td>Consenso (Art. 6.1.a GDPR) o legittimo interesse per clienti esistenti</td>
          <td>Fino a revoca del consenso o 24 mesi di inattività</td>
        </tr>
        <tr>
          <td><strong>Sicurezza e prevenzione frodi</strong><br>
          Monitoraggio accessi, prevenzione attività fraudolente, audit log</td>
          <td>Legittimo interesse (Art. 6.1.f GDPR)</td>
          <td>90 giorni per log di sicurezza, 3 anni per audit critici</td>
        </tr>
        <tr>
          <td><strong>Assistenza clienti</strong><br>
          Supporto tecnico, gestione reclami, miglioramento servizio</td>
          <td>Esecuzione del contratto o legittimo interesse (Art. 6.1.b o 6.1.f GDPR)</td>
          <td>3 anni dalla risoluzione del caso</td>
        </tr>
        <tr>
          <td><strong>Analisi e miglioramento</strong><br>
          Statistiche aggregate, analisi performance, sviluppo nuove funzionalità</td>
          <td>Legittimo interesse (Art. 6.1.f GDPR)</td>
          <td>Dati aggregati: indefinito<br>Dati personali: 12 mesi</td>
        </tr>
        <tr>
          <td><strong>Conformità legale</strong><br>
          Adempimenti fiscali, risposte ad autorità, difesa in giudizio</td>
          <td>Obbligo legale (Art. 6.1.c GDPR)</td>
          <td>Secondo requisiti di legge applicabili</td>
        </tr>
      </tbody>
    </table>
  </section>

  <section id="modalita">
    <h2>4. Modalità di Trattamento</h2>
    
    <p>Il trattamento dei dati personali avviene mediante:</p>
    
    <h3>4.1 Strumenti utilizzati</h3>
    <ul>
      <li><strong>Sistemi informatici:</strong> Server sicuri con PostgreSQL, Redis per caching</li>
      <li><strong>Infrastruttura cloud:</strong> Hosting su data center EU con certificazione ISO 27001</li>
      <li><strong>Crittografia:</strong> TLS 1.3 per trasmissioni, bcrypt per password, AES-256 per dati sensibili</li>
      <li><strong>Backup:</strong> Backup automatici criptati ogni 6 ore con retention di 30 giorni</li>
    </ul>

    <h3>4.2 Misure organizzative</h3>
    <ul>
      <li>Accesso limitato ai dati su base "need-to-know"</li>
      <li>Formazione periodica del personale sulla protezione dati</li>
      <li>Accordi di riservatezza con tutti i dipendenti e collaboratori</li>
      <li>Procedure di Data Breach Response Plan</li>
      <li>Valutazioni d''impatto sulla protezione dei dati (DPIA) per nuovi trattamenti</li>
    </ul>

    <h3>4.3 Profilazione e decisioni automatizzate</h3>
    <p>
      Utilizziamo sistemi di intelligenza artificiale per:
    </p>
    <ul>
      <li><strong>Matching automatico:</strong> Abbinamento richieste-professionisti basato su competenze e disponibilità</li>
      <li><strong>Categorizzazione:</strong> Classificazione automatica delle richieste di assistenza</li>
      <li><strong>Suggerimenti personalizzati:</strong> Raccomandazioni basate su comportamenti precedenti</li>
    </ul>
    <p>
      <strong>Hai sempre il diritto di:</strong> richiedere intervento umano, esprimere la tua opinione, 
      contestare la decisione automatizzata contattandoci a privacy@richiesta-assistenza.it
    </p>
  </section>

  <section id="destinatari">
    <h2>5. Destinatari dei Dati</h2>
    
    <p>I tuoi dati personali possono essere condivisi con:</p>
    
    <h3>5.1 Categorie di destinatari interni</h3>
    <ul>
      <li><strong>Personale autorizzato:</strong> Dipendenti del servizio clienti, team tecnico, amministrazione</li>
      <li><strong>Professionisti della piattaforma:</strong> Solo i dati necessari per l''erogazione del servizio richiesto</li>
    </ul>

    <h3>5.2 Fornitori di servizi (Responsabili del trattamento)</h3>
    <table class="service-providers-table">
      <thead>
        <tr>
          <th>Fornitore</th>
          <th>Servizio</th>
          <th>Sede</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Google LLC</td>
          <td>Maps API, Geocoding, Cloud Services</td>
          <td>USA (Privacy Shield + SCC)</td>
        </tr>
        <tr>
          <td>Stripe, Inc.</td>
          <td>Processamento pagamenti</td>
          <td>USA (Privacy Shield + SCC)</td>
        </tr>
        <tr>
          <td>OpenAI, L.L.C.</td>
          <td>Assistenza AI, elaborazione linguaggio naturale</td>
          <td>USA (SCC + misure supplementari)</td>
        </tr>
        <tr>
          <td>Brevo (SendinBlue)</td>
          <td>Invio email transazionali e marketing</td>
          <td>Francia (EU)</td>
        </tr>
        <tr>
          <td>Meta Platforms</td>
          <td>WhatsApp Business API</td>
          <td>Irlanda (EU)</td>
        </tr>
        <tr>
          <td>Amazon Web Services</td>
          <td>Hosting e backup (se applicabile)</td>
          <td>Irlanda (EU Region)</td>
        </tr>
      </tbody>
    </table>

    <h3>5.3 Altri destinatari</h3>
    <ul>
      <li><strong>Autorità competenti:</strong> Su richiesta legittima (forze dell''ordine, autorità fiscali, Garante Privacy)</li>
      <li><strong>Consulenti professionali:</strong> Commercialisti, avvocati, revisori (vincolati da segreto professionale)</li>
      <li><strong>Partner commerciali:</strong> Solo con tuo esplicito consenso</li>
      <li><strong>Acquirenti potenziali:</strong> In caso di fusione/acquisizione (previa due diligence e accordi di riservatezza)</li>
    </ul>

    <div class="info-box">
      <p><strong>ℹ️ Nota:</strong> Non vendiamo, affittiamo o condividiamo mai i tuoi dati personali con 
      terze parti per loro scopi di marketing senza il tuo esplicito consenso.</p>
    </div>
  </section>

  <section id="trasferimenti">
    <h2>6. Trasferimenti Internazionali</h2>
    
    <p>
      Alcuni dei nostri fornitori di servizi hanno sede negli Stati Uniti o in altri paesi extra-UE. 
      Garantiamo che tali trasferimenti avvengano nel rispetto del GDPR attraverso:
    </p>
    
    <ul>
      <li><strong>Clausole Contrattuali Standard (SCC):</strong> Approvate dalla Commissione Europea (2021/914/EU)</li>
      <li><strong>Valutazioni di adeguatezza:</strong> Per paesi riconosciuti dalla Commissione EU</li>
      <li><strong>Misure supplementari:</strong> Crittografia end-to-end, pseudonimizzazione, controlli di accesso rafforzati</li>
      <li><strong>Transfer Impact Assessment (TIA):</strong> Valutazione documentata per ogni trasferimento</li>
    </ul>

    <p>
      Per informazioni specifiche sui trasferimenti e le garanzie applicate, puoi contattarci a: 
      privacy@richiesta-assistenza.it
    </p>
  </section>

  <section id="conservazione">
    <h2>7. Periodo di Conservazione</h2>
    
    <p>Conserviamo i tuoi dati personali solo per il tempo necessario alle finalità per cui sono stati raccolti:</p>
    
    <table class="retention-table">
      <thead>
        <tr>
          <th>Tipo di Dato</th>
          <th>Periodo di Conservazione</th>
          <th>Motivazione</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Dati account attivo</td>
          <td>Durata del rapporto</td>
          <td>Necessari per fornitura servizio</td>
        </tr>
        <tr>
          <td>Dati account cancellato</td>
          <td>30 giorni (soft delete) poi eliminazione definitiva</td>
          <td>Periodo di ripensamento</td>
        </tr>
        <tr>
          <td>Documenti fiscali</td>
          <td>10 anni</td>
          <td>Obbligo legale (art. 2220 Codice Civile)</td>
        </tr>
        <tr>
          <td>Log di sicurezza</td>
          <td>90 giorni</td>
          <td>Analisi incidenti e sicurezza</td>
        </tr>
        <tr>
          <td>Audit log critici</td>
          <td>3 anni</td>
          <td>Compliance e forensics</td>
        </tr>
        <tr>
          <td>Chat e messaggi</td>
          <td>2 anni dall''ultima attività</td>
          <td>Supporto e contestazioni</td>
        </tr>
        <tr>
          <td>Cookie tecnici</td>
          <td>Sessione o max 12 mesi</td>
          <td>Funzionamento servizio</td>
        </tr>
        <tr>
          <td>Cookie analytics</td>
          <td>14 mesi</td>
          <td>Analisi statistica</td>
        </tr>
        <tr>
          <td>Backup</td>
          <td>30 giorni rolling</td>
          <td>Disaster recovery</td>
        </tr>
      </tbody>
    </table>

    <p>
      Al termine del periodo di conservazione, i dati vengono eliminati in modo sicuro o anonimizzati 
      irreversibilmente per uso statistico.
    </p>
  </section>

  <section id="diritti">
    <h2>8. I Tuoi Diritti</h2>
    
    <p>
      In conformità al GDPR, hai i seguenti diritti riguardo ai tuoi dati personali:
    </p>
    
    <div class="rights-grid">
      <div class="right-card">
        <h3>📋 Diritto di Accesso (Art. 15)</h3>
        <p>Ottenere conferma del trattamento e copia dei tuoi dati personali</p>
      </div>
      
      <div class="right-card">
        <h3>✏️ Diritto di Rettifica (Art. 16)</h3>
        <p>Correggere dati inesatti o completare dati incompleti</p>
      </div>
      
      <div class="right-card">
        <h3>🗑️ Diritto alla Cancellazione (Art. 17)</h3>
        <p>"Diritto all''oblio" - richiedere l''eliminazione dei tuoi dati</p>
      </div>
      
      <div class="right-card">
        <h3>⏸️ Diritto di Limitazione (Art. 18)</h3>
        <p>Limitare il trattamento in determinate circostanze</p>
      </div>
      
      <div class="right-card">
        <h3>📦 Diritto alla Portabilità (Art. 20)</h3>
        <p>Ricevere i tuoi dati in formato strutturato e trasferirli</p>
      </div>
      
      <div class="right-card">
        <h3>🚫 Diritto di Opposizione (Art. 21)</h3>
        <p>Opporti al trattamento per marketing o legittimo interesse</p>
      </div>
      
      <div class="right-card">
        <h3>🤖 Diritto su Decisioni Automatizzate (Art. 22)</h3>
        <p>Non essere sottoposto a decisioni basate solo su trattamento automatizzato</p>
      </div>
      
      <div class="right-card">
        <h3>↩️ Diritto di Revoca del Consenso (Art. 7)</h3>
        <p>Revocare il consenso in qualsiasi momento (senza pregiudicare la liceità del trattamento precedente)</p>
      </div>
    </div>

    <h3>Come esercitare i tuoi diritti</h3>
    <p>
      Puoi esercitare i tuoi diritti in qualsiasi momento:
    </p>
    <ul>
      <li><strong>Via email:</strong> privacy@richiesta-assistenza.it</li>
      <li><strong>Dal tuo account:</strong> Sezione "Privacy e Dati Personali"</li>
      <li><strong>Via PEC:</strong> lmtecnologie@pec.it</li>
      <li><strong>Per posta:</strong> All''indirizzo del Titolare indicato sopra</li>
    </ul>
    
    <p>
      Risponderemo alle tue richieste entro <strong>30 giorni</strong> (prorogabili di ulteriori 60 giorni 
      in casi complessi, con notifica motivata).
    </p>

    <div class="warning-box">
      <p><strong>Diritto di Reclamo:</strong> Hai il diritto di presentare reclamo al Garante per la 
      Protezione dei Dati Personali (www.garanteprivacy.it) se ritieni che il trattamento violi il GDPR.</p>
    </div>
  </section>

  <section id="sicurezza">
    <h2>9. Misure di Sicurezza</h2>
    
    <p>
      Implementiamo misure tecniche e organizzative all''avanguardia per proteggere i tuoi dati:
    </p>
    
    <h3>9.1 Misure Tecniche</h3>
    <ul>
      <li><strong>Crittografia:</strong>
        <ul>
          <li>TLS 1.3 per tutte le comunicazioni in transito</li>
          <li>AES-256 per dati a riposo sensibili</li>
          <li>Bcrypt con salt rounds ≥10 per password</li>
          <li>End-to-end encryption per messaggi sensibili</li>
        </ul>
      </li>
      <li><strong>Controlli di Accesso:</strong>
        <ul>
          <li>Autenticazione multi-fattore (2FA) con TOTP</li>
          <li>RBAC (Role-Based Access Control) granulare</li>
          <li>Session management sicuro con JWT</li>
          <li>Account lockout dopo tentativi falliti</li>
        </ul>
      </li>
      <li><strong>Monitoring e Detection:</strong>
        <ul>
          <li>IDS/IPS per rilevamento intrusioni</li>
          <li>Audit log completo di tutte le operazioni</li>
          <li>Alerting real-time per attività sospette</li>
          <li>Health check automatici ogni 5 minuti</li>
        </ul>
      </li>
      <li><strong>Infrastructure Security:</strong>
        <ul>
          <li>Web Application Firewall (WAF)</li>
          <li>DDoS protection</li>
          <li>Rate limiting per endpoint</li>
          <li>Security headers (CSP, HSTS, X-Frame-Options)</li>
        </ul>
      </li>
    </ul>

    <h3>9.2 Misure Organizzative</h3>
    <ul>
      <li>Security by Design e by Default</li>
      <li>Principio del privilegio minimo</li>
      <li>Formazione periodica del personale (annuale)</li>
      <li>Penetration testing trimestrale</li>
      <li>Vulnerability assessment mensile</li>
      <li>Incident Response Plan testato</li>
      <li>Business Continuity Plan</li>
    </ul>

    <h3>9.3 Certificazioni e Compliance</h3>
    <ul>
      <li>ISO 27001 (in corso di certificazione)</li>
      <li>OWASP Top 10 compliance</li>
      <li>PCI DSS per pagamenti (tramite Stripe)</li>
      <li>Regular security audit da terze parti</li>
    </ul>
  </section>

  <section id="minori">
    <h2>10. Protezione dei Minori</h2>
    
    <p>
      Il nostro Servizio non è destinato a persone di età inferiore a 18 anni. Non raccogliamo 
      consapevolmente dati personali da minori di 18 anni.
    </p>
    
    <p>
      Se sei un genitore o tutore e vieni a conoscenza che tuo figlio ci ha fornito dati personali, 
      ti preghiamo di contattarci immediatamente. Se veniamo a conoscenza di aver raccolto dati personali 
      da minori senza verifica del consenso genitoriale, adottiamo misure per rimuovere tali informazioni 
      dai nostri server.
    </p>
  </section>

  <section id="modifiche">
    <h2>11. Modifiche all''Informativa</h2>
    
    <p>
      Ci riserviamo il diritto di aggiornare questa Informativa periodicamente per riflettere:
    </p>
    <ul>
      <li>Modifiche nelle nostre pratiche di trattamento dati</li>
      <li>Nuove funzionalità del servizio</li>
      <li>Cambiamenti normativi</li>
      <li>Feedback degli utenti</li>
    </ul>
    
    <p>
      In caso di modifiche sostanziali:
    </p>
    <ol>
      <li>Ti notificheremo via email almeno 30 giorni prima dell''entrata in vigore</li>
      <li>Evidenzieremo le modifiche nella dashboard del tuo account</li>
      <li>Richiederemo nuovo consenso dove necessario</li>
      <li>Manterremo un archivio delle versioni precedenti</li>
    </ol>
    
    <p>
      La data di "Ultimo aggiornamento" in cima a questa pagina indica quando l''Informativa è stata 
      rivista l''ultima volta. Ti invitiamo a rivedere periodicamente questa pagina.
    </p>
  </section>

  <section id="contatti">
    <h2>12. Contatti e Data Protection Officer</h2>
    
    <div class="contact-grid">
      <div class="contact-card">
        <h3>📧 Per questioni sulla privacy</h3>
        <p>
          <strong>Email:</strong> privacy@richiesta-assistenza.it<br>
          <strong>Response time:</strong> Entro 48 ore lavorative
        </p>
      </div>
      
      <div class="contact-card">
        <h3>👤 Data Protection Officer (DPO)</h3>
        <p>
          <strong>Nome:</strong> [Nome DPO]<br>
          <strong>Email:</strong> dpo@richiesta-assistenza.it<br>
          <strong>PEC:</strong> dpo.lmtecnologie@pec.it
        </p>
      </div>
      
      <div class="contact-card">
        <h3>📮 Indirizzo postale</h3>
        <p>
          LM Tecnologie S.r.l.<br>
          Att: Privacy Department<br>
          [Indirizzo completo]
        </p>
      </div>
      
      <div class="contact-card">
        <h3>🏛️ Autorità di Controllo</h3>
        <p>
          <strong>Garante per la Protezione dei Dati Personali</strong><br>
          Piazza Venezia n. 11 - 00187 Roma<br>
          www.garanteprivacy.it
        </p>
      </div>
    </div>
  </section>

  <div class="document-footer">
    <p>
      <strong>Versione:</strong> 1.0.0<br>
      <strong>Data di entrata in vigore:</strong> Gennaio 2025<br>
      <strong>Lingua:</strong> Italiano (disponibile anche in: English, Español, Français, Deutsch)
    </p>
    
    <p class="copyright">
      © 2025 LM Tecnologie S.r.l. - Tutti i diritti riservati.<br>
      Questo documento è protetto da copyright e non può essere riprodotto senza autorizzazione.
    </p>
  </div>
</div>

<style>
.legal-document {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  color: #333;
}

.table-of-contents {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin: 30px 0;
}

.highlight-box {
  background: #e3f2fd;
  border-left: 4px solid #2196F3;
  padding: 15px;
  margin: 20px 0;
}

.warning-box {
  background: #fff3e0;
  border-left: 4px solid #ff9800;
  padding: 15px;
  margin: 20px 0;
}

.info-box {
  background: #f3e5f5;
  border-left: 4px solid #9c27b0;
  padding: 15px;
  margin: 20px 0;
}

.legal-table, .service-providers-table, .retention-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.legal-table th, .service-providers-table th, .retention-table th {
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #ddd;
}

.legal-table td, .service-providers-table td, .retention-table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

.rights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.right-card {
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.3s;
}

.right-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.contact-card {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
}

.document-footer {
  margin-top: 60px;
  padding-top: 30px;
  border-top: 2px solid #e0e0e0;
  text-align: center;
  color: #666;
}

section {
  margin: 40px 0;
}

h1 {
  color: #1976d2;
  border-bottom: 3px solid #1976d2;
  padding-bottom: 10px;
}

h2 {
  color: #333;
  margin-top: 40px;
  margin-bottom: 20px;
}

h3 {
  color: #555;
  margin-top: 25px;
  margin-bottom: 15px;
}
</style>
',
  'Testo semplificato della privacy policy...',
  'Prima versione completa della Privacy Policy conforme GDPR',
  'Versione iniziale completa con tutte le sezioni richieste dal GDPR',
  '2025-01-18',
  'PUBLISHED',
  'it',
  NOW(),
  NOW()
);
